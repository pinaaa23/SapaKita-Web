import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Play, FileText, Loader2, Video, User } from 'lucide-react';
import { mockCalls, mockBranches } from '../../services/mockData';

const List = () => {
  const navigate = useNavigate();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  // Derived data
  const branchesMap = mockBranches.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});

  // Filtering Logic
  const filteredCalls = mockCalls.filter(call => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = call.inmateName.toLowerCase().includes(searchLower) || 
                          call.inmateId.toLowerCase().includes(searchLower) ||
                          call.familyName.toLowerCase().includes(searchLower) ||
                          call.familyPhone.includes(searchLower);
    
    const matchesBranch = branchFilter === 'All' || call.branchId === branchFilter;
    const matchesStatus = statusFilter === 'All' || call.status === statusFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const callDate = new Date(call.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86399999; // end of day
      matchesDate = callDate >= start && callDate <= end;
    }

    return matchesSearch && matchesBranch && matchesStatus && matchesDate;
  });

  const formatDuration = (seconds) => {
    if (seconds === 0) return '-';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatCurrency = (value) => {
    if (value === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Panggilan</h1>
        <p className="text-slate-500 text-sm mt-1">Log panggilan, rekaman video, dan transkrip seluruh cabang.</p>
      </div>

      {/* Toolbar & Filters */}
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
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-600">entri</span>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama/ID Napi atau nama/no Keluarga..." 
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
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none flex-1 font-medium min-w-[120px]"
            >
              <option value="All">Semua Status</option>
              <option value="Answered">Answered</option>
              <option value="No Answer">No Answer</option>
              <option value="Busy">Busy</option>
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-4 font-medium">Waktu</th>
                <th className="px-4 py-4 font-medium">Narapidana</th>
                <th className="px-4 py-4 font-medium">Keluarga</th>
                <th className="px-4 py-4 font-medium">Cabang</th>
                <th className="px-4 py-4 font-medium text-center">Status</th>
                <th className="px-4 py-4 font-medium text-center">Durasi</th>
                <th className="px-4 py-4 font-medium text-right">Biaya</th>
                <th className="px-4 py-4 font-medium text-center">Rekaman</th>
                <th className="px-4 py-4 font-medium text-center">Transkrip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCalls.length > 0 ? (
                filteredCalls.slice(0, entriesPerPage).map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-800 font-medium">
                        {new Date(call.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{call.inmateName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{call.inmateId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{call.familyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{call.familyPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">
                      {branchesMap[call.branchId]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        call.status === 'Answered' ? 'bg-green-100 text-green-700' : 
                        call.status === 'No Answer' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium whitespace-nowrap">
                      {formatDuration(call.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                      {formatCurrency(call.cost)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {call.hasRecording ? (
                        <div className="relative group inline-block">
                          <button 
                            onClick={() => navigate(`/calls/${call.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-md transition-all text-xs font-semibold"
                          >
                            {call.callType === 'Video' ? <Video className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} 
                            {call.callType}
                          </button>
                          {/* Fake Tooltip */}
                          {call.callType === 'Video' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 h-20 bg-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 flex items-center justify-center overflow-hidden border border-slate-700">
                              <div className="absolute inset-0 flex">
                                <div className="w-1/2 h-full bg-slate-700 flex items-center justify-center border-r border-slate-900"><User className="w-6 h-6 text-slate-500" /></div>
                                <div className="w-1/2 h-full bg-slate-700 flex items-center justify-center"><User className="w-6 h-6 text-slate-500" /></div>
                              </div>
                              <Video className="w-5 h-5 text-white/50 absolute" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {call.transcriptStatus === 'Completed' ? (
                        <button 
                          onClick={() => navigate(`/calls/${call.id}?tab=transcript`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-md transition-all text-xs font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" /> Lihat
                        </button>
                      ) : call.transcriptStatus === 'Processing' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          <span className="absolute flex h-2 w-2 -top-1 -right-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data riwayat panggilan yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <div>
            Menampilkan {Math.min(filteredCalls.length, entriesPerPage)} dari {filteredCalls.length} entri
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
