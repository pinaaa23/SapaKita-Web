import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta di atas file agar mudah diganti/disesuaikan
export const INMATES_ENDPOINT = '/api/inmates';
export const INMATE_DETAIL_ENDPOINT = (id) => `/api/inmates/${id}`;
export const INMATE_STATUS_ENDPOINT = (id) => `/api/inmates/${id}/status`;

// Konstanta kontrol dukungan parameter filter di backend (false = backend saat ini hanya mendukung search, page, limit)
export const BACKEND_SUPPORTS_INMATE_FILTERS = false;

/**
 * Mapper murni: hanya membaca data yang benar-benar dikirim backend (tanpa menyuntikkan nilai dummy palsu)
 */
export const mapInmateItem = (item) => {
  if (!item) return null;

  const rawIdentifier = item.identifier || item.wbpRegNumber || item.nip || item.id || '-';
  const rawName = item.name || '-';

  // Saldo panggilan: gunakan jika dikirim backend (termasuk 0)
  let callBalance = null;
  if (typeof item.balance === 'number') {
    callBalance = item.balance;
  } else if (item.balance !== undefined && item.balance !== null && item.balance !== '') {
    const parsed = parseFloat(item.balance);
    callBalance = isNaN(parsed) ? null : parsed;
  }

  // Nama cabang jika dikirim
  const branchName = item.branch?.name || item.branchName || (typeof item.branch === 'string' ? item.branch : null);

  // Status & status akun (hanya jika ada di balasan backend)
  const status = item.status || null;
  const commStatus = item.commStatus || (item.isActive !== undefined ? (item.isActive ? 'Aktif' : 'Nonaktif') : null);

  return {
    id: item.id || item._id || rawIdentifier,
    identifier: rawIdentifier,
    wbpRegNumber: rawIdentifier,
    name: rawName,
    initialPin: item.initialPin || '',
    callBalance,
    blockRoom: item.blockRoom || null,
    entryDate: item.createdAt || item.entryDate || null,
    status,
    commStatus,
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : undefined,
    branchId: item.branchId || item.branch?.id || item.branch?._id || '',
    branchName,
    raw: item
  };
};

const STORAGE_KEY = 'pascall_inmates_v2';

export const defaultMockInmates = [
  {
    id: 'inm-1001',
    identifier: 'NAPI-1001',
    wbpRegNumber: 'NAPI-1001',
    name: 'Ahmad Pratama',
    initialPin: '1234',
    callBalance: 75000,
    blockRoom: 'Blok B - Kamar 04',
    entryDate: '2025-11-10T08:30:00.000Z',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    branchId: 'b1',
    branchName: 'Lapas Cipinang'
  },
  {
    id: 'inm-1002',
    identifier: 'NAPI-1002',
    wbpRegNumber: 'NAPI-1002',
    name: 'Budi Santoso',
    initialPin: '1234',
    callBalance: 45000,
    blockRoom: 'Blok A - Kamar 02',
    entryDate: '2025-12-01T10:15:00.000Z',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    branchId: 'b1',
    branchName: 'Lapas Cipinang'
  },
  {
    id: 'inm-1003',
    identifier: 'NAPI-1003',
    wbpRegNumber: 'NAPI-1003',
    name: 'Hendra Wijaya',
    initialPin: '1234',
    callBalance: 120000,
    blockRoom: 'Blok C - Kamar 12',
    entryDate: '2026-01-15T14:20:00.000Z',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    branchId: 'b1',
    branchName: 'Lapas Cipinang'
  },
  {
    id: 'inm-1004',
    identifier: 'NAPI-1004',
    wbpRegNumber: 'NAPI-1004',
    name: 'Rian Kurniawan',
    initialPin: '1234',
    callBalance: 0,
    blockRoom: 'Blok A - Kamar 08',
    entryDate: '2026-02-05T09:00:00.000Z',
    status: 'Aktif',
    commStatus: 'Nonaktif',
    isActive: false,
    branchId: 'b1',
    branchName: 'Lapas Cipinang'
  },
  {
    id: 'inm-1005',
    identifier: 'NAPI-1005',
    wbpRegNumber: 'NAPI-1005',
    name: 'Dedi Supriyadi',
    initialPin: '1234',
    callBalance: 30000,
    blockRoom: 'Blok B - Kamar 06',
    entryDate: '2026-02-20T11:45:00.000Z',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    branchId: 'b1',
    branchName: 'Lapas Cipinang'
  }
];

