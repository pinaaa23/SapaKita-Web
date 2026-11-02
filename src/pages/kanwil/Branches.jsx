import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Download, 
  Building2, 
  MapPin, 
  X, 
  AlertCircle,
  Phone,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getKanwilBranches } from '../../services/kanwilService';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

export default function KanwilBranches() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const kanwilId = user?.kanwilId || user?.kanwil?.id;
  const kanwilName = user?.kanwilName || user?.kanwil?.name || 'Kantor Wilayah';

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Detail Modal State
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [branchesData, setBranchesData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 5000);
  };

  // Check incoming redirect message from branch creation
  useEffect(() => {
    if (location.state?.successMessage) {
      showToast(location.state.successMessage, 'success');
      // Clear state so toast doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Debounce search 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getKanwilBranches(kanwilId, {
        search: debouncedSearch,
        limit: 50,
      });
      setBranchesData(res);
    } catch (err) {
      console.error('Error fetching kanwil branches:', err);
      showToast('Gagal memuat data UPT.', 'error');
      setBranchesData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [kanwilId, debouncedSearch]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Filtering by status
  const filteredBranches = branchesData.items.filter((branch) => {
    const isAktif = branch.status === 'Active' || branch.status === 'Aktif';
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return isAktif;
    if (statusFilter === 'Inactive') return !isAktif;
    return true;
  });

  const handleExportPDF = () => {
    if (filteredBranches.length === 0) {
      showToast('Tidak ada data UPT untuk diekspor.', 'error');
      return;
    }

    const headers = ['No', 'Nama UPT', 'Lokasi / Kota', 'Provinsi', 'Kapasitas', 'Jumlah WBP', 'Status', 'Nomor Telepon'];
    const rows = filteredBranches.map((b, idx) => [
      idx + 1,
      b.name,
      b.city || b.location || '-',
      b.province || '-',
      b.capacity ? `${b.capacity} Orang` : '0 Orang',
      b.inmateCount ? `${b.inmateCount} Orang` : '0 Orang',
      (b.status === 'Active' || b.status === 'Aktif') ? 'Aktif' : 'Nonaktif',
      b.phone || '-'
    ]);

    const activeCount = filteredBranches.filter(b => b.status === 'Active' || b.status === 'Aktif').length;
    const totalWbp = filteredBranches.reduce((sum, b) => sum + (b.inmateCount || 0), 0);
    const totalCapacity = filteredBranches.reduce((sum, b) => sum + (b.capacity || 0), 0);

    const filename = `Daftar_UPT_${kanwilName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const success = exportToPDF({
      title: `DAFTAR UNIT PELAKSANA TEKNIS (UPT) - ${kanwilName.toUpperCase()}`,
      subtitle: `Laporan Data Unit Pelaksana Teknis di Bawah Naungan ${kanwilName}`,
      filename,
      headers,
      rows,
      orientation: 'landscape',
      metadata: {
        'Tingkat Wilayah': 'Kantor Wilayah Pemasyarakatan',
        'Nama Kanwil': kanwilName,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter === 'Active' ? 'Aktif' : 'Nonaktif',
        'Tanggal Cetak': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics: [
        { label: 'TOTAL UPT BINAAN', value: `${filteredBranches.length} UPT` },
        { label: 'UPT AKTIF BEROPERASI', value: `${activeCount} UPT` },
        { label: 'TOTAL WBP DI WILAYAH', value: `${totalWbp} Orang` },
        { label: 'TOTAL KAPASITAS', value: `${totalCapacity} Orang` },
      ]
    });

    if (success !== false) {
      showToast('Berhasil mengekspor daftar UPT ke format PDF!', 'success');
    }
  };

  const openDetailModal = (branch) => {
    setSelectedBranch(branch);
    setIsDetailModalOpen(true);
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

      {/* Control Bar: Search, Filters, Export & Tambah UPT */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama UPT atau lokasi..." 
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
              {['All', 'Active', 'Inactive'].map((status) => (
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

            <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200/80 rounded-xl text-slate-500 font-semibold text-xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Mode Pemantauan Wilayah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-left w-[32%]">Nama Cabang</th>
                <th className="py-3.5 px-4 text-left w-[24%]">Lokasi</th>
                <th className="py-3.5 px-4 text-left w-[26%]">Kapasitas & WBP</th>
                <th className="py-3.5 px-4 text-center w-[10%]">Status</th>
                <th className="py-3.5 px-4 text-center w-[8%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-44 mb-1" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24 mb-1.5" /><div className="h-1.5 bg-slate-100 rounded w-36" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => {
                  const isAktif = branch.status === 'Active' || branch.status === 'Aktif';
                  const occupancyPct = branch.capacity ? (branch.inmateCount / branch.capacity) * 100 : 0;

                  return (
                    <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold shrink-0 border border-blue-100/80">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{branch.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{branch.phone || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{branch.city || branch.location || 'Indonesia'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {new Intl.NumberFormat('id-ID').format(branch.inmateCount)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">/ {branch.capacity} Kapasitas</span>
                        </div>
                        <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full ${
                              occupancyPct > 100 
                                ? 'bg-rose-500' 
                                : occupancyPct > 80 
                                  ? 'bg-amber-500' 
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, occupancyPct)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isAktif 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {/* Ikon View: Melihat Detail Lengkap UPT (Read-Only) */}
                          <button 
                            type="button"
                            onClick={() => openDetailModal(branch)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Lihat Detail UPT"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data UPT yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail UPT */}
      {isDetailModalOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Unit Pelaksana Teknis</h3>
                  <p className="text-[11px] text-slate-400">Informasi operasional UPT di wilayah {kanwilName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-medium">Nama UPT</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedBranch.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Operasional</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                    (selectedBranch.status === 'Active' || selectedBranch.status === 'Aktif')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {(selectedBranch.status === 'Active' || selectedBranch.status === 'Aktif') ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Kota / Lokasi</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedBranch.city || selectedBranch.location || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Nomor Telepon</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedBranch.phone || '-'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium">Alamat Lengkap</p>
                <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{selectedBranch.address || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl">
                <div>
                  <p className="text-slate-400 font-medium">Jumlah WBP Terdaftar</p>
                  <p className="text-base font-extrabold text-primary mt-0.5">
                    {new Intl.NumberFormat('id-ID').format(selectedBranch.inmateCount || 0)} Orang
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Kapasitas Maksimal</p>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">
                    {new Intl.NumberFormat('id-ID').format(selectedBranch.capacity || 0)} Orang
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/kanwil/inmates?branchId=${selectedBranch.id}`}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Lihat Data WBP Cabang Ini</span>
              </Link>
              <button 
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
