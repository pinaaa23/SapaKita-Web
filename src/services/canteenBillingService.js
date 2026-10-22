/**
 * Service Layer Tagihan Kantin Berbasis Detik Panggilan (PasCall)
 * ============================================================================
 * Menghitung tagihan kantin menggunakan rumus baru:
 *   Tagihan = Total Detik x Tarif per Detik x Persen Negosiasi
 *
 * Catatan Integrasi:
 * 1. Mengambil data real dari Backend (BE):
 *    - Jika belum melakukan pembelian, total detik dan transaksi otomatis kosong (0).
 * 2. Tarif dan persen negosiasi awalnya KOSONG sampai Superadmin mengaturnya.
 * 3. Riwayat transaksi juga dihitung otomatis mengikuti rumus baru ini.
 * ============================================================================
 */

import { apiFetch, getAuthUser } from './api';
import { getBranches } from './branchService';
import {
  getStoredContracts,
  saveStoredContract,
  findStoredContract,
  calculateCanteenBilling,
  calculateUnifiedBilling,
  isDateInMonthWIB,
  formatDetikKeMenit,
  isCanteenContractConfigured,
} from '../dummy/canteenContractMock';

export { formatDetikKeMenit, isCanteenContractConfigured, findStoredContract, calculateUnifiedBilling, isDateInMonthWIB };

/**
 * Mengambil daftar rekapitulasi tagihan semua kantin per UPT (Superadmin)
 * Berbasis detik durasi paket yang dibeli WBP di kantin, tarif per detik, dan persen negosiasi.
 *
 * @param {number} month (1 - 12)
 * @param {number} year (contoh 2026)
 * @returns {Promise<Array>}
 */
