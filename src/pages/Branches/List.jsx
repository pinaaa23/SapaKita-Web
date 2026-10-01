import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Download, Building2, MapPin, SearchX, X, AlertCircle } from 'lucide-react';
import { getBranches } from '../../services/branchService';
import { logout } from '../../services/api';
import { exportToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

const List = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  const [branchesData, setBranchesData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
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

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBranches({ search: debouncedSearch, page, limit });
      setBranchesData(res);
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      }
      setBranchesData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, limit, navigate]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Filtering by status
  const filteredBranches = branchesData.items.filter(branch => {
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && branch.status === 'Active') ||
                          (statusFilter === 'Inactive' && branch.status === 'Inactive');
    return matchesStatus;
  });

  const handleExport = () => {
    if (filteredBranches.length === 0) {
      showToast('Tidak ada data cabang untuk diekspor.', 'error');
      return;
    }
    const exportData = filteredBranches.map((b, idx) => ({
      'No': idx + 1,
      'ID Cabang': b.id,
      'Nama UPT / Cabang': b.name,
      'Lokasi': b.location,
      'Alamat Lengkap': b.address,
      'Nomor Telepon': b.phone,
      'Kapasitas Maksimal': b.capacity,
      'Jumlah WBP': b.inmateCount,
      'Jumlah Admin / Petugas': b.adminCount,
      'Status Operasional': b.status === 'Active' ? 'Aktif' : 'Nonaktif'
    }));

    const activeCount = filteredBranches.filter(b => b.status === 'Active').length;
    const totalWbp = filteredBranches.reduce((sum, b) => sum + (b.inmateCount || 0), 0);

    const filename = `Daftar_Cabang_UPT_Nasional_${new Date().toISOString().split('T')[0]}.xlsx`;
    const success = exportToExcel(exportData, filename, 'Cabang UPT', {
      title: 'LAPORAN DATA MASTER CABANG & UPT PEMASYARAKATAN',
      subtitle: 'Daftar Seluruh Unit Pelaksana Teknis (UPT) Lapas & Rutan Se-Indonesia',
      metadata: {
        'Tingkat': 'Pusat / Nasional',
        'Dicetak Oleh': `${userName || 'Super Administrator'} (Super Administrator)`,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter === 'Active' ? 'Aktif' : 'Nonaktif',
        'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics: [
        { label: 'Total Cabang / UPT', value: `${filteredBranches.length} UPT` },
        { label: 'Cabang Aktif', value: `${activeCount} UPT` },
        { label: 'Total Warga Binaan', value: `${totalWbp} Orang` },
      ]
    });

    if (success !== false) {
      showToast('Berhasil mengekspor data cabang UPT ke format Excel!', 'success');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Control Bar: Search, Filters & Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama cabang atau lokasi..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Nama Cabang</th>
                <th className="py-4 px-6">Lokasi</th>
                <th className="py-4 px-6">Kapasitas & WBP</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-36 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-24 mb-1.5" /><div className="h-1.5 bg-slate-100 rounded w-36" /></td>
                    <td className="py-4 px-6 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-7 bg-slate-200 rounded-lg w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold shrink-0 border border-blue-100/80">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{branch.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{branch.phone || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{branch.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {new Intl.NumberFormat('id-ID').format(branch.inmateCount)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">/ {branch.capacity} Kapasitas</span>
                      </div>
                      <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={`h-full rounded-full ${
                            (branch.inmateCount / branch.capacity) > 1 
                              ? 'bg-rose-500' 
                              : (branch.inmateCount / branch.capacity) > 0.8 
                                ? 'bg-amber-500' 
                                : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, branch.capacity ? (branch.inmateCount / branch.capacity) * 100 : 0)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        branch.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {branch.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
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
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">Belum ada data cabang</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchInput ? 'Tidak ada cabang yang sesuai dengan kata kunci pencarian.' : 'Belum ada data cabang yang terdaftar di sistem.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>Menampilkan <span className="font-bold text-slate-700">{filteredBranches.length}</span> dari {branchesData.total || filteredBranches.length} cabang terdaftar</div>
          {branchesData.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 text-xs font-semibold"
              >
                Sebelumnya
              </button>
              <button 
                type="button"
                disabled={page >= branchesData.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 text-xs font-semibold"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default List;