const getStoredInmates = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMockInmates));
      return defaultMockInmates;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultMockInmates;
  } catch {
    return defaultMockInmates;
  }
};

const saveStoredInmates = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving inmates storage:', err);
  }
};

/**
 * Mengambil daftar narapidana dengan dukungan parameter search, page, limit
 * Parameter branchId dan status hanya dikirim jika BACKEND_SUPPORTS_INMATE_FILTERS === true
 */
export const getInmates = async ({ search = '', page = 1, limit = 20, branchId = '', status = '' } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  // Hanya kirim jika didukung backend
  if (BACKEND_SUPPORTS_INMATE_FILTERS) {
    if (branchId && branchId !== 'All') params.append('branchId', branchId);
    if (status && status !== 'All') params.append('status', status);
  }

  const queryString = params.toString();
  const url = queryString ? `${INMATES_ENDPOINT}?${queryString}` : INMATES_ENDPOINT;

  try {
    const res = await apiFetch(url);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.inmates)
            ? res.inmates
            : [];

    if (rawList.length > 0) {
      const total = typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : typeof res?.total === 'number'
          ? res.total
          : typeof res?.meta?.total === 'number'
            ? res.meta.total
            : rawList.length;

      const totalPages = typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : typeof res?.totalPages === 'number'
          ? res.totalPages
          : typeof res?.meta?.totalPages === 'number'
            ? res.meta.totalPages
            : Math.max(1, Math.ceil(total / limit));

      return {
        items: rawList.map(mapInmateItem).filter(Boolean),
        total,
        page: Number(res?.pagination?.page || res?.page || page),
        limit: Number(res?.pagination?.limit || res?.limit || limit),
        totalPages,
      };
    }
  } catch (err) {
    console.log('[InmateService] Backend API not available, using stored mock data:', err?.message || err);
  }

  // Fallback to local stored inmates
  let list = getStoredInmates().map(mapInmateItem);

  if (status && status !== 'All') {
    list = list.filter((i) => i.status === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.identifier.toLowerCase().includes(q) ||
        i.wbpRegNumber.toLowerCase().includes(q)
    );
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    items: paginated,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
  };
};

/**
 * Mendaftarkan narapidana baru ke backend
 * Payload yang didukung backend: { identifier, name, initialPin }
 */
export const createInmate = async ({ identifier, name, initialPin, branchId }) => {
  if (!identifier || !name) {
    throw new Error('NIP dan Nama Narapidana wajib diisi');
  }

  const payload = {
    identifier: identifier.trim(),
    name: name.trim(),
    initialPin: (initialPin || '1234').trim(),
  };

  if (branchId) {
    payload.branchId = branchId;
  }

  try {
    const res = await apiFetch(INMATES_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[InmateService] Gagal membuat data narapidana:', error?.message || error);
    throw error;
  }
};

/**
 * Memperbarui data narapidana ke backend
 * Payload yang didukung backend: { name, identifier, initialPin (opsional) }
 */
export const updateInmate = async (id, { name, identifier, initialPin }) => {
  if (!id) throw new Error('ID Narapidana diperlukan');

  const payload = {
    name: name?.trim(),
    identifier: identifier?.trim(),
  };

  // initialPin opsional, hanya dikirim kalau diisi
  if (initialPin && initialPin.trim()) {
    payload.initialPin = initialPin.trim();
  }

  const endpoint = INMATE_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[InmateService] Gagal update data narapidana (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Mengubah status aktif / nonaktif akun narapidana di backend
 * Body: { isActive: boolean }
 */
export const updateInmateStatus = async (id, isActive) => {
  if (!id) throw new Error('ID Narapidana diperlukan');

  const endpoint = INMATE_STATUS_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: Boolean(isActive) }),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[InmateService] Gagal update status narapidana (${id}):`, error?.message || error);
    throw error;
  }
};

export default {
  INMATES_ENDPOINT,
  INMATE_DETAIL_ENDPOINT,
  INMATE_STATUS_ENDPOINT,
  mapInmateItem,
  getInmates,
  createInmate,
  updateInmate,
  updateInmateStatus,
};
