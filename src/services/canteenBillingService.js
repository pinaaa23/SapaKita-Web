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
  calculateCanteenBilling,
  formatDetikKeMenit,
} from '../dummy/canteenContractMock';

export { formatDetikKeMenit };

/**
 * Mengambil daftar rekapitulasi tagihan semua kantin per UPT (Superadmin)
 * Berbasis detik panggilan, tarif per detik, dan persen negosiasi.
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

  // 2. Ambil data real transaksi / billing dari Backend
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

  // 4. Ambil kontrak tarif dari storage (Awalnya kosong jika belum dibuat oleh Superadmin)
  const contracts = getStoredContracts();

  const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1;
  const dueDate = new Date(targetYear, targetMonth, 2, 23, 59, 59, 999);
  const isPastDue = now > dueDate;

  const result = branches.map((b) => {
    // Kontrak dari Superadmin (null jika belum dibuat)
    const contract = contracts[b.id] || null;
    const isContractSet = !!(
      contract &&
      contract.ratePerSecond !== null &&
      contract.ratePerSecond !== undefined &&
      (contract.superadminPercent !== null && contract.superadminPercent !== undefined ||
       contract.negotiationPercent !== null && contract.negotiationPercent !== undefined)
    );

    const canteenName = contract?.canteenName || `Kantin ${b.name}`;
    const uptName = b.name;
    const kanwilName = b.kanwil?.name || b.kanwilName || 'Kanwil Ditjenpas';

    // Cari data real UPT ini dari respon backend
    const beBranchInfo = beNationalData?.branches?.find((bb) => bb.branchId === b.id || bb.branchName?.toLowerCase() === b.name?.toLowerCase());

    // Hitung total detik real dari menit transaksi yang terjadi
    // Jika belum ada pembelian/transaksi di bulan ini, otomatis 0 detik!
    const realMinutes = Number(beBranchInfo?.totalMinutes || 0);
    const totalSeconds = realMinutes * 60;

    // Hitung rumus tagihan baru: Detik x Tarif x Persen Negosiasi (Porsi Superadmin)
    const billingCalc = calculateCanteenBilling({
      totalSeconds,
      ratePerSecond: isContractSet ? contract.ratePerSecond : null,
      superadminPercent: isContractSet ? (contract.superadminPercent ?? contract.negotiationPercent) : null,
      canteenPercent: isContractSet ? (contract.canteenPercent ?? (100 - Number(contract.negotiationPercent || 0))) : null,
      negotiationPercent: isContractSet ? contract.negotiationPercent : null,
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

    if (totalApproved >= billingCalc.totalAmount && billingCalc.totalAmount > 0) {
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

  // Hitung total detik real dari transaksi yang benar-benar terjadi
  // JIKA BELUM MELAKUKAN PEMBELIAN, OTOMATIS KOSONG (0 DETIK)!
  const totalSeconds = transactions.reduce((acc, t) => {
    const usedSec = Number(t.usedDurationSec || 0);
    if (usedSec > 0) return acc + usedSec;
    const durationMin = Number(t.package?.duration || t.durationMinutes || 0);
    return acc + (durationMin * 60);
  }, 0);

  // 3. Cek kontrak tarif di storage (Hanya muncul jika sudah diset oleh Superadmin)
  const branchId = rawBranchId || beBillingData?.branchId || 'b1';
  const contracts = getStoredContracts();
  const contract = contracts[branchId] || null;

  const isContractSet = !!(
    contract &&
    contract.ratePerSecond !== null &&
    contract.ratePerSecond !== undefined &&
    (contract.superadminPercent !== null && contract.superadminPercent !== undefined ||
     contract.negotiationPercent !== null && contract.negotiationPercent !== undefined)
  );

  const ratePerSecond = isContractSet ? Number(contract.ratePerSecond) : null;
  const superadminPercent = isContractSet
    ? (contract.superadminPercent !== null && contract.superadminPercent !== undefined ? Number(contract.superadminPercent) : Number(contract.negotiationPercent))
    : null;
  const canteenPercent = isContractSet
    ? (contract.canteenPercent !== null && contract.canteenPercent !== undefined ? Number(contract.canteenPercent) : (100 - Number(contract.negotiationPercent || 0)))
    : null;
  const negotiationPercent = superadminPercent;

  // 4. Hitung tagihan berdasarkan rumus baru (Porsi Superadmin)
  const billingCalc = calculateCanteenBilling({
    totalSeconds,
    ratePerSecond,
    superadminPercent,
    canteenPercent,
    negotiationPercent,
  });

  // 5. Perbarui nilai setiap transaksi di riwayat agar otomatis mengikuti aturan baru
  const recalculatedTransactions = transactions.map((t) => {
    const durSec = Number(t.usedDurationSec || (t.package?.duration || t.durationMinutes || 0) * 60);
    const itemCalc = calculateCanteenBilling({
      totalSeconds: durSec,
      ratePerSecond,
      superadminPercent,
      canteenPercent,
      negotiationPercent,
    });
    return {
      ...t,
      durationSeconds: durSec,
      calculatedRatePerSecond: ratePerSecond,
      calculatedSuperadminPercent: superadminPercent,
      calculatedCanteenPercent: canteenPercent,
      calculatedNegotiationPercent: negotiationPercent,
      // Nominal item otomatis mengikuti aturan baru:
      totalAmount: isContractSet ? itemCalc.totalAmount : 0,
      subtotalAmount: isContractSet ? itemCalc.subtotal : 0,
      canteenShare: isContractSet ? itemCalc.canteenShare : 0,
    };
  });

  return {
    branchId,
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
    rawStatus: beBillingData?.billingStatus || 'BERJALAN',
    statusPembayaran: beBillingData?.billingStatus === 'PAID' ? 'Lunas' : (beBillingData?.billingStatus === 'PENDING' ? 'Menunggu ACC' : 'Belum Dibayar'),
    isBlocked: beBillingData?.billingStatus === 'DIBLOKIR',
    paymentProof: beBillingData?.paymentProof || null,
  };
}

/**
 * Menyimpan kontrak tarif per detik dan persen bagi hasil oleh Superadmin
 *
 * @param {string} branchId
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

  // 1. Coba simpan ke Backend bila endpoint sudah tersedia
  try {
    const res = await apiFetch(`/api/canteen/contracts/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ratePerSecond: rate,
        superadminPercent: saPercent,
        canteenPercent: ktPercent,
        negotiationPercent: saPercent,
      }),
    });
    if (res && res.data) {
      saveStoredContract(branchId, payload);
      return res.data;
    }
  } catch (_err) {
    // BE endpoint belum ada, simpan ke mock store (MOCK - menunggu endpoint BE)
  }

  // 2. Simpan ke local mock storage
  const updated = saveStoredContract(branchId, payload);

  // Trigger event pembaruan agar semua tampilan sinkron
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
    window.dispatchEvent(new CustomEvent('pascall_contract_changed'));
    window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
  }

  return updated;
}

/**
 * Mengambil daftar konfigurasi kontrak seluruh kantin UPT (Tab Pengaturan Kontrak)
 * // MOCK - menunggu endpoint BE
 *
 * @returns {Promise<Array>}
 */
export async function getAllCanteenContracts() {
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

  // 2. Coba ambil dari BE bila endpoint sudah tersedia
  let beContractsMap = {};
  try {
    const res = await apiFetch('/api/canteen/contracts?limit=100');
    const items = res?.data?.items || res?.items || (Array.isArray(res) ? res : []);
    items.forEach((item) => {
      if (item.branchId) beContractsMap[item.branchId] = item;
    });
  } catch (_e) {
    // BE belum tersedia, gunakan fallback local storage
  }

  // 3. Ambil kontrak dari mock storage
  const storedContracts = getStoredContracts();

  return branches.map((b) => {
    const contract = beContractsMap[b.id] || storedContracts[b.id] || null;
    const isContractSet = !!(
      contract &&
      contract.ratePerSecond !== null &&
      contract.ratePerSecond !== undefined &&
      contract.ratePerSecond !== '' &&
      Number(contract.ratePerSecond) >= 0 &&
      (contract.superadminPercent !== null && contract.superadminPercent !== undefined ||
       contract.negotiationPercent !== null && contract.negotiationPercent !== undefined)
    );

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

