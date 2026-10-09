import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  TrendingUp,
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
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../utils/formatKantin';
import {
  PPN_RATE,
  getTopupSummary,
  getSuperadminTopupHistory,
  approveTopupTransaction,
  rejectTopupTransaction,
} from '../services/canteenTopupService';
import { getMenitFromNominal } from '../dummy/saldoDummy';
import { getBranches } from '../services/branchService';

export default function CanteenTopup() {
  // 1. State Summary
  const [summary, setSummary] = useState({
    totalSaldoTerjual: 0,
    totalPpn: 0,
    totalTopupCount: 0,
    totalPending: 0,
  });

  // 2. State Riwayat & Permintaan Top Up
  const [allHistory, setAllHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter untuk Tabel Riwayat
  const [searchHistory, setSearchHistory] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [branchFilter, setBranchFilter] = useState('semua');
  const [branchOptions, setBranchOptions] = useState([]);

  // 3. Modal State
  const [topupActionModal, setTopupActionModal] = useState(null); // { action: 'approve' | 'reject', item: object }
  const [detailModalItem, setDetailModalItem] = useState(null); // object transaksi yang dilihat detailnya
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Data awal
  useEffect(() => {
    loadSummaryData();
    loadBranchesList();
    loadData();

    // Listen event bila ada operator kantin yang mengajukan saldo baru secara realtime
    const handleRealtimeUpdate = () => {
      loadSummaryData();
      loadData();
    };

    window.addEventListener('canteen_topup_changed', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
    };
  }, []);

  const loadSummaryData = async () => {
    try {
      const data = await getTopupSummary();
      if (data) setSummary(data);
    } catch (err) {
      console.error('Gagal memuat ringkasan saldo:', err);
    }
  };

  const loadBranchesList = async () => {
    try {
      const res = await getBranches({ limit: 100 });
      const list = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setBranchOptions(list);
    } catch (err) {
      console.error('Gagal memuat cabang:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSuperadminTopupHistory({
        search: '',
        status: 'semua',
        branchId: 'semua',
      });
      setAllHistory(data || []);
    } catch (err) {
      console.error('Gagal memuat data transaksi top up:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Data Permintaan Top Up yang Butuh Konfirmasi (Status: Menunggu)
  const pendingRequests = allHistory.filter((item) => item.status === 'Menunggu');

  // 2. Data Riwayat Transaksi Selesai (Status: Berhasil / Ditolak) dengan filter
  const processedHistory = allHistory
    .filter((item) => item.status !== 'Menunggu')
    .filter((item) => {
      if (statusFilter !== 'semua' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (branchFilter !== 'semua' && item.branchId !== branchFilter) {
        return false;
      }
      if (searchHistory.trim() !== '') {
        const q = searchHistory.toLowerCase();
        const matchId = item.id?.toLowerCase().includes(q);
        const matchBranch = item.branchName?.toLowerCase().includes(q);
        const matchStaff = item.staffName?.toLowerCase().includes(q);
        const matchEmail = item.staffEmail?.toLowerCase().includes(q);
        if (!matchId && !matchBranch && !matchStaff && !matchEmail) {
          return false;
        }
      }
      return true;
    });

  // Action Handlers
  const handleOpenApproveModal = (item) => {
    setTopupActionModal({ action: 'approve', item });
  };

  const handleOpenRejectModal = (item) => {
    setTopupActionModal({ action: 'reject', item });
  };

  const handleConfirmTopupAction = async () => {
    if (!topupActionModal?.item) return;
    const { action, item } = topupActionModal;
    const kuotaMenit = item.menit || getMenitFromNominal(item.nominal);
    setIsProcessingAction(true);
    try {
      if (action === 'approve') {
        await approveTopupTransaction(item.id);
        showToast(
          `Transaksi ${item.id} dari ${item.branchName} (${
            item.staffName || 'Operator'
          }) berhasil disetujui! Kuota ${kuotaMenit.toLocaleString('id-ID')} Menit telah masuk ke kasir.`
        );
      } else {
        await rejectTopupTransaction(item.id);
        showToast(`Transaksi ${item.id} dari ${item.branchName} telah ditolak.`);
      }
      setTopupActionModal(null);
      await Promise.all([loadData(), loadSummaryData()]);
    } catch (err) {
      showToast(err.message || 'Gagal memproses aksi transaksi top up.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TIGA KARTU RINGKASAN STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Kartu 1: Total Saldo Terjual */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Saldo Terjual
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {formatRupiah(summary.totalSaldoTerjual)}
            </div>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dari transaksi disetujui</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 2: Total PPN 11% */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total PPN ({Math.round(PPN_RATE * 100)}%)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {formatRupiah(summary.totalPpn)}
            </div>
            <span className="text-xs font-medium text-slate-400">
              Pajak pertambahan nilai kasir
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 3: Permintaan Masuk */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Permintaan Masuk
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {summary.totalPending}{' '}
              <span className="text-sm font-semibold text-slate-400">Permohonan</span>
            </div>
            <span
              className={`text-xs font-bold ${
                summary.totalPending > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'
              }`}
            >
              {summary.totalPending > 0
                ? `${summary.totalPending} Butuh persetujuan`
                : 'Semua telah diproses'}
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              summary.totalPending > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {summary.totalPending > 0 ? (
              <Clock className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* 2. TABEL ATAS: KONFIRMASI TOP UP (KOLOM RINGKAS: UPT, WAKTU, TOTAL & KUOTA, AKSI) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Konfirmasi Top Up
            </h3>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white shadow-xs animate-pulse">
                {pendingRequests.length} Baru
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Verifikasi pengajuan kuota saldo kasir
          </span>
        </div>

        {/* Tabel Ringkas Konfirmasi */}
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/70 border-b border-amber-100 text-[11px] font-bold text-amber-900/80 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3.5 px-6 w-[36%]">Asal UPT / Kantin</th>
                  <th className="py-3.5 px-6 w-[24%]">Waktu Pengajuan</th>
                  <th className="py-3.5 px-6 text-right w-[22%]">Total Bayar & Kuota</th>
                  <th className="py-3.5 px-6 text-center w-[18%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-semibold">
                      Memeriksa permintaan konfirmasi...
                    </td>
                  </tr>
                ) : pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Tidak Ada Permintaan yang Menunggu Konfirmasi
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Semua pengajuan saldo kantin telah selesai diproses.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((item) => {
                    const kuotaMenit = item.menit || getMenitFromNominal(item.nominal);
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        {/* Asal Kantin / UPT & Kasir */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-800">
                              {item.branchName || 'Lapas Kelas II Yogyakarta'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium pl-6 mt-0.5">
                            Kasir: <span className="font-semibold text-slate-700">{item.staffName || 'Operator'}</span>
                            <span className="text-slate-400 font-mono text-[10px] ml-2">({item.id})</span>
                          </div>
                        </td>

                        {/* Waktu */}
                        <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap">
                          {formatTanggal(item.tanggal)}
                        </td>

                        {/* Total Bayar & Kuota */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="font-black text-[#1565C0] text-sm">
                            {formatRupiah(item.totalBayar)}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600">
                            +{kuotaMenit.toLocaleString('id-ID')} Menit ({formatRupiah(item.nominal)})
                          </div>
                        </td>

                        {/* Aksi (Setujui & Tolak) */}
                        <td className="py-3.5 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(item)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer hover:shadow-xs active:scale-95"
                              title="Setujui saldo masuk"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(item)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Tolak permintaan"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Tolak</span>
                            </button>
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

      {/* 3. TABEL BAWAH: RIWAYAT TOP UP (DILENGKAPI TOMBOL VIEW DETAIL) */}
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">Riwayat Top Up</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log transaksi saldo kuota kantin yang telah diproses.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
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

          <div className="flex items-center gap-2.5">
            {/* Filter Cabang / UPT */}
            <div className="shrink-0">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer max-w-[180px]"
              >
                <option value="semua">Semua Cabang UPT</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
              >
                <option value="semua">Status: Semua</option>
                <option value="berhasil">Status: Berhasil</option>
                <option value="ditolak">Status: Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat dengan Tombol View Detail */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3.5 px-6 w-[34%]">Asal UPT / Kantin</th>
                  <th className="py-3.5 px-6 w-[22%]">Waktu Transaksi</th>
                  <th className="py-3.5 px-6 text-right w-[20%]">Total Bayar & Kuota</th>
                  <th className="py-3.5 px-6 text-center w-[12%]">Status</th>
                  <th className="py-3.5 px-6 text-center w-[12%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                      Memuat riwayat transaksi...
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
                    const kuotaMenit = item.menit || getMenitFromNominal(item.nominal);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Asal Kantin / UPT & Kasir */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-bold text-slate-800">
                              {item.branchName || 'Lapas Kelas II Yogyakarta'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium pl-6 mt-0.5">
                            Kasir: <span className="font-semibold text-slate-700">{item.staffName || 'Operator'}</span>
                            <span className="text-slate-400 font-mono text-[10px] ml-2">({item.id})</span>
                          </div>
                        </td>

                        {/* Waktu */}
                        <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap">
                          {formatTanggal(item.tanggal)}
                        </td>

                        {/* Total Bayar & Kuota */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="font-black text-[#1565C0] text-sm">
                            {formatRupiah(item.totalBayar)}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600">
                            {kuotaMenit.toLocaleString('id-ID')} Menit
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              item.status === 'Berhasil'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-rose-50 text-rose-700 border-rose-200/80'
                            }`}
                          >
                            {item.status === 'Berhasil' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="w-3 h-3 text-rose-500 shrink-0" />
                            )}
                            <span>{item.status}</span>
                          </span>
                        </td>

                        {/* Tombol View Detail */}
                        <td className="py-3.5 px-6 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailModalItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold transition border border-blue-200/60 shadow-2xs cursor-pointer active:scale-95"
                            title="Lihat Rincian Lengkap"
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

      {/* MODAL KONFIRMASI APPROVE / REJECT TOP UP */}
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
                    ? 'Konfirmasi Persetujuan Top Up'
                    : 'Tolak Permintaan Top Up?'}
                </h4>
                <p className="text-xs text-slate-400">
                  ID Transaksi: <span className="font-mono font-bold text-slate-600">{topupActionModal.item.id}</span>
                </p>
              </div>
            </div>

            {/* Rincian Permintaan */}
            {(() => {
              const modalItem = topupActionModal.item;
              const modalKuota = modalItem.menit || getMenitFromNominal(modalItem.nominal);
              return (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200/70 text-xs mb-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Asal UPT / Cabang:</span>
                    <span className="font-bold text-slate-800">{modalItem.branchName || '-'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Petugas Kasir:</span>
                    <span className="font-bold text-slate-800">{modalItem.staffName || 'Operator Kantin'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                    <span>Kuota Menit Masuk:</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {modalKuota.toLocaleString('id-ID')} Menit
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Harga Paket:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(modalItem.nominal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>PPN 11%:</span>
                    <span>{formatRupiah(modalItem.ppn)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                    <span>Total Tagihan:</span>
                    <span className="text-[#1565C0] font-black">{formatRupiah(modalItem.totalBayar)}</span>
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {topupActionModal.action === 'approve'
                ? `Dengan menyetujui, kuota saldo sebanyak ${(
                    topupActionModal.item.menit || getMenitFromNominal(topupActionModal.item.nominal)
                  ).toLocaleString('id-ID')} Menit (${formatRupiah(
                    topupActionModal.item.nominal
                  )}) akan otomatis ditambahkan ke saldo operasional kasir kantin di UPT ini.`
                : 'Permintaan top up ini akan ditolak dan kuota menit kasir kantin tidak akan bertambah.'}
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTopupActionModal(null)}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmTopupAction}
                disabled={isProcessingAction}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 ${
                  topupActionModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessingAction ? (
                  'Memproses...'
                ) : topupActionModal.action === 'approve' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Ya, Setujui Top Up</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Ya, Tolak Permintaan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIEW DETAIL TRANSAKSI RIWAYAT */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            {/* Header Modal Detail */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Detail Transaksi Top Up</h4>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    {detailModalItem.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Rincian */}
            <div className="space-y-3.5 text-xs">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-semibold text-slate-600">Status Transaksi</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    detailModalItem.status === 'Berhasil'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {detailModalItem.status === 'Berhasil' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{detailModalItem.status === 'Berhasil' ? 'Berhasil (Disetujui)' : 'Ditolak'}</span>
                </span>
              </div>

              {/* Data Cabang & Petugas */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Asal UPT Cabang:</span>
                  <span className="font-bold text-slate-800 text-right">{detailModalItem.branchName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Kasir:</span>
                  <span className="font-bold text-slate-800 text-right">{detailModalItem.staffName || 'Operator Kantin'}</span>
                </div>
                {detailModalItem.staffEmail && detailModalItem.staffEmail !== '-' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Kasir:</span>
                    <span className="text-slate-600 font-mono text-[11px] text-right">{detailModalItem.staffEmail}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200/70">
                  <span className="text-slate-500">Waktu Pengajuan:</span>
                  <span className="font-semibold text-slate-700 text-right">{formatTanggal(detailModalItem.tanggal)}</span>
                </div>
              </div>

              {/* Rincian Keuangan & Kuota */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Kuota Menit Kasir:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {(
                      detailModalItem.menit || getMenitFromNominal(detailModalItem.nominal)
                    ).toLocaleString('id-ID')}{' '}
                    Menit
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Harga Paket:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(detailModalItem.nominal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>PPN 11%:</span>
                  <span className="font-medium text-slate-700">{formatRupiah(detailModalItem.ppn)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-blue-200/60 text-sm">
                  <span>Total Bayar:</span>
                  <span className="font-black text-[#1565C0]">{formatRupiah(detailModalItem.totalBayar)}</span>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

