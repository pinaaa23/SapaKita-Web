import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Eye, 
  EyeOff,
  Edit3, 
  Power, 
  Filter, 
  Download, 
  SearchX, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  Save,
  X,
  Lock,
  User,
  Building2,
  Loader2
} from 'lucide-react';
import { getInmates, updateInmate, updateInmateStatus } from '../../../services/inmateService';
import { logout } from '../../../services/api';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/Modal';
import FamilyMembersEditor, { validateFamilies } from '../../../components/FamilyMembersEditor';

const InmatesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { uptName, isSupervisor, userName, roleLabel, user } = useAuth();
  
  const [inmatesList, setInmatesList] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Toast State
  const [toastMessage, setToastMessage] = useState({ type: '', text: '' });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInmate, setEditingInmate] = useState({ 
    id: '', 
    name: '', 
    identifier: '', 
    initialPin: '', 
    blockRoom: '', 
    branchName: '', 
    families: [] 
  });
  const [editError, setEditError] = useState('');
  const [familyErrors, setFamilyErrors] = useState({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Power / Status Toggle Modal State
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [powerTargetInmate, setPowerTargetInmate] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Table horizontal scroll detection for dynamic sticky shadows
  const [scrolledLeft, setScrolledLeft] = useState(false);
  const [scrolledRight, setScrolledRight] = useState(false);
  const tableContainerRef = React.useRef(null);

  const checkScroll = useCallback(() => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    const canScroll = scrollWidth > clientWidth + 2;
    setScrolledLeft(canScroll && scrollLeft > 2);
    setScrolledRight(canScroll && scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  // Debounce search query 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Load inmates from backend API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getInmates({ 
        search: debouncedSearch, 
        page, 
        limit,
        branchId: user?.branchId || user?.branch?.id || '',
        branchName: uptName || user?.branchName || ''
      });
      setInmatesList(res.items);
      setPagination({ total: res.total, totalPages: res.totalPages });
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      } else if (err?.isNetworkError || err?.status === 0) {
        showToast('Server tidak dapat dihubungi.', 'error');
      } else if (err?.status === 400) {
        showToast(err?.message || 'Permintaan tidak valid.', 'error');
      } else {
        showToast('Gagal memuat data narapidana.', 'error');
      }
      setInmatesList([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, limit, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, inmatesList]);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast, 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const formatCurrency = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredInmates = inmatesList.filter(item => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesStatus;
  });

  // Handle opening Edit Modal
  const handleOpenEdit = (inmate) => {
    const spvBranch = (uptName && uptName !== 'Cabang Terdaftar' && uptName !== 'UPT Anda') ? uptName : (authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : null) || 'Lapas II Yogyakarta');
    const effectiveBranch = (isSupervisor || !isSuperadmin)
      ? spvBranch
      : ((inmate.branchName && inmate.branchName !== 'Lapas Pusat' && inmate.branchName !== 'Lapas Kelas I Cipinang' && inmate.branchName !== '-') ? inmate.branchName : spvBranch);
    const effectiveBlockRoom = (!inmate.blockRoom || inmate.blockRoom === '-') 
      ? 'Blok A / Kamar 1A' 
      : inmate.blockRoom;

    setEditingInmate({
      id: inmate.id,
      name: inmate.name || '',
      identifier: inmate.wbpRegNumber || inmate.identifier || '',
      initialPin: '',
      branchName: effectiveBranch,
      blockRoom: effectiveBlockRoom,
      families: inmate.families ? JSON.parse(JSON.stringify(inmate.families)) : []
    });
    setEditError('');
    setFamilyErrors({});
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  // Submit Edit Inmate to backend
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingInmate.name.trim() || !editingInmate.identifier.trim()) {
      setEditError('Nama Lengkap dan NIP wajib diisi.');
      return;
    }

    if (!editingInmate.blockRoom?.trim()) {
      setEditError('Penempatan Blok / Kamar wajib diisi.');
      return;
    }

    if (editingInmate.initialPin && editingInmate.initialPin.trim().length > 0 && editingInmate.initialPin.trim().length < 6) {
      setEditError('Password baru minimal 6 karakter (huruf/angka) jika ingin diganti.');
      return;
    }

    // Validasi data keluarga (dinonaktifkan - WBP mengetik sendiri nomor tujuan di wartel)
    /*
    const { isValid, errors } = validateFamilies(editingInmate.families || []);
    if (!isValid) {
      setFamilyErrors(errors);
      setEditError('Mohon periksa kembali kolom isian data keluarga di bawah.');
      return;
    }
    */

    setIsSubmittingEdit(true);
    setEditError('');
    setFamilyErrors({});
    try {
      await updateInmate(editingInmate.id, {
        name: editingInmate.name,
        identifier: editingInmate.identifier,
        initialPin: editingInmate.initialPin,
        blockRoom: editingInmate.blockRoom,
        branchName: editingInmate.branchName,
        // families: editingInmate.families || []
        families: []
      });
      setIsEditModalOpen(false);
      showToast('Data WBP berhasil diperbarui.', 'success');
      await loadData();
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      } else if (err?.status === 404 || err?.status === 405 || err?.isNetworkError || err?.status === 0) {
        showToast('Fitur ini belum tersedia di sistem backend.', 'error');
      } else if (err?.status === 400) {
        setEditError(err?.message || 'Data yang dimasukkan tidak valid.');
      } else {
        showToast('Fitur ini belum tersedia di sistem backend.', 'error');
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle opening Power / Status confirmation modal
  const handleOpenPowerModal = (inmate) => {
    setPowerTargetInmate(inmate);
    setIsPowerModalOpen(true);
  };

  // Submit Power / Status change to backend
  const handleConfirmPowerToggle = async () => {
    if (!powerTargetInmate) return;
    const newIsActive = !powerTargetInmate.isActive;
    
    setIsSubmittingStatus(true);
    try {
      await updateInmateStatus(powerTargetInmate.id, newIsActive);
      setIsPowerModalOpen(false);
      showToast(
        newIsActive 
          ? `Akun narapidana ${powerTargetInmate.name} berhasil diaktifkan.` 
          : `Akun narapidana ${powerTargetInmate.name} berhasil dinonaktifkan.`,
        'success'
      );
      await loadData();
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      } else if (err?.status === 404 || err?.status === 405 || err?.isNetworkError || err?.status === 0) {
        showToast('Fitur ini belum tersedia di sistem backend.', 'error');
      } else if (err?.status === 400) {
        showToast(err?.message || 'Permintaan gagal diproses backend.', 'error');
      } else {
        showToast('Fitur ini belum tersedia di sistem backend.', 'error');
      }
    } finally {
      setIsSubmittingStatus(false);
      setIsPowerModalOpen(false);
    }
  };

  const handleExport = () => {
    if (filteredInmates.length === 0) {
      showToast('Tidak ada data narapidana untuk diekspor.', 'error');
      return;
    }

    // Export PDF Resmi WBP PasCall (Kepala UPT & Supervisor)
    const headers = ['No', 'Nama Lengkap', 'NIP / Reg', 'Blok / Kamar', 'Tgl Masuk', 'Saldo Panggilan', 'Penempatan', 'Status Akun'];
    const rows = filteredInmates.map((i, idx) => [
      String(idx + 1),
      i.name || '-',
      i.wbpRegNumber || '-',
      i.blockRoom || '-',
      i.entryDate || '-',
      `Rp ${new Intl.NumberFormat('id-ID').format(i.callBalance || 0)}`,
      i.status || 'Aktif',
      i.commStatus || 'Aktif'
    ]);

    const activeCount = filteredInmates.filter(i => (i.commStatus || '').toLowerCase() === 'aktif').length;
    const inactiveCount = filteredInmates.length - activeCount;

    const summaryMetrics = [
      { label: 'TOTAL WARGA BINAAN', value: `${filteredInmates.length} WBP` },
      { label: 'STATUS AKTIF', value: `${activeCount} Orang` },
      { label: 'DIBLOKIR / NONAKTIF', value: `${inactiveCount} Orang` },
    ];

    const filename = `Data_Narapidana_${(uptName || 'UPT').replace(/\s+/g, '_')}_${statusFilter}.pdf`;
    const success = exportToPDF({
      title: 'LAPORAN DATA REGISTRASI NARAPIDANA (WBP)',
      subtitle: 'Data master warga binaan pemasyarakatan dan status layanan komunikasi',
      filename,
      headers,
      rows,
      orientation: 'landscape',
      metadata: {
        'Lokasi UPT': uptName || 'UPT Pemasyarakatan',
        'Dicetak Oleh': `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
        'Tanggal Cetak': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics
    });

    if (success !== false) {
      showToast('Berhasil mengekspor data narapidana ke format PDF!', 'success');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="flex-1">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-200/80 overflow-hidden transition-all">
        
        {/* Top Control Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/60">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIP WBP..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            />
          </div>

          {/* Action Filters & Create Button */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Status */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="All">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Sudah Bebas">Sudah Bebas</option>
                <option value="Dipindahkan">Dipindahkan</option>
              </select>
            </div>

            {/* Export Button */}
            <button 
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
              title="Export Data Narapidana"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {/* Add Inmate Button (Khusus Supervisor) */}
            {isSupervisor && (
              <Link 
                to="/branch/inmates/create"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-xs cursor-pointer ml-auto md:ml-1"
              >
                <Plus className="w-4 h-4" /> Tambah Narapidana
              </Link>
            )}
          </div>
        </div>

        {/* Table View */}
        <div 
          ref={tableContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto w-full"
        >
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className={`py-3 pl-5 pr-3 whitespace-nowrap sticky left-0 z-20 bg-slate-50 transition-shadow ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                  Nama Lengkap
                </th>
                <th className="py-3 px-2.5 whitespace-nowrap">Blok / Kamar</th>
                {/* Disembunyikan: Kolom keluarga tidak lagi digunakan
                <th className="py-3 px-2.5 whitespace-nowrap">Keluarga</th>
                */}
                <th className="py-3 px-2.5 whitespace-nowrap">Tgl Masuk</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Saldo</th>
                <th className="py-3 px-2.5 whitespace-nowrap text-center">Penempatan</th>
                <th className="py-3 px-2.5 whitespace-nowrap text-center">Status Akun</th>
                <th className={`py-3 pl-3 pr-5 text-center whitespace-nowrap sticky right-0 z-20 bg-slate-50 transition-shadow ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''} w-28`}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className={`py-3 pl-5 pr-3 sticky left-0 z-10 bg-white ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                      <div className="h-4 bg-slate-200 rounded w-28 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-3 px-2.5"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    {/* Disembunyikan skeleton keluarga:
                    <td className="py-3 px-2.5"><div className="h-4 bg-slate-200 rounded w-24 mb-1" /><div className="h-3 bg-slate-100 rounded w-16" /></td>
                    */}
                    <td className="py-3 px-2.5"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-3 px-2.5"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-3 px-2.5 text-center"><div className="h-5 bg-slate-200 rounded-full w-14 mx-auto" /></td>
                    <td className="py-3 px-2.5 text-center"><div className="h-5 bg-slate-200 rounded-full w-14 mx-auto" /></td>
                    <td className={`py-3 pl-3 pr-5 text-center sticky right-0 z-10 bg-white ${scrolledRight ? 'shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                      <div className="h-7 bg-slate-200 rounded-lg w-20 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredInmates.length > 0 ? (
                filteredInmates.map((inmate) => {
                  const firstFamily = inmate.families && inmate.families.length > 0 ? inmate.families[0] : null;
                  const extraFamilyCount = inmate.families && inmate.families.length > 1 ? inmate.families.length - 1 : 0;
                  const nipIdentifier = inmate.wbpRegNumber || inmate.identifier || inmate.id;

                  return (
                    <tr key={inmate.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Nama Lengkap + NIP Badge (Sticky Left) */}
                      <td className={`py-2.5 pl-5 pr-3 whitespace-nowrap sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 transition-all ${scrolledLeft ? 'shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]' : ''}`}>
                        <div className="min-w-0 max-w-[160px]">
                          <p className="font-bold text-slate-800 text-xs truncate leading-tight group-hover:text-primary transition-colors" title={inmate.name}>
                            {inmate.name || '-'}
                          </p>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold border border-slate-200/80" title="NIP Narapidana">
                              {inmate.wbpRegNumber || inmate.identifier || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Blok / Kamar */}
                      <td className="py-2.5 px-2.5 font-medium text-slate-700 whitespace-nowrap text-xs">
                        <span className="truncate max-w-[110px] block" title={inmate.blockRoom || '-'}>
                          {inmate.blockRoom || '-'}
                        </span>
                      </td>

                      {/* Disembunyikan: Kolom keluarga tidak lagi digunakan
                      <td className="py-2.5 px-2.5 text-left whitespace-nowrap">
                        {firstFamily ? (
                          <div className="min-w-0 max-w-[140px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 text-xs truncate" title={firstFamily.name}>
                                {firstFamily.name}
                              </span>
                              {extraFamilyCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/branch/inmates/${encodeURIComponent(nipIdentifier)}#families`)}
                                  className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-[10px] font-bold cursor-pointer transition-all shrink-0 shadow-2xs hover:scale-105 active:scale-95"
                                  title={`${extraFamilyCount} keluarga lainnya (klik untuk lihat detail)`}
                                >
                                  +{extraFamilyCount}
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={firstFamily.phone}>
                              {firstFamily.phone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">-</span>
                        )}
                      </td>
                      */}

                      {/* Tgl Masuk */}
                      <td className="py-2.5 px-2.5 font-medium text-slate-600 whitespace-nowrap text-xs">
                        {inmate.entryDate ? new Date(inmate.entryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>

                      {/* Saldo Panggilan (Dipadatkan jadi Saldo) */}
                      <td className="py-2.5 px-2.5 font-extrabold text-slate-800 whitespace-nowrap text-xs">
                        {typeof inmate.callBalance === 'number' ? formatCurrency(inmate.callBalance) : '-'}
                      </td>

                      {/* Status Penempatan */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        {inmate.status ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inmate.status === 'Aktif' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                              : inmate.status === 'Dipindahkan' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {inmate.status === 'Aktif' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {inmate.status === 'Dipindahkan' && <Clock className="w-3 h-3 text-amber-600" />}
                            {inmate.status === 'Sudah Bebas' && <XCircle className="w-3 h-3 text-slate-400" />}
                            {inmate.status}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">-</span>
                        )}
                      </td>

                      {/* Status Akun */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        {inmate.commStatus ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inmate.commStatus === 'Aktif' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
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
                        <div className="flex items-center justify-center gap-1">
                          {/* View Detail (Semua Role) */}
                          <Link
                            to={`/branch/inmates/${encodeURIComponent(nipIdentifier)}`}
                            className="p-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
                            title="Lihat Detail Narapidana"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit Button (Khusus Supervisor) */}
                          {isSupervisor && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(inmate)}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-primary rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105"
                              title="Edit Data Narapidana & Keluarga"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle Comm Status / Power Button (Khusus Supervisor) */}
                          {isSupervisor && (
                            <button
                              type="button"
                              onClick={() => handleOpenPowerModal(inmate)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105 ${
                                inmate.commStatus === 'Aktif' 
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                              title={inmate.commStatus === 'Aktif' ? 'Nonaktifkan Akun Komunikasi' : 'Aktifkan Akun Komunikasi'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">Belum ada data narapidana</p>
                      <p className="text-xs mt-1 text-slate-400">
                        {searchInput ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Belum ada narapidana yang terdaftar pada cabang ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filteredInmates.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium text-center sm:text-left">
              Menampilkan {filteredInmates.length} dari total {pagination.total || filteredInmates.length} narapidana (Halaman {page} dari {pagination.totalPages || 1})
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button 
                type="button" 
                className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-bold text-xs shadow-xs"
              >
                {page}
              </button>
              <button 
                type="button" 
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT NARAPIDANA (Khusus SPV) */}
      {isEditModalOpen && isSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmittingEdit && setIsEditModalOpen(false)}
          ></div>
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-primary">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Data WBP</h3>
                  <p className="text-[11px] text-slate-400">Perbarui informasi identitas dasar WBP</p>
                </div>
              </div>
              <button 
                type="button"
                disabled={isSubmittingEdit}
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {editError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* BAGIAN 1: DATA DASAR */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Data Dasar</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={editingInmate.name}
                      onChange={(e) => setEditingInmate({ ...editingInmate, name: e.target.value })}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>

                  {/* NIP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIP (Nomor Induk Narapidana) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={editingInmate.identifier}
                      onChange={(e) => setEditingInmate({ ...editingInmate, identifier: e.target.value })}
                      placeholder="Contoh: NIP-1029"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>

                  {/* Cabang Lapas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> Cabang Lapas
                    </label>
                    <div className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{editingInmate.branchName || ((uptName && uptName !== 'Cabang Terdaftar') ? uptName : (user?.branch?.name || user?.branchName || 'Lapas II Yogyakarta'))}</span>
                    </div>
                  </div>

                  {/* Penempatan Blok / Kamar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Penempatan Blok / Kamar <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={editingInmate.blockRoom}
                      onChange={(e) => setEditingInmate({ ...editingInmate, blockRoom: e.target.value })}
                      placeholder="Contoh: Blok A / Kamar 1A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Baru (Opsional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Password Baru (Opsional)
                  </label>
                  <div className="relative">
                    <input 
                      type={showEditPassword ? "text" : "password"}
                      value={editingInmate.initialPin}
                      onChange={(e) => setEditingInmate({ ...editingInmate, initialPin: e.target.value })}
                      placeholder="Masukkan minimal 6 karakter password baru (misal: napi123)..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      tabIndex={-1}
                      title={showEditPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1">Kosongkan jika tidak ingin mengubah password narapidana. Minimal 6 karakter (bisa huruf/angka).</p>
                </div>
              </div>

              {/* BAGIAN 2: KELUARGA TERDAFTAR (Dinonaktifkan) */}
              {/* <div className="pt-2 border-t border-slate-100">
                <FamilyMembersEditor 
                  families={editingInmate.families || []}
                  onChange={(newFamilies) => {
                    setEditingInmate({ ...editingInmate, families: newFamilies });
                    setFamilyErrors({});
                  }}
                  errors={familyErrors}
                />
              </div> */}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                <button 
                  type="button"
                  disabled={isSubmittingEdit}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI STATUS (POWER BUTTON) */}
      <Modal
        isOpen={isPowerModalOpen}
        onClose={() => !isSubmittingStatus && setIsPowerModalOpen(false)}
        title={powerTargetInmate?.isActive ? "Nonaktifkan Akun Narapidana" : "Aktifkan Akun Narapidana"}
        confirmText={isSubmittingStatus ? "Memproses..." : (powerTargetInmate?.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan")}
        cancelText="Batal"
        isDanger={powerTargetInmate?.isActive}
        onConfirm={handleConfirmPowerToggle}
      >
        <div className="text-xs text-slate-600 space-y-2">
          <p>
            {powerTargetInmate?.isActive ? (
              <>
                Apakah Anda yakin ingin <strong>menonaktifkan akun</strong> narapidana{' '}
                <span className="font-bold text-slate-800">{powerTargetInmate?.name}</span> (NIP: {powerTargetInmate?.wbpRegNumber})?
              </>
            ) : (
              <>
                Apakah Anda yakin ingin <strong>mengaktifkan kembali akun</strong> narapidana{' '}
                <span className="font-bold text-slate-800">{powerTargetInmate?.name}</span> (NIP: {powerTargetInmate?.wbpRegNumber})?
              </>
            )}
          </p>
          <p className="text-[11px] text-slate-400">
            Tindakan ini hanya mengubah hak akses komunikasi narapidana pada aplikasi PasCall, dan bukan penghapusan permanen data.
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default InmatesList;
