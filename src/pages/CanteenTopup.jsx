import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  X,
  Check,
  Inbox,
  Eye,
  FileText,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Filter,
  RefreshCw,
  Edit3,
  Calculator,
  Percent,
  Coins,
  Store,
  ExternalLink,
  Download,
  Sliders,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../utils/formatKantin';
import {
  getSuperadminTopupHistory,
  approveTopupTransaction,
  rejectTopupTransaction,
  getTopupProofStreamUrl,
  fetchTopupProofBlob,
} from '../services/canteenTopupService';
import {
  getCanteenBillingNational,
  getAllCanteenContracts,
  updateCanteenContract,
  formatDetikKeMenit,
} from '../services/canteenBillingService';
import { getBranches } from '../services/branchService';
import { API_BASE_URL, getAuthToken, getAuthUser } from '../services/api';
import { ROLES, normalizeRole } from '../config/menuConfig';

export default function CanteenTopup() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Role pengguna saat ini
  const currentUser = getAuthUser();
  const isSuperadmin = normalizeRole(currentUser?.role) === ROLES.SUPERADMIN;

  // 1. Tab Utama (TAB 1: Tagihan Bulanan | TAB 2: Pengaturan Kontrak)
  // Menggunakan inisialisasi instan tanpa memicu re-render React Router
  const [activeMainTab, setActiveMainTabState] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      return p === 'kontrak' ? 'kontrak' : 'tagihan';
    } catch {
      return 'tagihan';
    }
  });

  const setActiveMainTab = (tab) => {
    setActiveMainTabState(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // ignore
    }
  };

  const [billingSubTab, setBillingSubTab] = useState('laporan'); // 'laporan' | 'konfirmasi' | 'riwayat'

  // Tab 2: State Pengaturan Kontrak Seluruh Kantin
  const [contractsList, setContractsList] = useState([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [searchContract, setSearchContract] = useState('');
  const [statusContractFilter, setStatusContractFilter] = useState('semua');

  // 2. Filter Periode Tagihan (Khusus Tab 1)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 3. Data Laporan Tagihan Berbasis Detik Seluruh Kantin
  const [billingReports, setBillingReports] = useState([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [searchUpt, setSearchUpt] = useState('');
  const [statusTagihanFilter, setStatusTagihanFilter] = useState('semua');

  // 4. Data Permintaan Masuk & Riwayat Pembayaran Tagihan
  const [allHistory, setAllHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchHistory, setSearchHistory] = useState('');
  const [statusHistoryFilter, setStatusHistoryFilter] = useState('semua');
  const [, setBranchOptions] = useState([]);

  // 5. Modal State
  const [topupActionModal, setTopupActionModal] = useState(null); // { action: 'approve' | 'reject', item: object }
  const [detailModalItem, setDetailModalItem] = useState(null); // Modal rincian tagihan detik & verifikasi terpadu
  const [detailModalNotes, setDetailModalNotes] = useState('');
  const [detailModalReason, setDetailModalReason] = useState('');
  const [detailModalRejectMode, setDetailModalRejectMode] = useState(false);
  const [isProcessingModalAction, setIsProcessingModalAction] = useState(false);
  const [historyDetailModalItem, setHistoryDetailModalItem] = useState(null); // Modal detail riwayat lama
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [proofPreviewItem, setProofPreviewItem] = useState(null);
  const [proofImageFailed, setProofImageFailed] = useState(false);
  const [, setIsProofLoading] = useState(false);
  const [isDownloadingProof, setIsDownloadingProof] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 6. Modal Edit Kontrak Tarif (Khusus Superadmin)
  const [editContractModal, setEditContractModal] = useState(null); // item objek kantin
  const [editRate, setEditRate] = useState('');
  const [editSuperadminPercent, setEditSuperadminPercent] = useState('');
  const [, setEditCanteenPercent] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingContract, setIsSavingContract] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Semua Data Tagihan Berbasis Detik (Tab 1)
  const loadData = async () => {
    setIsLoadingBilling(true);
    setIsLoadingHistory(true);
    try {
      const [reports, historyData, branchesRes] = await Promise.all([
        getCanteenBillingNational(selectedMonth, selectedYear),
        getSuperadminTopupHistory({ search: '', status: 'semua', branchId: 'semua' }),
        getBranches({ limit: 100 }).catch(() => ({ items: [] })),
      ]);
      setBillingReports(reports || []);
      setAllHistory(historyData || []);
      const bList = Array.isArray(branchesRes?.items) ? branchesRes.items : (Array.isArray(branchesRes) ? branchesRes : []);
      setBranchOptions(bList);
    } catch (err) {
      console.error('Gagal memuat data tagihan kantin:', err);
    } finally {
      setIsLoadingBilling(false);
      setIsLoadingHistory(false);
    }
  };

  // Load Data Kontrak Seluruh Kantin (Tab 2)
  const loadContractsData = async () => {
    setIsLoadingContracts(true);
    try {
      const list = await getAllCanteenContracts();
      setContractsList(list || []);
    } catch (err) {
      console.error('Gagal memuat daftar kontrak kantin:', err);
    } finally {
      setIsLoadingContracts(false);
    }
  };

  useEffect(() => {
    loadData();
    loadContractsData();

    // Event listener realtime saat kasir kantin submit bukti bayar atau ada perubahan kontrak
    let debounceTimer = null;
    const handleRealtimeUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
        loadContractsData();
      }, 400);
    };

    window.addEventListener('canteen_topup_changed', handleRealtimeUpdate);
    window.addEventListener('pascall_billing_updated', handleRealtimeUpdate);
    window.addEventListener('pascall_contract_changed', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('canteen_topup_changed', handleRealtimeUpdate);
      window.removeEventListener('pascall_billing_updated', handleRealtimeUpdate);
      window.removeEventListener('pascall_contract_changed', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
    };
  }, [selectedMonth, selectedYear]);

  // Permintaan Pembayaran yang butuh persetujuan (Status: PENDING)
  // Hanya menghitung pengajuan untuk periode yang SUDAH TUTUP BUKU
  const pendingRequests = allHistory.filter((item) => {
    if (item.status !== 'PENDING' && item.status !== 'Menunggu') return false;
    if (item.billingMonth && item.billingYear) {
      const bMonth = Number(item.billingMonth);
      const bYear = Number(item.billingYear);
      const isCur = (bYear === currentYear && bMonth === currentMonth);
      const lastDay = new Date(bYear, bMonth, 0).getDate();
      const isClosed = !isCur || now >= new Date(bYear, bMonth - 1, lastDay, 23, 59, 59, 999);
      return isClosed;
    }
    return false;
  });

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
      const statusMap = {
        'LUNAS': report.statusPembayaran === 'Lunas',
        'PENDING': report.statusPembayaran === 'Menunggu ACC',
        'BELUM_BAYAR': report.statusPembayaran === 'Belum Bayar',
        'TELAT': report.statusPembayaran === 'Telat' || report.isBlocked,
        'BERJALAN': String(report.statusPembayaran || '').includes('Bulan Berjalan'),
      };
      if (!statusMap[statusTagihanFilter]) return false;
    }
    if (searchUpt.trim() !== '') {
      const q = searchUpt.toLowerCase();
      const matchName = report.canteenName?.toLowerCase().includes(q);
      const matchUpt = report.uptName?.toLowerCase().includes(q);
      const matchKanwil = report.kanwilName?.toLowerCase().includes(q);
      if (!matchName && !matchUpt && !matchKanwil) return false;
    }
    return true;
  });

  // Filter Daftar Kontrak Tab 2
  const filteredContracts = contractsList.filter((c) => {
    if (statusContractFilter === 'sudah_diatur' && !c.isContractSet) return false;
    if (statusContractFilter === 'belum_diatur' && c.isContractSet) return false;
    if (searchContract.trim() !== '') {
      const q = searchContract.toLowerCase();
      const matchName = c.canteenName?.toLowerCase().includes(q);
      const matchUpt = c.uptName?.toLowerCase().includes(q);
      const matchKanwil = c.kanwilName?.toLowerCase().includes(q);
      if (!matchName && !matchUpt && !matchKanwil) return false;
    }
    return true;
  });

  const configuredContractsCount = contractsList.filter((c) => c.isContractSet).length;
  const unconfiguredContractsCount = contractsList.length - configuredContractsCount;

  // Kalkulasi Statistik Real-Time
  const totalTagihanBulanIni = billingReports.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
  const totalDetikBulanIni = billingReports.reduce((acc, r) => acc + (Number(r.totalSeconds) || 0), 0);
  const kantinTerkonfigurasiCount = billingReports.filter((r) => r.isContractSet).length;

  // Handlers Edit Kontrak Tarif (Khusus Superadmin)
  const handleOpenEditContract = (target) => {
    setEditError('');
    setEditContractModal(target);
    setEditRate(target.ratePerSecond !== null && target.ratePerSecond !== undefined ? String(target.ratePerSecond) : '');

    const saP = target.superadminPercent !== null && target.superadminPercent !== undefined
      ? target.superadminPercent
      : (target.negotiationPercent !== null && target.negotiationPercent !== undefined ? target.negotiationPercent : '');

    setEditSuperadminPercent(saP !== '' ? String(saP) : '60');
    setEditCanteenPercent(saP !== '' ? String(100 - Number(saP)) : '40');
  };

  const handleSuperadminPercentChange = (val) => {
    setEditSuperadminPercent(val);
    if (val === '') {
      setEditCanteenPercent('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setEditCanteenPercent(String(100 - num));
    }
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    if (!editContractModal) return;

    const rateNum = Number(editRate);
    const saPercentNum = Number(editSuperadminPercent);
    const canteenPercentNum = 100 - saPercentNum;

    if (editRate === '' || isNaN(rateNum) || rateNum < 0) {
      setEditError('Tarif per detik wajib diisi dan tidak boleh bernilai negatif.');
      return;
    }
    if (editSuperadminPercent === '' || isNaN(saPercentNum) || saPercentNum < 0 || saPercentNum > 100) {
      setEditError('Persentase Superadmin wajib diisi antara 0% hingga 100%.');
      return;
    }

    setIsSavingContract(true);
    setEditError('');
    try {
      await updateCanteenContract(editContractModal.branchId, {
        ratePerSecond: rateNum,
        superadminPercent: saPercentNum,
        canteenPercent: canteenPercentNum,
        negotiationPercent: saPercentNum,
        canteenName: editContractModal.canteenName,
        branchName: editContractModal.uptName,
      });

      showToast(`Kontrak tarif untuk ${editContractModal.canteenName} berhasil disimpan. Perhitungan tagihan otomatis diperbarui.`);
      setEditContractModal(null);
      await Promise.all([loadData(), loadContractsData()]);
    } catch (err) {
      setEditError(err.message || 'Gagal menyimpan kontrak tarif.');
    } finally {
      setIsSavingContract(false);
    }
  };

  // Handlers Approve & Reject Bukti Bayar
  const handleOpenApproveModal = (item) => {
    setActionNotes('');
    setTopupActionModal({ action: 'approve', item });
  };

  const handleOpenRejectModal = (item) => {
    setActionReason('');
    setTopupActionModal({ action: 'reject', item });
  };

  const resolveProofUrl = (url, item) => {
    if (item && item.id && !String(item.id).startsWith('TOPUP-') && item.proofUrl && item.proofUrl !== 'virtual-proof') {
      const streamUrl = getTopupProofStreamUrl(item);
      if (streamUrl) return streamUrl;
    }

    if (!url || url === 'virtual-proof') return 'virtual-proof';
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    if (url.includes('/api/canteen/topups/') && url.includes('/proof')) {
      const token = getAuthToken();
      const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
      const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
      const cleanPath = url.startsWith('http') ? url : `${cleanBase}/${url.replace(/^\/+/, '')}`;
      return cleanPath.includes('token=') ? cleanPath : `${cleanPath}${cleanPath.includes('?') ? '&' : '?'}${tokenQuery.replace('?', '')}`;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
    const cleanPath = url.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  };

  const handleViewProof = (itemOrReport) => {
    const payment =
      (itemOrReport && itemOrReport.nominal && itemOrReport.id && !itemOrReport.uptName ? itemOrReport : null) ||
      pendingRequests.find((p) => p.branchId === itemOrReport.branchId) ||
      allHistory.find((h) => h.branchId === itemOrReport.branchId && (h.status === 'PENDING' || h.status === 'Menunggu')) ||
      itemOrReport.paymentProof || {
        id: `TOPUP-${itemOrReport.branchId || 'UPT'}-${Date.now().toString().slice(-4)}`,
        branchId: itemOrReport.branchId,
        branchName: itemOrReport.uptName || itemOrReport.branchName,
        nominal: itemOrReport.totalAmount || itemOrReport.nominal,
        totalBayar: itemOrReport.totalAmount || itemOrReport.totalBayar,
        tanggal: new Date().toISOString(),
        bankTarget: 'Bank Transfer / QRIS',
        proofUrl: itemOrReport.paymentProof?.proofUrl || null,
        staffName: 'Petugas ' + (itemOrReport.canteenName || itemOrReport.uptName || ''),
        status: itemOrReport.statusPembayaran || 'PENDING',
      };

    const targetItem = {
      ...payment,
      id: payment.id || itemOrReport.id,
      proofUrl: payment.proofUrl || itemOrReport.paymentProof?.proofUrl || null,
    };

    const finalUrl = resolveProofUrl(targetItem.proofUrl, targetItem);
    setProofPreviewItem(targetItem);
    setProofPreviewUrl(finalUrl);
    setProofImageFailed(finalUrl === 'virtual-proof');
    setIsProofLoading(finalUrl !== 'virtual-proof');
  };

  const handleDownloadProof = async () => {
    if (!proofPreviewItem?.id || String(proofPreviewItem.id).startsWith('TOPUP-')) {
      handleOpenNewTabProof();
      return;
    }
    setIsDownloadingProof(true);
    try {
      const { objectUrl } = await fetchTopupProofBlob(proofPreviewItem.id);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `bukti-transfer-${proofPreviewItem.branchName || 'kantin'}-${proofPreviewItem.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✓ Berkas bukti pembayaran berhasil diunduh');
    } catch (err) {
      console.warn('Gagal unduh blob proof, fallback buka tab baru:', err);
      handleOpenNewTabProof();
    } finally {
      setIsDownloadingProof(false);
    }
  };

  const handleOpenNewTabProof = () => {
    if (proofPreviewUrl && proofPreviewUrl !== 'virtual-proof') {
      window.open(proofPreviewUrl, '_blank');
      return;
    }
    window.open('', '_blank');
  };

  const handleConfirmTopupAction = async () => {
    if (!topupActionModal?.item || isProcessingAction) return;
    const { action, item } = topupActionModal;
    setIsProcessingAction(true);
    try {
      if (action === 'approve') {
        await approveTopupTransaction(item.id, actionNotes);
        showToast(`Pembayaran tagihan ${item.id} dari ${item.branchName || item.canteenName} BERHASIL DISETUJUI (ACC).`);
      } else {
        if (!actionReason.trim()) {
          showToast('Alasan penolakan wajib diisi.');
          setIsProcessingAction(false);
          return;
        }
        await rejectTopupTransaction(item.id, actionReason);
        showToast(`Pembayaran tagihan ${item.id} dari ${item.branchName || item.canteenName} DITOLAK.`);
      }
      setTopupActionModal(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal memproses aksi pembayaran tagihan.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler Terpadu: Buka Modal Detail (Memuat Tagihan + Pembayaran + Verifikasi / Review)
  const handleOpenDetailModal = (report) => {
    const payment =
      report.paymentProof ||
      allHistory.find((h) => h.branchId === report.branchId && (h.status === 'PENDING' || h.status === 'Menunggu')) ||
      allHistory.find((h) => h.branchId === report.branchId && (h.status === 'APPROVED' || h.status === 'Berhasil')) ||
      allHistory.find((h) => h.branchId === report.branchId) ||
      null;

    setDetailModalItem({
      ...report,
      matchedPayment: payment,
    });
    setDetailModalNotes('');
    setDetailModalReason('');
    setDetailModalRejectMode(false);
  };

  // Handler Terpadu: Setujui (ACC) Langsung dari Dalam Modal Detail
  const handleApproveFromDetailModal = async () => {
    if (!detailModalItem || isProcessingModalAction) return;
    const payment = detailModalItem.matchedPayment || detailModalItem.paymentProof;
    const paymentId = payment?.id || `TOPUP-${detailModalItem.branchId}`;

    setIsProcessingModalAction(true);
    try {
      await approveTopupTransaction(paymentId, detailModalNotes);
      showToast(`✓ Pembayaran tagihan dari ${detailModalItem.canteenName || detailModalItem.uptName} BERHASIL DISETUJUI (ACC).`);
      setDetailModalItem(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal menyetujui pembayaran tagihan.');
    } finally {
      setIsProcessingModalAction(false);
    }
  };

  // Handler Terpadu: Tolak Pembayaran Langsung dari Dalam Modal Detail
  const handleRejectFromDetailModal = async () => {
    if (!detailModalItem || isProcessingModalAction) return;
    if (!detailModalReason.trim()) {
      showToast('Alasan penolakan wajib diisi.');
      return;
    }
    const payment = detailModalItem.matchedPayment || detailModalItem.paymentProof;
    const paymentId = payment?.id || `TOPUP-${detailModalItem.branchId}`;

    setIsProcessingModalAction(true);
    try {
      await rejectTopupTransaction(paymentId, detailModalReason);
      showToast(`Pembayaran tagihan dari ${detailModalItem.canteenName || detailModalItem.uptName} DITOLAK.`);
      setDetailModalItem(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal menolak pembayaran tagihan.');
    } finally {
      setIsProcessingModalAction(false);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          HEADER NAVIGASI DUA TAB UTAMA (SUPERADMIN)
          TAB 1: TAGIHAN BULANAN | TAB 2: PENGATURAN KONTRAK
          ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tombol Dua Tab Berukuran Nyaman dan Kontras Tinggi */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TAB 1: TAGIHAN BULANAN */}
          <button
            type="button"
            onClick={() => setActiveMainTab('tagihan')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeMainTab === 'tagihan'
                ? 'bg-[#1565C0] text-white shadow-md shadow-blue-700/25 ring-2 ring-blue-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Receipt className={`w-4 h-4 ${activeMainTab === 'tagihan' ? 'text-white' : 'text-slate-500'}`} />
            <span>Tagihan Bulanan</span>
            {pendingRequests.length > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeMainTab === 'tagihan'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {pendingRequests.length} ACC
              </span>
            )}
          </button>

          {/* TAB 2: PENGATURAN KONTRAK */}
          <button
            type="button"
            onClick={() => setActiveMainTab('kontrak')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeMainTab === 'kontrak'
                ? 'bg-[#1565C0] text-white shadow-md shadow-blue-700/25 ring-2 ring-blue-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeMainTab === 'kontrak' ? 'text-white' : 'text-slate-500'}`} />
            <span>Pengaturan Kontrak</span>
            {unconfiguredContractsCount > 0 ? (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeMainTab === 'kontrak'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {unconfiguredContractsCount} Belum Diatur
              </span>
            ) : (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeMainTab === 'kontrak'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                Semua Diatur
              </span>
            )}
          </button>
        </div>

        {/* Status / Aksi Cepat Sisi Kanan */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {activeMainTab === 'tagihan' ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-xs font-semibold text-slate-400">Periode:</span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                <Calendar className="w-3.5 h-3.5 text-[#1565C0]" />
                {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                type="button"
                onClick={() => setActiveMainTab('kontrak')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                title="Buka Tab Pengaturan Kontrak"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Buka Pengaturan Kontrak</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-xs font-semibold text-slate-400">Status:</span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Master Tarif ({contractsList.length} Kantin)
              </span>
              <button
                type="button"
                onClick={() => setActiveMainTab('tagihan')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                title="Kembali ke Tab Tagihan Bulanan"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>Lihat Tagihan Bulanan</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: TAGIHAN BULANAN
          ========================================================================= */}
      <div className={activeMainTab === 'tagihan' ? 'space-y-5' : 'hidden'}>
        {/* 4 KARTU STATISTIK FINANSIAL DENGAN QUICK FILTER INTERAKTIF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kartu 1: Total Tagihan Periode Ini (Klik untuk tampilkan semua) */}
          <div
            onClick={() => setStatusTagihanFilter('semua')}
            className={`bg-white rounded-2xl p-4.5 sm:p-5 border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
              statusTagihanFilter === 'semua'
                ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-xs'
                : 'border-slate-200/80 shadow-xs hover:shadow-md'
            }`}
            title="Klik untuk melihat seluruh tagihan kantin"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tagihan {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
              <div className="text-2xl font-black text-[#1565C0] tracking-tight">
                {formatRupiah(totalTagihanBulanIni)}
              </div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Rumus: Detik × Tarif × % SA
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Kartu 2: Total Detik Panggilan WBP */}
          <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Durasi Bicara WBP
              </span>
              <div className="text-2xl font-black text-slate-800 tracking-tight">
                {totalDetikBulanIni.toLocaleString('id-ID')}{' '}
                <span className="text-xs font-semibold text-slate-400">Detik</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 block">
                ≈ {Math.floor(totalDetikBulanIni / 60).toLocaleString('id-ID')} Menit Panggilan
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Kartu 3: Pembayaran Lunas (Riwayat Pembayaran - Klik untuk filter Lunas) */}
          <div
            onClick={() => setStatusTagihanFilter(statusTagihanFilter === 'LUNAS' ? 'semua' : 'LUNAS')}
            className={`bg-white rounded-2xl p-4.5 sm:p-5 border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
              statusTagihanFilter === 'LUNAS'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                : 'border-slate-200/80 shadow-xs hover:shadow-md'
            }`}
            title="Klik untuk memfilter riwayat pembayaran lunas (Review / Lihat Saja)"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Lunas (Riwayat Bayar)
              </span>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {billingReports.filter((r) => r.statusPembayaran === 'Lunas').length}{' '}
                <span className="text-xs font-semibold text-slate-400">/ {billingReports.length} Kantin</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{statusTagihanFilter === 'LUNAS' ? 'Filter Aktif (Klik Reset)' : 'Klik untuk filter riwayat'}</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Kartu 4: Menunggu Verifikasi ACC (Klik untuk filter Menunggu ACC) */}
          <div
            onClick={() => setStatusTagihanFilter(statusTagihanFilter === 'PENDING' ? 'semua' : 'PENDING')}
            className={`bg-white rounded-2xl p-4.5 sm:p-5 border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
              statusTagihanFilter === 'PENDING'
                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
                : 'border-slate-200/80 shadow-xs hover:shadow-md'
            }`}
            title="Klik untuk memfilter daftar tagihan yang menunggu verifikasi ACC"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Menunggu Verifikasi ACC
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
                    <span>{statusTagihanFilter === 'PENDING' ? 'Filter Aktif (Klik Reset)' : `${pendingRequests.length} Butuh persetujuan`}</span>
                  </>
                ) : (
                  'Tidak ada antrean ACC'
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

        {/* TABEL TAGIHAN BULANAN TERPADU */}
        <div className="space-y-4">
          {/* FILTER & PENCARIAN */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Periode Bulan & Tahun */}
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
                  <option value="BELUM_BAYAR">Belum Bayar</option>
                  <option value="PENDING">Menunggu ACC</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="TELAT">Telat</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-medium pl-1 hidden sm:inline">
                Menampilkan <strong>{filteredBillingReports.length}</strong> dari <strong>{billingReports.length}</strong> Kantin UPT
              </span>
            </div>

            {/* Pencarian Kantin / UPT */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari Kantin, UPT, atau Kanwil..."
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
                onClick={() => setActiveMainTab('kontrak')}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 cursor-pointer shrink-0"
                title="Buka Pengaturan Kontrak Tarif Kantin"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Pengaturan Kontrak</span>
              </button>

              <button
                type="button"
                onClick={() => loadData()}
                disabled={isLoadingBilling || isLoadingHistory}
                className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                title="Sinkronkan data tagihan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBilling || isLoadingHistory ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sinkronkan</span>
              </button>
            </div>
          </div>

          {/* TABEL DAFTAR SEMUA KANTIN DIKELOMPOKKAN PER UPT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-5">Nama Kantin</th>
                    <th className="py-3.5 px-4">UPT</th>
                    <th className="py-3.5 px-4 text-center">Total Detik</th>
                    <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                    <th className="py-3.5 px-4 text-center">Status Pembayaran</th>
                    <th className="py-3.5 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoadingBilling ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                        <span>Memuat daftar tagihan detik kantin...</span>
                      </td>
                    </tr>
                  ) : filteredBillingReports.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Tidak ada data kantin</p>
                        <p className="text-[11px] text-slate-400">Tidak ada kantin yang cocok dengan filter yang dipilih.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBillingReports.map((report) => {
                      const isPending = report.statusPembayaran === 'Menunggu ACC';
                      return (
                        <tr key={report.branchId} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Nama Kantin */}
                          <td className="py-4 px-5">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Store className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block leading-snug">
                                  {report.canteenName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Operator Kantin Lapas
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. UPT & Kanwil */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-800 block leading-snug">
                              {report.uptName}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {report.kanwilName}
                            </span>
                          </td>

                          {/* 3. Total Detik (dan dalam menit) */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-sm">
                              {report.totalSeconds.toLocaleString('id-ID')} detik
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                              ≈ {Math.floor(report.totalSeconds / 60).toLocaleString('id-ID')} menit
                            </div>
                          </td>

                          {/* 4. Total Tagihan (Rincian tarif & bagi hasil tersedia di tombol Detail) */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {report.isContractSet ? (
                              <div>
                                <div className="font-black text-[#1565C0] text-sm">
                                  {formatRupiah(report.totalAmount)}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Subtotal: {formatRupiah(report.subtotal)}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-black text-slate-400 text-sm">
                                  Rp 0
                                </div>
                                <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-0.5">
                                  Belum diatur
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 5. Status Pembayaran */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {report.statusPembayaran === 'Lunas' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lunas</span>
                              </span>
                            ) : report.statusPembayaran === 'Menunggu ACC' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Menunggu ACC</span>
                              </span>
                            ) : String(report.statusPembayaran || '').includes('Bulan Berjalan') ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>{report.statusPembayaran}</span>
                              </span>
                            ) : report.statusPembayaran === 'Telat' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Telat</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                                <span>Belum Bayar</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Aksi Terpadu (Periksa & ACC / Review & Lihat / Detail Tagihan) */}
                          <td className="py-4 px-5 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-2">
                              {isPending ? (
                                /* Aksi Utama saat Butuh Verifikasi: Periksa & ACC */
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetailModal(report)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 transition shadow-xs cursor-pointer group animate-pulse"
                                  title="Periksa bukti transfer dan lakukan persetujuan (ACC)"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                  <span>Periksa & ACC</span>
                                </button>
                              ) : report.statusPembayaran === 'Lunas' ? (
                                /* Aksi saat Lunas: Mode Review / Lihat Saja */
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetailModal(report)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                  title="Review rincian tagihan dan arsip bukti pembayaran lunas (Hanya Lihat)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Review / Lihat</span>
                                </button>
                              ) : (
                                /* Aksi saat Belum Bayar / Telat: Detail Tagihan */
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetailModal(report)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1565C0] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs"
                                  title="Lihat rincian tarif per detik, bagi hasil, dan formula tagihan"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#1565C0]" />
                                  <span>Detail</span>
                                </button>
                              )}

                              {/* Tombol Shortcut Atur Kontrak jika belum diatur */}
                              {!report.isContractSet && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMainTab('kontrak');
                                    handleOpenEditContract(report);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                                  title="Atur kontrak tarif tetap di Tab 2"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Atur</span>
                                </button>
                              )}
                            </div>
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
      </div>
      {/* END TAB 1: TAGIHAN BULANAN */}

      {/* =========================================================================
          TAB 2: PENGATURAN KONTRAK TARIF KANTIN (BARU)
          ========================================================================= */}
      <div className={activeMainTab === 'kontrak' ? 'space-y-4' : 'hidden'}>
          {/* Header Banner Penjelasan */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-blue-900/40">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Master Pengaturan Kontrak
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-blue-200 font-medium">Khusus Superadmin</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <Sliders className="w-6 h-6 text-blue-400" />
                  Pengaturan Kontrak Tarif Kantin
                </h3>
                <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                  Konfigurasi tarif per detik dan persentase bagi hasil (Superadmin &amp; Kantin) yang bersifat tetap per kantin. Tarif yang ditetapkan di sini akan otomatis diterapkan pada perhitungan Tagihan Bulanan seluruh UPT.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Total Kantin</span>
                  <span className="text-xl font-black text-white">{contractsList.length}</span>
                </div>
                <div className="px-4 py-3 bg-emerald-500/20 backdrop-blur-md rounded-2xl border border-emerald-400/30 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">Sudah Diatur</span>
                  <span className="text-xl font-black text-emerald-300">{configuredContractsCount}</span>
                </div>
                <div className="px-4 py-3 bg-amber-500/20 backdrop-blur-md rounded-2xl border border-amber-400/30 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-amber-200 block">Belum Diatur</span>
                  <span className="text-xl font-black text-amber-300">{unconfiguredContractsCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Toolbar Pencarian Tab 2 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Status Kontrak */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={statusContractFilter}
                  onChange={(e) => setStatusContractFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="semua">Semua Status Kontrak</option>
                  <option value="sudah_diatur">Sudah Diatur ({configuredContractsCount})</option>
                  <option value="belum_diatur">Belum Diatur ({unconfiguredContractsCount})</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-medium pl-1 hidden sm:inline">
                Menampilkan <strong>{filteredContracts.length}</strong> dari <strong>{contractsList.length}</strong> Kantin
              </span>
            </div>

            {/* Pencarian Kantin / UPT / Kanwil */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari Kantin, UPT, atau Kanwil..."
                  value={searchContract}
                  onChange={(e) => setSearchContract(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                {searchContract && (
                  <button
                    type="button"
                    onClick={() => setSearchContract('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveMainTab('tagihan')}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 cursor-pointer shrink-0"
                title="Kembali ke Tab Tagihan Bulanan"
              >
                <Receipt className="w-3.5 h-3.5 text-[#1565C0]" />
                <span className="hidden sm:inline">Tagihan Bulanan</span>
              </button>

              <button
                type="button"
                onClick={() => loadContractsData()}
                disabled={isLoadingContracts}
                className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                title="Muat ulang daftar kontrak"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContracts ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* TABEL PENGATURAN KONTRAK TARIF KANTIN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nama Kantin</th>
                    <th className="py-3.5 px-4">UPT &amp; Kanwil</th>
                    <th className="py-3.5 px-4 text-right">Tarif per Detik</th>
                    <th className="py-3.5 px-4 text-center">Bagi Hasil (SA %, Kantin %)</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoadingContracts ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                        <span>Memuat data kontrak tarif kantin...</span>
                      </td>
                    </tr>
                  ) : filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Tidak ada data kantin</p>
                        <p className="text-[11px] text-slate-400">Tidak ada kantin yang cocok dengan filter yang dipilih.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => (
                      <tr key={c.branchId} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Nama Kantin */}
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                              <Store className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block leading-snug">
                                {c.canteenName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Operator Kantin Lapas
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. UPT & Kanwil */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-800 block leading-snug">
                            {c.uptName}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {c.kanwilName}
                          </span>
                        </td>

                        {/* 3. Tarif per Detik */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {c.isContractSet ? (
                            <span className="font-black text-slate-900 text-sm">
                              {formatRupiah(c.ratePerSecond)}/detik
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>Belum diatur</span>
                            </span>
                          )}
                        </td>

                        {/* 4. Bagi Hasil (SA %, Kantin %) */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {c.isContractSet ? (
                            <div className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl text-xs">
                              <Percent className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>SA: {c.superadminPercent}%</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-emerald-700">Kantin: {c.canteenPercent}%</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>Belum diatur</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Aksi (Atur/Edit) - HANYA SUPERADMIN */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {isSuperadmin ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditContract(c)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                                c.isContractSet
                                  ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                  : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white shadow-sm font-black'
                              }`}
                              title={c.isContractSet ? 'Ubah kontrak tarif tetap kantin' : 'Atur kontrak tarif tetap kantin'}
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>{c.isContractSet ? 'Edit' : 'Atur'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">Read-Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/* END TAB 2: PENGATURAN KONTRAK */}

      {/* =========================================================================
          MODAL 1: EDIT KONTRAK TARIF KANTIN (HANYA SUPERADMIN)
          ========================================================================= */}
      {editContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  Atur Kontrak Tarif Kantin
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editContractModal.canteenName} • {editContractModal.uptName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditContractModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Input Tarif per Detik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarif per Detik (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="Contoh: 10"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tarif yang dikenakan untuk setiap 1 detik durasi panggilan WBP.
                </p>
              </div>

              {/* Input Bagi Hasil: Persen SA (Input) dan Persen Kantin (Tampil, tidak diinput) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Form Kiri: Input Persen SA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bagi Hasil Superadmin / SA (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      placeholder="Contoh: 60"
                      value={editSuperadminPercent}
                      onChange={(e) => handleSuperadminPercentChange(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Porsi yang disetor ke Superadmin (Total Tagihan).
                  </p>
                </div>

                {/* Form Kanan: Tampilan Persen Kantin (Read-only, otomatis = 100 - SA) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bagi Hasil Kantin (%) <span className="text-slate-400 font-normal">(Otomatis)</span>
                  </label>
                  <div className="w-full pl-3.5 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="text-slate-800 text-sm font-black">
                      {editSuperadminPercent !== '' && !isNaN(Number(editSuperadminPercent))
                        ? Math.max(0, Math.min(100, 100 - Number(editSuperadminPercent)))
                        : 40}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      100% - SA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hak porsi operasional kantin (tampil otomatis).
                  </p>
                </div>
              </div>

              {/* Live Preview Perhitungan Rumus Tagihan */}
              {(() => {
                const rateNum = Number(editRate) || 0;
                const saPercentNum = editSuperadminPercent !== '' && !isNaN(Number(editSuperadminPercent))
                  ? Math.max(0, Math.min(100, Number(editSuperadminPercent)))
                  : 60;
                const canteenPercentNum = Math.max(0, 100 - saPercentNum);
                const displaySeconds = (editContractModal.totalSeconds && editContractModal.totalSeconds > 0)
                  ? editContractModal.totalSeconds
                  : 1140;
                const isSimulatedSec = !(editContractModal.totalSeconds && editContractModal.totalSeconds > 0);
                const subtotal = displaySeconds * rateNum;
                const totalTagihan = Math.round(subtotal * (saPercentNum / 100));
                const hakKantin = Math.round(subtotal * (canteenPercentNum / 100));

                return (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Simulasi Rumus Tagihan</span>
                      <span className="text-blue-600 font-bold">
                        {isSimulatedSec ? 'Contoh 1.140 Detik' : 'Detik Riil Kantin'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Detik Panggilan:</span>
                        <span className="font-bold text-slate-800">
                          {displaySeconds.toLocaleString('id-ID')} detik {isSimulatedSec && <span className="text-[10px] text-slate-400 font-normal">(contoh simulasi)</span>}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal ({displaySeconds.toLocaleString('id-ID')} detik × Rp {rateNum.toLocaleString('id-ID')}):</span>
                        <span className="font-bold text-slate-800">
                          {formatRupiah(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Bagi Hasil (SA / Kantin):</span>
                        <span className="font-bold text-slate-800">
                          {saPercentNum}% SA • {canteenPercentNum}% Kantin
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                        <span>• Porsi Hak Kantin ({canteenPercentNum}%):</span>
                        <span className="font-semibold text-emerald-700">
                          {formatRupiah(hakKantin)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                        <div>
                          <span>Total Tagihan Disetor (SA):</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Subtotal × {saPercentNum}% Persen SA
                          </span>
                        </div>
                        <span className="text-blue-600 font-black text-base">
                          {formatRupiah(totalTagihan)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditContractModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingContract}
                  className="px-5 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingContract ? 'Menyimpan...' : 'Simpan Kontrak Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETAIL TERPADU:
          1. Rincian Perhitungan Tagihan Kantin Berbasis Detik
          2. Detail Pembayaran & Bukti Transfer Kantin (Gambar & Aksi Berkas)
          3. Verifikasi Pembayaran (Jika Menunggu ACC) / Mode Review (Jika Lunas)
          ========================================================================= */}
      {detailModalItem && (() => {
        const payment = detailModalItem.matchedPayment || detailModalItem.paymentProof;
        const isPending = detailModalItem.statusPembayaran === 'Menunggu ACC';
        const isLunas = detailModalItem.statusPembayaran === 'Lunas';
        const isTelat = detailModalItem.statusPembayaran === 'Telat';
        const hasPayment = !!payment;
        const proofResolvedUrl = payment?.proofUrl
          ? resolveProofUrl(payment.proofUrl, payment)
          : (detailModalItem.proofUrl ? resolveProofUrl(detailModalItem.proofUrl, detailModalItem) : null);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl lg:max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 text-left animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden">
              
              {/* Header Modal */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-white shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-2xl bg-blue-50 text-[#1565C0] border border-blue-100 flex items-center justify-center">
                      <Calculator className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Detail Tagihan & Pembayaran Kantin
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {detailModalItem.canteenName} • {detailModalItem.uptName} • Periode {monthNames[selectedMonth - 1]} {selectedYear}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Status Badge */}
                  {isLunas ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lunas (Terverifikasi)</span>
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Menunggu ACC</span>
                    </span>
                  ) : String(detailModalItem.statusPembayaran || '').includes('Bulan Berjalan') ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{detailModalItem.statusPembayaran}</span>
                    </span>
                  ) : isTelat ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Telat Bayar</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Belum Bayar</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalItem(null);
                      setDetailModalRejectMode(false);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Modal (Scrollable) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

                {/* -------------------------------------------------------------
                    BAGIAN 1: RINCIAN TAGIHAN KANTIN BERBASIS DETIK
                    ------------------------------------------------------------- */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Coins className="w-4 h-4 text-blue-600" />
                      1. Rincian Perhitungan Tagihan Kantin (Berbasis Detik)
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Rumus: Detik × Tarif × % SA
                    </span>
                  </div>

                  {!detailModalItem.isContractSet && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Kontrak tarif belum diatur oleh Superadmin. Total tagihan saat ini Rp 0.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Total Detik */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block mb-0.5 font-medium">Total Detik Bicara WBP:</span>
                      <span className="text-sm font-black text-slate-900 block">
                        {detailModalItem.totalSeconds.toLocaleString('id-ID')} Detik
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                        ≈ {Math.floor(detailModalItem.totalSeconds / 60).toLocaleString('id-ID')} menit bicara
                      </span>
                    </div>

                    {/* Tarif Kontrak per Detik */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block mb-0.5 font-medium">Tarif Kontrak per Detik:</span>
                      <span className="text-sm font-black text-slate-900 block">
                        {detailModalItem.isContractSet
                          ? `${formatRupiah(detailModalItem.ratePerSecond)} / detik`
                          : 'Belum diatur'}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Ditetapkan oleh Superadmin
                      </span>
                    </div>

                    {/* Subtotal Kotor */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block mb-0.5 font-medium">Subtotal (Detik × Tarif):</span>
                      <span className="text-sm font-black text-slate-900 block">
                        {formatRupiah(detailModalItem.subtotal)}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Sebelum pembagian bagi hasil
                      </span>
                    </div>

                    {/* Pembagian Persen */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 block mb-0.5 font-medium">Bagi Hasil SA / Kantin:</span>
                      <span className="text-sm font-black text-blue-700 block">
                        {detailModalItem.isContractSet
                          ? `${detailModalItem.superadminPercent ?? 60}% SA • ${detailModalItem.canteenPercent ?? 40}% Kantin`
                          : 'Belum diatur'}
                      </span>
                      {detailModalItem.isContractSet && (
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                          Hak Kantin ({detailModalItem.canteenPercent ?? 40}%): {formatRupiah(detailModalItem.canteenShare || Math.round((detailModalItem.subtotal || 0) * (Number(detailModalItem.canteenPercent || 40) / 100)))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlight Total Tagihan yang Disetor */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-blue-950 uppercase tracking-wider block">
                        Total Tagihan Bersih (Disetor ke Superadmin):
                      </span>
                      <span className="text-[11px] text-blue-700 font-medium">
                        Subtotal × {detailModalItem.superadminPercent ?? 60}% Porsi SA
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-[#1565C0] tracking-tight">
                        {formatRupiah(detailModalItem.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    BAGIAN 2: DETAIL PEMBAYARAN & BERKAS BUKTI TRANSFER
                    ------------------------------------------------------------- */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      2. Detail Pembayaran & Bukti Transfer Kantin
                    </h4>
                    {hasPayment && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {payment.id || 'TRX-TAGIHAN'}
                      </span>
                    )}
                  </div>

                  {hasPayment ? (
                    <div className="space-y-4">
                      {/* Grid Rincian Transaksi Transfer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block mb-0.5">Waktu Transfer / Upload:</span>
                          <span className="font-bold text-slate-800 block">
                            {formatTanggal(payment.tanggal || payment.createdAt || new Date())}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block mb-0.5">Petugas Kantin Pengirim:</span>
                          <span className="font-bold text-slate-800 block">
                            {payment.staffName || `Operator ${detailModalItem.canteenName}`}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block mb-0.5">Nominal Ditransfer:</span>
                          <span className="font-black text-sm text-[#1565C0] block">
                            {formatRupiah(payment.totalBayar || payment.nominal || detailModalItem.totalAmount)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                          <span className="text-slate-500 block mb-0.5">Metode / Bank Tujuan:</span>
                          <span className="font-bold text-slate-800 block">
                            {payment.bankTarget || 'Bank Transfer / QRIS'}
                          </span>
                        </div>
                      </div>

                      {/* Box Pratinjau Berkas Bukti Transfer */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 block">
                          Berkas Bukti Transfer Pembayaran:
                        </span>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[220px] text-center">
                          {proofResolvedUrl && proofResolvedUrl !== 'virtual-proof' ? (
                            <img
                              src={proofResolvedUrl}
                              alt="Bukti Transfer Kantin"
                              className="max-h-72 max-w-full rounded-xl object-contain border border-slate-200 shadow-sm bg-white"
                            />
                          ) : (
                            /* Dokumen Struk Digital Elegan jika file fisik kosong / offline */
                            <div className="w-full max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-left">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                <div>
                                  <span className="font-black text-sm text-[#1565C0] block">PasCall Billing</span>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                    Dokumen Struk Transfer Tagihan
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isLunas
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {isLunas ? 'LUNAS (ACC)' : 'MENUNGGU VERIFIKASI'}
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Asal Kantin:</span>
                                  <span className="font-bold text-slate-800">{detailModalItem.canteenName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">UPT Cabang:</span>
                                  <span className="font-bold text-slate-800">{detailModalItem.uptName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Nominal Transfer:</span>
                                  <span className="font-black text-[#1565C0]">
                                    {formatRupiah(payment.totalBayar || payment.nominal || detailModalItem.totalAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tombol aksi buka & unduh berkas */}
                          <div className="mt-3 flex items-center justify-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (proofResolvedUrl && proofResolvedUrl !== 'virtual-proof') {
                                  window.open(proofResolvedUrl, '_blank');
                                } else {
                                  handleViewProof(detailModalItem);
                                }
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs hover:bg-blue-50 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Ukuran Penuh (Tab Baru)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleViewProof(detailModalItem);
                              }}
                              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh / Simpan Berkas</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tampilan jika Kantin Belum Bayar / Belum Upload Bukti */
                    <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Kantin Belum Mengunggah Bukti Pembayaran
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                        Tagihan periode {monthNames[selectedMonth - 1]} {selectedYear} belum dibayarkan oleh pengelola kantin. Pembayaran dapat dilakukan via Transfer Bank / QRIS dan struk diunggah oleh kantin sebelum batas jatuh tempo.
                      </p>
                    </div>
                  )}
                </div>

                {/* -------------------------------------------------------------
                    BAGIAN 3: VERIFIKASI PEMBAYARAN (ACC) ATAU MODE REVIEW ARSIP
                    ------------------------------------------------------------- */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      {isPending ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                          3. Aksi Verifikasi Pembayaran (ACC Superadmin)
                        </>
                      ) : isLunas ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          3. Arsip Riwayat Pembayaran (Mode Review / Lihat Saja)
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-slate-500" />
                          3. Status Tagihan
                        </>
                      )}
                    </h4>
                    {isLunas && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Mode Review / Lihat Saja
                      </span>
                    )}
                  </div>

                  {/* KONDISI A: JIKA MENUNGGU ACC -> FORM VERIFIKASI AKTIF */}
                  {isPending && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
                        <span className="font-bold block mb-1">Pemberitahuan Verifikasi:</span>
                        Pastikan nominal transfer di atas ({formatRupiah(payment?.totalBayar || payment?.nominal || detailModalItem.totalAmount)}) telah sesuai dengan mutasi rekening kas sebelum menekan tombol Setujui (ACC).
                      </div>

                      {/* Catatan Persetujuan (Opsional) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Catatan Verifikasi Persetujuan (Opsional):
                        </label>
                        <input
                          type="text"
                          value={detailModalNotes}
                          onChange={(e) => setDetailModalNotes(e.target.value)}
                          placeholder="Contoh: Dana telah masuk rekening giro BSI PasCall"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Form Penolakan (Toggle jika ditolak) */}
                      {detailModalRejectMode && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                          <label className="block text-xs font-bold text-rose-800">
                            Alasan Penolakan Pembayaran <span className="text-rose-600">*</span>:
                          </label>
                          <textarea
                            rows={3}
                            value={detailModalReason}
                            onChange={(e) => setDetailModalReason(e.target.value)}
                            placeholder="Tuliskan alasan penolakan, contoh: Bukti transfer tidak terbaca / nominal transfer kurang"
                            required
                            className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalRejectMode(false);
                                setDetailModalReason('');
                              }}
                              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                            >
                              Batal Tolak
                            </button>
                            <button
                              type="button"
                              onClick={handleRejectFromDetailModal}
                              disabled={isProcessingModalAction}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {isProcessingModalAction ? 'Memproses...' : 'Konfirmasi Tolak Pembayaran'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tombol Utama Verifikasi */}
                      {!detailModalRejectMode && (
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setDetailModalRejectMode(true)}
                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                          >
                            Tolak Pembayaran...
                          </button>
                          <button
                            type="button"
                            onClick={handleApproveFromDetailModal}
                            disabled={isProcessingModalAction}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>{isProcessingModalAction ? 'Memproses ACC...' : 'Setujui Pembayaran (ACC)'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KONDISI B: JIKA SUDAH LUNAS -> MODE REVIEW / LIHAT SAJA (READ-ONLY) */}
                  {isLunas && (
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <span className="font-black text-emerald-900 block text-sm">
                            Pembayaran Telah Disetujui (Lunas)
                          </span>
                          <p className="text-emerald-800 leading-relaxed">
                            Tagihan periode ini telah diverifikasi dan lunas tercatat di buku kas sistem. Transaksi ini bersifat tetap sebagai arsip riwayat pembayaran <strong>(Mode Review / Lihat Saja)</strong>.
                          </p>
                          {payment?.approvedAt && (
                            <span className="text-[11px] text-emerald-700 font-semibold block pt-1">
                              Waktu Persetujuan: {formatTanggal(payment.approvedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Catatan Verifikasi Read-Only */}
                      {(payment?.notes || detailModalItem.contractNote) && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                          <span className="font-bold text-slate-500 block mb-0.5">Catatan Verifikasi Superadmin:</span>
                          <span className="italic">"{payment?.notes || detailModalItem.contractNote}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KONDISI C: JIKA BELUM BAYAR / TELAT */}
                  {!isPending && !isLunas && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2">
                      <p className="leading-relaxed">
                        Tagihan kantin ini masih menunggu pelunasan. Jika tarif per detik atau persentase bagi hasil perlu diubah sebelum kantin membayar, Anda dapat memperbaruinya di Tab Pengaturan Kontrak.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer Modal */}
              <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      setActiveMainTab('kontrak');
                      handleOpenEditContract(item);
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ubah Kontrak Tarif Ini</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalItem(null);
                    setDetailModalRejectMode(false);
                  }}
                  className="ml-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL 3: APPROVE / REJECT TOPUP MODAL
          ========================================================================= */}
      {topupActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-base font-bold text-slate-900">
                {topupActionModal.action === 'approve'
                  ? 'Konfirmasi Persetujuan (ACC)'
                  : 'Konfirmasi Penolakan'}
              </h4>
              <button
                type="button"
                onClick={() => setTopupActionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Asal UPT / Kantin:</span>
                  <span className="font-bold text-slate-800">
                    {topupActionModal.item.branchName || topupActionModal.item.canteenName || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Transfer:</span>
                  <span className="font-black text-[#1565C0]">
                    {formatRupiah(topupActionModal.item.totalBayar || topupActionModal.item.nominal)}
                  </span>
                </div>
              </div>

              {topupActionModal.action === 'approve' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Persetujuan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Contoh: Pembayaran tagihan telah diverifikasi masuk rekening"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Contoh: Bukti transfer buram / nominal tidak sesuai"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTopupActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmTopupAction}
                disabled={isProcessingAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50 ${
                  topupActionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessingAction
                  ? 'Memproses...'
                  : topupActionModal.action === 'approve'
                  ? 'Setujui Pembayaran'
                  : 'Tolak Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: PREVIEW BUKTI TRANSFER PEMBAYARAN
          ========================================================================= */}
      {proofPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 text-left animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                Bukti Transfer Pembayaran Kantin
              </h4>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 text-center bg-slate-50 flex flex-col items-center justify-center min-h-[260px]">
              {!proofImageFailed && proofPreviewUrl !== 'virtual-proof' ? (
                <img
                  src={proofPreviewUrl}
                  alt="Bukti Transfer"
                  onError={() => setProofImageFailed(true)}
                  className="max-h-96 max-w-full rounded-xl object-contain border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-full max-w-sm bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-left">
                  <div className="text-center pb-3 border-b border-slate-100 mb-3">
                    <span className="font-black text-base text-blue-600">PasCall</span>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                      Dokumen Bukti Transfer Tagihan
                    </p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Asal UPT:</span>
                      <span className="font-bold text-slate-800">{proofPreviewItem?.branchName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nominal Tagihan:</span>
                      <span className="font-black text-[#1565C0]">
                        {formatRupiah(proofPreviewItem?.totalBayar || proofPreviewItem?.nominal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewTabProof}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Baru</span>
                </button>
                {!proofImageFailed && (
                  <button
                    type="button"
                    onClick={handleDownloadProof}
                    disabled={isDownloadingProof}
                    className="text-xs font-bold text-slate-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DETAIL RIWAYAT PEMBAYARAN
          ========================================================================= */}
      {historyDetailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Detail Riwayat Pembayaran</h4>
                <p className="text-xs text-slate-400 font-mono">{historyDetailModalItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDetailModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Asal UPT:</span>
                <span className="font-bold text-slate-800">{historyDetailModalItem.branchName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Waktu Pembayaran:</span>
                <span className="font-medium text-slate-700">{formatTanggal(historyDetailModalItem.tanggal || historyDetailModalItem.createdAt)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-slate-100">
                <span>Total Transfer:</span>
                <span className="text-[#1565C0] font-black text-sm">{formatRupiah(historyDetailModalItem.totalBayar || historyDetailModalItem.nominal)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span>Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  historyDetailModalItem.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {historyDetailModalItem.status === 'APPROVED' ? 'Lunas (Disetujui)' : 'Ditolak'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryDetailModalItem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
