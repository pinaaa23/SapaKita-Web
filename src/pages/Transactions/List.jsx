import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  Users, 
  Download,
  Building2,
  Calendar,
  X,
  ChevronDown
} from 'lucide-react';
import { mockTransactions, mockBranches, mockUsers, mockTransactionStats } from '../../services/mockData';
import { exportToCSV } from '../../utils/exportUtils';
import StatCard from '../../components/StatCard';

const List = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage] = useState(10);
  
  const branchesMap = mockBranches.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});

  const canteenOfficers = mockUsers.filter(u => u.role === 'Petugas Kantin');

  const filteredTransactions = mockTransactions.filter(trx => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                          trx.id.toLowerCase().includes(searchLower) || 
                          trx.inmateName.toLowerCase().includes(searchLower) || 
                          trx.inmateId.toLowerCase().includes(searchLower);
    
    const matchesBranch = branchFilter === 'All' || trx.branchId === branchFilter;
    const matchesOfficer = officerFilter === 'All' || trx.officerName === officerFilter;
    const matchesStatus = statusFilter === 'All' || trx.status === statusFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const trxDate = new Date(trx.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86399999;
      matchesDate = trxDate >= start && trxDate <= end;
    }

    return matchesSearch && matchesBranch && matchesOfficer && matchesStatus && matchesDate;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      'ID Transaksi': t.id,
      'Cabang': branchesMap[t.branchId] || t.branchId,
      'Nama WBP': t.inmateName,
      'ID WBP': t.inmateId,
      'Nominal (Rp)': t.amount,
      'Petugas': t.officerName,
      'Metode': t.method,
      'Status': t.status,
      'Waktu': new Date(t.date).toLocaleString('id-ID'),
      'Saldo Sebelum': t.balanceBefore,
      'Saldo Sesudah': t.balanceAfter
    }));
    exportToCSV(exportData, `Data_Transaksi_PasCall_${new Date().toISOString().split('T')[0]}`);
  };

  const hasActiveFilters = searchTerm !== '' || branchFilter !== 'All' || officerFilter !== 'All' || statusFilter !== 'All' || startDate !== '' || endDate !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setBranchFilter('All');
    setOfficerFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard 
          title="Total Transaksi Hari Ini" 
          value={new Intl.NumberFormat('id-ID').format(mockTransactionStats.todayCount)} 
          icon={ArrowUpRight} 
          color="blue"
        />
        <StatCard 
          title="Total Nominal Hari Ini" 
          value={formatCurrency(mockTransactionStats.todayAmount)} 
          icon={Wallet} 
          color="green"
        />
        <StatCard 
          title="Total Transaksi Bulan Ini" 
          value={new Intl.NumberFormat('id-ID').format(mockTransactionStats.monthCount)} 
          icon={Clock} 
          color="primary"
        />
        <StatCard 
          title="Total Nominal Bulan Ini" 
          value={formatCurrency(mockTransactionStats.monthAmount)} 
          icon={Wallet} 
          color="accent"
        />
      </div>

      {/* Control Bar & Filters - Compact & Optimized Spacing */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
        {/* Row 1: Search & Export Action */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Robust & Compact Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari ID transaksi (TRX-...), nama WBP, atau ID WBP..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
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
              title="Export data transaksi ke CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> 
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        
        {/* Row 2: Filter Toolbar with Compact Spacing */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Cabang Filter */}
            <div className="relative">
              <select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                className={`pl-2.5 pr-7 py-1 rounded-xl border text-xs font-semibold appearance-none cursor-pointer transition-all ${
                  branchFilter !== 'All' 
                    ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs' 
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <option value="All">Semua Cabang</option>
                {mockBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Petugas Filter */}
            <div className="relative">
              <select 
                value={officerFilter} 
                onChange={(e) => setOfficerFilter(e.target.value)}
                className={`pl-2.5 pr-7 py-1 rounded-xl border text-xs font-semibold appearance-none cursor-pointer transition-all ${
                  officerFilter !== 'All' 
                    ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs' 
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <option value="All">Semua Petugas</option>
                {canteenOfficers.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
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
                  onClick={() => setStatusFilter(item.key)}
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
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none text-[11px] font-medium text-slate-700 cursor-pointer"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
            Menampilkan <strong className="text-slate-700 font-bold">{filteredTransactions.length}</strong> dari {mockTransactions.length} transaksi
          </div>
        </div>
      </div>

      {/* Table Card - Optimized column widths and cell padding so columns never get clipped */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="px-3.5 py-3 font-bold whitespace-nowrap">ID Transaksi</th>
                <th className="px-3 py-3 font-bold whitespace-nowrap">Waktu</th>
                <th className="px-3 py-3 font-bold">Narapidana</th>
                <th className="px-3 py-3 font-bold">Cabang</th>
                <th className="px-3 py-3 font-bold">Petugas Kantin</th>
                <th className="px-3.5 py-3 font-bold text-right whitespace-nowrap">Nominal</th>
                <th className="px-2.5 py-3 font-bold text-center whitespace-nowrap">Status</th>
                <th className="px-3 py-3 font-bold text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, entriesPerPage).map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID Transaksi */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/70">
                        {trx.id}
                      </span>
                    </td>

                    {/* Waktu */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="font-bold text-slate-800 text-xs">
                        {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-slate-400 text-[11px] font-medium">
                        {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </td>

                    {/* Narapidana */}
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-slate-800 text-xs truncate max-w-[130px]" title={trx.inmateName}>
                        {trx.inmateName}
                      </p>
                      <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold inline-block">
                        {trx.inmateId}
                      </span>
                    </td>

                    {/* Cabang */}
                    <td className="px-3 py-2.5 text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-xs truncate max-w-[130px]" title={branchesMap[trx.branchId] || trx.branchId}>
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{branchesMap[trx.branchId] || trx.branchId}</span>
                      </span>
                    </td>

                    {/* Petugas Kantin */}
                    <td className="px-3 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {trx.officerName}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="px-3.5 py-2.5 text-right text-slate-800 font-bold whitespace-nowrap">
                      <span className="text-emerald-700 font-bold">
                        {formatCurrency(trx.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                      {trx.status === 'Berhasil' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Berhasil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Gagal
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <button 
                        onClick={() => navigate(`/transactions/${trx.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-primary rounded-lg text-xs font-bold transition-all border border-slate-200/80 cursor-pointer shadow-2xs"
                        title="Lihat Detail Transaksi"
                      >
                        <FileText className="w-3 h-3 text-slate-500" /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700 text-sm">Tidak ada data transaksi yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter cabang & status.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
          <div>
            Menampilkan <strong className="text-slate-800">{Math.min(filteredTransactions.length, entriesPerPage)}</strong> dari {filteredTransactions.length} transaksi
          </div>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors" disabled>
              Sebelumnya
            </button>
            <button className="px-3 py-1.5 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors" disabled>
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;
