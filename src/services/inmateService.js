import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';
import { isSameBranch } from '../utils/branchHelper';
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

// Konstanta kontrol dukungan parameter filter di backend (true = backend mendukung search, status, branchId, page, limit)
export const BACKEND_SUPPORTS_INMATE_FILTERS = true;

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

  // Data keluarga
  let families = [];
  if (Array.isArray(item.families)) {
    families = item.families;
  } else if (Array.isArray(item.contacts)) {
    families = item.contacts.map((c, idx) => ({
      id: c.id || `fam-${idx + 1}`,
      name: c.name || c.contactName || '-',
      relationship: c.relationship || c.relation || 'Keluarga',
      phone: c.phone || '',
    }));
  }

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
    families,
    isMock: Boolean(item.isMock),
    raw: item
  };
};

/**
 * Mengambil daftar narapidana
 * Di mode demo: membaca langsung dari in-memory dummyStore (tanpa request ke backend)
 * Di mode normal: request ke backend BE asli
 */
export const getInmates = async ({ search = '', page = 1, limit = 20, branchId = '', branchName = '', status = '' } = {}) => {
  // Jika branchName/branchId kosong, sesuaikan dengan sesi login jika bukan Superadmin
  let effectiveBranchName = branchName;
  let effectiveBranchId = branchId;
  try {
    const { getAuthUser } = await import('./api');
    const authUser = getAuthUser();
    const rawRole = (authUser?.role || '').toUpperCase();
    const isSuperadmin = rawRole === 'SUPERADMIN' || rawRole === 'ADMIN_PUSAT';

    if (!isSuperadmin) {
      if (!effectiveBranchName) {
        effectiveBranchName = authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : '') || authUser?.uptName || '';
      }
      if (!effectiveBranchId) {
        effectiveBranchId = authUser?.branchId || authUser?.branch?.id || '';
      }
    }
  } catch {}

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    let allInmates = dummyStore.getInmates({ branchId: effectiveBranchId, search, status, limit: null });
    if (effectiveBranchName && effectiveBranchName !== 'All' && effectiveBranchName !== 'ALL' && effectiveBranchName.toLowerCase() !== 'upt anda') {
      const qBranch = effectiveBranchName.toLowerCase().replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, '').trim();
      allInmates = allInmates.filter(i => {
        const iBranch = (i.branchName || '').toLowerCase();
        return iBranch.includes(qBranch) || (effectiveBranchId && i.branchId === effectiveBranchId);
      });
    }
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

  // Fallback ke mock storage jika diaktifkan manual
  if (USE_MOCK_SUPERADMIN) {
    let mockList = getMockNapi();
    
    // Filter berdasarkan Cabang/UPT untuk Supervisor / Kepala UPT / Kasir Kantin
    if (effectiveBranchName && effectiveBranchName !== 'All' && effectiveBranchName !== 'ALL' && effectiveBranchName.toLowerCase() !== 'upt anda') {
      mockList = mockList.filter(item => {
        const itemBranch = item.branchName || item.cabang || item.branch?.name || '';
        const itemBId = item.branchId || item.branch?.id || '';
        const matchBranch = isSameBranch(effectiveBranchName, itemBranch) || (effectiveBranchId && isSameBranch(effectiveBranchId, itemBranch));
        const matchId = effectiveBranchId && itemBId && (effectiveBranchId === itemBId || String(itemBId).toLowerCase() === String(effectiveBranchId).toLowerCase() || isSameBranch(effectiveBranchId, itemBId));
        return matchBranch || matchId || (!itemBranch && !itemBId);
      });
    } else if (effectiveBranchId && effectiveBranchId !== 'All' && effectiveBranchId !== 'ALL') {
      mockList = mockList.filter(item => {
        const itemBId = item.branchId || item.branch?.id || '';
        const itemBranch = item.branchName || item.cabang || item.branch?.name || '';
        return itemBId === effectiveBranchId || isSameBranch(effectiveBranchId, itemBranch) || isSameBranch(effectiveBranchId, itemBId);
      });
    }

    if (status && status !== 'All' && status !== 'ALL') {
      mockList = mockList.filter(item => (item.status && item.status.toLowerCase() === status.toLowerCase()) || (item.commStatus && item.commStatus.toLowerCase() === status.toLowerCase()));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const qDigits = q.replace(/[^0-9]/g, '');
      mockList = mockList.filter(item => {
        const iIdent = (item.identifier || item.wbpRegNumber || item.nip || item.id || '').toLowerCase();
        const iIdentDigits = iIdent.replace(/[^0-9]/g, '');
        const matchIdent = iIdent.includes(q) || (qDigits.length >= 2 && iIdentDigits.includes(qDigits));
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchRoom = (item.blockRoom || '').toLowerCase().includes(q);
        const matchPhone = item.families && Array.isArray(item.families) && item.families.some(f => 
          (f.name && f.name.toLowerCase().includes(q)) ||
          (f.phone && f.phone.includes(q)) ||
          (qDigits.length >= 4 && (f.phone || '').replace(/[^0-9]/g, '').includes(qDigits))
        );
        return matchIdent || matchName || matchRoom || matchPhone;
      });
    }
    const numLimit = Number(limit) || 20;
    const numPage = Number(page) || 1;
    const startIdx = (numPage - 1) * numLimit;
    const paginated = mockList.slice(startIdx, startIdx + numLimit);

    return {
      items: paginated.map(mapInmateItem).filter(Boolean),
      total: mockList.length,
      page: numPage,
      limit: numLimit,
      totalPages: Math.max(1, Math.ceil(mockList.length / numLimit)),
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
export const createInmate = async ({ identifier, name, initialPin, blockRoom, branchId, branchName, families = [] }) => {
  if (!identifier || !name) {
    throw new Error('NIP dan Nama Narapidana wajib diisi');
  }

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const newNapi = dummyStore.addInmate({
      identifier: identifier.trim(),
      wbpRegNumber: identifier.trim(),
      name: name.trim(),
      initialPin: (initialPin || '123456').trim(),
      blockRoom: (blockRoom || 'Blok A / Kamar 1A').trim(),
      branchId: branchId || 'b1',
      branchName: branchName || 'Lapas Kelas II Yogyakarta',
      callBalance: 0,
      status: 'Aktif',
      commStatus: 'Aktif',
      isActive: true,
      families: Array.isArray(families) ? families : [],
    });
    return { success: true, data: mapInmateItem(newNapi) };
  }

  // Simpan ke mock storage sebagai backup lokal
  let mockResult = null;
  if (USE_MOCK_SUPERADMIN) {
    mockResult = addMockNapi({
      identifier: identifier.trim(),
      wbpRegNumber: identifier.trim(),
      name: name.trim(),
      initialPin: (initialPin || '123456').trim(),
      blockRoom: (blockRoom || 'Blok A / Kamar 1A').trim(),
      branchId: branchId || '',
      branchName: branchName || 'Lapas Kelas II Yogyakarta',
      callBalance: 0,
      status: 'Aktif',
      commStatus: 'Aktif',
      isActive: true,
      families: Array.isArray(families) ? families : [],
    });
  }

  const payload = {
    identifier: identifier.trim(),
    name: name.trim(),
    initialPin: (initialPin || '123456').trim(),
    families: Array.isArray(families) ? families : [],
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
    if (mockResult) {
      return { success: true, data: mockResult };
    }
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[InmateService] Gagal membuat data narapidana:', error?.message || error);
    throw error;
  }
};

export const resetInmatePin = async (id, newPin) => {
  if (!id) throw new Error('ID Narapidana diperlukan');
  if (!newPin || newPin.trim().length < 6) {
    throw new Error('Password baru minimal harus 6 karakter.');
  }

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    dummyStore.updateInmate(id, { initialPin: newPin.trim() });
    return {
      success: true,
      message: 'Password narapidana berhasil direset.',
    };
  }

  try {
    const res = await apiFetch(`${INMATES_ENDPOINT}/${id}/reset-pin`, {
      method: 'POST',
      body: JSON.stringify({ newPin: newPin.trim() }),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.error(`[InmateService] Gagal reset PIN narapidana (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Memperbarui data narapidana
 */
export const updateInmate = async (id, { name, identifier, initialPin, blockRoom, families, ...otherData }) => {
  if (!id) throw new Error('ID Narapidana diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const updated = dummyStore.updateInmate(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(identifier ? { identifier: identifier.trim(), wbpRegNumber: identifier.trim() } : {}),
      ...(initialPin ? { initialPin: initialPin.trim() } : {}),
      ...(blockRoom ? { blockRoom: blockRoom.trim() } : {}),
      ...(families !== undefined ? { families: Array.isArray(families) ? families : [] } : {}),
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
      ...(blockRoom ? { blockRoom: blockRoom.trim() } : {}),
      ...(families !== undefined ? { families: Array.isArray(families) ? families : [] } : {}),
      ...otherData,
    });
    return { success: true, data: updated };
  }

  const payload = {
    name: name?.trim(),
    identifier: identifier?.trim(),
    ...(blockRoom ? { blockRoom: blockRoom.trim() } : {}),
    ...(families !== undefined ? { families } : {}),
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
  resetInmatePin,
};
