/**
 * Inkopasindo Service (Role Inkopasindo - Modul Pemantauan Finansial 3 Pihak)
 * =========================================================================
 * Alokasi Resmi 3 Pihak:
 * 1. Vendor (Sadewa): 60%
 * 2. UPT Pemasyarakatan: 30%
 * 3. Inkopasindo: 10%
 * Catatan: Kantin TIDAK muncul dalam pembagian kontrak.
 * Seluruh halaman dan operasi bersifat READ-ONLY.
 *
 * Backend Policy:
 * Menggunakan endpoint Finance & Branch yang sudah tersedia (read-only),
 * tanpa mengubah backend PasCall-BackEnd sama sekali.
 */

import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from './api';
import { exportInvoicePDF } from '../utils/exportUtils';
import {
  getFinanceBillings,
  getAllFinanceBillings,
  getFinanceContracts,
  formatRupiah,
  MONTH_NAMES
} from './financeService';

export { formatRupiah, MONTH_NAMES };

/**
 * Nilai default pembagian 3 pihak jika data kontrak belum terdefinisi di backend
 */
export const DEFAULT_3WAY_SPLIT = {
  vendor: 60,
  upt: 30,
  inkopasindo: 10,
};

/**
 * Ekstraksi persentase kontrak 3 pihak secara dinamis dari data kontrak / billing item.
 * Tidak ditulis mati; mengambil nilai dari kontrak yang terdaftar.
 * Kantin tidak dimunculkan.
 */
export const getContract3WaySplit = (item) => {
  const split = item?.split || {};

  // 1. Inkopasindo: ambil dari split.inkopasindo jika ada, default 10%
  const inkopasindo = typeof split.inkopasindo === 'number' && !isNaN(split.inkopasindo)
    ? split.inkopasindo
    : 10;

  // 2. UPT: jika kontrak secara spesifik memiliki split.upt, gunakan nilainya; jika tidak default 30%
  let upt = 30;
  if (typeof split.upt === 'number' && !isNaN(split.upt)) {
    upt = split.upt;
  } else if (typeof split.koperasi === 'number' && split.koperasi !== 30) {
    // Jika ada konfigurasi kustom khusus
    const combined = (Number(split.koperasi) || 0) + (Number(split.kepalaUpt) || 0);
    upt = combined > 0 ? combined : 30;
  }

  // 3. Vendor: ambil dari split.vendor (kecuali nilai 4-pihak lama 55/50), atau default 100 - inkopasindo - upt
  let vendor = typeof split.vendor === 'number' && !isNaN(split.vendor) && split.vendor !== 55 && split.vendor !== 50
    ? split.vendor
    : (100 - inkopasindo - upt);

  // Normalisasi agar tepat 100%
  if (vendor + upt + inkopasindo !== 100) {
    vendor = 100 - upt - inkopasindo;
    if (vendor < 0) {
      vendor = 60;
      upt = 30;
    }
  }

  return { vendor, upt, inkopasindo };
};

/**
 * Menghitung nominal rupiah hak 3 pihak dari total omset kotor
 */
export const calculate3WayShares = (grossAmount, split) => {
  const gross = Number(grossAmount) || 0;
  const vendorPct = Number(split?.vendor) || 60;
  const uptPct = Number(split?.upt) || 30;
  const inkopasindoPct = Number(split?.inkopasindo) || 10;

  const vendorAmount = Math.round((gross * vendorPct) / 100);
  const uptAmount = Math.round((gross * uptPct) / 100);
  // Alokasi Inkopasindo menjamin tidak ada selisih pembulatan
  const inkopasindoAmount = Math.max(0, gross - vendorAmount - uptAmount);

  return {
    vendor: { percent: vendorPct, amount: vendorAmount },
    upt: { percent: uptPct, amount: uptAmount },
    inkopasindo: { percent: inkopasindoPct, amount: inkopasindoAmount },
  };
};

/**
 * Menstandarkan item tagihan dengan pembagian 3 pihak
 */
export const normalizeBillingItem = (b) => {
  const split = getContract3WaySplit(b);
  const shares3Way = calculate3WayShares(b.grossAmount, split);

  return {
    ...b,
    split3Way: split,
    shares3Way,
    // Pastikan nama kanwil dan UPT selalu ada
    branchName: b.branchName || b.branch?.name || 'UPT Pemasyarakatan',
    kanwilName: b.kanwilName || b.kanwil?.name || b.branch?.kanwilName || 'Kantor Wilayah',
    grossAmount: Number(b.grossAmount) || 0,
  };
};

/**
 * 1. Mengambil ringkasan data finansial untuk Dashboard Inkopasindo
 * Menghasilkan:
 * - 4 kartu: Total Omset Kotor, Sudah Dibayar, Menunggu Verifikasi, Belum Dibayar
 * - Kartu alokasi 3 pihak: Vendor 60%, UPT 30%, Inkopasindo 10% (persentase dinamis dari data kontrak)
 * - Rekap status tagihan UPT
 */
