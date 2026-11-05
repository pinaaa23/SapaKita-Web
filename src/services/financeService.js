/**
 * Finance Service (Modul Keuangan & Penagihan Pembagian Hasil 4 Pihak)
 * ====================================================================
 * Terhubung langsung ke Backend REST API PasCall:
 * - GET   /api/finance/summary?month=&year=
 * - GET   /api/finance/reports?year=&branchId=
 * - GET   /api/finance/billings?month=&year=&branchId=&status=&search=
 * - GET   /api/finance/billings/pending-count
 * - GET   /api/finance/billings/:id
 * - PATCH /api/finance/billings/:id/approve
 * - PATCH /api/finance/billings/:id/reject
 * - POST  /api/finance/billings/:id/pay
 * - GET   /api/finance/billings/:id/proof
 * - GET   /api/finance/contracts
 * - GET   /api/finance/contracts/:branchId
 * - PUT   /api/finance/contracts/:branchId
 *
 * Dilengkapi graceful fallback ke local storage jika backend offline/unreachable
 * sehingga antarmuka tetap berjalan mulus.
 */

import { apiFetch, API_BASE_URL } from './api';
import { saveStoredContract } from '../dummy/canteenContractMock';

export const DEFAULT_REVENUE_SPLIT = {
  kepalaUpt: 5,
  koperasi: 30,
  inkopasindo: 10,
  vendor: 55,
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Format Rupiah helper
export const formatRupiah = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

// Storage Keys untuk Fallback
const CONTRACTS_STORAGE_KEY = 'pascall_finance_contracts_v1';
const BILLINGS_STORAGE_KEY = 'pascall_finance_billings_v1';

// Daftar Cabang / UPT Awal untuk Fallback Offline
export const INITIAL_BRANCH_CONTRACTS = [
  {
    branchId: 'b1',
    branchName: 'Lapas Kelas I Cipinang',
    canteenName: 'Koperasi Pengayoman Lapas Cipinang',
    kanwilName: 'Kantor Wilayah DKI Jakarta',
    ratePerSecond: 50,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '123-00-9876543-1',
    bankName: 'Bank Mandiri',
    accountHolder: 'Koperasi Lapas Cipinang',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    branchId: 'b2',
    branchName: 'Lapas Kelas IIA Salemba',
    canteenName: 'Koperasi Simpan Pinjam Salemba',
    kanwilName: 'Kantor Wilayah DKI Jakarta',
    ratePerSecond: 50,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '542-01-8827361-9',
    bankName: 'Bank BCA',
    accountHolder: 'Koperasi Pegawai Salemba',
    updatedAt: '2026-01-20T11:30:00Z',
  },
  {
    branchId: 'b3',
    branchName: 'Rutan Kelas I Depok',
    canteenName: 'Koperasi Sejahtera Rutan Depok',
    kanwilName: 'Kantor Wilayah Jawa Barat',
    ratePerSecond: 60,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '028-11-9928172-4',
    bankName: 'Bank BNI',
    accountHolder: 'Koperasi Konsumen Rutan Depok',
    updatedAt: '2026-02-01T09:15:00Z',
  },
  {
    branchId: 'b4',
    branchName: 'Lapas Kelas IIA Cibinong',
    canteenName: 'Koperasi Karyawan Lapas Cibinong',
    kanwilName: 'Kantor Wilayah Jawa Barat',
    ratePerSecond: 50,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '711-22-3344556-0',
    bankName: 'Bank BSI',
    accountHolder: 'Koperasi Lapas Cibinong',
    updatedAt: '2026-02-10T14:00:00Z',
  },
  {
    branchId: 'b5',
    branchName: 'Lapas Kelas I Sukamiskin',
    canteenName: 'Koperasi Pengayoman Sukamiskin',
    kanwilName: 'Kantor Wilayah Jawa Barat',
    ratePerSecond: 60,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '131-00-1122334-5',
    bankName: 'Bank Mandiri',
    accountHolder: 'Koperasi Lapas Sukamiskin',
    updatedAt: '2026-02-15T16:20:00Z',
  },
  {
    branchId: 'b6',
    branchName: 'Lapas Perempuan Kelas IIA Jakarta',
    canteenName: 'Koperasi Kartini Pengayoman',
    kanwilName: 'Kantor Wilayah DKI Jakarta',
    ratePerSecond: 50,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '445-09-8877665-2',
    bankName: 'Bank BRI',
    accountHolder: 'Koperasi Lapas Perempuan Jakarta',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    branchId: 'b7',
    branchName: 'Lapas Narkotika Kelas IIA Jakarta',
    canteenName: 'Koperasi Bina Sejahtera Narkotika',
    kanwilName: 'Kantor Wilayah DKI Jakarta',
    ratePerSecond: 50,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '123-00-5544332-1',
    bankName: 'Bank Mandiri',
    accountHolder: 'Koperasi Lapas Narkotika Jkt',
    updatedAt: '2026-03-10T13:45:00Z',
  },
  {
    branchId: 'b8',
    branchName: 'Lapas Kelas I Semarang',
    canteenName: 'Koperasi Guyub Rukun Semarang',
    kanwilName: 'Kantor Wilayah Jawa Tengah',
    ratePerSecond: 50,
    split: { kepalaUpt: 5, koperasi: 30, inkopasindo: 10, vendor: 55 },
    accountNumber: '008-33-4455667-8',
    bankName: 'Bank Jateng',
    accountHolder: 'Koperasi Lapas Semarang',
    updatedAt: '2026-03-12T11:00:00Z',
  },
];

// Generator tagihan awal untuk fallback
const generateInitialBillings = () => {
  const billings = [];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  INITIAL_BRANCH_CONTRACTS.forEach((branch, bIdx) => {
    months.forEach((m) => {
      const baseSeconds = 280000 + (bIdx * 35000) + ((m % 4) * 45000);
      const grossAmount = baseSeconds * branch.ratePerSecond;
      const totalVouchers = Math.floor(baseSeconds / 300) + (m * 12);

      const s = branch.split;
      const kepalaUptAmount = Math.round(grossAmount * (s.kepalaUpt / 100));
      const koperasiAmount = Math.round(grossAmount * (s.koperasi / 100));
      const inkopasindoAmount = Math.round(grossAmount * (s.inkopasindo / 100));
      const vendorAmount = grossAmount - kepalaUptAmount - koperasiAmount - inkopasindoAmount;

      let status = 'PAID';
      let paymentDate = null;
      let paymentRef = null;
      let paymentMethod = 'Bank Transfer Mandiri';

      if (m <= 8) {
        status = 'PAID';
        const d = String(20 + (bIdx % 8)).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        paymentDate = `2026-${mStr}-${d}T14:30:00Z`;
        paymentRef = `TRX-2026${mStr}${d}-${branch.branchId.toUpperCase()}-${1000 + bIdx}`;
      } else if (m === 9) {
        if (bIdx % 3 === 0) {
          status = 'PAID';
          paymentDate = '2026-10-05T11:20:00Z';
          paymentRef = `TRX-20261005-${branch.branchId.toUpperCase()}-${2000 + bIdx}`;
        } else if (bIdx % 3 === 1) {
          status = 'PENDING_CONFIRMATION';
          paymentDate = '2026-10-18T09:15:00Z';
          paymentRef = `TRX-20261018-${branch.branchId.toUpperCase()}-${3000 + bIdx}`;
        } else {
          status = 'UNPAID';
        }
      } else {
        status = bIdx === 0 ? 'PENDING_CONFIRMATION' : 'UNPAID';
        if (bIdx === 0) {
          paymentDate = '2026-10-24T08:00:00Z';
          paymentRef = `TRX-20261024-B1-4091`;
        }
      }

      const depositAmountToFinance = grossAmount - koperasiAmount;

      billings.push({
        id: `BILL-2026-${String(m).padStart(2, '0')}-${branch.branchId.toUpperCase()}`,
        branchId: branch.branchId,
        branchName: branch.branchName,
        canteenName: branch.canteenName,
        kanwilName: branch.kanwilName,
        month: m,
        year: 2026,
        totalVouchers,
        totalSeconds: baseSeconds,
        totalMinutes: Math.floor(baseSeconds / 60),
        ratePerSecond: branch.ratePerSecond,
        grossAmount,
        canteenCashCollected: grossAmount,
        canteenKeepAmount: koperasiAmount,
        depositAmountToFinance,
        split: { ...branch.split },
        shares: {
          kepalaUpt: { percent: s.kepalaUpt, amount: kepalaUptAmount },
          koperasi: { percent: s.koperasi, amount: koperasiAmount },
          inkopasindo: { percent: s.inkopasindo, amount: inkopasindoAmount },
          vendor: { percent: s.vendor, amount: vendorAmount },
        },
        status,
        paymentDate,
        paymentRef,
        paymentMethod,
        accountNumber: branch.accountNumber,
        bankName: branch.bankName,
        accountHolder: branch.accountHolder,
        proof: {
          transferId: paymentRef || `TRX-DEP-${branch.branchId.toUpperCase()}-${m}`,
          senderBank: branch.bankName,
          senderAccount: branch.accountNumber,
          senderName: branch.accountHolder,
          targetBank: 'Bank Mandiri (Rekening Penampung Sadewa)',
          targetAccount: '168-00-9988112-7',
          targetHolder: 'PT Station Technology',
          transferDate: paymentDate || '2026-10-24T08:30:00Z',
          nominalSetoran: depositAmountToFinance,
          totalUangTunaiKantin: grossAmount,
          potonganKoperasi: koperasiAmount,
          receiptNumber: `SLIP-${branch.branchId.toUpperCase()}-2026${String(m).padStart(2, '0')}`,
          channel: 'ATM / Mobile Banking Transfer',
        },
        notes: status === 'PAID'
          ? `Setoran bagi hasil sebesar ${depositAmountToFinance.toLocaleString('id-ID')} telah diverifikasi & dialokasikan ke stakeholder`
          : status === 'PENDING_CONFIRMATION'
            ? `Bukti transfer setoran tunai telah diunggah oleh petugas kantin, menunggu verifikasi Admin Finance`
            : `Kantin memegang uang cash hasil penjualan voucher dan belum melakukan setoran ke Finance`,
        verifiedBy: status === 'PAID' ? 'Dewi Lestari (Finance)' : null,
        verifiedAt: status === 'PAID' ? paymentDate : null,
        rejectionReason: null,
      });
    });
  });

  return billings;
};

const getFinanceContractsFromStorage = () => {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[FinanceService] Fallback storage contracts error:', e);
  }
  return INITIAL_BRANCH_CONTRACTS;
};

