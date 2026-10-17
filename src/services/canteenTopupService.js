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

const STORAGE_KEY_NAT_HISTORY = 'pascall_superadmin_canteen_history_v1';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

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

const STORAGE_KEY_PENDING_COUNT = 'pascall_pending_topup_count_v1';

export function getPendingTopupCountSync() {
  try {
    const directCount = localStorage.getItem(STORAGE_KEY_PENDING_COUNT);
    if (directCount !== null && !isNaN(Number(directCount))) {
      return Number(directCount);
    }
    const raw = localStorage.getItem(STORAGE_KEY_NAT_HISTORY);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return 0;
    return list.filter((item) => item.status === 'PENDING' || item.status === 'Menunggu').length;
  } catch {
    return 0;
  }
}

export function setPendingTopupCountSync(count) {
  try {
    const num = Math.max(0, Number(count) || 0);
    const prev = localStorage.getItem(STORAGE_KEY_PENDING_COUNT);
    if (prev !== String(num)) {
      localStorage.setItem(STORAGE_KEY_PENDING_COUNT, String(num));
    }
  } catch (err) {
    console.error('Error saving pending topup count:', err);
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

  const result = {
    totalSaldoTerjual: Number(data.totalSaldoTerjual || data.totalNominalApproved || 0),
    totalPpn: Number(data.totalPpn || Math.round((data.totalSaldoTerjual || 0) * PPN_RATE)),
    totalTopupCount: Number(data.totalTopupCount || data.totalCount || 0),
    totalPending: Number(data.totalPendingCount || data.totalPending || 0),
  };

  setPendingTopupCountSync(result.totalPending);
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

/**
 * 10. Mengambil laporan rekapitulasi tagihan pascabayar dari SEMUA UPT / Kantin (Superadmin)
 * Menghitung rincian voucher, menit terjual, DPP, PPN, status lunas/pending, dan jatuh tempo (H+2).
 *
 * @param {number} [monthParam] - 1 sampai 12
 * @param {number} [yearParam] - contoh 2026
 * @returns {Promise<Array>}
 */
export async function getAllCanteenBillingReport(monthParam, yearParam) {
  const now = new Date();
  const targetMonth = monthParam !== undefined ? Number(monthParam) : now.getMonth() + 1;
  const targetYear = yearParam !== undefined ? Number(yearParam) : now.getFullYear();

  // 1. Ambil daftar cabang UPT
  const branchesRes = await apiFetch('/api/branches?limit=200').catch(() => ({ items: [] }));
  const branches = branchesRes?.items || branchesRes?.data || (Array.isArray(branchesRes) ? branchesRes : []);

  // 2. Ambil seluruh transaksi voucher kantin
  const trxRes = await apiFetch('/api/canteen/transactions?page=1&limit=1000').catch(() => ({ data: [] }));
  const allTrx = trxRes?.data || [];

  // 3. Ambil riwayat pembayaran tagihan (topup requests)
  const topupsRes = await apiFetch('/api/canteen/topups?limit=200').catch(() => ({ data: [] }));
  const allTopups = topupsRes?.data || topupsRes?.items || (Array.isArray(topupsRes) ? topupsRes : []);

  // Hitung batas periode bulan & tahun yang dipilih
  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  // Batas jatuh tempo: 2 hari setelah akhir periode (Tanggal 2 bulan berikutnya pukul 23:59:59)
  const dueDate = new Date(targetYear, targetMonth, 2, 23, 59, 59, 999);
  const isPastMonth = endOfMonth < now;
  const isPastDue = now > dueDate;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const periodLabel = `${monthNames[targetMonth - 1]} ${targetYear}`;

  const reports = branches.map((branch) => {
    // Filter transaksi untuk cabang ini dalam periode
    const branchTrx = allTrx.filter((t) => {
      if (t.branchId !== branch.id) return false;
      const tDate = new Date(t.createdAt);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    });

    const totalVouchers = branchTrx.length;
    const totalMinutes = branchTrx.reduce((acc, t) => acc + Number(t.duration || t.package?.duration || 0), 0);
    const totalAmount = branchTrx.reduce((acc, t) => acc + Number(t.totalAmount || 0), 0);
    const totalDpp = branchTrx.reduce((acc, t) => acc + Number(t.dpp || 0), 0);
    const totalPpn = branchTrx.reduce((acc, t) => acc + Number(t.ppn || 0), 0);

    // Cek pembayaran tagihan cabang ini
    const branchTopups = allTopups.filter((tp) => tp.branchId === branch.id);
    const approvedPayment = branchTopups.find((tp) => tp.status === 'APPROVED');
    const pendingPayment = branchTopups.find((tp) => tp.status === 'PENDING');
    const rejectedPayment = branchTopups.find((tp) => tp.status === 'REJECTED');

    let billingStatus = 'BERJALAN';
    let statusLabel = 'Bulan Berjalan';
    let isBlocked = false;

    if (!isPastMonth) {
      // Bulan Berjalan (misal Oktober 2026 saat ini)
      if (approvedPayment) {
        billingStatus = 'LUNAS';
        statusLabel = 'Lunas';
      } else if (pendingPayment) {
        billingStatus = 'PENDING';
        statusLabel = 'Menunggu Konfirmasi';
      } else {
        billingStatus = 'BERJALAN';
        statusLabel = 'Bulan Berjalan (Aktif)';
      }
    } else {
      // Bulan yang sudah lewat (misal September 2026 atau sebelumnya)
      if (totalAmount <= 0) {
        billingStatus = 'NIHIL';
        statusLabel = 'Tidak Ada Tagihan';
      } else if (approvedPayment) {
        billingStatus = 'LUNAS';
        statusLabel = 'Lunas';
      } else if (pendingPayment) {
        billingStatus = 'PENDING';
        statusLabel = 'Menunggu Konfirmasi';
        isBlocked = isPastDue;
      } else if (rejectedPayment) {
        billingStatus = 'REJECTED';
        statusLabel = 'Ditolak (Menunggak)';
        isBlocked = true;
      } else {
        if (isPastDue) {
          billingStatus = 'DIBLOKIR';
          statusLabel = 'Lewat Jatuh Tempo (Diblokir)';
          isBlocked = true;
        } else {
          billingStatus = 'BELUM_BAYAR';
          statusLabel = 'Belum Dibayar (Tenggat 2 Hari)';
        }
      }
    }

    return {
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code || branch.id.slice(0, 4).toUpperCase(),
      kanwilName: branch.kanwil?.name || branch.kanwilProvince || 'Kanwil Kemenkumham',
      period: periodLabel,
      month: targetMonth,
      year: targetYear,
      totalVouchers,
      totalMinutes,
      totalDpp: Math.round(totalDpp * 100) / 100,
      totalPpn: Math.round(totalPpn * 100) / 100,
      totalAmount,
      billingStatus,
      statusLabel,
      isBlocked,
      dueDate: dueDate.toISOString(),
      dueDateFormatted: '2 ' + monthNames[targetMonth % 12] + ' ' + (targetMonth === 12 ? targetYear + 1 : targetYear),
      latestPayment: approvedPayment || pendingPayment || rejectedPayment || null,
      transactions: branchTrx,
    };
  });

  return reports;
}
