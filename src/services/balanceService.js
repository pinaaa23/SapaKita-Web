import { apiFetch, logout } from './api';

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

  const category = (item.category || (item.type === 'CALL' ? 'Panggilan' : (item.type === 'CANTEEN' ? 'Kantin' : 'Panggilan')));

  return {
    id: item.id || item.transactionId || item._id || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
    inmateId: item.inmate?.identifier || item.inmateId || item.inmateIdentifier || '-',
    inmateName: item.inmate?.name || item.inmateName || 'Warga Binaan',
    amount: typeof item.amount === 'number' ? item.amount : (Number(item.amount) || 0),
    category,
    description: item.description || item.keterangan || (category === 'Panggilan' ? 'Pemakaian Durasi Panggilan' : 'Pembelian Kantin'),
    officerId: item.officerId || item.officer?.id || '',
    officerName: item.officer?.name || item.officerName || 'Sistem (Otomatis)',
    method: item.method || 'Potong Saldo',
    status: normalizedStatus,
    date: item.date || item.createdAt || new Date().toISOString(),
    balanceBefore: typeof item.balanceBefore === 'number' ? item.balanceBefore : 0,
    balanceAfter: typeof item.balanceAfter === 'number' ? item.balanceAfter : 0,
    branchId: item.branchId || item.inmate?.branchId || 'b1',
  };
};

/**
 * Mengambil daftar mutasi saldo / transaksi dengan pencarian dan filter
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
    console.log('[BalanceService] Response GET /api/balance/transactions:', res);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.transactions)
            ? res.transactions
            : [];

    const total = typeof res?.total === 'number'
      ? res.total
      : typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : rawList.length;

    const totalPages = typeof res?.totalPages === 'number'
      ? res.totalPages
      : typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(total / limit));

    return {
      items: rawList.map(mapBalanceTransaction).filter(Boolean),
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
      throw error;
    }
    console.log('[BalanceService] Fallback data kosong mutasi transaksi:', error?.message || error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
      totalPemakaian: 0,
      totalPanggilan: 0,
      totalKantin: 0,
    };
  }
};

/**
 * Mengambil detail mutasi transaksi berdasarkan ID
 */
export const getTransactionById = async (id) => {
  if (!id) throw new Error('ID Transaksi diperlukan');

  const endpoint = BALANCE_TRANSACTION_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint);
    console.log(`[BalanceService] Response GET ${endpoint}:`, res);
    const item = res?.data || res?.item || res?.transaction || res;
    return mapBalanceTransaction(item);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[BalanceService] Gagal memuat detail transaksi (${id}):`, error?.message || error);
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
