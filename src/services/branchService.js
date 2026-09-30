import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta di atas file agar mudah diganti
export const BRANCHES_ENDPOINT = '/api/branches';
export const BRANCH_DETAIL_ENDPOINT = (id) => `/api/branches/${id}`;

/**
 * Mapper fleksibel untuk menstandarisasi data cabang dari respons backend
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
    inmateCount: typeof item.inmateCount === 'number' ? item.inmateCount : (Number(item.inmatesCount ?? item.inmates) || 0),
    adminCount: typeof item.adminCount === 'number' ? item.adminCount : (Number(item.adminsCount ?? item.usersCount) || 0),
    adminEmail: item.adminEmail || item.admin?.email || item.email || null,
    status: isActive ? 'Active' : 'Inactive',
    isActive,
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

/**
 * Fungsi pembentuk payload pembuatan cabang beserta akun admin cabang
 */
export const buildCreateBranchPayload = (branchData, adminData) => {
  const payload = {
    name: branchData.name?.trim(),
    location: branchData.location?.trim(),
    address: branchData.address?.trim() || '',
    phone: branchData.phone?.trim() || '',
    capacity: parseInt(branchData.capacity, 10) || 500,
    status: branchData.status || 'Active',
  };

  if (adminData && adminData.email && adminData.email.trim()) {
    payload.admin = {
      email: adminData.email.trim(),
      password: adminData.password || '',
    };
  }

  return payload;
};

/**
 * Mengambil daftar cabang dari backend dengan parameter pencarian dan pagination
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

    const total = typeof res?.total === 'number'
      ? res.total
      : typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : rawList.length;

    const totalPages = typeof res?.totalPages === 'number'
      ? res.totalPages
      : typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(total / limit));

    return {
      items: rawList.map(mapBranchItem).filter(Boolean),
      total,
      page: Number(res?.page || res?.pagination?.page || page),
      limit: Number(res?.limit || res?.pagination?.limit || limit),
      totalPages,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[BranchService] Fallback data kosong cabang:', error?.message || error);
    return {
      items: [],
      total: 0,
      page,
      limit,
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
    console.log(`[BranchService] Response GET ${endpoint}:`, res);
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
    console.log('[BranchService] Response POST /api/branches (success)');
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
    console.log(`[BranchService] Response PATCH ${endpoint}:`, res);
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
 */
export const updateBranchStatus = async (id, isActive) => {
  return updateBranch(id, { isActive: Boolean(isActive), status: isActive ? 'ACTIVE' : 'INACTIVE' });
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
};
