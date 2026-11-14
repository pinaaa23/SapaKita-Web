import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path riwayat transaksi kantin & voucher WBP
export const CANTEEN_TRANSACTIONS_ENDPOINT = '/api/canteen/transactions';
export const CANTEEN_TRANSACTION_DETAIL_ENDPOINT = (id) => `/api/canteen/transactions/${encodeURIComponent(id)}`;

// Backward-compatible constants
export const BALANCE_TRANSACTIONS_ENDPOINT = CANTEEN_TRANSACTIONS_ENDPOINT;
export const BALANCE_TRANSACTION_DETAIL_ENDPOINT = CANTEEN_TRANSACTION_DETAIL_ENDPOINT;

/**
 * Mapper fleksibel untuk membaca setiap item transaksi pembelian paket kantin / voucher WBP
 */
export const mapBalanceTransaction = (item) => {
  if (!item) return null;

  const rawStatus = (item.status || 'BERHASIL').toUpperCase();
  const normalizedStatus = rawStatus === 'BERHASIL' || rawStatus === 'SUCCESS' ? 'Berhasil' : 'Gagal';

  const amount = typeof item.totalAmount === 'number'
    ? item.totalAmount
    : typeof item.amount === 'number'
      ? item.amount
      : (Number(item.totalAmount || item.amount || item.package?.price || item.packagePrice) || 0);

  const packageName = item.package?.name || item.packageName || item.description || 'Paket Komunikasi';
  const durationMinutes = item.package?.durationMinutes || item.packageDuration || item.durationMinutes || 0;
  const packagePrice = Number(item.package?.price || item.packagePrice || amount);

  const inmateId = item.inmate?.identifier || item.inmateIdentifier || item.inmateId || item.user?.identifier || '-';
  const inmateName = item.inmate?.name || item.inmateName || item.user?.name || 'Warga Binaan';
  const inmateBlock = item.inmate?.blockRoom || item.inmateBlock || '-';
  const inmatePhone = item.inmate?.phone || item.inmatePhone || '';

  const cashierName = item.cashier?.name || item.officerName || item.performedByUser?.name || 'Petugas Kasir';

  return {
    id: item.id || item.transactionId || item._id || '-',
    kodeVoucher: item.kodeVoucher || '-',
    inmateId,
    inmateName,
    inmateBlock,
    inmatePhone,
    packageId: item.package?.id || item.packageId || '',
    packageName,
    durationMinutes,
    packagePrice,
    amount,
    totalAmount: amount,
    category: 'Kantin',
    description: item.description || (durationMinutes ? `Pembelian ${packageName} (${durationMinutes} Menit)` : `Pembelian ${packageName}`),
    officerId: item.cashier?.id || item.cashierId || item.officerId || '',
    officerName: cashierName,
    cashier: item.cashier || { id: item.cashierId || '', name: cashierName },
    method: item.paymentMethod === 'TUNAI' ? 'Tunai' : (item.paymentMethod || item.method || 'Tunai'),
    paymentMethod: item.paymentMethod || item.method || 'TUNAI',
    status: normalizedStatus,
    date: item.createdAt || item.date || item.waktu || new Date().toISOString(),
    createdAt: item.createdAt || item.date || item.waktu || new Date().toISOString(),
    isVoucherUsed: Boolean(item.isVoucherUsed),
    voucherUsedAt: item.voucherUsedAt || null,
    dpp: typeof item.dpp === 'number' ? item.dpp : (Number(item.dpp || item.payment?.dpp) || 0),
    ppn: typeof item.ppn === 'number' ? item.ppn : (Number(item.ppn || item.payment?.ppn) || 0),
    branchId: item.branchId || item.inmate?.branchId || '',
    notes: item.notes || '',
    balanceBefore: typeof item.balanceBefore === 'number' ? item.balanceBefore : 0,
    balanceAfter: typeof item.balanceAfter === 'number' ? item.balanceAfter : 0,
  };
};

/**
 * Mengambil daftar transaksi pembelian paket kantin / voucher WBP
 */
