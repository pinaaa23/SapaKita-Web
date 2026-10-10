/**
 * Canteen Topup Service — PasCall Superadmin
 * ===========================================
 * Service layer untuk pengelolaan Paket Saldo & Riwayat Top Up Kantin Lapas.
 * Terhubung langsung ke Backend REST API:
 * - GET   /api/canteen/topup/summary
 * - GET   /api/canteen/topups
 * - PATCH /api/canteen/topups/:id/approve
 * - PATCH /api/canteen/topups/:id/reject
 */

import { apiFetch } from './api';
import { isDummyMode } from '../dummy';
import {
  PPN_RATE,
  DEFAULT_NOMINAL_SALDO_LIST,
  generateSuperadminRiwayatTopUpDummy,
  getMenitFromNominal,
} from '../dummy/saldoDummy';

// Re-export konstanta tarif PPN
export { PPN_RATE };

const STORAGE_KEY_NOMINALS = 'pascall_superadmin_canteen_nominals_v1';
const STORAGE_KEY_NAT_HISTORY = 'pascall_superadmin_canteen_history_v1';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
    }
  } catch (err) {
    console.error('Error saving national history to localStorage:', err);
  }
}

export function getPendingTopupCountSync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NAT_HISTORY);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return 0;
    return list.filter((item) => item.status === 'PENDING' || item.status === 'Menunggu').length;
  } catch {
    return 0;
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * 1. Mengambil ringkasan data statistik top up dari Backend:
 *    GET /api/canteen/topup/summary
 *
 * @param {Object} [params] - { branchId, periode }
 * @returns {Promise<{ totalSaldoTerjual: number, totalPpn: number, totalTopupCount: number, totalPending: number }>}
 */
export async function getTopupSummary(params = {}) {
  if (isDummyMode()) {
    await delay(100);
    const history = getStoredNationalHistory();
    const successful = history.filter((item) => item.status === 'Berhasil' || item.status === 'APPROVED');
    const totalSaldoTerjual = successful.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
    const totalPpn = successful.reduce((sum, item) => sum + (Number(item.ppn) || 0), 0);
    const totalTopupCount = history.length;
    const totalPending = history.filter((item) => item.status === 'Menunggu' || item.status === 'PENDING').length;
    return { totalSaldoTerjual, totalPpn, totalTopupCount, totalPending };
  }

  const query = new URLSearchParams();
  if (params.branchId && params.branchId !== 'semua' && params.branchId !== 'ALL') {
    query.append('branchId', params.branchId);
  }
  if (params.periode) {
    query.append('periode', params.periode);
  }

  const qs = query.toString();
  const endpoint = qs ? `/api/canteen/topup/summary?${qs}` : '/api/canteen/topup/summary';
  const res = await apiFetch(endpoint);
  const data = res?.data || res || {};

  return {
    totalSaldoTerjual: Number(data.totalSaldoTerjual || data.totalNominalApproved || 0),
    totalPpn: Number(data.totalPpn || Math.round((data.totalSaldoTerjual || 0) * PPN_RATE)),
    totalTopupCount: Number(data.totalTopupCount || data.totalCount || 0),
    totalPending: Number(data.totalPendingCount || data.totalPending || 0),
  };
}

/**
 * 2. Mengambil daftar Paket Nominal Saldo yang dijual oleh Superadmin
 */
export async function getNominalSaldoList() {
  if (isDummyMode()) {
    await delay(120);
    return getStoredNominals();
  }
  // Saat ini BE belum memiliki tabel terpisah untuk preset nominal, gunakan konfigurasi default
  return getStoredNominals();
}

/**
 * 3. Menambah paket nominal saldo baru
 */
export async function createNominalSaldo(data) {
  const nominalNum = Number(data.nominal);
  if (!nominalNum || nominalNum <= 0) {
    throw new Error('Nominal saldo harus lebih dari Rp 0.');
  }

  const ppn = Math.round(nominalNum * PPN_RATE);
  const totalBayar = nominalNum + ppn;
  const status = data.status || 'Aktif';

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

/**
 * 4. Memperbarui paket nominal saldo
 */
export async function updateNominalSaldo(id, data) {
  if (!id) throw new Error('ID Nominal diperlukan.');

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

/**
 * 5. Mengubah status Aktif / Nonaktif nominal saldo
 */
export async function toggleNominalSaldoStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
  return await updateNominalSaldo(id, { status: newStatus });
}

/**
 * 6. Menghapus paket nominal saldo
 */
export async function deleteNominalSaldo(id) {
  if (!id) throw new Error('ID Nominal diperlukan.');
  const current = getStoredNominals();
  const updated = current.filter((item) => item.id !== id);
  saveStoredNominals(updated);
  return true;
}

/**
 * 7. Mengambil daftar riwayat transaksi top up kantin dari Backend
 *    GET /api/canteen/topups
 *
 * @param {{ search?: string, status?: string, branchId?: string, page?: number, limit?: number }} filter
 * @returns {Promise<Array>}
 */
export async function getSuperadminTopupHistory({
  search = '',
  status = 'semua',
  branchId = 'semua',
  page = 1,
  limit = 50,
} = {}) {
  if (isDummyMode()) {
    await delay(150);
    let list = getStoredNationalHistory();

    if (status && status !== 'semua') {
      list = list.filter((item) => item.status.toLowerCase() === status.toLowerCase());
    }

    if (branchId && branchId !== 'semua') {
      list = list.filter((item) => item.branchId === branchId || item.branchName?.toLowerCase().includes(branchId.toLowerCase()));
    }

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

    list.sort((a, b) => new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt));
    return list;
  }

  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (status && status !== 'semua' && status !== 'ALL') {
    params.append('status', status.toUpperCase());
  }
  if (branchId && branchId !== 'semua' && branchId !== 'ALL') {
    params.append('branchId', branchId);
  }
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));

  const qs = params.toString();
  const endpoint = qs ? `/api/canteen/topups?${qs}` : '/api/canteen/topups';
  const res = await apiFetch(endpoint);
  const items = res?.data || [];

  return items.map((item) => ({
    id: item.id,
    tanggal: item.createdAt,
    createdAt: item.createdAt,
    approvedAt: item.approvedAt || null,
    branchId: item.branchId,
    branchName: item.branchName || item.branch?.name || 'Cabang Lapas',
    staffName: item.user?.name || item.staffName || 'Operator Kantin',
    staffEmail: item.user?.email || item.staffEmail || '-',
    nominal: Number(item.nominal) || 0,
    ppn: Math.round((Number(item.nominal) || 0) * PPN_RATE),
    totalBayar: Number(item.nominal) + Math.round((Number(item.nominal) || 0) * PPN_RATE),
    menit: Number(item.minutes) || getMenitFromNominal(item.nominal),
    bankTarget: item.bankTarget || 'Rekening Lapas',
    proofUrl: item.proofUrl || null,
    status: item.status, // 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectReason: item.rejectReason || null,
    user: item.user || null,
  }));
}