export async function getCanteenBillingNational(month, year) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  // 1. Ambil data cabang UPT dari backend
  let branches = [];
  try {
    const branchesRes = await getBranches({ limit: 100 });
    branches = Array.isArray(branchesRes?.items)
      ? branchesRes.items
      : Array.isArray(branchesRes)
      ? branchesRes
      : [];
  } catch (err) {
    console.warn('[canteenBillingService] Gagal memuat branches dari API:', err);
  }

  if (branches.length === 0) {
    branches = [
      { id: 'b1', name: 'Lapas Kelas I Cipinang', kanwil: { name: 'Kanwil DKI Jakarta' } },
      { id: 'b2', name: 'Lapas Kelas IIA Salemba', kanwil: { name: 'Kanwil DKI Jakarta' } },
      { id: 'b3', name: 'Lapas Kelas IIA Yogyakarta', kanwil: { name: 'Kanwil D.I. Yogyakarta' } },
      { id: 'b4', name: 'Lapas Kelas I Surabaya', kanwil: { name: 'Kanwil Jawa Timur' } },
      { id: 'b5', name: 'Lapas Kelas I Medan', kanwil: { name: 'Kanwil Sumatera Utara' } },
      { id: 'b6', name: 'Lapas Kelas IIA Surakarta', kanwil: { name: 'Kanwil Jawa Tengah' } },
    ];
  }

  // 2. Ambil data real transaksi / billing dari Backend (GET /api/canteen/billing/national-summary)
  let beNationalData = null;
  try {
    const natRes = await apiFetch(`/api/canteen/billing/national-summary?month=${targetMonth}&year=${targetYear}`);
    beNationalData = natRes?.data || natRes || null;
  } catch (_e) {
    // Abaikan jika offline
  }

  // 3. Ambil riwayat bukti bayar topup yang tersimpan di sistem
  let allTopups = [];
  try {
    const topupsRes = await apiFetch('/api/canteen/topups?limit=200').catch(() => ({ data: [] }));
    allTopups = topupsRes?.data || topupsRes?.items || (Array.isArray(topupsRes) ? topupsRes : []);
  } catch {
    allTopups = [];
  }

  // 4. SATU SUMBER KONTRAK: Ambil seluruh kontrak resmi dari GET /api/canteen/contracts (sama dengan Tab Pengaturan Kontrak)
  let contractsList = [];
  try {
    contractsList = await getAllCanteenContracts();
  } catch (err) {
    console.warn('[canteenBillingService] Gagal memuat kontrak dari API:', err);
  }

  const contractMap = {};
  if (Array.isArray(contractsList)) {
    contractsList.forEach((c) => {
      if (c.branchId) contractMap[String(c.branchId).toLowerCase()] = c;
      if (c.uptName) contractMap[String(c.uptName).toLowerCase()] = c;
      if (c.branchName) contractMap[String(c.branchName).toLowerCase()] = c;
    });
  }

  const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1;
  const dueDate = new Date(targetYear, targetMonth, 2, 23, 59, 59, 999);
  const isPastDue = now > dueDate;

  const result = branches.map((b) => {
    // Kontrak diambil dari sumber resmi GET /api/canteen/contracts
    const bId = String(b.id || '').toLowerCase();
    const bName = String(b.name || '').toLowerCase();
    let contract = contractMap[bId] || contractMap[bName] || findStoredContract(b.id, { branchName: b.name });

    // Helper status kontrak TUNGGAL:
    const isContractSet = isCanteenContractConfigured(contract);

    const canteenName = contract?.canteenName || `Kantin ${b.name}`;
    const uptName = b.name;
    const kanwilName = b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas';

    // Cari data real UPT ini dari respon backend
    const beBranchInfo = beNationalData?.branches?.find((bb) => bb.branchId === b.id || bb.branchName?.toLowerCase() === b.name?.toLowerCase());

    // Hitung total detik real dari menit durasi paket voucher yang dibeli di kantin pada bulan itu
    const realMinutes = Number(beBranchInfo?.totalMinutes || 0);
    const totalSeconds = realMinutes * 60;

    // Hitung rumus tagihan baru: Detik x Tarif x Persen Negosiasi (Porsi Superadmin)
    const billingCalc = calculateUnifiedBilling({
      totalSeconds,
      ratePerSecond: isContractSet ? contract.ratePerSecond : null,
      superadminPercent: isContractSet ? (contract.superadminPercent ?? contract.negotiationPercent) : null,
    });

    // Cari riwayat pembayaran cabang ini untuk periode ini
    const branchTopups = allTopups.filter((tp) => {
      const matchBranch = tp.branchId === b.id || (tp.branchName && tp.branchName.toLowerCase().includes(b.name.toLowerCase()));
      if (!matchBranch) return false;
      if (tp.billingMonth && tp.billingYear) {
        return Number(tp.billingMonth) === targetMonth && Number(tp.billingYear) === targetYear;
      }
      return true;
    });

    const pendingPayment = branchTopups.find((tp) => tp.status === 'PENDING' || tp.status === 'Menunggu');
    const approvedPayment = branchTopups.find((tp) => tp.status === 'APPROVED' || tp.status === 'Berhasil');
    const rejectedPayment = branchTopups.find((tp) => tp.status === 'REJECTED' || tp.status === 'Ditolak');

    // Hitung total nominal yang telah di-ACC
    const totalApproved = branchTopups
      .filter((tp) => tp.status === 'APPROVED' || tp.status === 'Berhasil')
      .reduce((sum, tp) => sum + (Number(tp.nominal) || 0), 0);

    const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
    const isMonthClosed = !isCurrentMonth || now >= new Date(targetYear, targetMonth - 1, lastDayOfMonth, 23, 59, 59, 999);

    let statusPembayaran = 'Belum Bayar';
    let rawStatus = 'BELUM_BAYAR';
    let isBlocked = false;

    if (!billingCalc.isContractSet) {
      statusPembayaran = 'Belum diatur';
      rawStatus = 'BELUM_DIATUR';
      isBlocked = false;
    } else if (totalApproved >= billingCalc.totalAmount && billingCalc.totalAmount > 0) {
      statusPembayaran = 'Lunas';
      rawStatus = 'LUNAS';
    } else if (pendingPayment) {
      statusPembayaran = 'Menunggu ACC';
      rawStatus = 'PENDING';
    } else if (rejectedPayment) {
      statusPembayaran = 'Ditolak';
      rawStatus = 'REJECTED';
      isBlocked = true;
    } else if (billingCalc.totalAmount === 0) {
      statusPembayaran = 'Tidak Ada Tagihan';
      rawStatus = 'TIDAK_ADA_TAGIHAN';
    } else if (!isMonthClosed) {
      statusPembayaran = 'Bulan Berjalan';
      rawStatus = 'BERJALAN';
    } else if (isPastDue && billingCalc.totalAmount > 0) {
      statusPembayaran = 'Telat';
      rawStatus = 'TELAT';
      isBlocked = true;
    } else {
      statusPembayaran = 'Belum Bayar';
      rawStatus = 'BELUM_BAYAR';
    }

    return {
      branchId: b.id,
      canteenName,
      uptName,
      kanwilName,
      totalSeconds,
      totalSecondsFormatted: formatDetikKeMenit(totalSeconds),
      ratePerSecond: billingCalc.ratePerSecond,
      superadminPercent: billingCalc.superadminPercent,
      canteenPercent: billingCalc.canteenPercent,
      negotiationPercent: billingCalc.negotiationPercent,
      subtotal: billingCalc.subtotal,
      totalAmount: billingCalc.totalAmount,
      canteenShare: billingCalc.canteenShare,
      isContractSet: billingCalc.isContractSet,
      contractNote: billingCalc.contractNote,
      statusPembayaran,
      rawStatus,
      isBlocked,
      month: targetMonth,
      year: targetYear,
      paymentProof: pendingPayment || approvedPayment || rejectedPayment || null,
      allPayments: branchTopups,
    };
  });

  return result;
}

