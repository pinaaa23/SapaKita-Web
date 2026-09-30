import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta di atas file agar mudah diganti
export const USERS_ENDPOINT = '/api/users';
export const USER_DETAIL_ENDPOINT = (id) => `/api/users/${id}`;
export const USER_RESET_PASSWORD_ENDPOINT = (id) => `/api/users/${id}/reset-password`;

/**
 * Mapper fleksibel untuk menstandarisasi data pengguna dari respons backend
 */
export const mapUserItem = (item) => {
  if (!item) return null;

  const rawRole = (item.role || 'BRANCH_ADMIN').toUpperCase();
  let normalizedRole = 'Admin Cabang';
  if (rawRole === 'SUPERADMIN') normalizedRole = 'Super Administrator';
  else if (rawRole === 'BRANCH_ADMIN') normalizedRole = 'Operator Cabang';
  else if (rawRole.includes('KANTIN')) normalizedRole = 'Petugas Kantin';
  else normalizedRole = item.role || 'Operator';

  const rawStatus = (item.status || 'ACTIVE').toUpperCase();
  const isActive = item.isActive !== undefined 
    ? Boolean(item.isActive) 
    : (rawStatus === 'ACTIVE' || rawStatus === 'AKTIF');

  return {
    id: item.id || item._id || item.userId,
    name: item.name || 'Pengguna Baru',
    email: item.email || item.identifier || '-',
    phone: item.phone || item.phoneNumber || '-',
    role: normalizedRole,
    rawRole,
    branchId: item.branchId || item.branch?.id || 'b1',
    branchName: item.branch?.name || item.branchName || 'Cabang Terdaftar',
    status: isActive ? 'Active' : 'Suspended',
    isActive,
    joinDate: item.createdAt || item.joinDate || new Date().toISOString(),
  };
};

/**
 * Mengambil daftar pengguna admin dengan filter dan pagination
 */
export const getUsers = async ({
  search = '',
  page = 1,
  limit = 20,
  role = '',
  branchId = '',
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (role && role !== 'All') params.append('role', role);
  if (branchId && branchId !== 'All') params.append('branchId', branchId);

  const queryString = params.toString();
  const url = queryString ? `${USERS_ENDPOINT}?${queryString}` : USERS_ENDPOINT;

  try {
    const res = await apiFetch(url);
    console.log('[UserService] Response GET /api/users:', res);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.users)
            ? res.users
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
      items: rawList.map(mapUserItem).filter(Boolean),
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
    console.log('[UserService] Fallback data kosong pengguna:', error?.message || error);
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
 * Mengambil detail pengguna berdasarkan ID
 */
export const getUserById = async (id) => {
  if (!id) return null;
  const endpoint = USER_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint);
    console.log(`[UserService] Response GET ${endpoint}:`, res);
    return mapUserItem(res?.data || res);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[UserService] Gagal memuat detail user (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Mendaftarkan pengguna baru
 */
export const createUser = async (data) => {
  try {
    const res = await apiFetch(USERS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[UserService] Gagal tambah user:', error?.message || error);
    throw error;
  }
};

/**
 * Mengubah data pengguna
 */
export const updateUser = async (id, data) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  const endpoint = USER_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    console.log(`[UserService] Response PATCH ${endpoint}:`, res);
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[UserService] Gagal ubah user (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Mengubah status aktif/nonaktif pengguna
 */
export const updateUserStatus = async (id, isActive) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  const endpoint = USER_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, status: isActive ? 'ACTIVE' : 'SUSPENDED' }),
    });
    console.log(`[UserService] Response status update ${endpoint}:`, res);
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[UserService] Gagal ubah status user (${id}):`, error?.message || error);
    throw error;
  }
};


/**
 * Reset password pengguna (Admin Cabang / Operator)
 */
export const resetUserPassword = async (id) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  const endpoint = USER_RESET_PASSWORD_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint, {
      method: 'POST',
    });
    console.log(`[UserService] Response POST ${endpoint} (success)`);
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[UserService] Gagal reset password user (${id}):`, error?.message || error);
    throw error;
  }
};

export default {
  USERS_ENDPOINT,
  USER_DETAIL_ENDPOINT,
  USER_RESET_PASSWORD_ENDPOINT,
  mapUserItem,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
};
