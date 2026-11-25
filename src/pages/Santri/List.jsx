import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { getInmates, BACKEND_SUPPORTS_INMATE_FILTERS } from '../../services/inmateService';
import { getBranches } from '../../services/branchService';
// TODO: ganti ke API BE saat endpoint tersedia
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';
import { exportToExcel } from '../../utils/exportUtils';
import { logout, getAuthUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InmatesList = () => {
  const navigate = useNavigate();
  const { userName, role, isSuperadmin } = useAuth();
  const authUser = getAuthUser();
  const rawRole = (authUser?.role || role || '').toUpperCase();
  const isSuperAdmin = isSuperadmin || rawRole === 'SUPERADMIN' || rawRole === 'ADMIN_PUSAT';

  // Flag filter didukung (backend atau mock FE)
  // TODO: ganti ke API BE saat endpoint tersedia
  const isFilterSupported = BACKEND_SUPPORTS_INMATE_FILTERS || USE_MOCK_SUPERADMIN;

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
    if (role && !isSuperAdmin) {
      navigate('/branch/santri', { replace: true });
    }
  }, [role, isSuperAdmin, navigate]);

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
        if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setBranches([]);
        setBranchesMap({});
      }
    };
    fetchBranchesList();
  }, [navigate]);

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
      // TODO: ganti ke API BE saat endpoint tersedia
      if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
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

  // Table horizontal scroll detection for dynamic sticky shadows
  const [scrolledLeft, setScrolledLeft] = useState(false);
  const [scrolledRight, setScrolledRight] = useState(false);
  const tableContainerRef = useRef(null);

  const checkScroll = useCallback(() => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    const canScroll = scrollWidth > clientWidth + 2;
    setScrolledLeft(canScroll && scrollLeft > 2);
    setScrolledRight(canScroll && scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, inmates]);

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
      setToastMessage('Tidak ada data santri untuk diekspor.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    try {
      const exportData = inmates.map((i, idx) => ({
        'No': idx + 1,
        'NIS': i.wbpRegNumber || i.identifier || '-',
        'Nama Lengkap': i.name || '-',
        'Pondok Pesantren': branchesMap[i.branchId] || i.branchName || 'Pondok Utama',
        'Status Komunikasi': i.commStatus || i.status || 'Aktif',
        'Tanggal Masuk': i.entryDate ? new Date(i.entryDate).toLocaleDateString('id-ID') : '-'
      }));

      const activeCount = inmates.filter(i => (i.commStatus || i.status || '').toLowerCase() === 'aktif').length;
      const inactiveCount = inmates.length - activeCount;

      const filename = `Data_Santri_Nasional_${new Date().toISOString().split('T')[0]}.xlsx`;
      const success = exportToExcel(exportData, filename, 'Data Santri', {
        title: 'LAPORAN DATA SANTRI PESANTREN TERPADU',
        subtitle: 'Data Master Santri Seluruh Pondok Pesantren SapaKita',
        metadata: {
          'Tingkat': 'Pusat / Nasional',
          'Dicetak Oleh': `${userName || 'Super Administrator'} (Super Administrator)`,
          'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
          'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        summaryMetrics: [
          { label: 'Total Santri', value: `${inmates.length} Orang` },
          { label: 'Status Aktif', value: `${activeCount} Orang` },
          { label: 'Nonaktif / Diskorsing', value: `${inactiveCount} Orang` },
        ]
      });

      if (success !== false) {
        setToastMessage('Berhasil mengekspor data santri ke format Excel!');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (e) {
      console.error('Export error:', e);
      setToastMessage('Gagal mengekspor data santri.');
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
              placeholder="Cari nama atau NIS santri..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-700 transition-all shadow-2xs"
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
              className="px-3.5 py-2.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-teal-700 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export data santri ke Excel (.xlsx)"
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
            {/* TODO: ganti ke API BE saat endpoint tersedia */}
            <div className="relative" title={!isFilterSupported ? 'Belum didukung sistem backend' : undefined}>
              <select 
                value={branchFilter} 
                disabled={!isFilterSupported}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold appearance-none transition-all ${
                  !isFilterSupported
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
            {/* TODO: ganti ke API BE saat endpoint tersedia */}
            <div 
              className={`flex items-center p-0.5 rounded-xl border ${
                !isFilterSupported 
                  ? 'bg-slate-100/50 border-slate-200/50 opacity-60 cursor-not-allowed' 
                  : 'bg-slate-100/90 border-slate-200/60'
              }`}
              title={!isFilterSupported ? 'Belum didukung sistem backend' : undefined}
            >
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Aktif', label: 'Aktif' },
                { key: 'Suspended', label: 'Suspended' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  disabled={!isFilterSupported}
                  onClick={() => {
                    if (isFilterSupported) {
                      setStatusFilter(item.key);
                      setPage(1);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !isFilterSupported
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

            {!isFilterSupported && (
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
            Menampilkan <strong className="text-slate-700 font-bold">{inmates.length}</strong> dari {totalCount} santri
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div 
          ref={tableContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto w-full"
        >
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                <th className={`py-3 pl-5 pr-3 font-bold text-left sticky left-0 z-20 bg-slate-50 transition-shadow ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                  Nama Lengkap
                </th>
                <th className="py-3 px-3 font-bold text-left">Pondok Pesantren</th>
                <th className="py-3 px-2.5 font-bold text-left">Asrama / Kamar</th>
                <th className="py-3 px-2.5 font-bold text-left">Tgl Masuk</th>
                <th className="py-3 px-3 font-bold text-center">Status Izin</th>
                <th className={`py-3 pl-3 pr-5 font-bold text-center sticky right-0 z-20 bg-slate-50 transition-shadow ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''} w-28`}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                // Skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className={`py-3 pl-5 pr-3 text-left sticky left-0 z-10 bg-white ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                      <div className="h-4 bg-slate-200 rounded w-28 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-16"></div>
                    </td>
                    <td className="py-3 px-3 text-left">
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                    </td>
                    <td className="py-3 px-2.5 text-left">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </td>
                    <td className="py-3 px-2.5 text-left">
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-14 mx-auto"></div>
                    </td>
                    <td className={`py-3 pl-3 pr-5 text-center sticky right-0 z-10 bg-white ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                      <div className="h-7 bg-slate-200 rounded-lg w-20 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : inmates.length > 0 ? (
                inmates.map((inmate) => {
                  const resolvedBranchName = (inmate.branchId && branchesMap[inmate.branchId]) ? branchesMap[inmate.branchId] : (inmate.branchName || '-');
                  const nisIdentifier = inmate.wbpRegNumber || inmate.identifier;

                  return (
                    <tr key={inmate.id || nisIdentifier} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Nama Lengkap + NIS Badge (Sticky Left) */}
                      <td className={`py-2.5 pl-5 pr-3 text-left whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 transition-all ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {inmate.name && inmate.name !== '-' ? inmate.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="min-w-0 max-w-[160px]">
                            <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-teal-700 transition-colors truncate" title={inmate.name}>
                              {inmate.name || '-'}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 font-medium tracking-tight mt-0.5" title="NIS Santri">
                              {nisIdentifier || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Pondok Pesantren */}
                      <td className="py-2.5 px-3 text-left whitespace-nowrap">
                        <span className="text-slate-700 font-medium text-xs max-w-[150px] truncate block" title={resolvedBranchName}>
                          {resolvedBranchName}
                        </span>
                      </td>

                      {/* Asrama / Kamar */}
                      <td className="py-2.5 px-2.5 font-medium text-slate-700 whitespace-nowrap text-xs">
                        <span className="truncate max-w-[100px] block" title={inmate.blockRoom || '-'}>
                          {inmate.blockRoom || '-'}
                        </span>
                      </td>

                      {/* Tgl Masuk */}
                      <td className="py-2.5 px-2.5 font-medium text-slate-600 whitespace-nowrap text-xs">
                        {inmate.entryDate ? new Date(inmate.entryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>

                      {/* Status Akun */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {inmate.commStatus ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            inmate.commStatus === 'Aktif' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${inmate.commStatus === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {inmate.commStatus === 'Aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">-</span>
                        )}
                      </td>

                      {/* Aksi (Sticky Right) */}
                      <td className={`py-2.5 pl-3 pr-5 text-center whitespace-nowrap sticky right-0 z-10 bg-white group-hover:bg-slate-50/90 transition-all ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                        <button 
                          type="button"
                          onClick={() => navigate(`/santri/${encodeURIComponent(nisIdentifier || inmate.id)}`)}
                          className="px-2.5 py-1 bg-white hover:bg-[#0D7A73] hover:text-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs hover:border-[#0D7A73] whitespace-nowrap shrink-0 hover:scale-105"
                          title="Lihat Rincian Santri"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Belum ada data Santri</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters 
                          ? 'Tidak ada data santri yang cocok dengan filter atau kata kunci pencarian.' 
                          : 'Belum ada data santri yang terdaftar di sistem kampus.'}
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
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
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