// Fallback Helper: Get All Billings from localStorage
const getAllFinanceBillingsFromStorage = () => {
  try {
    const raw = localStorage.getItem(BILLINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[FinanceService] Fallback storage billings error:', e);
  }
  const initial = generateInitialBillings();
  try {
    localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(initial));
  } catch (_) {}
  return initial;
};

// Fallback Helper: Filter Billings from localStorage
const getFinanceBillingsFromStorage = ({ month, year, branchId, status, search }) => {
  let list = getAllFinanceBillingsFromStorage();

  if (month && month !== 'semua') {
    list = list.filter((b) => b.month === Number(month));
  }
  if (year && year !== 'semua') {
    list = list.filter((b) => b.year === Number(year));
  }
  if (branchId && branchId !== 'semua') {
    list = list.filter((b) => b.branchId === branchId);
  }
  if (status && status !== 'semua') {
    list = list.filter((b) => b.status === status);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (b) =>
        b.branchName.toLowerCase().includes(q) ||
        b.canteenName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.kanwilName.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (b.month !== a.month) return b.month - a.month;
    return a.branchName.localeCompare(b.branchName);
  });
};

// Fallback Helper: Summary from localStorage
const getFinanceSummaryFromStorage = (month = null, year = 2026) => {
  const all = getAllFinanceBillingsFromStorage();
  const filtered = all.filter((b) => {
    if (year && b.year !== Number(year)) return false;
    if (month && month !== 'semua' && b.month !== Number(month)) return false;
    return true;
  });

  const totalOmsetKotor = filtered.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalPaid = filtered.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalPending = filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalUnpaid = filtered.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

  const shareKepalaUpt = filtered.reduce((acc, b) => acc + (b.shares?.kepalaUpt?.amount || 0), 0);
  const shareKoperasi = filtered.reduce((acc, b) => acc + (b.shares?.koperasi?.amount || 0), 0);
  const shareInkopasindo = filtered.reduce((acc, b) => acc + (b.shares?.inkopasindo?.amount || 0), 0);
  const shareVendor = filtered.reduce((acc, b) => acc + (b.shares?.vendor?.amount || 0), 0);

  return {
    totalRecords: filtered.length,
    totalOmsetKotor,
    totalPaid,
    totalPending,
    totalUnpaid,
    shares: {
      kepalaUpt: shareKepalaUpt,
      koperasi: shareKoperasi,
      inkopasindo: shareInkopasindo,
      vendor: shareVendor,
    },
    counts: {
      paid: filtered.filter((b) => b.status === 'PAID').length,
      pending: filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').length,
      unpaid: filtered.filter((b) => b.status === 'UNPAID').length,
    },
  };
};

