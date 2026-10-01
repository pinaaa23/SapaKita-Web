import { apiFetch, logout } from './api';
import { ROLES, normalizeRole, ROLE_LABELS } from '../config/menuConfig';

export const USERS_ENDPOINT = '/api/users';
export const USER_DETAIL_ENDPOINT = (id) => `/api/users/${id}`;
export const USER_RESET_PASSWORD_ENDPOINT = (id) => `/api/users/${id}/reset-password`;

const STORAGE_KEY = 'pascall_upt_users_v3';

/**
 * Data awal pengguna UPT (1 Supervisor Aktif, 1 Operator Kantin Aktif, 1 Supervisor Nonaktif)
 */
export const defaultUptUsers = [
  {
    id: 'usr-spv-01',
    name: 'Ahmad Fauzi',
    email: 'supervisor.cipinang@pascall.id',
    phone: '0812-3456-7811',
    role: ROLES.SUPERVISOR,
    rawRole: 'SUPERVISOR',
    status: 'Active',
    isActive: true,
    lastLogin: 'Hari ini, 08:30 WIB',
    joinDate: '2026-01-10T08:30:00.000Z',
  },
  {
    id: 'usr-ktn-01',
    name: 'Siti Rahmawati',
    email: 'kantin.cipinang@pascall.id',
    phone: '0812-3456-7833',
    role: ROLES.OPERATOR_KANTIN,
    rawRole: 'OPERATOR_KANTIN',
    status: 'Active',
    isActive: true,
    lastLogin: 'Kemarin, 14:15 WIB',
    joinDate: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'usr-spv-02',
    name: 'Bambang Sudiro',
    email: 'bambang.spv@pascall.id',
    phone: '0812-3456-7822',
    role: ROLES.SUPERVISOR,
    rawRole: 'SUPERVISOR',
    status: 'Suspended',
    isActive: false,
    lastLogin: '12 Sep 2026, 11:20 WIB',
    joinDate: '2026-02-15T09:15:00.000Z',
  },
];

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUptUsers));
      return defaultUptUsers;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultUptUsers;
  } catch (err) {
    console.error('Error membaca storage pengguna:', err);
    return defaultUptUsers;
  }
};

const saveStoredUsers = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error menyimpan storage pengguna:', err);
  }
};

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
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (role && role !== 'All') params.append('role', role);
    if (status && status !== 'All') params.append('status', status);

    const queryString = params.toString();
    const url = queryString ? `${USERS_ENDPOINT}?${queryString}` : USERS_ENDPOINT;

    // Coba request ke backend
    try {
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

      if (rawList.length > 0) {
        return {
          items: rawList.map(mapUserItem).filter(Boolean),
          total: res.total || rawList.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.max(1, Math.ceil((res.total || rawList.length) / limit)),
        };
      }
    } catch {
      // Fallback ke localStorage
    }

    let list = getStoredUsers().map(mapUserItem);

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
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    return {
      items: getStoredUsers().map(mapUserItem),
      total: getStoredUsers().length,
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
  const list = getStoredUsers();
  const found = list.find((u) => u.id === id);
  return found ? mapUserItem(found) : null;
};

/**
 * Mendaftarkan pengguna baru (Supervisor atau Operator Kantin)
 */
export const createUser = async (data) => {
  const newUser = {
    id: `usr-${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || '-',
    role: data.role || ROLES.SUPERVISOR,
    rawRole: (data.role || ROLES.SUPERVISOR).toUpperCase(),
    status: 'Active',
    isActive: true,
    joinDate: new Date().toISOString(),
  };

  try {
    const res = await apiFetch(USERS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ ...newUser, password: data.password }),
    });
    const current = getStoredUsers();
    saveStoredUsers([res || newUser, ...current]);
    return res || newUser;
  } catch {
    const current = getStoredUsers();
    saveStoredUsers([newUser, ...current]);
    return newUser;
  }
};

/**
 * Mengubah data pengguna
 */
export const updateUser = async (id, data) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  try {
    const res = await apiFetch(USER_DETAIL_ENDPOINT(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const current = getStoredUsers();
    const updated = current.map((u) =>
      u.id === id ? { ...u, ...data, id } : u
    );
    saveStoredUsers(updated);
    return res || updated.find((u) => u.id === id);
  } catch {
    const current = getStoredUsers();
    const updated = current.map((u) =>
      u.id === id ? { ...u, ...data, id } : u
    );
    saveStoredUsers(updated);
    return updated.find((u) => u.id === id);
  }
};

/**
 * Mengubah status aktif/nonaktif pengguna
 */
export const updateUserStatus = async (id, isActive) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  return await updateUser(id, {
    isActive,
    status: isActive ? 'Active' : 'Suspended',
  });
};

/**
 * Reset password pengguna dengan password acak baru
 */
export const resetUserPassword = async (id) => {
  if (!id) throw new Error('ID Pengguna diperlukan');
  const newPassword = generateRandomPassword();

  try {
    await apiFetch(USER_RESET_PASSWORD_ENDPOINT(id), {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });
  } catch {
    // Mock success
  }

  return {
    success: true,
    newPassword,
    message: 'Kata sandi berhasil direset.',
  };
};

export default {
  USERS_ENDPOINT,
  USER_DETAIL_ENDPOINT,
  USER_RESET_PASSWORD_ENDPOINT,
  defaultUptUsers,
  mapUserItem,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  generateRandomPassword,
};
