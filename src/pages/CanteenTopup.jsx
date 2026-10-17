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
    window.addEventListener('pascall_packages_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('canteen_topup_changed', handleRealtimeUpdate);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <span>Manajemen Tagihan Kantin</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1565C0] uppercase tracking-wider">
              Pascabayar
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring laporan tagihan bulanan seluruh UPT, penggunaan menit bicara, verifikasi transfer tagihan, dan aturan jatuh tempo (H+2).
          </p>
        </div>

        {/* Tombol Refresh Realtime */}
        <button
          type="button"
          onClick={() => loadData()}
          disabled={isLoadingBilling || isLoadingHistory}
          className="self-start md:self-center px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBilling || isLoadingHistory ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Sinkronkan Real Time</span>
        </button>
      </div>

      {/* 4 KARTU RINGKASAN STATISTIK FINANSIAL REAL-TIME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Total Tagihan Periode Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tagihan {monthNames[selectedMonth - 1]}
            </span>
            <div className="text-2xl font-black text-[#1565C0] tracking-tight">
              {formatRupiah(totalTagihanBulanIni)}
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Dari {totalVoucherBulanIni} voucher terjual
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Kartu 2: Penggunaan Menit Bicara */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
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
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Kartu 3: Total Pembayaran Lunas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Kartu 4: Konfirmasi Masuk (Pending ACC) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Konfirmasi Pembayaran
            </span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {pendingRequests.length}{' '}
              <span className="text-xs font-semibold text-slate-400">Transfer</span>
            </div>
            <span
              className={`text-[11px] font-bold ${
                pendingRequests.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'
              }`}
            >
              {pendingRequests.length > 0
                ? `${pendingRequests.length} Butuh verifikasi ACC`
                : 'Semua telah diverifikasi'}
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              pendingRequests.length > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB SWITCHER NAVIGASI HALAMAN */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('laporan')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'laporan'
              ? 'border-[#1565C0] text-[#1565C0]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Monitoring Tagihan Seluruh UPT</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-[#1565C0]">
            {billingReports.length} UPT
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('konfirmasi')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'konfirmasi'
              ? 'border-[#1565C0] text-[#1565C0]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Konfirmasi Pembayaran Tagihan</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingRequests.length} Baru
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('riwayat')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'riwayat'
              ? 'border-[#1565C0] text-[#1565C0]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Verifikasi Pembayaran</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LAPORAN MONITORING TAGIHAN SELURUH UPT (REAL TIME)                 */}
      {/* ========================================================================= */}
      {activeTab === 'laporan' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Bar Periode & Pencarian */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Bulan */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-[#1565C0]" />
                <span>Periode:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {monthNames.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Tahun */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              {/* Filter Status Tagihan */}
              <select
                value={statusTagihanFilter}
                onChange={(e) => setStatusTagihanFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="semua">Semua Status</option>
                <option value="BERJALAN">Bulan Berjalan</option>
                <option value="LUNAS">Lunas (Disetujui)</option>
                <option value="PENDING">Menunggu Konfirmasi</option>
                <option value="DIBLOKIR">Lewat Jatuh Tempo (Diblokir)</option>
              </select>
            </div>

            {/* Pencarian UPT */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama UPT / Kanwil..."
                value={searchUpt}
                onChange={(e) => setSearchUpt(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchUpt && (
                <button
                  onClick={() => setSearchUpt('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabel Rekapitulasi Tagihan per UPT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[840px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-6">Asal UPT / Kantin</th>
                    <th className="py-3.5 px-6">Periode</th>
                    <th className="py-3.5 px-6 text-center">Voucher & Durasi</th>
                    <th className="py-3.5 px-6 text-right">DPP & PPN (11%)</th>
                    <th className="py-3.5 px-6 text-right">Total Tagihan</th>
                    <th className="py-3.5 px-6 text-center">Status & Jatuh Tempo</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoadingBilling ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                        <span>Memuat rekapitulasi tagihan seluruh kantin...</span>
                      </td>
                    </tr>
                  ) : filteredBillingReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Tidak ada data tagihan</p>
                        <p className="text-[11px] text-slate-400">Tidak ada UPT yang cocok dengan filter yang dipilih.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBillingReports.map((report) => {
                      return (
                        <tr key={report.branchId} className="hover:bg-slate-50/70 transition-colors">
                          {/* Nama UPT & Kanwil */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#1565C0] shrink-0" />
                              <span className="font-bold text-slate-800">
                                {report.branchName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium pl-6 mt-0.5">
                              {report.kanwilName} • Kode: <span className="font-mono text-slate-600">{report.branchCode}</span>
                            </div>
                          </td>

                          {/* Periode */}
                          <td className="py-4 px-6 whitespace-nowrap text-slate-700 font-medium">
                            {report.period}
                          </td>

                          {/* Voucher & Menit Terjual */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {report.totalVouchers} Voucher
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-600">
                              {report.totalMinutes.toLocaleString('id-ID')} Menit
                            </div>
                          </td>

                          {/* DPP & PPN */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="font-medium text-slate-600">
                              DPP: {formatRupiah(report.totalDpp)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              PPN: {formatRupiah(report.totalPpn)}
                            </div>
                          </td>

                          {/* Total Tagihan */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="font-black text-[#1565C0] text-sm">
                              {formatRupiah(report.totalAmount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Termasuk PPN 11%
                            </div>
                          </td>

                          {/* Status & Jatuh Tempo */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
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

                          {/* Tombol Lihat Rincian Voucher */}
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedUptDetail(report)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold transition border border-blue-200/80 shadow-2xs cursor-pointer active:scale-95"
                              title="Lihat rincian transaksi voucher"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Rincian</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONFIRMASI PEMBAYARAN TAGIHAN MASUK (ACC / TOLAK)                   */}
      {/* ========================================================================= */}
      {activeTab === 'konfirmasi' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Konfirmasi Transfer Pembayaran Tagihan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi transfer bukti pembayaran tagihan dari operator kantin UPT.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-amber-50/70 border-b border-amber-100 text-[11px] font-bold text-amber-900/80 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-6">Asal UPT / Kantin & Kasir</th>
                    <th className="py-3.5 px-6">Waktu Pengajuan</th>
                    <th className="py-3.5 px-6 text-right">Nominal Tagihan</th>
                    <th className="py-3.5 px-6 text-center">Bukti Bayar</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                        Memeriksa transfer pembayaran masuk...
                      </td>
                    </tr>
                  ) : pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-400">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          Tidak Ada Pembayaran yang Menunggu Konfirmasi
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Semua bukti transfer pembayaran tagihan dari kantin telah selesai diproses.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-800">
                              {item.branchName || 'Cabang Lapas'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium pl-6 mt-0.5">
                            Kasir: <span className="font-semibold text-slate-700">{item.staffName || 'Operator'}</span>
                            <span className="text-slate-400 font-mono text-[10px] ml-2">({item.id})</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap">
                          {formatTanggal(item.tanggal)}
                        </td>

                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="font-black text-[#1565C0] text-sm">
                            {formatRupiah(item.totalBayar || item.nominal)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Metode: {item.bankTarget || 'Transfer'}
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-center whitespace-nowrap">
                          {item.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setProofPreviewUrl(item.proofUrl);
                                setProofPreviewItem(item);
                                setProofImageFailed(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold border border-blue-200 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Bukti</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Tidak ada berkas</span>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(item)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                              title="Setujui pembayaran (ACC)"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui (ACC)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(item)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Tolak pembayaran"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIWAYAT PEMBAYARAN TAGIHAN                                         */}
      {/* ========================================================================= */}
      {activeTab === 'riwayat' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Riwayat Pembayaran Tagihan</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log transaksi pembayaran tagihan kantin yang telah diproses (Disetujui atau Ditolak).
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID transaksi, nama cabang UPT, kasir..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchHistory && (
                <button
                  onClick={() => setSearchHistory('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="shrink-0">
              <select
                value={statusHistoryFilter}
                onChange={(e) => setStatusHistoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
              >
                <option value="semua">Status: Semua</option>
                <option value="berhasil">Status: Disetujui (Lunas)</option>
                <option value="ditolak">Status: Ditolak</option>
              </select>
            </div>
          </div>

          {/* Tabel Riwayat */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-6">Asal UPT / Kantin</th>
                    <th className="py-3.5 px-6">Waktu Transaksi</th>
                    <th className="py-3.5 px-6 text-right">Nominal Tagihan</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                        Memuat riwayat transaksi pembayaran...
                      </td>
                    </tr>
                  ) : processedHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        <Inbox className="w-7 h-7 mx-auto text-slate-300 mb-1" />
                        <p className="text-xs font-bold text-slate-700">Tidak ada riwayat transaksi</p>
                        <p className="text-[11px] text-slate-400">Coba ubah kata kunci atau filter status.</p>
                      </td>
                    </tr>
                  ) : (
                    processedHistory.map((item) => {
                      const isApproved = item.status === 'APPROVED' || item.status === 'Berhasil';
                      const isRejected = item.status === 'REJECTED' || item.status === 'Ditolak';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="font-bold text-slate-800">
                                {item.branchName || 'Cabang Lapas'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium pl-6 mt-0.5">
                              Kasir: <span className="font-semibold text-slate-700">{item.staffName || 'Operator'}</span>
                              <span className="text-slate-400 font-mono text-[10px] ml-2">({item.id})</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap">
                            {formatTanggal(item.tanggal)}
                          </td>

                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
                            <div className="font-black text-[#1565C0] text-sm">
                              {formatRupiah(item.totalBayar || item.nominal)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Metode: {item.bankTarget || 'Transfer'}
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : isRejected ? (
                                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span>{isApproved ? 'Disetujui (Lunas)' : isRejected ? 'Ditolak' : item.status}</span>
                            </span>
                            {isRejected && item.rejectReason && (
                              <div className="text-[10px] text-rose-600 font-medium mt-1 max-w-xs mx-auto truncate" title={item.rejectReason}>
                                Alasan: {item.rejectReason}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-6 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailModalItem(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold transition border border-blue-200/60 shadow-2xs cursor-pointer active:scale-95"
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RINCIAN VOUCHER PER UPT (REAL-TIME SEPERTI GAMBAR 1)                 */}
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

            {/* Modal Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voucher Terjual</span>
                <span className="text-lg font-black text-slate-800">{selectedUptDetail.totalVouchers}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Durasi Terjual</span>
                <span className="text-lg font-black text-slate-800">{selectedUptDetail.totalMinutes} Menit</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DPP (Dasar Pengenaan)</span>
                <span className="text-lg font-black text-slate-800">{formatRupiah(selectedUptDetail.totalDpp)}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tagihan Bruto</span>
                <span className="text-lg font-black text-[#1565C0]">{formatRupiah(selectedUptDetail.totalAmount)}</span>
              </div>
            </div>

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

                  {modalItem.proofUrl && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Bukti Transfer:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setProofPreviewUrl(modalItem.proofUrl);
                          setProofPreviewItem(modalItem);
                          setProofImageFailed(false);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti Transfer</span>
                      </button>
                    </div>
                  )}
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
      {/* MODAL PREVIEW BUKTI PEMBAYARAN STRUK / FOTO / PDF                        */}
      {/* ========================================================================= */}
      {proofPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 text-left animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Bukti Pembayaran Tagihan</h4>
                <p className="text-xs text-slate-400">
                  {proofPreviewItem?.branchName || 'Cabang'} • {formatRupiah(proofPreviewItem?.totalBayar || proofPreviewItem?.nominal)}
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

            <div className="p-4 overflow-y-auto flex-1 min-h-0 flex items-center justify-center bg-slate-100/50">
              {!proofImageFailed ? (
                <img
                  src={proofPreviewUrl}
                  alt="Bukti Transfer"
                  onError={() => setProofImageFailed(true)}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200 bg-white"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Berkas Dokumen Bukti Pembayaran</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format berkas PDF atau tautan dokumen eksternal.
                  </p>
                  <a
                    href={proofPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <span>Buka Dokumen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <a
                href={proofPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Buka di tab baru</span>
                <ArrowRight className="w-3 h-3" />
              </a>
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
      {/* MODAL DETAIL RIWAYAT                                                      */}
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
