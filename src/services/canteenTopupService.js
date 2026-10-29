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

import { apiFetch, getAuthToken, API_BASE_URL } from './api';
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
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
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
  const token = getAuthToken();
  if (!token) {
    return { totalSaldoTerjual: 0, totalPpn: 0, totalTopupCount: 0, totalPending: 0 };
  }
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
  let items = [];
  if (Array.isArray(res?.data?.items)) items = res.data.items;
  else if (Array.isArray(res?.data?.data)) items = res.data.data;
  else if (Array.isArray(res?.data)) items = res.data;
  else if (Array.isArray(res?.items)) items = res.items;
  else if (Array.isArray(res)) items = res;

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
    dpp: Math.round((Number(item.nominal) || 0) / (1 + PPN_RATE)),
    ppn: (Number(item.nominal) || 0) - Math.round((Number(item.nominal) || 0) / (1 + PPN_RATE)),
    totalBayar: Number(item.nominal) || 0,
    menit: Number(item.minutes) || getMenitFromNominal(item.nominal),
    bankTarget: item.bankTarget || 'Rekening Lapas',
    proofUrl: item.proofUrl || null,
    proofStreamUrl: item.proofStreamUrl || (item.id && item.proofUrl ? `/api/canteen/topups/${item.id}/proof` : null),
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

  try {
    const res = await apiFetch(`/api/canteen/topups/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: notes || undefined }),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
      window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
      try {
        localStorage.setItem('pascall_billing_last_sync', Date.now().toString());
      } catch (_) {}
    }

    return { success: true, data: res?.data || res };
  } catch (apiErr) {
    console.warn('[canteenTopupService] approveTopupTransaction fallback offline:', apiErr?.message);
    const history = getStoredNationalHistory();
    const index = history.findIndex((item) => item.id === id);
    if (index !== -1) {
      history[index].status = 'APPROVED';
      history[index].approvedAt = new Date().toISOString();
      history[index].notes = notes;
      saveStoredNationalHistory(history);
      return { success: true, transaction: history[index] };
    }
    const fallbackTx = {
      id,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      notes,
    };
    history.unshift(fallbackTx);
    saveStoredNationalHistory(history);
    return { success: true, transaction: fallbackTx };
  }
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

  try {
    const res = await apiFetch(`/api/canteen/topups/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: reason.trim() }),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
      window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
      try {
        localStorage.setItem('pascall_billing_last_sync', Date.now().toString());
      } catch (_) {}
    }

    return { success: true, data: res?.data || res };
  } catch (apiErr) {
    console.warn('[canteenTopupService] rejectTopupTransaction fallback offline:', apiErr?.message);
    const history = getStoredNationalHistory();
    const index = history.findIndex((item) => item.id === id);
    if (index !== -1) {
      history[index].status = 'REJECTED';
      history[index].rejectReason = reason.trim();
      history[index].rejectedAt = new Date().toISOString();
      saveStoredNationalHistory(history);
      return { success: true, transaction: history[index] };
    }
    const fallbackTx = {
      id,
      status: 'REJECTED',
      rejectReason: reason.trim(),
      rejectedAt: new Date().toISOString(),
    };
    history.unshift(fallbackTx);
    saveStoredNationalHistory(history);
    return { success: true, transaction: fallbackTx };
  }
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

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const dueDate = new Date(targetYear, targetMonth, 2, 23, 59, 59, 999);
  const periodLabel = `${monthNames[targetMonth - 1]} ${targetYear}`;

  // 1. Coba panggil endpoint resmi Backend: GET /api/canteen/billing/national-summary
  try {
    const nationalRes = await apiFetch(`/api/canteen/billing/national-summary?month=${targetMonth}&year=${targetYear}`);
    const resData = nationalRes?.data || nationalRes;
    const branchesFromBe = resData?.branches;
    if (Array.isArray(branchesFromBe) && branchesFromBe.length > 0) {
      return branchesFromBe.map((b) => {
        let statusLabel = 'Bulan Berjalan';
        const st = (b.billingStatus || '').toUpperCase();
        if (st === 'PAID' || st === 'LUNAS') {
          statusLabel = 'Lunas';
        } else if (st === 'PENDING_CONFIRMATION' || st === 'PENDING') {
          statusLabel = 'Menunggu Konfirmasi';
        } else if (st === 'REJECTED') {
          statusLabel = 'Ditolak (Menunggak)';
        } else if (st === 'DITAGIHKAN' || st === 'BELUM_BAYAR') {
          statusLabel = 'Belum Dibayar (Tenggat 2 Hari)';
        } else if (st === 'DIBLOKIR') {
          statusLabel = 'Lewat Jatuh Tempo (Diblokir)';
        }

        return {
          branchId: b.branchId,
          branchName: b.branchName,
          branchCode: b.branchId ? b.branchId.slice(0, 4).toUpperCase() : 'UPT',
          kanwilName: b.kanwilName || 'Kanwil Kemenkumham',
          period: resData.period || periodLabel,
          month: targetMonth,
          year: targetYear,
          totalVouchers: b.totalTransactions || 0,
          totalMinutes: b.totalMinutes || 0,
          totalDpp: Math.round((b.dpp || 0) * 100) / 100,
          totalPpn: Math.round((b.ppn || 0) * 100) / 100,
          totalAmount: Number(b.totalAmount || 0),
          billingStatus: st === 'PAID' ? 'LUNAS' : (st === 'PENDING_CONFIRMATION' ? 'PENDING' : (st || 'BERJALAN')),
          statusLabel,
          isBlocked: st === 'DIBLOKIR' || st === 'REJECTED',
          dueDate: dueDate.toISOString(),
          dueDateFormatted: '2 ' + monthNames[targetMonth % 12] + ' ' + (targetMonth === 12 ? targetYear + 1 : targetYear),
          latestPayment: b.paymentProof
            ? {
                ...b.paymentProof,
                proofStreamUrl: b.paymentProof.proofStreamUrl || (b.paymentProof.id && b.paymentProof.proofUrl ? `/api/canteen/topups/${b.paymentProof.id}/proof` : null),
              }
            : null,
          transactions: b.transactions || [],
        };
      });
    }
  } catch (err) {
    console.warn('[canteenTopupService] Gagal memuat national-summary dari backend, fallback ke agregasi lokal:', err?.message || err);
  }

  // Fallback agregasi lokal jika backend offline
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
  const isPastMonth = endOfMonth < now;
  const isPastDue = now > dueDate;

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
    const approvedPayments = branchTopups.filter((tp) => tp.status === 'APPROVED');
    const totalApproved = approvedPayments.reduce((sum, tp) => sum + Number(tp.nominal || 0), 0);
    const pendingPayment = branchTopups.find((tp) => tp.status === 'PENDING');
    const rejectedPayment = branchTopups.find((tp) => tp.status === 'REJECTED');

    const remainingAmount = Math.max(0, totalAmount - totalApproved);

    let billingStatus = 'BERJALAN';
    let statusLabel = 'Bulan Berjalan';
    let isBlocked = false;

    if (!isPastMonth) {
      // Bulan Berjalan (misal Oktober 2026 saat ini)
      if (pendingPayment) {
        billingStatus = 'PENDING';
        statusLabel = 'Menunggu Konfirmasi';
      } else if (remainingAmount === 0 && totalAmount > 0) {
        billingStatus = 'LUNAS';
        statusLabel = 'Lunas';
      } else {
        billingStatus = 'BERJALAN';
        statusLabel = totalApproved > 0 ? 'Bulan Berjalan (Ada Tagihan Baru)' : 'Bulan Berjalan (Aktif)';
      }
    } else {
      // Bulan yang sudah lewat (misal September 2026 atau sebelumnya)
      if (totalAmount <= 0) {
        billingStatus = 'NIHIL';
        statusLabel = 'Tidak Ada Tagihan';
      } else if (pendingPayment) {
        billingStatus = 'PENDING';
        statusLabel = 'Menunggu Konfirmasi';
        isBlocked = isPastDue;
      } else if (remainingAmount === 0 && totalAmount > 0) {
        billingStatus = 'LUNAS';
        statusLabel = 'Lunas';
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
      latestPayment: pendingPayment
        ? {
            ...pendingPayment,
            proofStreamUrl: pendingPayment.proofStreamUrl || (pendingPayment.id && pendingPayment.proofUrl ? `/api/canteen/topups/${pendingPayment.id}/proof` : null),
          }
        : (approvedPayments[0] || rejectedPayment || null),
      transactions: branchTrx,
    };
  });

  return reports;
}

