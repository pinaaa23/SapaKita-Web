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
  const [officerFilter, setOfficerFilter] = useState('All');
  
  // Interactive Modals & Toast State
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [exportToast, setExportToast] = useState('');

  // Filter for Branch 1
  const branchTransactions = mockTransactions.filter(t => t.branchId === 'b1');
  const branchOfficers = mockUsers.filter(u => u.branchId === 'b1' && u.role === 'Petugas Kantin');

  const filteredTransactions = branchTransactions.filter(trx => {
    const matchesSearch = trx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         trx.inmateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || trx.status === statusFilter;
    const matchesOfficer = officerFilter === 'All' || trx.officerId === officerFilter;
    return matchesSearch && matchesStatus && matchesOfficer;
  });

  const totalAmount = filteredTransactions.filter(t => t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExport = () => {
    const success = exportToCSV(filteredTransactions, `Transaksi_Cabang_Cipinang_${statusFilter}.csv`);
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
        
        {/* Card 2: Total Nominal Berhasil */}
        <div className="bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-[#0B3D91] rounded-2xl p-5 shadow-lg shadow-amber-500/20 border border-amber-300/40 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-[#0B3D91]/15 backdrop-blur-md rounded-xl flex items-center justify-center text-[#0B3D91] shrink-0 border border-[#0B3D91]/20">
              <TrendingUp className="w-5 h-5 text-[#0B3D91]" />
            </div>
            <span className="text-[10px] font-extrabold bg-[#0B3D91]/15 text-[#0B3D91] px-2.5 py-0.5 rounded-full border border-[#0B3D91]/20">Berhasil</span>
          </div>
          <div>
            <h3 className="text-[#0B3D91]/80 text-xs font-bold uppercase tracking-wider mb-1">Total Nominal Berhasil</h3>
            <p className="text-2xl font-extrabold text-[#0B3D91]">{formatCurrency(totalAmount)}</p>
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
            <p className="text-2xl font-extrabold text-white">{formatCurrency(totalAmount * 0.1)}</p>
          </div>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/80 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari ID Trx atau Nama WBP..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs bg-slate-50/50 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-xs cursor-pointer ml-auto md:ml-2"
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4 font-semibold">ID Transaksi</th>
                <th className="px-6 py-4 font-semibold">WBP</th>
                <th className="px-6 py-4 font-semibold">Nominal</th>
                <th className="px-6 py-4 font-semibold">Petugas Kantin</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{trx.id}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{new Date(trx.date).toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{trx.inmateName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{trx.inmateId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-800">{formatCurrency(trx.amount)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {trx.method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-700">{trx.officerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        trx.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                        'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        {trx.status === 'Berhasil' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {trx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => handleViewDetail(trx)}
                          className="p-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg transition-colors cursor-pointer" 
                          title="Lihat Struk / Detail Transaksi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
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
        
        {/* Pagination Safety */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium">Menampilkan 1-{filteredTransactions.length} dari {filteredTransactions.length} transaksi</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Sebelumnya</button>
              <button type="button" className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-bold text-xs shadow-sm">1</button>
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
        {selectedTrx && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-[11px]">Nominal Transaksi</p>
              <p className="text-2xl font-black text-slate-800">{formatCurrency(selectedTrx.amount)}</p>
              <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                selectedTrx.status === 'Berhasil' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {selectedTrx.status}
              </span>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">ID Transaksi:</span>
                <span className="font-bold text-slate-800 font-mono">{selectedTrx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama WBP:</span>
                <span className="font-bold text-slate-800">{selectedTrx.inmateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Pembayaran:</span>
                <span className="font-bold text-slate-800">{selectedTrx.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Petugas Kantin:</span>
                <span className="font-bold text-slate-800">{selectedTrx.officerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Transaksi:</span>
                <span className="font-medium text-slate-600">{new Date(selectedTrx.date).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Transactions;
