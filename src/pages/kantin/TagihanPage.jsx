import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Printer,
  AlertTriangle,
  ArrowRight,
  Search,
  Ticket,
  User,
  Info,
  Phone,
  Video,
  Copy,
  Check,
  CreditCard,
  Receipt,
  Eye,
  X,
  Coins,
  Calculator,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  XCircle,
  FileText,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatKantin';
import { 
  getMonthlyBilling, 
  getPaymentHistory 
} from '../../services/kantin/tagihanService';
import {
  getCanteenBillingMonthly,
  getCanteenBillingCalls,
  formatDetikKeMenit,
  isCanteenContractConfigured,
} from '../../services/canteenBillingService';
import ModalPembayaranTagihan from '../../components/kantin/ModalPembayaranTagihan';
import { API_BASE_URL } from '../../services/api';

export default function TagihanPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [billingData, setBillingData] = useState(null);
  const [canteenBilling, setCanteenBilling] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('calls'); // 'calls' (Rincian Panggilan) | 'payments' (Riwayat Pembayaran)
  const [previewProofItem, setPreviewProofItem] = useState(null);

  // Data Log Rincian Panggilan dari GET /api/canteen/billing/calls
  const [callsData, setCallsData] = useState({
    items: [],
    totalItems: 0,
    totalSeconds: 0,
    totalTagihan: 0,
    pagination: { page: 1, limit: 10, totalPages: 1 },
  });
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  // Pagination untuk Tab Rincian Panggilan
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modal Pembayaran Tagihan State
  const [isModalBayarOpen, setIsModalBayarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Pastikan halaman selalu dimulai dari paling atas saat dibuka
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  // Fetch data rekap tagihan bulanan kantin dan riwayat pembayaran
  const fetchBillingAndPayments = useCallback(async (month, year, silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [billingRes, paymentsRes, newBillingRes] = await Promise.allSettled([
        getMonthlyBilling(month, year),
        getPaymentHistory(),
        getCanteenBillingMonthly(month, year),
      ]);

      if (billingRes.status === 'fulfilled') {
        setBillingData(billingRes.value);
      }
      if (paymentsRes.status === 'fulfilled') {
        setPaymentHistory(Array.isArray(paymentsRes.value) ? paymentsRes.value : []);
      }
      if (newBillingRes.status === 'fulfilled') {
        setCanteenBilling(newBillingRes.value);
      }
    } catch (err) {
      console.error('Gagal memuat rekapitulasi tagihan bulanan kantin:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch log panggilan dari endpoint GET /api/canteen/billing/calls
  const fetchCalls = useCallback(async (month, year, page, search) => {
    setIsLoadingCalls(true);
    try {
      const res = await getCanteenBillingCalls({
        month,
        year,
        page,
        limit: PAGE_SIZE,
        search,
      });
      setCallsData(res);
    } catch (err) {
      console.error('Gagal memuat rincian panggilan:', err);
    } finally {
      setIsLoadingCalls(false);
    }
  }, [PAGE_SIZE]);

  // Polling berkala (tiap 20 detik) & Refetch saat Tab / Jendela kembali aktif (on focus)
  useEffect(() => {
    fetchBillingAndPayments(selectedMonth, selectedYear);
    fetchCalls(selectedMonth, selectedYear, currentPage, searchQuery);

    const handleUpdate = () => {
      fetchBillingAndPayments(selectedMonth, selectedYear, true);
      fetchCalls(selectedMonth, selectedYear, currentPage, searchQuery);
    };

    const handleFocus = () => {
      fetchBillingAndPayments(selectedMonth, selectedYear, true);
      fetchCalls(selectedMonth, selectedYear, currentPage, searchQuery);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBillingAndPayments(selectedMonth, selectedYear, true);
        fetchCalls(selectedMonth, selectedYear, currentPage, searchQuery);
      }
    };

    // 1. Polling setiap 20 detik
    const pollingInterval = setInterval(() => {
      fetchBillingAndPayments(selectedMonth, selectedYear, true);
      fetchCalls(selectedMonth, selectedYear, currentPage, searchQuery);
    }, 20000);

    // 2. Refetch on focus & visibilitychange
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Event listener sinkronisasi internal & storage (antar-tab)
    window.addEventListener('pascall_billing_updated', handleUpdate);
    window.addEventListener('pascall_contract_changed', handleUpdate);
    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pascall_billing_updated', handleUpdate);
      window.removeEventListener('pascall_contract_changed', handleUpdate);
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchBillingAndPayments, fetchCalls, selectedMonth, selectedYear, currentPage, searchQuery]);

  // Debounce refetch calls saat search/page/month/year berubah
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCalls(selectedMonth, selectedYear, currentPage, searchQuery);
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCalls, selectedMonth, selectedYear, currentPage, searchQuery]);

  // Reset pagination saat bulan/pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery]);

  const monthOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Hitung Tanggal Jatuh Tempo (Tanggal 2 Bulan Berikutnya)
  const dueDate = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 2, 23, 59, 59, 999);
  }, [selectedMonth, selectedYear]);

  // Sisa Hari Menuju Jatuh Tempo
  const remainingDays = useMemo(() => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dueDate]);

  const isPastDue = remainingDays < 0;

  // Nilai Tagihan Baru Berbasis Detik
  // Ikuti aturan: Kontrak belum diatur (ratePerSecond atau persen null/kosong) => Jangan jadikan 0/default 15/40
  const isContractConfigured = isCanteenContractConfigured(canteenBilling);
  const ratePerSec = isContractConfigured && canteenBilling?.ratePerSecond !== null && canteenBilling?.ratePerSecond !== undefined
    ? Number(canteenBilling.ratePerSecond)
    : null;
  const saPercent = isContractConfigured && (canteenBilling?.superadminPercent ?? canteenBilling?.negotiationPercent) !== null && (canteenBilling?.superadminPercent ?? canteenBilling?.negotiationPercent) !== undefined
    ? Number(canteenBilling.superadminPercent ?? canteenBilling.negotiationPercent)
    : null;

  // Gunakan totalSeconds dan totalTagihan dari respons API
  const totalSecondsAll = Number(
    callsData?.totalSeconds !== undefined && callsData?.totalSeconds !== null && !searchQuery
      ? callsData.totalSeconds
      : (canteenBilling?.totalSeconds || billingData?.summary?.totalSeconds || 0)
  );

  const subtotalTagihan = isContractConfigured && ratePerSec !== null
    ? (canteenBilling?.subtotal !== null && canteenBilling?.subtotal !== undefined
        ? Number(canteenBilling.subtotal)
        : Math.round(totalSecondsAll * ratePerSec))
    : null;

  const newTotalTagihan = isContractConfigured && saPercent !== null && subtotalTagihan !== null
    ? (callsData?.totalTagihan !== undefined && callsData?.totalTagihan !== null && !searchQuery
        ? Number(callsData.totalTagihan)
        : (canteenBilling?.totalAmount !== null && canteenBilling?.totalAmount !== undefined
            ? Number(canteenBilling.totalAmount)
            : Math.round(subtotalTagihan * (saPercent / 100))))
    : null;

  // Filter pembayaran khusus untuk bulan & tahun yang dipilih
  const currentMonthPayments = useMemo(() => {
    return paymentHistory.filter((p) => {
      if (!p) return false;
      if (p.billingMonth && p.billingYear) {
        return Number(p.billingMonth) === selectedMonth && Number(p.billingYear) === selectedYear;
      }
      if (p.createdAt || p.submittedAt) {
        const d = new Date(p.createdAt || p.submittedAt);
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      }
      return false;
    });
  }, [paymentHistory, selectedMonth, selectedYear]);

  // Akumulasi Pembayaran yang telah di-ACC (APPROVED)
  const approvedPayments = currentMonthPayments.filter(
    (p) => p.status === 'APPROVED' || p.status === 'Berhasil'
  );
  const totalApproved = approvedPayments.reduce(
    (sum, p) => sum + Number(p.nominal || p.totalBayar || 0),
    0
  );

  // Pembayaran yang sedang PENDING menunggu ACC Superadmin
  const pendingPayment = currentMonthPayments.find(
    (p) => p.status === 'PENDING' || p.status === 'Menunggu'
  );

  // Pembayaran yang Ditolak oleh Superadmin
  const rejectedPayment = currentMonthPayments.find(
    (p) => p.status === 'REJECTED' || p.status === 'Ditolak'
  );

  // Tutup buku terjadi pada hari terakhir bulan berjalan
  const lastDayOfSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const closingDate = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, lastDayOfSelectedMonth, 23, 59, 59, 999);
  }, [selectedYear, selectedMonth, lastDayOfSelectedMonth]);

  const isCurrentPeriod = (selectedMonth === currentMonth && selectedYear === currentYear);
  const isMonthClosed = !isCurrentPeriod || now >= closingDate;

  // Status Pembayaran & Sisa Tagihan (Selisih)
  const isPaid = isContractConfigured && newTotalTagihan !== null && totalApproved >= newTotalTagihan && newTotalTagihan > 0;
  const isPendingAcc = isContractConfigured && !isPaid && !!pendingPayment;
  const isRejected = isContractConfigured && !isPaid && !isPendingAcc && !!rejectedPayment;
  const sisaTagihan = isContractConfigured && newTotalTagihan !== null ? Math.max(0, newTotalTagihan - totalApproved) : 0;
  const hasRemainingAfterPayment = isContractConfigured && totalApproved > 0 && sisaTagihan > 0;
  const payableAmount = isContractConfigured ? (hasRemainingAfterPayment ? sisaTagihan : (newTotalTagihan || 0)) : null;

  // Tombol bayar aktif HANYA jika kontrak sudah diatur, ada tagihan (> 0), belum lunas, dan tidak sedang menunggu ACC:
  const canPay = isContractConfigured && !isPaid && !isPendingAcc && payableAmount > 0;

  // =========================================================================
  // SATU STATUS TUNGGAL (Tidak ada label status yang bertabrakan)
  // =========================================================================
  const singleStatus = useMemo(() => {
    if (!isContractConfigured) {
      return {
        key: 'CONTRACT_NOT_SET',
        label: 'Tarif Belum Diatur',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        textColor: 'text-amber-300',
        icon: AlertTriangle,
      };
    }

    if (newTotalTagihan === 0) {
      return {
        key: 'NO_BILL',
        label: 'Tidak Ada Tagihan',
        badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
        textColor: 'text-slate-300',
        icon: CheckCircle2,
      };
    }

    if (isPaid) {
      return {
        key: 'PAID',
        label: 'Lunas',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        textColor: 'text-emerald-300',
        icon: CheckCircle2,
      };
    }

    if (isPendingAcc) {
      return {
        key: 'PENDING_ACC',
        label: 'Menunggu ACC Superadmin',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        textColor: 'text-amber-300',
        icon: Clock,
      };
    }

    if (isRejected) {
      return {
        key: 'REJECTED',
        label: 'Ditolak',
        badgeBg: 'bg-rose-500/25 text-rose-300 border-rose-400/40',
        textColor: 'text-rose-300',
        icon: XCircle,
      };
    }

    if (isPastDue && sisaTagihan > 0) {
      return {
        key: 'BLOCKED',
        label: 'Telat / Diblokir',
        badgeBg: 'bg-rose-500/30 text-rose-300 border-rose-500/50',
        textColor: 'text-rose-300',
        icon: ShieldAlert,
      };
    }

    if (!isMonthClosed) {
      return {
        key: 'IN_PROGRESS',
        label: 'Bulan Berjalan',
        badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
        textColor: 'text-blue-200',
        icon: Clock,
      };
    }

    return {
      key: 'UNPAID',
      label: 'Belum Bayar',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      textColor: 'text-amber-300',
      icon: AlertTriangle,
    };
  }, [
    newTotalTagihan,
    isPaid,
    isPendingAcc,
    isRejected,
    isPastDue,
    sisaTagihan,
    isMonthClosed,
  ]);

  // Nomor Faktur Tetap
  const invoiceNumber = useMemo(() => {
    return (
      canteenBilling?.invoiceNumber ||
      billingData?.invoiceNumber ||
      `INV-${selectedYear}${String(selectedMonth).padStart(2, '0')}-KTN`
    );
  }, [canteenBilling?.invoiceNumber, billingData?.invoiceNumber, selectedMonth, selectedYear]);

  // Daftar Transaksi Riil (Diperbarui nilai detik x tarif x persen SA)
  const transactions = useMemo(() => {
    return canteenBilling?.transactions || billingData?.transactions || [];
  }, [canteenBilling?.transactions, billingData?.transactions]);

  // Filter Transaksi berdasarkan Query Pencarian
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      const id = String(t.id || '').toLowerCase();
      const code = String(t.kodeVoucher || '').toLowerCase();
      const inmateName = String(t.inmate?.name || '').toLowerCase();
      const inmateNip = String(t.inmate?.identifier || '').toLowerCase();
      const pkgName = String(t.package?.name || '').toLowerCase();
      const cashierName = String(t.cashier?.name || t.cashier?.identifier || '').toLowerCase();
      return (
        id.includes(q) ||
        code.includes(q) ||
        inmateName.includes(q) ||
        inmateNip.includes(q) ||
        pkgName.includes(q) ||
        cashierName.includes(q)
      );
    });
  }, [transactions, searchQuery]);

  // Paginasi Transaksi
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTransactions, currentPage, PAGE_SIZE]);

  // Payload untuk Modal Pembayaran
  const modalBillingPayload = useMemo(() => {
    return {
      ...(billingData || {}),
      invoiceNumber,
      period: `${monthOptions[selectedMonth - 1]?.label} ${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      totalSeconds: totalSecondsAll,
      ratePerSecond: ratePerSec,
      superadminPercent: saPercent,
      totalAmount: newTotalTagihan,
      summary: {
        totalAmount: newTotalTagihan,
        totalMinutes: Math.floor(totalSecondsAll / 60) || 1,
      },
      isMonthClosed,
    };
  }, [
    billingData,
    invoiceNumber,
    selectedMonth,
    selectedYear,
    totalSecondsAll,
    ratePerSec,
    saPercent,
    newTotalTagihan,
    isMonthClosed,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoice = () => {
    if (invoiceNumber) {
      navigator.clipboard.writeText(invoiceNumber);
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    }
  };

  const handlePaymentSuccess = () => {
    setToastMessage('Bukti pembayaran tagihan berhasil dikirim ke Superadmin untuk diverifikasi.');
    fetchBillingAndPayments(selectedMonth, selectedYear, true);
    setTimeout(() => {
      setToastMessage('');
    }, 6000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 text-slate-800 print:bg-white print:p-0">
      {/* CSS Khusus Print Dokumen Tagihan */}
      <style>{`
        @media print {
          nav, aside, header, .no-print {
            display: none !important;
          }
          body, html {
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* Toast Sukses Pembayaran */}
      {toastMessage && (
        <div className="no-print mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Halaman & Filter Controls */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Sistem Pascabayar
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Kantin Lapas</span>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 ml-2 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Sinkronisasi data...
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tagihan Bulanan Kantin
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Tagihan bulanan dihitung dari akumulasi detik panggilan WBP dikalikan tarif per detik dan persen bagian Superadmin.
          </p>
        </div>

        {/* Toolbar Filter & Cetak */}
        <div className="no-print flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="text-slate-200">|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            title="Cetak faktur / tagihan bulan ini"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Tagihan</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BANNER PERINGATAN KONTRAK & JATUH TEMPO
          Sesuai aturan:
          - Sisa 7 hari atau kurang: Kuning
          - Sisa 3 hari atau kurang: Oranye
          - Sisa 1 hari atau kurang: Merah ("Jika lewat jatuh tempo, kantin otomatis tidak bisa berjualan")
          - Setelah lewat: Status Telat/Diblokir
          ========================================================================= */}
      

      {/* 2. Peringatan Telat / Diblokir (Lewat Jatuh Tempo) */}
      {isPastDue && !isPaid && !isPendingAcc && isContractConfigured && newTotalTagihan > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-rose-900 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <strong className="block font-black text-rose-800">
              Layanan Dinonaktifkan Sementara (Status: Telat / Diblokir)
            </strong>
            <span>
              Batas jatuh tempo tagihan periode ini telah terlewati pada{' '}
              <strong>{formatTanggal(dueDate)}</strong>. Jika lewat jatuh tempo, kantin otomatis tidak bisa berjualan. Segera lakukan pelunasan tagihan di bawah ini untuk mengaktifkan kembali layanan.
            </span>
          </div>
        </div>
      )}

      {/* 3. Peringatan Jatuh Tempo: <= 1 Hari (Merah) */}
      {!isPastDue && remainingDays <= 1 && !isPaid && !isPendingAcc && isContractConfigured && newTotalTagihan > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-rose-900 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <strong className="block font-black text-rose-800">
              Peringatan Jatuh Tempo Mendesak: {remainingDays === 0 ? 'Hari Ini Adalah Batas Terakhir!' : 'Tersisa 1 Hari Lagi!'}
            </strong>
            <span>
              Batas waktu pembayaran tagihan adalah <strong>{formatTanggal(dueDate)}</strong> ({remainingDays === 0 ? 'Hari ini' : '1 hari lagi'}). Jika lewat jatuh tempo, kantin otomatis tidak bisa berjualan.
            </span>
          </div>
        </div>
      )}

      {/* 4. Peringatan Jatuh Tempo: <= 3 Hari (Oranye) */}
      {!isPastDue && remainingDays > 1 && remainingDays <= 3 && !isPaid && !isPendingAcc && isContractConfigured && newTotalTagihan > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-300 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-orange-900 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <strong className="block font-black text-orange-800">
              Peringatan Jatuh Tempo: Tersisa {remainingDays} Hari Lagi
            </strong>
            <span>
              Batas waktu pembayaran tagihan adalah <strong>{formatTanggal(dueDate)}</strong> ({remainingDays} hari lagi). Jika lewat jatuh tempo, kantin otomatis tidak bisa berjualan.
            </span>
          </div>
        </div>
      )}

      {/* 5. Peringatan Jatuh Tempo: <= 7 Hari (Kuning) */}
      {!isPastDue && remainingDays > 3 && remainingDays <= 7 && !isPaid && !isPendingAcc && isContractConfigured && newTotalTagihan > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-amber-900 animate-in fade-in">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <strong className="block font-bold text-amber-800">
              Pengingat Jatuh Tempo: Tersisa {remainingDays} Hari Lagi
            </strong>
            <span>
              Batas waktu pembayaran tagihan adalah <strong>{formatTanggal(dueDate)}</strong> ({remainingDays} hari lagi). Jika lewat jatuh tempo, kantin otomatis tidak bisa berjualan.
            </span>
          </div>
        </div>
      )}

      {/* 6. Alert Penolakan Pembayaran (Jika Ada) */}
      {isRejected && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start sm:items-center gap-3 text-xs text-rose-900 animate-in fade-in">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <strong className="block font-bold text-rose-800">Pembayaran Sebelumnya Ditolak oleh Superadmin</strong>
            <p className="mt-0.5 text-rose-700">
              Alasan: <span className="font-semibold">{rejectedPayment.rejectReason || 'Bukti transfer tidak sesuai atau tidak valid.'}</span>
            </p>
            <span className="text-[11px] text-rose-600 mt-1 block">
              Silakan lakukan pembayaran ulang dan unggah bukti transfer yang sah melalui tombol di bawah.
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          KARTU ATAS: TOTAL TAGIHAN BULAN INI
          ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-blue-950/20 relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Sisi Kiri (Kolom 7/12): Informasi Tagihan & Single Status */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 min-w-0">
              <div className="space-y-3">
                {/* Badges Berdampingan */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 shrink-0">
                    <Coins className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Periode {monthOptions[selectedMonth - 1]?.label} {selectedYear}</span>
                  </span>

                  {/* SATU STATUS TUNGGAL SAJA (Tanpa label bertabrakan) */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${singleStatus.badgeBg}`}>
                    <singleStatus.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{singleStatus.label}</span>
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                    {hasRemainingAfterPayment ? 'Sisa Tagihan yang Harus Dibayar' : 'Total Tagihan Bulan Ini'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-3 flex-wrap">
                    <span>{isLoading ? '...' : isContractConfigured && payableAmount !== null ? formatRupiah(payableAmount) : '-'}</span>
                    {isContractConfigured && hasRemainingAfterPayment && (
                      <span className="text-xs font-semibold text-slate-300 line-through">
                        Total: {formatRupiah(newTotalTagihan)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Keterangan Tagihan Baru Berbasis Detik */}
                {isContractConfigured ? (
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Dihitung otomatis dari{' '}
                    <strong className="text-white font-bold">
                      {totalSecondsAll.toLocaleString('id-ID')} detik
                    </strong>{' '}
                    panggilan WBP dengan tarif{' '}
                    <strong className="text-white font-bold">
                      {ratePerSec !== null ? `${formatRupiah(ratePerSec)}/detik` : '-'}
                    </strong>{' '}
                    dan{' '}
                    <strong className="text-white font-bold">
                      {saPercent !== null ? `${saPercent}% bagian SA` : '-'}
                    </strong>.
                  </p>
                ) : (
                  <p className="text-amber-200 text-xs sm:text-sm leading-relaxed flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Tarif kontrak belum diatur oleh Superadmin. Total tagihan belum dapat dihitung.</span>
                  </p>
                )}

                {/* Jatuh Tempo & Sisa Hari */}
                <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Jatuh Tempo: <strong>{formatTanggal(dueDate)}</strong>{' '}
                    <span className={isPastDue ? 'text-rose-400 font-bold' : remainingDays <= 3 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                      ({isPastDue ? 'Telah Terlewati' : remainingDays === 0 ? 'Hari ini' : `${remainingDays} hari lagi`})
                    </span>
                  </span>
                </div>
              </div>

              {/* Tombol Lihat Detail Perhitungan Tagihan */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(true)}
                  className="w-fit inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer active:scale-95 shadow-xs whitespace-nowrap shrink-0 group"
                >
                  <Calculator className="w-4 h-4 text-blue-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Lihat Detail Perhitungan Tagihan</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>
            </div>

            {/* Sisi Kanan (Kolom 5/12): Kartu Faktur & Aksi Pembayaran */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-0 space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>Faktur Pembayaran</span>
                  <span className="text-[10px] text-blue-300 font-normal">Sistem Pascabayar</span>
                </div>
                <div className="flex items-center justify-between bg-black/25 px-3 py-2 rounded-xl border border-white/10 text-xs font-mono mb-3">
                  <span className="text-slate-200 truncate">{invoiceNumber}</span>
                  <button
                    type="button"
                    onClick={handleCopyInvoice}
                    className="text-slate-400 hover:text-white transition p-1 cursor-pointer shrink-0 ml-2"
                    title="Salin nomor faktur"
                  >
                    {copiedInvoice ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Rincian Sisa Tagihan Jika Ada Pembayaran Sebagian */}
                {hasRemainingAfterPayment && (
                  <div className="mb-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Akumulasi:</span>
                      <span className="font-bold text-white">{formatRupiah(newTotalTagihan)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-300">
                      <span>Telah Di-ACC:</span>
                      <span className="font-bold">{formatRupiah(totalApproved)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-blue-400/20 text-white font-bold">
                      <span>Sisa Tagihan:</span>
                      <span className="text-amber-300">{formatRupiah(sisaTagihan)}</span>
                    </div>
                  </div>
                )}

                {/* Info Status Menunggu ACC (Hanya jika belum lunas) */}
                {!isPaid && isPendingAcc && (
                  <div className="mb-3 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-200 text-xs">
                    <div className="font-bold flex items-center gap-1.5 mb-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Menunggu ACC Superadmin</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Bukti pembayaran tagihan telah dikirim dan sedang menunggu konfirmasi verifikasi dari Superadmin.
                    </p>
                  </div>
                )}
              </div>

              {/* Aksi Pembayaran */}
              <div className="space-y-2.5">
                {!isMonthClosed && !isPaid && !isPendingAcc && (
                  <div className="p-3 bg-blue-500/15 border border-blue-400/30 rounded-2xl text-blue-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Periode Masih Berjalan (Akumulasi Detik)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                      Panggilan WBP terakumulasi otomatis hingga akhir bulan ({lastDayOfSelectedMonth} {monthOptions[selectedMonth - 1]?.label} {selectedYear}).
                    </p>
                  </div>
                )}

                {/* Tombol Bayar Tagihan (Hijau Aktif jika canPay) atau Tidak Ada Tagihan */}
                {!isContractConfigured ? (
                  <div className="text-center py-2.5 text-xs font-semibold text-amber-200 bg-amber-500/20 rounded-xl border border-amber-400/30 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span>Menunggu Penetapan Tarif</span>
                  </div>
                ) : !isPaid && !isPendingAcc && (
                  canPay ? (
                    <button
                      type="button"
                      onClick={() => setIsModalBayarOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/30 active:scale-95 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isRejected
                          ? 'Upload Ulang Bukti Bayar'
                          : hasRemainingAfterPayment
                          ? `Bayar Sisa Tagihan (${formatRupiah(payableAmount)})`
                          : `Bayar Tagihan (${formatRupiah(payableAmount)})`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="text-center py-2.5 text-xs font-semibold text-slate-300 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      <span>Tidak Ada Tagihan (Rp 0)</span>
                    </div>
                  )
                )}

                {isPendingAcc && (
                  <div className="text-center py-2.5 text-xs font-bold text-amber-300 bg-amber-500/20 rounded-xl border border-amber-400/30 flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Menunggu ACC Superadmin</span>
                  </div>
                )}

                {isPaid && (
                  <div className="text-center py-2.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 rounded-xl border border-emerald-400/30 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Tagihan Telah Lunas</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Info Accordion Alur Pembayaran Pascabayar */}
      <div className="no-print bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 transition-all">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Bagaimana Cara Kerja Sistem Tagihan Detik Pascabayar Kantin?</span>
          </div>
          <span className="text-xs text-blue-700 font-semibold underline shrink-0">
            {showGuide ? 'Sembunyikan' : 'Pelajari Selengkapnya'}
          </span>
        </button>

        {showGuide && (
          <div className="mt-4 pt-3 border-t border-blue-200/60 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-600 animate-in fade-in duration-200">
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">1. Panggilan WBP</span>
              <span>WBP melakukan panggilan telepon/video. Durasi panggilan dihitung otomatis dalam satuan detik riil.</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">2. Kontrak Superadmin</span>
              <span>Tarif per detik dan persen bagian SA diatur terpusat oleh Superadmin di tab Pengaturan Kontrak.</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">3. Rumus Tagihan</span>
              <span>Total Tagihan = Total Detik × Tarif per Detik × % Bagian SA. Dihitung 1 kali per bulan per kantin.</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">4. Pembayaran & ACC</span>
              <span>Kantin membayar via QRIS/Transfer, mengunggah bukti bayar, diverifikasi Superadmin, dan bebas berjualan.</span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          TABEL KONTEN UTAMA:
          TAB 1: "Rincian Panggilan" (Ganti nama dari "Voucher Penjualan", status dihapus)
          TAB 2: "Riwayat Pembayaran" (1 baris per bulan/pembayaran)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rincian Panggilan ({callsData.totalItems})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Pembayaran ({paymentHistory.length})
            </button>
          </div>

          {activeTab === 'calls' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, nama WBP, atau identitas..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}
        </div>

        {/* =======================================================================
            TAB 1: RINCIAN PANGGILAN
            HANYA riwayat panggilan WBP, terhubung ke GET /api/canteen/billing/calls
            Kolom: No Transaksi, Waktu, Kode Voucher, WBP (Penerima), Paket/Layanan,
            Petugas Kasir, Durasi (detik), Nominal Tagihan.
            Baris Total di bawah tabel menggunakan totalSeconds dan totalTagihan respons.
            ======================================================================= */}
        {activeTab === 'calls' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">No Transaksi</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Kode Voucher</th>
                    <th className="py-3 px-4">WBP (Penerima)</th>
                    <th className="py-3 px-4">Paket / Layanan</th>
                    <th className="py-3 px-4">Petugas Kasir</th>
                    <th className="py-3 px-4 text-right">Durasi (Detik)</th>
                    <th className="py-3 px-4 text-right">Nominal Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingCalls ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mx-auto mb-2" />
                        <span>Memuat rincian panggilan...</span>
                      </td>
                    </tr>
                  ) : callsData.items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Ticket className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                        <p className="font-bold text-slate-700">Tidak ada riwayat panggilan pada periode ini</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Belum ada panggilan WBP yang tercatat di sistem'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    callsData.items.map((call) => {
                      const durSec = Number(call.durationSeconds || 0);

                      return (
                        <tr key={call.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{call.id}</td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(call.createdAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/80 inline-flex items-center gap-1">
                              <Ticket className="w-3 h-3 text-blue-500" />
                              {call.id.slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(call.inmateName || 'W').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 leading-tight">
                                  {call.inmateName || 'WBP'}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  NIP: {call.inmateIdentifier || '-'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Phone className="w-3 h-3" />
                              </span>
                              <div>
                                <div className="font-semibold text-slate-800">Panggilan Wartelsus</div>
                                <div className="text-[10px] text-slate-500">{Math.round(durSec / 60) || 1} Menit</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">Operator Sistem</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                            {durSec.toLocaleString('id-ID')} Detik
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                            {isContractConfigured && call.nominal !== undefined && call.nominal !== null ? (
                              formatRupiah(call.nominal)
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-slate-400 font-bold text-sm leading-tight">-</span>
                                <span className="text-[10px] text-amber-600 font-medium">Menunggu tarif</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Baris Total di Bawah Tabel */}
                {callsData.items.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                      <td colSpan="6" className="py-3.5 px-4 text-slate-700">
                        Total Akumulasi Periode {monthOptions[selectedMonth - 1]?.label} {selectedYear}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-900 font-black whitespace-nowrap">
                        {Number(callsData.totalSeconds || 0).toLocaleString('id-ID')} Detik
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#1565C0] font-black text-sm whitespace-nowrap">
                        {isContractConfigured && callsData.totalTagihan !== undefined && callsData.totalTagihan !== null
                          ? formatRupiah(callsData.totalTagihan)
                          : '-'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Kontrol Paginasi */}
            {(callsData.pagination?.totalPages || 1) > 1 && (
              <div className="p-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                  {Math.min(currentPage * PAGE_SIZE, callsData.totalItems)} dari{' '}
                  {callsData.totalItems} panggilan
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-800 px-2">
                    {currentPage} / {callsData.pagination?.totalPages || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(callsData.pagination?.totalPages || 1, p + 1))}
                    disabled={currentPage >= (callsData.pagination?.totalPages || 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            TAB 2: RIWAYAT PEMBAYARAN
            Satu baris per bulan: periode, nomor faktur, nominal, metode,
            tanggal upload, status ACC, lihat bukti.
            ======================================================================= */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Nomor Faktur</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Tanggal Upload</th>
                  <th className="py-3 px-4 text-center">Status ACC</th>
                  <th className="py-3 px-4 text-center">Bukti Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!isContractConfigured ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="font-bold text-slate-700 text-xs sm:text-sm">Belum Ada Tagihan untuk Dibayarkan</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        Kontrak tarif belum diatur oleh Superadmin. Riwayat pembayaran akan tercatat di sini setelah kontrak tarif aktif dan pembayaran dilakukan.
                      </p>
                    </td>
                  </tr>
                ) : paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <Receipt className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                      <p className="font-bold text-slate-700">Belum ada riwayat pembayaran tagihan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Riwayat pengajuan pembayaran via QRIS atau Transfer Bank akan tampil di sini
                      </p>
                    </td>
                  </tr>
                ) : (
                  paymentHistory.map((p) => {
                    // Periode format
                    let periodLabel = '-';
                    if (p.billingMonth && p.billingYear) {
                      const mLabel = monthOptions.find((m) => m.value === Number(p.billingMonth))?.label;
                      periodLabel = `${mLabel || p.billingMonth} ${p.billingYear}`;
                    } else if (p.createdAt || p.submittedAt) {
                      const d = new Date(p.createdAt || p.submittedAt);
                      const mLabel = monthOptions.find((m) => m.value === d.getMonth() + 1)?.label;
                      periodLabel = `${mLabel} ${d.getFullYear()}`;
                    }

                    // Nomor Faktur
                    const invoiceNum =
                      p.invoiceNumber ||
                      (p.billingYear && p.billingMonth
                        ? `INV-${p.billingYear}${String(p.billingMonth).padStart(2, '0')}-KTN`
                        : `INV-${p.id || 'KTN'}`);

                    const isApproved = p.status === 'APPROVED' || p.status === 'Berhasil';
                    const isPending = p.status === 'PENDING' || p.status === 'Menunggu';
                    const isReject = p.status === 'REJECTED' || p.status === 'Ditolak';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                          {periodLabel}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {invoiceNum}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                          {formatRupiah(p.nominal || p.totalBayar || 0)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                          {p.bankTarget || 'Transfer Bank'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatTanggal(p.createdAt || p.submittedAt || p.tanggal)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                            {isReject && <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>
                              {isApproved
                                ? 'Disetujui (Lunas)'
                                : isPending
                                ? 'Menunggu ACC'
                                : 'Ditolak'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {p.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProofItem(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Bukti</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL DETAIL RINCIAN PERHITUNGAN TAGIHAN (READ-ONLY)
          Rincian: Total detik, tarif per detik, subtotal (detik x tarif),
          persen SA, dan total tagihan.
          ========================================================================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Rincian Perhitungan Tagihan Kantin
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode {monthOptions[selectedMonth - 1]?.label} {selectedYear} • {canteenBilling?.uptName || 'Kantin Lapas'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Rumus Penjelasan */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-950">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-blue-900">
                  <Coins className="w-4 h-4 text-blue-600" />
                  Rumus: Total Detik × Tarif per Detik × Persen Bagian SA
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Durasi detik panggilan terakumulasi otomatis dari rekaman panggilan WBP. Tarif per detik dan persen bagian SA ditentukan oleh Superadmin di tab Pengaturan Kontrak.
                </p>
              </div>

              {/* Tabel Rincian Angka */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200/70 text-xs">
                <div className="pb-2.5 flex justify-between">
                  <span className="text-slate-500">1. Total Detik Panggilan (Otomatis):</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {totalSecondsAll.toLocaleString('id-ID')} Detik
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      ({formatDetikKeMenit(totalSecondsAll)})
                    </span>
                  </div>
                </div>

                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">2. Tarif per Detik (Kontrak Superadmin):</span>
                  <span className="font-bold text-slate-900">
                    {isContractConfigured && ratePerSec !== null ? `${formatRupiah(ratePerSec)} / detik` : 'Belum diatur'}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">3. Subtotal (1 × 2):</span>
                  <span className="font-bold text-slate-900">
                    {isContractConfigured && subtotalTagihan !== null ? formatRupiah(subtotalTagihan) : '-'}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">4. Bagian Superadmin (SA):</span>
                  <div className="text-right">
                    <span className="font-bold text-blue-700 block">
                      {isContractConfigured && saPercent !== null ? `${saPercent}%` : 'Belum diatur'}
                    </span>
                    {isContractConfigured && saPercent !== null && (
                      <span className="text-[11px] text-slate-500 font-normal block">
                        Hak Kantin: {100 - saPercent}% ({formatRupiah(canteenBilling?.canteenShare || Math.round((subtotalTagihan || 0) * ((100 - saPercent) / 100)))})
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-black text-slate-900 block">Total Tagihan Bulan Ini:</span>
                    <span className="text-[11px] text-slate-400 font-normal">Disetor ke Superadmin (Subtotal × % SA)</span>
                  </div>
                  <span className="font-black text-[#1565C0] text-base">
                    {isContractConfigured && newTotalTagihan !== null ? formatRupiah(newTotalTagihan) : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL PEMBAYARAN TAGIHAN (QRIS / TRANSFER BANK + UPLOAD BUKTI)
          ========================================================================= */}
      <ModalPembayaranTagihan
        isOpen={isModalBayarOpen}
        onClose={() => setIsModalBayarOpen(false)}
        billingData={modalBillingPayload}
        remainingAmount={payableAmount}
        totalApproved={totalApproved}
        onSuccess={handlePaymentSuccess}
      />

      {/* =========================================================================
          MODAL PREVIEW BUKTI PEMBAYARAN (GAMBAR / PDF)
          ========================================================================= */}
      {previewProofItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Bukti Pembayaran Tagihan</h4>
                <p className="text-[11px] text-slate-400">
                  {previewProofItem.bankTarget || 'Transfer'} • {formatRupiah(previewProofItem.nominal || previewProofItem.totalBayar || 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProofItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center justify-center min-h-[240px]">
              {previewProofItem.proofUrl ? (
                previewProofItem.proofUrl.toLowerCase().includes('.pdf') ? (
                  <div className="text-center p-6 space-y-3">
                    <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Dokumen Bukti Transfer PDF</p>
                      <p className="text-[11px] text-slate-400">Berkas dalam format dokumen PDF</p>
                    </div>
                    <a
                      href={
                        previewProofItem.proofUrl.startsWith('http') || previewProofItem.proofUrl.startsWith('data:')
                          ? previewProofItem.proofUrl
                          : `${(API_BASE_URL || '').replace(/\/+$/, '')}/${previewProofItem.proofUrl.replace(/^\/+/, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Dokumen PDF</span>
                    </a>
                  </div>
                ) : (
                  <img
                    src={
                      previewProofItem.proofUrl.startsWith('http') || previewProofItem.proofUrl.startsWith('data:')
                        ? previewProofItem.proofUrl
                        : `${(API_BASE_URL || '').replace(/\/+$/, '')}/${previewProofItem.proofUrl.replace(/^\/+/, '')}`
                    }
                    alt="Bukti Transfer"
                    className="max-h-80 max-w-full rounded-xl object-contain shadow-xs"
                  />
                )
              ) : (
                <span className="text-xs text-slate-400">Bukti transfer tidak tersedia</span>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewProofItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