/**
 * Mengambil tagihan bulanan untuk akun Kantin yang sedang login
 * Sesuai rumus: total detik x tarif x persen negosiasi
 * Jika belum melakukan pembelian/panggilan, otomatis datanya KOSONG (0 detik).
 * Jika kontrak belum diset Superadmin, isContractSet: false & totalAmount: 0.
 *
 * @param {number} month
 * @param {number} year
 * @returns {Promise<Object>}
 */
export async function getCanteenBillingMonthly(month, year) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  const user = getAuthUser();
  const rawBranchId = user?.branchId || null;

  // 1. Ambil data real transaksi kantin dari backend
  let beBillingData = null;
  try {
    const res = await apiFetch(`/api/canteen/billing/monthly?month=${targetMonth}&year=${targetYear}`);
    beBillingData = res?.data || res || null;
  } catch (_beErr) {
    // Abaikan jika error
  }

  // 2. Ambil transaksi real
  const transactions = Array.isArray(beBillingData?.transactions) ? beBillingData.transactions : [];

  // Hitung total detik real dari transaksi penjualan paket/voucher di kantin
  // Sesuai Aturan Baru: total detik = akumulasi durasi paket yang dibeli WBP
  let totalSeconds = 0;
  if (beBillingData?.summary?.totalSeconds !== undefined && beBillingData?.summary?.totalSeconds !== null && Number(beBillingData.summary.totalSeconds) > 0) {
    totalSeconds = Number(beBillingData.summary.totalSeconds);
  } else {
    totalSeconds = transactions.reduce((acc, t) => {
      const durationMin = Number(t.package?.durationMinutes || t.package?.duration || t.packageDuration || t.durationMinutes || (typeof t.paket?.durasi === 'string' ? parseInt(t.paket.durasi, 10) : t.paket?.durasi) || 0);
      return acc + (durationMin * 60);
    }, 0);
  }

  // 3. Resolusi kontrak tarif (Read-only dari GET /api/canteen/contracts/:branchId)
  const rawBranchName = user?.branchName || user?.branch?.name || beBillingData?.branchName || null;
  const rawCanteenName = user?.canteenName || user?.name || (rawBranchName ? `Kantin ${rawBranchName}` : null);
  const branchId = rawBranchId || user?.branch?.id || beBillingData?.branchId || null;

  let contract = null;
  if (branchId) {
    try {
      const cRes = await apiFetch(`/api/canteen/contracts/${branchId}`);
      contract = cRes?.data || cRes || null;
    } catch (_cErr) {
      contract = findStoredContract(branchId, {
        branchName: rawBranchName,
        canteenName: rawCanteenName,
      });
    }
  }

  // Jika belum ada, sinkronkan dari ringkasan tagihan Backend bila tersedia
  if (!contract && beBillingData?.summary) {
    const beRate = beBillingData.summary.ratePerSecond;
    const beSa = beBillingData.summary.contractSharePercentage !== undefined && beBillingData.summary.contractSharePercentage !== null
      ? beBillingData.summary.contractSharePercentage
      : beBillingData.summary.passcallSharePercentage;

    if (beRate !== null && beRate !== undefined && beSa !== null && beSa !== undefined && !isNaN(Number(beRate)) && !isNaN(Number(beSa))) {
      contract = {
        branchId,
        branchName: rawBranchName,
        canteenName: rawCanteenName,
        ratePerSecond: Number(beRate),
        superadminPercent: Number(beSa),
        canteenPercent: Math.max(0, 100 - Number(beSa)),
        negotiationPercent: Number(beSa),
        isContractSet: true,
      };
      if (branchId) {
        saveStoredContract(branchId, contract);
      }
    }
  }

  const isContractSet = isCanteenContractConfigured(contract);

  const ratePerSecond = isContractSet ? Number(contract.ratePerSecond) : null;
  const superadminPercent = isContractSet
    ? (contract.superadminPercent !== null && contract.superadminPercent !== undefined ? Number(contract.superadminPercent) : Number(contract.negotiationPercent))
    : null;
  const canteenPercent = isContractSet
    ? (contract.canteenPercent !== null && contract.canteenPercent !== undefined ? Number(contract.canteenPercent) : (100 - Number(contract.negotiationPercent || 0)))
    : null;
  const negotiationPercent = superadminPercent;

  // 4. Hitung tagihan berdasarkan rumus baru (Porsi Superadmin)
  const billingCalc = calculateUnifiedBilling({
    totalSeconds,
    ratePerSecond,
    superadminPercent,
  });

  // 5. Perbarui nilai setiap transaksi di riwayat agar otomatis mengikuti aturan baru
  const recalculatedTransactions = transactions.map((t) => {
    const durationMin = Number(t.package?.durationMinutes || t.package?.duration || t.packageDuration || t.durationMinutes || (typeof t.paket?.durasi === 'string' ? parseInt(t.paket.durasi, 10) : t.paket?.durasi) || 0);
    const durSec = durationMin * 60;
    const itemCalc = calculateUnifiedBilling({
      totalSeconds: durSec,
      ratePerSecond,
      superadminPercent,
    });
    return {
      ...t,
      durationSeconds: durSec,
      calculatedRatePerSecond: ratePerSecond,
      calculatedSuperadminPercent: superadminPercent,
      calculatedCanteenPercent: canteenPercent,
      calculatedNegotiationPercent: negotiationPercent,
      // Nominal item otomatis mengikuti aturan baru:
      totalAmount: isContractSet ? itemCalc.totalAmount : null,
      subtotalAmount: isContractSet ? itemCalc.subtotal : null,
      canteenShare: isContractSet ? itemCalc.canteenShare : null,
    };
  });

  return {
    branchId: branchId || 'b1',
    canteenName: user?.canteenName || user?.name || (beBillingData?.branchName ? `Kantin ${beBillingData.branchName}` : 'Kantin Lapas'),
    uptName: beBillingData?.branchName || user?.branchName || 'Lapas UPT',
    kanwilName: user?.kanwilName || 'Kanwil Ditjenpas',
    period: beBillingData?.period || `${targetMonth}/${targetYear}`,
    invoiceNumber: beBillingData?.invoiceNumber || `INV-${targetYear}${String(targetMonth).padStart(2, '0')}-KTN`,
    month: targetMonth,
    year: targetYear,
    totalSeconds,
    totalSecondsFormatted: formatDetikKeMenit(totalSeconds),
    ratePerSecond: billingCalc.ratePerSecond,
    superadminPercent: billingCalc.superadminPercent,
    canteenPercent: billingCalc.canteenPercent,
    negotiationPercent: billingCalc.negotiationPercent,
    subtotal: billingCalc.subtotal,
    totalAmount: billingCalc.totalAmount,
    canteenShare: billingCalc.canteenShare,
    isContractSet: billingCalc.isContractSet,
    contractNote: billingCalc.contractNote,
    transactions: recalculatedTransactions,
    rawStatus: isContractSet ? (beBillingData?.billingStatus || 'BERJALAN') : 'BELUM_DIATUR',
    statusPembayaran: isContractSet
      ? (beBillingData?.billingStatus === 'PAID' ? 'Lunas' : (beBillingData?.billingStatus === 'PENDING' ? 'Menunggu ACC' : 'Belum Dibayar'))
      : 'Belum diatur',
    isBlocked: isContractSet ? (beBillingData?.billingStatus === 'DIBLOKIR') : false,
    paymentProof: beBillingData?.paymentProof || null,
  };
}

