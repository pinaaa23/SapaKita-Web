import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';
// TODO: ganti ke API BE saat endpoint tersedia
import { 
  USE_MOCK_SUPERADMIN, 
  getMockNapi, 
  addMockNapi, 
  updateMockNapi, 
  deleteMockNapi 
} from './mockStorage';

// Endpoint path disimpan dalam konstanta di atas file agar mudah diganti/disesuaikan
export const INMATES_ENDPOINT = '/api/inmates';
export const INMATE_DETAIL_ENDPOINT = (id) => `/api/inmates/${id}`;
export const INMATE_STATUS_ENDPOINT = (id) => `/api/inmates/${id}/status`;

// Konstanta kontrol dukungan parameter filter di backend (false = backend saat ini hanya mendukung search, page, limit)
export const BACKEND_SUPPORTS_INMATE_FILTERS = false;

/**
 * Mapper fleksibel: membaca data yang dikirim backend maupun mock FE
 */
export const mapInmateItem = (item) => {
  if (!item) return null;

  const rawIdentifier = item.identifier || item.wbpRegNumber || item.nip || item.id || '-';
  const rawName = item.name || '-';

  // Saldo panggilan
  let callBalance = null;
  if (typeof item.balance === 'number') {
    callBalance = item.balance;
  } else if (typeof item.callBalance === 'number') {
    callBalance = item.callBalance;
  } else if (item.balance !== undefined && item.balance !== null && item.balance !== '') {
    const parsed = parseFloat(item.balance);
    callBalance = isNaN(parsed) ? null : parsed;
  } else if (item.callBalance !== undefined && item.callBalance !== null && item.callBalance !== '') {
    const parsed = parseFloat(item.callBalance);
    callBalance = isNaN(parsed) ? null : parsed;
  }

  // Nama cabang jika dikirim
  const branchName = item.branch?.name || item.branchName || (typeof item.branch === 'string' ? item.branch : null);

  // Status & status akun
  const status = item.status || (item.isActive !== undefined ? (item.isActive ? 'Aktif' : 'Suspended') : null);
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
    isMock: Boolean(item.isMock),
    raw: item
  };
};

/**
 * Mengambil daftar narapidana
 * Di mode demo: membaca langsung dari in-memory dummyStore (tanpa request ke backend)
 * Di mode normal: request ke backend BE asli
 */
export const getInmates = async ({ search = '', page = 1, limit = 20, branchId = '', status = '' } = {}) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const allInmates = dummyStore.getInmates({ branchId, search, status, limit: null });
    const mapped = allInmates.map(mapInmateItem).filter(Boolean);
    const numLimit = Number(limit) || 20;
    const numPage = Number(page) || 1;
    const startIdx = (numPage - 1) * numLimit;
    const paginated = mapped.slice(startIdx, startIdx + numLimit);

    return {
      items: paginated,
      total: mapped.length,
      page: numPage,
      limit: numLimit,
      totalPages: Math.max(1, Math.ceil(mapped.length / numLimit)),
    };
  }

  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  // Hanya kirim ke BE jika didukung backend
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

    const items = rawList.map(mapInmateItem).filter(Boolean);

    const total = typeof res?.pagination?.total === 'number'
      ? res.pagination.total
      : typeof res?.total === 'number'
        ? res.total
        : typeof res?.meta?.total === 'number'
          ? res.meta.total
          : items.length;

    const totalPages = typeof res?.pagination?.totalPages === 'number'
      ? res.pagination.totalPages
      : typeof res?.totalPages === 'number'
        ? res.totalPages
        : typeof res?.meta?.totalPages === 'number'
          ? res.meta.totalPages
          : Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    };
  } catch (err) {
    if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
      logout();
      throw err;
    }
    console.error('[InmateService] Gagal memuat data narapidana dari BE:', err?.message || err);
    throw err;
  }
};

/**
 * Mengambil detail satu narapidana berdasarkan ID atau Identifier/NIP
 */
export const getInmateById = async (idOrIdentifier) => {
  if (!idOrIdentifier) return null;

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const found = dummyStore.getInmateById(idOrIdentifier);
    return found ? mapInmateItem(found) : null;
  }

  const res = await getInmates({ search: idOrIdentifier });
  const clean = String(idOrIdentifier).trim();
  return res.items?.find(i => 
    String(i.identifier || '').trim() === clean || 
    String(i.wbpRegNumber || '').trim() === clean ||
    String(i.id || '').trim() === clean
  ) || null;
};

/**
 * Mendaftarkan narapidana baru
 */
export const createInmate = async ({ identifier, name, initialPin, branchId, branchName }) => {
  if (!identifier || !name) {
    throw new Error('NIP dan Nama Narapidana wajib diisi');
  }

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const newNapi = dummyStore.addInmate({
      identifier: identifier.trim(),
      wbpRegNumber: identifier.trim(),
      name: name.trim(),
      initialPin: (initialPin || '1234').trim(),
      branchId: branchId || 'b1',
      branchName: branchName || 'Lapas Kelas I Cipinang',
      callBalance: 0,
      status: 'Aktif',
      commStatus: 'Aktif',
      isActive: true,
    });
    return { success: true, data: mapInmateItem(newNapi) };
  }

  // Fallback ke mock storage jika diaktifkan manual
  if (USE_MOCK_SUPERADMIN) {
    const newNapi = addMockNapi({
      identifier: identifier.trim(),
      wbpRegNumber: identifier.trim(),
      name: name.trim(),
      initialPin: (initialPin || '1234').trim(),
      branchId: branchId || '',
      branchName: branchName || 'Lapas Pusat',
      callBalance: 0,
      status: 'Aktif',
      commStatus: 'Aktif',
      isActive: true,
    });
    return { success: true, data: newNapi };
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
 * Memperbarui data narapidana
 */
export const updateInmate = async (id, { name, identifier, initialPin, ...otherData }) => {
  if (!id) throw new Error('ID Narapidana diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const updated = dummyStore.updateInmate(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(identifier ? { identifier: identifier.trim(), wbpRegNumber: identifier.trim() } : {}),
      ...(initialPin ? { initialPin: initialPin.trim() } : {}),
      ...otherData,
    });
    return { success: true, data: updated ? mapInmateItem(updated) : null };
  }

  // Fallback ke mock storage jika diaktifkan manual
  if (USE_MOCK_SUPERADMIN) {
    const updated = updateMockNapi(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(identifier ? { identifier: identifier.trim(), wbpRegNumber: identifier.trim() } : {}),
      ...(initialPin ? { initialPin: initialPin.trim() } : {}),
      ...otherData,
    });
    return { success: true, data: updated };
  }

  const payload = {
    name: name?.trim(),
    identifier: identifier?.trim(),
  };

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
 * Mengubah status aktif / nonaktif akun narapidana
 */
export const updateInmateStatus = async (id, isActive) => {
  if (!id) throw new Error('ID Narapidana diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const updated = dummyStore.updateInmateStatus(id, Boolean(isActive));
    return { success: true, data: updated ? mapInmateItem(updated) : null };
  }

  // Fallback ke mock storage jika diaktifkan manual
  if (USE_MOCK_SUPERADMIN) {
    const updated = updateMockNapi(id, {
      isActive: Boolean(isActive),
      status: isActive ? 'Aktif' : 'Suspended',
      commStatus: isActive ? 'Aktif' : 'Nonaktif',
    });
    return { success: true, data: updated };
  }

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
  getInmateById,
  createInmate,
  updateInmate,
  updateInmateStatus,
};
