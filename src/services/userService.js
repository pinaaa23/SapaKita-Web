import { apiFetch, logout } from './api';
import { ROLES, normalizeRole, ROLE_LABELS } from '../config/menuConfig';
import { isDummyMode } from '../dummy';

export const USERS_ENDPOINT = '/api/users';
export const USER_DETAIL_ENDPOINT = (id) => `/api/users/${id}`;
export const USER_STATUS_ENDPOINT = (id) => `/api/users/${id}/status`;
export const USER_RESET_PASSWORD_ENDPOINT = (id) => `/api/users/${id}/reset-password`;

/**
 * Generator kata sandi acak yang aman & mudah dihafal
 */
export const generateRandomPassword = () => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const all = uppers + lowers + numbers;

  let pass = '';
  pass += uppers[Math.floor(Math.random() * uppers.length)];
  pass += lowers[Math.floor(Math.random() * lowers.length)];
  pass += numbers[Math.floor(Math.random() * numbers.length)];

  for (let i = 3; i < 10; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Mapper fleksibel untuk menstandarisasi data pengguna dari respons backend
 */
export const mapUserItem = (item) => {
  if (!item) return null;

  const rawRole = item.role || item.rawRole || 'supervisor';
  const normRole = normalizeRole(rawRole);
  const roleLabel = ROLE_LABELS[normRole] || 'Pengguna';

  const rawStatus = (item.status || (item.isActive ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
  const isActive = item.isActive !== undefined 
    ? Boolean(item.isActive) 
    : (rawStatus === 'ACTIVE' || rawStatus === 'AKTIF');

  return {
    id: item.id || item._id || item.userId || `usr-${Date.now()}`,
    name: item.name || 'Pengguna Baru',
    email: item.email || item.identifier || '-',
    phone: item.phone || item.phoneNumber || '-',
    role: normRole,
    roleLabel,
    rawRole,
    branchId: item.branchId || item.branch?.id || 'b1',
    branchName: item.branch?.name || item.branchName || 'UPT Terdaftar',
    status: isActive ? 'Active' : 'Suspended',
    isActive,
    lastLogin: item.lastLogin || (isActive ? 'Hari ini, 08:30 WIB' : '12 Sep 2026, 11:20 WIB'),
    joinDate: item.createdAt || item.joinDate || new Date().toISOString(),
  };
};

/**
 * Mengambil daftar pengguna UPT dengan filter pencarian, role, dan pagination
 */
export const getUsers = async ({
  search = '',
  page = 1,
  limit = 20,
  role = 'All',
  status = 'All',
} = {}) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    let list = dummyStore.getUsers().map(mapUserItem);

    if (role && role !== 'All') {
      list = list.filter((u) => u.role === role || u.rawRole === role);
    }

    if (status && status !== 'All') {
      const isStatusActive = status === 'Active' || status === 'Aktif';
      list = list.filter((u) => u.isActive === isStatusActive);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          u.roleLabel.toLowerCase().includes(q)
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
  }

  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (role && role !== 'All') params.append('role', role);
    if (status && status !== 'All') params.append('status', status);

    const queryString = params.toString();
    const url = queryString ? `${USERS_ENDPOINT}?${queryString}` : USERS_ENDPOINT;

    const res = await apiFetch(url);
    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.users)
            ? res.users
            : [];

    return {
      items: rawList.map(mapUserItem).filter(Boolean),
      total: res.total || rawList.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil((res.total || rawList.length) / limit)),
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    return {
      items: [],
      total: 0,
      page: 1,
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

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const users = dummyStore.getUsers();
    const found = users.find((u) => u.id === id);
    return found ? mapUserItem(found) : null;
  }

  try {
    const res = await apiFetch(USER_DETAIL_ENDPOINT(id));
    const data = res?.data || res?.user || res;
    return data ? mapUserItem(data) : null;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    return null;
  }
};

/**
 * Mendaftarkan pengguna baru (Supervisor atau Operator Kantin)
 */
export const createUser = async (data) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const newUser = dummyStore.addUser({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '-',
      role: data.role || ROLES.SUPERVISOR,
      rawRole: (data.role || ROLES.SUPERVISOR).toUpperCase(),
    });
    return mapUserItem(newUser);
  }

  const payload = {
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || '-',
    role: (data.role || ROLES.SUPERVISOR).toUpperCase(),
    password: data.password,
  };

  const res = await apiFetch(USERS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapUserItem(res?.data || res);
};

/**
 * Mengubah data pengguna
 */
export const updateUser = async (id, data) => {
  if (!id) throw new Error('ID Pengguna diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const user = dummyStore.getUsers().find((u) => u.id === id);
    if (user) {
      Object.assign(user, data);
      return mapUserItem(user);
    }
    return null;
  }

  const payload = {
    ...(data.name ? { name: data.name.trim() } : {}),
    ...(data.email ? { email: data.email.trim() } : {}),
    ...(data.phone ? { phone: data.phone.trim() } : {}),
    ...(data.role ? { role: (data.role || '').toUpperCase() } : {}),
  };

  const res = await apiFetch(USER_DETAIL_ENDPOINT(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return mapUserItem(res?.data || res);
};

/**
 * Mengubah status aktif/nonaktif pengguna
 */
export const updateUserStatus = async (id, isActiveOrStatus) => {
  if (!id) throw new Error('ID Pengguna diperlukan');

  const isActive = typeof isActiveOrStatus === 'boolean' 
    ? isActiveOrStatus 
    : (isActiveOrStatus === 'ACTIVE' || isActiveOrStatus === 'Active' || isActiveOrStatus === 'Aktif');

  const statusEnum = isActive ? 'ACTIVE' : 'SUSPENDED';

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const updated = dummyStore.updateUserStatus(id, isActive);
    return mapUserItem(updated);
  }

  try {
    const res = await apiFetch(USER_STATUS_ENDPOINT(id), {
      method: 'PATCH',
      body: JSON.stringify({
        status: statusEnum,
        isActive,
      }),
    });
    return mapUserItem(res?.data || res);
  } catch {
    // Fallback ke general patch jika status endpoint ditolak
    const res = await apiFetch(USER_DETAIL_ENDPOINT(id), {
      method: 'PATCH',
      body: JSON.stringify({
        status: statusEnum,
        isActive,
      }),
    });
    return mapUserItem(res?.data || res);
  }
};

/**
 * Menghapus akun pengguna/staf UPT
 */
export const deleteUser = async (id) => {
  if (!id) throw new Error('ID Pengguna diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    dummyStore.deleteUser(id);
    return { success: true, message: 'Pengguna berhasil dihapus' };
  }

  try {
    const res = await apiFetch(USER_DETAIL_ENDPOINT(id), {
      method: 'DELETE',
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.error(`[UserService] Gagal menghapus pengguna (${id}):`, error?.message || error);
    throw error;
  }
};

/**
 * Reset password pengguna dengan password acak baru
 */
export const resetUserPassword = async (id, password) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  const newPassword = password || generateRandomPassword();

  if (isDummyMode()) {
    return {
      success: true,
      newPassword,
      message: 'Kata sandi berhasil direset.',
    };
  }

  const res = await apiFetch(USER_RESET_PASSWORD_ENDPOINT(id), {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });

  return {
    success: true,
    newPassword: res?.data?.temporaryPassword || newPassword,
    message: res?.message || 'Kata sandi berhasil direset.',
  };
};

export default {
  USERS_ENDPOINT,
  USER_DETAIL_ENDPOINT,
  USER_STATUS_ENDPOINT,
  USER_RESET_PASSWORD_ENDPOINT,
  mapUserItem,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
  generateRandomPassword,
};