/**
 * Mengambil tarif kontrak 1 UPT tertentu (Read-Only)
 * Endpoint: GET /api/canteen/contracts/:branchId (Role: CANTEEN_STAFF, SUPERADMIN)
 *
 * @param {string} branchId
 * @returns {Promise<Object|null>}
 */
export async function getCanteenContractByBranchId(branchId) {
  if (!branchId) return null;
  try {
    const res = await apiFetch(`/api/canteen/contracts/${branchId}`);
    return res?.data || res || null;
  } catch (err) {
    console.warn(`[canteenBillingService] Gagal memuat kontrak UPT (${branchId}):`, err?.message || err);
    return null;
  }
}

/**
 * Mengambil rincian transaksi penjualan voucher kantin untuk Tab Rincian (Kantin & Superadmin)
 * Sesuai aturan baru: total detik tagihan = jumlah durasi paket yang dibeli WBP di kantin pada bulan itu.
 * Satu sumber yang sama dengan data transaksi penjualan (Riwayat Penjualan).
 *
 * @param {Object} params
 * @param {number} params.month
 * @param {number} params.year
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} params.search
 * @param {string} params.branchId (opsional, untuk Superadmin)
 * @returns {Promise<{ items: Array, totalItems: number, totalSeconds: number, subtotal: number|null, totalTagihan: number|null, ratePerSecond: number|null, superadminPercent: number|null, isContractSet: boolean, pagination: Object }>}
 */