/**
 * 11. Mengambil detail transaksi voucher untuk cabang UPT tertentu pada periode tertentu
 * Digunakan untuk modal Rincian Transaksi Penjualan Masuk Tagihan di Superadmin.
 *
 * @param {string} branchId - ID Cabang UPT
 * @param {number} [monthParam] - Bulan (1-12)
 * @param {number} [yearParam] - Tahun (contoh: 2026)
 * @returns {Promise<Array>}
 */
export async function getCanteenBranchTransactions(branchId, monthParam, yearParam) {
  if (!branchId) return [];
  try {
    const targetMonth = monthParam !== undefined ? Number(monthParam) : new Date().getMonth() + 1;
    const targetYear = yearParam !== undefined ? Number(yearParam) : new Date().getFullYear();
    const monthStr = String(targetMonth).padStart(2, '0');
    const bulanParam = `${targetYear}-${monthStr}`;

    const res = await apiFetch(`/api/canteen/transactions?branchId=${encodeURIComponent(branchId)}&bulan=${bulanParam}&limit=100`);
    const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
    return items.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      kodeVoucher: t.kodeVoucher,
      inmate: t.inmate || null,
      inmateName: t.inmate?.name || t.inmateName || '-',
      inmateIdentifier: t.inmate?.identifier || t.inmateIdentifier || '-',
      package: t.package || null,
      packageName: t.package?.name || t.packageName || 'Paket Bicara',
      duration: t.duration || t.package?.durationMinutes || t.package?.duration || 0,
      cashier: t.cashier || null,
      cashierName: t.cashier?.name || t.cashierName || 'Kasir',
      totalAmount: Number(t.totalAmount || 0),
      dpp: Number(t.dpp || 0),
      ppn: Number(t.ppn || 0),
    }));
  } catch (err) {
    console.warn('[canteenTopupService] Gagal memuat transaksi cabang:', err?.message || err);
    return [];
  }
}

