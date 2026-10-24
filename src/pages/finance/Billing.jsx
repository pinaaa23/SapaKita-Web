import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Wallet,
  X,
  Check,
  Eye,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Coins,
  Store,
  ExternalLink,
  Ban
} from 'lucide-react';
import {
  getFinanceBillings,
  getFinanceContracts,
  updateFinanceBillingStatus,
  approveCanteenDeposit,
  rejectCanteenDeposit,
  formatRupiah,
  MONTH_NAMES
} from '../../services/financeService';
import TransferProofModal from '../../components/finance/TransferProofModal';

export default function FinanceBilling() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const now = new Date();
  // 3 Sub-Tabs: 'rekap' | 'konfirmasi' | 'riwayat'
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return initialId ? 'rekap' : 'konfirmasi';
  });

  const [selectedMonth, setSelectedMonth] = useState('semua');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [billings, setBillings] = useState([]);

  // Modals
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [proofPreviewItem, setProofPreviewItem] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Status edit modal inside detail
  const [statusAction, setStatusAction] = useState('PAID');
  const [paymentDate, setPaymentDate] = useState(now.toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer Mandiri');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    const data = getFinanceBillings({
      month: selectedMonth,
      year: selectedYear,
      status: selectedStatus,
      search: searchQuery,
    });
    setBillings(data);

    if (initialId && !detailModalItem) {
      const match = data.find((b) => b.id === initialId);
      if (match) openDetail(match);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('finance_billing_updated', loadData);
    return () => {
      window.removeEventListener('finance_billing_updated', loadData);
    };
  }, [selectedMonth, selectedYear, selectedStatus, searchQuery]);

  const openDetail = (item) => {
    setDetailModalItem(item);
    setStatusAction(item.status);
    setPaymentDate(item.paymentDate ? item.paymentDate.split('T')[0] : now.toISOString().split('T')[0]);
    setPaymentRef(item.paymentRef || `TRX-${Date.now()}`);
    setPaymentMethod(item.paymentMethod || 'Bank Transfer Mandiri');
    setNotes(item.notes || '');
  };

  const handleApprove = (item) => {
    if (window.confirm(`Setujui (ACC) bukti transfer setoran dari ${item.canteenName} (${item.branchName}) sebesar ${formatRupiah(item.depositAmountToFinance || item.grossAmount)}?`)) {
      try {
        approveCanteenDeposit(item.id, `Setoran kasir kantin diverifikasi & disetujui (ACC) oleh Admin Keuangan pada ${new Date().toLocaleString('id-ID')}`);
        showToast(`Setoran ${item.canteenName} BERHASIL DISETUJUI (ACC). Status tagihan kini Lunas.`);
        if (proofPreviewItem?.id === item.id) setProofPreviewItem(null);
        if (detailModalItem?.id === item.id) setDetailModalItem(null);
        loadData();
      } catch (err) {
        showToast(err.message || 'Gagal memproses persetujuan', 'error');
      }
    }
  };

  const handleOpenReject = (item) => {
    setRejectModalItem(item);
    setRejectReason('');
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      showToast('Alasan penolakan bukti setoran wajib diisi', 'error');
      return;
    }

    try {
      rejectCanteenDeposit(rejectModalItem.id, rejectReason.trim());
      showToast(`Setoran dari ${rejectModalItem.canteenName} DITOLAK.`);
      setRejectModalItem(null);
      if (proofPreviewItem?.id === rejectModalItem.id) setProofPreviewItem(null);
      if (detailModalItem?.id === rejectModalItem.id) setDetailModalItem(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal menolak setoran', 'error');
    }
  };

  const handleSaveStatus = () => {
    if (!detailModalItem) return;
    setIsSaving(true);
    try {
      const updated = updateFinanceBillingStatus(detailModalItem.id, statusAction, {
        paymentDate: `${paymentDate}T12:00:00Z`,
        paymentRef,
        paymentMethod,
        notes,
      });
      setDetailModalItem(updated);
      showToast(`Status tagihan ${updated.id} berhasil diperbarui.`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (billings.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = [
      'No Tagihan',
      'Nama UPT',
      'Kantin/Koperasi',
      'Kanwil',
      'Periode',
      'Total Menit',
      'Total Detik',
      'Total Cash Dipegang Kantin (Rp)',
      'Hak Koperasi Kantin 30% (Rp)',
      'Setoran ke Rekening Finance 70% (Rp)',
      'Hak Kepala UPT 5% (Rp)',
      'Hak Inkopasindo 10% (Rp)',
      'Hak Vendor 55% (Rp)',
      'Status Pembayaran',
      'Tanggal Bayar',
      'No Referensi',
      'Metode Bayar',
    ];

    const rows = billings.map((b) => [
      `"${b.id}"`,
      `"${b.branchName}"`,
      `"${b.canteenName}"`,
      `"${b.kanwilName}"`,
      `"${MONTH_NAMES[b.month - 1]} ${b.year}"`,
      b.totalMinutes,
      b.totalSeconds,
      b.grossAmount,
      b.canteenKeepAmount || b.shares?.koperasi?.amount || 0,
      b.depositAmountToFinance || 0,
      b.shares?.kepalaUpt?.amount || 0,
      b.shares?.inkopasindo?.amount || 0,
      b.shares?.vendor?.amount || 0,
      `"${b.status === 'PAID' ? 'Sudah Dibayar (Lunas)' : b.status === 'PENDING_CONFIRMATION' ? 'Menunggu Verifikasi Setoran' : 'Belum Dibayar'}"`,
      `"${b.paymentDate || '-'}"`,
      `"${b.paymentRef || '-'}"`,
      `"${b.paymentMethod || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Tagihan_BagiHasil_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV berhasil diunduh.');
  };

  // Filtered dataset for sub-tabs
  const pendingRequests = billings.filter((b) => b.status === 'PENDING_CONFIRMATION');
  const paidHistory = billings.filter((b) => b.status === 'PAID' || b.rejectionReason);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-[#0B3D91]">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800">
              Penagihan & Konfirmasi Setoran Kantin
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Kantin memegang seluruh uang cash hasil penjualan voucher ke WBP, kemudian menyetor kewajiban bagi hasil ke Finance untuk diverifikasi & dialokasikan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={loadData}
            title="Muat Ulang Data"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Infografis Alur Kasir & Setoran Kantin */}
      <div className="rounded-3xl p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0B3D91] text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1 max-w-lg">
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-blue-200 inline-block">
              Alur Kasir Kantin & Rekening Penampung
            </span>
            <h3 className="text-lg font-bold text-white">
              Kantin Memegang Cash 100% → Menyetor ke Finance
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Petugas kantin/koperasi menerima pembayaran tunai dari WBP. Porsi 30% Koperasi tetap ditahan di kantin. Petugas menyetor 70% (Kepala UPT 5% + Inkopasindo 10% + Vendor 55%) ke rekening Finance beserta unggahan bukti transfer.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 text-center flex-1 min-w-[120px]">
              <Coins className="w-4 h-4 text-amber-300 mx-auto mb-1" />
              <span className="font-extrabold text-white block">1. WBP Beli Voucher</span>
              <span className="text-[10px] text-blue-200">Kantin pegang uang cash</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-300 hidden sm:block shrink-0" />

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 text-center flex-1 min-w-[120px]">
              <Store className="w-4 h-4 text-sky-300 mx-auto mb-1" />
              <span className="font-extrabold text-white block">2. Kantin Setor Transfer</span>
              <span className="text-[10px] text-blue-200">Upload bukti transfer</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-300 hidden sm:block shrink-0" />

            {/* Step 3 */}
            <div className="bg-white/15 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-emerald-400/40 text-center flex-1 min-w-[120px]">
              <ShieldCheck className="w-4 h-4 text-emerald-300 mx-auto mb-1" />
              <span className="font-extrabold text-emerald-300 block">3. Finance ACC</span>
              <span className="text-[10px] text-emerald-200">Tagihan Lunas & dibagi 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Sub-Tabs Navigation (Like Super Admin's Canteen Topup) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {/* Tab 1: Konfirmasi Setoran Kantin (Permintaan Masuk) */}
        <button
          onClick={() => setActiveSubTab('konfirmasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'konfirmasi'
              ? 'bg-[#0B3D91] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Konfirmasi Setoran Masuk Kantin</span>
          {pendingRequests.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeSubTab === 'konfirmasi' ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-amber-500 text-white'
            }`}>
              {pendingRequests.length} Permintaan Baru
            </span>
          )}
        </button>

        {/* Tab 2: Rekap Tagihan Bulanan */}
        <button
          onClick={() => setActiveSubTab('rekap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'rekap'
              ? 'bg-[#0B3D91] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Rekap Tagihan Bulanan Seluruh UPT</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs">
            {billings.length}
          </span>
        </button>

        {/* Tab 3: Riwayat Setoran */}
        <button
          onClick={() => setActiveSubTab('riwayat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'riwayat'
              ? 'bg-[#0B3D91] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Riwayat Setoran Lunas & Verifikasi</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Lapas, UPT, Koperasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
            />
          </div>

          {/* Filter Bulan */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] cursor-pointer"
            >
              <option value="semua">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  Bulan {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] cursor-pointer"
            >
              <option value="semua">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
            </select>
          </div>

          {/* Filter Status (khusus Tab Rekap) */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] cursor-pointer font-medium"
            >
              <option value="semua">Semua Status Pembayaran</option>
              <option value="PAID">Sudah Dibayar (Lunas)</option>
              <option value="PENDING_CONFIRMATION">Menunggu Verifikasi Setoran</option>
              <option value="UNPAID">Belum Dibayar</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KONTEN SUB-TAB 1: KONFIRMASI SETORAN KANTIN (PERMINTAAN MASUK)
          ========================================================================= */}
      {activeSubTab === 'konfirmasi' && (
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Permintaan Masuk: Setoran Pembayaran dari Pengelola Kantin
              </h2>
              <p className="text-xs text-slate-500">
                Petugas kantin yang memegang uang tunai telah mentransfer kewajiban bagi hasil dan mengunggah bukti transfer. Silakan periksa berkas dan setujui (ACC).
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold self-start sm:self-auto">
              {pendingRequests.length} Menunggu Konfirmasi
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="font-bold text-slate-700">Tidak Ada Setoran Menunggu</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Semua setoran kantin telah diverifikasi atau belum ada kantin yang mengunggah bukti transfer baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-amber-50/50">
                    <th className="py-3 px-4 rounded-l-xl">No. Tagihan & Periode</th>
                    <th className="py-3 px-4">Nama UPT & Kantin</th>
                    <th className="py-3 px-4 text-right">Total Cash Dipegang Kantin</th>
                    <th className="py-3 px-4 text-right">Porsi Koperasi (30% Ditahan)</th>
                    <th className="py-3 px-4 text-right font-bold text-[#0B3D91]">Setoran ke Finance (70%)</th>
                    <th className="py-3 px-4 text-center">Bukti Transfer</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* No Tagihan */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-[#0B3D91]">{item.id}</div>
                        <div className="text-[11px] text-slate-400">{MONTH_NAMES[item.month - 1]} {item.year}</div>
                      </td>

                      {/* UPT & Kantin */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.branchName}</div>
                        <div className="text-[11px] text-slate-500">{item.canteenName}</div>
                      </td>

                      {/* Total Cash Dipegang Kantin (100%) */}
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {formatRupiah(item.grossAmount)}
                        <span className="text-[10px] text-slate-400 block font-normal">(100% uang cash tunai)</span>
                      </td>

                      {/* Porsi Koperasi Ditahan (30%) */}
                      <td className="py-3.5 px-4 text-right font-semibold text-sky-800">
                        {formatRupiah(item.canteenKeepAmount || item.shares?.koperasi?.amount)}
                        <span className="text-[10px] text-sky-600 block font-normal">Hak laba kantin UPT</span>
                      </td>

                      {/* Nominal Disetor ke Finance (70%) */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-sm">
                        {formatRupiah(item.depositAmountToFinance || (item.grossAmount - item.shares?.koperasi?.amount))}
                        <span className="text-[10px] text-emerald-600 block font-normal">Disetor ke Mandiri Finance</span>
                      </td>

                      {/* Bukti Transfer */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setProofPreviewItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B3D91] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lihat Struk Transfer</span>
                        </button>
                      </td>

                      {/* Aksi Verifikasi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Setujui dan ubah status menjadi Lunas"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui (ACC)</span>
                          </button>
                          <button
                            onClick={() => handleOpenReject(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                            title="Tolak bukti setoran jika tidak sesuai"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          KONTEN SUB-TAB 2: REKAP TAGIHAN BULANAN
          ========================================================================= */}
      {activeSubTab === 'rekap' && (
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/80">
                  <th className="py-3 px-4 rounded-l-xl">No. Tagihan</th>
                  <th className="py-3 px-4">Nama UPT & Wilayah</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4 text-right">Cash Dipegang Kantin</th>
                  <th className="py-3 px-4 text-right">Kewajiban Setoran ke Finance</th>
                  <th className="py-3 px-4 text-center">Bagi Hasil 4 Pihak (Rp)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      Tidak ditemukan data tagihan yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  billings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* No. Tagihan */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B3D91]">
                        {item.id}
                      </td>

                      {/* UPT & Kanwil */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.branchName}</div>
                        <div className="text-[11px] text-slate-500">{item.kanwilName} • {item.canteenName}</div>
                      </td>

                      {/* Periode */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {MONTH_NAMES[item.month - 1]} {item.year}
                        </span>
                      </td>

                      {/* Cash Dipegang Kantin */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatRupiah(item.grossAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.totalMinutes.toLocaleString('id-ID')} mnt
                        </div>
                      </td>

                      {/* Setoran ke Finance */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-extrabold text-[#0B3D91]">
                          {formatRupiah(item.depositAmountToFinance || (item.grossAmount - item.shares?.koperasi?.amount))}
                        </div>
                        <div className="text-[11px] text-sky-700">
                          (Laba Kantin: {formatRupiah(item.canteenKeepAmount || item.shares?.koperasi?.amount)})
                        </div>
                      </td>

                      {/* 4 Pihak Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="grid grid-cols-2 gap-1 text-[11px] min-w-[240px]">
                          <div className="bg-purple-50 text-purple-900 px-2 py-0.5 rounded">
                            <span className="font-semibold">Kepala UPT (5%):</span> {formatRupiah(item.shares?.kepalaUpt?.amount)}
                          </div>
                          <div className="bg-sky-50 text-sky-900 px-2 py-0.5 rounded">
                            <span className="font-semibold">Koperasi (30%):</span> {formatRupiah(item.shares?.koperasi?.amount)}
                          </div>
                          <div className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded">
                            <span className="font-semibold">Inkopasindo (10%):</span> {formatRupiah(item.shares?.inkopasindo?.amount)}
                          </div>
                          <div className="bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded">
                            <span className="font-semibold">Vendor (55%):</span> {formatRupiah(item.shares?.vendor?.amount)}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sudah Dibayar</span>
                          </span>
                        ) : item.status === 'PENDING_CONFIRMATION' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Menunggu ACC</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Belum Dibayar</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'PENDING_CONFIRMATION' && (
                            <button
                              onClick={() => handleApprove(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                              title="Setujui Setoran"
                            >
                              ACC
                            </button>
                          )}
                          <button
                            onClick={() => openDetail(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B3D91] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rincian</span>
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
      )}

      {/* =========================================================================
          KONTEN SUB-TAB 3: RIWAYAT SETORAN LUNAS & VERIFIKASI
          ========================================================================= */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Riwayat Transaksi Setoran yang Telah Diverifikasi
              </h2>
              <p className="text-xs text-slate-500">
                Arsip transaksi pembayaran dari kantin UPT yang telah dinyatakan Lunas (ACC) oleh Admin Keuangan.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
              {paidHistory.length} Transaksi Selesai
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-3 px-4 rounded-l-xl">No. Referensi & Tanggal</th>
                  <th className="py-3 px-4">UPT & Kantin</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4 text-right">Nominal Setoran</th>
                  <th className="py-3 px-4">Rekening Tujuan / Metode</th>
                  <th className="py-3 px-4">Verifikator Finance</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* No Ref & Tanggal */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-800">{item.paymentRef || item.proof?.transferId}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                      </div>
                    </td>

                    {/* UPT */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.branchName}</div>
                      <div className="text-[11px] text-slate-500">{item.canteenName}</div>
                    </td>

                    {/* Periode */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {MONTH_NAMES[item.month - 1]} {item.year}
                    </td>

                    {/* Nominal */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                      {formatRupiah(item.depositAmountToFinance || item.grossAmount)}
                    </td>

                    {/* Rekening Tujuan */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">{item.paymentMethod || 'Bank Mandiri Transfer'}</div>
                      <div className="text-[11px] text-slate-400">Rek. Penampung PasCall</div>
                    </td>

                    {/* Verifikator */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-800">{item.verifiedBy || 'Dewi Lestari (Finance)'}</div>
                      <div className="text-[10px] text-emerald-600">Terverifikasi Otomatis</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lunas (ACC)</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL PREVIEW BUKTI TRANSFER SETORAN KANTIN (REALISTIK FOTO STRUK M-BANKING)
          ========================================================================= */}
      <TransferProofModal
        isOpen={Boolean(proofPreviewItem)}
        onClose={() => setProofPreviewItem(null)}
        item={proofPreviewItem}
        onApprove={(item) => handleApprove(item)}
        onReject={(item, reason) => {
          try {
            rejectCanteenDeposit(item.id, reason);
            showToast(`Setoran dari ${item.canteenName} DITOLAK.`);
            setProofPreviewItem(null);
            loadData();
          } catch (err) {
            showToast(err.message || 'Gagal menolak setoran', 'error');
          }
        }}
      />

      {/* =========================================================================
          MODAL TOLAK BUKTI SETORAN
          ========================================================================= */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
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
                Anda akan menolak bukti setoran dari <strong>{rejectModalItem.canteenName}</strong> ({rejectModalItem.branchName}) sebesar <strong>{formatRupiah(rejectModalItem.depositAmountToFinance || rejectModalItem.grossAmount)}</strong>.
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
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md"
                >
                  Konfirmasi Tolak Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETAIL LENGKAP & EDIT STATUS MANUAL
          ========================================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0B3D91]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Rincian Tagihan & Verifikasi Bagi Hasil
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {detailModalItem.id} • {MONTH_NAMES[detailModalItem.month - 1]} {detailModalItem.year}
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

            <div className="py-5 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* UPT Info Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Satuan Kerja / UPT:</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{detailModalItem.branchName}</p>
                    <p className="text-slate-500">{detailModalItem.kanwilName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Pengelola Kantin (Pemegang Cash):</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{detailModalItem.canteenName}</p>
                    <p className="text-slate-500">{detailModalItem.bankName} - {detailModalItem.accountNumber} ({detailModalItem.accountHolder})</p>
                  </div>
                </div>
              </div>

              {/* Rincian Cash vs Setoran */}
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3D91] mb-2">
                  Status Uang Tunai Kasir & Alokasi Setoran
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">Total Cash di Kantin:</span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">
                      {formatRupiah(detailModalItem.grossAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Hasil jual voucher ke WBP</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-sky-700 block">Hak Koperasi (30%):</span>
                    <span className="font-bold text-sky-900 text-sm mt-1 block">
                      {formatRupiah(detailModalItem.canteenKeepAmount || detailModalItem.shares?.koperasi?.amount)}
                    </span>
                    <span className="text-[10px] text-sky-600 font-normal">Ditahan langsung di kantin</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-emerald-700 block">Setor ke Finance (70%):</span>
                    <span className="font-extrabold text-emerald-800 text-sm mt-1 block">
                      {formatRupiah(detailModalItem.depositAmountToFinance || (detailModalItem.grossAmount - detailModalItem.shares?.koperasi?.amount))}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-normal">Disetor ke penampung</span>
                  </div>
                </div>
              </div>

              {/* 4 Pihak Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Alokasi Hak Finansial 4 Pihak
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-purple-50 text-purple-900">
                    <span>1. Kepala UPT ({detailModalItem.split.kepalaUpt}%):</span>
                    <span className="font-extrabold">{formatRupiah(detailModalItem.shares.kepalaUpt.amount)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-sky-50 text-sky-900">
                    <span>2. Koperasi Lapas ({detailModalItem.split.koperasi}%):</span>
                    <span className="font-extrabold">{formatRupiah(detailModalItem.shares.koperasi.amount)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900">
                    <span>3. Inkopasindo ({detailModalItem.split.inkopasindo}%):</span>
                    <span className="font-extrabold">{formatRupiah(detailModalItem.shares.inkopasindo.amount)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-indigo-50 text-indigo-900">
                    <span>4. Vendor Sadewa ({detailModalItem.split.vendor}%):</span>
                    <span className="font-extrabold">{formatRupiah(detailModalItem.shares.vendor.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Form Kelola Status Pembayaran Manual */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ubah Status Pembayaran & Catatan Verifikasi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Status Tagihan</label>
                    <select
                      value={statusAction}
                      onChange={(e) => setStatusAction(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-800"
                    >
                      <option value="PAID">Sudah Dibayar (Lunas)</option>
                      <option value="PENDING_CONFIRMATION">Menunggu Verifikasi Setoran</option>
                      <option value="UNPAID">Belum Dibayar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">No. Referensi / Bukti Transfer</label>
                    <input
                      type="text"
                      placeholder="TRX-XXXXXX"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Metode Pembayaran</label>
                    <input
                      type="text"
                      placeholder="Bank Mandiri / BCA / BNI"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1 text-xs">Catatan Finance</label>
                  <textarea
                    rows="2"
                    placeholder="Tuliskan catatan verifikasi bukti setor atau keterangan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveStatus}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B3D91] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Status Pembayaran'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
