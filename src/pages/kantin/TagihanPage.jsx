import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Wallet, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  Zap,
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
  ChevronRight,
  HelpCircle,
  Receipt,
  Eye,
  X
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatKantin';
import { 
  getMonthlyBilling, 
  getPaymentHistory, 
  determineBillingStatus 
} from '../../services/kantin/tagihanService';
import ModalPembayaranTagihan from '../../components/kantin/ModalPembayaranTagihan';
import { API_BASE_URL } from '../../services/api';

export default function TagihanPage() {
  const [billingData, setBillingData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('vouchers'); // 'vouchers' | 'payments'
  const [previewProofItem, setPreviewProofItem] = useState(null);

  // Modal Pembayaran Tagihan State
  const [isModalBayarOpen, setIsModalBayarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchBillingAndPayments = useCallback(async (month, year) => {
    setIsLoading(true);
    try {
      const [billingRes, paymentsRes] = await Promise.allSettled([
        getMonthlyBilling(month, year),
        getPaymentHistory(),
      ]);

      if (billingRes.status === 'fulfilled') {
        setBillingData(billingRes.value);
      }
      if (paymentsRes.status === 'fulfilled') {
        setPaymentHistory(Array.isArray(paymentsRes.value) ? paymentsRes.value : []);
      }
    } catch (err) {
      console.error('Gagal memuat rekapitulasi tagihan bulanan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingAndPayments(selectedMonth, selectedYear);

    const handleUpdate = () => {
      fetchBillingAndPayments(selectedMonth, selectedYear);
    };

    window.addEventListener('pascall_billing_updated', handleUpdate);
    window.addEventListener('canteen_topup_changed', handleUpdate);

    return () => {
      window.removeEventListener('pascall_billing_updated', handleUpdate);
      window.removeEventListener('canteen_topup_changed', handleUpdate);
    };
  }, [fetchBillingAndPayments, selectedMonth, selectedYear]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoice = () => {
    if (billingData?.invoiceNumber) {
      navigator.clipboard.writeText(billingData.invoiceNumber);
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    }
  };

  const handlePaymentSuccess = () => {
    setToastMessage('Bukti pembayaran tagihan berhasil dikirim ke Superadmin untuk diverifikasi.');
    fetchBillingAndPayments(selectedMonth, selectedYear);
    setTimeout(() => {
      setToastMessage('');
    }, 6000);
  };

  // Evaluasi status tagihan riil dari server
  const billingStatusInfo = determineBillingStatus(billingData, paymentHistory);
  const totalAmount = Number(billingData?.summary?.totalAmount || 0);
  const totalApproved = billingStatusInfo.totalApproved || 0;
  const pendingPayment = (billingStatusInfo.paymentItem && billingStatusInfo.status === 'PENDING')
    ? billingStatusInfo.paymentItem
    : paymentHistory.find((p) => p && (p.status === 'PENDING' || p.status === 'Menunggu'));
  const pendingAmount = pendingPayment ? Number(pendingPayment.nominal || pendingPayment.totalBayar || 0) : 0;
  const remainingAmount = billingStatusInfo.remainingAmount !== undefined ? billingStatusInfo.remainingAmount : Math.max(0, totalAmount - totalApproved);
  const canPay = billingStatusInfo.canPay && (remainingAmount > 0 || totalAmount > 0);

  // Status mapping per voucher (FIFO Matching terhadap pembayaran yang telah disetujui / pending)
  const voucherStatusMap = useMemo(() => {
    const list = billingData?.transactions || [];
    const sorted = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let cum = 0;
    const map = {};
    for (const t of sorted) {
      cum += Number(t.totalAmount || 0);
      if (cum <= totalApproved) {
        map[t.id] = { status: 'LUNAS', label: 'Lunas' };
      } else if (cum <= totalApproved + pendingAmount) {
        map[t.id] = { status: 'PENDING', label: 'Menunggu ACC' };
      } else {
        map[t.id] = { status: 'UNPAID', label: 'Belum Dibayar' };
      }
    }
    return map;
  }, [billingData?.transactions, totalApproved, pendingAmount]);

  // Filter transaksi berdasarkan pencarian
  const transactions = billingData?.transactions || [];
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
          .print-header {
            display: block !important;
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
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tagihan & Penggunaan Bulanan
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Rekapitulasi penjualan voucher menit bicara WBP. Tagihan diakumulasikan otomatis dan jatuh tempo pada awal bulan berikutnya.
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

      {/* Banner Ringkasan Eksekutif Tagihan Pascabayar */}
      <div className="mb-6 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-blue-950/20 relative overflow-hidden border border-slate-800">
        {/* Latar belakang aksen watermark halus */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
          <Zap className="w-56 h-56 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Sisi Kiri: Penjelasan Operasional yang Ringkas & Jelas */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <Zap className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Operasional Pascabayar (Unlimited Pool)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Kantin Bebas Menjual Voucher Tanpa Kuota Awal
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Kantin tidak perlu membeli deposit token prabayar terlebih dahulu. Seluruh voucher panggilan langsung aktif untuk WBP, dan rekapitulasi pembayaran dihitung otomatis setiap tanggal 1.
            </p>

            {/* Micro Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Check className="w-3 h-3 text-emerald-400" /> Kuota Bicara Bebas
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Check className="w-3 h-3 text-emerald-400" /> Tagihan Tiap Awal Bulan
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Check className="w-3 h-3 text-emerald-400" /> Audit Trail Otomatis
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Kartu Status Invoice & Tombol Aksi Pembayaran */}
          {/* Sisi Kanan: Kartu Status Invoice & Tombol Aksi Pembayaran */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex flex-col justify-between shrink-0 min-w-full sm:min-w-[260px] lg:min-w-[280px] shadow-inner">
            <div>
              <div className="flex items-center justify-between text-xs text-blue-200 font-bold mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-300">Status Tagihan</span>
                <span className="text-[11px] text-slate-300">{billingData?.period || '-'}</span>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                {billingStatusInfo.status === 'LUNAS' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lunas Terverifikasi</span>
                  </div>
                )}
                {billingStatusInfo.status === 'PENDING' && (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Menunggu Konfirmasi</span>
                    </div>
                    <div className="text-[11px] text-amber-200 font-bold mt-1">
                      Transfer Masuk: {formatRupiah(pendingAmount)}
                    </div>
                    {totalApproved > 0 && (
                      <div className="text-[10px] text-emerald-300 font-medium mt-0.5">
                        ✓ Lunas sebelumnya: {formatRupiah(totalApproved)}
                      </div>
                    )}
                  </div>
                )}
                {billingStatusInfo.status === 'REJECTED' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-400/40">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pembayaran Ditolak</span>
                  </div>
                )}
                {billingStatusInfo.status === 'UNPAID' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Belum Dibayar</span>
                  </div>
                )}
                {billingStatusInfo.status === 'BERJALAN' && (
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                      </span>
                      <span>{totalApproved > 0 ? 'Sebagian Lunas' : 'Bulan Berjalan'}</span>
                    </div>
                    {totalApproved > 0 && (
                      <div className="text-[10px] text-emerald-300 font-medium mt-1">
                        ✓ Lunas: {formatRupiah(totalApproved)} • Sisa: {formatRupiah(remainingAmount)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* No Invoice dengan Fitur Salin */}
              <div className="flex items-center justify-between bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
                <span className="text-slate-300 truncate">{billingData?.invoiceNumber || '-'}</span>
                {billingData?.invoiceNumber && (
                  <button
                    type="button"
                    onClick={handleCopyInvoice}
                    className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
                    title="Salin nomor invoice"
                  >
                    {copiedInvoice ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Button jika Bisa Bayar */}
            {canPay && (
              <button
                type="button"
                onClick={() => setIsModalBayarOpen(true)}
                className="mt-3.5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-900/30 active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{totalApproved > 0 ? `Bayar Sisa Tagihan (${formatRupiah(remainingAmount)})` : 'Bayar Tagihan Sekarang'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Alert Khusus Jika Pembayaran Ditolak */}
        {billingStatusInfo.status === 'REJECTED' && (
          <div className="relative z-10 mt-5 p-3.5 bg-rose-500/25 border border-rose-400/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-100 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
              <span>
                <strong>Pembayaran Ditolak:</strong> {billingStatusInfo.rejectReason} Silakan unggah ulang bukti transfer yang sah.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalBayarOpen(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-800 font-bold rounded-xl transition shrink-0 cursor-pointer shadow-xs"
            >
              Unggah Ulang Bukti
            </button>
          </div>
        )}
      </div>

      {/* 4 Kartu Metrik Ringkasan Finansial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Kartu 1: Total Voucher Terjual */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Voucher Terjual
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? '...' : (billingData?.summary?.totalTransactions || 0)}
              </span>
              <span className="text-xs font-bold text-slate-400">Voucher</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Periode {billingData?.period || '-'}</span>
          </div>
        </div>

        {/* Kartu 2: Durasi Terjual */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Durasi Terjual
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isLoading ? '...' : (billingData?.summary?.totalMinutes || 0)}
              </span>
              <span className="text-xs font-bold text-slate-400">Menit</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">Total kuota menit bicara aktif</span>
          </div>
        </div>

        {/* Kartu 3: DPP (Dasar Pengenaan Pajak) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                DPP (Dasar Pengenaan)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isLoading ? '...' : formatRupiah(billingData?.summary?.totalDpp || 0)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
            <span>PPN (11%):</span>
            <span className="font-bold text-slate-700">
              {isLoading ? '...' : formatRupiah(billingData?.summary?.totalPpn || 0)}
            </span>
          </div>
        </div>

        {/* Kartu 4: Total Tagihan / Sisa Kewajiban Tagihan (Highlight Utama) */}
        <div 
          onClick={canPay ? () => setIsModalBayarOpen(true) : undefined}
          className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
            canPay
              ? 'border-blue-300 ring-2 ring-blue-500/10 hover:shadow-md hover:border-blue-400 cursor-pointer group'
              : 'border-slate-200/80'
          }`}
        >
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {totalApproved > 0
                  ? (pendingAmount > 0 ? 'Tagihan Menunggu Verifikasi' : 'Sisa Tagihan Belum Dibayar')
                  : 'Total Tagihan Bulan Ini'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
              {isLoading ? '...' : formatRupiah(
                totalApproved > 0
                  ? (pendingAmount > 0 ? pendingAmount : remainingAmount)
                  : totalAmount
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] flex-wrap gap-1">
            {totalApproved > 0 ? (
              <span className="text-slate-500 font-medium text-[10.5px]">
                Omset: <strong className="text-slate-700">{formatRupiah(totalAmount)}</strong> • Lunas: <strong className="text-emerald-600">{formatRupiah(totalApproved)}</strong>
              </span>
            ) : (
              <span className="text-slate-500 font-medium">Termasuk PPN 11%</span>
            )}

            {/* Action text or status badge */}
            {billingStatusInfo.status === 'LUNAS' && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lunas
              </span>
            )}
            {billingStatusInfo.status === 'PENDING' && (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" /> Menunggu verifikasi
              </span>
            )}
            {billingStatusInfo.status === 'REJECTED' && (
              <span className="text-rose-700 font-bold group-hover:underline flex items-center gap-0.5">
                Ditolak • Bayar lagi
              </span>
            )}
            {(billingStatusInfo.status === 'UNPAID' || billingStatusInfo.status === 'BERJALAN') && canPay && (
              <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                {totalApproved > 0 ? 'Bayar Sisa →' : 'Bayar Sekarang →'}
              </span>
            )}
            {(billingStatusInfo.status === 'UNPAID' || billingStatusInfo.status === 'BERJALAN') && !canPay && (
              <span className="text-slate-400 font-semibold text-[10px]">
                Nihil Tagihan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Accordion / Panduan Ringkas Alur Pascabayar */}
      <div className="no-print mb-6 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 transition-all">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Bagaimana Cara Kerja Sistem Pascabayar PasCall Kantin?</span>
          </div>
          <span className="text-xs text-blue-700 font-semibold underline shrink-0">
            {showGuide ? 'Sembunyikan' : 'Pelajari Selengkapnya'}
          </span>
        </button>

        {showGuide && (
          <div className="mt-4 pt-3 border-t border-blue-200/60 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-600 animate-in fade-in duration-200">
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">1. Penjualan Voucher</span>
              <span>Kasir langsung mencetak voucher tanpa saldo menit prabayar. Menit langsung tersedia untuk WBP.</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">2. Panggilan Bilik</span>
              <span>WBP menebus voucher di bilik wartel lapas untuk melakukan panggilan suara atau video.</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">3. Rekapitulasi Otomatis</span>
              <span>Total durasi menit yang terjual otomatis dihitung DPP & PPN menjadi faktur tagihan bulanan.</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
              <span className="font-extrabold text-blue-700 block mb-1">4. Pelunasan Faktur</span>
              <span>Kantin menyetorkan pembayaran via transfer/QRIS, diverifikasi oleh Superadmin setiap awal bulan.</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Rincian Transaksi & Riwayat Pembayaran */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                {activeTab === 'vouchers' ? 'Rincian Penjualan Voucher Masuk Tagihan' : 'Riwayat Pembayaran Tagihan ke Superadmin'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {billingData?.period || 'Bulan Ini'}
              </span>
            </div>

            {/* Tab Switcher Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('vouchers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'vouchers'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Voucher Terjual ({transactions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Riwayat Setor ke Superadmin ({paymentHistory.length})</span>
                {pendingAmount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Search Box & Refresh (Hanya aktif untuk tab voucher) */}
          <div className="no-print flex items-center gap-2.5">
            {activeTab === 'vouchers' && (
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode, WBP, atau paket..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => fetchBillingAndPayments(selectedMonth, selectedYear)}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Perbarui data tagihan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* TAB 1: DAFTAR TRANSAKSI VOUCHER */}
        {activeTab === 'vouchers' && (
          <>
            {isLoading ? (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-slate-500 text-xs font-medium">Memuat data transaksi tagihan...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Ticket className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">
                  {searchQuery ? 'Tidak Ada Hasil Transaksi' : 'Belum Ada Transaksi Penjualan'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery 
                    ? `Tidak ditemukan transaksi dengan kata kunci "${searchQuery}". Coba kata kunci lainnya.`
                    : `Belum ada voucher yang diterbitkan pada periode ${billingData?.period || 'bulan ini'}. Penjualan baru akan langsung terakumulasi di sini.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">No Transaksi</th>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Kode Voucher</th>
                      <th className="py-3 px-4">WBP (Penerima)</th>
                      <th className="py-3 px-4">Paket / Layanan</th>
                      <th className="py-3 px-4">Petugas Kasir</th>
                      <th className="py-3 px-4 text-center">Status Tagihan</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((t) => {
                      const isVideo = String(t.package?.name || '').toLowerCase().includes('video');
                      const vStatus = voucherStatusMap[t.id];
                      return (
                        <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {t.id}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/80 inline-flex items-center gap-1">
                              <Ticket className="w-3 h-3 text-blue-500" />
                              {t.kodeVoucher}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(t.inmate?.name || 'W').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 leading-tight">
                                  {t.inmate?.name || 'WBP Tanpa Nama'}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  NIP: {t.inmate?.identifier || '-'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {isVideo ? (
                                <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0" title="Video Call">
                                  <Video className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" title="Panggilan Suara">
                                  <Phone className="w-3 h-3" />
                                </span>
                              )}
                              <div>
                                <div className="font-semibold text-slate-800">{t.package?.name}</div>
                                <div className="text-[10px] text-slate-500">{t.package?.duration} Menit</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">{t.cashier?.name || t.cashier?.identifier || 'Kasir'}</span>
                            </div>
                          </td>
                          {/* Status Tagihan Voucher */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {vStatus?.status === 'LUNAS' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Lunas (Terbayar)</span>
                              </span>
                            ) : vStatus?.status === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Menunggu ACC</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                                <span>Belum Dibayar</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                            {formatRupiah(Number(t.totalAmount || 0))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Ringkasan Tabel Voucher */}
            {!isLoading && filteredTransactions.length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Menampilkan <strong>{filteredTransactions.length}</strong> dari <strong>{transactions.length}</strong> transaksi voucher
                </span>
                <div className="flex items-center gap-3 font-medium text-slate-700 flex-wrap">
                  {totalApproved > 0 && (
                    <span>Telah Lunas: <strong className="text-emerald-700 font-mono ml-1">{formatRupiah(totalApproved)}</strong></span>
                  )}
                  {pendingAmount > 0 && (
                    <span>Menunggu ACC: <strong className="text-amber-700 font-mono ml-1">{formatRupiah(pendingAmount)}</strong></span>
                  )}
                  <span>Total Omset: <strong className="text-blue-700 font-mono text-sm ml-1">{formatRupiah(totalAmount)}</strong></span>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: RIWAYAT PEMBAYARAN KE SUPERADMIN */}
        {activeTab === 'payments' && (
          <div>
            {paymentHistory.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Riwayat Pembayaran</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Setiap pembayaran tagihan yang kasir ajukan ke Superadmin beserta bukti transfer akan tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">ID Transaksi Setor</th>
                      <th className="py-3 px-4">Waktu Setor</th>
                      <th className="py-3 px-4">Metode Bayar</th>
                      <th className="py-3 px-4 text-right">Nominal Setor</th>
                      <th className="py-3 px-4 text-center">Bukti Transfer</th>
                      <th className="py-3 px-4 text-center">Status Verifikasi</th>
                      <th className="py-3 px-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentHistory.map((p) => {
                      const isApproved = p.status === 'APPROVED' || p.status === 'Berhasil';
                      const isPending = p.status === 'PENDING' || p.status === 'Menunggu';
                      const isRejected = p.status === 'REJECTED' || p.status === 'Ditolak';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {p.id}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {p.createdAt || p.tanggal ? new Date(p.createdAt || p.tanggal).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                            {p.bankTarget || 'Transfer VA'}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[#1565C0] font-mono whitespace-nowrap text-sm">
                            {formatRupiah(Number(p.nominal || p.totalBayar || 0))}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {p.proofUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewProofItem(p)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-lg text-xs font-bold transition border border-blue-200/80 cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Bukti</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Disetujui (Lunas)</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Menunggu ACC</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Ditolak</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">
                            {p.rejectReason || (isApproved ? 'Pembayaran tagihan telah diverifikasi Superadmin' : 'Menunggu verifikasi Superadmin')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Ringkasan Riwayat Pembayaran */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <span>Total <strong>{paymentHistory.length}</strong> setoran pembayaran tercatat</span>
              <div className="font-semibold text-slate-700">
                Total Telah Disetujui: <strong className="text-emerald-700 font-mono ml-1">{formatRupiah(totalApproved)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PREVIEW BUKTI TRANSFER UNTUK KASIR KANTIN */}
      {previewProofItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Bukti Transfer Pembayaran Tagihan</h4>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{previewProofItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProofItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-900/5">
              {previewProofItem.proofUrl ? (
                <img
                  src={
                    previewProofItem.proofUrl.startsWith('http') || previewProofItem.proofUrl.startsWith('data:')
                      ? previewProofItem.proofUrl
                      : `${(API_BASE_URL || '').replace(/\/+$/, '')}/${previewProofItem.proofUrl.replace(/^\/+/, '')}`
                  }
                  alt="Bukti Transfer"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain border border-slate-200 shadow-md bg-white"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x500/e2e8f0/64748b?text=Bukti+Transfer+Digital';
                  }}
                />
              ) : (
                <div className="py-12 text-center text-slate-400">Tidak ada gambar bukti</div>
              )}
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 w-full text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Transfer:</span>
                  <strong className="text-blue-700 font-mono text-sm">{formatRupiah(Number(previewProofItem.nominal || previewProofItem.totalBayar || 0))}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode:</span>
                  <span className="font-semibold text-slate-700">{previewProofItem.bankTarget || 'Transfer'}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPreviewProofItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop Up Pembayaran Tagihan Modal */}
      {isModalBayarOpen && billingData && (
        <ModalPembayaranTagihan
          isOpen={isModalBayarOpen}
          onClose={() => setIsModalBayarOpen(false)}
          billingData={billingData}
          remainingAmount={billingStatusInfo.remainingAmount}
          totalApproved={billingStatusInfo.totalApproved}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