/**
 * 12. Menghasilkan URL streaming bukti pembayaran topup kantin dari backend (MinIO Proxy).
 *     GET /api/canteen/topups/:id/proof?token=...
 *     Backend akan mengalirkan gambar langsung dari MinIO dengan header image/jpeg atau image/png.
 *     Mendukung otentikasi via token query param sehingga bisa langsung dipasang pada tag <img> atau window.open.
 *
 * @param {string|object} topupOrId - Objek topup atau ID pengajuan top up
 * @returns {string|null} URL lengkap proxy streaming bukti transfer
 */
export function getTopupProofStreamUrl(topupOrId) {
  if (!topupOrId) return null;
  const id = typeof topupOrId === 'string' ? topupOrId : (topupOrId.id || topupOrId.topupId);
  if (!id) return null;

  // Jika item hanya bukti virtual mock tanpa berkas nyata
  if (typeof id === 'string' && id.startsWith('TOPUP-') && (!topupOrId.proofUrl || topupOrId.proofUrl === 'virtual-proof')) {
    return null;
  }

  const token = getAuthToken();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
  return `${cleanBase}/api/canteen/topups/${encodeURIComponent(id)}/proof${tokenQuery}`;
}

/**
 * 13. Mengunduh stream bukti pembayaran dari backend sebagai Blob menggunakan Authorization Bearer header.
 *
 * @param {string|object} topupOrId - ID transaksi atau objek topup
 * @returns {Promise<{ blob: Blob, objectUrl: string, contentType: string }>}
 */
export async function fetchTopupProofBlob(topupOrId) {
  const id = typeof topupOrId === 'string' ? topupOrId : (topupOrId.id || topupOrId.topupId);
  if (!id) throw new Error('ID Pengajuan top up diperlukan.');

  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${cleanBase}/api/canteen/topups/${encodeURIComponent(id)}/proof`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Gagal memuat bukti pembayaran: ${res.statusText} (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { blob, objectUrl, contentType };
}