// Fallback Helper: Save Contract to localStorage
const saveFinanceContractToStorage = (branchId, contractData) => {
  const contracts = getFinanceContractsFromStorage();
  const index = contracts.findIndex((c) => c.branchId === branchId);

  const updatedContract = {
    ...(index >= 0 ? contracts[index] : {}),
    ...contractData,
    branchId,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = index >= 0
    ? contracts.map((c, idx) => (idx === index ? updatedContract : c))
    : [...contracts, updatedContract];

  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(updatedList));

  // Sinkronkan tagihan yang belum lunas
  const billings = getAllFinanceBillingsFromStorage();
  const { split, ratePerSecond } = updatedContract;

  const newBillings = billings.map((b) => {
    if (b.branchId === branchId && b.status !== 'PAID') {
      const grossAmount = b.totalSeconds * (ratePerSecond || b.ratePerSecond);
      const s = split || b.split;
      const kepalaUptAmount = Math.round(grossAmount * (s.kepalaUpt / 100));
      const koperasiAmount = Math.round(grossAmount * (s.koperasi / 100));
      const inkopasindoAmount = Math.round(grossAmount * (s.inkopasindo / 100));
      const vendorAmount = grossAmount - kepalaUptAmount - koperasiAmount - inkopasindoAmount;

      return {
        ...b,
        ratePerSecond: ratePerSecond || b.ratePerSecond,
        grossAmount,
        split: { ...s },
        shares: {
          kepalaUpt: { percent: s.kepalaUpt, amount: kepalaUptAmount },
          koperasi: { percent: s.koperasi, amount: koperasiAmount },
          inkopasindo: { percent: s.inkopasindo, amount: inkopasindoAmount },
          vendor: { percent: s.vendor, amount: vendorAmount },
        },
      };
    }
    return b;
  });

  localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(newBillings));
  window.dispatchEvent(new Event('finance_billing_updated'));
  return updatedContract;
};

