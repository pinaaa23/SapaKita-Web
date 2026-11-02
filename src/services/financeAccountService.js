/**
 * Finance Account Service (Manajemen Akun Tim Finance Pusat)
 * ==========================================================
 * Digunakan oleh Superadmin untuk mengelola akun dengan role 'FINANCE'.
 *
 * STATUS KETERSEDIAAN ENDPOINT BACKEND (BE):
 * 1. Daftar Akun (GET):
 *    - Tersambung ke GET /api/users?role=FINANCE.
 *    - Fallback ke data mock lokal jika offline.
 * 2. Pembuatan Akun (POST):
 *    - MENUNGGU BE: POST /api/users menolak role 'FINANCE' (validasi Zod hanya BRANCH_ADMIN, SUPERVISOR, CANTEEN_STAFF).
 *    - Belum ada endpoint khusus seperti POST /api/finance/admins.
 *    - Menggunakan penyimpanan mock lokal sementara agar fitur FE dapat diuji sepenuhnya.
 * 3. Toggle Status (Aktif/Nonaktif):
 *    - MENUNGGU BE: PATCH /api/users/:id/status menolak role selain staf UPT dengan pesan error.
 *    - Disimulasikan secara mulus di FE via mock storage.
 * 4. Reset Password:
 *    - Endpoint BE POST /api/users/:id/reset-password dapat digunakan untuk akun yang sudah ada di database.
 *    - Didukung fallback mock generator untuk akun lokal.
 */

import { apiFetch } from './api';
import { generateRandomPassword } from './userService';

const FINANCE_ACCOUNTS_STORAGE_KEY = 'pascall_finance_accounts_local_v1';

// Akun bawaan (sinkron dengan seed backend: finance@sadewa.id)
const DEFAULT_FINANCE_ACCOUNTS = [
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
    console.error('Gagal membaca storage akun finance lokal:', err);
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
    console.error('Gagal menyimpan storage akun finance lokal:', err);
  }
};

/**
 * Ambil daftar akun Finance
 * Tersambung ke GET /api/users?role=FINANCE, digabung dengan akun mock lokal
 */
export const getFinanceAccounts = async ({ search = '', status = 'All' } = {}) => {
  let backendAccounts = [];

  try {
    const res = await apiFetch('/api/users?role=FINANCE');
    if (res && res.data && Array.isArray(res.data)) {
      backendAccounts = res.data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '-',
        role: 'finance',
        roleLabel: 'Admin Finance',
        isActive: u.isActive !== undefined ? Boolean(u.isActive) : u.status === 'Aktif',
        status: (u.isActive !== undefined ? u.isActive : u.status === 'Aktif') ? 'Aktif' : 'Nonaktif',
        createdAt: u.createdAt || new Date().toISOString(),
        isLocalMock: false,
      }));
    }
  } catch (err) {
    console.warn('[FinanceAccountService] Menggunakan fallback lokal untuk daftar Finance:', err?.message || err);
    backendAccounts = [...DEFAULT_FINANCE_ACCOUNTS];
  }

  // Gabungkan dengan akun yang baru dibuat secara lokal (mock)
  const localAccounts = getLocalAccounts();
  const combinedMap = new Map();

  // Masukkan data backend terlebih dahulu
  backendAccounts.forEach((acc) => combinedMap.set(acc.id, acc));

  // Override / append akun lokal
  localAccounts.forEach((acc) => combinedMap.set(acc.id, acc));

  let results = Array.from(combinedMap.values());

  // Filter pencarian
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter((acc) =>
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.phone && acc.phone.toLowerCase().includes(q))
    );
  }

  // Filter status
  if (status && status !== 'All') {
    results = results.filter((acc) => acc.status === status);
  }

  return {
    items: results,
    total: results.length,
  };
};

/**
 * Tambah Akun Finance Baru
 * MENUNGGU BE: Saat ini BE belum memiliki endpoint pembuatan akun role FINANCE.
 * Password dapat diisi otomatis atau disesuaikan secara manual oleh Superadmin.
 */
