import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  X,
  Building2,
  Check,
  AlertCircle,
  Inbox,
  CheckCircle,
  Eye,
  FileText,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../utils/formatKantin';
import {
  PPN_RATE,
  getTopupSummary,
  getSuperadminTopupHistory,
  approveTopupTransaction,
  rejectTopupTransaction,
  getAllCanteenBillingReport,
} from '../services/canteenTopupService';
import { getBranches } from '../services/branchService';
import { API_BASE_URL } from '../services/api';

export default function CanteenTopup() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Tab Aktif
  const [activeTab, setActiveTab] = useState('laporan'); // 'laporan' | 'konfirmasi' | 'riwayat'

  // 2. Filter Periode Tagihan
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 3. Data Laporan Tagihan Seluruh UPT
  const [billingReports, setBillingReports] = useState([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [searchUpt, setSearchUpt] = useState('');
  const [statusTagihanFilter, setStatusTagihanFilter] = useState('semua');

  // 4. Data Permintaan Masuk & Riwayat Pembayaran Tagihan
  const [allHistory, setAllHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchHistory, setSearchHistory] = useState('');
  const [statusHistoryFilter, setStatusHistoryFilter] = useState('semua');
  const [branchOptions, setBranchOptions] = useState([]);

  // 5. Modal State
  const [topupActionModal, setTopupActionModal] = useState(null); // { action: 'approve' | 'reject', item: object }
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [selectedUptDetail, setSelectedUptDetail] = useState(null); // Modal Rincian Voucher UPT
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [proofPreviewItem, setProofPreviewItem] = useState(null);
  const [proofImageFailed, setProofImageFailed] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Semua Data
  const loadData = async () => {
    setIsLoadingBilling(true);
    setIsLoadingHistory(true);
    try {
      const [reports, historyData, branchesRes] = await Promise.all([
        getAllCanteenBillingReport(selectedMonth, selectedYear),
        getSuperadminTopupHistory({ search: '', status: 'semua', branchId: 'semua' }),
        getBranches({ limit: 100 }).catch(() => ({ items: [] })),
      ]);
      setBillingReports(reports || []);
      setAllHistory(historyData || []);
      const bList = Array.isArray(branchesRes?.items) ? branchesRes.items : (Array.isArray(branchesRes) ? branchesRes : []);
      setBranchOptions(bList);
    } catch (err) {
      console.error('Gagal memuat data tagihan:', err);
    } finally {
      setIsLoadingBilling(false);
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();

    // Event listener realtime saat kasir kantin submit bukti bayar atau ada transaksi baru
    let debounceTimer = null;
    const handleRealtimeUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 400);
    };

    window.addEventListener('canteen_topup_changed', handleRealtimeUpdate);
    window.addEventListener('pascall_billing_updated', handleRealtimeUpdate);
    window.addEventListener('pascall_packages_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('canteen_topup_changed', handleRealtimeUpdate);
      window.removeEventListener('pascall_billing_updated', handleRealtimeUpdate);
      window.removeEventListener('pascall_packages_updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
    };
  }, [selectedMonth, selectedYear]);

  // Permintaan Pembayaran yang butuh persetujuan (Status: PENDING)
  const pendingRequests = allHistory.filter(
    (item) => item.status === 'PENDING' || item.status === 'Menunggu'
  );

  // Riwayat Pembayaran Tagihan Selesai
  const processedHistory = allHistory
    .filter((item) => item.status !== 'PENDING' && item.status !== 'Menunggu')
    .filter((item) => {
      if (statusHistoryFilter !== 'semua') {
        const itemStatusNorm = (item.status === 'APPROVED' ? 'berhasil' : item.status === 'REJECTED' ? 'ditolak' : item.status).toLowerCase();
        if (itemStatusNorm !== statusHistoryFilter.toLowerCase()) return false;
      }
      if (searchHistory.trim() !== '') {
        const q = searchHistory.toLowerCase();
        const matchId = item.id?.toLowerCase().includes(q);
        const matchBranch = item.branchName?.toLowerCase().includes(q);
        const matchStaff = item.staffName?.toLowerCase().includes(q);
        if (!matchId && !matchBranch && !matchStaff) return false;
      }
      return true;
    });

  // Filter Laporan Tagihan UPT
  const filteredBillingReports = billingReports.filter((report) => {
    if (statusTagihanFilter !== 'semua') {
      if (statusTagihanFilter === 'LUNAS' && report.billingStatus !== 'LUNAS') return false;
      if (statusTagihanFilter === 'PENDING' && report.billingStatus !== 'PENDING') return false;
      if (statusTagihanFilter === 'DIBLOKIR' && !report.isBlocked) return false;
      if (statusTagihanFilter === 'BERJALAN' && report.billingStatus !== 'BERJALAN') return false;
    }
    if (searchUpt.trim() !== '') {
      const q = searchUpt.toLowerCase();
      const matchName = report.branchName?.toLowerCase().includes(q);
      const matchKanwil = report.kanwilName?.toLowerCase().includes(q);
      const matchCode = report.branchCode?.toLowerCase().includes(q);
      if (!matchName && !matchKanwil && !matchCode) return false;
    }
    return true;
  });

  // Kalkulasi Statistik Real-Time
  const totalTagihanBulanIni = billingReports.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
  const totalMenitBulanIni = billingReports.reduce((acc, r) => acc + (Number(r.totalMinutes) || 0), 0);
  const totalVoucherBulanIni = billingReports.reduce((acc, r) => acc + (Number(r.totalVouchers) || 0), 0);
  const totalTagihanLunas = allHistory
    .filter((h) => h.status === 'APPROVED')
    .reduce((acc, h) => acc + (Number(h.totalBayar || h.nominal) || 0), 0);

  // Handlers Approve & Reject
  const handleOpenApproveModal = (item) => {
    setActionNotes('');
    setTopupActionModal({ action: 'approve', item });
  };

  const handleOpenRejectModal = (item) => {
    setActionReason('');
    setTopupActionModal({ action: 'reject', item });
  };

  const resolveProofUrl = (url) => {
    if (!url || url === 'virtual-proof') return 'virtual-proof';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
    const cleanPath = url.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  };

  const handleViewProof = (itemOrReport) => {
    const payment = pendingRequests.find((p) => p.branchId === itemOrReport.branchId) ||
      itemOrReport.latestPayment || {
        id: `TOPUP-${itemOrReport.branchCode || 'UPT'}-${Date.now().toString().slice(-4)}`,
        branchId: itemOrReport.branchId,
        branchName: itemOrReport.branchName,
        nominal: itemOrReport.totalAmount || itemOrReport.nominal,
        totalBayar: itemOrReport.totalAmount || itemOrReport.totalBayar,
        tanggal: itemOrReport.tanggal || new Date().toISOString(),
        bankTarget: itemOrReport.bankTarget || 'Bank BRI / BCA Virtual Account Lapas',
        proofUrl: itemOrReport.latestPayment?.proofUrl || itemOrReport.proofUrl || null,
        staffName: itemOrReport.staffName || ('Operator Kasir ' + (itemOrReport.branchName || '')),
        status: itemOrReport.billingStatus || itemOrReport.status || 'PENDING',
      };
    
    const rawUrl = payment.proofUrl || itemOrReport.proofUrl || null;
    const finalUrl = resolveProofUrl(rawUrl);
    setProofPreviewItem(payment);
    setProofPreviewUrl(finalUrl);
    setProofImageFailed(finalUrl === 'virtual-proof');
  };

  const handleOpenNewTabProof = () => {
    if (proofPreviewUrl && proofPreviewUrl !== 'virtual-proof') {
      window.open(proofPreviewUrl, '_blank');
      return;
    }
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Bukti Pembayaran Tagihan - ${proofPreviewItem?.branchName || 'Kantin'}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; background: #f8fafc; color: #1e293b; margin: 0; }
              .receipt-card { max-width: 480px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); }
              .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
              .brand { font-size: 26px; font-weight: 900; color: #1565C0; letter-spacing: -0.5px; }
              .subtitle { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
              .badge { display: inline-block; background: #fef3c7; color: #b45309; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; margin-top: 12px; border: 1px solid #fde68a; }
              .info-list { margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; }
              .label { color: #64748b; font-weight: 500; }
              .val { font-weight: 700; color: #0f172a; text-align: right; }
              .divider { border-top: 1px dashed #e2e8f0; margin: 18px 0; }
              .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #1565C0; padding-top: 8px; }
              .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5; }
              @media print { body { padding: 0; background: white; } .receipt-card { box-shadow: none; border: none; padding: 10px; } }
            </style>
          </head>
          <body>
            <div class="receipt-card">
              <div class="header">
                <div class="brand">PasCall</div>
                <div class="subtitle">Bukti Transfer Pembayaran Tagihan Kantin</div>
                <div class="badge">MENUNGGU VERIFIKASI ACC SUPERADMIN</div>
              </div>
              <div class="info-list">
                <div class="info-row">
                  <span class="label">Asal UPT / Kantin</span>
                  <span class="val">${proofPreviewItem?.branchName || '-'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Petugas Kasir</span>
                  <span class="val">${proofPreviewItem?.staffName || 'Operator Kasir'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Bank Tujuan</span>
                  <span class="val">${proofPreviewItem?.bankTarget || 'Bank BRI / BCA Virtual Account'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Waktu Transaksi</span>
                  <span class="val">${proofPreviewItem?.tanggal ? new Date(proofPreviewItem.tanggal).toLocaleString('id-ID') : '-'}</span>
                </div>
                <div class="divider"></div>
                <div class="info-row">
                  <span class="label">Nominal Tagihan Pokok</span>
                  <span class="val">${formatRupiah(proofPreviewItem?.nominal || proofPreviewItem?.totalBayar || 0)}</span>
                </div>
                <div class="total-row">
                  <span>TOTAL TRANSFER</span>
                  <span>${formatRupiah(proofPreviewItem?.totalBayar || proofPreviewItem?.nominal || 0)}</span>
                </div>
              </div>
              <div class="footer">
                Slip bukti pembayaran digital resmi sistem PasCall.<br/>
                Dicetak pada ${new Date().toLocaleString('id-ID')}
              </div>
            </div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handleOpenVerifyModal = (report) => {
    const payment = pendingRequests.find((p) => p.branchId === report.branchId) || report.latestPayment || {
      id: `TOPUP-${report.branchCode || 'UPT'}-${Date.now().toString().slice(-4)}`,
      branchId: report.branchId,
      branchName: report.branchName,
      nominal: report.totalAmount,
      totalBayar: report.totalAmount,
      tanggal: new Date().toISOString(),
      bankTarget: 'Transfer Virtual Account BRI / BCA',
      proofUrl: report.latestPayment?.proofUrl || null,
      staffName: 'Operator Kantin ' + report.branchName,
      status: 'PENDING',
    };
    handleOpenApproveModal(payment);
  };

  const handleConfirmTopupAction = async () => {
    if (!topupActionModal?.item || isProcessingAction) return;
    const { action, item } = topupActionModal;
    setIsProcessingAction(true);
    try {
      if (action === 'approve') {
        await approveTopupTransaction(item.id, actionNotes);
        showToast(`Pembayaran tagihan ${item.id} dari ${item.branchName} BERHASIL DISETUJUI (ACC). Status tagihan kini LUNAS.`);
      } else {
        if (!actionReason.trim()) {
          showToast('Alasan penolakan wajib diisi.');
          setIsProcessingAction(false);
          return;
        }
        await rejectTopupTransaction(item.id, actionReason);
        showToast(`Pembayaran tagihan ${item.id} dari ${item.branchName} DITOLAK.`);
      }
      setTopupActionModal(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal memproses aksi pembayaran tagihan.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return (
    <div className="space-y-5 pb-16 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 KARTU RINGKASAN STATISTIK FINANSIAL REAL-TIME (LANGSUNG DI ATAS TANPA JUDUL GANDA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Total Tagihan Periode Ini */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tagihan {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <div className="text-2xl font-black text-[#1565C0] tracking-tight">
              {formatRupiah(totalTagihanBulanIni)}
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Akumulasi dari <strong className="text-slate-700">{totalVoucherBulanIni}</strong> voucher terjual
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 2: Penggunaan Menit Bicara */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Durasi Menit Terjual
            </span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {totalMenitBulanIni.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-bold text-slate-500">Menit</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Penggunaan aktif WBP</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 3: Total Pembayaran Lunas */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Tagihan Lunas
            </span>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatRupiah(totalTagihanLunas)}
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Telah di-ACC Superadmin
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 4: Konfirmasi Masuk (Pending ACC) */}
        <div 
          onClick={() => setStatusTagihanFilter((prev) => prev === 'PENDING' ? 'semua' : 'PENDING')}
          className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between group cursor-pointer"
          title="Klik untuk filter tagihan yang butuh ACC"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Konfirmasi Pembayaran
            </span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {pendingRequests.length}{' '}
              <span className="text-xs font-semibold text-slate-400">Transfer</span>
            </div>
            <span
              className={`text-[11px] font-bold inline-flex items-center gap-1.5 ${
                pendingRequests.length > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-400'
              }`}
            >
              {pendingRequests.length > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{pendingRequests.length} Butuh verifikasi ACC</span>
                </>
              ) : (
                'Semua telah diverifikasi'
              )}
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform ${
              pendingRequests.length > 0
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & PENCARIAN TERPADU */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Bulan & Tahun */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#1565C0] shrink-0" />
            <span className="text-slate-500">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Tagihan */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusTagihanFilter}
              onChange={(e) => setStatusTagihanFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="BERJALAN">Bulan Berjalan</option>
              <option value="PENDING">Menunggu ACC</option>
              <option value="LUNAS">Lunas (Disetujui)</option>
              <option value="DIBLOKIR">Lewat Jatuh Tempo (Diblokir)</option>
            </select>
          </div>

          {/* Counter info */}
          <span className="text-[11px] text-slate-500 font-medium pl-1 hidden sm:inline">
            Menampilkan <strong>{filteredBillingReports.length}</strong> dari <strong>{billingReports.length}</strong> UPT
          </span>
        </div>

        {/* Pencarian UPT & Tombol Sinkronisasi */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama UPT / Kanwil..."
              value={searchUpt}
              onChange={(e) => setSearchUpt(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchUpt && (
              <button
                type="button"
                onClick={() => setSearchUpt('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={isLoadingBilling || isLoadingHistory}
            className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
            title="Sinkronkan data terkini dari seluruh kantin"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBilling || isLoadingHistory ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sinkronkan</span>
          </button>
        </div>
      </div>

      {/* Tabel Rekapitulasi Tagihan per UPT (Kolom Rapi, DPP/PPN di dalam Detail Modal) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-5 min-w-[220px]">Asal UPT / Kantin</th>
                <th className="py-3.5 px-4 min-w-[110px]">Periode</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Voucher & Durasi</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Total Tagihan</th>
                <th className="py-3.5 px-4 text-center min-w-[160px]">Status & Jatuh Tempo</th>
                <th className="py-3.5 px-4 text-center min-w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoadingBilling ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Memuat rekapitulasi tagihan seluruh kantin...</span>
                  </td>
                </tr>
              ) : filteredBillingReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Tidak ada data tagihan</p>
                    <p className="text-[11px] text-slate-400">Tidak ada UPT yang cocok dengan filter yang dipilih.</p>
                  </td>
                </tr>
              ) : (
                filteredBillingReports.map((report) => {
                  const isPending = report.billingStatus === 'PENDING';
                  return (
                    <tr key={report.branchId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nama UPT & Kanwil */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1565C0] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-snug">
                              {report.branchName}
                            </span>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{report.kanwilName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                Kode: {report.branchCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Periode */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-semibold">
                        {report.period}
                      </td>

                      {/* Voucher & Menit Terjual */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {report.totalVouchers} Voucher
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600">
                          {report.totalMinutes.toLocaleString('id-ID')} Menit
                        </div>
                      </td>

                      {/* Total Tagihan (DPP & PPN 11% dipindahkan ke Rincian modal) */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-[#1565C0] text-sm">
                          {formatRupiah(report.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Termasuk PPN 11%
                        </div>
                      </td>

                      {/* Status & Jatuh Tempo */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {report.billingStatus === 'LUNAS' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lunas (ACC)</span>
                          </span>
                        ) : report.billingStatus === 'PENDING' ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Menunggu ACC</span>
                            </span>
                          </div>
                        ) : report.isBlocked ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span>DIBLOKIR</span>
                            </span>
                            <div className="text-[10px] font-bold text-rose-600 mt-1">
                              Lewat Jatuh Tempo (H+2)
                            </div>
                          </div>
                        ) : report.billingStatus === 'BELUM_BAYAR' ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                              <span>Belum Dibayar</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Jatuh Tempo: {report.dueDateFormatted}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Bulan Berjalan</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Penjualan Aktif
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Tombol Aksi: Verifikasi ACC jika Menunggu ACC, dan Rincian Detail */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedUptDetail(report)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border shadow-2xs cursor-pointer active:scale-95 ${
                            isPending
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-extrabold'
                              : 'bg-blue-50 hover:bg-blue-100 text-[#1565C0] border-blue-200/80'
                          }`}
                          title={isPending ? 'Periksa rincian, bukti transfer, dan verifikasi ACC' : 'Lihat rincian tagihan, DPP, PPN, dan voucher'}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rincian</span>
                          {isPending && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-0.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {selectedUptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#1565C0]" />
                  <span>Rincian Transaksi Penjualan Masuk Tagihan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  UPT: <span className="font-bold text-slate-700">{selectedUptDetail.branchName}</span> • Periode: <span className="font-bold text-slate-700">{selectedUptDetail.period}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUptDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Cards (5 Indikator Finansial Lengkap: Termasuk DPP & PPN 11%) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-5 bg-slate-50/50 border-b border-slate-100 shrink-0">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voucher Terjual</span>
                <span className="text-lg font-black text-slate-800">{selectedUptDetail.totalVouchers}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Durasi Terjual</span>
                <span className="text-lg font-black text-emerald-600">{selectedUptDetail.totalMinutes} Menit</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DPP (Pokok Tagihan)</span>
                <span className="text-lg font-black text-slate-800">{formatRupiah(selectedUptDetail.totalDpp)}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PPN (11%)</span>
                <span className="text-lg font-black text-amber-600">{formatRupiah(selectedUptDetail.totalPpn)}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-[#1565C0] uppercase tracking-wider block">Total Tagihan Bruto</span>
                <span className="text-lg font-black text-[#1565C0]">{formatRupiah(selectedUptDetail.totalAmount)}</span>
              </div>
            </div>

            {/* Banner Status jika Menunggu ACC (Tombol aksi terpusat di footer bawah) */}
            {selectedUptDetail.billingStatus === 'PENDING' && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>Tagihan Menunggu Verifikasi ACC Superadmin</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold">
                      1 Transfer Masuk
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Nominal transfer: <strong>{formatRupiah(selectedUptDetail.totalAmount)}</strong>. Gunakan tombol di bagian bawah untuk membuka bukti transfer dan melakukan ACC.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Table Transaksi */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">No Transaksi</th>
                      <th className="py-2.5 px-4">Waktu</th>
                      <th className="py-2.5 px-4 text-center">Kode Voucher</th>
                      <th className="py-2.5 px-4">WBP (NIP)</th>
                      <th className="py-2.5 px-4">Paket / Durasi</th>
                      <th className="py-2.5 px-4">Kasir</th>
                      <th className="py-2.5 px-4 text-right">Nominal Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedUptDetail.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">
                          Belum ada transaksi voucher pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      selectedUptDetail.transactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                            {trx.id}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                            {formatTanggal(trx.createdAt)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-[#1565C0] border border-blue-200 rounded-md font-mono font-bold text-[11px]">
                              {trx.kodeVoucher || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-slate-800">
                              {trx.inmate?.name || trx.inmateName || '-'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              NIP: {trx.inmate?.identifier || '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-700">
                              {trx.package?.name || trx.packageName || 'Paket Bicara'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {trx.duration || trx.package?.duration || 15} Menit
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {trx.cashier?.name || 'Kasir'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                            {formatRupiah(trx.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Total {selectedUptDetail.transactions.length} transaksi voucher tercatat.
              </span>
              <div className="flex items-center gap-2">
                {selectedUptDetail.billingStatus === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleViewProof(selectedUptDetail)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Buka Bukti Bayar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const item = selectedUptDetail;
                        setSelectedUptDetail(null);
                        handleOpenVerifyModal(item);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verifikasi & ACC</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUptDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI APPROVE / REJECT PEMBAYARAN TAGIHAN                      */}
      {/* ========================================================================= */}
      {topupActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  topupActionModal.action === 'approve'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {topupActionModal.action === 'approve' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <X className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  {topupActionModal.action === 'approve'
                    ? 'Konfirmasi ACC Pembayaran Tagihan'
                    : 'Tolak Pembayaran Tagihan?'}
                </h4>
                <p className="text-xs text-slate-400">
                  ID Transaksi: <span className="font-mono font-bold text-slate-600">{topupActionModal.item.id}</span>
                </p>
              </div>
            </div>

            {/* Rincian Permintaan */}
            {(() => {
              const modalItem = topupActionModal.item;
              return (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200/70 text-xs mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Asal UPT / Kantin:</span>
                    <span className="font-bold text-slate-800">{modalItem.branchName || '-'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Petugas Kasir:</span>
                    <span className="font-bold text-slate-800">{modalItem.staffName || 'Operator Kantin'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Metode / Bank:</span>
                    <span className="font-semibold text-slate-700">{modalItem.bankTarget || 'Transfer Bank'}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-slate-200">
                    <span>Nominal Pembayaran:</span>
                    <span className="text-[#1565C0] font-black text-sm">{formatRupiah(modalItem.totalBayar || modalItem.nominal)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Bukti Pembayaran:</span>
                      <button
                        type="button"
                        onClick={() => handleViewProof(modalItem)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition border border-blue-200/60 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Bukti Transfer</span>
                      </button>
                    </div>
                </div>
              );
            })()}

            {/* Input Notes / Reason */}
            {topupActionModal.action === 'approve' ? (
              <div className="mb-4 text-left">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Persetujuan (opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bukti transfer tagihan telah sesuai dan dana masuk"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  disabled={isProcessingAction}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            ) : (
              <div className="mb-4 text-left">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Sebutkan alasan penolakan agar kasir dapat memperbaikinya..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  disabled={isProcessingAction}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            )}

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {topupActionModal.action === 'approve'
                ? 'Dengan menyetujui, tagihan kantin periode ini akan ditandai LUNAS dan kasir dapat terus menjual paket secara normal.'
                : 'Permintaan akan ditolak dan kantin akan menerima alasan penolakan ini untuk segera mengunggah bukti pembayaran ulang.'}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTopupActionModal(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmTopupAction}
                disabled={isProcessingAction}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 ${
                  topupActionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessingAction ? (
                  <span>Memproses...</span>
                ) : topupActionModal.action === 'approve' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui (ACC)</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Tolak Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PREVIEW BUKTI PEMBAYARAN STRUK / FOTO / PDF */}
      {/* ========================================================================= */}
      {proofPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 text-left animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#1565C0]" />
                  <span>Bukti Pembayaran Tagihan</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  UPT: <span className="font-bold text-slate-700">{proofPreviewItem?.branchName || 'Cabang Kantin'}</span> • Total: <span className="font-bold text-[#1565C0]">{formatRupiah(proofPreviewItem?.totalBayar || proofPreviewItem?.nominal || 0)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Bukti Pembayaran: Gambar atau Slip Transfer Digital Resmi */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 flex items-center justify-center bg-slate-100/60">
              {!proofImageFailed && proofPreviewUrl !== 'virtual-proof' ? (
                <div className="text-center">
                  <img
                    src={proofPreviewUrl}
                    alt="Bukti Transfer Pembayaran"
                    onError={() => setProofImageFailed(true)}
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Foto / Scan Slip Bukti Pembayaran dari Kasir Kantin
                  </p>
                </div>
              ) : (
                /* Struk Digital Resmi PasCall (Fallback slip transfer interaktif & elegan) */
                <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-md text-slate-800">
                  <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
                    <span className="text-xl font-black text-[#1565C0] tracking-tight">PasCall</span>
                    <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1">
                      Struk Bukti Transfer Tagihan Kantin
                    </h5>
                    <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>MENUNGGU VERIFIKASI ACC</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Asal UPT / Kantin:</span>
                      <span className="font-bold text-slate-800">{proofPreviewItem?.branchName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Petugas Kasir Pengirim:</span>
                      <span className="font-semibold text-slate-700">{proofPreviewItem?.staffName || 'Operator Kasir'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank & Rekening Tujuan:</span>
                      <span className="font-semibold text-slate-700">{proofPreviewItem?.bankTarget || 'Bank BRI / BCA Virtual Account'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waktu Pembayaran:</span>
                      <span className="font-mono text-slate-700">
                        {proofPreviewItem?.tanggal ? formatTanggal(proofPreviewItem.tanggal) : '-'}
                      </span>
                    </div>
                    
                    <div className="border-t border-dashed border-slate-200 pt-2.5 mt-2.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Nominal Pokok Tagihan:</span>
                        <span className="font-bold text-slate-800">
                          {formatRupiah(proofPreviewItem?.nominal || proofPreviewItem?.totalBayar || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-black text-sm pt-2 mt-1 border-t border-slate-100">
                        <span>TOTAL TRANSFER:</span>
                        <span className="text-[#1565C0]">
                          {formatRupiah(proofPreviewItem?.totalBayar || proofPreviewItem?.nominal || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                    Dokumen bukti transfer digital sah dari transaksi kasir kantin.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal: Tombol Buka Tab Baru & Tutup */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleOpenNewTabProof}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Buka di tab baru (Cetak / Unduh)</span>
              </button>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Detail Pembayaran Tagihan</h4>
                <p className="text-xs text-slate-400 font-mono">{detailModalItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Asal UPT:</span>
                <span className="font-bold text-slate-800">{detailModalItem.branchName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Waktu Pembayaran:</span>
                <span className="font-medium text-slate-700">{formatTanggal(detailModalItem.tanggal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Petugas Kasir:</span>
                <span className="font-medium text-slate-700">{detailModalItem.staffName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Metode Bayar:</span>
                <span className="font-medium text-slate-700">{detailModalItem.bankTarget || 'Transfer'}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-slate-100">
                <span>Total Tagihan:</span>
                <span className="text-[#1565C0] font-black text-sm">{formatRupiah(detailModalItem.totalBayar || detailModalItem.nominal)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span>Status Verifikasi:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  detailModalItem.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {detailModalItem.status === 'APPROVED' ? 'Disetujui (Lunas)' : 'Ditolak'}
                </span>
              </div>
              {detailModalItem.rejectReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  <span className="font-bold block mb-0.5">Alasan Penolakan:</span>
                  <span>{detailModalItem.rejectReason}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