// =============================================================================
// PUBLIC API (Connected to Backend with Automatic Offline Fallback)
// =============================================================================

/**
 * 1. Mengambil daftar kontrak bagi hasil seluruh cabang UPT
 * Endpoint Backend: GET /api/finance/contracts
 */
export const getFinanceContracts = async () => {
  try {
    const res = await apiFetch('/api/finance/contracts');
    const data = res?.data || (Array.isArray(res) ? res : null);
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/contracts fallback:', err?.message);
  }
  return getFinanceContractsFromStorage();
};

/**
 * 2. Memperbarui persentase kontrak bagi hasil UPT
 * Endpoint Backend: PUT /api/finance/contracts/:branchId
 */
export const saveFinanceContract = async (branchId, contractData) => {
  const rate = Number(contractData.ratePerSecond || 50);
  const split = contractData.split || DEFAULT_REVENUE_SPLIT;
  const payload = {
    ratePerSecond: rate,
    split,
    bankName: contractData.bankName,
    accountNumber: contractData.accountNumber,
    accountHolder: contractData.accountHolder,
    canteenName: contractData.canteenName,
  };

  // Simpan ke local mock storage agar sinkron instan antar tab/halaman
  try {
    saveStoredContract(branchId, {
      ratePerSecond: rate,
      superadminPercent: Number(split.vendor ?? 55),
      canteenPercent: Math.max(0, 100 - Number(split.vendor ?? 55)),
      negotiationPercent: Number(split.vendor ?? 55),
      branchName: contractData.branchName,
      canteenName: contractData.canteenName,
    });
  } catch (storeErr) {
    console.warn('[FinanceService] saveStoredContract warning:', storeErr?.message);
  }

  try {
    // 1. Simpan ke endpoint finance
    const res = await apiFetch(`/api/finance/contracts/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // 2. Sinkronisasikan juga ke endpoint canteen contract agar tabel Branch terupdate
    try {
      await apiFetch(`/api/canteen/contracts/${branchId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ratePerSecond: rate,
          kepalaUptPercent: Number(split.kepalaUpt ?? 5),
          koperasiPercent: Number(split.koperasi ?? 30),
          inkopasindoPercent: Number(split.inkopasindo ?? 10),
          vendorPercent: Number(split.vendor ?? 55),
        }),
      });
    } catch (canteenErr) {
      console.warn('[FinanceService] PUT /api/canteen/contracts fallback:', canteenErr?.message);
    }

    const updated = res?.data || res;
    window.dispatchEvent(new Event('finance_billing_updated'));
    window.dispatchEvent(new Event('pascall_contract_changed'));
    window.dispatchEvent(new Event('canteen_topup_changed'));
    if (updated) {
      return updated;
    }
  } catch (err) {
    console.warn('[FinanceService] PUT /api/finance/contracts/:branchId fallback:', err?.message);
  }
  return saveFinanceContractToStorage(branchId, contractData);
};

