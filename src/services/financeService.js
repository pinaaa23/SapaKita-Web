/**
 * Finance Service (Modul Keuangan & Penagihan Pembagian Hasil 4 Pihak)
 * 
 * Skema Pembagian Hasil:
 * 1. Kepala UPT: 5%
 * 2. Koperasi: 30%
 * 3. Inkopasindo: 10%
 * 4. Vendor: 55%
 * Total = 100% (Konfigurasi persentase dinamis & dapat disesuaikan per cabang)
 */

export const DEFAULT_REVENUE_SPLIT = {
  kepalaUpt: 5,
  koperasi: 30,
  inkopasindo: 10,
  vendor: 55,
};

// Daftar Cabang / UPT Awal
export const INITIAL_BRANCH_CONTRACTS = [
  {
    branchId: 'b1',
    branchName: 'Lapas Kelas I Cipinang',
    canteenName: 'Koperasi Pengayoman Lapas Cipinang',
    kanwilName: 'Kantor Wilayah DKI Jakarta',
    ratePerSecond: 50, // Rp 50/detik (~Rp 3.000/menit)
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

// Seed generator untuk rekap tagihan bulanan
const generateInitialBillings = () => {
  const billings = [];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Jan - Okt 2026

  INITIAL_BRANCH_CONTRACTS.forEach((branch, bIdx) => {
    months.forEach((m) => {
      // Variasi durasi realistis
      const baseSeconds = 280000 + (bIdx * 35000) + ((m % 4) * 45000);
      const grossAmount = baseSeconds * branch.ratePerSecond;
      const totalVouchers = Math.floor(baseSeconds / 300) + (m * 12);

      // Hitung nominal bagi hasil 4 pihak
      const s = branch.split;
      const kepalaUptAmount = Math.round(grossAmount * (s.kepalaUpt / 100));
      const koperasiAmount = Math.round(grossAmount * (s.koperasi / 100));
      const inkopasindoAmount = Math.round(grossAmount * (s.inkopasindo / 100));
      const vendorAmount = grossAmount - kepalaUptAmount - koperasiAmount - inkopasindoAmount;

      // Status pembayaran realistis:
      // Bulan Jan - Ags: Sudah Dibayar (Lunas)
      // Bulan Sep: Sebagian Sudah Dibayar, sebagian Menunggu Verifikasi
      // Bulan Okt: Belum Dibayar / Periode Berjalan
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
        // Bulan 10 (Oktober)
        status = bIdx === 0 ? 'PENDING_CONFIRMATION' : 'UNPAID';
        if (bIdx === 0) {
          paymentDate = '2026-10-24T08:00:00Z';
          paymentRef = `TRX-20261024-B1-4091`;
        }
      }

      const depositAmountToFinance = grossAmount - koperasiAmount; // 70% disetor ke Rekening Finance (Kepala UPT 5% + Inkopasindo 10% + Vendor 55%)

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
        grossAmount, // 100% Uang Cash yang dipegang Kantin
        canteenCashCollected: grossAmount,
        canteenKeepAmount: koperasiAmount, // 30% hak kantin/koperasi yang disimpan langsung
        depositAmountToFinance, // 70% yang disetor ke Rekening Penampung Finance
        split: { ...branch.split },
        shares: {
          kepalaUpt: { percent: s.kepalaUpt, amount: kepalaUptAmount },
          koperasi: { percent: s.koperasi, amount: koperasiAmount },
          inkopasindo: { percent: s.inkopasindo, amount: inkopasindoAmount },
          vendor: { percent: s.vendor, amount: vendorAmount },
        },
        status, // 'PAID' | 'PENDING_CONFIRMATION' | 'UNPAID'
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
          targetBank: 'Bank Mandiri (Rekening Penampung PasCall)',
          targetAccount: '168-00-9988112-7',
          targetHolder: 'PT PasCall Solusi Indonesia',
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

// Storage Keys
const CONTRACTS_STORAGE_KEY = 'pascall_finance_contracts_v1';
const BILLINGS_STORAGE_KEY = 'pascall_finance_billings_v1';

// Helper get contracts
export const getFinanceContracts = () => {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[FinanceService] Gagal memuat kontrak dari storage:', e);
  }
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(INITIAL_BRANCH_CONTRACTS));
  return INITIAL_BRANCH_CONTRACTS;
};

// Helper save contract
export const saveFinanceContract = (branchId, contractData) => {
  const contracts = getFinanceContracts();
  const index = contracts.findIndex((c) => c.branchId === branchId);
  
  const updatedContract = {
    ...(index >= 0 ? contracts[index] : {}),
    ...contractData,
    branchId,
    updatedAt: new Date().toISOString(),
  };

  let updatedList;
  if (index >= 0) {
    updatedList = [...contracts];
    updatedList[index] = updatedContract;
  } else {
    updatedList = [...contracts, updatedContract];
  }

  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(updatedList));

  // Sinkronkan juga tagihan aktif yang belum dibayar dengan persentase baru
  syncBillingsWithNewSplit(branchId, updatedContract);

  return updatedContract;
};

// Sinkronisasi tagihan yang belum dibayar saat kontrak diubah
const syncBillingsWithNewSplit = (branchId, updatedContract) => {
  const billings = getAllFinanceBillings();
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
};

// Helper get all billings
export const getAllFinanceBillings = () => {
  try {
    const raw = localStorage.getItem(BILLINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[FinanceService] Gagal memuat tagihan dari storage:', e);
  }
  const initial = generateInitialBillings();
  localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
};

// Helper filter billings
export const getFinanceBillings = ({ month, year, branchId, status, search }) => {
  let list = getAllFinanceBillings();

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

  // Urutkan dari tahun & bulan terbaru, lalu nama UPT
  return list.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (b.month !== a.month) return b.month - a.month;
    return a.branchName.localeCompare(b.branchName);
  });
};

// Update status pembayaran tagihan
export const updateFinanceBillingStatus = (billingId, newStatus, extraData = {}) => {
  const billings = getAllFinanceBillings();
  const idx = billings.findIndex((b) => b.id === billingId);
  if (idx === -1) throw new Error('Tagihan tidak ditemukan');

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

// Ringkasan Dashboard Keuangan
export const getFinanceSummary = (month = null, year = 2026) => {
  const all = getAllFinanceBillings();
  const filtered = all.filter((b) => {
    if (year && b.year !== Number(year)) return false;
    if (month && month !== 'semua' && b.month !== Number(month)) return false;
    return true;
  });

  const totalOmsetKotor = filtered.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalPaid = filtered.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalPending = filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalUnpaid = filtered.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

  // Akumulasi nominal 4 pihak
  const shareKepalaUpt = filtered.reduce((acc, b) => acc + (b.shares?.kepalaUpt?.amount || 0), 0);
  const shareKoperasi = filtered.reduce((acc, b) => acc + (b.shares?.koperasi?.amount || 0), 0);
  const shareInkopasindo = filtered.reduce((acc, b) => acc + (b.shares?.inkopasindo?.amount || 0), 0);
  const shareVendor = filtered.reduce((acc, b) => acc + (b.shares?.vendor?.amount || 0), 0);

  const countPaid = filtered.filter((b) => b.status === 'PAID').length;
  const countPending = filtered.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
  const countUnpaid = filtered.filter((b) => b.status === 'UNPAID').length;

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
      paid: countPaid,
      pending: countPending,
      unpaid: countUnpaid,
    },
  };
};

// Format Rupiah helper
export const formatRupiah = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

// Hitung setoran kantin yang menunggu konfirmasi (Pending)
export const getPendingCanteenDepositCount = () => {
  const all = getAllFinanceBillings();
  return all.filter((b) => b.status === 'PENDING_CONFIRMATION').length;
};

// Setujui (ACC) Setoran Pembayaran dari Kantin
export const approveCanteenDeposit = (billingId, notes = '') => {
  const now = new Date().toISOString();
  return updateFinanceBillingStatus(billingId, 'PAID', {
    paymentDate: now,
    notes: notes || 'Setoran kasir/kantin telah diverifikasi dan disetujui (ACC) oleh Admin Keuangan.',
  });
};

// Tolak Bukti Setoran dari Kantin
export const rejectCanteenDeposit = (billingId, reason = '') => {
  const billings = getAllFinanceBillings();
  const idx = billings.findIndex((b) => b.id === billingId);
  if (idx === -1) throw new Error('Tagihan tidak ditemukan');

  const now = new Date().toISOString();
  const updatedItem = {
    ...billings[idx],
    status: 'UNPAID',
    rejectionReason: reason || 'Bukti transfer tidak valid atau nominal setoran tidak sesuai',
    rejectedBy: 'Dewi Lestari (Finance)',
    rejectedAt: now,
    notes: `Ditolak oleh Finance: ${reason || 'Bukti transfer tidak valid'}`,
  };

  billings[idx] = updatedItem;
  localStorage.setItem(BILLINGS_STORAGE_KEY, JSON.stringify(billings));
  window.dispatchEvent(new Event('finance_billing_updated'));
  return updatedItem;
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
