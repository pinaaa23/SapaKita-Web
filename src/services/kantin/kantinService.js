import { apiFetch, logout, getAuthUser } from '../api';
import { getPaketKantin } from '../packageService';
import { getInmates } from '../inmateService';
import { isDummyMode } from '../../dummy';
import { kurangiSaldoKantin } from './saldoService';

/**
 * Mengambil daftar paket komunikasi aktif untuk kasir kantin.
 * Terhubung langsung dengan konfigurasi paket Superadmin.
 */
export async function getPaket(kategori = 'telepon') {
  return await getPaketKantin({ kategori });
}

/**
 * Mencari data warga binaan berdasarkan NIP / Nomor Registrasi atau Nomor Telepon.
 */
export async function cariWbpByIdAtauTelp(queryInput) {
  if (!queryInput) return null;
  const rawQuery = queryInput.toString().trim();
  const user = getAuthUser();
  const userBranchId = user?.branchId || user?.branch?.id;
  const userBranchName =
    user?.branch?.name ||
    user?.branchName ||
    (typeof user?.branch === 'string' ? user.branch : '') ||
    'cabang ini';

  try {
    const res = await getInmates({
      search: rawQuery,
      branchId: userBranchId,
      branchName: userBranchName,
      limit: 20,
    });

    let items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);

    // Jika belum ketemu dengan query asli, coba cari berdasarkan angka intinya (misal NIP-8192 -> 8192)
    if (items.length === 0) {
      const qDigits = rawQuery.replace(/[^0-9]/g, '');
      if (qDigits.length >= 2) {
        const resDigits = await getInmates({
          search: qDigits,
          branchId: userBranchId,
          branchName: userBranchName,
          limit: 20,
        });
        items = Array.isArray(resDigits?.items) ? resDigits.items : (Array.isArray(resDigits) ? resDigits : []);
      }
    }

    // Filter warga binaan: HANYA yang secara spesifik milik cabang UPT kasir ini
    if (userBranchId) {
      items = items.filter((item) => {
        const itemBranchId = item.branchId || item.branch?.id;
        return itemBranchId && String(itemBranchId).toLowerCase() === String(userBranchId).toLowerCase();
      });
    }

    if (items.length === 0) {
      return null;
    }

    // Cari yang paling cocok
    const qLower = rawQuery.toLowerCase();
    const qDigits = rawQuery.replace(/[^0-9]/g, '');
    const matched = items.find((item) => {
      const ident = (item.identifier || item.id || item.wbpRegNumber || '').toLowerCase();
      const identDigits = ident.replace(/[^0-9]/g, '');
      const name = (item.name || '').toLowerCase();
      return ident === qLower || ident.includes(qLower) || (qDigits && identDigits === qDigits) || name === qLower || name.includes(qLower);
    }) || items[0];

    // Cek status aktif warga binaan
    if (matched.isActive === false || matched.commStatus === 'Nonaktif' || matched.status === 'Nonaktif' || matched.status === 'Suspended') {
      const error = new Error('Akun komunikasi warga binaan sedang dinonaktifkan oleh petugas');
      error.isInactive = true;
      throw error;
    }

    return {
      id: matched.id,
      identifier: matched.identifier || matched.id,
      nama: matched.name || matched.nama,
      blok: matched.blockRoom || matched.blok || 'Blok Hunian',
      noTelp: matched.phone || matched.noTelp || (matched.families?.[0]?.phone) || '',
      commStatus: matched.commStatus || 'Aktif',
      isActive: matched.isActive !== false,
      branchId: matched.branchId || matched.branch?.id,
      branchName: matched.branchName || userBranchName,
    };
  } catch (err) {
    if (err.isInactive || err.isWrongBranch) throw err;
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal mencari data warga binaan:', err?.message || err);
    throw err;
  }
}

export const cariNapiById = cariWbpByIdAtauTelp;

// Bersihkan cache dummy / mock lama dari localStorage jika tidak dalam mode dummy
try {
  if (typeof window !== 'undefined' && !isDummyMode()) {
    localStorage.removeItem('pascall_canteen_local_transactions_v1');
    localStorage.removeItem('pascall_canteen_transactions');
  }
} catch {}

const CANTEEN_TX_STORAGE_KEY = 'pascall_canteen_local_transactions_v1';