/**
 * 3. Mengambil daftar rekap tagihan bulanan UPT
 * Endpoint Backend: GET /api/finance/billings?month=&year=&branchId=&status=&search=
 */
export const getFinanceBillings = async (params = {}) => {
  const { month, year, branchId, status, search } = params;
  const query = new URLSearchParams();
  if (month && month !== 'semua') query.append('month', String(month));
  if (year && year !== 'semua') query.append('year', String(year));
  if (branchId && branchId !== 'semua') query.append('branchId', String(branchId));
  if (status && status !== 'semua') query.append('status', String(status));
  if (search && search.trim()) query.append('search', search.trim());

  try {
    const queryString = query.toString();
    const endpoint = `/api/finance/billings${queryString ? `?${queryString}` : ''}`;
    const res = await apiFetch(endpoint);
    const data = res?.data || (Array.isArray(res) ? res : null);
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/billings fallback:', err?.message);
  }
  return getFinanceBillingsFromStorage(params);
};

/**
 * 4. Mengambil seluruh tagihan (untuk agregasi laporan)
 * Endpoint Backend: GET /api/finance/billings
 */
export const getAllFinanceBillings = async () => {
  try {
    const res = await apiFetch('/api/finance/billings');
    const data = res?.data || (Array.isArray(res) ? res : null);
    if (Array.isArray(data)) {
      if (data.length > 0) {
        localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] Fallback getAllFinanceBillings:', err?.message);
  }
  return getAllFinanceBillingsFromStorage();
};

/**
 * 5. Mengambil ringkasan data finansial dashboard
 * Endpoint Backend: GET /api/finance/summary?month=&year=
 */
export const getFinanceSummary = async (month = null, year = 2026) => {
  const query = new URLSearchParams();
  if (month && month !== 'semua') query.append('month', String(month));
  if (year && year !== 'semua') query.append('year', String(year));

  try {
    const queryString = query.toString();
    const endpoint = `/api/finance/summary${queryString ? `?${queryString}` : ''}`;
    const res = await apiFetch(endpoint);
    const data = res?.data || res;
    if (data && typeof data === 'object' && ('totalOmsetKotor' in data || 'totalRecords' in data)) {
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/summary fallback:', err?.message);
  }
  return getFinanceSummaryFromStorage(month, year);
};

/**
 * 6. Mengambil laporan finansial tahunan / per cabang
 * Endpoint Backend: GET /api/finance/reports?year=&branchId=
 */
export const getFinanceReports = async (year = 2026, branchId = null) => {
  const query = new URLSearchParams();
  if (year && year !== 'semua') query.append('year', String(year));
  if (branchId && branchId !== 'semua') query.append('branchId', String(branchId));

  try {
    const queryString = query.toString();
    const endpoint = `/api/finance/reports${queryString ? `?${queryString}` : ''}`;
    const res = await apiFetch(endpoint);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/reports fallback:', err?.message);
  }
  return null;
};

/**
 * 7. Mengambil jumlah setoran pending yang butuh verifikasi (Badge Sidebar)
 * Endpoint Backend: GET /api/finance/billings/pending-count
 */
export const getPendingCanteenDepositCount = async () => {
  try {
    const rawRole = (localStorage.getItem('role') || localStorage.getItem('user_role') || '').toLowerCase().trim().replace(/[\s\-_]+/g, '_');
    if (rawRole && !['superadmin', 'super_admin', 'admin_pusat', 'finance', 'admin_finance'].includes(rawRole)) {
      return 0;
    }
    const res = await apiFetch('/api/finance/billings/pending-count');
    if (typeof res?.count === 'number') return res.count;
    if (typeof res?.data?.count === 'number') return res.data.count;
  } catch (err) {
    // fallback
  }
  const all = getAllFinanceBillingsFromStorage();
  return all.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
};

/**
 * 8. Setujui (ACC) Setoran Pembayaran dari Kantin
 * Endpoint Backend: PATCH /api/finance/billings/:id/approve
 */
export const approveCanteenDeposit = async (billingId, notes = '') => {
  try {
    const res = await apiFetch(`/api/finance/billings/${billingId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
    window.dispatchEvent(new Event('finance_billing_updated'));
    return res?.data || res;
  } catch (err) {
    console.warn('[FinanceService] PATCH approve fallback ke storage:', err?.message);
    const billings = getAllFinanceBillingsFromStorage();
    const idx = billings.findIndex((b) => b.id === billingId);
    if (idx >= 0) {
      billings[idx] = {
        ...billings[idx],
        status: 'PAID',
        paymentDate: new Date().toISOString(),
        verifiedBy: 'Dewi Lestari (Finance)',
        verifiedAt: new Date().toISOString(),
        notes: notes || 'Setoran kasir/kantin telah diverifikasi dan disetujui (ACC) oleh Admin Keuangan.',
      };
      localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(billings));
      window.dispatchEvent(new Event('finance_billing_updated'));
      return billings[idx];
    }
    throw err;
  }
};

/**
 * 9. Tolak Bukti Setoran dari Kantin
 * Endpoint Backend: PATCH /api/finance/billings/:id/reject
 */
export const rejectCanteenDeposit = async (billingId, reason = '') => {
  try {
    const res = await apiFetch(`/api/finance/billings/${billingId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
    window.dispatchEvent(new Event('finance_billing_updated'));
    return res?.data || res;
  } catch (err) {
    console.warn('[FinanceService] PATCH reject fallback ke storage:', err?.message);
    const billings = getAllFinanceBillingsFromStorage();
    const idx = billings.findIndex((b) => b.id === billingId);
    if (idx >= 0) {
      billings[idx] = {
        ...billings[idx],
        status: 'UNPAID',
        rejectionReason: reason || 'Bukti transfer tidak valid atau nominal setoran tidak sesuai',
        rejectedBy: 'Dewi Lestari (Finance)',
        rejectedAt: new Date().toISOString(),
        notes: `Ditolak oleh Finance: ${reason || 'Bukti transfer tidak valid'}`,
      };
      localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(billings));
      window.dispatchEvent(new Event('finance_billing_updated'));
      return billings[idx];
    }
    throw err;
  }
};

/**
 * 10. Update status pembayaran tagihan manual / internal
 */
export const updateFinanceBillingStatus = (billingId, newStatus, extraData = {}) => {
  const billings = getAllFinanceBillingsFromStorage();
  const idx = billings.findIndex((b) => b.id === billingId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updatedItem = {
    ...billings[idx],
    status: newStatus,
    paymentDate: newStatus === 'PAID' ? (extraData.paymentDate || now) : billings[idx].paymentDate,
    paymentRef: extraData.paymentRef || billings[idx].paymentRef || `TRX-${Date.now()}`,
    paymentMethod: extraData.paymentMethod || billings[idx].paymentMethod,
    notes: extraData.notes || billings[idx].notes,
    verifiedBy: newStatus === 'PAID' ? 'Dewi Lestari (Finance)' : null,
    verifiedAt: newStatus === 'PAID' ? now : null,
  };

  billings[idx] = updatedItem;
  localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(billings));
  window.dispatchEvent(new Event('finance_billing_updated'));
  return updatedItem;
};

/**
 * 11. Mengambil detail tagihan tunggal
 * Endpoint Backend: GET /api/finance/billings/:id
 */
export const getFinanceBillingById = async (id) => {
  try {
    const res = await apiFetch(`/api/finance/billings/${id}`);
    if (res?.data) return res.data;
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/billings/:id fallback:', err?.message);
  }
  const all = getAllFinanceBillingsFromStorage();
  return all.find((b) => b.id === id) || null;
};

/**
 * 12. URL streaming berkas bukti transfer
 */
export const getFinanceProofStreamUrl = (billingId) => {
  return `${API_BASE_URL}/api/finance/billings/${billingId}/proof`;
};

/**
 * 13. Mengambil pengaturan rekening penampung & QRIS default untuk kasir kantin
 * Endpoint Backend: GET /api/finance/payment-settings
 */
export const getFinancePaymentSettings = async () => {
  try {
    const res = await apiFetch('/api/finance/payment-settings');
    if (res?.data) return res.data;
    if (res?.bankName) return res;
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/payment-settings fallback:', err?.message);
  }

  // Fallback lokal jika offline / development
  const local = localStorage.getItem('pascall_finance_payment_settings');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }

  return {
    id: 'default',
    bankName: 'Bank Mandiri',
    accountNumber: '168-00-9988112-7',
    accountHolder: 'PT Station Technology',
    qrisImageUrl: null,
    qrisContent: null,
    instructions: 'Transfer tepat sesuai nominal tagihan dan unggah bukti transfer yang sah.',
    isActive: true,
  };
};

/**
 * 14. Menyimpan/memperbarui pengaturan rekening penampung & QRIS default
 * Endpoint Backend: PUT /api/finance/payment-settings (FormData or JSON)
 */
export const updateFinancePaymentSettings = async (payload) => {
  let body;
  let headers = {};

  if (payload instanceof FormData) {
    body = payload;
  } else {
    body = JSON.stringify(payload);
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await apiFetch('/api/finance/payment-settings', {
      method: 'PUT',
      body,
      headers: payload instanceof FormData ? undefined : headers,
    });

    const data = res?.data || res;
    if (data) {
      localStorage.setItem('pascall_finance_payment_settings', JSON.stringify(data));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_payment_settings_updated', { detail: data }));
      }
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] PUT /api/finance/payment-settings fallback:', err?.message);
    if (!(payload instanceof FormData)) {
      localStorage.setItem('pascall_finance_payment_settings', JSON.stringify(payload));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_payment_settings_updated', { detail: payload }));
      }
      return payload;
    }
    throw err;
  }
};