export const getBalanceTransactions = async ({
  search = '',
  page = 1,
  limit = 20,
  status = '',
  category = '',
  branchId = '',
  officerId = '',
  startDate = '',
  endDate = '',
  periode = '',
} = {}) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    let trxs = dummyStore.getTransactions({
      branchId: branchId || null,
      category: category || '',
      search: search || '',
    });

    if (status && status !== 'All') {
      trxs = trxs.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    const total = trxs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = trxs.slice(startIndex, startIndex + limit).map(mapBalanceTransaction);

    const totalOmzet = trxs
      .filter((t) => t.status === 'Berhasil' || t.status === 'BERHASIL' || t.status === 'SUCCESS')
      .reduce((sum, t) => sum + (Number(t.amount || t.totalAmount) || 0), 0);

    return {
      items: paginated,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      totalOmzet,
      totalPemakaian: totalOmzet,
      totalPanggilan: 0,
      totalKantin: totalOmzet,
      totalVoucherUsed: paginated.filter((t) => t.isVoucherUsed).length,
      totalVoucherActive: paginated.filter((t) => !t.isVoucherUsed).length,
    };
  }

  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (branchId && branchId !== 'All' && branchId !== 'all') {
    params.append('branchId', typeof branchId === 'string' ? branchId.trim() : branchId);
  }
  if (status && status !== 'All' && status !== 'all') params.append('status', status);

  // Filter periode / tanggal jika ada
  if (periode && ['harian', 'bulanan', 'tahunan'].includes(periode)) {
    params.append('periode', periode);
  }
  if (startDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      params.append('tanggal', startDate);
    } else if (/^\d{4}-\d{2}$/.test(startDate)) {
      params.append('bulan', startDate);
    } else if (/^\d{4}$/.test(startDate)) {
      params.append('tahun', startDate);
    }
  }

  const queryString = params.toString();
  const primaryUrl = queryString ? `${CANTEEN_TRANSACTIONS_ENDPOINT}?${queryString}` : CANTEEN_TRANSACTIONS_ENDPOINT;

  try {
    let res;
    try {
      res = await apiFetch(primaryUrl);
    } catch (primaryErr) {
      // Jika endpoint kantin 404 di lingkungan lama, fallback ke endpoint saldo lama
      if (primaryErr?.status === 404) {
        console.warn('[BalanceService] /api/canteen/transactions 404, fallback ke /api/balance/transactions');
        const fallbackUrl = queryString ? `/api/balance/transactions?${queryString}` : '/api/balance/transactions';
        res = await apiFetch(fallbackUrl);
      } else {
        throw primaryErr;
      }
    }

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.transactions)
            ? res.transactions
            : [];

    let mappedItems = rawList.map(mapBalanceTransaction).filter(Boolean);

    // Sinkronkan status voucher dari riwayat panggilan riil di backend
    try {
      // 1. Ambil data rekaman panggilan untuk memeriksa voucher terpakai (HANYA jika role memiliki hak akses rekaman)
      let recordingList = [];
      const storedRole = localStorage.getItem('role') || localStorage.getItem('user_role');
      const canAccessRecordings = storedRole && (
        storedRole.toLowerCase().includes('kepala') || 
        storedRole.toLowerCase().includes('branch') || 
        storedRole.toLowerCase().includes('superadmin') || 
        storedRole.toLowerCase().includes('kanwil')
      );
      if (canAccessRecordings) {
        try {
          const recRes = await apiFetch('/api/recordings?limit=100');
          recordingList = Array.isArray(recRes) ? recRes : (recRes?.items || recRes?.data || []);
        } catch {
          // Abaikan jika belum ada rekaman
        }
      }

      const allCalls = recordingList;

      // Kumpulkan kode voucher yang tercatat di panggilan
      const usedVoucherSet = new Set();
      // Kumpulkan hitungan panggilan berhasil / terhubung per nama/NIP WBP
      const answeredInmateCalls = new Map();

      allCalls.forEach((r) => {
        const c = r.call || r;
        const vCode = c.voucherCode || r.voucherCode || r.voucher;
        if (vCode) {
          usedVoucherSet.add(String(vCode).trim().toUpperCase());
        }

        const isAnswered = c.status === 'Answered' || c.status === 'COMPLETED' || c.status === 'Terjawab' || (Number(c.durationSeconds) > 0);
        if (isAnswered) {
          const inmateId = c.inmate?.identifier || c.inmateId || c.inmateIdentifier || '';
          const inmateName = (c.inmate?.name || c.inmateName || '').trim().toLowerCase();

          if (inmateId) {
            const key = `id:${inmateId.toLowerCase()}`;
            answeredInmateCalls.set(key, (answeredInmateCalls.get(key) || 0) + 1);
          }
          if (inmateName && inmateName !== '-' && inmateName !== 'narapidana') {
            const key = `name:${inmateName}`;
            answeredInmateCalls.set(key, (answeredInmateCalls.get(key) || 0) + 1);
          }
        }
      });

      // Tautkan voucher dengan data panggilan riil
      // Salin counter pemakaian agar dapat dialokasikan per transaksi WBP
      const remainingCallsForInmate = new Map(answeredInmateCalls);

      mappedItems = mappedItems.map((t) => {
        const vUpper = String(t.kodeVoucher || '').trim().toUpperCase();

        // 1. Tertaut langsung via voucherCode di panggilan
        if (vUpper && usedVoucherSet.has(vUpper)) {
          return { ...t, isVoucherUsed: true };
        }

        // 2. Tertaut via panggilan riil yang telah dilakukan oleh WBP tersebut
        const idKey = t.inmateId ? `id:${String(t.inmateId).toLowerCase()}` : null;
        const nameKey = t.inmateName ? `name:${String(t.inmateName).trim().toLowerCase()}` : null;

        const callsLeftById = idKey ? (remainingCallsForInmate.get(idKey) || 0) : 0;
        const callsLeftByName = nameKey ? (remainingCallsForInmate.get(nameKey) || 0) : 0;

        if (callsLeftById > 0 || callsLeftByName > 0) {
          if (idKey && callsLeftById > 0) remainingCallsForInmate.set(idKey, callsLeftById - 1);
          if (nameKey && callsLeftByName > 0) remainingCallsForInmate.set(nameKey, callsLeftByName - 1);
          return { ...t, isVoucherUsed: true };
        }

        return t;
      });
    } catch (syncErr) {
      console.warn('[BalanceService] Gagal sinkronisasi voucher panggilan riil:', syncErr);
    }

    // Filter status di sisi client jika BE belum menfilter
    if (status && status !== 'All') {
      mappedItems = mappedItems.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    const total = typeof res?.total === 'number'
      ? res.total
      : typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : mappedItems.length;

    const totalPages = typeof res?.totalPages === 'number'
      ? res.totalPages
      : typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(total / limit));

    const totalOmzet = mappedItems
      .filter((t) => t.status === 'Berhasil')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalVoucherUsed = mappedItems.filter((t) => t.isVoucherUsed).length;
    const totalVoucherActive = mappedItems.filter((t) => !t.isVoucherUsed).length;

    return {
      items: mappedItems,
      total,
      page: Number(res?.page || res?.pagination?.page || page),
      limit: Number(res?.limit || res?.pagination?.limit || limit),
      totalPages,
      totalOmzet,
      totalPemakaian: totalOmzet,
      totalPanggilan: 0,
      totalKantin: totalOmzet,
      totalVoucherUsed,
      totalVoucherActive,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
    }
    console.error('[BalanceService] Gagal memuat data transaksi dari BE:', error?.message || error);
    throw error;
  }
};

