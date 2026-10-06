import { apiFetch, logout } from '../api';
import { getPaketKantin } from '../packageService';
import { isDummyMode } from '../../dummy';

/**
 * Mengambil daftar paket komunikasi aktif untuk kasir kantin.
 * Mengambil langsung dari endpoint BE GET /api/packages (hanya status Aktif).
 */
export async function getPaket(kategori = 'telepon') {
  if (isDummyMode()) {
    const { dummyStore } = await import('../../dummy/store');
    const packages = dummyStore.getPackages();
    return packages
      .filter((p) => p.status === 'Aktif' && (kategori === 'semua' || p.category === kategori || p.kategori === kategori))
      .map((pkg) => ({
        id: pkg.id,
        nama: pkg.name || pkg.nama,
        kategori: pkg.category || pkg.kategori || 'telepon',
        menit: pkg.duration || pkg.durasi || 0,
        durasi: `${pkg.duration || pkg.durasi || 0} Menit`,
        keterangan: 'Semua Operator',
        harga: Number(pkg.price || pkg.harga || 0),
        total: Number(pkg.price || pkg.harga || 0),
        dpp: Math.round(Number(pkg.price || pkg.harga || 0) / 1.11),
        ppn: Number(pkg.price || pkg.harga || 0) - Math.round(Number(pkg.price || pkg.harga || 0) / 1.11),
        status: 'Aktif',
      }));
  }

  return await getPaketKantin({ kategori });
}

/**
 * Mencari data narapidana berdasarkan NIP / Nomor Registrasi atau Nomor Telepon.
 * Memanggil endpoint BE GET /api/inmates?search=...
 */
