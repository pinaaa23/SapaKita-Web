import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  CreditCard,
  TrendingUp,
  Ticket,
  Calendar,
  CheckCircle2,
  XCircle,
  SearchX,
  FileSpreadsheet,
  FileText,
  Receipt,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { getBalanceTransactions } from '../../services/balanceService';
import { logout } from '../../services/api';
import Modal from '../../components/Modal';
import { exportToExcel, exportToPDF, exportToCSV } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

const Transactions = () => {
  const navigate = useNavigate();
  const { uptName, isSupervisor, userName, roleLabel } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [transactionsData, setTransactionsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
    totalOmzet: 0,
    totalPemakaian: 0,
    totalVoucherUsed: 0,
    totalVoucherActive: 0,
  });

  // Interactive Modals & Toast State
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  // Debounce search 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getBalanceTransactions({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit,
      });
      setTransactionsData(res);
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      } else if (err?.isNetworkError || err?.status === 0) {
        showToast('Server tidak dapat dihubungi.', 'error');
      }
      console.error('[BranchTransactions] Gagal memuat data transaksi kantin:', err);
      setError('Gagal memuat data transaksi kantin');
      setTransactionsData({
        items: [],
        total: 0,
        totalPages: 1,
        totalOmzet: 0,
        totalPemakaian: 0,
        totalVoucherUsed: 0,
        totalVoucherActive: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, limit, navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const computedTotalOmzet = transactionsData.totalOmzet ?? transactionsData.items.filter(t => t.status === 'Berhasil').reduce((sum, t) => sum + (t.amount || 0), 0);
  const computedVoucherUsed = transactionsData.totalVoucherUsed ?? transactionsData.items.filter(t => t.isVoucherUsed).length;
  const computedVoucherActive = transactionsData.totalVoucherActive ?? transactionsData.items.filter(t => !t.isVoucherUsed).length;

  const handleExport = () => {
    if (transactionsData.items.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor.', 'error');
      return;
    }

    // PDF Export Resmi Transaksi Kantin UPT
    const headers = ['No', 'ID Transaksi', 'Kode Voucher', 'Nama WBP', 'NIP', 'Paket', 'Durasi', 'Nominal', 'Kasir', 'Status Voucher', 'Waktu'];
    const rows = transactionsData.items.map((t, idx) => {
      return [
        String(idx + 1),
        t.id || '-',
        t.kodeVoucher || '-',
        t.inmateName || '-',
        t.inmateId || '-',
        t.packageName || 'Paket Voucher',
        t.durationMinutes ? `${t.durationMinutes} Menit` : '-',
        formatCurrency(t.amount),
        t.officerName || 'Petugas Kasir',
        t.isVoucherUsed ? 'Terpakai' : 'Aktif',
        t.date ? new Date(t.date).toLocaleString('id-ID') : '-'
      ];
    });

    const summaryMetrics = [
      { label: 'TOTAL TRANSAKSI', value: `${transactionsData.total || transactionsData.items.length} Paket` },
      { label: 'TOTAL OMZET', value: formatCurrency(computedTotalOmzet) },
      { label: 'VOUCHER TERPAKAI', value: `${computedVoucherUsed} Voucher` },
      { label: 'VOUCHER AKTIF', value: `${computedVoucherActive} Voucher` }
    ];

    const filename = `Riwayat_Transaksi_Kantin_${(uptName || 'UPT').replace(/\s+/g, '_')}_${statusFilter}.pdf`;
    const success = exportToPDF({
      title: 'LAPORAN TRANSAKSI PEMBELIAN PAKET KANTIN',
      subtitle: `Rekapitulasi riwayat pembelian voucher & paket komunikasi narapidana`,
      filename,
      headers,
      rows,
      orientation: 'landscape',
      metadata: {
        'Lokasi UPT': uptName || 'UPT Pemasyarakatan',
        'Dicetak Oleh': `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
        'Tanggal Cetak': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics
    });

    if (success !== false) {
      showToast('Berhasil mengekspor data transaksi kantin ke format PDF!', 'success');
    }
  };

  const handleViewDetail = (trx) => {
    setSelectedTrx(trx);
    setIsCopied(false);
    setIsDetailModalOpen(true);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Total Transaksi Pembelian */}
        <div className="bg-gradient-to-br from-[#0B3D91] to-[#1E5FCC] text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20 border border-blue-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">Kantin UPT</span>
          </div>
          <div>
            <h3 className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Transaksi Paket</h3>
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : (error ? '-' : (transactionsData.total || transactionsData.items.length).toString())}
            </p>
            <p className="text-[10px] text-blue-200 font-medium mt-1">Transaksi pembelian paket voucher oleh WBP</p>
          </div>
        </div>
        
        {/* Card 2: Total Omzet Penjualan */}
        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/20 border border-emerald-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">Penerimaan Tunai</span>
          </div>
          <div>
            <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Omzet Paket Kantin</h3>
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : (error ? '-' : formatCurrency(computedTotalOmzet))}
            </p>
            <p className="text-[10px] text-emerald-100 font-semibold mt-1">
              Akumulasi pembayaran tunai di kasir kantin
            </p>
          </div>
        </div>

        {/* Card 3: Status Voucher Panggilan */}
        <div className="bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-[#0B3D91] rounded-2xl p-5 shadow-lg shadow-amber-500/20 border border-amber-300/40 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-[#0B3D91]/15 backdrop-blur-md rounded-xl flex items-center justify-center text-[#0B3D91] shrink-0 border border-[#0B3D91]/20">
              <Ticket className="w-5 h-5 text-[#0B3D91]" />
            </div>
            <span className="text-[10px] font-extrabold bg-[#0B3D91]/15 text-[#0B3D91] px-2.5 py-0.5 rounded-full border border-[#0B3D91]/20">Voucher 5 Digit</span>
          </div>
          <div>
            <h3 className="text-[#0B3D91]/80 text-xs font-bold uppercase tracking-wider mb-1">Status Voucher WBP</h3>
            <p className="text-2xl font-extrabold text-[#0B3D91]">
              {isLoading ? '...' : `${computedVoucherUsed} Terpakai`}
            </p>
            <p className="text-[10px] text-[#0B3D91]/80 font-bold mt-1">
              {isLoading ? '...' : `${computedVoucherActive} Voucher aktif belum digunakan`}
            </p>
          </div>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/80 flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari ID Trx, Kode Voucher, WBP, atau Paket..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs bg-slate-50/60 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">Semua Status</option>
              <option value="Berhasil">Berhasil</option>
              <option value="Gagal">Gagal</option>
            </select>
          </div>

          <button 
            type="button"
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer ml-auto md:ml-1"
            title="Export Data Transaksi"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {toastMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          {toastMessage.text}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden transition-all">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-3 whitespace-nowrap w-[24%]">Waktu &amp; ID Transaksi</th>
                <th className="py-3.5 px-3 whitespace-nowrap w-[22%]">Warga Binaan &amp; NIP</th>
                <th className="py-3.5 px-3 min-w-[150px] w-[20%]">Paket Komunikasi</th>
                <th className="py-3.5 px-3 whitespace-nowrap w-[18%]">Kode Voucher</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap w-[10%]">Total Bayar</th>
                <th className="py-3.5 pl-3 pr-5 text-center whitespace-nowrap w-[6%]">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 pl-5 pr-3"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-32 mb-1" /><div className="h-3 bg-slate-100 rounded w-16" /></td>
                    <td className="py-3.5 px-3"><div className="h-6 bg-slate-200 rounded-lg w-24" /></td>
                    <td className="py-3.5 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto" /></td>
                    <td className="py-3.5 pl-3 pr-5 text-center"><div className="h-7 bg-slate-200 rounded-lg w-14 mx-auto" /></td>
                  </tr>
                ))
              ) : transactionsData.items.length > 0 ? (
                transactionsData.items.map((trx) => {
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Waktu & ID Transaksi */}
                      <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          <span className="text-slate-400 font-medium ml-1.5 text-[11px]">
                            {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-mono text-[10.5px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                            {trx.id}
                          </span>
                        </div>
                      </td>

                      {/* Warga Binaan & NIP */}
                      <td className="py-3.5 px-3 max-w-[170px]">
                        <p className="font-bold text-slate-800 text-xs truncate" title={trx.inmateName}>
                          {trx.inmateName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-400 truncate" title={`NIP: ${trx.inmateId}`}>
                            NIP: {trx.inmateId}
                          </span>
                          {trx.inmateBlock && trx.inmateBlock !== '-' && (
                            <span className="text-slate-400">• {trx.inmateBlock}</span>
                          )}
                        </div>
                      </td>

                      {/* Paket Dibeli */}
                      <td className="py-3.5 px-3 max-w-[170px]">
                        <p className="text-xs text-slate-800 font-bold leading-snug line-clamp-1" title={trx.packageName}>
                          {trx.packageName}
                        </p>
                        {trx.durationMinutes > 0 && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            {trx.durationMinutes} Menit
                          </span>
                        )}
                      </td>

                      {/* Kode Voucher & Status Pemakaian */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300/80 rounded-lg font-mono font-black text-xs tracking-wider shadow-2xs">
                            {trx.kodeVoucher}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trx.isVoucherUsed 
                              ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {trx.isVoucherUsed ? 'Terpakai' : 'Aktif'}
                          </span>
                        </div>
                      </td>

                      {/* Total Pembayaran */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="text-slate-900 font-extrabold text-xs tracking-tight">
                          {formatCurrency(trx.amount)}
                        </span>
                      </td>

                      {/* Aksi: Buka Detail Lengkap */}
                      <td className="py-3.5 pl-3 pr-5 text-center whitespace-nowrap">
                        <button 
                          type="button" 
                          onClick={() => handleViewDetail(trx)}
                          className="p-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center" 
                          title="Lihat Rincian Transaksi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : error ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-500">
                      <XCircle className="w-12 h-12 mb-3 text-rose-400" />
                      <p className="font-bold text-rose-700">{error}</p>
                      <button 
                        type="button" 
                        onClick={loadTransactions}
                        className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">Belum ada transaksi</p>
                      <p className="text-xs mt-1 text-slate-400">Tidak ada catatan transaksi pembelian paket kantin.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && transactionsData.items.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium text-center sm:text-left">
              Menampilkan {transactionsData.items.length} dari total {transactionsData.total || transactionsData.items.length} transaksi paket
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button type="button" className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-bold text-xs shadow-xs">
                {page}
              </button>
              <button 
                type="button" 
                disabled={page >= transactionsData.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Struk Pembelian Paket - ${selectedTrx?.id}`}
        cancelText="Tutup"
        confirmText="Download Struk (.txt)"
        onConfirm={() => {
          if (!selectedTrx) return;
          const textContent = `
==================================================
           SADEWA CANTEEN RECEIPT
==================================================
ID Transaksi     : ${selectedTrx.id}
Status           : ${selectedTrx.status}
Waktu            : ${new Date(selectedTrx.date).toLocaleString('id-ID')} WIB
Petugas Kasir    : ${selectedTrx.officerName || 'Petugas Kasir'}

--------------------------------------------------
DATA WARGA BINAAN PEMASYARAKATAN
--------------------------------------------------
Nama WBP         : ${selectedTrx.inmateName}
Nomor Registrasi : ${selectedTrx.inmateId}
Blok / Kamar     : ${selectedTrx.inmateBlock || '-'}

--------------------------------------------------
DETAIL VOUCHER PANGGILAN
--------------------------------------------------
KODE VOUCHER     : [ ${selectedTrx.kodeVoucher} ]
Paket            : ${selectedTrx.packageName}
Durasi           : ${selectedTrx.durationMinutes || 0} Menit
Status Voucher   : ${selectedTrx.isVoucherUsed ? 'SUDAH DIGUNAKAN' : 'AKTIF / BELUM DIGUNAKAN'}

--------------------------------------------------
RINCIAN PEMBAYARAN TUNAI
--------------------------------------------------
Harga DPP        : ${formatCurrency(selectedTrx.dpp || 0)}
PPN 11%          : ${formatCurrency(selectedTrx.ppn || 0)}
TOTAL PEMBAYARAN : ${formatCurrency(selectedTrx.amount)}
Metode           : Tunai
==================================================
        Terima Kasih atas Kunjungan Anda
==================================================
`;
          const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Struk_Kantin_${selectedTrx.kodeVoucher || selectedTrx.id}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsDetailModalOpen(false);
        }}
      >
        {selectedTrx && (
          <div className="space-y-4 text-xs">
            {/* Voucher Code Box */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 text-center space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                Kode Voucher Panggilan
              </span>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-3xl font-black font-mono tracking-widest text-amber-950">
                  {selectedTrx.kodeVoucher}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedTrx.kodeVoucher)}
                  className="p-1.5 bg-amber-200/70 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors cursor-pointer"
                  title="Salin Kode Voucher"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] font-semibold text-amber-800">
                {selectedTrx.packageName} • {selectedTrx.durationMinutes || 0} Menit Bicara
              </p>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold ${
                  selectedTrx.isVoucherUsed 
                    ? 'bg-slate-200 text-slate-700' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                }`}>
                  {selectedTrx.isVoucherUsed ? 'Voucher Telah Digunakan' : 'Voucher Aktif (Belum Digunakan)'}
                </span>
              </div>
            </div>

            {/* Transaction Data */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">ID Transaksi:</span>
                <span className="font-bold text-slate-800 font-mono">{selectedTrx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Nama WBP:</span>
                <span className="font-bold text-slate-800">{selectedTrx.inmateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">NIP / No Registrasi:</span>
                <span className="font-bold font-mono text-slate-800">{selectedTrx.inmateId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Kamar / Blok:</span>
                <span className="font-semibold text-slate-700">{selectedTrx.inmateBlock || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Petugas Kasir:</span>
                <span className="font-semibold text-slate-700">{selectedTrx.officerName || 'Petugas Kasir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Waktu Transaksi:</span>
                <span className="font-medium text-slate-600">{new Date(selectedTrx.date).toLocaleString('id-ID')} WIB</span>
              </div>

              {/* Rincian Finansial */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1.5 mt-2">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>DPP (Dasar Pengenaan Pajak)</span>
                  <span className="font-semibold">{formatCurrency(selectedTrx.dpp || 0)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>PPN 11%</span>
                  <span className="font-semibold">{formatCurrency(selectedTrx.ppn || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-200/80 pt-1.5">
                  <span>Total Pembayaran (Tunai)</span>
                  <span className="text-emerald-700 font-black">{formatCurrency(selectedTrx.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Transactions;