function getStoredCanteenTransactions() {
  if (!isDummyMode()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(CANTEEN_TX_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

function saveStoredCanteenTransaction(tx) {
  try {
    if (isDummyMode()) {
      const list = getStoredCanteenTransactions();
      const updated = [tx, ...list.filter((i) => i.id !== tx.id && i.kodeVoucher !== tx.kodeVoucher)];
      localStorage.setItem(CANTEEN_TX_STORAGE_KEY, JSON.stringify(updated));
    }
    window.dispatchEvent(new CustomEvent('canteen_transaction_saved', { detail: tx }));
  } catch (err) {
    console.error('Error saving canteen transaction:', err);
  }
}

/**
 * Konfirmasi Pembayaran Tunai & Terbitkan Voucher
 * Memanggil endpoint BE POST /api/canteen/transactions
 */
export async function buatTransaksi({ napi, paket, metode = 'Tunai', notes = '' }) {
  const hargaTotal = Number(paket.total || paket.harga || 0);
  const dpp = Math.round(hargaTotal / 1.11);
  const ppn = hargaTotal - dpp;
  const durasiMenit = Number(paket.menit || parseInt(paket.durasi) || 0);
  const user = getAuthUser();

  const createLocalTx = (overrideId) => {
    const trxId = overrideId || `TRX-${Date.now()}`;
    const randomVoucher = Math.floor(10000 + Math.random() * 90000).toString();
    const newTx = {
      id: trxId,
      kodeVoucher: randomVoucher,
      status: 'Berhasil',
      metode: 'Tunai',
      waktu: new Date().toISOString(),
      isLocalFallback: true,
      napi: {
        id: napi.identifier || napi.id,
        nama: napi.nama || napi.name,
        blok: napi.blok || napi.blockRoom || 'Blok A',
        noTelp: napi.noTelp || napi.phone || '',
      },
      paket: {
        id: paket.id,
        nama: paket.nama || paket.name,
        durasi: `${durasiMenit} Menit`,
        durationMinutes: durasiMenit,
        harga: hargaTotal,
        total: hargaTotal,
        dpp,
        ppn,
      },
      petugas: user?.name || 'Petugas Kantin',
      cashier: user,
      notes: notes || '',
    };
    saveStoredCanteenTransaction(newTx);
    kurangiSaldoKantin(durasiMenit);
    return newTx;
  };

  if (isDummyMode()) {
    const { dummyStore } = await import('../../dummy/store');
    const newTx = createLocalTx();
    dummyStore.addTransaction(newTx);
    return newTx;
  }

  try {
    const payload = {
      inmateIdentifier: napi.identifier || napi.id,
      packageId: paket.id,
      paymentMethod: 'TUNAI',
      notes: notes || undefined,
    };

    const res = await apiFetch('/api/canteen/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = res?.data || res;

    const resultTx = {
      id: data.id,
      kodeVoucher: data.kodeVoucher,
      status: data.status,
      metode: 'Tunai',
      waktu: data.createdAt || new Date().toISOString(),
      napi: {
        id: data.inmate?.identifier || napi.identifier || napi.id,
        nama: data.inmate?.name || napi.nama || napi.name,
        blok: data.inmate?.blockRoom || napi.blok || napi.blockRoom,
        noTelp: data.inmate?.phone || napi.noTelp || napi.phone,
      },
      paket: {
        id: data.package?.id || paket.id,
        nama: data.package?.name || paket.nama || paket.name,
        durasi: `${data.package?.durationMinutes || durasiMenit} Menit`,
        harga: Number(data.package?.price || hargaTotal),
        total: Number(data.payment?.totalAmount || hargaTotal),
        dpp: Number(data.payment?.dpp || dpp),
        ppn: Number(data.payment?.ppn || ppn),
      },
      petugas: data.cashier?.name || user?.name || 'Petugas Kantin',
      cashier: data.cashier || user,
      notes: data.notes || notes,
    };
    saveStoredCanteenTransaction(resultTx);
    return resultTx;
  } catch (err) {
    if (err?.status === 401) {
      logout();
      throw err;
    }

    const errMsg = err?.message || err?.data?.message || '';
    // Jika WBP belum tersinkron di DB backend (data mock/lokal), lakukan fallback terbitkan voucher lokal agar operasional kasir tidak terhenti
    const isWbpNotFoundInBe = err?.status === 404 && (
      errMsg.includes('tidak ditemukan di cabang ini') ||
      errMsg.includes('tidak ditemukan') ||
      napi?.isMock
    );

    if (isWbpNotFoundInBe) {
      console.warn('[KantinService] WBP belum terdaftar di DB backend (data mock FE). Melakukan fallback transaksi lokal:', errMsg);
      const localTx = createLocalTx();
      return localTx;
    }

    // Jika bukan kasus WBP belum sinkron (misal saldo/kuota menit kasir habis), lempar error asli
    console.error('[KantinService] Transaksi ditolak atau gagal di BE:', errMsg);
    throw err;
  }
}

/**
 * Mengambil detail snapshot transaksi untuk struk & voucher.
 * Memanggil endpoint BE GET /api/canteen/transactions/:id
 */
export async function getTransaksiById(id) {
  if (!id) return null;

  // 1. Cek dari local stored transactions
  const localList = getStoredCanteenTransactions();
  const localFound = localList.find((t) => t.id === id || t.kodeVoucher === id);

  if (isDummyMode()) {
    if (localFound) return localFound;
    const { dummyStore } = await import('../../dummy/store');
    const transactions = dummyStore.getTransactions();
    const found = transactions.find((t) => t.id === id || t.kodeVoucher === id);
    return found || null;
  }

  try {
    const res = await apiFetch(`/api/canteen/transactions/${encodeURIComponent(id)}`);
    const data = res?.data || res;

    if (!data || !data.id) {
      if (localFound) return localFound;
      return null;
    }

    const hargaTotal = Number(data.payment?.totalAmount || data.package?.price || 0);
    const dpp = Number(data.payment?.dpp !== undefined ? data.payment.dpp : Math.round(hargaTotal / 1.11));
    const ppn = Number(data.payment?.ppn !== undefined ? data.payment.ppn : (hargaTotal - dpp));

    const result = {
      id: data.id,
      kodeVoucher: data.kodeVoucher,
      status: data.status,
      metode: data.paymentMethod === 'TUNAI' ? 'Tunai' : (data.paymentMethod || 'Tunai'),
      waktu: data.createdAt,
      napi: {
        id: data.inmate?.identifier || data.inmate?.id || '-',
        nama: data.inmate?.name || '-',
        blok: data.inmate?.blockRoom || null,
        noTelp: data.inmate?.phone || null,
      },
      paket: {
        id: data.package?.id,
        nama: data.package?.name || '-',
        durasi: `${data.package?.durationMinutes || 0} Menit`,
        harga: hargaTotal,
        total: hargaTotal,
        dpp,
        ppn,
      },
      petugas: data.cashier?.name || 'Petugas Kantin',
      cashier: data.cashier,
      notes: data.notes,
      isVoucherUsed: data.isVoucherUsed,
      voucherUsedAt: data.voucherUsedAt,
    };
    saveStoredCanteenTransaction(result);
    return result;
  } catch (err) {
    if (localFound) return localFound;
    if (err?.status === 404) {
      try {
        const { dummyStore } = await import('../../dummy/store');
        const transactions = dummyStore.getTransactions();
        const found = transactions.find((t) => t.id === id || t.kodeVoucher === id);
        if (found) return found;
      } catch {}
      return null;
    }
    if (err?.status === 401) {
      if (localFound) return localFound;
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal mengambil detail transaksi:', err?.message || err);
    return localFound || null;
  }
}

/**
 * Format tanggal helper YYYY-MM-DD
 */
function formatDateParam(d) {
  if (!d) return undefined;
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return undefined;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Memeriksa apakah tanggal transaksi cocok dengan periode & tanggal terpilih
 */
function matchesDate(dateStr, periode, targetDate) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = targetDate instanceof Date ? targetDate : new Date(targetDate || Date.now());
  if (isNaN(d.getTime()) || isNaN(t.getTime())) return false;

  if (periode === 'harian') {
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  }
  if (periode === 'bulanan') {
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth()
    );
  }
  if (periode === 'tahunan') {
    return d.getFullYear() === t.getFullYear();
  }
  return true;
}

/**
 * Menghasilkan data grafik distribusi pemasukan
 */
function generateChartData(transactions, periode, targetDate) {
  const t = targetDate instanceof Date ? targetDate : new Date(targetDate || Date.now());

  if (periode === 'harian') {
    const standardHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const buckets = {};
    standardHours.forEach((h) => {
      buckets[h] = { nominal: 0, count: 0 };
    });

    transactions.forEach((tx) => {
      const d = new Date(tx.waktu);
      if (!isNaN(d.getTime())) {
        const hourNum = d.getHours();
        const hourKey = `${String(hourNum).padStart(2, '0')}:00`;
        if (!buckets[hourKey]) {
          buckets[hourKey] = { nominal: 0, count: 0 };
        }
        buckets[hourKey].nominal += Number(tx.paket?.harga || tx.paket?.total || 0);
        buckets[hourKey].count += 1;
      }
    });

    return Object.keys(buckets)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((label) => ({
        label,
        nominal: buckets[label].nominal,
        count: buckets[label].count,
      }));
  }

  if (periode === 'bulanan') {
    const daysInMonth = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    const steps = [];
    for (let i = 1; i <= daysInMonth; i += (daysInMonth > 28 ? 4 : 3)) {
      steps.push(i);
    }
    if (steps[steps.length - 1] !== daysInMonth) {
      steps.push(daysInMonth);
    }

    return steps.map((dayNum) => {
      const label = `${String(dayNum).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}`;
      const dayTxs = transactions.filter((tx) => {
        const d = new Date(tx.waktu);
        return d.getDate() === dayNum;
      });
      const nominal = dayTxs.reduce((sum, tx) => sum + Number(tx.paket?.harga || tx.paket?.total || 0), 0);
      return {
        label,
        nominal,
        count: dayTxs.length,
      };
    });
  }

  if (periode === 'tahunan') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months.map((label, monthIdx) => {
      const monthTxs = transactions.filter((tx) => {
        const d = new Date(tx.waktu);
        return d.getMonth() === monthIdx;
      });
      const nominal = monthTxs.reduce((sum, tx) => sum + Number(tx.paket?.harga || tx.paket?.total || 0), 0);
      return {
        label,
        nominal,
        count: monthTxs.length,
      };
    });
  }

  return [];
}

/**
 * Mengambil seluruh data transaksi dari local storage, mock/dummy store, dan backend API
 */
async function getAllStandardizedTransactions() {
  const localList = getStoredCanteenTransactions().map((t) => ({
    id: t.id,
    kodeVoucher: t.kodeVoucher,
    status: t.status || 'Berhasil',
    metode: t.metode || (t.paymentMethod === 'TUNAI' ? 'Tunai' : (t.paymentMethod || 'Tunai')),
    waktu: t.waktu || t.createdAt || t.date || new Date().toISOString(),
    napi: {
      id: t.napi?.id || t.inmate?.identifier || t.inmate?.id || '-',
      nama: t.napi?.nama || t.inmate?.name || '-',
      blok: t.napi?.blok || t.inmate?.blockRoom || null,
      noTelp: t.napi?.noTelp || t.inmate?.phone || null,
    },
    paket: {
      id: t.paket?.id || t.package?.id,
      nama: t.paket?.nama || t.package?.name || '-',
      harga: Number(t.paket?.harga || t.paket?.total || t.package?.price || t.totalAmount || 0),
      durasi: t.paket?.durasi || `${t.package?.durationMinutes || 0} Menit`,
    },
    petugas: t.petugas || t.cashier?.name || 'Petugas Kantin',
    cashier: t.cashier,
    notes: t.notes || '',
  }));

  let dummyList = [];
  try {
    const { dummyStore } = await import('../../dummy/store');
    const dTrx = dummyStore.getTransactions() || [];
    dummyList = dTrx
      .filter((t) => t.category === 'Kantin' || t.paket || t.kodeVoucher)
      .map((t) => ({
        id: t.id,
        kodeVoucher: t.kodeVoucher || 'PAS-LOCAL',
        status: t.status || 'Berhasil',
        metode: t.metode || (t.method === 'Tunai' ? 'Tunai' : (t.method || 'Tunai')),
        waktu: t.waktu || t.date || t.createdAt || new Date().toISOString(),
        napi: {
          id: t.napi?.id || t.inmateId || '-',
          nama: t.napi?.nama || t.inmateName || '-',
          blok: t.napi?.blok || t.blockRoom || null,
          noTelp: t.napi?.noTelp || null,
        },
        paket: {
          id: t.paket?.id || t.packageId,
          nama: t.paket?.nama || t.description || 'Paket Komunikasi',
          harga: Number(t.paket?.harga || t.amount || 0),
          durasi: t.paket?.durasi || '15 Menit',
        },
        petugas: t.petugas || 'Petugas Kantin',
        cashier: t.cashier,
        notes: t.notes || '',
      }));
  } catch {}

  let apiList = [];
  if (!isDummyMode()) {
    try {
      const res = await apiFetch('/api/canteen/transactions?page=1&limit=100');
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      apiList = items.map((t) => ({
        id: t.id,
        kodeVoucher: t.kodeVoucher,
        status: t.status,
        metode: t.paymentMethod === 'TUNAI' ? 'Tunai' : (t.paymentMethod || 'Tunai'),
        waktu: t.createdAt || t.waktu,
        napi: {
          id: t.inmate?.identifier || t.inmate?.id || '-',
          nama: t.inmate?.name || '-',
          blok: t.inmate?.blockRoom || null,
          noTelp: t.inmate?.phone || null,
        },
        paket: {
          id: t.package?.id,
          nama: t.package?.name || '-',
          harga: Number(t.totalAmount || t.package?.price || 0),
          durasi: `${t.package?.durationMinutes || 0} Menit`,
        },
        petugas: t.cashier?.name || 'Petugas Kantin',
        cashier: t.cashier,
        notes: t.notes,
      }));
    } catch {}
  }

  const map = new Map();
  for (const item of apiList) {
    if (item.id) map.set(item.id, item);
  }
  for (const item of dummyList) {
    if (item.id && !map.has(item.id)) map.set(item.id, item);
  }
  for (const item of localList) {
    if (item.id) map.set(item.id, item);
  }

  return Array.from(map.values());
}

/**
 * Mengambil riwayat transaksi kasir kantin langsung dari Backend REST API.
 * Endpoint: GET /api/canteen/transactions
 */
export async function getRiwayat({ cari = '', metode = 'Semua', periode = 'bulanan', tanggal = new Date(), page = 1, limit = 100 } = {}) {
  if (isDummyMode()) {
    try {
      const all = await getAllStandardizedTransactions();
      let filtered = all.filter((t) => matchesDate(t.waktu, periode, tanggal));
      if (metode && metode !== 'Semua') {
        filtered = filtered.filter((t) => t.metode?.toLowerCase() === metode.toLowerCase());
      }
      if (cari && cari.trim()) {
        const q = cari.toLowerCase().trim();
        filtered = filtered.filter(
          (t) =>
            t.id?.toLowerCase().includes(q) ||
            t.kodeVoucher?.toLowerCase().includes(q) ||
            t.napi?.nama?.toLowerCase().includes(q) ||
            t.napi?.id?.toLowerCase().includes(q) ||
            t.napi?.noTelp?.includes(q) ||
            t.paket?.nama?.toLowerCase().includes(q)
        );
      }
      filtered.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
      return filtered;
    } catch (err) {
      console.error('[KantinService] Gagal memuat riwayat transaksi dummy:', err);
      return [];
    }
  }

  try {
    const d = tanggal instanceof Date ? tanggal : new Date(tanggal || Date.now());
    const query = new URLSearchParams();
    query.append('page', String(page));
    query.append('limit', String(limit));

    if (cari && cari.trim()) {
      query.append('search', cari.trim());
    }
    if (metode && metode !== 'Semua') {
      query.append('metode', metode.toUpperCase());
    }
    if (periode && periode !== 'semua') {
      query.append('periode', periode);
      if (periode === 'harian') {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        query.append('tanggal', `${y}-${m}-${day}`);
      } else if (periode === 'bulanan') {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        query.append('bulan', `${y}-${m}`);
      } else if (periode === 'tahunan') {
        query.append('tahun', String(d.getFullYear()));
      }
    }

    const res = await apiFetch(`/api/canteen/transactions?${query.toString()}`);
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []));

    const mappedBe = items.map((t) => ({
      id: t.id,
      kodeVoucher: t.kodeVoucher,
      status: t.status || 'Berhasil',
      metode: t.paymentMethod === 'TUNAI' ? 'Tunai' : (t.paymentMethod || 'Tunai'),
      waktu: t.createdAt || t.waktu,
      napi: {
        id: t.inmate?.identifier || t.inmateIdentifier || t.inmate?.id || '-',
        nama: t.inmate?.name || t.inmateName || '-',
        blok: t.inmate?.blockRoom || t.inmateBlock || 'Blok Hunian',
        noTelp: t.inmate?.phone || '',
      },
      paket: {
        id: t.package?.id || t.packageId,
        nama: t.package?.name || t.packageName || '-',
        harga: Number(t.totalAmount || t.package?.price || 0),
        total: Number(t.totalAmount || t.package?.price || 0),
        durasi: `${t.package?.durationMinutes || t.packageDuration || 0} Menit`,
      },
      petugas: t.cashier?.name || 'Petugas Kantin',
      cashier: t.cashier,
      notes: t.notes || '',
    }));

    mappedBe.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
    return mappedBe;
  } catch (err) {
    console.error('[KantinService] Gagal memuat riwayat transaksi dari BE:', err);
    return [];
  }
}

/**
 * Mengambil ringkasan laporan omset & grafik penjualan kantin dari Backend.
 * Endpoint: GET /api/canteen/reports/summary
 */
export async function getRekap({ periode = 'bulanan', tanggal = new Date() } = {}) {
  const d = tanggal instanceof Date ? tanggal : new Date(tanggal || Date.now());

  if (isDummyMode()) {
    try {
      const all = await getAllStandardizedTransactions();
      const filtered = all.filter((t) => matchesDate(t.waktu, periode, d));
      const totalRevenue = filtered.reduce((sum, t) => sum + Number(t.paket?.harga || t.paket?.total || 0), 0);
      const totalTransactions = filtered.length;
      const chartData = generateChartData(filtered, periode, d);
      return {
        totalPemasukan: totalRevenue,
        jumlahTransaksi: totalTransactions,
        revenueGrowth: 0,
        transactionsGrowth: 0,
        perMetode: {
          Tunai: { nominal: totalRevenue, count: totalTransactions },
        },
        chartData,
        periode,
      };
    } catch (err) {
      console.error('[KantinService] Gagal memuat rekap dummy:', err);
      return {
        totalPemasukan: 0,
        jumlahTransaksi: 0,
        perMetode: { Tunai: { nominal: 0, count: 0 } },
        chartData: [],
        periode,
      };
    }
  }

  try {
    const query = new URLSearchParams();
    if (periode && periode !== 'semua') {
      query.append('periode', periode);
      if (periode === 'harian') {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        query.append('tanggal', `${y}-${m}-${day}`);
      } else if (periode === 'bulanan') {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        query.append('bulan', `${y}-${m}`);
      } else if (periode === 'tahunan') {
        query.append('tahun', String(d.getFullYear()));
      }
    }

    const res = await apiFetch(`/api/canteen/reports/summary?${query.toString()}`);
    const data = res?.data || res || {};
    const summary = data.summary || {};
    const totalRevenue = Number(summary.totalRevenue || 0);
    const totalTransactions = Number(summary.totalTransactions || 0);

    const chartData = (data.salesChart || []).map((c) => ({
      label: c.label,
      nominal: Number(c.revenue ?? c.nominal ?? 0),
      count: Number(c.transactions ?? c.count ?? 0),
    }));

    const perMetode = data.paymentMethods || {
      TUNAI: { totalAmount: totalRevenue, count: totalTransactions },
    };

    return {
      totalPemasukan: totalRevenue,
      jumlahTransaksi: totalTransactions,
      revenueGrowth: Number(summary.revenueGrowth || 0),
      transactionsGrowth: Number(summary.transactionsGrowth || 0),
      perMetode: {
        Tunai: {
          nominal: Number(perMetode.TUNAI?.totalAmount || perMetode.Tunai?.nominal || totalRevenue),
          count: Number(perMetode.TUNAI?.count || perMetode.Tunai?.count || totalTransactions),
        },
      },
      chartData,
      periode,
    };
  } catch (err) {
    console.error('[KantinService] Gagal memuat rekap dari BE:', err);
    return {
      totalPemasukan: 0,
      jumlahTransaksi: 0,
      revenueGrowth: 0,
      transactionsGrowth: 0,
      perMetode: { Tunai: { nominal: 0, count: 0 } },
      chartData: [],
      periode,
    };
  }
}

export default {
  getPaket,
  cariWbpByIdAtauTelp,
  cariNapiById,
  buatTransaksi,
  getTransaksiById,
  getRiwayat,
  getRekap,
};