export async function cariWbpByIdAtauTelp(queryInput) {
  if (!queryInput) return null;
  const rawQuery = queryInput.toString().trim();

  if (isDummyMode()) {
    const { daftarWbp } = await import('../../data/kantin/napi');
    const cleanQuery = rawQuery.replace(/[\s\-_+.]/g, '').toUpperCase();
    const phoneNormalized = cleanQuery.startsWith('62') ? '0' + cleanQuery.slice(2) : cleanQuery;

    const found = daftarWbp.find((item) => {
      const cleanId = item.id.replace(/[\s\-_]/g, '').toUpperCase();
      const cleanTelp = (item.noTelp || '').replace(/[\s\-_+.]/g, '');
      const matchId = cleanId === cleanQuery || cleanId.includes(cleanQuery) || item.id.toUpperCase() === rawQuery.toUpperCase();
      const matchTelp = cleanTelp === phoneNormalized || cleanTelp.endsWith(phoneNormalized) || cleanTelp.includes(phoneNormalized);
      return matchId || matchTelp;
    });

    return found || null;
  }

  try {
    const res = await apiFetch(`/api/inmates?search=${encodeURIComponent(rawQuery)}&limit=10`);
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    if (items.length === 0) {
      return null;
    }

    // Cari yang paling cocok dengan identifier atau name
    const qLower = rawQuery.toLowerCase();
    const matched = items.find((item) => {
      const ident = (item.identifier || item.id || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      return ident === qLower || ident.includes(qLower) || name === qLower || phone === qLower;
    }) || items[0];

    // Cek status aktif narapidana
    if (matched.isActive === false || matched.commStatus === 'Nonaktif') {
      const error = new Error('Akun komunikasi narapidana sedang dinonaktifkan oleh petugas lapas');
      error.isInactive = true;
      throw error;
    }

    return {
      id: matched.id,
      identifier: matched.identifier || matched.id,
      nama: matched.name,
      blok: matched.blockRoom || 'Blok Lapas',
      noTelp: matched.phone || '',
      commStatus: matched.commStatus || 'Aktif',
      isActive: matched.isActive !== false,
    };
  } catch (err) {
    if (err.isInactive) throw err;
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal mencari data narapidana:', err?.message || err);
    throw err;
  }
}

export const cariNapiById = cariWbpByIdAtauTelp;

/**
 * Konfirmasi Pembayaran Tunai & Terbitkan Voucher
 * Memanggil endpoint BE POST /api/canteen/transactions
 */
export async function buatTransaksi({ napi, paket, metode = 'Tunai', notes = '' }) {
  if (isDummyMode()) {
    const { dummyStore } = await import('../../dummy/store');
    const randomVoucher = Math.floor(10000 + Math.random() * 90000).toString();
    const trxId = `TRX-${Date.now()}`;
    const newTrx = {
      id: trxId,
      kodeVoucher: randomVoucher,
      napi: { id: napi.identifier || napi.id, nama: napi.nama, blok: napi.blok, noTelp: napi.noTelp },
      paket: { ...paket, harga: paket.harga, total: paket.total || paket.harga },
      metode: 'Tunai',
      waktu: new Date().toISOString(),
      petugas: 'Operator Kantin',
    };
    dummyStore.addTransaction(newTrx);
    return newTrx;
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

    return {
      id: data.id,
      kodeVoucher: data.kodeVoucher,
      status: data.status,
      metode: 'Tunai',
      waktu: data.createdAt || new Date().toISOString(),
      napi: {
        id: data.inmate?.identifier || napi.identifier || napi.id,
        nama: data.inmate?.name || napi.nama,
        blok: data.inmate?.blockRoom || napi.blok,
        noTelp: data.inmate?.phone || napi.noTelp,
      },
      paket: {
        id: data.package?.id || paket.id,
        nama: data.package?.name || paket.nama,
        durasi: `${data.package?.durationMinutes || paket.menit || 0} Menit`,
        harga: Number(data.package?.price || paket.harga),
        total: Number(data.payment?.totalAmount || paket.total || paket.harga),
        dpp: Number(data.payment?.dpp || paket.dpp || 0),
        ppn: Number(data.payment?.ppn || paket.ppn || 0),
      },
      petugas: data.cashier?.name || 'Petugas Kantin',
      cashier: data.cashier,
      notes: data.notes,
    };
  } catch (err) {
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal membuat transaksi:', err?.message || err);
    throw err;
  }
}

/**
 * Mengambil detail snapshot transaksi untuk struk & voucher.
 * Memanggil endpoint BE GET /api/canteen/transactions/:id
 */
export async function getTransaksiById(id) {
  if (!id) return null;

  if (isDummyMode()) {
    const { dummyStore } = await import('../../dummy/store');
    const transactions = dummyStore.getTransactions();
    const found = transactions.find((t) => t.id === id || t.kodeVoucher === id);
    return found || null;
  }

  try {
    const res = await apiFetch(`/api/canteen/transactions/${encodeURIComponent(id)}`);
    const data = res?.data || res;

    if (!data || !data.id) return null;

    const hargaTotal = Number(data.payment?.totalAmount || data.package?.price || 0);
    const dpp = Number(data.payment?.dpp !== undefined ? data.payment.dpp : Math.round(hargaTotal / 1.11));
    const ppn = Number(data.payment?.ppn !== undefined ? data.payment.ppn : (hargaTotal - dpp));

    return {
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
  } catch (err) {
    if (err?.status === 404) return null;
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal mengambil detail transaksi:', err?.message || err);
    return null;
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
 * Mengambil riwayat transaksi kasir kantin.
 * Memanggil endpoint BE GET /api/canteen/transactions
 */
export async function getRiwayat({ cari = '', metode = 'Semua', periode = 'harian', tanggal = new Date(), page = 1, limit = 50 } = {}) {
  if (isDummyMode()) {
    const { dummyStore } = await import('../../dummy/store');
    return dummyStore.getTransactions({ cari, periode, tanggal });
  }

  try {
    const params = new URLSearchParams();
    if (periode) params.append('periode', periode);
    
    if (periode === 'harian' && tanggal) {
      const dateStr = formatDateParam(tanggal);
      if (dateStr) params.append('tanggal', dateStr);
    }

    if (cari && cari.trim()) {
      params.append('search', cari.trim());
    }

    if (metode && metode !== 'Semua') {
      params.append('metode', metode.toUpperCase());
    }

    params.append('page', String(page));
    params.append('limit', String(limit));

    const res = await apiFetch(`/api/canteen/transactions?${params.toString()}`);
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    return items.map((t) => ({
      id: t.id,
      kodeVoucher: t.kodeVoucher,
      status: t.status,
      metode: t.paymentMethod === 'TUNAI' ? 'Tunai' : (t.paymentMethod || 'Tunai'),
      waktu: t.createdAt,
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
  } catch (err) {
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal memuat riwayat transaksi:', err?.message || err);
    return [];
  }
}

/**
 * Mengambil ringkasan laporan omset & grafik penjualan kantin.
 * Memanggil endpoint BE GET /api/canteen/reports/summary
 */
export async function getRekap({ periode = 'harian', tanggal = new Date() } = {}) {
  if (isDummyMode()) {
    return {
      totalPemasukan: 0,
      jumlahTransaksi: 0,
      perMetode: { Tunai: { nominal: 0, count: 0 } },
      chartData: [],
      periode,
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('periode', periode);

    const dateObj = tanggal instanceof Date ? tanggal : new Date(tanggal || Date.now());

    if (periode === 'harian') {
      const dateStr = formatDateParam(dateObj);
      if (dateStr) params.append('tanggal', dateStr);
    } else if (periode === 'bulanan') {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      params.append('bulan', `${year}-${month}`);
    } else if (periode === 'tahunan') {
      params.append('tahun', String(dateObj.getFullYear()));
    }

    const res = await apiFetch(`/api/canteen/reports/summary?${params.toString()}`);
    const data = res?.data || res;

    const summary = data?.summary || {};
    const salesChart = Array.isArray(data?.salesChart) ? data.salesChart : [];

    const chartData = salesChart.map((item) => ({
      label: item.label,
      nominal: Number(item.revenue || 0),
      count: Number(item.transactions || 0),
    }));

    const totalRevenue = Number(summary.totalRevenue || 0);
    const totalTransactions = Number(summary.totalTransactions || 0);

    return {
      totalPemasukan: totalRevenue,
      jumlahTransaksi: totalTransactions,
      revenueGrowth: summary.revenueGrowth || 0,
      transactionsGrowth: summary.transactionsGrowth || 0,
      perMetode: {
        Tunai: { nominal: totalRevenue, count: totalTransactions },
      },
      chartData,
      topPackages: data?.topPackages || [],
      cashierPerformance: data?.cashierPerformance || [],
      periode,
    };
  } catch (err) {
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[KantinService] Gagal memuat rekap laporan:', err?.message || err);
    return {
      totalPemasukan: 0,
      jumlahTransaksi: 0,
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
