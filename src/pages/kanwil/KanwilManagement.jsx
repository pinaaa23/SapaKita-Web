import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  MapPin, 
  Key, 
  Mail, 
  X, 
  Check, 
  RefreshCw,
  Power,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  Copy,
  CheckCircle2,
  Info,
  Users,
  UserCheck,
  Phone,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { 
  getAllKanwilsForSuperadmin, 
  saveKanwilFromSuperadmin, 
  deleteKanwilFromSuperadmin,
  toggleKanwilStatus,
  getOfficialProvinces,
  getKanwilAuditReport,
  getUnassignedBranches,
  assignBranchKanwil
} from '../../services/kanwilService';
import { generateRandomPassword } from '../../services/userService';

export default function KanwilManagement() {
  const location = useLocation();
  const [kanwils, setKanwils] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [auditReport, setAuditReport] = useState([]);
  const [unassignedBranches, setUnassignedBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Filter, Search & Pagination State (selaras dengan halaman lain)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

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
  }, [checkScroll, kanwils]);

  // Modal State Detail Kanwil & UPT Binaan
  const [detailKanwil, setDetailKanwil] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField('');
    }, 2000);
  };

  // Modal State Tetapkan Provinsi & Kanwil
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetBranch, setAssignTargetBranch] = useState(null);
  const [assignForm, setAssignForm] = useState({
    branchId: '',
    province: '', 
    kanwilId: '',
    reason: 'Penetapan resmi oleh Superadmin',
  });
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Accordion UPT State
  const [expandedKanwilId, setExpandedKanwilId] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [kanwilList, provList, auditList, unassignedList] = await Promise.all([
        getAllKanwilsForSuperadmin(),
        getOfficialProvinces(),
        getKanwilAuditReport(),
        getUnassignedBranches(),
      ]);
      setKanwils(kanwilList);
      setProvinces(provList);
      setAuditReport(auditList);
      setUnassignedBranches(unassignedList);
    } catch (err) {
      console.error('Error fetching kanwil management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.successMessage) {
      setToastMessage({ text: location.state.successMessage, type: 'success' });
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage({ text: '', type: '' }), 4500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);



  const openAssignModal = (branch) => {
    setAssignTargetBranch(branch);
    setAssignForm({
      branchId: branch.id,
      province: branch.province || '',
      kanwilId: branch.kanwilId || '',
      reason: 'Penetapan resmi oleh Superadmin',
    });
    setIsAssignModalOpen(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    if (!window.confirm(`Ubah status Kantor Wilayah ini menjadi "${nextStatus}"?`)) {
      return;
    }
    try {
      await toggleKanwilStatus(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status Kanwil.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus ${name}? Hanya diperbolehkan jika Kanwil tidak memiliki UPT.`)) {
      return;
    }
    try {
      await deleteKanwilFromSuperadmin(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus Kanwil.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.branchId || !assignForm.province || !assignForm.kanwilId) {
      alert('Pilih UPT, Provinsi resmi, dan Kantor Wilayah tujuan!');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      await assignBranchKanwil(assignForm.branchId, {
        province: assignForm.province,
        kanwilId: assignForm.kanwilId,
        reason: assignForm.reason,
      });
      alert('UPT berhasil ditetapkan ke Kantor Wilayah yang sesuai!');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menetapkan UPT ke Kanwil.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Filter & Search Logic
  const filteredKanwils = kanwils.filter((k) => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (k.kanwilName || k.name || '').toLowerCase().includes(term) ||
      (k.code || '').toLowerCase().includes(term) ||
      (k.wilayah || k.region || '').toLowerCase().includes(term) ||
      (k.adminEmail || k.adminUser?.email || '').toLowerCase().includes(term) ||
      (k.provinces || []).some((p) => p.toLowerCase().includes(term));

    const matchStatus =
      statusFilter === 'All' ||
      k.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredKanwils.length / limit));
  const paginatedKanwils = filteredKanwils.slice((page - 1) * limit, page * limit);
  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== 'All');

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar (Selaras dengan Halaman Data Narapidana) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
        {/* Row 1: Search Input & Tombol Tambah */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama kanwil, kode, wilayah, atau admin..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-2xs"
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

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <Link
              to="/kanwil-management/create"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kanwil Baru</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Filter Toolbar & Active Counter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Status Segmented Tabs */}
            <div className="flex items-center p-0.5 rounded-xl border bg-slate-100/90 border-slate-200/60">
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Aktif', label: 'Aktif' },
                { key: 'Nonaktif', label: 'Nonaktif' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => {
                    setStatusFilter(item.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === item.key 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold cursor-pointer' 
                      : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

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
            Menampilkan <strong className="text-slate-700 font-bold">{paginatedKanwils.length}</strong> dari {filteredKanwils.length} Kantor Wilayah
          </div>
        </div>
      </div>

      {/* Table Card (Selaras dengan Halaman Data Narapidana) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div 
          ref={tableContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto w-full"
        >
          <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[15%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                <th className={`py-3.5 pl-6 pr-4 font-bold text-left sticky left-0 z-20 bg-slate-50 transition-shadow ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                  Kantor Wilayah
                </th>
                <th className="py-3.5 px-4 font-bold text-left">Wilayah</th>
                <th className="py-3.5 px-4 font-bold text-left">Provinsi Cakupan</th>
                <th className="py-3.5 px-4 font-bold text-center">UPT Binaan</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className={`py-3.5 px-4 font-bold text-center sticky right-0 z-20 bg-slate-50 transition-shadow ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                // Skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className={`py-3.5 pl-6 pr-4 text-left sticky left-0 z-10 bg-white ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-slate-200 rounded w-28"></div>
                          <div className="h-3 bg-slate-100 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 bg-slate-200 rounded-xl w-16 mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-6 bg-slate-200 rounded-full w-14 mx-auto"></div>
                    </td>
                    <td className={`py-3.5 px-4 text-center sticky right-0 z-10 bg-white ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                      <div className="h-7 bg-slate-200 rounded-lg w-24 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedKanwils.length > 0 ? (
                paginatedKanwils.map((k) => {
                  const isAktif = k.status === 'Aktif';
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Nama & Kode Kanwil (Sticky Left) */}
                      <td className={`py-3.5 pl-6 pr-4 text-left whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 transition-all ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isAktif ? 'bg-blue-50 border border-blue-100 text-blue-600' : 'bg-slate-100 border border-slate-200 text-slate-400'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-blue-600 transition-colors truncate" title={k.kanwilName}>
                              {k.kanwilName}
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tight mt-0.5">
                              {k.code || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Wilayah */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{k.wilayah || k.region || k.provinces?.[0] || 'Indonesia'}</span>
                        </div>
                      </td>

                      {/* Provinsi Cakupan */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(k.provinces || []).slice(0, 2).map((prov) => (
                            <span key={prov} className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2.5 py-0.5 rounded-lg whitespace-nowrap border border-blue-100/70 shadow-2xs">
                              {prov}
                            </span>
                          ))}
                          {(k.provinces || []).length > 2 && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg border border-slate-200" title={(k.provinces || []).slice(2).join(', ')}>
                              +{k.provinces.length - 2}
                            </span>
                          )}
                          {(!k.provinces || k.provinces.length === 0) && (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </div>
                      </td>

                      {/* UPT Binaan */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50/70 text-blue-700 border border-blue-100/80 shadow-2xs">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>{k.uptCount ?? (k.assignedUpts?.length || 0)} UPT</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                          isAktif
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{k.status}</span>
                        </span>
                      </td>

                      {/* Aksi (Sticky Right: Ruang Lebih Luas & Rapi) */}
                      <td className={`py-3.5 px-4 text-center whitespace-nowrap sticky right-0 z-10 bg-white group-hover:bg-slate-50/90 transition-all ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. Ikon Mata: Detail Kanwil & UPT Binaan */}
                          <button 
                            type="button"
                            onClick={() => setDetailKanwil(k)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Lihat Detail Lengkap Kanwil"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Ikon Pensil: Edit Data Kanwil */}
                          <Link
                            to={`/kanwil-management/${k.id}/edit`}
                            state={{ kanwil: k }}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Edit Data Kanwil"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* 3. Ikon Power: Toggle Status Aktif/Nonaktif */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(k.id, k.status)}
                            className={`p-2 rounded-xl border border-transparent transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                              isAktif 
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                            title={isAktif ? 'Nonaktifkan Kanwil' : 'Aktifkan Kanwil'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Belum ada data Kantor Wilayah</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters 
                          ? 'Tidak ada Kantor Wilayah yang cocok dengan filter atau kata kunci pencarian.' 
                          : 'Belum ada Kantor Wilayah yang terdaftar di sistem.'}
                      </p>
                      {hasActiveFilters ? (
                        <button 
                          type="button"
                          onClick={resetFilters} 
                          className="mt-3 px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Hapus Filter Pencarian
                        </button>
                      ) : (
                        <Link
                          to="/kanwil-management/create"
                          className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Kanwil Pertama</span>
                        </Link>
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
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Halaman <strong className="text-slate-800">{page}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Sebelumnya
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  type="button"
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    page === i + 1
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TETAPKAN PROVINSI & KANWIL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold">Tetapkan Provinsi & Kantor Wilayah UPT</h2>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPT / Lapas yang Ditetapkan
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="font-bold text-slate-800">{assignTargetBranch?.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Kota: {assignTargetBranch?.city || '-'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi Resmi Indonesia *
                </label>
                <select
                  required
                  value={assignForm.province}
                  onChange={(e) => setAssignForm({ ...assignForm, province: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Salah Satu dari 38 Provinsi Resmi --</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kantor Wilayah Tujuan *
                </label>
                <select
                  required
                  value={assignForm.kanwilId}
                  onChange={(e) => setAssignForm({ ...assignForm, kanwilId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Kantor Wilayah --</option>
                  {kanwils
                    .filter((k) => k.status === 'Aktif')
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.provinces && k.provinces.length > 0 ? k.provinces.join(', ') : 'Semua'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penetapan / Catatan Audit
                </label>
                <input
                  type="text"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAssign}
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAssign ? 'Menyimpan...' : 'Terapkan Penetapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KANWIL & DAFTAR UPT BINAAN BESERTA KEPALA UPT */}
      {detailKanwil && (() => {
        const upts = detailKanwil.assignedUpts || [];
        const totalUpt = upts.length;
        const totalWbp = upts.reduce((acc, u) => acc + (Number(u.inmateCount) || 0), 0);
        const totalCapacity = upts.reduce((acc, u) => acc + (Number(u.capacity) || 0), 0);
        const overallOccupancy = totalCapacity > 0 ? Math.round((totalWbp / totalCapacity) * 100) : 0;
        const isAktif = detailKanwil.status === 'Aktif';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
              {/* Header Modal */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center font-bold shadow-2xs shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">{detailKanwil.kanwilName}</h2>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {detailKanwil.code}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isAktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {detailKanwil.status || 'Aktif'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Provinsi Cakupan: <strong className="text-slate-700 font-semibold">{detailKanwil.wilayah || (detailKanwil.provinces || []).join(', ') || 'Indonesia'}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailKanwil(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Isi Konten Modal */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/30">
                {/* 1. Ringkasan Wilayah & Administrator (2 Clean Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Profil Wilayah */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-primary">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span>Wilayah Kerja Koordinasi</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(detailKanwil.provinces || []).length > 0 ? (
                          detailKanwil.provinces.map((prov) => (
                            <span key={prov} className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-200/60 shadow-2xs">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {prov}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            {detailKanwil.wilayah || 'Indonesia'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Membawahi dan mengkoordinasikan UPT Pemasyarakatan pada wilayah provinsi di atas.
                      </p>
                    </div>
                  </div>

                  {/* Card Administrator Kanwil */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-primary">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <span>Administrator Kanwil</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Akun Aktif
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium text-[11px]">Nama Administrator:</span>
                        <span className="font-bold text-slate-800">
                          {detailKanwil.adminName || detailKanwil.adminUser?.name || `Admin ${detailKanwil.kanwilName}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium text-[11px]">Email Login:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-xs border border-blue-100">
                            {detailKanwil.adminEmail || detailKanwil.adminUser?.email || 'Belum diatur'}
                          </span>
                          {(detailKanwil.adminEmail || detailKanwil.adminUser?.email) && (
                            <button
                              type="button"
                              onClick={() => handleCopy(detailKanwil.adminEmail || detailKanwil.adminUser?.email, 'detail-email')}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-primary transition-colors cursor-pointer"
                              title="Salin Email Administrator"
                            >
                              {copiedField === 'detail-email' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {detailKanwil.adminPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium text-[11px]">No. Telepon / WA:</span>
                          <span className="font-medium text-slate-700">{detailKanwil.adminPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Mini Stats Bar (Ringkasan UPT & WBP Wilayah) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UPT Binaan</p>
                      <h4 className="text-lg font-black text-slate-800 mt-0.5">{totalUpt} <span className="text-xs font-normal text-slate-500">Satker</span></h4>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Warga Binaan</p>
                      <h4 className="text-lg font-black text-slate-800 mt-0.5">{totalWbp.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Orang</span></h4>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kapasitas Wilayah</p>
                      <h4 className="text-lg font-black text-slate-800 mt-0.5">{totalCapacity.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Tempat ({overallOccupancy}%)</span></h4>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Daftar UPT & Kepala Satuan Kerja (Clean Modern Cards) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-blue-50 text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Daftar UPT & Kepala Satuan Kerja
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/60 shadow-2xs">
                      {totalUpt} UPT Dinaungi
                    </span>
                  </div>

                  {upts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {upts.map((upt, idx) => {
                        const inmateCount = Number(upt.inmateCount) || 0;
                        const capacity = Number(upt.capacity) || 0;
                        const occupancy = capacity > 0 ? Math.round((inmateCount / capacity) * 100) : 0;
                        const isUptAktif = upt.status === 'Aktif' || !upt.status;

                        return (
                          <div 
                            key={upt.id || idx} 
                            className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all p-4 space-y-3.5 shadow-2xs"
                          >
                            {/* Header UPT Card */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 leading-tight truncate" title={upt.name}>
                                    {upt.name}
                                  </h4>
                                  <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{upt.city && upt.city !== '-' ? `${upt.city}, ` : ''}{upt.province}</span>
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isUptAktif
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {upt.status || 'Aktif'}
                              </span>
                            </div>

                            {/* Kapasitas & Hunian Okupansi */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">
                                  Hunian WBP: <strong className="text-slate-800 font-bold">{inmateCount.toLocaleString('id-ID')}</strong> / {capacity.toLocaleString('id-ID')}
                                </span>
                                <span className={`font-bold ${
                                  occupancy > 100 ? 'text-rose-600' : occupancy > 80 ? 'text-amber-600' : 'text-emerald-700'
                                }`}>
                                  {occupancy}% Okupansi
                                </span>
                              </div>
                              <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    occupancy > 100 
                                      ? 'bg-rose-500' 
                                      : occupancy > 80 
                                        ? 'bg-amber-500' 
                                        : 'bg-primary'
                                  }`}
                                  style={{ width: `${Math.min(100, occupancy)}%` }}
                                />
                              </div>
                            </div>

                            {/* Profil Kepala UPT */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                  Kepala UPT
                                </span>
                                {upt.headEmail && upt.headEmail !== '-' ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                    Akun Siap
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                    Belum Ada Akun
                                  </span>
                                )}
                              </div>

                              <div className="text-xs space-y-1">
                                <p className="font-bold text-slate-800 truncate" title={upt.headName}>
                                  {upt.headName || 'Belum Ditugaskan'}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-slate-600">
                                  <div className="flex items-center gap-1.5 font-mono truncate">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate" title={upt.headEmail}>{upt.headEmail || '-'}</span>
                                  </div>
                                  {upt.headEmail && upt.headEmail !== '-' && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(upt.headEmail, `upt-email-${idx}`)}
                                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-colors cursor-pointer shrink-0"
                                      title="Salin Email Kepala UPT"
                                    >
                                      {copiedField === `upt-email-${idx}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                {upt.headPhone && upt.headPhone !== '-' && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{upt.headPhone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-slate-200 shadow-2xs space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Belum Ada UPT yang Dinaungi</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Kanwil ini belum menaungi UPT manapun. Anda dapat menetapkan UPT binaan melalui tabel penetapan di bawah.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                <Link
                  to={`/kanwil-management/${detailKanwil.id}/edit`}
                  state={{ kanwil: detailKanwil }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-primary bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Edit Data Kanwil</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setDetailKanwil(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