export const getInkopasindoDashboardData = async ({ month = null, year = '2026', status = 'semua' } = {}) => {
  // TODO: Sambungkan ke endpoint backend khusus Inkopasindo jika nantinya disediakan oleh tim BE
  try {
    // Menggunakan fungsi sumber data yang sama dengan modul Finance / Superadmin
    const allBillings = await getAllFinanceBillings();
    const normalized = (Array.isArray(allBillings) ? allBillings : []).map(normalizeBillingItem);

    // Filter berdasarkan tahun
    let filtered = normalized;
    if (year && year !== 'semua') {
      filtered = filtered.filter((b) => String(b.year) === String(year));
    }
    // Filter berdasarkan bulan
    if (month && month !== 'semua') {
      filtered = filtered.filter((b) => String(b.month) === String(month));
    }

    // 4 Kartu Metrik Utama
    const totalOmsetKotor = filtered.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const totalPaid = filtered.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const totalPending = filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const totalUnpaid = filtered.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

    // Hitung jumlah record per status
    const paidCount = filtered.filter((b) => b.status === 'PAID').length;
    const pendingCount = filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
    const unpaidCount = filtered.filter((b) => b.status === 'UNPAID').length;

    // Alokasi 3 Pihak (Vendor, UPT, Inkopasindo)
    const vendorTotal = filtered.reduce((acc, b) => acc + (b.shares3Way?.vendor?.amount || 0), 0);
    const uptTotal = filtered.reduce((acc, b) => acc + (b.shares3Way?.upt?.amount || 0), 0);
    const inkopasindoTotal = filtered.reduce((acc, b) => acc + (b.shares3Way?.inkopasindo?.amount || 0), 0);

    // Persentase dinamis dari data kontrak aktif (bukan ditulis mati)
    let vendorPct = 60;
    let uptPct = 30;
    let inkopasindoPct = 10;
    if (filtered.length > 0) {
      const firstSplit = filtered[0].split3Way;
      vendorPct = firstSplit.vendor;
      uptPct = firstSplit.upt;
      inkopasindoPct = firstSplit.inkopasindo;
    }

    // Tagihan untuk tabel rekap (dengan filter status tabel jika dipilih)
    let tableBillings = filtered;
    if (status && status !== 'semua') {
      tableBillings = tableBillings.filter((b) => b.status === status);
    }

    // Urutkan berdasarkan waktu/bulan terbaru
    tableBillings.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return (a.branchName || '').localeCompare(b.branchName || '');
    });

    return {
      summary: {
        totalOmsetKotor,
        totalPaid,
        totalPending,
        totalUnpaid,
        totalRecords: filtered.length,
        counts: {
          paid: paidCount,
          pending: pendingCount,
          unpaid: unpaidCount,
        },
        shares: {
          vendor: { amount: vendorTotal, percent: vendorPct },
          upt: { amount: uptTotal, percent: uptPct },
          inkopasindo: { amount: inkopasindoTotal, percent: inkopasindoPct },
        },
      },
      recentBillings: tableBillings,
    };
  } catch (error) {
    // 5. Tangkap jika request ditolak (403/401) atau gagal, tampilkan pesan error di console
    if (error?.status === 401 || error?.status === 403) {
      console.error(`[InkopasindoService] Request dashboard ditolak (${error.status}): Hak akses ditolak oleh server.`, error);
    } else {
      console.error('[InkopasindoService] Error getInkopasindoDashboardData:', error);
    }
    // TODO: Fallback ke keadaan kosong yang rapi jika terjadi error atau data belum tersedia
    return {
      summary: {
        totalOmsetKotor: 0,
        totalPaid: 0,
        totalPending: 0,
        totalUnpaid: 0,
        totalRecords: 0,
        counts: { paid: 0, pending: 0, unpaid: 0 },
        shares: {
          vendor: { amount: 0, percent: 60 },
          upt: { amount: 0, percent: 30 },
          inkopasindo: { amount: 0, percent: 10 },
        },
      },
      recentBillings: [],
    };
  }
};

/**
 * 2. Mengambil daftar tagihan seluruh UPT untuk halaman Tagihan
 * Memakai ulang fungsi getFinanceBillings / getAllFinanceBillings dari modul Finance.
 * Mendukung filter: Kanwil, UPT, Periode (Bulan & Tahun), Status, serta pencarian kata kunci.
 */