/**
 * Mengambil detail transaksi pembelian paket kantin berdasarkan ID
 */
export const getTransactionById = async (id) => {
  if (!id) throw new Error('ID Transaksi diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const trxs = dummyStore.getTransactions();
    const found = trxs.find((t) => t.id === id || t.transactionId === id || t.kodeVoucher === id);
    if (found) return mapBalanceTransaction(found);
    throw new Error('Data transaksi tidak ditemukan');
  }

  const endpoint = CANTEEN_TRANSACTION_DETAIL_ENDPOINT(id);
  try {
    let res;
    try {
      res = await apiFetch(endpoint);
    } catch (primaryErr) {
      if (primaryErr?.status === 404) {
        // Fallback ke endpoint lama jika diperlukan
        res = await apiFetch(`/api/balance/transactions/${encodeURIComponent(id)}`);
      } else {
        throw primaryErr;
      }
    }

    const item = res?.data || res?.item || res?.transaction || res;
    if (item) return mapBalanceTransaction(item);
    throw new Error('Data transaksi tidak ditemukan');
  } catch (error) {
    if (error?.status === 401) {
      logout();
    }
    console.error(`[BalanceService] Gagal memuat detail transaksi (${id}):`, error?.message || error);
    throw error;
  }
};

export default {
  CANTEEN_TRANSACTIONS_ENDPOINT,
  CANTEEN_TRANSACTION_DETAIL_ENDPOINT,
  BALANCE_TRANSACTIONS_ENDPOINT,
  BALANCE_TRANSACTION_DETAIL_ENDPOINT,
  mapBalanceTransaction,
  getBalanceTransactions,
  getTransactionById,
};

