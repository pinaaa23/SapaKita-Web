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

import { jsPDF } from 'jspdf';
import {
  getFinanceBillings,
  getAllFinanceBillings,
  getFinanceSummary,
  formatRupiah,
  MONTH_NAMES
} from './financeService';
import { getBranches } from './branchService';
import { getAllKanwilsForSuperadmin } from './kanwilService';

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
    const [kanwilsRes, branchesRes] = await Promise.all([
      getAllKanwilsForSuperadmin().catch(() => []),
      getBranches({ limit: 100 }).catch(() => ({ branches: [] })),
    ]);

    const kanwilList = Array.isArray(kanwilsRes) ? kanwilsRes : [];
    const branchList = Array.isArray(branchesRes?.branches)
      ? branchesRes.branches
      : (Array.isArray(branchesRes) ? branchesRes : []);

    return {
      kanwils: kanwilList,
      branches: branchList,
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
export const generateInkopasindoInvoicePDF = async (item) => {
  if (!item) return false;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 16;

    const normalized = normalizeBillingItem(item);
    const shares = normalized.shares3Way;
    const split = normalized.split3Way;

    // 1. Accent Top Header Bar (Navy #0B3D91)
    doc.setFillColor(11, 61, 145);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // 2. Header: "SADEWA" di Kiri, Judul "INVOICE" & Nomor Tagihan di Kanan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(11, 61, 145);
    doc.text('SADEWA', margin, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Layanan Komunikasi Pemasyarakatan', margin, currentY + 11);

    // Kanan: Judul "INVOICE" & Nomor Tagihan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('INVOICE', pageWidth - margin, currentY + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`No. Tagihan: ${normalized.id || '-'}`, pageWidth - margin, currentY + 11, { align: 'right' });

    currentY += 18;

    // Garis Pemisah
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 6;

    // 3. Metadata Box (Periode, Nama UPT, Kanwil)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

    // Kolom Kiri: Periode & Tanggal Cetak
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Periode Tagihan:', margin + 6, currentY + 9);
    doc.text('Tanggal Cetak:', margin + 6, currentY + 18);
    doc.text('Status Pembayaran:', margin + 6, currentY + 27);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${MONTH_NAMES[(normalized.month || 1) - 1]} ${normalized.year}`, margin + 38, currentY + 9);
    doc.text(
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      margin + 38,
      currentY + 18
    );

    const statusLabel = normalized.status === 'PAID'
      ? 'Lunas / Sudah Dibayar'
      : normalized.status === 'PENDING_CONFIRMATION'
        ? 'Menunggu Verifikasi Setoran'
        : 'Belum Dibayar';
    doc.text(statusLabel, margin + 38, currentY + 27);

    // Kolom Kanan: Nama UPT & Kanwil
    const colRightX = margin + (contentWidth / 2) + 2;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Nama UPT:', colRightX, currentY + 9);
    doc.text('Wilayah (Kanwil):', colRightX, currentY + 18);
    doc.text('Entitas Pemantau:', colRightX, currentY + 27);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(normalized.branchName || '-'), colRightX + 28, currentY + 9);
    doc.text(String(normalized.kanwilName || '-'), colRightX + 28, currentY + 18);
    doc.text('Koperasi Inkopasindo', colRightX + 28, currentY + 27);

    currentY += 42;

    // 4. Total Omset Kotor Box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL OMSET KOTOR', margin + 6, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Akumulasi pendapatan kotor dari layanan panggilan komunikasi', margin + 6, currentY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(normalized.grossAmount), pageWidth - margin - 6, currentY + 13.5, { align: 'right' });

    currentY += 28;

    // 5. Card Jumlah yang Harus Dibayar ke Vendor (DITAMPILKAN PALING MENONJOL, BESAR DAN TEBAL)
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, currentY, contentWidth, 54, 3, 3, 'FD');

    // Label Header Card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(67, 56, 202);
    doc.text('JUMLAH YANG HARUS DIBAYAR KE VENDOR', margin + 8, currentY + 12);

    // Keterangan Persentase Kontrak
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(99, 102, 241);
    doc.text(
      `Porsi Vendor (${split.vendor}% dari total omset kotor berdasarkan kontrak kerja sama)`,
      margin + 8,
      currentY + 19
    );

    // Angka Nominal Paling Menonjol (26pt Bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(30, 27, 75); // Dark Indigo
    doc.text(formatRupiah(shares.vendor.amount), margin + 8, currentY + 38);

    // Tag Porsi di Sebelah Kanan Card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(67, 56, 202);
    doc.text(`Porsi Kontrak: ${split.vendor}%`, pageWidth - margin - 8, currentY + 38, { align: 'right' });

    currentY += 62;

    // 6. Catatan Ketentuan Resmi Sederhana
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('CATATAN KETENTUAN KONTRAK:', margin + 5, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(146, 64, 14);
    doc.text(
      `Nominal kewajiban dihitung secara dinamis dari persentase kontrak vendor (${split.vendor}%). Hanya Superadmin yang berwenang mengubah nilai kontrak.`,
      margin + 5,
      currentY + 11
    );

    // 7. Footer Satu Halaman A4
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Dokumen tagihan resmi SADEWA • Koperasi Inkopasindo', margin, pageHeight - 10);
    doc.text('Halaman 1 dari 1', pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Simpan file PDF
    doc.save(`Invoice-${normalized.id}.pdf`);
    return true;
  } catch (err) {
    console.error('[InkopasindoService] Error generating PDF invoice:', err);
    return false;
  }
};

/**
 * 5. Ekspor Data Laporan Tahunan ke CSV
 */
export const exportInkopasindoReportCSV = ({ year, monthlyBreakdown, grandTotals, stakeholderTotals }) => {
  try {
    const csvRows = [];
    csvRows.push(['LAPORAN AKUMULASI FINANSIAL INKOPASINDO']);
    csvRows.push([`Tahun Buku: ${year}`]);
    csvRows.push([`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`]);
    csvRows.push([]);

    csvRows.push(['RINGKASAN AKUMULASI TAHUNAN']);
    csvRows.push(['Total Omset Kotor', grandTotals.totalOmsetKotor]);
    csvRows.push(['Sudah Terealisasi', grandTotals.totalRealized]);
    csvRows.push(['Menunggu Verifikasi', grandTotals.totalPending]);
    csvRows.push(['Belum Tertagih', grandTotals.totalUnpaid]);
    csvRows.push([]);

    csvRows.push(['HAK FINANSIAL 3 PIHAK']);
    csvRows.push(['Pihak', 'Porsi Kontrak (%)', 'Total Hak (Rp)', 'Terealisasi (Rp)', 'Tertunda (Rp)']);
    csvRows.push([
      'Vendor (Sadewa)',
      stakeholderTotals.vendor.percent,
      stakeholderTotals.vendor.total,
      stakeholderTotals.vendor.realized,
      stakeholderTotals.vendor.pending,
    ]);
    csvRows.push([
      'UPT Pemasyarakatan',
      stakeholderTotals.upt.percent,
      stakeholderTotals.upt.total,
      stakeholderTotals.upt.realized,
      stakeholderTotals.upt.pending,
    ]);
    csvRows.push([
      'Koperasi Inkopasindo',
      stakeholderTotals.inkopasindo.percent,
      stakeholderTotals.inkopasindo.total,
      stakeholderTotals.inkopasindo.realized,
      stakeholderTotals.inkopasindo.pending,
    ]);
    csvRows.push([]);

    csvRows.push(['RINCIAN BULANAN']);
    csvRows.push([
      'Bulan',
      'Total UPT',
      'Omset Kotor (Rp)',
      'Lunas (Rp)',
      'Menunggu (Rp)',
      'Belum Bayar (Rp)',
      'Hak Vendor (Rp)',
      'Hak UPT (Rp)',
      'Hak Inkopasindo (Rp)',
    ]);

    monthlyBreakdown.forEach((m) => {
      csvRows.push([
        m.monthName,
        m.totalUpt,
        m.gross,
        m.paid,
        m.pending,
        m.unpaid,
        m.shares.vendor,
        m.shares.upt,
        m.shares.inkopasindo,
      ]);
    });

    const csvContent = csvRows
      .map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan-Finansial-Inkopasindo-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[InkopasindoService] Error exporting CSV:', err);
    return false;
  }
};