export const createFinanceAccount = async ({ name, email, phone = '', status = 'Aktif', password = null }) => {
  const finalPassword = password && password.trim() ? password.trim() : generateRandomPassword();

  // MENUNGGU BE: Coba panggil BE jika di masa depan endpoint sudah tersedia
  try {
    const res = await apiFetch('/api/finance/admins', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        phone,
        password: finalPassword,
        role: 'FINANCE',
        status,
      }),
    });

    if (res?.data) {
      return {
        success: true,
        data: res.data,
        password: finalPassword,
        source: 'backend',
      };
    }
  } catch (beErr) {
    // MENUNGGU BE: Endpoint BE belum tersedia atau menolak role FINANCE.
    // Lanjutkan dengan penyimpanan lokal mock agar antarmuka Superadmin berfungsi mulus.
    console.warn('[FinanceAccountService] MENUNGGU BE: Endpoint POST /api/finance/admins belum tersedia, menggunakan mock lokal:', beErr?.message);
  }

  // Mock Fallback: Buat ID unik dan simpan ke localStorage
  const newAccount = {
    id: `fin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim() || '-',
    role: 'finance',
    roleLabel: 'Admin Finance',
    isActive: status === 'Aktif',
    status: status === 'Aktif' ? 'Aktif' : 'Nonaktif',
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
    source: 'mock',
  };
};

/**
 * Toggle Status Akun Finance (Aktifkan / Nonaktifkan)
 * MENUNGGU BE: Endpoint PATCH /api/users/:id/status di BE saat ini melempar error
 * jika role bukan BRANCH_ADMIN, SUPERVISOR, atau CANTEEN_STAFF.
 */
export const toggleFinanceAccountStatus = async (id, targetStatus) => {
  const isTargetActive = targetStatus === 'Aktif';

  // MENUNGGU BE: Coba panggil endpoint BE jika di masa depan sudah mendukung role FINANCE
  try {
    const res = await apiFetch(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: targetStatus,
        isActive: isTargetActive,
      }),
    });
    if (res?.success) {
      return { success: true, status: targetStatus, isActive: isTargetActive, source: 'backend' };
    }
  } catch (beErr) {
    // MENUNGGU BE: Endpoint menolak role FINANCE, lakukan update lokal
    console.warn('[FinanceAccountService] MENUNGGU BE: Toggle status gagal di BE, menerapkan update ke mock lokal:', beErr?.message);
  }

  // Update di local storage mock
  const localAccounts = getLocalAccounts();
  const existingIndex = localAccounts.findIndex((a) => a.id === id);

  if (existingIndex >= 0) {
    localAccounts[existingIndex].isActive = isTargetActive;
    localAccounts[existingIndex].status = targetStatus;
    saveLocalAccounts(localAccounts);
  } else {
    // Jika belum ada di local, catat override status untuk akun backend (misal Dewi Lestari)
    localAccounts.push({
      id,
      name: 'Admin Finance',
      email: 'finance@sadewa.id',
      role: 'finance',
      roleLabel: 'Admin Finance',
      isActive: isTargetActive,
      status: targetStatus,
      isLocalMock: true,
    });
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
 * Reset Password Akun Finance
 * Menggunakan password acak baru.
 * Berfungsi langsung ke BE jika akun terdaftar di database, didukung fallback mock.
 */
export const resetFinanceAccountPassword = async (id, customPassword = null) => {
  const newPassword = customPassword || generateRandomPassword();

  // Coba panggil BE POST /api/users/:id/reset-password
  try {
    const res = await apiFetch(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });

    if (res?.success) {
      return {
        success: true,
        password: newPassword,
        message: res.message || 'Password akun Finance berhasil direset',
        source: 'backend',
      };
    }
  } catch (beErr) {
    // MENUNGGU BE: Jika akun bersifat mock atau BE tidak dapat mereset
    console.warn('[FinanceAccountService] Reset password via BE gagal/mock:', beErr?.message);
  }

  return {
    success: true,
    password: newPassword,
    message: 'Password akun Finance berhasil direset (Mode Lokal)',
    source: 'mock',
  };
};

export default {
  getFinanceAccounts,
  createFinanceAccount,
  toggleFinanceAccountStatus,
  resetFinanceAccountPassword,
};