export async function getCanteenBillingCalls({ month, year, page = 1, limit = 20, search = '', branchId } = {}) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  const user = getAuthUser();
  const effectiveBranchId = branchId && branchId !== 'semua' ? branchId : (user?.branchId || user?.branch?.id || null);

  // 1. Ambil kontrak yang berlaku untuk cabang ini dari GET /api/canteen/contracts (satu sumber)
  let contract = null;
  if (effectiveBranchId) {
    try {
      const cRes = await apiFetch(`/api/canteen/contracts/${effectiveBranchId}`);
      contract = cRes?.data || cRes || null;
    } catch {
      try {
        const allC = await getAllCanteenContracts();
        contract = allC.find((c) => String(c.branchId).toLowerCase() === String(effectiveBranchId).toLowerCase()) || null;
      } catch {}
    }
    if (!contract) {
      contract = findStoredContract(effectiveBranchId);
    }
  }

  const isContractSet = isCanteenContractConfigured(contract);
  const ratePerSecond = isContractSet ? Number(contract.ratePerSecond) : null;
  const superadminPercent = isContractSet ? Number(contract.superadminPercent ?? contract.negotiationPercent) : null;

  // 2. Ambil transaksi penjualan voucher kantin (sumber yang sama dengan Riwayat Penjualan)
  let transactions = [];
  try {
    const q = new URLSearchParams();
    q.append('page', '1');
    q.append('limit', '500');
    q.append('periode', 'bulanan');
    const mStr = String(targetMonth).padStart(2, '0');
    q.append('bulan', `${targetYear}-${mStr}`);
    if (effectiveBranchId) q.append('branchId', effectiveBranchId);
    if (search && search.trim()) q.append('search', search.trim());

    const res = await apiFetch(`/api/canteen/transactions?${q.toString()}`);
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []));
    if (items.length > 0) {
      transactions = items;
    }
  } catch (err) {
    console.warn('[canteenBillingService] Gagal memuat transaksi penjualan dari API:', err?.message || err);
  }

  // Fallback gabungkan dengan riwayat kantin jika kosong
  if (transactions.length === 0) {
    try {
      const { getRiwayat } = await import('./kantin/kantinService');
      const riwayatList = await getRiwayat({
        cari: search,
        periode: 'bulanan',
        tanggal: new Date(targetYear, targetMonth - 1, 15),
        page: 1,
        limit: 500,
      });
      if (Array.isArray(riwayatList) && riwayatList.length > 0) {
        transactions = riwayatList;
      }
    } catch {}
  }

  // Filter ketat berdasarkan batas bulan & tahun dalam zona waktu WIB (Asia/Jakarta)
  const filteredTxs = transactions.filter((t) => {
    const txDate = t.createdAt || t.waktu || t.date;
    if (!isDateInMonthWIB(txDate, targetMonth, targetYear)) return false;

    if (effectiveBranchId) {
      const bId = t.branchId || t.branch?.id;
      if (bId && String(bId).toLowerCase() !== String(effectiveBranchId).toLowerCase()) return false;
    }

    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      const idMatch = String(t.id || '').toLowerCase().includes(s);
      const codeMatch = String(t.kodeVoucher || '').toLowerCase().includes(s);
      const inmateMatch = String(t.inmate?.name || t.inmateName || t.napi?.nama || '').toLowerCase().includes(s);
      const nipMatch = String(t.inmate?.identifier || t.napi?.id || '').toLowerCase().includes(s);
      const pkgMatch = String(t.package?.name || t.packageName || t.paket?.nama || '').toLowerCase().includes(s);
      if (!idMatch && !codeMatch && !inmateMatch && !nipMatch && !pkgMatch) return false;
    }

    return true;
  });

  // Hitung total detik dan total tagihan dari durasi paket/voucher yang dibeli WBP
  let accumulatedSeconds = 0;
  const mappedItems = filteredTxs.map((t) => {
    const durationMinutes = Number(
      t.package?.durationMinutes ||
      t.package?.duration ||
      t.packageDuration ||
      t.durationMinutes ||
      (typeof t.paket?.durasi === 'string' ? parseInt(t.paket.durasi, 10) : t.paket?.durasi) ||
      0
    );
    const durationSeconds = durationMinutes * 60;
    accumulatedSeconds += durationSeconds;

    const nominal = isContractSet && ratePerSecond !== null && superadminPercent !== null
      ? Math.round(durationSeconds * ratePerSecond * (superadminPercent / 100))
      : null;

    return {
      id: t.id,
      createdAt: t.createdAt || t.waktu || t.date || new Date().toISOString(),
      kodeVoucher: t.kodeVoucher || (t.id ? String(t.id).slice(-8).toUpperCase() : '-'),
      inmateName: t.inmate?.name || t.inmateName || t.napi?.nama || 'WBP',
      inmateIdentifier: t.inmate?.identifier || t.napi?.id || '-',
      packageName: t.package?.name || t.packageName || t.paket?.nama || 'Paket Komunikasi',
      packageDuration: durationMinutes,
      cashierName: t.cashier?.name || t.petugas || 'Petugas Kantin',
      durationSeconds,
      ratePerSecond: isContractSet ? ratePerSecond : null,
      superadminPercent: isContractSet ? superadminPercent : null,
      nominal,
      totalAmount: Number(t.totalAmount || t.paket?.harga || t.package?.price || 0),
    };
  });

  // Pagination slice
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const totalItems = mappedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = mappedItems.slice(startIndex, startIndex + limitNum);

  // Perhitungan tagihan agregat satu rumus untuk periode ini
  const billingCalc = calculateUnifiedBilling({
    totalSeconds: accumulatedSeconds,
    ratePerSecond,
    superadminPercent,
  });

  return {
    items: paginatedItems,
    totalItems,
    totalSeconds: accumulatedSeconds,
    subtotal: billingCalc.subtotal,
    totalTagihan: billingCalc.totalAmount,
    ratePerSecond: billingCalc.ratePerSecond,
    superadminPercent: billingCalc.superadminPercent,
    isContractSet,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  };
}