export const getInkopasindoBillings = async ({
  month = 'semua',
  year = '2026',
  kanwil = 'semua',
  branchId = 'semua',
  status = 'semua',
  search = '',
} = {}) => {
  // TODO: Hubungkan ke endpoint BE khusus /api/inkopasindo/billings jika nantinya disediakan
  try {
    // 1 & 2. Gunakan fungsi yang sama dengan halaman Finance/Superadmin untuk mengambil tagihan semua UPT
    let rawList = await getFinanceBillings({
      month,
      year,
      branchId,
      status,
      search,
    });

    if (!Array.isArray(rawList)) {
      rawList = [];
    }

    // Normalisasikan setiap baris dengan pembagian 3 pihak dinamis
    let list = rawList.map(normalizeBillingItem);

    // 3. Filter Kanwil (didukung langsung di sisi client untuk akurasi Kanwil)
    if (kanwil && kanwil !== 'semua') {
      list = list.filter((b) =>
        (b.kanwilName && b.kanwilName.toLowerCase().includes(kanwil.toLowerCase())) ||
        (b.kanwilId && String(b.kanwilId) === String(kanwil))
      );
    }

    // Filter tambahan pencarian teks
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) =>
        (b.id && String(b.id).toLowerCase().includes(q)) ||
        (b.branchName && b.branchName.toLowerCase().includes(q)) ||
        (b.kanwilName && b.kanwilName.toLowerCase().includes(q)) ||
        (b.canteenName && b.canteenName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return (a.branchName || '').localeCompare(b.branchName || '');
    });
  } catch (error) {
    // 5. Tangani jika request ditolak (403/401) atau server error
    if (error?.status === 401 || error?.status === 403) {
      console.error(`[InkopasindoService] Request tagihan ditolak (${error.status}): Akses ditolak oleh server.`, error);
    } else {
      console.error('[InkopasindoService] Error getInkopasindoBillings:', error);
    }
    // TODO: Kembalikan daftar kosong jika data belum tersedia atau request ditolak
    return [];
  }
};

/**
 * Mengambil daftar referensi Kanwil & UPT untuk dropdown filter
 */
