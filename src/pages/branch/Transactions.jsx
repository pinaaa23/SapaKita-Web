import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  CreditCard,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  SearchX,
  FileSpreadsheet,
  FileText,
  Receipt,
  AlertCircle
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [transactionsData, setTransactionsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
    totalPemakaian: null,
    totalPanggilan: null,
    totalKantin: null,
  });

  // Interactive Modals & Toast State
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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
        category: categoryFilter,
        officerId: officerFilter,
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
      console.error('[BranchTransactions] Gagal memuat data transaksi:', err);
      setError('Gagal memuat data transaksi');
      setTransactionsData({
        items: [],
        total: 0,
        totalPages: 1,
        totalPemakaian: null,
        totalPanggilan: null,
        totalKantin: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, categoryFilter, officerFilter, page, limit, navigate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getTransactionCategory = (trx) => {
    const isPanggilan = (trx.category || '').toLowerCase().includes('panggil');
    if (isPanggilan) {
      return {
        label: 'Panggilan',
        dotColor: 'bg-amber-500',
        sign: '-',
        textColor: 'text-rose-600',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/60'
      };
    }
    return {
      label: 'Kantin',
      dotColor: 'bg-rose-500',
      sign: '-',
      textColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/60'
    };
  };

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

    if (isSupervisor) {
      // PDF Export untuk Supervisor (Terkunci & Tidak bisa diubah)
      const headers = ['No', 'ID Transaksi', 'Nama WBP', 'NIP', 'Nominal', 'Kategori', 'Keterangan', 'Petugas', 'Status', 'Waktu'];
      const rows = transactionsData.items.map((t, idx) => {
        const cat = getTransactionCategory(t);
        return [
          String(idx + 1),
          t.id || '-',
          t.inmateName || '-',
          t.inmateId || '-',
          `-${formatCurrency(t.amount)}`,
          cat.label || 'Pemakaian',
          t.description || '-',
          t.officerName || 'Sistem (Otomatis)',
          t.status || 'Berhasil',
          t.date || '-'
        ];
      });

      const summaryMetrics = [
        { label: 'TOTAL TRANSAKSI', value: `${transactionsData.items.length} Data` },
        { label: 'TOTAL PEMAKAIAN', value: `-${formatCurrency(computedTotalPemakaian)}` },
        { label: 'PANGGILAN', value: formatCurrency(computedTotalPanggilan) },
        { label: 'KANTIN', value: formatCurrency(computedTotalKantin) }
      ];

      const filename = `Mutasi_Transaksi_${(uptName || 'UPT').replace(/\s+/g, '_')}_${statusFilter}.pdf`;
      const success = exportToPDF({
        title: 'LAPORAN MUTASI & TRANSAKSI SALDO PASCALL',
        subtitle: `Rekapitulasi riwayat mutasi saldo komunikasi dan kantin warga binaan`,
        filename,
        headers,
        rows,
        orientation: 'landscape',
        metadata: {
          'Lokasi UPT': uptName || 'Lapas Cipinang',
          'Dicetak Oleh': `${userName || 'Petugas'} (${roleLabel || 'Supervisor'})`,
          'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
          'Tanggal Cetak': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        summaryMetrics
      });

      if (success !== false) {
        showToast('Berhasil mengekspor data transaksi!', 'success');
      }
    } else {
      // Excel Export untuk Kepala UPT
      const exportData = transactionsData.items.map(t => {
        const cat = getTransactionCategory(t);
        return {
          ID_Transaksi: t.id,
          WBP: t.inmateName,
          NIP: t.inmateId,
          Nominal: `-${t.amount}`,
          Kategori: cat.label,
          Keterangan: t.description,
          Metode: t.method || 'Potong Saldo',
          Petugas: t.officerName || 'Sistem (Otomatis)',
          Status: t.status,
          Waktu: t.date
        };
      });
      const filename = `Transaksi_Mutasi_Cabang_${statusFilter}.xlsx`;
      const success = exportToExcel(exportData, filename, 'Transaksi', {
        title: 'LAPORAN MUTASI & TRANSAKSI SALDO PASCALL',
        subtitle: 'Rekapitulasi riwayat mutasi saldo komunikasi dan kantin warga binaan',
        metadata: {
          'Lokasi UPT': uptName || 'Lapas Cipinang',
          'Dicetak Oleh': `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
          'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
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
        showToast('Berhasil mengekspor data transaksi!', 'success');
      }
    }
  };

  const handleViewDetail = (trx) => {
    setSelectedTrx(trx);
    setIsDetailModalOpen(true);
  };

  const computedTotalPemakaian = transactionsData.totalPemakaian ?? (transactionsData.items.length > 0 ? transactionsData.items.filter(t => t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0) : null);
  const computedTotalPanggilan = transactionsData.totalPanggilan ?? (transactionsData.items.length > 0 ? transactionsData.items.filter(t => t.status === 'Berhasil' && getTransactionCategory(t).label === 'Panggilan').reduce((sum, t) => sum + t.amount, 0) : null);
  const computedTotalKantin = transactionsData.totalKantin ?? (transactionsData.items.length > 0 ? transactionsData.items.filter(t => t.status === 'Berhasil' && getTransactionCategory(t).label === 'Kantin').reduce((sum, t) => sum + t.amount, 0) : null);

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Total Transaksi */}
        <div className="bg-gradient-to-br from-[#0B3D91] to-[#1E5FCC] text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20 border border-blue-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">Total Mutasi</span>
          </div>
          <div>
            <h3 className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Transaksi</h3>
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : (error || transactionsData.items.length === 0 ? '-' : (transactionsData.total || transactionsData.items.length).toString())}
            </p>
          </div>
        </div>
        
        {/* Card 2: Total Pemakaian Saldo */}
        <div className="bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-[#0B3D91] rounded-2xl p-5 shadow-lg shadow-amber-500/20 border border-amber-300/40 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-[#0B3D91]/15 backdrop-blur-md rounded-xl flex items-center justify-center text-[#0B3D91] shrink-0 border border-[#0B3D91]/20">
              <TrendingUp className="w-5 h-5 text-[#0B3D91]" />
            </div>
            <span className="text-[10px] font-extrabold bg-[#0B3D91]/15 text-[#0B3D91] px-2.5 py-0.5 rounded-full border border-[#0B3D91]/20">Berhasil</span>
          </div>
          <div>
            <h3 className="text-[#0B3D91]/80 text-xs font-bold uppercase tracking-wider mb-1">Total Pemakaian Saldo</h3>
            <p className="text-2xl font-extrabold text-[#0B3D91]">
              {isLoading ? '...' : (error || computedTotalPemakaian === null || transactionsData.items.length === 0 ? '-' : `-${formatCurrency(computedTotalPemakaian)}`)}
            </p>
            <p className="text-[10px] text-[#0B3D91]/75 font-semibold mt-1">
              {computedTotalPanggilan !== null && computedTotalKantin !== null && transactionsData.items.length > 0
                ? `Panggilan: -${formatCurrency(computedTotalPanggilan)} • Kantin: -${formatCurrency(computedTotalKantin)}`
                : 'Panggilan: - • Kantin: -'}
            </p>
          </div>
        </div>

        {/* Card 3: Estimasi Hari Ini */}
        {/* menunggu keputusan tim & endpoint BE */}
        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/20 border border-emerald-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">Estimasi</span>
          </div>
          <div>
            <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Estimasi Hari Ini</h3>
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : '-'}
            </p>
            <p className="text-[10px] text-emerald-200 font-semibold mt-1">Estimasi pemakaian harian cabang</p>
          </div>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/80 flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari ID Trx, NIP/WBP, atau keterangan..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs bg-slate-50/60 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={categoryFilter} 
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">Semua Kategori</option>
              <option value="Panggilan">Panggilan</option>
              <option value="Kantin">Kantin</option>
            </select>
          </div>

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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-2 whitespace-nowrap">ID Transaksi</th>
                <th className="py-3 px-2.5 whitespace-nowrap">WBP / NIP</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Nominal</th>
                <th className="py-3 px-2.5">Keterangan</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Petugas</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap">Status</th>
                <th className="py-3 pl-2 pr-4 text-center whitespace-nowrap w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 pl-4 pr-2"><div className="h-4 bg-slate-200 rounded w-24 mb-1" /><div className="h-3 bg-slate-100 rounded w-16" /></td>
                    <td className="py-3.5 px-2.5"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-2.5"><div className="h-5 bg-slate-200 rounded w-20" /></td>
                    <td className="py-3.5 px-2.5"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-3.5 px-2.5"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-2.5 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                    <td className="py-3.5 pl-2 pr-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : transactionsData.items.length > 0 ? (
                transactionsData.items.map((trx) => {
                  const cat = getTransactionCategory(trx);
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-mono text-[11px]">{trx.id}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(trx.date).toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})} WIB
                        </div>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{trx.inmateName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">NIP: {trx.inmateId}</div>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <div className={`font-extrabold text-xs ${cat.textColor}`}>
                          {cat.sign}{formatCurrency(trx.amount)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`}></span>
                          {cat.label}
                        </div>
                      </td>
                      <td className="py-3 px-2.5">
                        <span className="text-xs font-medium text-slate-600 block">
                          {trx.description || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700">
                          {trx.officerName || 'Sistem (Otomatis)'}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trx.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                          'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {trx.status === 'Berhasil' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                          {trx.status}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <button 
                            type="button" 
                            onClick={() => handleViewDetail(trx)}
                            className="p-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg transition-colors cursor-pointer" 
                            title="Lihat Struk / Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
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
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">Belum ada transaksi</p>
                      <p className="text-xs mt-1 text-slate-400">Tidak ada catatan mutasi transaksi saldo.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && transactionsData.items.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium">
              Menampilkan {transactionsData.items.length} dari total {transactionsData.total || transactionsData.items.length} transaksi
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
        title={`Struk Transaksi - ${selectedTrx?.id}`}
        cancelText="Tutup"
        confirmText="Download Struk"
        onConfirm={() => {
          exportToCSV([selectedTrx], `Struk_${selectedTrx?.id}.csv`);
          setIsDetailModalOpen(false);
        }}
      >
        {selectedTrx && (() => {
          const cat = getTransactionCategory(selectedTrx);
          return (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center mx-auto mb-2">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="text-slate-400 text-[11px]">Nominal Transaksi</p>
                <p className={`text-2xl font-black ${cat.textColor}`}>
                  {cat.sign}{formatCurrency(selectedTrx.amount)}
                </p>
                <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                  selectedTrx.status === 'Berhasil' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {selectedTrx.status}
                </span>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">ID Transaksi:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Nama WBP:</span>
                  <span className="font-bold text-slate-800">{selectedTrx.inmateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">NIP:</span>
                  <span className="font-bold font-mono text-slate-800">{selectedTrx.inmateId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Kategori Transaksi:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`}></span>
                    {cat.label} (Potongan Saldo)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Keterangan:</span>
                  <span className="font-bold text-slate-800">{selectedTrx.description || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Metode Pembayaran:</span>
                  <span className="font-bold text-slate-800">{selectedTrx.method || 'Potong Saldo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Waktu Transaksi:</span>
                  <span className="font-medium text-slate-600">{new Date(selectedTrx.date).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
};

export default Transactions;
