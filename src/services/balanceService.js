import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const BALANCE_TRANSACTIONS_ENDPOINT = '/api/balance/transactions';
export const BALANCE_TRANSACTION_DETAIL_ENDPOINT = (id) => `/api/balance/transactions/${id}`;

/**
 * Mapper fleksibel untuk membaca setiap item mutasi saldo / transaksi
 */
export const mapBalanceTransaction = (item) => {
  if (!item) return null;

  const rawStatus = (item.status || 'SUCCESS').toUpperCase();
  const normalizedStatus = rawStatus === 'SUCCESS' || rawStatus === 'BERHASIL' ? 'Berhasil' : 'Gagal';

  // Mapping kategori sesuai enum BE: TOPUP_CASH -> Kantin, CALL_CHARGE -> Panggilan
  const rawType = (item.type || '').toUpperCase();
  let category = 'Panggilan';
  if (rawType === 'TOPUP_CASH' || item.category === 'Kantin') {
    category = 'Kantin';
  } else if (rawType === 'CALL_CHARGE' || item.category === 'Panggilan') {
    category = 'Panggilan';
  } else if (item.category) {
    category = item.category;
  }

  return {
    id: item.id || item.transactionId || item._id || '-',
    inmateId: item.inmate?.identifier || item.inmateId || item.inmateIdentifier || item.user?.identifier || '-',
    inmateName: item.inmate?.name || item.inmateName || item.user?.name || 'Warga Binaan',
    amount: typeof item.amount === 'number' ? item.amount : (Number(item.amount) || 0),
    category,
    description: item.description || item.keterangan || (category === 'Panggilan' ? 'Pemakaian Durasi Panggilan' : 'Topup / Kantin'),
    officerId: item.officerId || item.officer?.id || item.performedBy || '',
    officerName: item.officer?.name || item.officerName || (item.performedBy ? `Petugas (${item.performedBy})` : 'Sistem (Otomatis)'),
    method: item.method || 'Potong Saldo',
    status: normalizedStatus,
    date: item.date || item.createdAt || new Date().toISOString(),
    balanceBefore: typeof item.balanceBefore === 'number' ? item.balanceBefore : (Number(item.balanceBefore) || 0),
    balanceAfter: typeof item.balanceAfter === 'number' ? item.balanceAfter : (Number(item.balanceAfter) || 0),
    branchId: item.branchId || item.inmate?.branchId || item.user?.branchId || '',
  };
};

/**
 * Mengambil daftar mutasi saldo / transaksi
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

    const totalPemakaian = trxs
      .filter((t) => t.category === 'Panggilan' || t.type === 'CALL_CHARGE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalKantin = trxs
      .filter((t) => t.category === 'Kantin' || t.type === 'TOPUP_CASH')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      items: paginated,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      totalPemakaian,
      totalPanggilan: totalPemakaian,
      totalKantin,
    };
  }

  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (status && status !== 'All') params.append('status', status);
  if (category && category !== 'All') params.append('category', category);
  if (branchId && branchId !== 'All') params.append('branchId', branchId);
  if (officerId && officerId !== 'All') params.append('officerId', officerId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  const url = queryString ? `${BALANCE_TRANSACTIONS_ENDPOINT}?${queryString}` : BALANCE_TRANSACTIONS_ENDPOINT;

  try {
    const res = await apiFetch(url);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.transactions)
            ? res.transactions
            : [];

    const mappedItems = rawList.map(mapBalanceTransaction).filter(Boolean);

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

    return {
      items: mappedItems,
      total,
      page: Number(res?.page || res?.pagination?.page || page),
      limit: Number(res?.limit || res?.pagination?.limit || limit),
      totalPages,
      totalPemakaian: typeof res?.totalPemakaian === 'number' ? res.totalPemakaian : null,
      totalPanggilan: typeof res?.totalPanggilan === 'number' ? res.totalPanggilan : null,
      totalKantin: typeof res?.totalKantin === 'number' ? res.totalKantin : null,
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
 * Mengambil detail mutasi transaksi berdasarkan ID
 */
export const getTransactionById = async (id) => {
  if (!id) throw new Error('ID Transaksi diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const trxs = dummyStore.getTransactions();
    const found = trxs.find((t) => t.id === id || t.transactionId === id);
    if (found) return mapBalanceTransaction(found);
    throw new Error('Data transaksi tidak ditemukan');
  }

  const endpoint = BALANCE_TRANSACTION_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint);
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
  BALANCE_TRANSACTIONS_ENDPOINT,
  BALANCE_TRANSACTION_DETAIL_ENDPOINT,
  mapBalanceTransaction,
  getBalanceTransactions,
  getTransactionById,
};