export const getInkopasindoFilterOptions = async () => {
  try {
    // Ambil data dari endpoint finance yang resmi diizinkan untuk INKOPASINDO
    const [billingsRes, contractsRes] = await Promise.all([
      getFinanceBillings().catch(() => []),
      getFinanceContracts().catch(() => []),
    ]);

    const kanwilMap = new Map();
    const branchMap = new Map();

    const processItem = (item) => {
      const kName = item.kanwilName || item.kanwil?.name;
      const kId = item.kanwilId || item.kanwil?.id || kName;
      if (kName && !kanwilMap.has(kName)) {
        kanwilMap.set(kName, { id: kId, name: kName });
      }

      const bId = item.branchId || item.branch?.id || item.id;
      const bName = item.branchName || item.branch?.name || item.name;
      if (bId && bName && !branchMap.has(bId)) {
        branchMap.set(bId, {
          id: bId,
          name: bName,
          kanwilName: kName || '',
          kanwilId: kId || '',
        });
      }
    };

    if (Array.isArray(billingsRes)) {
      billingsRes.forEach(processItem);
    }
    if (Array.isArray(contractsRes)) {
      contractsRes.forEach(processItem);
    }

    return {
      kanwils: Array.from(kanwilMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      branches: Array.from(branchMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (err) {
    console.warn('[InkopasindoService] Fallback filter options:', err);
    return { kanwils: [], branches: [] };
  }
};

/**
 * 3. Mengambil data untuk halaman Laporan Finansial Inkopasindo
 * - Akumulasi tahunan (Total Omset Kotor, Terealisasi, Menunggu Verifikasi, Belum Tertagih)
 * - 3 kartu hak finansial (Vendor, UPT, Inkopasindo) dengan terealisasi dan tertunda
 * - Rincian bulanan
 */
export const getInkopasindoReportsData = async (year = '2026') => {
  // TODO: Hubungkan ke endpoint BE khusus /api/inkopasindo/reports jika kelak disediakan oleh tim Backend
  try {
    const rawBillings = await getAllFinanceBillings();
    const all = (Array.isArray(rawBillings) ? rawBillings : [])
      .map(normalizeBillingItem)
      .filter((b) => String(b.year) === String(year));

    // 12 Bulan dalam setahun
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const monthlyBreakdown = months.map((m) => {
      const monthItems = all.filter((b) => b.month === m);
      const gross = monthItems.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
      const paid = monthItems.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
      const pending = monthItems.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
      const unpaid = monthItems.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

      const vendorShare = monthItems.reduce((acc, b) => acc + (b.shares3Way?.vendor?.amount || 0), 0);
      const uptShare = monthItems.reduce((acc, b) => acc + (b.shares3Way?.upt?.amount || 0), 0);
      const inkopasindoShare = monthItems.reduce((acc, b) => acc + (b.shares3Way?.inkopasindo?.amount || 0), 0);

      return {
        month: m,
        monthName: MONTH_NAMES[m - 1],
        totalUpt: monthItems.length,
        gross,
        paid,
        pending,
        unpaid,
        shares: {
          vendor: vendorShare,
          upt: uptShare,
          inkopasindo: inkopasindoShare,
        },
      };
    });

    // Akumulasi Tahunan
    const totalOmsetKotor = all.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const totalRealized = all.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const totalPending = all.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const totalUnpaid = all.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

    // 3 Kartu Hak Finansial
    const stakeholderTotals = {
      vendor: { total: 0, realized: 0, pending: 0, percent: 60 },
      upt: { total: 0, realized: 0, pending: 0, percent: 30 },
      inkopasindo: { total: 0, realized: 0, pending: 0, percent: 10 },
    };

    all.forEach((b) => {
      const isPaid = b.status === 'PAID';
      const v = b.shares3Way?.vendor?.amount || 0;
      const u = b.shares3Way?.upt?.amount || 0;
      const ink = b.shares3Way?.inkopasindo?.amount || 0;

      stakeholderTotals.vendor.total += v;
      if (isPaid) stakeholderTotals.vendor.realized += v;
      else stakeholderTotals.vendor.pending += v;

      stakeholderTotals.upt.total += u;
      if (isPaid) stakeholderTotals.upt.realized += u;
      else stakeholderTotals.upt.pending += u;

      stakeholderTotals.inkopasindo.total += ink;
      if (isPaid) stakeholderTotals.inkopasindo.realized += ink;
      else stakeholderTotals.inkopasindo.pending += ink;
    });

    if (all.length > 0) {
      stakeholderTotals.vendor.percent = all[0].split3Way.vendor;
      stakeholderTotals.upt.percent = all[0].split3Way.upt;
      stakeholderTotals.inkopasindo.percent = all[0].split3Way.inkopasindo;
    }

    return {
      grandTotals: {
        totalOmsetKotor,
        totalRealized,
        totalPending,
        totalUnpaid,
      },
      stakeholderTotals,
      monthlyBreakdown,
    };
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      console.error(`[InkopasindoService] Request laporan ditolak (${error.status}): Hak akses ditolak oleh server.`, error);
    } else {
      console.error('[InkopasindoService] Error getInkopasindoReportsData:', error);
    }
    // TODO: Fallback laporan kosong jika terjadi error atau data belum tersedia
    return {
      grandTotals: { totalOmsetKotor: 0, totalRealized: 0, totalPending: 0, totalUnpaid: 0 },
      stakeholderTotals: {
        vendor: { total: 0, realized: 0, pending: 0, percent: 60 },
        upt: { total: 0, realized: 0, pending: 0, percent: 30 },
        inkopasindo: { total: 0, realized: 0, pending: 0, percent: 10 },
      },
      monthlyBreakdown: [],
    };
  }
};

/**
 * 4. Generator Invoice PDF Resmi Inkopasindo (1 Halaman A4 Bersih & Rapi)
 * Memuat:
 * 1. Judul "Invoice" dan nomor tagihan
 * 2. Periode Tagihan
 * 3. Nama UPT dan Kanwil
 * 4. Total omset kotor
 * 5. Jumlah yang harus dibayar ke vendor (ditampilkan paling menonjol, huruf besar dan tebal)
 *
 * Catatan:
 * - Tabel pembagian 3 pihak dihapus.
 * - Jumlah ke vendor dihitung dinamis dari persentase kontrak vendor (bukan ditulis mati).
 * - Jika omset Rp 0, tetap tampilkan invoice dengan angka Rp 0.
 */
/**
 * Utility untuk mengunduh Faktur Invoice Resmi Digital Wartel Sadewa
 * Menggunakan format standar yang sama dengan halaman Tagihan Lapas (exportInvoicePDF).
 */
export const generateInkopasindoInvoicePDF = async (item, openPreview = true) => {
  if (!item) return false;

  try {
    const normalized = normalizeBillingItem(item);
    const shares = normalized.shares3Way;
    const split = normalized.split3Way;

    const periodStr = `${MONTH_NAMES[(normalized.month || 1) - 1]} ${normalized.year}`;
    const totalMinutes = Math.round(Number(item.totalMinutes || (normalized.grossAmount > 0 ? (normalized.grossAmount / 15 / 60) : 0)));
    const totalSeconds = Number(item.totalSeconds || (totalMinutes * 60));

    return exportInvoicePDF({
      invoiceNumber: normalized.id || `INV-${normalized.year}${String(normalized.month).padStart(2, '0')}-${(normalized.branchName || 'UPT').substring(0, 4).toUpperCase()}`,
      period: periodStr,
      branchName: normalized.branchName || 'Lapas I Ungaran',
      kanwilName: normalized.kanwilName || 'Kanwil Jawa Tengah',
      canteenName: item.canteenName || 'Dzaki Ardyan',
      totalGross: normalized.grossAmount,
      canteenKeepAmount: shares.upt.amount,
      vendorDepositAmount: shares.vendor.amount,
      vendorPercent: split.vendor,
      canteenPercent: split.upt,
      totalMinutes,
      totalSeconds,
      ratePerSecond: item.ratePerSecond || 15,
      status: normalized.status === 'PAID' ? 'LUNAS' : normalized.status === 'PENDING_CONFIRMATION' ? 'MENUNGGU VERIFIKASI' : normalized.grossAmount <= 0 ? 'Tidak Ada Tagihan' : 'BELUM DIBAYAR',
      dueDate: item.dueDate || 'Tanggal 2 bulan berikutnya',
      filename: `Invoice_${normalized.id || 'Sadewa'}.pdf`,
      openPreview,
    });
  } catch (err) {
    console.error('[InkopasindoService] Error generating PDF invoice:', err);
    return false;
  }
};

/**
 * Mengirimkan pembayaran tagihan setoran vendor 60% per Lapas/UPT oleh Inkopasindo
 * POST /api/canteen/topups (Multipart FormData)
 */
export const submitInkopasindoVendorPayment = async ({
  branchId,
  nominal,
  minutes = 1,
  paymentMethod = 'TRANSFER_BANK',
  bankTarget = 'Bank Mandiri 168-00-9988112-7',
  proofFile,
  billingMonth,
  billingYear,
}) => {
  if (!branchId) throw new Error('Cabang UPT wajib ditentukan.');
  if (!nominal || Number(nominal) <= 0) throw new Error('Nominal tagihan harus lebih besar dari 0.');
  if (!proofFile) throw new Error('File bukti transfer wajib diunggah.');

  const formData = new FormData();
  formData.append('branchId', String(branchId));
  formData.append('nominal', String(nominal));
  formData.append('minutes', String(minutes > 0 ? minutes : 1));
  formData.append('paymentMethod', paymentMethod);
  formData.append('bankTarget', String(bankTarget));
  formData.append('proofFile', proofFile);
  if (billingMonth) formData.append('billingMonth', String(billingMonth));
  if (billingYear) formData.append('billingYear', String(billingYear));

  return apiFetch('/api/canteen/topups', {
    method: 'POST',
    body: formData,
  });
};

/**
 * 5. Ekspor Data Laporan Tahunan ke Dokumen Excel (.xlsx) Resmi dengan Tabel Berbingkai Rapi
 * - Border garis tabel lengkap pada setiap sel
 * - Header tabel berwarna Navy dengan teks putih tebal
 * - Format angka ribuan (numFmt: '#,##0') rata kanan
 * - Kolom rata tengah dan rata kiri proporsional
 * - Baris Total Akhir dengan highlight warna dan garis ganda bawah
 */
export const exportInkopasindoReportExcel = ({ year, monthlyBreakdown = [], grandTotals = {}, stakeholderTotals = {} }) => {
  try {
    const wb = XLSX.utils.book_new();

    const borderThin = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    };

    const borderDoubleBottom = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'double', color: { rgb: '0B3D91' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    };

    const styleBannerTitle = {
      font: { bold: true, color: { rgb: '0B3D91' }, sz: 16, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'left' },
    };

    const styleBannerSubtitle = {
      font: { bold: true, color: { rgb: '0F172A' }, sz: 13, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'left' },
    };

    const styleSectionHeader = {
      font: { bold: true, color: { rgb: '0F172A' }, sz: 11.5, name: 'Calibri' },
      fill: { fgColor: { rgb: 'E2E8F0' } }, // slate-200
      alignment: { vertical: 'center', horizontal: 'left' },
      border: borderThin,
    };

    const styleColHeader = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { fgColor: { rgb: '0B3D91' } }, // Primary Navy
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: borderThin,
    };

    const styleCellText = {
      font: { sz: 11, color: { rgb: '1E293B' }, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'left' },
      border: borderThin,
    };

    const styleCellCenter = {
      font: { sz: 11, color: { rgb: '1E293B' }, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'center' },
      border: borderThin,
    };

    const styleCellNumber = {
      font: { sz: 11, color: { rgb: '0F172A' }, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'right' },
      numFmt: '#,##0',
      border: borderThin,
    };

    const styleCellBoldText = {
      font: { bold: true, sz: 11, color: { rgb: '0F172A' }, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'left' },
      border: borderThin,
    };

    const styleCellBoldCenter = {
      font: { bold: true, sz: 11, color: { rgb: '0F172A' }, name: 'Calibri' },
      alignment: { vertical: 'center', horizontal: 'center' },
      border: borderThin,
    };

    const styleTotalText = {
      font: { bold: true, sz: 11.5, color: { rgb: '0B3D91' }, name: 'Calibri' },
      fill: { fgColor: { rgb: 'EEF2FF' } }, // blue-50
      alignment: { vertical: 'center', horizontal: 'left' },
      border: borderDoubleBottom,
    };

    const styleTotalNumber = {
      font: { bold: true, sz: 11.5, color: { rgb: '0B3D91' }, name: 'Calibri' },
      fill: { fgColor: { rgb: 'EEF2FF' } },
      alignment: { vertical: 'center', horizontal: 'right' },
      numFmt: '#,##0',
      border: borderDoubleBottom,
    };

    const aoa = [];
    const cellStyles = {};
    const rowHeights = [];
    const merges = [];

    let r = 0;

    // --- Header Judul Laporan (Bersih Tanpa Label Tahun Buku & Waktu Unduh Terpisah) ---
    aoa.push(['SADEWA INDONESIA • KOPERASI INKOPASINDO']);
    cellStyles[`${r},0`] = styleBannerTitle;
    rowHeights[r] = { hpt: 28 };
    merges.push({ s: { r, c: 0 }, e: { r, c: 8 } });
    r++;

    aoa.push([`LAPORAN AKUMULASI FINANSIAL TAHUN BUKU ${year || new Date().getFullYear()}`]);
    cellStyles[`${r},0`] = styleBannerSubtitle;
    rowHeights[r] = { hpt: 24 };
    merges.push({ s: { r, c: 0 }, e: { r, c: 8 } });
    r++;

    aoa.push([]); // baris kosong
    rowHeights[r] = { hpt: 12 };
    r++;

    // ==========================================
    // TABEL 1: RINGKASAN AKUMULASI TAHUNAN
    // ==========================================
    aoa.push(['1. RINGKASAN AKUMULASI TAHUNAN', '']);
    cellStyles[`${r},0`] = styleSectionHeader;
    cellStyles[`${r},1`] = styleSectionHeader;
    rowHeights[r] = { hpt: 24 };
    merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
    r++;

    aoa.push(['Parameter Akumulasi Finansial', 'Nominal (Rp)']);
    cellStyles[`${r},0`] = styleColHeader;
    cellStyles[`${r},1`] = styleColHeader;
    rowHeights[r] = { hpt: 26 };
    r++;

    const summaryItems = [
      ['Total Omset Kotor', Number(grandTotals.totalOmsetKotor) || 0, true],
      ['Sudah Terealisasi (Lunas)', Number(grandTotals.totalRealized) || 0, false],
      ['Menunggu Verifikasi Setoran', Number(grandTotals.totalPending) || 0, false],
      ['Belum Tertagih', Number(grandTotals.totalUnpaid) || 0, false],
    ];

    summaryItems.forEach(([label, val, isBold]) => {
      aoa.push([label, val]);
      cellStyles[`${r},0`] = isBold ? styleCellBoldText : styleCellText;
      cellStyles[`${r},1`] = isBold
        ? { ...styleCellNumber, font: { bold: true, sz: 11, color: { rgb: '0B3D91' }, name: 'Calibri' } }
        : styleCellNumber;
      rowHeights[r] = { hpt: 22 };
      r++;
    });

    aoa.push([]); // baris kosong
    rowHeights[r] = { hpt: 12 };
    r++;

    // ==========================================
    // TABEL 2: HAK FINANSIAL 3 PIHAK
    // ==========================================
    aoa.push(['2. HAK FINANSIAL 3 PIHAK (BERDASARKAN KONTRAK KERJASAMA)', '', '', '', '']);
    for (let c = 0; c < 5; c++) cellStyles[`${r},${c}`] = styleSectionHeader;
    rowHeights[r] = { hpt: 24 };
    merges.push({ s: { r, c: 0 }, e: { r, c: 4 } });
    r++;

    const t2Headers = ['Pihak Entitas', 'Porsi Kontrak', 'Total Hak (Rp)', 'Terealisasi (Rp)', 'Tertunda (Rp)'];
    aoa.push(t2Headers);
    t2Headers.forEach((_, c) => {
      cellStyles[`${r},${c}`] = styleColHeader;
    });
    rowHeights[r] = { hpt: 26 };
    r++;

    const stakeholderRows = [
      [
        'Vendor (Sadewa)',
        `${Number(stakeholderTotals.vendor?.percent ?? 60)}%`,
        Number(stakeholderTotals.vendor?.total ?? 0),
        Number(stakeholderTotals.vendor?.realized ?? 0),
        Number(stakeholderTotals.vendor?.pending ?? 0),
      ],
      [
        'UPT Pemasyarakatan',
        `${Number(stakeholderTotals.upt?.percent ?? 30)}%`,
        Number(stakeholderTotals.upt?.total ?? 0),
        Number(stakeholderTotals.upt?.realized ?? 0),
        Number(stakeholderTotals.upt?.pending ?? 0),
      ],
      [
        'Koperasi Inkopasindo',
        `${Number(stakeholderTotals.inkopasindo?.percent ?? 10)}%`,
        Number(stakeholderTotals.inkopasindo?.total ?? 0),
        Number(stakeholderTotals.inkopasindo?.realized ?? 0),
        Number(stakeholderTotals.inkopasindo?.pending ?? 0),
      ],
    ];

    stakeholderRows.forEach((row) => {
      aoa.push(row);
      cellStyles[`${r},0`] = styleCellBoldText;
      cellStyles[`${r},1`] = styleCellBoldCenter;
      cellStyles[`${r},2`] = styleCellNumber;
      cellStyles[`${r},3`] = styleCellNumber;
      cellStyles[`${r},4`] = styleCellNumber;
      rowHeights[r] = { hpt: 22 };
      r++;
    });

    aoa.push([]); // baris kosong
    rowHeights[r] = { hpt: 12 };
    r++;

    // ==========================================
    // TABEL 3: RINCIAN BULANAN (9 KOLOM LENGKAP)
    // ==========================================
    aoa.push([`3. RINCIAN BULANAN TAHUN BUKU ${year}`, '', '', '', '', '', '', '', '']);
    for (let c = 0; c < 9; c++) cellStyles[`${r},${c}`] = styleSectionHeader;
    rowHeights[r] = { hpt: 24 };
    merges.push({ s: { r, c: 0 }, e: { r, c: 8 } });
    r++;

    const t3Headers = [
      'Bulan',
      'Total UPT',
      'Omset Kotor (Rp)',
      'Lunas (Rp)',
      'Menunggu (Rp)',
      'Belum Bayar (Rp)',
      'Hak Vendor 60% (Rp)',
      'Hak UPT 30% (Rp)',
      'Hak Inkopasindo 10% (Rp)',
    ];
    aoa.push(t3Headers);
    t3Headers.forEach((_, c) => {
      cellStyles[`${r},${c}`] = styleColHeader;
    });
    rowHeights[r] = { hpt: 28 };
    r++;

    let sumGross = 0;
    let sumPaid = 0;
    let sumPending = 0;
    let sumUnpaid = 0;
    let sumVendor = 0;
    let sumUptShare = 0;
    let sumInkopasindo = 0;

    monthlyBreakdown.forEach((m, idx) => {
      const gross = Number(m.gross) || 0;
      const paid = Number(m.paid) || 0;
      const pending = Number(m.pending) || 0;
      const unpaid = Number(m.unpaid) || 0;
      const vendorShare = Number(m.shares?.vendor) || 0;
      const uptShare = Number(m.shares?.upt) || 0;
      const inkopasindoShare = Number(m.shares?.inkopasindo) || 0;
      const uptCount = Number(m.totalUpt) || 0;

      sumGross += gross;
      sumPaid += paid;
      sumPending += pending;
      sumUnpaid += unpaid;
      sumVendor += vendorShare;
      sumUptShare += uptShare;
      sumInkopasindo += inkopasindoShare;

      aoa.push([
        m.monthName || '-',
        uptCount,
        gross,
        paid,
        pending,
        unpaid,
        vendorShare,
        uptShare,
        inkopasindoShare,
      ]);

      const zebraFill = idx % 2 === 1 ? { fgColor: { rgb: 'F8FAFC' } } : undefined;
      const rowTextStyle = zebraFill ? { ...styleCellBoldText, fill: zebraFill } : styleCellBoldText;
      const rowCenterStyle = zebraFill ? { ...styleCellCenter, fill: zebraFill } : styleCellCenter;
      const rowNumStyle = zebraFill ? { ...styleCellNumber, fill: zebraFill } : styleCellNumber;

      cellStyles[`${r},0`] = rowTextStyle;
      cellStyles[`${r},1`] = rowCenterStyle;
      for (let c = 2; c < 9; c++) {
        cellStyles[`${r},${c}`] = rowNumStyle;
      }
      rowHeights[r] = { hpt: 22 };
      r++;
    });

    // Baris TOTAL KESELURUHAN (Highlight Biru & Garis Ganda Bawah)
    aoa.push([
      'TOTAL KESELURUHAN',
      '-',
      sumGross,
      sumPaid,
      sumPending,
      sumUnpaid,
      sumVendor,
      sumUptShare,
      sumInkopasindo,
    ]);
    cellStyles[`${r},0`] = styleTotalText;
    cellStyles[`${r},1`] = { ...styleTotalText, alignment: { horizontal: 'center', vertical: 'center' } };
    for (let c = 2; c < 9; c++) {
      cellStyles[`${r},${c}`] = styleTotalNumber;
    }
    rowHeights[r] = { hpt: 26 };
    r++;

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Terapkan semua style ke cell yang sesuai
    Object.keys(cellStyles).forEach((coord) => {
      const [rowIdx, colIdx] = coord.split(',').map(Number);
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      ws[cellRef].s = cellStyles[coord];
    });

    // Pasang merges, row heights & konfigurasi lebar kolom proporsional
    ws['!merges'] = merges;
    ws['!rows'] = rowHeights;
    ws['!cols'] = [
      { wch: 36 }, // A: Parameter / Entitas / Bulan
      { wch: 20 }, // B: Nominal / Porsi / Total UPT
      { wch: 26 }, // C: Omset Kotor / Total Hak
      { wch: 24 }, // D: Lunas / Terealisasi
      { wch: 24 }, // E: Menunggu / Tertunda
      { wch: 24 }, // F: Belum Bayar
      { wch: 26 }, // G: Hak Vendor 60%
      { wch: 24 }, // H: Hak UPT 30%
      { wch: 28 }, // I: Hak Inkopasindo 10%
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${year}`);
    XLSX.writeFile(wb, `Laporan-Finansial-Inkopasindo-${year}.xlsx`);
    return true;
  } catch (err) {
    console.error('[InkopasindoService] Error exporting Excel:', err);
    return false;
  }
};

/**
 * Kompatibilitas mundur: jika masih ada yang memanggil exportInkopasindoReportCSV
 */
export const exportInkopasindoReportCSV = exportInkopasindoReportExcel;

/**
 * 6. Cetak / Ekspor Laporan Finansial Resmi Inkopasindo ke Dokumen PDF (A4 Landscape)
 * Langsung membuka pratinjau cetak & menyimpan berkas PDF
 */
export const generateInkopasindoReportPDF = ({
  year,
  monthlyBreakdown = [],
  grandTotals = {},
  _stakeholderTotals = {},
  openPreview = true,
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let currentY = 14;

    // 1. Accent Top Header Bar Navy
    doc.setFillColor(11, 61, 145);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // 2. Official Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(11, 61, 145);
    doc.text('SADEWA INDONESIA • KOPERASI INKOPASINDO', margin, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`LAPORAN AKUMULASI FINANSIAL TAHUNAN (TAHUN BUKU ${year || 2026})`, margin, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Waktu Cetak: ${new Date().toLocaleString('id-ID')} | Porsi Kontrak Resmi: Vendor 60%, UPT 30%, Inkopasindo 10%`,
      margin,
      currentY + 17
    );

    currentY += 22;

    // 3. Ringkasan Kartu 4 Metrik
    const cardWidth = (pageWidth - margin * 2 - 9) / 4;
    const statCards = [
      { label: 'TOTAL OMSET KOTOR', val: formatRupiah(grandTotals.totalOmsetKotor || 0), color: [11, 61, 145] },
      { label: 'SUDAH TEREALISASI', val: formatRupiah(grandTotals.totalRealized || 0), color: [16, 185, 129] },
      { label: 'MENUNGGU VERIFIKASI', val: formatRupiah(grandTotals.totalPending || 0), color: [245, 158, 11] },
      { label: 'BELUM TERTAGIH', val: formatRupiah(grandTotals.totalUnpaid || 0), color: [239, 68, 68] },
    ];

    statCards.forEach((c, i) => {
      const cardX = margin + i * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cardX + 4, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, cardX + 4, currentY + 14);
    });

    currentY += 23;

    // 4. Tabel Rincian Bulanan (A4 Landscape)
    const tableHeaders = [
      'Bulan',
      'Total UPT',
      'Omset Kotor',
      'Lunas',
      'Menunggu',
      'Belum Bayar',
      'Hak Vendor (60%)',
      'Hak UPT (30%)',
      'Hak Inkopasindo (10%)',
    ];

    const tableRows = monthlyBreakdown.map((m) => [
      m.monthName,
      m.totalUpt,
      formatRupiah(m.gross),
      formatRupiah(m.paid),
      formatRupiah(m.pending),
      formatRupiah(m.unpaid),
      formatRupiah(m.shares?.vendor || 0),
      formatRupiah(m.shares?.upt || 0),
      formatRupiah(m.shares?.inkopasindo || 0),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows,
      margin: { left: margin, right: margin, bottom: 15 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 2,
        halign: 'right',
      },
      headStyles: {
        fillColor: [11, 61, 145],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 18 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        const str = `Dokumen Resmi SADEWA • Koperasi Inkopasindo | Halaman ${data.pageNumber}`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(str, margin, pageHeight - 8);
      },
    });

    const filename = `Laporan_Finansial_Inkopasindo_${year}.pdf`;
    doc.save(filename);

    if (openPreview && typeof window !== 'undefined') {
      try {
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
      } catch (e) {
        console.warn('[InkopasindoService] Gagal membuka popup tab baru:', e);
      }
    }

    return true;
  } catch (err) {
    console.error('[InkopasindoService] Error generating PDF report:', err);
    return false;
  }
};
