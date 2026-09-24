import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Download, Building2 } from 'lucide-react';
import { mockBranches } from '../../services/mockData';
import { exportToCSV } from '../../utils/exportUtils';

const List = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Filtering
  const filteredBranches = mockBranches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          branch.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && branch.status === 'Active') ||
                          (statusFilter === 'Inactive' && branch.status === 'Inactive');
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const exportData = filteredBranches.map(b => ({
      'ID': b.id,
      'Nama Cabang': b.name,
      'Lokasi': b.location,
      'Alamat': b.address,
      'Telepon': b.phone,
      'Kapasitas': b.capacity,
      'Jumlah WBP': b.inmateCount,
      'Jumlah Admin': b.adminCount,
      'Status': b.status === 'Active' ? 'Aktif' : 'Nonaktif'
    }));
    exportToCSV(exportData, `Daftar_Cabang_PasCall_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-5">
      {/* Control Bar: Search, Filters & Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama cabang atau lokasi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            />
          </div>

          {/* Status Tabs & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {['All', 'Active', 'Inactive'].map(status => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'All' ? 'Semua' : status === 'Active' ? 'Aktif' : 'Nonaktif'}
                </button>
              ))}
            </div>

            <button 
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <Link 
              to="/branches/create" 
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Cabang
            </Link>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Nama Cabang</th>
                <th className="px-6 py-4 font-bold">Lokasi</th>
                <th className="px-6 py-4 font-bold">Jml Petugas</th>
                <th className="px-6 py-4 font-bold">Kapasitas & WBP</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{branch.name}</p>
                          <p className="text-[11px] text-slate-400">{branch.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{branch.location}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{branch.adminCount} Petugas</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {new Intl.NumberFormat('id-ID').format(branch.inmateCount)}
                        </span>
                        <span className="text-[11px] text-slate-400">/ {branch.capacity} Kapasitas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        branch.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {branch.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => navigate(`/branches/${branch.id}`)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                          title="Lihat Detail Cabang"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/branches/${branch.id}/edit`)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                          title="Edit Data Cabang"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data cabang yang sesuai dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>Menampilkan <span className="font-bold text-slate-700">{filteredBranches.length}</span> dari {mockBranches.length} cabang terdaftar</div>
        </div>
      </div>
    </div>
  );
};

export default List;

