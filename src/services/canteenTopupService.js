/**
 * Canteen Topup Service — PasCall Superadmin
 * ===========================================
 * Service layer untuk pengelolaan Paket Saldo & Riwayat Top Up Kantin Lapas.
 *
 * PENTING:
 * Mengikuti pola saklar isDummyMode() dan fallback localStorage untuk pengujian frontend.
 * Saat backend endpoint siap, cukup ganti pemanggilan fungsi di bawah ini ke REST API.
 *
 * MAPPING ENDPOINT BACKEND (NANTI):
 * - GET    /api/canteen/topup/summary    → getTopupSummary()
 * - GET    /api/canteen/topup/nominals   → getNominalSaldoList()
 * - POST   /api/canteen/topup/nominals   → createNominalSaldo()
 * - PUT    /api/canteen/topup/nominals/:id → updateNominalSaldo()
 * - DELETE /api/canteen/topup/nominals/:id → deleteNominalSaldo()
 * - GET    /api/canteen/topup/history    → getSuperadminTopupHistory()
 */

import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';
import {
  PPN_RATE,
  DEFAULT_NOMINAL_SALDO_LIST,
  generateSuperadminRiwayatTopUpDummy,
} from '../dummy/saldoDummy';

// Re-export konstanta tarif PPN
export { PPN_RATE };

const STORAGE_KEY_NOMINALS = 'pascall_superadmin_canteen_nominals_v1';
const STORAGE_KEY_NAT_HISTORY = 'pascall_superadmin_canteen_history_v1';

// Simulasi delay network
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Helper Local Storage ---

function getStoredNominals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOMINALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOMINALS, JSON.stringify(DEFAULT_NOMINAL_SALDO_LIST));
      return DEFAULT_NOMINAL_SALDO_LIST;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOMINAL_SALDO_LIST;
  }
}

function saveStoredNominals(list) {
  try {
    localStorage.setItem(STORAGE_KEY_NOMINALS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving nominals to localStorage:', err);
  }
}

function getStoredNationalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NAT_HISTORY);
    if (!raw) {
      const initial = generateSuperadminRiwayatTopUpDummy();
      localStorage.setItem(STORAGE_KEY_NAT_HISTORY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return generateSuperadminRiwayatTopUpDummy();
  }
}

function saveStoredNationalHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY_NAT_HISTORY, JSON.stringify(history));
  } catch (err) {
    console.error('Error saving national history to localStorage:', err);
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * 1. Mengambil ringkasan data statistik top up untuk 3 kartu di atas halaman:
 *    - Total Saldo Terjual (Nominal yang Berhasil)
 *    - Total PPN 11% (PPN yang Berhasil)
 *    - Jumlah Transaksi Top Up (Total & Berhasil)
 *
 * @returns {Promise<{ totalSaldoTerjual: number, totalPpn: number, totalTopupCount: number, totalPending: number }>}
 */
export async function getTopupSummary() {
  if (isDummyMode() || true) {
    await delay(100);
    const history = getStoredNationalHistory();
    const successful = history.filter((item) => item.status === 'Berhasil');

    const totalSaldoTerjual = successful.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
    const totalPpn = successful.reduce((sum, item) => sum + (Number(item.ppn) || 0), 0);
    const totalTopupCount = history.length;
    const totalPending = history.filter((item) => item.status === 'Menunggu').length;

    return {
      totalSaldoTerjual,
      totalPpn,
      totalTopupCount,
      totalPending,
    };
  }

  // TODO BE:
  // const res = await apiFetch('/api/canteen/topup/summary');
  // return res.data || res;
}

/**
 * 2. Mengambil daftar Paket Nominal Saldo yang dijual oleh Superadmin
 *
 * @returns {Promise<Array>}
 */
export async function getNominalSaldoList() {
  if (isDummyMode() || true) {
    await delay(120);
    return getStoredNominals();
  }

  // TODO BE:
  // const res = await apiFetch('/api/canteen/topup/nominals');
  // return res.data || res;
}

/**
 * 3. Menambah paket nominal saldo baru
 *
 * @param {{ nominal: number, status?: string }} data
 * @returns {Promise<object>}
 */
export async function createNominalSaldo(data) {
  const nominalNum = Number(data.nominal);
  if (!nominalNum || nominalNum <= 0) {
    throw new Error('Nominal saldo harus lebih dari Rp 0.');
  }

  const ppn = Math.round(nominalNum * PPN_RATE);
  const totalBayar = nominalNum + ppn;
  const status = data.status || 'Aktif';

  if (isDummyMode() || true) {
    await delay(200);
    const current = getStoredNominals();
    const newNominal = {
      id: `nom-${Date.now()}`,
      nominal: nominalNum,
      ppn,
      totalBayar,
      status,
      isActive: status === 'Aktif',
      createdAt: new Date().toISOString(),
    };

    const updated = [newNominal, ...current];
    saveStoredNominals(updated);
    return newNominal;
  }

  // TODO BE:
  // const res = await apiFetch('/api/canteen/topup/nominals', {
  //   method: 'POST',
  //   body: JSON.stringify({ nominal: nominalNum, status }),
  // });
  // return res.data || res;
}

/**
 * 4. Memperbarui paket nominal saldo
 *
 * @param {string} id
 * @param {{ nominal?: number, status?: string }} data
 * @returns {Promise<object>}
 */
export async function updateNominalSaldo(id, data) {
  if (!id) throw new Error('ID Nominal diperlukan.');

  if (isDummyMode() || true) {
    await delay(180);
    const current = getStoredNominals();
    const existing = current.find((item) => item.id === id);
    if (!existing) throw new Error('Nominal saldo tidak ditemukan.');

    const nominalNum = data.nominal !== undefined ? Number(data.nominal) : existing.nominal;
    const ppn = Math.round(nominalNum * PPN_RATE);
    const totalBayar = nominalNum + ppn;
    const status = data.status !== undefined ? data.status : existing.status;

    const updatedItem = {
      ...existing,
      nominal: nominalNum,
      ppn,
      totalBayar,
      status,
      isActive: status === 'Aktif',
    };

    const updatedList = current.map((item) => (item.id === id ? updatedItem : item));
    saveStoredNominals(updatedList);
    return updatedItem;
  }

  // TODO BE:
  // const res = await apiFetch(`/api/canteen/topup/nominals/${id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(data),
  // });
  // return res.data || res;
}

/**
 * 5. Mengubah status Aktif / Nonaktif nominal saldo
 *
 * @param {string} id
 * @param {string} currentStatus
 * @returns {Promise<object>}
 */
export async function toggleNominalSaldoStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
  return await updateNominalSaldo(id, { status: newStatus });
}

/**
 * 6. Menghapus paket nominal saldo
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteNominalSaldo(id) {
  if (!id) throw new Error('ID Nominal diperlukan.');

  if (isDummyMode() || true) {
    await delay(200);
    const current = getStoredNominals();
    const updated = current.filter((item) => item.id !== id);
    saveStoredNominals(updated);
    return true;
  }

  // TODO BE:
  // await apiFetch(`/api/canteen/topup/nominals/${id}`, { method: 'DELETE' });
  // return true;
}

/**
 * 7. Mengambil daftar riwayat transaksi top up kantin nasional dengan filter & search
 *
 * @param {{ search?: string, status?: string, branchId?: string }} filter
 * @returns {Promise<Array>}
 */
export async function getSuperadminTopupHistory({
  search = '',
  status = 'semua',
  branchId = 'semua',
} = {}) {
  if (isDummyMode() || true) {
    await delay(150);
    let list = getStoredNationalHistory();

    // Filter status
    if (status && status !== 'semua') {
      list = list.filter((item) => item.status.toLowerCase() === status.toLowerCase());
    }

    // Filter cabang / UPT
    if (branchId && branchId !== 'semua') {
      list = list.filter((item) => item.branchId === branchId || item.branchName?.toLowerCase().includes(branchId.toLowerCase()));
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.branchName.toLowerCase().includes(q) ||
          (item.staffName && item.staffName.toLowerCase().includes(q)) ||
          String(item.nominal).includes(q) ||
          String(item.totalBayar).includes(q)
      );
    }

    // Urutkan tanggal terbaru di atas
    list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    return list;
  }

  // TODO BE:
  // const params = new URLSearchParams();
  // if (search) params.append('search', search);
  // if (status && status !== 'semua') params.append('status', status);
  // if (branchId && branchId !== 'semua') params.append('branchId', branchId);
  // const res = await apiFetch(`/api/canteen/topup/history?${params.toString()}`);
  // return res.data || res;
}
