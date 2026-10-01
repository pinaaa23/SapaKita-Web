import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { getBalanceTransactions } from '../../services/balanceService';
import { logout } from '../../services/api';
import { exportToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

const List = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();
  
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Data state
  const [transactionsData, setTransactionsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
    totalPemakaian: 0,
    totalPanggilan: 0,
    totalKantin: 0,
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
        branchId: branchFilter,
        category: categoryFilter,
        officerId: officerFilter,
        status: statusFilter,
        startDate,
        endDate,
        page,
        limit: entriesPerPage,
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
      }
      setTransactionsData({
        items: [],
        total: 0,
        totalPages: 1,
        totalPemakaian: 0,
        totalPanggilan: 0,
        totalKantin: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, branchFilter, categoryFilter, officerFilter, statusFilter, startDate, endDate, page, entriesPerPage, navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Category determination helper
  const getTransactionCategory = (trx) => {
    const explicitCat = trx.category;
    const desc = (trx.description || '').toLowerCase();

    if (explicitCat === 'Panggilan' || desc.includes('pemakaian') || (desc.includes('panggilan') && !desc.includes('pembelian'))) {
      return {
        label: 'Panggilan',
        dotColor: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/60'
      };
    }

    return {
      label: 'Kantin',
      dotColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/60'
    };
  };

  const computedTotalPemakaian = transactionsData.totalPemakaian ?? transactionsData.items.filter(t => t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);
  const computedTotalPanggilan = transactionsData.totalPanggilan ?? transactionsData.items.filter(t => t.status === 'Berhasil' && getTransactionCategory(t).label === 'Panggilan').reduce((sum, t) => sum + t.amount, 0);
  const computedTotalKantin = transactionsData.totalKantin ?? transactionsData.items.filter(t => t.status === 'Berhasil' && getTransactionCategory(t).label === 'Kantin').reduce((sum, t) => sum + t.amount, 0);
  const totalMutasiSukses = transactionsData.items.filter(t => t.status === 'Berhasil').length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const handleExport = () => {
    if (transactionsData.items.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor.', 'error');
      return;
    }
    const exportData = transactionsData.items.map(t => {
      const cat = getTransactionCategory(t);
      return {
        'ID Transaksi': t.id,
        'Cabang': t.branchName || t.branchId || 'Pusat',
        'Nama WBP': t.inmateName,
        'NIP': t.inmateId,
        'Kategori': cat.label,
        'Keterangan': t.description,
        'Nominal (Rp)': `-${t.amount}`,
        'Petugas': t.officerName || 'Sistem (Otomatis)',
        'Metode': t.method || 'Potong Saldo',
        'Status': t.status,
        'Waktu': new Date(t.date).toLocaleString('id-ID'),
        'Saldo Sebelum': t.balanceBefore,
        'Saldo Sesudah': t.balanceAfter
      };
    });

    const filename = `Data_Mutasi_Transaksi_Nasional_${new Date().toISOString().split('T')[0]}.xlsx`;
    const success = exportToExcel(exportData, filename, 'Transaksi Nasional', {
      title: 'LAPORAN MUTASI & TRANSAKSI SALDO NASIONAL PASCALL',
      subtitle: 'Rekapitulasi Konsolidasi Seluruh Transaksi Komunikasi & Kantin UPT Se-Indonesia',
      metadata: {
        'Tingkat': 'Pusat / Nasional',
        'Dicetak Oleh': `${userName || 'Super Administrator'} (Super Administrator)`,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
        'Kategori Filter': categoryFilter === 'All' ? 'Semua Kategori' : categoryFilter,
        'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics: [
        { label: 'Total Transaksi', value: `${transactionsData.items.length} Data` },
        { label: 'Total Pemakaian', value: `-${formatCurrency(computedTotalPemakaian)}` },
        { label: 'Panggilan', value: formatCurrency(computedTotalPanggilan) },
        { label: 'Kantin', value: formatCurrency(computedTotalKantin) },
      ]
    });

    if (success !== false) {
      showToast('Berhasil mengekspor data transaksi ke format Excel!', 'success');
    }
  };

  const hasActiveFilters = searchInput !== '' || branchFilter !== 'All' || categoryFilter !== 'All' || officerFilter !== 'All' || statusFilter !== 'All' || startDate !== '' || endDate !== '';

  const resetFilters = () => {
    setSearchInput('');
    setBranchFilter('All');
    setCategoryFilter('All');
    setOfficerFilter('All');
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
          title="Total Pemakaian Nasional" 
          value={isLoading ? '...' : formatCurrency(computedTotalPemakaian)} 
          icon={Wallet} 
          color="rose"
        />
        <StatCard 
          title="Pemakaian Panggilan" 
          value={isLoading ? '...' : formatCurrency(computedTotalPanggilan)} 
          icon={PhoneCall} 
          color="accent"
        />
        <StatCard 
          title="Pemakaian Paket Kantin" 
          value={isLoading ? '...' : formatCurrency(computedTotalKantin)} 
          icon={ShoppingBag} 
          color="blue"
        />
        <StatCard 
          title="Total Mutasi Sukses" 
          value={isLoading ? '...' : new Intl.NumberFormat('id-ID').format(totalMutasiSukses)} 
          icon={ArrowDownRight} 
          color="green"
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
              placeholder="Cari ID transaksi, nama WBP, NIP, atau keterangan..." 
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
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Row 2: Filter Toolbar */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Kategori Filter (Panggilan / Kantin) */}
            <div className="relative">
              <select 
                value={categoryFilter} 
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-2.5 pr-7 py-1 rounded-xl border text-xs font-semibold appearance-none cursor-pointer transition-all ${
                  categoryFilter !== 'All' 
                    ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs' 
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <option value="All">Semua Kategori</option>
                <option value="Panggilan">Panggilan</option>
                <option value="Kantin">Kantin</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

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
            Menampilkan <strong className="text-slate-700 font-bold">{transactionsData.items.length}</strong> dari {transactionsData.total || transactionsData.items.length} transaksi
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 lg:px-5 whitespace-nowrap">ID Transaksi & Waktu</th>
                <th className="py-3.5 px-4 lg:px-5 whitespace-nowrap">Warga Binaan & NIP</th>
                <th className="py-3.5 px-4 lg:px-5">Kategori & Keterangan</th>
                <th className="py-3.5 px-4 lg:px-5 whitespace-nowrap">Petugas / Sistem</th>
                <th className="py-3.5 px-4 lg:px-5 text-right whitespace-nowrap">Nominal</th>
                <th className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4 lg:px-5"><div className="h-4 bg-slate-200 rounded w-24 mb-1" /><div className="h-3 bg-slate-100 rounded w-16" /></td>
                    <td className="py-3.5 px-4 lg:px-5"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-4 lg:px-5"><div className="h-4 bg-slate-200 rounded w-36 mb-1" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                    <td className="py-3.5 px-4 lg:px-5"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-4 lg:px-5 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                    <td className="py-3.5 px-4 lg:px-5 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="py-3.5 px-4 lg:px-5 text-center"><div className="h-6 bg-slate-200 rounded-lg w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : transactionsData.items.length > 0 ? (
                transactionsData.items.map((trx) => {
                  const cat = getTransactionCategory(trx);
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID Transaksi & Waktu */}
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/70">
                          {trx.id}
                        </span>
                        <p className="text-slate-400 text-[11px] font-medium mt-1">
                          {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </td>

                      {/* Warga Binaan & NIP */}
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        <p className="font-bold text-slate-800 text-xs">
                          {trx.inmateName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-400">NIP: {trx.inmateId}</span>
                        </div>
                      </td>

                      {/* Kategori & Keterangan */}
                      <td className="py-3.5 px-4 lg:px-5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${cat.badgeBg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`}></span>
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-snug">
                          {trx.description || '-'}
                        </p>
                      </td>

                      {/* Petugas / Sistem */}
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {trx.officerName || 'Sistem (Otomatis)'}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 lg:px-5 text-right whitespace-nowrap">
                        <span className="text-rose-600 font-extrabold text-xs tracking-tight">
                          -{formatCurrency(trx.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">
                        {trx.status === 'Berhasil' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Berhasil
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> Gagal
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">
                        <button 
                          type="button"
                          onClick={() => showToast('Fitur detail mutasi lengkap belum tersedia di server.')}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-primary rounded-lg text-xs font-bold transition-all border border-slate-200/80 cursor-pointer shadow-2xs hover:border-primary/30"
                          title="Lihat Detail Transaksi"
                        >
                          <FileText className="w-3 h-3 text-slate-500" /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">Belum ada data</p>
                      <p className="text-xs text-slate-400 mt-1">Tidak ada catatan transaksi mutasi yang tersedia.</p>
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
              Menampilkan <strong className="text-slate-800">{transactionsData.items.length}</strong> dari {transactionsData.total || transactionsData.items.length} transaksi
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
    </div>
  );
};

export default List;
