/**
 * Finance & Inkopasindo Account Service (Manajemen Akun Finance & Inkopasindo Pusat)
 * =================================================================================
 * Digunakan oleh Superadmin untuk mengelola akun dengan role 'FINANCE' dan 'INKOPASINDO'.
 *
 * STATUS KETERSEDIAAN ENDPOINT BACKEND (BE):
 * 1. GET /api/finance/admins
 *    - Mengambil seluruh daftar akun dengan role 'FINANCE' dan 'INKOPASINDO'.
 *    - Query parameters: search, role ('All' | 'FINANCE' | 'INKOPASINDO'), status ('All' | 'Aktif' | 'Nonaktif').
 * 2. POST /api/finance/admins
 *    - Mendaftarkan akun Admin Finance atau Inkopasindo baru.
 *    - Payload: { name, email, phone, role, password, status, isActive }.
 * 3. PATCH /api/finance/admins/:id/status
 *    - Mengubah status aktif / nonaktif akun.
 *    - Payload: { status: 'Aktif' | 'Nonaktif', isActive: boolean }.
 * 4. POST /api/finance/admins/:id/reset-password
 *    - Mereset kata sandi akun.
 *    - Payload: { newPassword: '...' }.
 * 5. PATCH /api/finance/admins/:id
 *    - Memperbarui data profil akun (nama, email, telepon, role, status).
 * 6. DELETE /api/finance/admins/:id
 *    - Menghapus akun (soft-delete bila ada riwayat audit).
 *
 * Dilengkapi fallback offline / local mock jika server backend sedang tidak aktif.
 */

import { apiFetch } from './api';
import { generateRandomPassword } from './userService';

const FINANCE_ACCOUNTS_STORAGE_KEY = 'pascall_finance_accounts_local_v1';

// Akun bawaan (sinkron dengan seed backend: finance@sadewa.id & inkopasindo@sadewa.id)
const DEFAULT_ACCOUNTS = [
  {
    id: '88ba2074-df28-4ed2-a032-4a2c87c36f88',
    name: 'Dewi Lestari (Finance)',
    email: 'finance@sadewa.id',
    phone: '081298765432',
    role: 'finance',
    roleLabel: 'Admin Finance',
    isActive: true,
    status: 'Aktif',
    createdAt: '2026-10-27T11:36:42.512Z',
    isLocalMock: false,
  },
  {
    id: '1328a05e-21f8-4e11-a3a7-7e5d7c9ddff7',
    name: 'Inkopasindo Administrator',
    email: 'inkopasindo@sadewa.id',
    phone: '081399887766',
    role: 'inkopasindo',
    roleLabel: 'Inkopasindo',
    isActive: true,
    status: 'Aktif',
    createdAt: '2026-10-27T11:36:42.512Z',
    isLocalMock: false,
  },
];

/**
 * Mengambil data akun mock dari localStorage
 */
const getLocalAccounts = () => {
  try {
    const raw = localStorage.getItem(FINANCE_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gagal membaca storage akun finance/inkopasindo lokal:', err);
    return [];
  }
};

/**
 * Menyimpan data akun mock ke localStorage
 */
const saveLocalAccounts = (accounts) => {
  try {
    localStorage.setItem(FINANCE_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Gagal menyimpan storage akun finance/inkopasindo lokal:', err);
  }
};

/**
 * 1. Ambil daftar akun Finance & Inkopasindo
 * Endpoint BE: GET /api/finance/admins?search=...&role=...&status=...
 */
export const getFinanceAccounts = async ({ search = '', role = 'All', status = 'All' } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.append('search', search.trim());
  }
  if (role && role !== 'All') {
    params.append('role', role);
  }
  if (status && status !== 'All') {
    params.append('status', status);
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await apiFetch(`/api/finance/admins${queryString}`);
    const rawList = res?.data || (Array.isArray(res) ? res : []);

    const items = rawList.map((u) => {
      const isActive = u.isActive !== undefined ? Boolean(u.isActive) : u.status === 'Aktif';
      const isInk = String(u.role).toUpperCase() === 'INKOPASINDO';
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '-',
        role: isInk ? 'inkopasindo' : 'finance',
        roleLabel: isInk ? 'Inkopasindo' : 'Admin Finance',
        isActive,
        status: u.status || (isActive ? 'Aktif' : 'Nonaktif'),
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt,
        isLocalMock: false,
      };
    });

    return {
      items,
      total: items.length,
      source: 'backend',
    };
  } catch (err) {
    console.warn('[FinanceAccountService] Gagal menghubungi GET /api/finance/admins, beralih ke fallback lokal:', err?.message || err);

    // Fallback data lokal jika backend tidak terhubung / offline
    let results = [...DEFAULT_ACCOUNTS];
    const localAccounts = getLocalAccounts();
    const map = new Map();
    results.forEach((acc) => map.set(acc.id, acc));
    localAccounts.forEach((acc) => map.set(acc.id, acc));
    results = Array.from(map.values());

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((acc) =>
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        (acc.phone && acc.phone.toLowerCase().includes(q))
      );
    }

    if (role && role !== 'All') {
      const qRole = role.toLowerCase();
      results = results.filter((acc) => acc.role.toLowerCase() === qRole);
    }

    if (status && status !== 'All') {
      results = results.filter((acc) => acc.status === status);
    }

    return {
      items: results,
      total: results.length,
      source: 'mock',
    };
  }
};

