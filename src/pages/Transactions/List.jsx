import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, CheckCircle2, XCircle, Wallet, ArrowUpRight, Clock, Users } from 'lucide-react';
import { mockTransactions, mockBranches, mockUsers, mockTransactionStats } from '../../services/mockData';
import StatCard from '../../components/StatCard';

const List = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  const branchesMap = mockBranches.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});

  const canteenOfficers = mockUsers.filter(u => u.role === 'Petugas Kantin');

  const filteredTransactions = mockTransactions.filter(trx => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = trx.id.toLowerCase().includes(searchLower) || 
                          trx.inmateName.toLowerCase().includes(searchLower) ||
                          trx.inmateId.toLowerCase().includes(searchLower);
    
    const matchesBranch = branchFilter === 'All' || trx.branchId === branchFilter;
    const matchesOfficer = officerFilter === 'All' || trx.officerName === officerFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const trxDate = new Date(trx.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86399999;
      matchesDate = trxDate >= start && trxDate <= end;
    }

    return matchesSearch && matchesBranch && matchesOfficer && matchesDate;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
        <p className="text-slate-500 text-sm mt-1">Monitoring transaksi top-up saldo seluruh cabang (Immutable Ledger).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Transaksi Hari Ini" 
          value={new Intl.NumberFormat('id-ID').format(mockTransactionStats.todayCount)} 
          icon={ArrowUpRight} 
        />
        <StatCard 
          title="Total Nominal Hari Ini" 
          value={formatCurrency(mockTransactionStats.todayAmount)} 
          icon={Wallet} 
        />
        <StatCard 
          title="Total Transaksi Bulan Ini" 
          value={new Intl.NumberFormat('id-ID').format(mockTransactionStats.monthCount)} 
          icon={Clock} 
        />
        <StatCard 
          title="Total Nominal Bulan Ini" 
          value={formatCurrency(mockTransactionStats.monthAmount)} 
          icon={Wallet} 
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Tampilkan</span>
            <select 
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">entri</span>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari ID transaksi atau nama Napi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full lg:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={branchFilter} 
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent focus:outline-none flex-1 font-medium min-w-[150px]"
            >
              <option value="All">Semua Cabang</option>
              {mockBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full lg:w-auto">
            <Users className="w-4 h-4 text-slate-400" />
            <select 
              value={officerFilter} 
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="bg-transparent focus:outline-none flex-1 font-medium min-w-[150px]"
            >
              <option value="All">Semua Petugas Kantin</option>
              {canteenOfficers.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 w-full lg:w-auto flex-1 lg:flex-none">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex-1 lg:flex-none"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex-1 lg:flex-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-4 font-medium">ID Transaksi</th>
                <th className="px-4 py-4 font-medium">Waktu</th>
                <th className="px-4 py-4 font-medium">Narapidana</th>
                <th className="px-4 py-4 font-medium">Cabang</th>
                <th className="px-4 py-4 font-medium">Petugas Kantin</th>
                <th className="px-4 py-4 font-medium text-right">Nominal</th>
                <th className="px-4 py-4 font-medium text-center">Status</th>
                <th className="px-4 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, entriesPerPage).map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {trx.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-800 font-medium">
                        {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{trx.inmateName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{trx.inmateId}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">
                      {branchesMap[trx.branchId]}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {trx.officerName}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800 font-bold whitespace-nowrap">
                      {formatCurrency(trx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {trx.status === 'Berhasil' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" /> Berhasil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" /> Gagal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => navigate(`/transactions/${trx.id}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-md transition-all text-xs font-semibold border border-slate-200 hover:border-transparent"
                      >
                        <FileText className="w-3.5 h-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data transaksi yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <div>
            Menampilkan {Math.min(filteredTransactions.length, entriesPerPage)} dari {filteredTransactions.length} entri
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>Sebelumnya</button>
            <button className="px-3 py-1 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;
