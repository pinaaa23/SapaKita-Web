import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Filter, 
  Download, 
  Building2, 
  Users, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  X, 
  AlertCircle,
  Calendar,
  Wallet,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getYayasanInmates, getYayasanBranches } from '../../services/YayasanService';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

export default function YayasanInmates() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const YayasanId = user?.YayasanId || user?.Yayasan?.id;
  const YayasanName = user?.YayasanName || user?.Yayasan?.name || 'Yayasan Pesantren';

  const queryBranch = searchParams.get('branchId') || 'All';

  // State for filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState(queryBranch);
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Sync if searchParam changes
  useEffect(() => {
    const bId = searchParams.get('branchId');
    if (bId && bId !== branchFilter) {
      setBranchFilter(bId);
      setPage(1);
    }
  }, [searchParams]);

  // Data state
  const [inmates, setInmates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Detail Modal State
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  // Load Kampuss for filter dropdown
  useEffect(() => {
    getYayasanBranches(YayasanId, { limit: 100 }).then((res) => {
      setBranches(res.items || []);
    });
  }, [YayasanId]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchInmatesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getYayasanInmates(YayasanId, {
        search: debouncedSearch,
        branchId: branchFilter,
        status: statusFilter,
        page,
        limit,
      });

      setInmates(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Error fetching Yayasan inmates:', err);
      showToast('Gagal memuat data Santri.', 'error');
      setInmates([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [YayasanId, debouncedSearch, branchFilter, statusFilter, page, limit]);

  useEffect(() => {
    fetchInmatesData();
  }, [fetchInmatesData]);

  const handleExportPDF = () => {
    if (inmates.length === 0) {
      showToast('Tidak ada data Santri untuk diekspor.', 'error');
      return;
    }

    getYayasanInmates(YayasanId, {
      search: debouncedSearch,
      branchId: branchFilter,
      status: statusFilter,
      limit: 500,
    }).then((res) => {
      const allItems = res.items || [];
      const headers = ['No', 'No. Registrasi / NIS', 'Nama Santri', 'Kampus Asal', 'Asrama / Kamar', 'Saldo (IDR)', 'Status Akun'];
      const rows = allItems.map((w, idx) => [
        idx + 1,
        w.NIS || '-',
        w.name || '-',
        w.branchName || '-',
        w.block || '-',
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(w.balance || 0),
        w.status === 'Aktif' || w.status === 'Active' ? 'Aktif' : 'Nonaktif',
      ]);

      const activeCount = allItems.filter(w => w.status === 'Aktif' || w.status === 'Active').length;
      const totalBalance = allItems.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

      const filename = `Data_Santri_${YayasanName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const success = exportToPDF({
        title: `DATA Santri PEMASYARAKATAN (Santri) - ${YayasanName.toUpperCase()}`,
        subtitle: `Daftar Gabungan Santri Seluruh Kampus Pemasyarakatan Wilayah ${YayasanName}`,
        filename,
        headers,
        rows,
        orientation: 'landscape',
        metadata: {
          'Tingkat Wilayah': 'Yayasan Pesantren Pemasyarakatan',
          'Nama Yayasan': YayasanName,
          'Filter Kampus': branchFilter === 'All' ? 'Semua Kampus' : (branches.find(b => b.id === branchFilter)?.name || branchFilter),
          'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
          'Tanggal Cetak': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        summaryMetrics: [
          { label: 'TOTAL Santri', value: `${allItems.length} Orang` },
          { label: 'STATUS AKTIF', value: `${activeCount} Orang` },
          { label: 'TOTAL SALDO TERSIMPAN', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalBalance) },
        ]
      });

      if (success !== false) {
        showToast('Berhasil mengekspor data Santri ke format PDF!', 'success');
      }
    });
  };

  const openDetailModal = (inmate) => {
    setSelectedInmate(inmate);
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

      {/* Control Card: Search, Filters & Export */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
        {/* Row 1: Search & Export */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS Santri..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium placeholder:text-slate-400"
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

          <button 
            type="button"
            onClick={handleExportPDF}
            disabled={inmates.length === 0}
            className="px-3.5 py-2.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer disabled:opacity-50"
            title="Export data Santri ke format PDF (.pdf)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> 
            <span>Export PDF</span>
          </button>
        </div>

        {/* Row 2: Filter Toolbar & Counter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Dropdown Filter Kampus */}
            <div className="relative">
              <select 
                value={branchFilter} 
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold appearance-none transition-all ${
                  branchFilter !== 'All' 
                    ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs cursor-pointer' 
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <option value="All">Semua Kampus</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === item.key 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result Count Info */}
          <div className="text-slate-400 text-[11px] font-medium ml-auto">
            Menampilkan <strong className="text-slate-700 font-bold">{inmates.length}</strong> dari {totalCount} Santri
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 pl-5 pr-3 font-bold text-left w-[30%]">Nama Lengkap</th>
                <th className="py-3.5 px-3 font-bold text-left w-[25%]">Kampus</th>
                <th className="py-3.5 px-3 font-bold text-left w-[18%]">Asrama / Kamar</th>
                <th className="py-3.5 px-3 font-bold text-left w-[13%]">Tgl Terdaftar</th>
                <th className="py-3.5 px-3 font-bold text-center w-[14%]">Status Akun</th>
                <th className="py-3.5 pr-5 pl-2 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 pl-5 pr-3"><div className="h-4 bg-slate-200 rounded w-36 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="py-3.5 px-3 text-center"><div className="h-5 bg-slate-200 rounded-full w-14 mx-auto" /></td>
                    <td className="py-3.5 pr-5 pl-2 text-center"><div className="h-6 bg-slate-200 rounded w-6 mx-auto" /></td>
                  </tr>
                ))
              ) : inmates.length > 0 ? (
                inmates.map((inmate) => (
                  <tr key={inmate.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Nama Lengkap + NIS */}
                    <td className="py-3 pl-5 pr-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {inmate.name ? inmate.name.charAt(0).toUpperCase() : 'W'}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-primary transition-colors truncate" title={inmate.name}>
                            {inmate.name || '-'}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 font-medium tracking-tight mt-0.5">
                            {inmate.NIS || '-'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Kampus Asal */}
                    <td className="py-3 px-3 text-left">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={inmate.branchName}>
                          {inmate.branchName || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Asrama / Kamar */}
                    <td className="py-3 px-3 text-left text-slate-600 font-medium">
                      {inmate.block || '-'}
                    </td>

                    {/* Tgl Terdaftar */}
                    <td className="py-3 px-3 text-left text-slate-500 font-medium whitespace-nowrap">
                      {inmate.registeredAt ? new Date(inmate.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>

                    {/* Status Akun */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {(() => {
                        const isAktif = inmate.status === 'Aktif' || inmate.status === 'Active' || inmate.isActive === true;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                            isAktif 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{isAktif ? 'Aktif' : 'Nonaktif'}</span>
                          </span>
                        );
                      })()}
                    </td>

                    {/* Aksi: View Detail */}
                    <td className="py-3 pr-5 pl-2 text-center">
                      <button 
                        type="button"
                        onClick={() => openDetailModal(inmate)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                        title="Lihat Detail Santri"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data Santri yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    type="button"
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pageNum 
                        ? 'bg-primary text-white shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button 
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Santri */}
      {isDetailModalOpen && selectedInmate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100 font-bold">
                  {selectedInmate.name ? selectedInmate.name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Santri</h3>
                  <p className="text-[11px] text-slate-400">Informasi registrasi Santri di wilayah {YayasanName}</p>
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
                  <p className="text-slate-400 font-medium">Nama Lengkap</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedInmate.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">NIS / No. Registrasi</p>
                  <p className="font-mono font-bold text-primary mt-0.5">{selectedInmate.NIS}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Kampus Asal</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedInmate.branchName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Blok & Kamar</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedInmate.block || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Tanggal Terdaftar</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {selectedInmate.registeredAt ? new Date(selectedInmate.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Akun</p>
                  {(() => {
                    const isAktif = selectedInmate.status === 'Aktif' || selectedInmate.status === 'Active' || selectedInmate.isActive === true;
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                        isAktif
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {isAktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 font-medium">Saldo Dompet Komunikasi</p>
                  <p className="text-base font-extrabold text-primary mt-0.5">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedInmate.balance || 0)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-primary shadow-2xs">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
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