/**
 * Menyimpan kontrak tarif per detik dan persen bagi hasil oleh Superadmin
 * Endpoint resmi: PUT /api/canteen/contracts/:branchId (kontrak per UPT / branchId)
 *
 * @param {string} branchId - ID Cabang / UPT
 * @param {{ ratePerSecond: number, superadminPercent?: number, canteenPercent?: number, negotiationPercent?: number, branchName?: string, canteenName?: string }} payload
 * @returns {Promise<Object>}
 */
export async function updateCanteenContract(branchId, payload) {
  const rate = Number(payload.ratePerSecond);
  const saPercent = payload.superadminPercent !== undefined && payload.superadminPercent !== null && payload.superadminPercent !== ''
    ? Number(payload.superadminPercent)
    : Number(payload.negotiationPercent);
  const ktPercent = payload.canteenPercent !== undefined && payload.canteenPercent !== null && payload.canteenPercent !== ''
    ? Number(payload.canteenPercent)
    : (100 - saPercent);

  // Validasi input
  if (isNaN(rate) || rate < 0) {
    throw new Error('Tarif per detik tidak boleh bernilai negatif.');
  }
  if (isNaN(saPercent) || saPercent < 0 || saPercent > 100) {
    throw new Error('Persen Superadmin harus berada di antara 0% hingga 100%.');
  }
  if (isNaN(ktPercent) || ktPercent < 0 || ktPercent > 100) {
    throw new Error('Persen Kantin harus berada di antara 0% hingga 100%.');
  }
  if (Math.round((saPercent + ktPercent) * 100) / 100 !== 100) {
    throw new Error('Total persentase Superadmin dan Kantin harus berjumlah 100%.');
  }

  // 1. Simpan langsung ke endpoint resmi BE: PUT /api/canteen/contracts/:branchId
  let beResult = null;
  try {
    const res = await apiFetch(`/api/canteen/contracts/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ratePerSecond: rate,
        superadminPercent: saPercent,
        canteenPercent: ktPercent,
      }),
    });
    beResult = res?.data || res;
  } catch (err) {
    console.warn('[canteenBillingService] Gagal update /api/canteen/contracts/:branchId:', err?.message || err);
    throw err;
  }

  // Juga sinkronkan ke PUT /api/branches/:id agar data entity branch selalu konsisten
  try {
    await apiFetch(`/api/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        contractRatePerSecond: rate,
        contractSharePercentage: saPercent,
      }),
    });
  } catch (_branchErr) {
    // Abaikan jika endpoint /api/branches sudah sinkron
  }

  // 2. Simpan ke local mock storage agar sinkronisasi instan antar-tab
  const updated = saveStoredContract(branchId, {
    ...payload,
    ratePerSecond: rate,
    superadminPercent: saPercent,
    canteenPercent: ktPercent,
    negotiationPercent: saPercent,
  });

  // Trigger event pembaruan agar semua tampilan sinkron seketika
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
    window.dispatchEvent(new CustomEvent('pascall_contract_changed', { detail: updated }));
    window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
    window.dispatchEvent(new Event('storage'));
  }

  return beResult || updated;
}

