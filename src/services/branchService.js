import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta di atas file agar mudah diganti
export const BRANCHES_ENDPOINT = '/api/branches';
export const BRANCH_DETAIL_ENDPOINT = (id) => `/api/branches/${id}`;

/**
 * Mapper fleksibel untuk menstandarisasi data cabang dari respons backend atau mock
 */
export const mapBranchItem = (item) => {
  if (!item) return null;

  const rawStatus = (item.status || 'ACTIVE').toUpperCase();
  const isActive = item.isActive !== undefined 
    ? Boolean(item.isActive) 
    : (rawStatus === 'ACTIVE' || rawStatus === 'AKTIF');

  return {
    id: item.id || item._id || item.branchId,
    name: item.name || item.branchName || 'Cabang Baru',
    location: item.location || item.city || item.address || 'Indonesia',
    address: item.address || item.location || '-',
    phone: item.phone || item.telephone || item.contact || '-',
    capacity: typeof item.capacity === 'number' ? item.capacity : (Number(item.capacity) || 500),
    inmateCount: typeof item.inmateCount === 'number' ? item.inmateCount : (Number(item.inmatesCount ?? item.inmates ?? item.stats?.totalInmates) || 0),
    adminCount: typeof item.adminCount === 'number' ? item.adminCount : (Number(item.adminsCount ?? item.totalUsers ?? item.usersCount) || (item.headAdmin ? 1 : 0)),
    adminEmail: item.adminEmail || item.headAdmin?.email || item.admin?.email || item.email || null,
    headName: item.headName || item.headAdmin?.name || null,
    status: isActive ? 'Active' : 'Inactive',
    isActive,
    createdAt: item.createdAt || new Date().toISOString(),
    isMock: Boolean(item.isMock),
  };
};

/**
 * Fungsi pembentuk payload pembuatan cabang beserta akun admin cabang
 * Menyesuaikan dengan schema BE POST /api/branches (Atomic Transaction)
 */
export const buildCreateBranchPayload = (branchData, adminData) => {
  let statusVal = 'Aktif';
  if (branchData.status) {
    const s = String(branchData.status).toLowerCase();
    if (s === 'active' || s === 'aktif') statusVal = 'Aktif';
    else if (s === 'draft') statusVal = 'Draft';
    else if (s === 'inactive' || s === 'nonaktif') statusVal = 'Nonaktif';
  }

  const defaultHeadName = branchData.headName?.trim() || `Kepala ${branchData.name?.trim() || 'UPT'}`;
  const emailVal = adminData?.email?.trim() || branchData.headEmail?.trim() || '';
  const passwordVal = adminData?.password || branchData.headPassword || '';

  const payload = {
    name: branchData.name?.trim(),
    location: branchData.location?.trim() || '',
    address: branchData.address?.trim() || '',
    phone: branchData.phone?.trim() || '',
    capacity: parseInt(branchData.capacity, 10) || 500,
    status: statusVal,
    headName: defaultHeadName,
    headEmail: emailVal,
    headPassword: passwordVal,
    headPhone: branchData.headPhone?.trim() || branchData.phone?.trim() || '',
    admin: {
      name: defaultHeadName,
      email: emailVal,
      password: passwordVal,
    },
  };

  return payload;
};

/**
 * Mengambil daftar cabang
 */
export const getBranches = async ({ search = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const queryString = params.toString();
  const url = queryString ? `${BRANCHES_ENDPOINT}?${queryString}` : BRANCHES_ENDPOINT;

  try {
    const res = await apiFetch(url);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.branches)
            ? res.branches
            : [];

    const backendItems = rawList.map(mapBranchItem).filter(Boolean);
    const backendTotal = typeof res?.total === 'number'
      ? res.total
      : typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : backendItems.length;

    const backendTotalPages = typeof res?.totalPages === 'number'
      ? res.totalPages
      : typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(backendTotal / limit));

    return {
      items: backendItems,
      total: backendTotal,
      page: Number(page),
      limit: Number(limit),
      totalPages: backendTotalPages,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[BranchService] Gagal mengambil data cabang:', error?.message || error);
    return {
      items: [],
      total: 0,
      page: Number(page),
      limit: Number(limit),
      totalPages: 1,
    };
  }
};

/**
 * Mengambil detail data cabang berdasarkan ID
 */
export const getBranchById = async (id) => {
  if (!id) return null;

  const endpoint = BRANCH_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint);
    return mapBranchItem(res?.data || res);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[BranchService] Gagal memuat detail cabang (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Menambahkan cabang baru
 */
export const createBranch = async (data) => {
  try {
    const res = await apiFetch(BRANCHES_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[BranchService] Gagal tambah cabang:', error?.message || error);
    throw error;
  }
};

/**
 * Mengubah data cabang
 */
export const updateBranch = async (id, data) => {
  if (!id) throw new Error('ID Cabang diperlukan');

  const endpoint = BRANCH_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[BranchService] Gagal ubah cabang (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Mengubah status aktif/nonaktif cabang
 * Endpoint: PATCH /api/branches/:id/status
 * Payload: { status: 'Aktif' | 'Nonaktif' | 'Draft' }
 */
export const updateBranchStatus = async (id, statusOrIsActive) => {
  if (!id) throw new Error('ID Cabang diperlukan');

  let statusPayload = 'Aktif';
  if (typeof statusOrIsActive === 'boolean') {
    statusPayload = statusOrIsActive ? 'Aktif' : 'Nonaktif';
  } else if (typeof statusOrIsActive === 'string') {
    const s = statusOrIsActive.toLowerCase();
    if (s === 'aktif' || s === 'active') statusPayload = 'Aktif';
    else if (s === 'draft') statusPayload = 'Draft';
    else statusPayload = 'Nonaktif';
  }

  const endpoint = `/api/branches/${id}/status`;
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ status: statusPayload }),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[BranchService] Gagal ubah status cabang (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Menghapus data UPT / Cabang
 */
export const deleteBranch = async (id) => {
  if (!id) throw new Error('ID Cabang diperlukan');

  const endpoint = BRANCH_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'DELETE',
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[BranchService] Gagal menghapus cabang (${id}):`, error?.message || error);
    throw error;
  }
};

export default {
  BRANCHES_ENDPOINT,
  BRANCH_DETAIL_ENDPOINT,
  mapBranchItem,
  buildCreateBranchPayload,
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  updateBranchStatus,
  deleteBranch,
};