/**
 * 8. Superadmin menyetujui transaksi top up kantin.
 *    PATCH /api/canteen/topups/:id/approve
 *
 * @param {string} id - ID Transaksi
 * @param {string} [notes] - Catatan persetujuan (opsional)
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function approveTopupTransaction(id, notes = '') {
  if (!id) throw new Error('ID Transaksi diperlukan.');

  if (isDummyMode()) {
    await delay(200);
    const history = getStoredNationalHistory();
    const index = history.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Transaksi top up tidak ditemukan.');

    const tx = history[index];
    tx.status = 'APPROVED';
    tx.approvedAt = new Date().toISOString();
    saveStoredNationalHistory(history);
    return { success: true, transaction: tx };
  }

  const res = await apiFetch(`/api/canteen/topups/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ notes: notes || undefined }),
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
  }

  return { success: true, data: res?.data || res };
}

/**
 * 9. Superadmin menolak transaksi top up kantin.
 *    PATCH /api/canteen/topups/:id/reject
 *
 * @param {string} id - ID Transaksi
 * @param {string} reason - Alasan penolakan (wajib diisi)
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function rejectTopupTransaction(id, reason = '') {
  if (!id) throw new Error('ID Transaksi diperlukan.');
  if (!reason || !reason.trim()) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  if (isDummyMode()) {
    await delay(200);
    const history = getStoredNationalHistory();
    const index = history.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Transaksi top up tidak ditemukan.');

    const tx = history[index];
    tx.status = 'REJECTED';
    tx.rejectReason = reason.trim();
    tx.rejectedAt = new Date().toISOString();
    saveStoredNationalHistory(history);
    return { success: true, transaction: tx };
  }

  const res = await apiFetch(`/api/canteen/topups/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: reason.trim() }),
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
  }

  return { success: true, data: res?.data || res };
}
