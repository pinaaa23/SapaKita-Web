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
import { isDummyMode } from '../dummy';
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
 * Generator data dummy transaksi panggilan kantin WBP dengan angka riil non-zero
 * Digunakan jika backend offline atau belum ada transaksi agar perhitungan tagihan
 * (tarif Rp 15/detik, bagi hasil 60% vendor, 30% UPT, 10% Inkopasindo) dapat diuji secara visual.
 */
export function generateDummyCanteenCalls(targetMonth = 11, targetYear = 2026, branchId = 'b9', branchName = 'Lapas Kelas I Ungaran') {
  const inmates = [
    { name: 'Ahmad Fauzi', id: 'WBP-2024-0891', pkg: 'Paket Reguler 10 Menit', durMin: 10, room: 'Bilik Sadewa 01' },
    { name: 'Budi Santoso', id: 'WBP-2024-1102', pkg: 'Paket Panjang 15 Menit', durMin: 15, room: 'Bilik Sadewa 02' },
    { name: 'Dedi Kurniawan', id: 'WBP-2024-0433', pkg: 'Paket Ringkas 5 Menit', durMin: 5, room: 'Bilik Sadewa 01' },
    { name: 'Eko Prasetyo', id: 'WBP-2024-0724', pkg: 'Paket Spesial 20 Menit', durMin: 20, room: 'Bilik Sadewa 03' },
    { name: 'Fajar Hidayat', id: 'WBP-2024-0985', pkg: 'Paket Reguler 10 Menit', durMin: 10, room: 'Bilik Sadewa 02' },
    { name: 'Hendra Wijaya', id: 'WBP-2024-1216', pkg: 'Paket Panjang 15 Menit', durMin: 15, room: 'Bilik Sadewa 04' },
    { name: 'Rian Saputra', id: 'WBP-2024-0347', pkg: 'Paket Panjang 15 Menit', durMin: 15, room: 'Bilik Sadewa 01' },
    { name: 'Agus Setiawan', id: 'WBP-2024-0558', pkg: 'Paket Reguler 10 Menit', durMin: 10, room: 'Bilik Sadewa 03' },
    { name: 'Bambang Pamungkas', id: 'WBP-2024-0239', pkg: 'Paket Spesial 20 Menit', durMin: 20, room: 'Bilik Sadewa 02' },
    { name: 'Doni Salmanan', id: 'WBP-2024-0670', pkg: 'Paket Reguler 10 Menit', durMin: 10, room: 'Bilik Sadewa 04' },
    { name: 'Gilang Pratama', id: 'WBP-2024-0811', pkg: 'Paket Ringkas 5 Menit', durMin: 5, room: 'Bilik Sadewa 01' },
    { name: 'Hariadi', id: 'WBP-2024-0922', pkg: 'Paket Panjang 15 Menit', durMin: 15, room: 'Bilik Sadewa 03' },
    { name: 'Ilham Ramadhan', id: 'WBP-2024-0133', pkg: 'Paket Reguler 10 Menit', durMin: 10, room: 'Bilik Sadewa 02' },
    { name: 'Joko Susilo', id: 'WBP-2024-0444', pkg: 'Paket Spesial 20 Menit', durMin: 20, room: 'Bilik Sadewa 04' },
    { name: 'Kevin Sanjaya', id: 'WBP-2024-0755', pkg: 'Paket Panjang 15 Menit', durMin: 15, room: 'Bilik Sadewa 01' },
  ];

  const rate = 15;
  const vendorPct = 60;
  const uptPct = 30;

  return inmates.map((item, idx) => {
    const day = Math.min(28, (idx * 2) + 1);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(targetMonth).padStart(2, '0');
    const hourStr = String(9 + (idx % 8)).padStart(2, '0');
    const minStr = String((idx * 17) % 60).padStart(2, '0');
    const dateStr = `${targetYear}-${monthStr}-${dayStr}T${hourStr}:${minStr}:00+07:00`;
    const durSec = item.durMin * 60;
    const grossItem = durSec * rate;
    const vendorItem = Math.round(grossItem * (vendorPct / 100));

    return {
      id: `TX-DUMMY-${targetYear}${monthStr}-${idx + 101}`,
      createdAt: dateStr,
      waktu: dateStr,
      date: dateStr,
      branchId: branchId || 'b9',
      branchName: branchName || 'Lapas Kelas I Ungaran',
      kodeVoucher: `VCH-${targetYear}${monthStr}${dayStr}-${String(100 + idx)}`,
      inmate: {
        id: item.id,
        identifier: item.id,
        name: item.name,
      },
      inmateName: item.name,
      inmateIdentifier: item.id,
      package: {
        name: item.pkg,
        durationMinutes: item.durMin,
        duration: item.durMin,
        price: grossItem,
      },
      packageName: item.pkg,
      packageDuration: item.durMin,
      durationSeconds: durSec,
      ratePerSecond: rate,
      superadminPercent: vendorPct,
      canteenPercent: uptPct,
      vendorPercent: vendorPct,
      subtotalAmount: grossItem,
      totalAmount: vendorItem,
      nominal: vendorItem,
      canteenShare: Math.round(grossItem * (uptPct / 100)),
      cashierName: 'Dzaki Ardyan (Kantin)',
      cashier: { name: 'Dzaki Ardyan' },
      roomName: item.room,
    };
  });
}

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

  // 1. Ambil data real transaksi / billing dari Backend (GET /api/canteen/billing/national-summary)
  let beNationalData = null;
  try {
    const natRes = await apiFetch(`/api/canteen/billing/national-summary?month=${targetMonth}&year=${targetYear}`);
    beNationalData = natRes?.data || natRes || null;
  } catch (_e) {
    // Abaikan jika offline
  }

  // 2. Ambil data cabang UPT dari beNationalData (riil database) atau getBranches()
  let branches = [];
  if (Array.isArray(beNationalData?.branches) && beNationalData.branches.length > 0) {
    branches = beNationalData.branches.map((b) => ({
      id: b.branchId || b.id,
      name: b.branchName || b.name,
      kanwilName: b.kanwilName || b.kanwil?.name || 'Kanwil Ditjenpas',
      province: b.province,
      totalMinutes: Number(b.totalMinutes || 0),
      totalSeconds: Number(b.totalSeconds || 0),
      ratePerSecond: b.ratePerSecond,
      calculatedGrossAmount: b.calculatedGrossAmount,
      passcallSharePercentage: b.passcallSharePercentage,
      kantinSharePercentage: b.kantinSharePercentage,
      billingStatus: b.billingStatus,
      paymentProof: b.paymentProof,
    }));
  } else {
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
  }

  // Jika data cabang belum ditemukan dan offline
  if (branches.length === 0) {
    return [];
  }

  // 3. Ambil riwayat bukti bayar topup yang tersimpan di sistem
  let allTopups = [];
  try {
    const topupsRes = await apiFetch('/api/canteen/topups?limit=200').catch(() => ({ data: [] }));
    allTopups = topupsRes?.data || topupsRes?.items || (Array.isArray(topupsRes) ? topupsRes : []);
  } catch {
    allTopups = [];
  }

  // 4. SATU SUMBER KONTRAK: Ambil seluruh kontrak resmi dari GET /api/canteen/contracts & GET /api/finance/contracts
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

  // Tambahkan juga dari cache kontrak Finance jika ada
  try {
    const rawFinContracts = typeof window !== 'undefined' ? localStorage.getItem('pascall_finance_contracts_v1') : null;
    if (rawFinContracts) {
      const parsedFin = JSON.parse(rawFinContracts);
      if (Array.isArray(parsedFin)) {
        parsedFin.forEach((fc) => {
          const kop = fc.split?.koperasi ?? 30;
          const mapped = {
            branchId: fc.branchId,
            branchName: fc.branchName,
            canteenName: fc.canteenName,
            ratePerSecond: Number(fc.ratePerSecond || 50),
            superadminPercent: fc.split?.vendor ? Number(fc.split.vendor) : 55,
            canteenPercent: fc.split?.vendor ? Math.max(0, 100 - Number(fc.split.vendor)) : 45,
            negotiationPercent: fc.split?.vendor ? Number(fc.split.vendor) : 55,
            isContractSet: true,
            split: fc.split,
          };
          const bId = String(fc.branchId).toLowerCase();
          const bName = String(fc.branchName).toLowerCase();
          if (!contractMap[bId] || !contractMap[bId].isContractSet) contractMap[bId] = mapped;
          if (!contractMap[bName] || !contractMap[bName].isContractSet) contractMap[bName] = mapped;
        });
      }
    }
  } catch (_) {}

  const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1;
  const dueDate = new Date(targetYear, targetMonth, 2, 23, 59, 59, 999);
  const isPastDue = now > dueDate;

  const result = branches.map((b) => {
    // Kontrak diambil dari sumber resmi GET /api/canteen/contracts
    const bId = String(b.id || '').toLowerCase();
    const bName = String(b.name || '').toLowerCase();
    let contract = contractMap[bId] || contractMap[bName] || findStoredContract(b.id, { branchName: b.name });

    // Cari data real UPT ini dari respon backend
    const beBranchInfo = beNationalData?.branches?.find((bb) => (bb.branchId && (bb.branchId === b.id || String(bb.branchId).toLowerCase() === bId)) || bb.branchName?.toLowerCase() === bName) || b;

    // Fallback: Jika kontrak belum ada di contractMap, gunakan data tarif dan bagi hasil yang dikirim backend UPT
    if (!contract && beBranchInfo) {
      const beRate = beBranchInfo.ratePerSecond;
      const beSa = beBranchInfo.passcallSharePercentage ?? beBranchInfo.contractSharePercentage ?? beBranchInfo.superadminPercent;
      if (beRate !== null && beRate !== undefined && beSa !== null && beSa !== undefined) {
        contract = {
          branchId: b.id,
          branchName: b.name,
          ratePerSecond: Number(beRate),
          superadminPercent: Number(beSa),
          canteenPercent: Math.max(0, 100 - Number(beSa)),
          negotiationPercent: Number(beSa),
          isContractSet: true,
        };
      }
    }

    // Helper status kontrak TUNGGAL:
    const isContractSet = isCanteenContractConfigured(contract) || isCanteenContractConfigured(beBranchInfo);

    const canteenName = contract?.canteenName || (b.name ? `Kantin ${b.name}` : 'Kantin Lapas');
    const uptName = b.name;
    const kanwilName = b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas';

    // Hitung total detik real dari menit durasi paket voucher yang dibeli di kantin pada bulan itu
    const rawTotalSec = Number(
      beBranchInfo?.totalSeconds !== undefined && beBranchInfo?.totalSeconds !== null && Number(beBranchInfo.totalSeconds) > 0
        ? beBranchInfo.totalSeconds
        : (beBranchInfo?.totalMinutes ? Number(beBranchInfo.totalMinutes) * 60 : (b.totalSeconds || (b.totalMinutes ? b.totalMinutes * 60 : 0)))
    );
    const bIdx = branches.indexOf(b);
    const totalSeconds = rawTotalSec > 0
      ? rawTotalSec
      : (isDummyMode() ? Math.round((280000 + ((bIdx >= 0 ? bIdx : 1) * 35000)) * ((b.ratePerSecond === 15 || contract?.ratePerSecond === 15) ? 3.5 : 1)) : 0);

    // Hitung rumus tagihan baru: Detik x Tarif x Persen Negosiasi (Porsi Superadmin/Finance)
    const effectiveRate = isContractSet ? (contract?.ratePerSecond ?? beBranchInfo?.ratePerSecond ?? 15) : (b.ratePerSecond || 15);
    const effectiveSa = isContractSet
      ? (contract?.vendorPercent ?? contract?.split?.vendor ?? contract?.superadminPercent ?? contract?.negotiationPercent ?? contract?.contractSharePercentage ?? beBranchInfo?.vendorPercent ?? beBranchInfo?.split?.vendor ?? beBranchInfo?.passcallSharePercentage ?? beBranchInfo?.contractSharePercentage ?? 60)
      : 60;

    const billingCalc = calculateUnifiedBilling({
      totalSeconds,
      ratePerSecond: effectiveRate,
      superadminPercent: effectiveSa,
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
    } else if (pendingPayment || beBranchInfo?.billingStatus === 'PENDING_CONFIRMATION') {
      statusPembayaran = 'Menunggu ACC';
      rawStatus = 'PENDING';
    } else if (rejectedPayment || beBranchInfo?.billingStatus === 'REJECTED') {
      statusPembayaran = 'Ditolak';
      rawStatus = 'REJECTED';
      isBlocked = true;
    } else if (beBranchInfo?.billingStatus === 'PAID') {
      statusPembayaran = 'Lunas';
      rawStatus = 'LUNAS';
    } else if (billingCalc.totalAmount === 0) {
      statusPembayaran = 'Tidak Ada Tagihan';
      rawStatus = 'TIDAK_ADA_TAGIHAN';
    } else if (!isMonthClosed || beBranchInfo?.billingStatus === 'BERJALAN') {
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
      grossAmount: billingCalc.subtotal || 0,
      canteenKeepAmount: billingCalc.canteenShare || 0,
      depositAmountToFinance: billingCalc.totalAmount || 0,
kepalaUptPercent: isContractSet ? Number(contract?.kepalaUptPercent ?? contract?.split?.kepalaUpt ?? beBranchInfo?.kepalaUptPercent ?? 5) : null,
      koperasiPercent: isContractSet ? Number(contract?.koperasiPercent ?? contract?.split?.koperasi ?? beBranchInfo?.koperasiPercent ?? (billingCalc.canteenPercent || 45)) : null,
      inkopasindoPercent: isContractSet ? Number(contract?.inkopasindoPercent ?? contract?.split?.inkopasindo ?? beBranchInfo?.inkopasindoPercent ?? 10) : null,
      vendorPercent: isContractSet ? Number(contract?.vendorPercent ?? contract?.split?.vendor ?? beBranchInfo?.vendorPercent ?? 55) : null,
      split: isContractSet ? {
        kepalaUpt: Number(contract?.kepalaUptPercent ?? contract?.split?.kepalaUpt ?? beBranchInfo?.kepalaUptPercent ?? 5),
        koperasi: Number(contract?.koperasiPercent ?? contract?.split?.koperasi ?? beBranchInfo?.koperasiPercent ?? (billingCalc.canteenPercent || 45)),
        inkopasindo: Number(contract?.inkopasindoPercent ?? contract?.split?.inkopasindo ?? beBranchInfo?.inkopasindoPercent ?? 10),
        vendor: Number(contract?.vendorPercent ?? contract?.split?.vendor ?? beBranchInfo?.vendorPercent ?? 55),
      } : null,
      shares: isContractSet ? {
        kepalaUpt: { percent: Number(contract?.kepalaUptPercent ?? contract?.split?.kepalaUpt ?? beBranchInfo?.kepalaUptPercent ?? 5), amount: Math.round((billingCalc.subtotal || 0) * (Number(contract?.kepalaUptPercent ?? contract?.split?.kepalaUpt ?? beBranchInfo?.kepalaUptPercent ?? 5) / 100)) },
        koperasi: { percent: Number(contract?.koperasiPercent ?? contract?.split?.koperasi ?? beBranchInfo?.koperasiPercent ?? (billingCalc.canteenPercent || 45)), amount: billingCalc.canteenShare || Math.round((billingCalc.subtotal || 0) * (Number(contract?.koperasiPercent ?? contract?.split?.koperasi ?? beBranchInfo?.koperasiPercent ?? (billingCalc.canteenPercent || 45)) / 100)) },
        inkopasindo: { percent: Number(contract?.inkopasindoPercent ?? contract?.split?.inkopasindo ?? beBranchInfo?.inkopasindoPercent ?? 10), amount: Math.round((billingCalc.subtotal || 0) * (Number(contract?.inkopasindoPercent ?? contract?.split?.inkopasindo ?? beBranchInfo?.inkopasindoPercent ?? 10) / 100)) },
        vendor: { percent: Number(contract?.vendorPercent ?? contract?.split?.vendor ?? beBranchInfo?.vendorPercent ?? 55), amount: Math.round((billingCalc.subtotal || 0) * (Number(contract?.vendorPercent ?? contract?.split?.vendor ?? beBranchInfo?.vendorPercent ?? 55) / 100)) },
        finance: { percent: billingCalc.superadminPercent || 55, amount: billingCalc.totalAmount || 0 },
      } : {
        koperasi: { percent: billingCalc.canteenPercent || 45, amount: billingCalc.canteenShare || 0 },
        finance: { percent: billingCalc.superadminPercent || 55, amount: billingCalc.totalAmount || 0 },
      },
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
  let transactions = Array.isArray(beBillingData?.transactions) ? beBillingData.transactions : [];

  // Fallback: Jika transactions kosong di respons billing, ambil dari endpoint transaksi kantin
  if (transactions.length === 0) {
    try {
      const q = new URLSearchParams();
      q.append('page', '1');
      q.append('limit', '500');
      q.append('periode', 'bulanan');
      const mStr = String(targetMonth).padStart(2, '0');
      q.append('bulan', `${targetYear}-${mStr}`);
      if (rawBranchId) q.append('branchId', rawBranchId);

      const tRes = await apiFetch(`/api/canteen/transactions?${q.toString()}`);
      const tItems = Array.isArray(tRes?.data) ? tRes.data : (Array.isArray(tRes?.items) ? tRes.items : (Array.isArray(tRes) ? tRes : []));
      if (tItems.length > 0) {
        transactions = tItems;
      }
    } catch (_tErr) {}

    if (transactions.length === 0) {
      try {
        const { getRiwayat } = await import('./kantin/kantinService');
        const rList = await getRiwayat({
          periode: 'bulanan',
          tanggal: new Date(targetYear, targetMonth - 1, 15),
          limit: 500,
        });
        if (Array.isArray(rList) && rList.length > 0) {
          transactions = rList;
        }
      } catch (_rErr) {}
    }
  }

  // Hitung total detik real dari transaksi penjualan paket/voucher di kantin
  // Sesuai Aturan Baru: total detik = akumulasi durasi paket yang dibeli WBP
  let totalSeconds = 0;
  if (beBillingData?.summary?.totalSeconds !== undefined && beBillingData?.summary?.totalSeconds !== null && Number(beBillingData.summary.totalSeconds) > 0) {
    totalSeconds = Number(beBillingData.summary.totalSeconds);
  }
  
  const calculatedSecondsFromTx = transactions.reduce((acc, t) => {
    const durationMin = Number(t.package?.durationMinutes || t.package?.duration || t.packageDuration || t.durationMinutes || (typeof t.paket?.durasi === 'string' ? parseInt(t.paket.durasi, 10) : t.paket?.durasi) || 0);
    return acc + (durationMin * 60);
  }, 0);

  totalSeconds = Math.max(totalSeconds, calculatedSecondsFromTx);

  // Fallback data non-zero: HANYA jika isDummyMode() aktif (misal testing lokal)
  if ((totalSeconds <= 0 || transactions.length === 0) && isDummyMode()) {
    transactions = generateDummyCanteenCalls(targetMonth, targetYear, rawBranchId, user?.branchName);
    totalSeconds = 36420; // 607 Menit panggilan WBP
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

  // Fallback kontrak resmi non-zero HANYA jika isDummyMode()
  if (!contract || !isCanteenContractConfigured(contract)) {
    if (isDummyMode()) {
      contract = {
        branchId: branchId || 'b9',
        branchName: rawBranchName || 'Lapas Kelas I Ungaran',
        canteenName: rawCanteenName || 'Dzaki Ardyan',
        ratePerSecond: 15,
        superadminPercent: 60,
        canteenPercent: 40,
        negotiationPercent: 60,
        koperasiPercent: 30,
        inkopasindoPercent: 10,
        vendorPercent: 60,
        isContractSet: true,
        split: { kepalaUpt: 0, koperasi: 30, inkopasindo: 10, vendor: 60 },
      };
    } else {
      contract = null;
    }
  }

  const isContractSet = isCanteenContractConfigured(contract);

  const ratePerSecond = isContractSet ? Number(contract.ratePerSecond) : null;
  const superadminPercent = isContractSet
    ? (contract.superadminPercent !== null && contract.superadminPercent !== undefined ? Number(contract.superadminPercent) : Number(contract.negotiationPercent || 60))
    : null;
  const canteenPercent = isContractSet
    ? (contract.canteenPercent !== null && contract.canteenPercent !== undefined ? Number(contract.canteenPercent) : (100 - Number(contract.negotiationPercent || 60)))
    : null;
  const negotiationPercent = superadminPercent;

  // 4. Hitung tagihan berdasarkan rumus baru (Porsi Superadmin)
  const billingCalc = calculateUnifiedBilling({
    totalSeconds,
    ratePerSecond: ratePerSecond || 0,
    superadminPercent: superadminPercent || 0,
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
    kepalaUptPercent: Number(contract?.kepalaUptPercent ?? 5),
    koperasiPercent: Number(contract?.koperasiPercent ?? 30),
    inkopasindoPercent: Number(contract?.inkopasindoPercent ?? 10),
    vendorPercent: Number(contract?.vendorPercent ?? 55),
    shares: {
      kepalaUpt: Number(contract?.kepalaUptPercent ?? 5),
      koperasi: Number(contract?.koperasiPercent ?? 30),
      inkopasindo: Number(contract?.inkopasindoPercent ?? 10),
      vendor: Number(contract?.vendorPercent ?? 55),
    },
    transactions: recalculatedTransactions,
    rawStatus: isContractSet
      ? (beBillingData?.billingStatus || (totalSeconds === 0 ? 'TIDAK_ADA_TAGIHAN' : (isDummyMode() && targetMonth === 11 ? 'PENDING' : 'BERJALAN')))
      : 'BELUM_DIATUR',
    statusPembayaran: isContractSet
      ? (beBillingData?.billingStatus === 'PAID'
          ? 'Lunas'
          : (totalSeconds === 0
              ? 'Tidak Ada Tagihan'
              : (beBillingData?.billingStatus === 'PENDING' || (isDummyMode() && targetMonth === 11)
                  ? 'Menunggu ACC'
                  : 'Belum Dibayar')))
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
 * Mengambil histori perubahan kontrak bagi hasil UPT (Audit Log)
 * Endpoint: GET /api/canteen/contracts/:branchId/history
 *
 * @param {string} branchId
 * @returns {Promise<Array>}
 */
export async function getCanteenContractHistory(branchId) {
  if (!branchId) return [];
  try {
    const res = await apiFetch(`/api/canteen/contracts/${branchId}/history`);
    return res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.warn(`[canteenBillingService] Gagal memuat riwayat kontrak (${branchId}):`, err?.message || err);
    return [];
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

  // 1. Panggil endpoint resmi Backend: GET /api/canteen/billing/calls (Role: CANTEEN_STAFF, SUPERADMIN, KANWIL_ADMIN)
  if (!isDummyMode()) {
    try {
      const q = new URLSearchParams();
      q.append('page', String(page));
      q.append('limit', String(limit));
      q.append('month', String(targetMonth));
      q.append('year', String(targetYear));
      if (effectiveBranchId) q.append('branchId', effectiveBranchId);
      if (search && search.trim()) q.append('search', search.trim());

      const res = await apiFetch(`/api/canteen/billing/calls?${q.toString()}`);
      if (res?.data && Array.isArray(res.data.items) && res.data.items.length > 0 && Number(res.data.totalSeconds) > 0) {
        return {
          items: res.data.items || [],
          totalItems: res.data.totalItems || 0,
          totalSeconds: res.data.totalSeconds || 0,
          totalTagihan: res.data.totalTagihan || 0,
          ratePerSecond: res.data.items?.[0]?.ratePerSecond ?? 15,
          superadminPercent: res.data.items?.[0]?.superadminPercent ?? 50,
          isContractSet: true,
          pagination: res.data.pagination || { page: Number(page), limit: Number(limit), totalPages: 1 },
        };
      }
    } catch (err) {
      console.warn('[canteenBillingService] Gagal memuat /api/canteen/billing/calls, fallback ke kalkulasi lokal:', err?.message || err);
    }
  }

  // 2. Fallback resolusi kontrak lokal jika offline
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

  // Fallback data panggilan dummy HANYA jika isDummyMode() aktif (demo lokal)
  let itemsToUse = mappedItems;
  let finalAccumulatedSeconds = accumulatedSeconds;

  if (itemsToUse.length === 0 && isDummyMode()) {
    const rawBranchName = user?.branchName || user?.branch?.name || 'Lapas Kelas I Ungaran';
    const dummyCalls = generateDummyCanteenCalls(targetMonth, targetYear, effectiveBranchId, rawBranchName);
    let filteredDummy = dummyCalls;
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      filteredDummy = filteredDummy.filter((t) =>
        String(t.inmateName || '').toLowerCase().includes(s) ||
        String(t.inmateIdentifier || '').toLowerCase().includes(s) ||
        String(t.packageName || '').toLowerCase().includes(s) ||
        String(t.kodeVoucher || '').toLowerCase().includes(s) ||
        String(t.roomName || '').toLowerCase().includes(s)
      );
    }
    itemsToUse = filteredDummy;
    finalAccumulatedSeconds = 36420;
  }

  const effectiveRate = isContractSet && ratePerSecond !== null ? ratePerSecond : 15;
  const effectiveSa = isContractSet && superadminPercent !== null ? superadminPercent : 60;

  // Pagination slice
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const totalItems = itemsToUse.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = itemsToUse.slice(startIndex, startIndex + limitNum);

  // Perhitungan tagihan agregat satu rumus untuk periode ini
  const billingCalc = calculateUnifiedBilling({
    totalSeconds: finalAccumulatedSeconds,
    ratePerSecond: effectiveRate,
    superadminPercent: effectiveSa,
  });

  return {
    items: paginatedItems,
    totalItems,
    totalSeconds: finalAccumulatedSeconds,
    subtotal: billingCalc.subtotal,
    totalTagihan: billingCalc.totalAmount,
    ratePerSecond: billingCalc.ratePerSecond,
    superadminPercent: billingCalc.superadminPercent,
    isContractSet: true,
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
  if (isNaN(rate) || rate <= 0) {
    throw new Error('Tarif per detik harus berupa angka lebih besar dari 0.');
  }

  const has4Parties =
    payload.kepalaUptPercent !== undefined ||
    payload.koperasiPercent !== undefined ||
    payload.inkopasindoPercent !== undefined ||
    payload.vendorPercent !== undefined ||
    Boolean(payload.split);

  let kepalaUpt = payload.kepalaUptPercent !== undefined ? Number(payload.kepalaUptPercent) : (payload.split?.kepalaUpt !== undefined ? Number(payload.split.kepalaUpt) : undefined);
  let koperasi = payload.koperasiPercent !== undefined ? Number(payload.koperasiPercent) : (payload.split?.koperasi !== undefined ? Number(payload.split.koperasi) : undefined);
  let inkopasindo = payload.inkopasindoPercent !== undefined ? Number(payload.inkopasindoPercent) : (payload.split?.inkopasindo !== undefined ? Number(payload.split.inkopasindo) : undefined);
  let vendor = payload.vendorPercent !== undefined ? Number(payload.vendorPercent) : (payload.split?.vendor !== undefined ? Number(payload.split.vendor) : undefined);

  let saPercent;
  let ktPercent;

  if (has4Parties) {
    if (isNaN(kepalaUpt) || kepalaUpt < 0 || kepalaUpt > 100) {
      throw new Error('Persentase Kepala UPT harus berada di antara 0% hingga 100%.');
    }
    if (isNaN(koperasi) || koperasi < 0 || koperasi > 100) {
      throw new Error('Persentase Koperasi harus berada di antara 0% hingga 100%.');
    }
    if (isNaN(inkopasindo) || inkopasindo < 0 || inkopasindo > 100) {
      throw new Error('Persentase Inkopasindo harus berada di antara 0% hingga 100%.');
    }
    if (isNaN(vendor) || vendor < 0 || vendor > 100) {
      throw new Error('Persentase Vendor harus berada di antara 0% hingga 100%.');
    }
    const sum4 = Math.round((kepalaUpt + koperasi + inkopasindo + vendor) * 100) / 100;
    if (sum4 !== 100) {
      throw new Error(`Total persentase 4 pihak harus berjumlah tepat 100% (saat ini ${sum4}%).`);
    }
    ktPercent = koperasi;
    saPercent = Math.round((100 - koperasi) * 100) / 100;
  } else {
    saPercent = payload.superadminPercent !== undefined && payload.superadminPercent !== null && payload.superadminPercent !== ''
      ? Number(payload.superadminPercent)
      : Number(payload.negotiationPercent);
    ktPercent = payload.canteenPercent !== undefined && payload.canteenPercent !== null && payload.canteenPercent !== ''
      ? Number(payload.canteenPercent)
      : (100 - saPercent);

    if (isNaN(saPercent) || saPercent < 0 || saPercent > 100) {
      throw new Error('Persen Superadmin harus berada di antara 0% hingga 100%.');
    }
    if (isNaN(ktPercent) || ktPercent < 0 || ktPercent > 100) {
      throw new Error('Persen Kantin harus berada di antara 0% hingga 100%.');
    }
    if (Math.round((saPercent + ktPercent) * 100) / 100 !== 100) {
      throw new Error('Total persentase Superadmin dan Kantin harus berjumlah 100%.');
    }
    koperasi = ktPercent;
    const billedPortion = saPercent;
    vendor = Math.round((billedPortion * (55 / 70)) * 100) / 100;
    inkopasindo = Math.round((billedPortion * (10 / 70)) * 100) / 100;
    kepalaUpt = Math.round((billedPortion - vendor - inkopasindo) * 100) / 100;
  }

  // 1. Simpan langsung ke endpoint resmi BE: PUT /api/canteen/contracts/:branchId
  let beResult = null;
  try {
    const res = await apiFetch(`/api/canteen/contracts/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ratePerSecond: rate,
        kepalaUptPercent: kepalaUpt,
        koperasiPercent: koperasi,
        inkopasindoPercent: inkopasindo,
        vendorPercent: vendor,
        superadminPercent: saPercent,
        canteenPercent: ktPercent,
      }),
    });
    beResult = res?.data || res;
  } catch (err) {
    console.warn('[canteenBillingService] Gagal update /api/canteen/contracts/:branchId:', err?.message || err);
    throw err;
  }

  // Juga sinkronkan ke PUT /api/finance/contracts/:branchId jika tersedia
  try {
    await apiFetch(`/api/finance/contracts/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ratePerSecond: rate,
        split: {
          kepalaUpt,
          koperasi,
          inkopasindo,
          vendor,
        },
        canteenName: payload.canteenName,
      }),
    });
  } catch (_finErr) {}

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
    kepalaUptPercent: kepalaUpt,
    koperasiPercent: koperasi,
    inkopasindoPercent: inkopasindo,
    vendorPercent: vendor,
    split: {
      kepalaUpt,
      koperasi,
      inkopasindo,
      vendor,
    },
    superadminPercent: saPercent,
    canteenPercent: ktPercent,
    negotiationPercent: saPercent,
    isContractSet: true,
  });

  // Simpan juga ke localStorage pascall_finance_contracts_v1 agar sinkron dengan Finance
  try {
    const rawFin = typeof window !== 'undefined' ? localStorage.getItem('pascall_finance_contracts_v1') : null;
    let finList = rawFin ? JSON.parse(rawFin) : [];
    if (Array.isArray(finList)) {
      const idx = finList.findIndex((fc) => String(fc.branchId).toLowerCase() === String(branchId).toLowerCase());
      const finItem = {
        branchId,
        branchName: payload.branchName || updated.branchName,
        canteenName: payload.canteenName || updated.canteenName,
        ratePerSecond: rate,
        split: {
          kepalaUpt,
          koperasi,
          inkopasindo,
          vendor,
        },
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        finList[idx] = { ...finList[idx], ...finItem };
      } else {
        finList.push(finItem);
      }
      localStorage.setItem('pascall_finance_contracts_v1', JSON.stringify(finList));
    }
  } catch (_) {}

  // Trigger event pembaruan agar semua tampilan sinkron seketika
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
    window.dispatchEvent(new CustomEvent('pascall_contract_changed', { detail: updated }));
    window.dispatchEvent(new CustomEvent('finance_billing_updated'));
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
    const items = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.items)
      ? res.data.items
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
      ? res
      : [];
    if (Array.isArray(items) && items.length > 0) {
      beContracts = items;
    }
  } catch (err) {
    console.warn('[canteenBillingService] Gagal memuat GET /api/canteen/contracts:', err?.message || err);
  }

  // Jika beContracts masih kosong, coba ambil dari GET /api/finance/contracts
  if (beContracts.length === 0) {
    try {
      const finRes = await apiFetch('/api/finance/contracts');
      const finItems = Array.isArray(finRes?.data) ? finRes.data : Array.isArray(finRes) ? finRes : [];
      if (finItems.length > 0) {
        beContracts = finItems.map((fc) => {
          const kop = fc.split?.koperasi ?? 30;
          return {
            branchId: fc.branchId,
            branchName: fc.branchName,
            canteenName: fc.canteenName,
            ratePerSecond: fc.ratePerSecond,
            superadminPercent: fc.split?.vendor ? Number(fc.split.vendor) : 55,
            canteenPercent: fc.split?.vendor ? Math.max(0, 100 - Number(fc.split.vendor)) : 45,
            negotiationPercent: fc.split?.vendor ? Number(fc.split.vendor) : 55,
            split: fc.split,
            isContractSet: true,
          };
        });
      }
    } catch (_fe) {}
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

      const saPct = item.superadminPercent !== undefined && item.superadminPercent !== null
        ? Number(item.superadminPercent)
        : (item.contractSharePercentage !== undefined && item.contractSharePercentage !== null
            ? Number(item.contractSharePercentage)
            : (item.split?.vendor ? Number(item.split.vendor) : (item.split?.koperasi ? 100 - Number(item.split.koperasi) : 55)));

      const ktPct = item.canteenPercent !== undefined && item.canteenPercent !== null
        ? Number(item.canteenPercent)
        : (item.split?.koperasi ? Number(item.split.koperasi) : 30);

      const kepalaUpt = item.kepalaUptPercent !== undefined && item.kepalaUptPercent !== null
        ? Number(item.kepalaUptPercent)
        : (item.split?.kepalaUpt !== undefined ? Number(item.split.kepalaUpt) : (isContractSet ? 5 : null));

      const koperasi = item.koperasiPercent !== undefined && item.koperasiPercent !== null
        ? Number(item.koperasiPercent)
        : (item.split?.koperasi !== undefined ? Number(item.split.koperasi) : (ktPct ?? (isContractSet ? 30 : null)));

      const inkopasindo = item.inkopasindoPercent !== undefined && item.inkopasindoPercent !== null
        ? Number(item.inkopasindoPercent)
        : (item.split?.inkopasindo !== undefined ? Number(item.split.inkopasindo) : (isContractSet ? 10 : null));

      const vendor = item.vendorPercent !== undefined && item.vendorPercent !== null
        ? Number(item.vendorPercent)
        : (item.split?.vendor !== undefined ? Number(item.split.vendor) : (isContractSet ? 55 : null));

      return {
        branchId: item.branchId,
        canteenName: item.canteenName || `Kantin ${item.branchName || b.name || item.branchId}`,
        uptName: item.branchName || b.name || `UPT ${item.branchId}`,
        kanwilName: b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas',
        ratePerSecond: isContractSet ? Number(item.ratePerSecond) : null,
        superadminPercent: isContractSet ? saPct : null,
        canteenPercent: isContractSet ? ktPct : null,
        negotiationPercent: isContractSet ? saPct : null,
        kepalaUptPercent: isContractSet ? kepalaUpt : null,
        koperasiPercent: isContractSet ? koperasi : null,
        inkopasindoPercent: isContractSet ? inkopasindo : null,
        vendorPercent: isContractSet ? vendor : null,
        isContractSet,
        updatedAt: item.updatedAt || null,
        updatedBy: item.updatedBy || 'Superadmin',
        split: isContractSet && kepalaUpt !== null ? {
          kepalaUpt,
          koperasi,
          inkopasindo,
          vendor,
        } : (isContractSet ? item.split : null),
      };
    });
  }

  if (branches.length === 0) {
    return [];
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

    const kepalaUpt = isContractSet ? (contract?.kepalaUptPercent ?? contract?.split?.kepalaUpt ?? 5) : null;
    const koperasi = isContractSet ? (contract?.koperasiPercent ?? contract?.split?.koperasi ?? ktPercent ?? 30) : null;
    const inkopasindo = isContractSet ? (contract?.inkopasindoPercent ?? contract?.split?.inkopasindo ?? 10) : null;
    const vendor = isContractSet ? (contract?.vendorPercent ?? contract?.split?.vendor ?? 55) : null;

    return {
      branchId: b.id,
      canteenName: contract?.canteenName || `Kantin ${b.name}`,
      uptName: b.name,
      kanwilName: b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas',
      ratePerSecond: isContractSet ? Number(contract.ratePerSecond) : null,
      superadminPercent: saPercent,
      canteenPercent: ktPercent,
      negotiationPercent: saPercent,
      kepalaUptPercent: kepalaUpt,
      koperasiPercent: koperasi,
      inkopasindoPercent: inkopasindo,
      vendorPercent: vendor,
      split: isContractSet && kepalaUpt !== null ? {
        kepalaUpt,
        koperasi,
        inkopasindo,
        vendor,
      } : null,
      isContractSet,
      updatedAt: contract?.updatedAt || null,
      updatedBy: contract?.updatedBy || null,
    };
  });
}