/**
 * 15. Mengambil pengaturan tarif billing & formula bagi hasil global nasional
 * Endpoint Backend: GET /api/finance/global-settings
 */
export const getGlobalBillingSettings = async () => {
  try {
    const res = await apiFetch('/api/finance/global-settings');
    const data = res?.data || res;
    if (data && typeof data.defaultRatePerSecond !== 'undefined') {
      localStorage.setItem('pascall_finance_global_settings', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] GET /api/finance/global-settings fallback:', err?.message);
  }

  const local = localStorage.getItem('pascall_finance_global_settings');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }

  return {
    id: 'default',
    defaultRatePerSecond: 15,
    shareKepalaUptPercent: 5,
    shareKoperasiPercent: 30,
    shareInkopasindoPercent: 10,
    shareVendorPercent: 55,
    totalBranches: 0,
    matchingBranches: 0,
  };
};

/**
 * 16. Memperbarui pengaturan tarif billing global nasional (dengan opsi terapkan serentak ke semua UPT)
 * Endpoint Backend: PUT /api/finance/global-settings
 */
export const updateGlobalBillingSettings = async (payload) => {
  try {
    const res = await apiFetch('/api/finance/global-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = res?.data || res;
    if (data) {
      localStorage.setItem('pascall_finance_global_settings', JSON.stringify(data));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_global_settings_updated', { detail: data }));
        window.dispatchEvent(new Event('finance_billing_updated'));
      }
      return data;
    }
  } catch (err) {
    console.warn('[FinanceService] PUT /api/finance/global-settings fallback:', err?.message);
    const existing = await getGlobalBillingSettings();
    const updated = { ...existing, ...payload };
    localStorage.setItem('pascall_finance_global_settings', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('finance_global_settings_updated', { detail: updated }));
      window.dispatchEvent(new Event('finance_billing_updated'));
    }
    return updated;
  }
};