/**
 * 2. Tambah Akun Finance atau Inkopasindo Baru
 * Endpoint BE: POST /api/finance/admins
 */
export const createFinanceAccount = async ({ name, email, phone = '', role = 'finance', status = 'Aktif', password = null }) => {
  const finalPassword = password && password.trim() ? password.trim() : generateRandomPassword();
  const normalizedEmail = email.trim().toLowerCase();
  const targetIsActive = status === 'Aktif';
  const isInk = String(role).toLowerCase() === 'inkopasindo';
  const targetRole = isInk ? 'INKOPASINDO' : 'FINANCE';
  const roleLabel = isInk ? 'Inkopasindo' : 'Admin Finance';

  try {
    const res = await apiFetch('/api/finance/admins', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || undefined,
        role: targetRole,
        password: finalPassword,
        status,
        isActive: targetIsActive,
      }),
    });

    if (res?.data) {
      const u = res.data;
      const isActive = u.isActive !== undefined ? Boolean(u.isActive) : u.status === 'Aktif';
      return {
        success: true,
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '-',
          role: isInk ? 'inkopasindo' : 'finance',
          roleLabel,
          isActive,
          status: u.status || (isActive ? 'Aktif' : 'Nonaktif'),
          createdAt: u.createdAt || new Date().toISOString(),
          isLocalMock: false,
        },
        password: finalPassword,
        message: res.message || `Akun ${roleLabel} berhasil dibuat`,
        source: 'backend',
      };
    }
  } catch (err) {
    if (err.status) {
      console.error('[FinanceAccountService] Error validasi dari server:', err.message);
      throw err;
    }

    console.warn('[FinanceAccountService] Backend offline saat POST /api/finance/admins, menyimpan ke mock lokal:', err.message);
    const newAccount = {
      id: `${isInk ? 'ink' : 'fin'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || '-',
      role: isInk ? 'inkopasindo' : 'finance',
      roleLabel,
      isActive: targetIsActive,
      status: targetIsActive ? 'Aktif' : 'Nonaktif',
      createdAt: new Date().toISOString(),
      isLocalMock: true,
    };

    const localAccounts = getLocalAccounts();
    localAccounts.unshift(newAccount);
    saveLocalAccounts(localAccounts);

    return {
      success: true,
      data: newAccount,
      password: finalPassword,
      message: `Akun ${roleLabel} berhasil disimpan (Mode Offline)`,
      source: 'mock',
    };
  }
};

/**
 * 3. Toggle Status Akun (Aktifkan / Nonaktifkan)
 * Endpoint BE: PATCH /api/finance/admins/:id/status
 */
export const toggleFinanceAccountStatus = async (id, targetStatus) => {
  const isTargetActive = targetStatus === 'Aktif';

  try {
    const res = await apiFetch(`/api/finance/admins/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: targetStatus,
        isActive: isTargetActive,
      }),
    });

    if (res?.success || res?.data) {
      return {
        success: true,
        status: targetStatus,
        isActive: isTargetActive,
        source: 'backend',
        data: res?.data,
      };
    }
  } catch (err) {
    if (err.status) {
      console.error('[FinanceAccountService] Error toggle status dari server:', err.message);
      throw err;
    }

    console.warn('[FinanceAccountService] Backend offline saat toggle status, memperbarui mock lokal:', err.message);
  }

  // Update fallback di local storage jika backend offline
  const localAccounts = getLocalAccounts();
  const existingIndex = localAccounts.findIndex((a) => a.id === id);

  if (existingIndex >= 0) {
    localAccounts[existingIndex].isActive = isTargetActive;
    localAccounts[existingIndex].status = targetStatus;
    saveLocalAccounts(localAccounts);
  }

  return {
    success: true,
    status: targetStatus,
    isActive: isTargetActive,
    source: 'mock',
  };
};

/**
 * 4. Reset Password Akun
 * Endpoint BE: POST /api/finance/admins/:id/reset-password
 */
export const resetFinanceAccountPassword = async (id, customPassword = null) => {
  const newPassword = customPassword || generateRandomPassword();

  try {
    const res = await apiFetch(`/api/finance/admins/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });

    if (res?.success) {
      return {
        success: true,
        password: newPassword,
        message: res.message || 'Password akun berhasil direset',
        source: 'backend',
      };
    }
  } catch (err) {
    if (err.status) {
      console.error('[FinanceAccountService] Error reset password dari server:', err.message);
      throw err;
    }

    console.warn('[FinanceAccountService] Backend offline saat reset password, menggunakan mock lokal:', err.message);
  }

  return {
    success: true,
    password: newPassword,
    message: 'Password akun berhasil direset (Mode Offline)',
    source: 'mock',
  };
};

/**
 * 5. Update Data Akun (Nama, Email, Telepon, Role, Status)
 * Endpoint BE: PATCH /api/finance/admins/:id
 */
export const updateFinanceAccount = async (id, payload) => {
  const res = await apiFetch(`/api/finance/admins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res;
};

/**
 * 6. Hapus Akun
 * Endpoint BE: DELETE /api/finance/admins/:id
 */
export const deleteFinanceAccount = async (id) => {
  const res = await apiFetch(`/api/finance/admins/${id}`, {
    method: 'DELETE',
  });
  return res;
};

export default {
  getFinanceAccounts,
  createFinanceAccount,
  toggleFinanceAccountStatus,
  resetFinanceAccountPassword,
  updateFinanceAccount,
  deleteFinanceAccount,
};
