import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Filter, 
  Download,
  Building2,
  Users,
  ChevronDown,
  X,
  AlertCircle,
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';
import { getInmates, BACKEND_SUPPORTS_INMATE_FILTERS } from '../../services/inmateService';
import { getBranches } from '../../services/branchService';
import { exportToExcel } from '../../utils/exportUtils';
import { logout, getAuthUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InmatesList = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();
  const authUser = getAuthUser();
  const rawRole = (authUser?.role || '').toUpperCase();
  const isSuperAdmin = rawRole === 'SUPERADMIN' || rawRole === 'ADMIN_PUSAT';

  // State for filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Data state
  const [inmates, setInmates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchesMap, setBranchesMap] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Role Protection: only SUPERADMIN can access this page
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/branch/inmates', { replace: true });
    }
  }, [isSuperAdmin, navigate]);

  // Load branches once for the filter and table mapping
  useEffect(() => {
    const fetchBranchesList = async () => {
      try {
        const res = await getBranches({ limit: 100 });
        const list = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        setBranches(list);
        const map = {};
        list.forEach(b => {
          if (b.id) map[b.id] = b.name;
        });
        setBranchesMap(map);
      } catch (err) {
        console.log('[SuperadminInmatesList] Gagal memuat daftar cabang:', err);
        setBranches([]);
        setBranchesMap({});
      }
    };
    fetchBranchesList();
  }, []);

  // Fetch Inmates with debounce ~400ms for search
  const debounceTimer = useRef(null);

  const fetchInmatesData = async (searchVal, branchVal, statusVal, pageVal) => {
    setIsLoading(true);
    setToastMessage('');
    try {
      const res = await getInmates({
        search: searchVal,
        page: pageVal,
        limit,
        branchId: branchVal !== 'All' ? branchVal : undefined,
        status: statusVal !== 'All' ? statusVal : undefined,
      });

      const items = res?.items || [];
      setInmates(items);
      setTotalCount(res?.total || items.length);
      setTotalPages(res?.totalPages || Math.max(1, Math.ceil((res?.total || items.length) / limit)));
    } catch (err) {
      console.log('[SuperadminInmatesList] Gagal memuat data narapidana:', err);
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setToastMessage('Anda tidak memiliki akses');
      } else if (err?.isNetworkError || err?.status === 0) {
        setToastMessage('Server tidak dapat dihubungi');
      } else {
        setToastMessage(err?.message || 'Server tidak dapat dihubungi');
      }
      setInmates([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchInmatesData(searchTerm, branchFilter, statusFilter, page);
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm, branchFilter, statusFilter, page]);

  const formatCurrency = (val) => {
    if (typeof val !== 'number') return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleExport = () => {
    if (inmates.length === 0) {
      setToastMessage('Fitur ini belum tersedia di sistem backend');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    try {
      const exportData = inmates.map((i, idx) => ({
        'No': idx + 1,
        'NIP': i.wbpRegNumber || i.identifier || '-',
        'Nama Lengkap': i.name || '-',
        'Cabang UPT': branchesMap[i.branchId] || i.branchName || 'Lapas Pusat',
        'Saldo Panggilan (Rp)': typeof i.callBalance === 'number' ? i.callBalance : 0,
        'Status Penempatan': i.status || 'Aktif',
        'Tanggal Terdaftar': i.entryDate ? new Date(i.entryDate).toLocaleDateString('id-ID') : '-'
      }));

      const activeCount = inmates.filter(i => (i.status || '').toLowerCase() === 'aktif').length;
      const inactiveCount = inmates.length - activeCount;

      const filename = `Data_Narapidana_Nasional_${new Date().toISOString().split('T')[0]}.xlsx`;
      const success = exportToExcel(exportData, filename, 'Data Narapidana', {
        title: 'LAPORAN DATA REGISTRASI NARAPIDANA NASIONAL (WBP)',
        subtitle: 'Data Master Warga Binaan Seluruh Lapas/Rutan Se-Indonesia',
        metadata: {
          'Tingkat': 'Pusat / Nasional',
          'Dicetak Oleh': `${userName || 'Super Administrator'} (Super Administrator)`,
          'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
          'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        summaryMetrics: [
          { label: 'Total Warga Binaan', value: `${inmates.length} WBP` },
          { label: 'Status Aktif', value: `${activeCount} Orang` },
          { label: 'Nonaktif / Suspended', value: `${inactiveCount} Orang` },
        ]
      });

      if (success !== false) {
        setToastMessage('Berhasil mengekspor data narapidana ke format Excel!');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (e) {
      console.error('Export error:', e);
      setToastMessage('Gagal mengekspor data narapidana.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  const hasActiveFilters = searchTerm !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setBranchFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-amber-600 hover:text-amber-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
        {/* Row 1: Search & Export Action */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIP narapidana..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Export */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <button 
              type="button"
              onClick={handleExport}
              disabled={inmates.length === 0}
              className="px-3.5 py-2.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export data narapidana ke Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> 
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Toolbar & Active Counter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Cabang Filter Dropdown */}
            <div className="relative" title={!BACKEND_SUPPORTS_INMATE_FILTERS ? 'Belum didukung sistem backend' : undefined}>
              <select 
                value={branchFilter} 
                disabled={!BACKEND_SUPPORTS_INMATE_FILTERS}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold appearance-none transition-all ${
                  !BACKEND_SUPPORTS_INMATE_FILTERS
                    ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : branchFilter !== 'All' 
                      ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs cursor-pointer' 
                      : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <option value="All">Semua Cabang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Segmented Tabs */}
            <div 
              className={`flex items-center p-0.5 rounded-xl border ${
                !BACKEND_SUPPORTS_INMATE_FILTERS 
                  ? 'bg-slate-100/50 border-slate-200/50 opacity-60 cursor-not-allowed' 
                  : 'bg-slate-100/90 border-slate-200/60'
              }`}
              title={!BACKEND_SUPPORTS_INMATE_FILTERS ? 'Belum didukung sistem backend' : undefined}
            >
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Aktif', label: 'Aktif' },
                { key: 'Suspended', label: 'Suspended' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  disabled={!BACKEND_SUPPORTS_INMATE_FILTERS}
                  onClick={() => {
                    if (BACKEND_SUPPORTS_INMATE_FILTERS) {
                      setStatusFilter(item.key);
                      setPage(1);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !BACKEND_SUPPORTS_INMATE_FILTERS
                      ? item.key === 'All' ? 'bg-slate-200 text-slate-500 font-bold' : 'text-slate-400 cursor-not-allowed'
                      : statusFilter === item.key 
                        ? 'bg-white text-slate-900 shadow-2xs font-bold cursor-pointer' 
                        : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {!BACKEND_SUPPORTS_INMATE_FILTERS && (
              <span className="text-[10px] text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded-md">
                Filter cabang & status belum didukung sistem backend
              </span>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Result Count Info */}
          <div className="text-slate-400 text-[11px] font-medium ml-auto">
            Menampilkan <strong className="text-slate-700 font-bold">{inmates.length}</strong> dari {totalCount} narapidana
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold text-left">Nama Lengkap</th>
                <th className="px-4 py-4 font-bold text-center">NIP</th>
                <th className="px-4 py-4 font-bold text-center">Cabang</th>
                <th className="px-4 py-4 font-bold text-center">Saldo Panggilan</th>
                <th className="px-4 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                // Skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 text-left">
                      <div className="h-4 bg-slate-200 rounded w-36 mb-1.5"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-24 mx-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 bg-slate-200 rounded w-32 mx-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 bg-slate-200 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-16 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-8 bg-slate-200 rounded-xl w-24 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : inmates.length > 0 ? (
                inmates.map((inmate) => {
                  const resolvedBranchName = (inmate.branchId && branchesMap[inmate.branchId]) ? branchesMap[inmate.branchId] : '-';
                  const nipIdentifier = inmate.wbpRegNumber || inmate.identifier;

                  return (
                    <tr key={inmate.id || nipIdentifier} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Nama Lengkap (Rata Kiri Rapi) */}
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {inmate.name && inmate.name !== '-' ? inmate.name.charAt(0).toUpperCase() : 'N'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-primary transition-colors">
                              {inmate.name || '-'}
                            </p>
                            {inmate.blockRoom && (
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {inmate.blockRoom}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* NIP (Rata Tengah) */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200/80">
                          {nipIdentifier || '-'}
                        </span>
                      </td>

                      {/* Cabang (Rata Tengah) */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 text-slate-700 font-medium">
                          {resolvedBranchName !== '-' && <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span>{resolvedBranchName}</span>
                        </div>
                      </td>

                      {/* Saldo Panggilan (Rata Tengah) */}
                      <td className="px-4 py-4 text-center">
                        {typeof inmate.callBalance === 'number' && !isNaN(inmate.callBalance) ? (
                          <div className="inline-flex items-center justify-center gap-1.5 font-bold text-emerald-700">
                            <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{formatCurrency(inmate.callBalance)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status (Rata Tengah) */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-slate-400 font-medium">-</span>
                      </td>

                      {/* Aksi (Rata Tengah) */}
                      <td className="px-6 py-4 text-center">
                        <button 
                          type="button"
                          onClick={() => navigate(`/inmates/${encodeURIComponent(nipIdentifier || inmate.id)}`)}
                          className="px-3.5 py-1.5 bg-white hover:bg-primary hover:text-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs hover:border-primary"
                          title="Lihat Rincian Narapidana"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Belum ada data narapidana</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters 
                          ? 'Tidak ada narapidana yang cocok dengan filter atau kata kunci pencarian.' 
                          : 'Belum ada data warga binaan yang terdaftar di sistem cabang.'}
                      </p>
                      {hasActiveFilters && (
                        <button 
                          type="button"
                          onClick={resetFilters} 
                          className="mt-3 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Hapus Filter Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
            <span className="text-slate-500">
              Halaman <strong className="text-slate-800">{page}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
              >
                Sebelumnya
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show condensed page numbers
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                  return (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                        page === pageNum 
                          ? 'bg-primary text-white shadow-xs shadow-primary/20' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                }
                return null;
              })}
              <button 
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors cursor-pointer"
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

export default InmatesList;
