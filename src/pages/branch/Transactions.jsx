import React, { useState } from 'react';
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
  Receipt
} from 'lucide-react';
import { mockTransactions, mockUsers } from '../../services/mockData';
import Modal from '../../components/Modal';
import { exportToCSV } from '../../utils/exportUtils';

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');
  
  // Interactive Modals & Toast State
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [exportToast, setExportToast] = useState('');

  // Filter for Branch 1 (Strictly deduction transactions)
  const branchTransactions = mockTransactions.filter(t => 
    t.branchId === 'b1' && 
    !t.description?.toLowerCase().includes('top up') && 
    t.category !== 'Saldo'
  );
  const branchOfficers = mockUsers.filter(u => u.branchId === 'b1' && u.role === 'Petugas Kantin');

  // Determine transaction category dynamically (Panggilan & Kantin only)
  const getTransactionCategory = (trxOrDesc) => {
    const trx = typeof trxOrDesc === 'object' ? trxOrDesc : { description: trxOrDesc };
    const explicitCat = trx.category;
    const desc = (trx.description || '').toLowerCase();

    // 1. Panggilan (Call Duration Usage)
    if (explicitCat === 'Panggilan' || desc.includes('pemakaian') || (desc.includes('panggilan') && (desc.includes('menit') || desc.includes('suara') || desc.includes('video') || desc.includes('durasi')) && !desc.includes('pembelian'))) {
      return {
        label: 'Panggilan',
        dotColor: 'bg-amber-500',
        sign: '-',
        textColor: 'text-rose-600',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/60'
      };
    }

    // 2. Kantin (Canteen Package purchase)
    return {
      label: 'Kantin',
      dotColor: 'bg-rose-500',
      sign: '-',
      textColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/60'
    };
  };

  const filteredTransactions = branchTransactions
    .filter(trx => {
      const cat = getTransactionCategory(trx);
      const matchesSearch = trx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           trx.inmateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (trx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || trx.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || cat.label === categoryFilter;
      const matchesOfficer = officerFilter === 'All' || trx.officerId === officerFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesOfficer;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPemakaian = filteredTransactions.filter(t => t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);
  const totalPanggilan = filteredTransactions.filter(t => t.status === 'Berhasil' && getTransactionCategory(t).label === 'Panggilan').reduce((sum, t) => sum + t.amount, 0);
  const totalKantin = filteredTransactions.filter(t => t.status === 'Berhasil' && getTransactionCategory(t).label === 'Kantin').reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => {
      const cat = getTransactionCategory(t);
      return {
        ID_Transaksi: t.id,
        WBP: t.inmateName,
        ID_WBP: t.inmateId,
        Nominal: `-${t.amount}`,
        Kategori: cat.label,
        Keterangan: t.description,
        Metode: t.method || 'Potong Saldo',
        Petugas: t.officerName || 'Sistem (Otomatis)',
        Status: t.status,
        Waktu: t.date
      };
    });
    const success = exportToCSV(exportData, `Transaksi_Pemakaian_Cipinang_${statusFilter}.csv`);
    if (success !== false) {
      setExportToast(`Berhasil mengunduh ${filteredTransactions.length} data transaksi (.csv)!`);
      setTimeout(() => setExportToast(''), 4000);
    }
  };

  const handleViewDetail = (trx) => {
    setSelectedTrx(trx);
    setIsDetailModalOpen(true);
  };

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
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">Total Filter</span>
          </div>
          <div>
            <h3 className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Transaksi</h3>
            <p className="text-2xl font-extrabold text-white">{filteredTransactions.length.toString()}</p>
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
            <p className="text-2xl font-extrabold text-[#0B3D91]">-{formatCurrency(totalPemakaian)}</p>
            <p className="text-[10px] text-[#0B3D91]/75 font-semibold mt-1">Panggilan: -{formatCurrency(totalPanggilan)} • Kantin: -{formatCurrency(totalKantin)}</p>
          </div>
        </div>

        {/* Card 3: Estimasi Hari Ini */}
        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/20 border border-emerald-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">Estimasi</span>
          </div>
          <div>
            <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Estimasi Hari Ini</h3>
            <p className="text-2xl font-extrabold text-white">-{formatCurrency(totalPemakaian * 0.25)}</p>
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
            placeholder="Cari ID Trx, WBP, atau keterangan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs bg-slate-50/60 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">Semua Status</option>
              <option value="Berhasil">Berhasil</option>
              <option value="Gagal">Gagal</option>
            </select>
          </div>
          
          {/* Officer Filter */}
          <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">Semua Petugas</option>
              {branchOfficers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="button"
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer ml-auto md:ml-1"
          >
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
        </div>
      </div>

      {exportToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
          {exportToast}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden transition-all">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 lg:px-5 whitespace-nowrap">ID Transaksi</th>
                <th className="py-3.5 px-4 lg:px-5">WBP</th>
                <th className="py-3.5 px-4 lg:px-5 whitespace-nowrap">Nominal</th>
                <th className="py-3.5 px-4 lg:px-5">Keterangan</th>
                <th className="py-3.5 px-4 lg:px-5 whitespace-nowrap">Petugas Kantin</th>
                <th className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 text-xs">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => {
                  const cat = getTransactionCategory(trx);
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-mono">{trx.id}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {new Date(trx.date).toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})} WIB
                        </div>
                      </td>
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{trx.inmateName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{trx.inmateId}</div>
                      </td>
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        <div className={`font-extrabold text-sm ${cat.textColor}`}>
                          {cat.sign}{formatCurrency(trx.amount)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`}></span>
                          {cat.label}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 lg:px-5">
                        <span className="text-xs font-medium text-slate-600 block">
                          {trx.description || 'Top Up Saldo Panggilan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 lg:px-5 whitespace-nowrap">
                        {trx.officerName && trx.officerName !== '-' && !trx.officerName.toLowerCase().includes('sistem') ? (
                          <div className="text-xs font-semibold text-slate-700">{trx.officerName}</div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Sistem (Otomatis)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          trx.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                          'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {trx.status === 'Berhasil' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          {trx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 lg:px-5 text-center whitespace-nowrap">
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
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">Tidak ada transaksi ditemukan</p>
                      <p className="text-xs mt-1 text-slate-400">Coba ubah kata kunci pencarian atau filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium">Menampilkan 1-{filteredTransactions.length} dari {filteredTransactions.length} transaksi</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Sebelumnya</button>
              <button type="button" className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-bold text-xs shadow-xs">1</button>
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Selanjutnya</button>
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
                  <span className="text-slate-400 font-medium">Kategori Transaksi:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`}></span>
                    {cat.label} (Potongan Saldo)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Keterangan / Peruntukan:</span>
                  <span className="font-bold text-slate-800">{selectedTrx.description || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Metode Pembayaran:</span>
                  <span className="font-bold text-slate-800">{selectedTrx.method || 'Potong Saldo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Petugas / Pemroses:</span>
                  <span className="font-bold text-slate-800">
                    {selectedTrx.officerName && selectedTrx.officerName !== '-' && !selectedTrx.officerName.toLowerCase().includes('sistem') 
                      ? selectedTrx.officerName 
                      : 'Sistem (Otomatis)'}
                  </span>
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
