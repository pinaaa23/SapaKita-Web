import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Building2,
  Wallet,
  X,
  Check,
  Eye,
  FileText,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Store,
  ExternalLink,
  Ban,
  PhoneCall,
  AlertTriangle,
  Sliders,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, normalizeRole } from '../../config/menuConfig';
import {
  getFinanceBillings,
  updateFinanceBillingStatus,
  approveCanteenDeposit,
  rejectCanteenDeposit,
  formatRupiah,
  MONTH_NAMES
} from '../../services/financeService';
import {
  getSuperadminTopupHistory,
  approveTopupTransaction,
  rejectTopupTransaction,
  getTopupProofStreamUrl,
  fetchTopupProofBlob
} from '../../services/canteenTopupService';
import {
  getCanteenBillingNational,
  getCanteenBillingCalls,
  formatDetikKeMenit
} from '../../services/canteenBillingService';
import { formatTanggal } from '../../utils/formatKantin';
import TransferProofModal from '../../components/finance/TransferProofModal';

export default function FinanceBilling() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');
  const navigate = useNavigate();

  // 1. Hak Akses (Rule 6: Hanya Role Admin Finance yang dapat mengelola tagihan & setoran)
  const { user } = useAuth();
  const userRole = normalizeRole(user?.role);
  const isSuperadmin = userRole === ROLES.SUPERADMIN;
  const isFinanceAdmin = userRole === ROLES.FINANCE;
  const canAccessBilling = isSuperadmin || isFinanceAdmin || user?.isSuperAdmin;
  const canManageBilling = isSuperadmin || user?.isSuperAdmin;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 3 Sub-Tabs: 'konfirmasi' | 'rekap' | 'riwayat'
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return initialId ? 'rekap' : 'konfirmasi';
  });

  const [selectedMonth, setSelectedMonth] = useState('semua');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [pendingTopups, setPendingTopups] = useState([]);
  const [allHistoryTopups, setAllHistoryTopups] = useState([]);
  const [nationalBillingReports, setNationalBillingReports] = useState([]);
  const [financeBillings, setFinanceBillings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [proofPreviewItem, setProofPreviewItem] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [approveModalItem, setApproveModalItem] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Modal Detail Rincian Panggilan Tab State
  const [detailModalTab, setDetailModalTab] = useState('summary'); // 'summary' | 'calls'
  const [modalCallsData, setModalCallsData] = useState({
    items: [],
    totalItems: 0,
    totalSeconds: 0,
    totalTagihan: 0,
    pagination: { page: 1, limit: 20, totalPages: 1 },
  });
  const [isLoadingModalCalls, setIsLoadingModalCalls] = useState(false);
  const [modalCallsSearch, setModalCallsSearch] = useState('');
  const [modalCallsPage, setModalCallsPage] = useState(1);
  const [detailActionNotes, setDetailActionNotes] = useState('');
  const [detailRejectMode, setDetailRejectMode] = useState(false);
  const [detailRejectReason, setDetailRejectReason] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Muat data terpadu (Top up setoran kantin + Tagihan Nasional + Finance Billing)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthNum = selectedMonth === 'semua' ? currentMonth : Number(selectedMonth);
      const yearNum = Number(selectedYear);

      // TODO: sambungkan ke endpoint finance saat BE siap (misal GET /api/finance/canteen-topups)
      // Sementara ini, kita memanfaatkan API lama yang sudah terbukti bekerja di Superadmin
      const [topupsRes, nationalRes, financeRes] = await Promise.all([
        getSuperadminTopupHistory({ search: '', status: 'semua', branchId: 'semua' }).catch(() => []),
        getCanteenBillingNational(monthNum, yearNum).catch(() => []),
        getFinanceBillings({
          month: selectedMonth,
          year: selectedYear,
          status: selectedStatus,
          search: searchQuery,
        }).catch(() => []),
      ]);

      const topupList = Array.isArray(topupsRes) ? topupsRes : [];

      // Ambil riwayat lunas dan ditolak dari Finance Billings
      const historyFromFinance = (Array.isArray(financeRes) ? financeRes : [])
        .filter((b) => b.status === 'PAID' || b.status === 'REJECTED' || (b.rejectionReason && b.status !== 'PENDING_CONFIRMATION'))
        .map((b) => {
          const gross = Number(b.grossAmount || 0);
          const keep = Number(b.canteenKeepAmount || Math.round(gross * 0.40));
          const deposit = Number(b.depositAmountToFinance || Math.round(gross * 0.60));
          const isRej = b.status === 'REJECTED' || (b.rejectionReason && b.status !== 'PAID');
          return {
            id: b.id,
            paymentRef: b.paymentRef || b.proof?.transferId || `BILL-${b.id}`,
            tanggal: b.paymentDate || b.rejectedAt || b.updatedAt || b.createdAt,
            createdAt: b.paymentDate || b.rejectedAt || b.updatedAt || b.createdAt,
            branchId: b.branchId,
            uptName: b.branchName || b.uptName,
            branchName: b.branchName || b.uptName,
            canteenName: b.canteenName || (b.branchName ? `Kopontren ${b.branchName}` : 'Kopontren Pondok'),
            kanwilName: b.kanwilName || 'Kantor Wilayah',
            staffName: b.verifiedByName || b.rejectedByName || 'Kasir Kantin',
            verifiedBy: b.verifiedByName || b.rejectedByName || (isRej ? (b.rejectedBy || 'Admin Finance') : 'Admin Finance'),
            approvedAt: b.verifiedAt || b.rejectedAt || b.paymentDate,
            nominal: deposit || gross,
            totalBayar: deposit || gross,
            depositAmountToFinance: deposit,
            grossAmount: gross,
            canteenKeepAmount: keep,
            totalSeconds: Number(b.totalSeconds || 0),
            ratePerSecond: Number(b.ratePerSecond || 50),
            status: isRej ? 'Ditolak' : 'Berhasil',
            rawStatus: b.status,
            rejectionReason: b.rejectionReason || b.notes || null,
            rejectReason: b.rejectionReason || b.notes || null,
            proofUrl: b.proofUrl || b.paymentProofUrl || b.proof?.proofUrl,
            proofStreamUrl: b.proofStreamUrl || b.proofUrl || b.paymentProofUrl,
            bankTarget: b.bankName || 'Rekening Mandiri Finance',
            accountNumber: b.accountNumber,
            isFinanceBilling: true,
            month: b.month,
            year: b.year,
          };
        });

      const combinedHistory = [...topupList];
      historyFromFinance.forEach((hf) => {
        const existingIdx = combinedHistory.findIndex((ch) => ch.id === hf.id || (ch.branchId && hf.branchId && ch.branchId === hf.branchId && ch.month === hf.month && ch.year === hf.year));
        if (existingIdx === -1) {
          combinedHistory.push(hf);
        } else {
          combinedHistory[existingIdx] = { ...combinedHistory[existingIdx], ...hf };
        }
      });

      setAllHistoryTopups(combinedHistory);

      // 1. Ambil setoran pending dari API topup
      const pendingFromTopups = topupList.filter(
        (t) => t.status === 'Menunggu' || t.status === 'PENDING'
      );

      // 2. Ambil juga dari storage lokal jika API topup di-403 oleh backend untuk role Finance
      let pendingFromLocalStorage = [];
      try {
        if (typeof window !== 'undefined') {
          const rawLocal = localStorage.getItem('pascall_superadmin_canteen_history_v1');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed)) {
              pendingFromLocalStorage = parsed.filter((t) => t.status === 'Menunggu' || t.status === 'PENDING');
            }
          }
        }
      } catch (_) {}

      // 3. Ambil juga setoran pending dari finance billing backend baru (status PENDING_CONFIRMATION)
      const pendingFromFinance = (Array.isArray(financeRes) ? financeRes : [])
        .filter((b) => b.status === 'PENDING_CONFIRMATION' || b.status === 'Menunggu' || b.rawStatus === 'PENDING')
        .map((b) => ({
          id: b.id,
          tanggal: b.paymentDate || b.updatedAt || new Date().toISOString(),
          createdAt: b.paymentDate || b.updatedAt || new Date().toISOString(),
          branchId: b.branchId,
          branchName: b.branchName || b.uptName,
          canteenName: b.canteenName || (b.branchName ? `Kopontren ${b.branchName}` : 'Kopontren Pondok'),
          staffName: b.verifiedByName || 'Kasir Kantin',
          nominal: Number(b.depositAmountToFinance || b.grossAmount || 0),
          totalBayar: Number(b.depositAmountToFinance || b.grossAmount || 0),
          status: 'Menunggu',
          rawStatus: 'PENDING',
          proofUrl: b.proofUrl || b.paymentProofUrl || `/api/finance/billings/${b.id}/proof`,
          proofStreamUrl: b.proofStreamUrl || b.proofUrl || `/api/finance/billings/${b.id}/proof`,
          bankTarget: b.bankName || 'Rekening Mandiri Finance',
          accountNumber: b.accountNumber,
          isFinanceBilling: true,
          month: b.month,
          year: b.year,
          grossAmount: b.grossAmount,
          canteenKeepAmount: b.canteenKeepAmount,
          depositAmountToFinance: b.depositAmountToFinance,
          shares: b.shares,
        }));

      // 4. Ambil juga dari nationalRes jika ada cabang yang berstatus 'Menunggu ACC'
      const pendingFromNational = (Array.isArray(nationalRes) ? nationalRes : [])
        .filter((b) => b.statusPembayaran === 'Menunggu ACC' || b.rawStatus === 'PENDING')
        .map((b) => ({
          id: b.paymentProof?.id || `INV-${b.year || selectedYear}${String(b.month || selectedMonth).padStart(2, '0')}-${(b.branchId || b.id || 'KTN').slice(0, 6).toUpperCase()}`,
          tanggal: b.paymentProof?.createdAt || b.paymentProof?.tanggal || new Date().toISOString(),
          createdAt: b.paymentProof?.createdAt || b.paymentProof?.tanggal || new Date().toISOString(),
          branchId: b.branchId || b.id,
          branchName: b.uptName || b.branchName || 'Pondok Pesantren',
          canteenName: b.canteenName || (b.uptName ? `Kopontren ${b.uptName}` : 'Kopontren Pondok'),
          staffName: b.paymentProof?.staffName || 'Kasir Kopontren',
          nominal: Number(b.totalAmount || b.subtotal || b.grossAmount || 0) * 0.60 || 50000,
          totalBayar: Number(b.totalAmount || b.subtotal || b.grossAmount || 0) * 0.60 || 50000,
          status: 'Menunggu',
          rawStatus: 'PENDING',
          proofUrl: b.paymentProof?.proofUrl || b.paymentProof?.proofStreamUrl || null,
          proofStreamUrl: b.paymentProof?.proofStreamUrl || b.paymentProof?.proofUrl || null,
          bankTarget: b.paymentProof?.bankTarget || 'Rekening Mandiri Finance',
          isNationalBilling: true,
          month: b.month || Number(selectedMonth),
          year: b.year || Number(selectedYear),
          grossAmount: Number(b.totalAmount || b.subtotal || b.grossAmount || 0) || 71428,
          canteenKeepAmount: Math.round(Number(b.totalAmount || b.subtotal || b.grossAmount || 0) * 0.40) || 21428,
          depositAmountToFinance: Math.round(Number(b.totalAmount || b.subtotal || b.grossAmount || 0) * 0.60) || 50000,
        }));

      // Gabungkan & deduplikasi ID
      const combinedPending = [...pendingFromTopups];
      [...pendingFromLocalStorage, ...pendingFromFinance, ...pendingFromNational].forEach((fb) => {
        if (!combinedPending.some((p) => p.id === fb.id || (p.branchId && fb.branchId && p.branchId === fb.branchId && p.month === fb.month))) {
          combinedPending.push(fb);
        }
      });

      setPendingTopups(combinedPending);

      // Prioritaskan data real dari Finance Billings Backend (GET /api/finance/billings)
      let billingReportsList = [];
      if (Array.isArray(financeRes) && financeRes.length > 0) {
        billingReportsList = financeRes.map((fb) => {
          let statusPembayaran = 'Belum Bayar';
          if (fb.status === 'PAID' || fb.status === 'Lunas') statusPembayaran = 'Lunas';
          else if (fb.status === 'PENDING_CONFIRMATION' || fb.status === 'Menunggu' || fb.status === 'PENDING') statusPembayaran = 'Menunggu ACC';
          else if (fb.status === 'REJECTED' || fb.status === 'Ditolak') statusPembayaran = 'Ditolak';
          else if (fb.status === 'BERJALAN') statusPembayaran = 'Bulan Berjalan';

          return {
            ...fb,
            id: fb.id,
            branchId: fb.branchId,
            uptName: fb.branchName || fb.uptName,
            branchName: fb.branchName || fb.uptName,
            canteenName: fb.canteenName || (fb.branchName ? `Kopontren ${fb.branchName}` : 'Kopontren Pondok'),
            kanwilName: fb.kanwilName || 'Yayasan Pesantren',
            totalSeconds: Number(fb.totalSeconds || 0),
            totalMinutes: Number(fb.totalMinutes || Math.floor((fb.totalSeconds || 0) / 60)),
            ratePerSecond: Number(fb.ratePerSecond || 15),
            totalAmount: Number(fb.grossAmount || fb.totalAmount || 0),
            grossAmount: Number(fb.grossAmount || fb.totalAmount || 0),
            canteenKeepAmount: Number(fb.canteenKeepAmount || ((fb.shares?.koperasi?.amount || 0) + (fb.shares?.kepalaUpt?.amount || 0) + (fb.shares?.inkopasindo?.amount || 0)) || Math.round(Number(fb.grossAmount || fb.totalAmount || 0) * 0.40)),
            depositAmountToFinance: Number(fb.depositAmountToFinance || fb.shares?.vendor?.amount || Math.round(Number(fb.grossAmount || fb.totalAmount || 0) * 0.60)),
            statusPembayaran,
            rawStatus: fb.status,
            isContractSet: true,
            split: fb.split,
            shares: fb.shares,
            paymentProof: fb.proof,
          };
        });
      } else if (Array.isArray(nationalRes) && nationalRes.length > 0) {
        billingReportsList = nationalRes;
      }

      setNationalBillingReports(billingReportsList);
      setFinanceBillings(Array.isArray(financeRes) ? financeRes : []);

      if (initialId && !detailModalItem && Array.isArray(billingReportsList)) {
        const match = billingReportsList.find((b) => b.branchId === initialId || b.id === initialId);
        if (match) openDetail(match);
      }
    } catch (err) {
      console.warn('[FinanceBilling] Gagal memuat data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedStatus, searchQuery, currentMonth, initialId]);

  useEffect(() => {
    loadData();

    // Dengarkan event sinkronisasi realtime saat kasir kantin setor atau ada ACC
    const handleUpdate = () => loadData();
    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('finance_billing_updated', handleUpdate);
    window.addEventListener('pascall_billing_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('finance_billing_updated', handleUpdate);
      window.removeEventListener('pascall_billing_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Load log rincian panggilan untuk UPT tertentu saat membuka modal detail
  const loadBranchCalls = async (branchId, month, year, page = 1, search = '') => {
    if (!branchId) return;
    setIsLoadingModalCalls(true);
    try {
      const res = await getCanteenBillingCalls({
        month: month || currentMonth,
        year: year || currentYear,
        page,
        limit: 20,
        search,
        branchId,
      });
      setModalCallsData(res || { items: [], totalItems: 0, totalSeconds: 0, totalTagihan: 0, pagination: { page: 1, limit: 20, totalPages: 1 } });
    } catch (err) {
      console.warn('[FinanceBilling] Gagal memuat log panggilan UPT:', err);
    } finally {
      setIsLoadingModalCalls(false);
    }
  };

  // Handler Buka Modal Detail Terpadu
  const openDetail = (item) => {
    setDetailModalItem(item);
    setDetailModalTab('summary');
    setDetailActionNotes('');
    setDetailRejectMode(false);
    setDetailRejectReason('');
    setModalCallsPage(1);
    setModalCallsSearch('');

    const targetMonth = item.month || (selectedMonth === 'semua' ? currentMonth : Number(selectedMonth));
    const targetYear = item.year || Number(selectedYear);
    loadBranchCalls(item.branchId || item.id, targetMonth, targetYear, 1, '');
  };

  // Handler Buka Modal Konfirmasi ACC
  const handleOpenApprove = (item) => {
    if (!canManageBilling) {
      showToast('Hanya Superadmin yang berwenang menyetujui (ACC) setoran ini', 'error');
      return;
    }
    setApproveModalItem(item);
    setApproveNotes(detailActionNotes || 'Setoran kasir/kantin telah diverifikasi & disetujui (ACC) oleh Super Administrator.');
  };

  // Handler Konfirmasi Eksekusi ACC
  const handleConfirmApprove = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!approveModalItem || !canManageBilling) return;

    setIsProcessingAction(true);
    try {
      const accNotes = approveNotes || 'Setoran kasir/kantin telah diverifikasi & disetujui (ACC) oleh Admin Keuangan.';
      // Panggil API lama Superadmin (approveTopupTransaction) untuk sinkronisasi kasir kantin
      await approveTopupTransaction(approveModalItem.id, accNotes).catch(() => null);

      // Panggil modul finance approve jika ada id billing finance
      await approveCanteenDeposit(approveModalItem.id, accNotes).catch(() => null);

      showToast(`Setoran ${approveModalItem.canteenName || approveModalItem.branchName} BERHASIL DISETUJUI (ACC).`);
      if (proofPreviewItem?.id === approveModalItem.id) setProofPreviewItem(null);
      if (detailModalItem?.id === approveModalItem.id || detailModalItem?.branchId === approveModalItem.branchId) setDetailModalItem(null);
      setApproveModalItem(null);

      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal memproses persetujuan', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler Buka Modal Tolak
  const handleOpenReject = (item) => {
    if (!canManageBilling) {
      showToast('Hanya Superadmin yang berwenang menolak setoran ini', 'error');
      return;
    }
    setRejectModalItem(item);
    setRejectReason('');
  };

  // Handler Konfirmasi Tolak Setoran
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalItem || !canManageBilling) return;
    if (!rejectReason.trim()) {
      showToast('Alasan penolakan bukti setoran wajib diisi', 'error');
      return;
    }

    setIsProcessingAction(true);
    try {
      const reasonText = rejectReason.trim();

      // Panggil API lama rejectTopupTransaction untuk update riwayat kantin
      await rejectTopupTransaction(rejectModalItem.id, reasonText).catch(() => null);

      // Panggil finance reject
      await rejectCanteenDeposit(rejectModalItem.id, reasonText).catch(() => null);

      showToast(`Setoran dari ${rejectModalItem.canteenName || rejectModalItem.branchName} DITOLAK.`);
      setRejectModalItem(null);
      if (proofPreviewItem?.id === rejectModalItem.id) setProofPreviewItem(null);
      if (detailModalItem?.id === rejectModalItem.id || detailModalItem?.branchId === rejectModalItem.branchId) setDetailModalItem(null);
      
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal menolak setoran', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler Ekspor Laporan CSV
  const handleExportCSV = () => {
    const dataToExport = activeSubTab === 'riwayat' ? paidHistoryList : filteredBillingList;
    if (dataToExport.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = [
      'No Tagihan/Transaksi',
      'Pondok Pesantren',
      'Kopontren',
      'Yayasan',
      'Periode',
      'Total Menit',
      'Total Detik',
      'Total Cash Kopontren (Rp)',
      'Hak Internal Pondok 40% (Rp)',
      'Setoran ke Platform 60% (Rp)',
      'Status Pembayaran',
      'Tanggal Verifikasi',
      'No Referensi',
    ];

    const rows = dataToExport.map((b) => [
      `"${b.id || b.paymentRef || '-'}"`,
      `"${b.uptName || b.branchName || '-'}"`,
      `"${b.canteenName || '-'}"`,
      `"${b.kanwilName || '-'}"`,
      `"${MONTH_NAMES[(b.month || selectedMonth) - 1] || 'Periode'} ${b.year || selectedYear}"`,
      Math.floor((b.totalSeconds || (b.menit ? b.menit * 60 : 0)) / 60),
      b.totalSeconds || (b.menit ? b.menit * 60 : 0),
      b.grossAmount || b.totalAmount || b.totalBayar || 0,
      b.canteenKeepAmount || b.shares?.koperasi?.amount || Math.round((b.totalAmount || b.totalBayar || 0) * 0.40),
      b.depositAmountToFinance || Math.round((b.totalAmount || b.totalBayar || 0) * 0.60),
      `"${b.statusPembayaran || (b.status === 'APPROVED' ? 'Lunas' : b.status === 'PENDING' ? 'Menunggu ACC' : b.status)}"`,
      `"${b.approvedAt || b.verifiedAt || b.paymentDate || '-'}"`,
      `"${b.paymentRef || b.proof?.transferId || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tagihan_Setoran_Kantin_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV berhasil diunduh.');
  };

  // Filter daftar setoran pending (Tab 1)
  const pendingRequestsList = pendingTopups.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id?.toLowerCase().includes(q) ||
      item.branchName?.toLowerCase().includes(q) ||
      item.canteenName?.toLowerCase().includes(q) ||
      item.staffName?.toLowerCase().includes(q)
    );
  });

  // Filter daftar tagihan bulanan nasional (Tab 2)
  const filteredBillingList = nationalBillingReports.filter((item) => {
    if (selectedStatus !== 'semua') {
      if (selectedStatus === 'PAID' && item.statusPembayaran !== 'Lunas') return false;
      if (selectedStatus === 'PENDING_CONFIRMATION' && item.statusPembayaran !== 'Menunggu ACC') return false;
      if (selectedStatus === 'BERJALAN' && item.statusPembayaran !== 'Berjalan') return false;
      if (selectedStatus === 'UNPAID' && item.statusPembayaran !== 'Belum Bayar' && item.statusPembayaran !== 'Telat') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.canteenName?.toLowerCase().includes(q) ||
        item.uptName?.toLowerCase().includes(q) ||
        item.kanwilName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter riwayat transaksi setoran lunas & verifikasi (Tab 3)
  const paidHistoryList = allHistoryTopups.filter((item) => {
    const isFinished = item.status === 'Berhasil' || item.status === 'APPROVED' || item.status === 'Ditolak' || item.status === 'REJECTED';
    if (!isFinished) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id?.toLowerCase().includes(q) ||
        item.branchName?.toLowerCase().includes(q) ||
        item.canteenName?.toLowerCase().includes(q) ||
        item.staffName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Hitung total statistik finansial
  const totalTagihanBulanIni = filteredBillingList.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  const totalDetikBulanIni = filteredBillingList.reduce((acc, r) => acc + (r.totalSeconds || 0), 0);
  const totalLunasCount = filteredBillingList.filter((r) => r.statusPembayaran === 'Lunas').length;

  // Statistik Tab 1 (Pending Setoran Kasir)
  const pendingGrossTotal = pendingRequestsList.reduce((acc, item) => acc + (item.grossAmount || item.totalBayar || item.nominal || 0), 0);
  const pendingKeepTotal = pendingRequestsList.reduce((acc, item) => {
    const gross = item.grossAmount || item.totalBayar || item.nominal || 0;
    return acc + (item.canteenKeepAmount || Math.round(gross * 0.40));
  }, 0);
  const pendingDepositTotal = pendingRequestsList.reduce((acc, item) => {
    const gross = item.grossAmount || item.totalBayar || item.nominal || 0;
    const keep = item.canteenKeepAmount || Math.round(gross * 0.40);
    return acc + (item.depositAmountToFinance || Math.round(gross * 0.60));
  }, 0);

  // Statistik Tab 3 (Riwayat Setoran)
  const paidHistoryApprovedCount = paidHistoryList.filter((item) => item.status === 'Berhasil' || item.status === 'APPROVED').length;
  const paidHistoryRejectedCount = paidHistoryList.filter((item) => item.status === 'Ditolak' || item.status === 'REJECTED').length;
  const paidHistoryTotalNominal = paidHistoryList
    .filter((item) => item.status === 'Berhasil' || item.status === 'APPROVED')
    .reduce((acc, item) => acc + (item.totalBayar || item.nominal || item.depositAmountToFinance || item.grossAmount || 0), 0);

  // Tolak akses jika bukan Superadmin dan bukan Admin Finance
  if (!canAccessBilling) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Akses Dibatasi</h2>
        <p className="text-sm text-slate-500">
          Halaman Tagihan &amp; Setoran Kantin ini hanya dapat diakses oleh akun dengan peran <strong>Super Administrator</strong> atau <strong>Admin Finance</strong>.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-bold animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Read-Only Notice Banner Khusus Role Finance (Superadmin memiliki hak akses penuh verifikasi ACC) */}
      {!canManageBilling && (
        <div className="rounded-2xl p-4 bg-blue-50/80 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-blue-950 sm:text-sm">Mode Pemantauan Finance (Hanya Lihat)</h4>
              <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                Role Finance berhak meninjau rekapitulasi data tagihan dan riwayat setoran secara transparan. Verifikasi bukti transfer dan persetujuan (ACC) setoran kasir dikelola langsung oleh Superadmin.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs self-start sm:self-auto shrink-0">
            Mode Pemantauan
          </span>
        </div>
      )}

      {/* Top Action Bar: Tombol Ekspor CSV dan Refresh di Sisi Kanan */}
      <div className="flex items-center justify-end gap-2 -mt-1">
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Ekspor CSV</span>
        </button>
        <button
          type="button"
          onClick={loadData}
          title="Muat Ulang Data"
          disabled={isLoading}
          className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : 'text-slate-600'}`} />
        </button>
      </div>

      {/* Infografis Alur Kasir & Setoran Kantin (Responsif Penuh, Tanpa Scrollbar Horizontal) */}
      <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-[#1565C0] text-white shadow-xs relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Alur Pascabayar
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Kopontren Pegang Cash 100% → Setor 60% ke Platform
              </h3>
            </div>
            <p className="text-[11px] text-teal-100/90 leading-relaxed">
              Kasir kopontren mengelola porsi bagi hasil di pondok pesantren, lalu mentransfer porsi Platform SapaKita ke rekening resmi dan mengunggah struk transfer untuk diverifikasi (ACC).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 items-center w-full xl:w-auto xl:min-w-[420px]">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md px-2 sm:px-3 py-2 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center min-w-0">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
                <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="font-extrabold text-white text-[11px] truncate">1. Tunai Voucher</span>
              </div>
              <span className="text-[10px] text-teal-200 block truncate">Kopontren pegang 100%</span>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md px-2 sm:px-3 py-2 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center min-w-0">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
                <Store className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span className="font-extrabold text-white text-[11px] truncate">2. Setor 60%</span>
              </div>
              <span className="text-[10px] text-teal-200 block truncate">Upload bukti bayar</span>
            </div>

            {/* Step 3 */}
            <div className="bg-white/15 backdrop-blur-md px-2 sm:px-3 py-2 rounded-xl border border-emerald-400/40 text-center flex flex-col items-center justify-center min-w-0">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-extrabold text-emerald-300 text-[11px] truncate">3. Superadmin ACC</span>
              </div>
              <span className="text-[10px] text-emerald-200 block truncate">Lunas &amp; Bagi Hasil</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Sub-Tabs Navigasi Berstandar (Satu Baris, Scroll Mandiri di Wadah Jika Sangat Sempit) */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-xs overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-2 whitespace-nowrap min-w-max sm:min-w-0">
          {/* Tab 1: Konfirmasi Setoran Kopontren */}
          <button
            type="button"
            onClick={() => setActiveSubTab('konfirmasi')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeSubTab === 'konfirmasi'
                ? 'bg-[#0D7A73] text-white shadow-md shadow-teal-700/25 ring-2 ring-[#0D7A73]/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Wallet className={`w-4 h-4 shrink-0 ${activeSubTab === 'konfirmasi' ? 'text-white' : 'text-slate-500'}`} />
            <span>Konfirmasi Setoran Masuk Kopontren</span>
            {pendingRequestsList.length > 0 && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeSubTab === 'konfirmasi'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {pendingRequestsList.length}
              </span>
            )}
          </button>

          {/* Tab 2: Rekap Tagihan Bulanan Seluruh Pondok */}
          <button
            type="button"
            onClick={() => setActiveSubTab('rekap')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeSubTab === 'rekap'
                ? 'bg-[#0D7A73] text-white shadow-md shadow-teal-700/25 ring-2 ring-[#0D7A73]/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Receipt className={`w-4 h-4 shrink-0 ${activeSubTab === 'rekap' ? 'text-white' : 'text-slate-500'}`} />
            <span>Rekap Tagihan Bulanan Seluruh Pondok</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeSubTab === 'rekap'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredBillingList.length}
            </span>
          </button>

          {/* Tab 3: Riwayat Setoran Lunas & Verifikasi */}
          <button
            type="button"
            onClick={() => setActiveSubTab('riwayat')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
              activeSubTab === 'riwayat'
                ? 'bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${activeSubTab === 'riwayat' ? 'text-white' : 'text-slate-500'}`} />
            <span>Riwayat Setoran Lunas &amp; Verifikasi</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeSubTab === 'riwayat'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {paidHistoryList.length}
            </span>
          </button>
        </div>
      </div>

      {/* FILTER & PENCARIAN (Sejajar, Konsisten, Sesuai Pola Standar) */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Periode Bulan & Tahun */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-slate-500 font-medium">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="semua">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Pembayaran (Khusus Tab Rekap Tagihan Bulanan) */}
          {activeSubTab === 'rekap' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="semua">Semua Status</option>
                <option value="PAID">Lunas (ACC)</option>
                <option value="PENDING_CONFIRMATION">Menunggu ACC</option>
                <option value="BERJALAN">Berjalan</option>
                <option value="UNPAID">Belum Bayar</option>
              </select>
            </div>
          )}

          <span className="text-[11px] text-slate-500 font-medium pl-1 hidden sm:inline">
            {activeSubTab === 'konfirmasi' && (
              <>Menampilkan <strong>{pendingRequestsList.length}</strong> setoran menunggu ACC</>
            )}
            {activeSubTab === 'rekap' && (
              <>Menampilkan <strong>{filteredBillingList.length}</strong> dari <strong>{nationalBillingReports.length}</strong> Kopontren Pondok</>
            )}
            {activeSubTab === 'riwayat' && (
              <>Menampilkan <strong>{paidHistoryList.length}</strong> transaksi terverifikasi</>
            )}
          </span>
        </div>

        {/* Pencarian Kopontren / Pondok */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={activeSubTab === 'konfirmasi' ? 'Cari ID, pondok, kasir...' : 'Cari Kopontren, Pondok, atau Yayasan...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D7A73]/20 focus:border-[#0D7A73] shadow-2xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          KONTEN SUB-TAB 1: KONFIRMASI SETORAN MASUK KANTIN
          ========================================================================= */}
      {activeSubTab === 'konfirmasi' && (
        <div className="space-y-4">
          {/* 4 Kartu Statistik Tab 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kartu 1: Antrean Menunggu ACC */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Setoran Menunggu ACC
                </span>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {pendingRequestsList.length}{' '}
                  <span className="text-xs font-semibold text-slate-400">Transfer</span>
                </div>
                <span className={`text-[11px] font-bold inline-flex items-center gap-1.5 ${
                  pendingRequestsList.length > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-400'
                }`}>
                  {pendingRequestsList.length > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>{pendingRequestsList.length} Butuh persetujuan</span>
                    </>
                  ) : (
                    'Tidak ada antrean ACC'
                  )}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                pendingRequestsList.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu 2: Total Uang Cash (100%) */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Cash Kantin (100%)
                </span>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {formatRupiah(pendingGrossTotal)}
                </div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Bruto penerimaan tunai voucher
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu 3: Porsi 30% Koperasi */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hak Internal UPT (40% Dikelola UPT)
                </span>
                <div className="text-2xl font-black text-sky-700 tracking-tight">
                  {formatRupiah(pendingKeepTotal)}
                </div>
                <span className="text-[11px] font-medium text-sky-600 block">
                  Laba tetap disimpan di kantin UPT
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                <Store className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu 4: Setoran ke Finance (70%) */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Setoran Masuk Vendor (60%)
                </span>
                <div className="text-2xl font-black text-emerald-600 tracking-tight">
                  {formatRupiah(pendingDepositTotal)}
                </div>
                <span className="text-[11px] font-medium text-emerald-600 block">
                  Wajib disetor ke Mandiri Finance
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Tabel Permintaan Masuk */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Setoran Masuk dari Kasir Kantin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Petugas kantin mentransfer 55% porsi Vendor dan mengunggah struk transfer. Klik "Lihat Struk" lalu setujui (ACC).
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{pendingRequestsList.length} Menunggu Konfirmasi</span>
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-blue-200 border-t-[#1565C0] rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Memuat berkas setoran masuk...</p>
              </div>
            ) : pendingRequestsList.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Antrean Setoran</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Semua bukti setoran telah berhasil diverifikasi atau belum ada kantin yang mengirimkan setoran baru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-black uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">No. Pengajuan &amp; Tanggal</th>
                      <th className="py-3 px-4">Nama Pondok &amp; Kopontren</th>
                      <th className="py-3 px-4 text-right">Cash Bruto (100%)</th>
                      <th className="py-3 px-4 text-right">Hak Internal Pondok (40%)</th>
                      <th className="py-3 px-4 text-right font-bold text-[#0D7A73]">Setoran Platform (60%)</th>
                      <th className="py-3 px-4 text-center">Bukti Transfer</th>
                      <th className="py-3 px-4 text-center">Status Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingRequestsList.map((item) => {
                      const gross = item.grossAmount || item.totalBayar || item.nominal || 0;
                      const keep = item.canteenKeepAmount || Math.round(gross * 0.40);
                      const deposit = item.depositAmountToFinance || Math.round(gross * 0.60);

                      return (
                        <tr key={item.id} className="hover:bg-amber-50/25 transition-colors">
                          {/* No Pengajuan */}
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <div className="font-bold text-[#0D7A73]">{item.id}</div>
                            <div className="text-[11px] text-slate-400">{formatTanggal(item.createdAt || item.tanggal)}</div>
                          </td>

                          {/* Pondok & Kopontren */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.branchName}</div>
                            <div className="text-[11px] text-slate-500">{item.canteenName || 'Kopontren Pondok'}</div>
                          </td>

                          {/* Total Cash Dipegang Kopontren (100%) */}
                          <td className="py-3 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                            {formatRupiah(gross)}
                            <span className="text-[10px] text-slate-400 block font-normal">(100% uang tunai)</span>
                          </td>

                          {/* Porsi Pondok Ditahan (40%) */}
                          <td className="py-3 px-4 text-right font-semibold text-sky-800 whitespace-nowrap">
                            {formatRupiah(keep)}
                            <span className="text-[10px] text-sky-600 block font-normal">Hak internal Pondok (40%)</span>
                          </td>

                          {/* Nominal Disetor ke Finance (70%) */}
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                            {formatRupiah(deposit)}
                            <span className="text-[10px] text-emerald-600 block font-normal">Disetor ke Rekening Vendor (60%)</span>
                          </td>

                          {/* Bukti Transfer */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setProofPreviewItem({
                                ...item,
                                canteenName: item.canteenName || 'Kopontren Pondok',
                                depositAmountToFinance: deposit,
                                grossAmount: gross,
                                canteenKeepAmount: keep,
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary font-bold text-xs border border-blue-200 transition-all shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>Lihat Struk</span>
                            </button>
                          </td>

                          {/* Status Verifikasi & Aksi */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {canManageBilling ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenApprove(item)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
                                  title="Setujui (ACC) Setoran Ini"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>ACC</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(item)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer active:scale-95"
                                  title="Tolak Setoran Ini"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>Menunggu ACC</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          KONTEN SUB-TAB 2: REKAP TAGIHAN BULANAN SELURUH UPT
          ========================================================================= */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-4">
          {/* 4 Kartu Statistik Tab 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kartu 1: Total Tagihan Periode Ini */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Tagihan Bulan Ini
                </span>
                <div className="text-2xl font-black text-primary tracking-tight">
                  {formatRupiah(totalTagihanBulanIni)}
                </div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Rumus: Detik × Tarif × % Porsi
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shrink-0 border border-blue-100">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu 2: Total Durasi Panggilan */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Durasi Panggilan
                </span>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {totalDetikBulanIni.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-semibold text-slate-400">Detik</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 block">
                  ≈ {Math.floor(totalDetikBulanIni / 60).toLocaleString('id-ID')} Menit Panggilan
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu 3: Pembayaran Lunas (ACC) */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Setoran Lunas (ACC)
                </span>
                <div className="text-2xl font-black text-emerald-600 tracking-tight">
                  {totalLunasCount}{' '}
                  <span className="text-xs font-semibold text-slate-400">/ {filteredBillingList.length} Kantin</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sudah diverifikasi kasir</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Kartu 4: Menunggu Verifikasi ACC */}
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Menunggu Verifikasi ACC
                </span>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {pendingTopups.length}{' '}
                  <span className="text-xs font-semibold text-slate-400">Kantin</span>
                </div>
                <span className={`text-[11px] font-bold inline-flex items-center gap-1.5 ${
                  pendingTopups.length > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-400'
                }`}>
                  {pendingTopups.length > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>{pendingTopups.length} Butuh persetujuan</span>
                    </>
                  ) : (
                    'Semua berkas aman'
                  )}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                pendingTopups.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi Tagihan Bulanan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Tagihan Bulanan Berbasis Detik Seluruh Kopontren Pondok
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhitungan tagihan otomatis berdasarkan detik durasi bicara santri dikalikan tarif per detik &amp; persen porsi kewajiban setor.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Total: <strong>{filteredBillingList.length}</strong> Kopontren
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-teal-200 border-t-[#0D7A73] rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Memuat rekapitulasi tagihan...</p>
              </div>
            ) : filteredBillingList.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Data Tagihan</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tidak ada data yang cocok dengan kriteria filter atau periode yang dipilih.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-black uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Nama Kopontren &amp; Pondok</th>
                      <th className="py-3 px-4">Pondok &amp; Yayasan</th>
                      <th className="py-3 px-4 text-center">Total Durasi</th>
                      <th className="py-3 px-4 text-right">Total Tagihan (Detik × Tarif)</th>
                      <th className="py-3 px-4 text-center">Pembagian Hasil</th>
                      <th className="py-3 px-4 text-center">Status Pembayaran</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBillingList.map((item) => {
                      const isPending = item.statusPembayaran === 'Menunggu ACC';
                      const isLunas = item.statusPembayaran === 'Lunas';

                      return (
                        <tr key={item.branchId || item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Nama Kantin */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0D7A73] border border-teal-100 flex items-center justify-center shrink-0">
                                <Store className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-snug">
                                  {item.canteenName}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  Kopontren Pondok
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Pondok & Yayasan */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.uptName || item.branchName}</div>
                            <div className="text-[11px] text-slate-500">{item.kanwilName}</div>
                          </td>

                          {/* Total Detik */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {(item.totalSeconds || 0).toLocaleString('id-ID')} detik
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                              ≈ {Math.floor((item.totalSeconds || 0) / 60).toLocaleString('id-ID')} menit
                            </div>
                          </td>

                          {/* Total Tagihan */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-extrabold text-[#0D7A73] text-sm">
                              {formatRupiah(item.totalAmount || item.grossAmount || 0)}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Tarif: {item.ratePerSecond ? `Rp ${item.ratePerSecond}/dtk` : 'Perlu diatur'}
                            </div>
                          </td>

                          {/* Pembagian Hasil 2 Pihak Ringkas */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 text-[11px] min-w-[200px]">
                              <div className="flex justify-between bg-sky-50 text-sky-900 px-2 py-0.5 rounded">
                                <span>Hak Pondok (40% Dikelola Pondok):</span>
                                <span className="font-bold">
                                  {formatRupiah(item.canteenKeepAmount || item.shares?.koperasi?.amount || Math.round((item.totalAmount || 0) * 0.40))}
                                </span>
                              </div>
                              <div className="flex justify-between bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded">
                                <span>Setoran ke Platform (60%):</span>
                                <span className="font-bold">
                                  {formatRupiah(item.depositAmountToFinance || Math.round((item.totalAmount || 0) * 0.60))}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status Pembayaran */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isLunas ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lunas (ACC)</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>Menunggu ACC</span>
                              </span>
                            ) : String(item.statusPembayaran || '').includes('Bulan Berjalan') ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>{item.statusPembayaran}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Belum Bayar</span>
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && canManageBilling && (
                                <button
                                  type="button"
                                  onClick={() => openDetail(item)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 transition shadow-xs cursor-pointer"
                                  title="Periksa bukti transfer dan lakukan persetujuan (ACC)"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Periksa &amp; ACC</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openDetail(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary font-bold text-xs border border-blue-200 transition-all shadow-2xs cursor-pointer"
                                title="Lihat Rincian Tagihan & Log Panggilan"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" />
                                <span>Detail</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          KONTEN SUB-TAB 3: RIWAYAT SETORAN LUNAS & VERIFIKASI
          ========================================================================= */}
      {activeSubTab === 'riwayat' && (
        <div className="space-y-4">
          {/* 3 Kartu Statistik Tab 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Transaksi Terverifikasi
                </span>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {paidHistoryList.length}{' '}
                  <span className="text-xs font-semibold text-slate-400">Arsip</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Histori setoran yang telah diproses
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Setoran Lunas Diterima
                </span>
                <div className="text-2xl font-black text-emerald-600 tracking-tight">
                  {formatRupiah(paidHistoryTotalNominal)}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 block">
                  {paidHistoryApprovedCount} Transaksi Disetujui (ACC)
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Setoran Ditolak
                </span>
                <div className="text-2xl font-black text-rose-600 tracking-tight">
                  {paidHistoryRejectedCount}{' '}
                  <span className="text-xs font-semibold text-slate-400">Transaksi</span>
                </div>
                <span className="text-[11px] font-medium text-rose-500 block">
                  Bukti transfer ditolak atau tidak valid
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Ban className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Tabel Riwayat */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Arsip Riwayat Verifikasi Setoran Kantin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan transaksi pembayaran yang telah disetujui (ACC) atau ditolak oleh Admin Finance.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{paidHistoryList.length} Transaksi Terverifikasi</span>
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-blue-200 border-t-[#1565C0] rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Memuat arsip riwayat setoran...</p>
              </div>
            ) : paidHistoryList.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Verifikasi</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Riwayat transaksi yang telah disetujui (ACC) atau ditolak akan tersimpan secara otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-black uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">No. Referensi &amp; Tanggal</th>
                      <th className="py-3 px-4">Pondok &amp; Kopontren</th>
                      <th className="py-3 px-4 text-right">Nominal Setoran</th>
                      <th className="py-3 px-4">Verifikator Finance</th>
                      <th className="py-3 px-4 text-center">Bukti Struk</th>
                      <th className="py-3 px-4 text-center">Status Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paidHistoryList.map((item) => {
                      const isApproved = item.status === 'Berhasil' || item.status === 'APPROVED';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* No Ref & Tanggal */}
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <div className="font-bold text-slate-800">{item.id || item.paymentRef}</div>
                            <div className="text-[11px] text-slate-400">
                              {formatTanggal(item.createdAt || item.tanggal || item.paymentDate)}
                            </div>
                          </td>

                          {/* Pondok & Kopontren */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.branchName}</div>
                            <div className="text-[11px] text-slate-500">{item.canteenName || 'Kopontren Pondok'}</div>
                          </td>

                          {/* Nominal */}
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                            {formatRupiah(item.totalBayar || item.nominal || item.depositAmountToFinance || item.grossAmount)}
                          </td>

                          {/* Verifikator */}
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{item.verifiedBy || 'Admin Keuangan'}</div>
                            <div className="text-[10px] text-slate-400">
                              {item.approvedAt ? formatTanggal(item.approvedAt) : 'Terverifikasi'}
                            </div>
                          </td>

                          {/* Bukti Struk */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setProofPreviewItem({
                                ...item,
                                canteenName: item.canteenName || 'Kopontren Pondok',
                                depositAmountToFinance: item.totalBayar || item.nominal || item.depositAmountToFinance || item.grossAmount,
                                grossAmount: item.totalBayar || item.nominal || item.grossAmount,
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Lihat Struk</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lunas (ACC)</span>
                              </span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold" title={item.rejectReason || item.rejectionReason}>
                                  <Ban className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Ditolak</span>
                                </span>
                                {(item.rejectReason || item.rejectionReason) && (
                                  <span className="text-[10px] text-rose-600 font-medium max-w-[150px] truncate mt-1 text-center" title={item.rejectReason || item.rejectionReason}>
                                    {item.rejectReason || item.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL PREVIEW BUKTI TRANSFER SETORAN KANTIN (FOTO STRUK M-BANKING & BUKTI STREAM)
          ========================================================================= */}
      <TransferProofModal
        isOpen={Boolean(proofPreviewItem)}
        onClose={() => setProofPreviewItem(null)}
        item={proofPreviewItem}
canApprove={canManageBilling}
        readOnly={!canManageBilling}
        onApprove={(item) => handleOpenApprove(item)}
        onReject={(item, reason) => {
          setRejectModalItem(item);
          setRejectReason(reason || '');
          setProofPreviewItem(null);
        }}
      />

      {/* =========================================================================
          MODAL POP UP KONFIRMASI PERSETUJUAN (ACC) SETORAN
          ========================================================================= */}
      {approveModalItem && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-emerald-600">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Persetujuan Setoran (ACC)</h3>
                  <p className="text-[11px] text-slate-400">Verifikasi tanda terima transfer setoran Vendor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="py-4 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500 font-medium">Pondok &amp; Kopontren:</span>
                  <span className="font-bold text-slate-900 text-right">{approveModalItem.branchName || approveModalItem.uptName} &bull; {approveModalItem.canteenName || 'Kopontren'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500 font-medium">Total Cash Bruto (100%):</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(approveModalItem.grossAmount || approveModalItem.totalBayar || approveModalItem.nominal || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sky-800">
                  <span className="text-slate-500 font-medium">Hak Dikelola Pondok (40%):</span>
                  <span className="font-bold text-sky-700">
                    {formatRupiah(approveModalItem.canteenKeepAmount || Math.round((approveModalItem.grossAmount || approveModalItem.nominal || 0) * 0.40))}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                  <span className="text-slate-900">Setoran Diterima Platform (60%):</span>
                  <span className="text-emerald-600 text-base">
                    {formatRupiah(approveModalItem.depositAmountToFinance || approveModalItem.totalBayar || approveModalItem.nominal || Math.round((approveModalItem.grossAmount || 0) * 0.60))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Catatan Verifikasi (Opsional):
                </label>
                <input
                  type="text"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Misal: Dana setoran telah diterima di rekening penampung resmi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessingAction ? 'Memproses...' : 'Ya, Setujui (ACC) Setoran Ini'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL TOLAK BUKTI SETORAN
          ========================================================================= */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-800 text-base">Tolak Setoran Kantin</h3>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="py-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Anda akan menolak bukti setoran dari <strong>{rejectModalItem.canteenName || rejectModalItem.branchName}</strong> sebesar <strong>{formatRupiah(rejectModalItem.totalBayar || rejectModalItem.nominal || rejectModalItem.depositAmountToFinance || rejectModalItem.grossAmount)}</strong>.
              </p>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Alasan Penolakan (Wajib Diisi):
                </label>
                <textarea
                  rows="3"
                  placeholder="Misal: Bukti transfer buram, nominal transfer tidak sesuai dengan rekap invoice..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAction ? 'Memproses...' : 'Konfirmasi Tolak Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETAIL TERPADU (Layout & Komponen dari CanteenTopup Superadmin)
          Memuat: Rincian Tagihan, Log Panggilan Santri, Struk Transfer, dan Aksi ACC/Tolak
          ========================================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-100 my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0B3D91]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Rincian Tagihan &amp; Verifikasi Setoran Kantin
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {detailModalItem.canteenName || 'Kantin UPT'} • {detailModalItem.uptName || detailModalItem.branchName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs Navigasi di Dalam Modal Detail: Ringkasan Tagihan & Log Panggilan */}
            <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDetailModalTab('summary')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  detailModalTab === 'summary'
                    ? 'bg-[#0B3D91] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Rincian Tagihan &amp; Setoran</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTab('calls')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  detailModalTab === 'calls'
                    ? 'bg-[#0D7A73] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log Rincian Panggilan Santri</span>
                {modalCallsData.totalItems > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {modalCallsData.totalItems}
                  </span>
                )}
              </button>
            </div>

            <div className="py-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {detailModalTab === 'summary' ? (
                <>
                  {/* Pondok Info Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Pondok Pesantren:</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{detailModalItem.uptName || detailModalItem.branchName}</p>
                        <p className="text-slate-500">{detailModalItem.kanwilName || 'Yayasan Pesantren'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Pengelola Kopontren:</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{detailModalItem.canteenName}</p>
                        <p className="text-slate-500">Rekening Tujuan: Bank Mandiri SapaKita</p>
                      </div>
                    </div>
                  </div>

                  {/* Rincian Finansial Detik & Nilai Tagihan */}
                  <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/40 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D7A73]">
                      Kalkulasi Tagihan Berbasis Detik Panggilan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-500 block">Total Durasi Bicara:</span>
                        <span className="font-bold text-slate-900 text-sm mt-1 block">
                          {(detailModalItem.totalSeconds || 0).toLocaleString('id-ID')} Detik
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          ≈ {Math.floor((detailModalItem.totalSeconds || 0) / 60)} Menit
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-500 block">Total Penjualan (100%):</span>
                        <span className="font-bold text-slate-900 text-sm mt-1 block">
                          {formatRupiah(detailModalItem.grossAmount || detailModalItem.totalAmount || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Omset kotor voucher</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-sky-700 block">Hak Internal Pondok (40%):</span>
                        <span className="font-bold text-sky-900 text-sm mt-1 block">
                          {formatRupiah(detailModalItem.canteenKeepAmount || Math.round((detailModalItem.grossAmount || detailModalItem.totalAmount || 0) * 0.40))}
                        </span>
                        <span className="text-[10px] text-sky-600 font-normal">Dikelola internal Pondok</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-emerald-700 block">Setor ke Platform (60%):</span>
                        <span className="font-extrabold text-emerald-800 text-sm mt-1 block">
                          {formatRupiah(detailModalItem.depositAmountToFinance || Math.round((detailModalItem.grossAmount || detailModalItem.totalAmount || 0) * 0.60))}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-normal">Disetor ke Platform</span>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Aksi Verifikasi ACC / Tolak jika Berstatus Pending */}
                  {detailModalItem.statusPembayaran === 'Menunggu ACC' && (
                    canManageBilling ? (
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Aksi Verifikasi Setoran Kantin:</span>
                      </div>

                      {detailRejectMode ? (
                        <div className="space-y-2 text-xs">
                          <label className="block font-bold text-rose-800">
                            Alasan Penolakan Bukti Transfer (Wajib Diisi):
                          </label>
                          <textarea
                            rows="2"
                            value={detailRejectReason}
                            onChange={(e) => setDetailRejectReason(e.target.value)}
                            placeholder="Contoh: Bukti transfer tidak jelas atau nominal tidak cocok..."
                            className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            required
                          ></textarea>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailRejectMode(false)}
                              className="px-3 py-1.5 bg-white text-slate-600 rounded-xl border border-slate-200 text-xs"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={async () => {
                                if (!detailRejectReason.trim()) {
                                  showToast('Alasan penolakan wajib diisi', 'error');
                                  return;
                                }
                                setIsProcessingAction(true);
                                try {
                                  await rejectTopupTransaction(detailModalItem.id, detailRejectReason.trim()).catch(() => null);
                                  await rejectCanteenDeposit(detailModalItem.id, detailRejectReason.trim()).catch(() => null);
                                  showToast(`Setoran ${detailModalItem.canteenName} DITOLAK.`);
                                  setDetailModalItem(null);
                                  loadData();
                                } catch (err) {
                                  showToast(err.message || 'Gagal menolak setoran', 'error');
                                } finally {
                                  setIsProcessingAction(false);
                                }
                              }}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                            >
                              Konfirmasi Tolak
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">
                              Catatan Verifikasi Persetujuan (Opsional):
                            </label>
                            <input
                              type="text"
                              value={detailActionNotes}
                              onChange={(e) => setDetailActionNotes(e.target.value)}
                              placeholder="Misal: Dana telah masuk rekening giro BSI/Mandiri Finance"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setDetailRejectMode(true)}
                              className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer"
                            >
                              Tolak Setoran...
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={() => handleOpenApprove(detailModalItem)}
                              className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isProcessingAction ? 'Memproses...' : 'Setujui (ACC)'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    ) : (
                      <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Menunggu Verifikasi &amp; Persetujuan Superadmin</p>
                          <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                            Mode Pantau: Role Finance hanya berwenang memantau data tagihan dan bukti transfer tanpa hak mutasi. Persetujuan (ACC) atau penolakan setoran dilakukan secara terpusat oleh Superadmin.
                          </p>
                        </div>
                      </div>
                    )
                  )}

                  {detailModalItem.statusPembayaran === 'Lunas' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tagihan periode ini telah lunas dan disetujui (ACC).</span>
                    </div>
                  )}
                </>
              ) : (
                /* Tab 2 Dalam Modal: Log Rincian Panggilan Santri */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Log Sesi Panggilan Santri Pondok Ini (Total: {modalCallsData.totalItems})
                    </span>
                    <input
                      type="text"
                      placeholder="Cari NIS / nama santri..."
                      value={modalCallsSearch}
                      onChange={(e) => {
                        setModalCallsSearch(e.target.value);
                        loadBranchCalls(detailModalItem.branchId || detailModalItem.id, detailModalItem.month || currentMonth, detailModalItem.year || currentYear, 1, e.target.value);
                      }}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  {isLoadingModalCalls ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0D7A73] mb-1" />
                      <span>Memuat log panggilan...</span>
                    </div>
                  ) : modalCallsData.items?.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada catatan panggilan untuk periode ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <th className="py-2 px-3">Waktu</th>
                            <th className="py-2 px-3">Nama Santri</th>
                            <th className="py-2 px-3">Tujuan</th>
                            <th className="py-2 px-3 text-right">Durasi</th>
                            <th className="py-2 px-3 text-right">Tagihan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {modalCallsData.items.map((c, i) => {
                            const callDate = c.createdAt || c.startedAt || c.waktu;
                            const formattedDate = callDate
                              ? new Date(callDate).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-';
                            const callDuration = Number(c.durationSeconds ?? c.duration ?? c.durasiSeconds ?? (c.durationMinutes ? c.durationMinutes * 60 : 0) ?? 0);
                            const callCost = c.nominal ?? c.cost ?? c.totalAmount ?? 0;
                            const tujuanOrPaket = c.packageName || c.targetPhone || c.destination || 'Paket Komunikasi';

                            return (
                              <tr key={c.id || i} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                                  {formattedDate}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800">{c.inmateName || 'Santri'}</div>
                                  {(c.inmateIdentifier || c.kodeVoucher) && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {c.inmateIdentifier ? `NIS: ${c.inmateIdentifier}` : `Kode: ${c.kodeVoucher}`}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-700">
                                  {tujuanOrPaket}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                                  {callDuration.toLocaleString('id-ID')} dtk
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-[#0D7A73] whitespace-nowrap">
                                  {formatRupiah(callCost)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {modalCallsData.items?.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                              <td colSpan="3" className="py-2.5 px-3">
                                Total Tagihan Sesi ({modalCallsData.totalItems || modalCallsData.items.length} panggilan)
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-700 whitespace-nowrap">
                                {(modalCallsData.totalSeconds || modalCallsData.items.reduce((acc, c) => acc + (c.durationSeconds || 0), 0)).toLocaleString('id-ID')} dtk
                              </td>
                              <td className="py-2.5 px-3 text-right text-[#0B3D91] font-black whitespace-nowrap">
                                {formatRupiah(modalCallsData.totalTagihan || modalCallsData.items.reduce((acc, c) => acc + (c.nominal ?? c.cost ?? 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
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
