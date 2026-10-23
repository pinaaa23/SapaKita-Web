import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  ArrowDownRight, 
  Clock, 
  Users, 
  Download,
  Building2,
  Calendar,
  X,
  ChevronDown,
  PhoneCall,
  ShoppingBag,
  SearchX,
  AlertCircle,
  Receipt,
  Ticket,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import Modal from '../../components/Modal';
import { getBalanceTransactions } from '../../services/balanceService';
import { logout } from '../../services/api';
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';
import { exportToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

const List = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();
  
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Pop-up Detail Modal State
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    try {
      const res = await getBalanceTransactions({
        search: debouncedSearch,
        status: statusFilter,
        startDate,
        endDate,
        page,
        limit: entriesPerPage,
      });
      setTransactionsData(res);
    } catch (err) {
      if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      }
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
  }, [debouncedSearch, statusFilter, startDate, endDate, page, entriesPerPage, navigate]);

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
    const exportData = transactionsData.items.map(t => {
      return {
        'ID Transaksi': t.id,
        'Kode Voucher': t.kodeVoucher,
        'Nama WBP': t.inmateName,
        'NIP': t.inmateId,
        'Blok/Kamar': t.inmateBlock || '-',
        'Paket': t.packageName,
        'Durasi (Menit)': t.durationMinutes || 0,
        'Nominal (Rp)': t.amount,
        'DPP': t.dpp || 0,
        'PPN': t.ppn || 0,
        'Petugas Kasir': t.officerName || 'Petugas Kasir',
        'Status Voucher': t.isVoucherUsed ? 'Sudah Digunakan' : 'Belum Digunakan',
        'Metode': t.method || 'Tunai',
        'Status Transaksi': t.status,
        'Waktu': new Date(t.date).toLocaleString('id-ID'),
      };
    });

    const filename = `Data_Transaksi_Kantin_Nasional_${new Date().toISOString().split('T')[0]}.xlsx`;
    const success = exportToExcel(exportData, filename, 'Transaksi Kantin Nasional', {
      title: 'LAPORAN TRANSAKSI PEMBELIAN PAKET KANTIN NASIONAL SADEWA',
      subtitle: 'Rekapitulasi Konsolidasi Seluruh Pembelian Paket Voucher Kantin Se-Indonesia',
      metadata: {
        'Tingkat': 'Pusat / Nasional',
        'Dicetak Oleh': `${userName || 'Super Administrator'} (Super Administrator)`,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
        'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics: [
        { label: 'Total Transaksi', value: `${transactionsData.total || transactionsData.items.length} Data` },
        { label: 'Total Omzet Nasional', value: formatCurrency(computedTotalOmzet) },
        { label: 'Voucher Terpakai', value: `${computedVoucherUsed}` },
        { label: 'Voucher Aktif', value: `${computedVoucherActive}` },
      ]
    });

    if (success !== false) {
      showToast('Berhasil mengekspor data transaksi ke format Excel!', 'success');
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasActiveFilters = searchInput !== '' || statusFilter !== 'All' || startDate !== '' || endDate !== '';

  const resetFilters = () => {
    setSearchInput('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toastMessage.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard 
          title="Total Omzet Nasional" 
          value={isLoading ? '...' : formatCurrency(computedTotalOmzet)} 
          icon={Wallet} 
          color="blue"
        />
        <StatCard 
          title="Total Transaksi Paket" 
          value={isLoading ? '...' : `${transactionsData.total || transactionsData.items.length} Paket`} 
          icon={ShoppingBag} 
          color="green"
        />
        <StatCard 
          title="Voucher Digunakan" 
          value={isLoading ? '...' : `${computedVoucherUsed} Terpakai`} 
          icon={CheckCircle2} 
          color="accent"
        />
        <StatCard 
          title="Voucher Aktif Tersedia" 
          value={isLoading ? '...' : `${computedVoucherActive} Aktif`} 
          icon={Ticket} 
          color="rose"
        />
      </div>

      {/* Control Bar & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
        {/* Row 1: Search & Export Action */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari ID transaksi, kode voucher, nama WBP, NIP, atau paket..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={() => setSearchInput('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button 
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
              title="Export data transaksi ke Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> 
              <span>Export Excel</span>
            </button>
          </div>
        </div>
        
        {/* Row 2: Filter Toolbar */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Status Segmented Tabs */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Berhasil', label: 'Berhasil' },
                { key: 'Gagal', label: 'Gagal' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => {
                    setStatusFilter(item.key);
                    setPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === item.key 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1 shadow-2xs">
              <Calendar className="w-3 h-3 text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent focus:outline-none text-[11px] font-medium text-slate-700 cursor-pointer"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent focus:outline-none text-[11px] font-medium text-slate-700 cursor-pointer"
                title="Tanggal Selesai"
              />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Result Count Info */}
          <div className="text-slate-400 text-[11px] font-medium ml-auto">
            Menampilkan <strong className="text-slate-700 font-bold">{transactionsData.items.length}</strong> dari {transactionsData.total || transactionsData.items.length} transaksi paket
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-3 whitespace-nowrap w-[22%]">Waktu &amp; ID Transaksi</th>
                <th className="py-3.5 px-3 whitespace-nowrap w-[19%]">Warga Binaan &amp; NIP</th>
                <th className="py-3.5 px-3 min-w-[140px] w-[18%]">Paket Komunikasi</th>
                <th className="py-3.5 px-3 whitespace-nowrap w-[14%]">Kode Voucher</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap w-[12%]">Status Voucher</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap w-[9%]">Total Bayar</th>
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
                    <td className="py-3.5 px-3 text-center"><div className="h-5 bg-slate-200 rounded-full w-14 mx-auto" /></td>
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
                      <td className="py-3.5 px-3 max-w-[160px]">
                        <p className="font-bold text-slate-800 text-xs truncate" title={trx.inmateName}>
                          {trx.inmateName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-400 truncate" title={`NIP: ${trx.inmateId}`}>
                            NIP: {trx.inmateId && trx.inmateId.length > 15 ? `${trx.inmateId.slice(0, 13)}...` : trx.inmateId}
                          </span>
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

                      {/* Kode Voucher */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300/80 rounded-lg font-mono font-black text-xs tracking-wider shadow-2xs">
                          {trx.kodeVoucher}
                        </span>
                      </td>

                      {/* Status Pemakaian Voucher (Kolom Terpisah & Rapi) */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold shadow-2xs ${
                          trx.isVoucherUsed 
                            ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${trx.isVoucherUsed ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                          <span>{trx.isVoucherUsed ? 'Terpakai' : 'Aktif'}</span>
                        </span>
                      </td>

                      {/* Total Pembayaran (Nominal) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="text-slate-900 font-extrabold text-xs tracking-tight">
                          {formatCurrency(trx.amount)}
                        </span>
                      </td>

                      {/* Aksi: Buka Detail Lengkap */}
                      <td className="py-3.5 pl-3 pr-5 text-center whitespace-nowrap">
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedTrx(trx);
                            setIsCopied(false);
                            setIsDetailModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-100 cursor-pointer shadow-2xs"
                          title="Lihat Rincian Lengkap & Struk"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">Belum ada transaksi</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada catatan transaksi pembelian paket kantin yang tersedia.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        {!isLoading && transactionsData.items.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
            <div>
              Menampilkan <strong className="text-slate-800">{transactionsData.items.length}</strong> dari {transactionsData.total || transactionsData.items.length} transaksi paket
            </div>
            <div className="flex gap-1.5">
              <button 
                type="button" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button 
                type="button" 
                disabled={page >= transactionsData.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up Simple Detail Transaksi */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Rincian Transaksi - ${selectedTrx?.id}`}
        confirmText="Tutup"
        cancelText="Batal"
        onConfirm={() => setIsDetailModalOpen(false)}
      >
        {selectedTrx && (
          <div className="space-y-4 text-xs">
            {/* Header Voucher Card */}
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

            {/* Rincian List */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">ID Transaksi</span>
                <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{selectedTrx.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Warga Binaan (WBP)</span>
                <span className="font-bold text-slate-800">{selectedTrx.inmateName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Nomor Induk (NIP)</span>
                <span className="font-bold font-mono text-slate-700">{selectedTrx.inmateId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Kamar / Blok</span>
                <span className="font-semibold text-slate-700">{selectedTrx.inmateBlock || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Petugas Kasir</span>
                <span className="font-bold text-slate-800">{selectedTrx.officerName || 'Petugas Kasir'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Waktu Transaksi</span>
                <span className="font-semibold text-slate-700">{new Date(selectedTrx.date).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
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

              <div className="pt-2 text-center">
                <Link 
                  to={`/transactions/${selectedTrx.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                >
                  <span>Buka Lembar Audit Struk Lengkap</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default List;