/**
 * Mengambil daftar konfigurasi kontrak seluruh kantin UPT (Tab Pengaturan Kontrak)
 * Endpoint resmi: GET /api/canteen/contracts (Role: SUPERADMIN)
 *
 * @returns {Promise<Array>}
 */
export async function getAllCanteenContracts() {
  // 1. Panggil endpoint resmi Backend: GET /api/canteen/contracts
  let beContracts = [];
  try {
    const res = await apiFetch('/api/canteen/contracts');
    const items = res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
    if (Array.isArray(items) && items.length > 0) {
      beContracts = items;
    }
  } catch (err) {
    console.warn('[canteenBillingService] Gagal memuat GET /api/canteen/contracts:', err?.message || err);
  }

  // 2. Ambil data cabang UPT untuk melengkapi informasi wilayah/kanwil jika diperlukan
  let branches = [];
  try {
    const branchesRes = await getBranches({ limit: 100 });
    branches = Array.isArray(branchesRes?.items)
      ? branchesRes.items
      : Array.isArray(branchesRes)
      ? branchesRes
      : [];
  } catch (err) {
    console.warn('[canteenBillingService] Gagal memuat branches dari API:', err);
  }

  const branchMap = {};
  branches.forEach((b) => {
    branchMap[b.id] = b;
  });

  // Jika endpoint /api/canteen/contracts mengembalikan daftar kontrak langsung
  if (beContracts.length > 0) {
    return beContracts.map((item) => {
      const b = branchMap[item.branchId] || {};
      const isContractSet = isCanteenContractConfigured(item);

      return {
        branchId: item.branchId,
        canteenName: item.canteenName || `Kantin ${item.branchName || b.name || item.branchId}`,
        uptName: item.branchName || b.name || `UPT ${item.branchId}`,
        kanwilName: b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas',
        ratePerSecond: isContractSet ? Number(item.ratePerSecond) : null,
        superadminPercent: isContractSet ? Number(item.superadminPercent) : null,
        canteenPercent: isContractSet ? Number(item.canteenPercent) : null,
        negotiationPercent: isContractSet ? Number(item.superadminPercent) : null,
        isContractSet,
        updatedAt: item.updatedAt || null,
        updatedBy: item.updatedBy || 'Superadmin',
      };
    });
  }

  if (branches.length === 0) {
    branches = [
      { id: 'b1', name: 'Lapas Kelas I Cipinang', kanwil: { name: 'Kanwil DKI Jakarta' } },
      { id: 'b2', name: 'Lapas Kelas IIA Salemba', kanwil: { name: 'Kanwil DKI Jakarta' } },
      { id: 'b3', name: 'Lapas Kelas IIA Yogyakarta', kanwil: { name: 'Kanwil D.I. Yogyakarta' } },
      { id: 'b4', name: 'Lapas Kelas I Surabaya', kanwil: { name: 'Kanwil Jawa Timur' } },
      { id: 'b5', name: 'Lapas Kelas I Medan', kanwil: { name: 'Kanwil Sumatera Utara' } },
      { id: 'b6', name: 'Lapas Kelas IIA Surakarta', kanwil: { name: 'Kanwil Jawa Tengah' } },
    ];
  }

  // 3. Fallback jika /api/canteen/contracts belum termuat
  return branches.map((b) => {
    let contract = findStoredContract(b.id, { branchName: b.name });
    if (!contract && b.contractRatePerSecond !== undefined && b.contractRatePerSecond !== null && b.contractSharePercentage !== undefined && b.contractSharePercentage !== null) {
      const numRate = Number(b.contractRatePerSecond);
      const numSa = Number(b.contractSharePercentage);
      if (!isNaN(numRate) && !isNaN(numSa)) {
        contract = {
          branchId: b.id,
          branchName: b.name,
          canteenName: `Kantin ${b.name}`,
          ratePerSecond: numRate,
          superadminPercent: numSa,
          canteenPercent: Math.max(0, 100 - numSa),
          negotiationPercent: numSa,
          isContractSet: true,
        };
      }
    }
    const isContractSet = isCanteenContractConfigured(contract);

    const saPercent = isContractSet
      ? (contract.superadminPercent !== null && contract.superadminPercent !== undefined
          ? Number(contract.superadminPercent)
          : Number(contract.negotiationPercent))
      : null;

    const ktPercent = isContractSet
      ? (contract.canteenPercent !== null && contract.canteenPercent !== undefined
          ? Number(contract.canteenPercent)
          : Math.max(0, 100 - (saPercent || 0)))
      : null;

    return {
      branchId: b.id,
      canteenName: contract?.canteenName || `Kantin ${b.name}`,
      uptName: b.name,
      kanwilName: b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas',
      ratePerSecond: isContractSet ? Number(contract.ratePerSecond) : null,
      superadminPercent: saPercent,
      canteenPercent: ktPercent,
      negotiationPercent: saPercent,
      isContractSet,
      updatedAt: contract?.updatedAt || null,
      updatedBy: contract?.updatedBy || null,
    };
  });
}

