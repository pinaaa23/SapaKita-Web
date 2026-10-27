/**
 * Finance Service (Modul Keuangan & Penagihan Pembagian Hasil 4 Pihak)
 * Terintegrasi penuh dengan Backend API (/api/finance/*)
 * 
 * Skema Pembagian Hasil:
 * 1. Kepala UPT: 5%
 * 2. Koperasi: 30%
 * 3. Inkopasindo: 10%
 * 4. Vendor: 55%
 * Total = 100% (Konfigurasi persentase dinamis & tersinkronisasi di backend)
 */

import { apiFetch } from './api';

export const DEFAULT_REVENUE_SPLIT = {
  kepalaUpt: 5,
  koperasi: 30,
  inkopasindo: 10,
  vendor: 55,
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// In-memory cache untuk rendering cepat
let cachedContracts = [];
let cachedBillings = [];

/**
 * 1. Mengambil daftar kontrak seluruh UPT dari Backend
 * Endpoint: GET /api/finance/contracts
 */
export const getFinanceContracts = async () => {
  try {
    const res = await apiFetch('/api/finance/contracts');
    const data = res?.data || (Array.isArray(res) ? res : []);
    if (Array.isArray(data)) {
      cachedContracts = data;
      localStorage.setItem('pascall_finance_contracts_cache', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] Menggunakan cache lokal untuk contracts:', err);
    try {
      const raw = localStorage.getItem('pascall_finance_contracts_cache');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
  }
  return cachedContracts;
};

/**
 * 2. Memperbarui kontrak UPT di Backend
 * Endpoint: PUT /api/finance/contracts/:branchId
 */
export const saveFinanceContract = async (branchId, contractData) => {
  try {
    const res = await apiFetch(`/api/finance/contracts/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(contractData),
    });
    const updated = res?.data || res;
    window.dispatchEvent(new Event('finance_billing_updated'));
    return updated;
  } catch (err) {
    console.error('[FinanceService] Gagal memperbarui kontrak:', err);
    throw err;
  }
};

/**
 * 3. Mengambil seluruh tagihan bulanan
 * Endpoint: GET /api/finance/billings
 */
export const getAllFinanceBillings = async () => {
  return await getFinanceBillings({});
};

/**
 * 4. Mengambil tagihan dengan filter query
 * Endpoint: GET /api/finance/billings?month=...&year=...
 */
export const getFinanceBillings = async ({ month, year, branchId, status, search } = {}) => {
  try {
    const params = new URLSearchParams();
    if (month && month !== 'semua') params.append('month', String(month));
    if (year && year !== 'semua') params.append('year', String(year));
    if (branchId && branchId !== 'semua') params.append('branchId', String(branchId));
    if (status && status !== 'semua') params.append('status', String(status));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/finance/billings${qs}`);
    const data = res?.data || (Array.isArray(res) ? res : []);
    if (Array.isArray(data)) {
      cachedBillings = data;
      localStorage.setItem('pascall_finance_billings_cache', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] Menggunakan cache lokal untuk billings:', err);
    try {
      const raw = localStorage.getItem('pascall_finance_billings_cache');
      if (raw) {
        let list = JSON.parse(raw);
        if (month && month !== 'semua') list = list.filter((b) => b.month === Number(month));
        if (year && year !== 'semua') list = list.filter((b) => b.year === Number(year));
        if (status && status !== 'semua') list = list.filter((b) => b.status === status);
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          list = list.filter((b) => b.branchName?.toLowerCase().includes(q) || b.id?.toLowerCase().includes(q));
        }
        return list;
      }
    } catch (_) {}
  }
  return cachedBillings;
};

/**
 * 5. Ringkasan Dashboard Keuangan dari Backend
 * Endpoint: GET /api/finance/summary?month=...&year=...
 */
export const getFinanceSummary = async (month = null, year = 2026) => {
  try {
    const params = new URLSearchParams();
    if (month && month !== 'semua') params.append('month', String(month));
    if (year && year !== 'semua') params.append('year', String(year));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/finance/summary${qs}`);
    if (res?.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('[FinanceService] Gagal memuat summary dari server:', err);
  }

  // Fallback kalkulasi lokal jika backend sedang offline
  const all = cachedBillings || [];
  const filtered = all.filter((b) => {
    if (year && b.year !== Number(year)) return false;
    if (month && month !== 'semua' && b.month !== Number(month)) return false;
    return true;
  });

  const totalOmsetKotor = filtered.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalPaid = filtered.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalPending = filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalUnpaid = filtered.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

  return {
    totalRecords: filtered.length,
    totalOmsetKotor,
    totalPaid,
    totalPending,
    totalUnpaid,
    shares: {
      kepalaUpt: filtered.reduce((acc, b) => acc + (b.shares?.kepalaUpt?.amount || 0), 0),
      koperasi: filtered.reduce((acc, b) => acc + (b.shares?.koperasi?.amount || 0), 0),
      inkopasindo: filtered.reduce((acc, b) => acc + (b.shares?.inkopasindo?.amount || 0), 0),
      vendor: filtered.reduce((acc, b) => acc + (b.shares?.vendor?.amount || 0), 0),
    },
    counts: {
      paid: filtered.filter((b) => b.status === 'PAID').length,
      pending: filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').length,
      unpaid: filtered.filter((b) => b.status === 'UNPAID').length,
    },
  };
};

/**
 * 6. Hitung setoran kantin yang menunggu konfirmasi (Pending)
 * Endpoint: GET /api/finance/billings/pending-count
 */
export const getPendingCanteenDepositCount = async () => {
  try {
    const res = await apiFetch('/api/finance/billings/pending-count');
    return res?.count || res?.data?.count || 0;
  } catch (err) {
    return cachedBillings.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
  }
};

/**
 * 7. Setujui (ACC) Setoran Pembayaran dari Kantin
 * Endpoint: PATCH /api/finance/billings/:id/approve
 */
export const approveCanteenDeposit = async (billingId, notes = '', paymentDate = null) => {
  try {
    const res = await apiFetch(`/api/finance/billings/${billingId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({
        notes: notes || 'Setoran kasir/kantin telah diverifikasi dan disetujui (ACC) oleh Admin Keuangan.',
        paymentDate: paymentDate || new Date().toISOString(),
      }),
    });
    window.dispatchEvent(new Event('finance_billing_updated'));
    return res?.data || res;
  } catch (err) {
    console.error('[FinanceService] Gagal menyetujui setoran:', err);
    throw err;
  }
};

/**
 * 8. Tolak Bukti Setoran dari Kantin
 * Endpoint: PATCH /api/finance/billings/:id/reject
 */
export const rejectCanteenDeposit = async (billingId, reason = '', notes = '') => {
  try {
    const res = await apiFetch(`/api/finance/billings/${billingId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason: reason || 'Bukti transfer tidak valid atau nominal setoran tidak sesuai',
        notes: notes || `Ditolak oleh Finance: ${reason}`,
      }),
    });
    window.dispatchEvent(new Event('finance_billing_updated'));
    return res?.data || res;
  } catch (err) {
    console.error('[FinanceService] Gagal menolak setoran:', err);
    throw err;
  }
};

/**
 * 9. Update status tagihan (kompatibilitas dengan kode lama)
 */
export const updateFinanceBillingStatus = async (billingId, newStatus, extraData = {}) => {
  if (newStatus === 'PAID') {
    return await approveCanteenDeposit(billingId, extraData.notes, extraData.paymentDate);
  } else if (newStatus === 'UNPAID') {
    return await rejectCanteenDeposit(billingId, extraData.rejectionReason || extraData.notes);
  }
  return null;
};

/**
 * Format Rupiah helper
 */
export const formatRupiah = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};
