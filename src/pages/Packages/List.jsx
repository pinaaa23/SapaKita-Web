import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, 
  Phone, 
  Video, 
  Search, 
  ArrowLeft, 
  Eye, 
  Building2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Layers,
  X
} from 'lucide-react';
import { getPackages } from '../../services/packageService';
import { getBranches } from '../../services/branchService';

const formatRupiah = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export default function PackagesList() {
  // State Utama Data
  const [branches, setBranches] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // State Navigasi Dua Tingkat: null = Tingkat 1 (Daftar Cabang), object = Tingkat 2 (Detail Cabang)
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Filter Tingkat 1 (Daftar Cabang)
  const [branchSearch, setBranchSearch] = useState('');

  // Filter Tingkat 2 (Detail Paket Cabang)
  const [packageSearch, setPackageSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Muat data cabang dan semua paket sekaligus
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [branchRes, pkgRes] = await Promise.all([
        getBranches({ limit: 100 }),
        getPackages({ allowEmpty: true }),
      ]);

      const branchItems = branchRes?.items || [];
      const packageItems = Array.isArray(pkgRes) ? pkgRes : [];

      setBranches(branchItems);
      setAllPackages(packageItems);
    } catch (err) {
      console.error('[PackagesList] Gagal memuat data:', err);
      showToast('Gagal memuat data pondok dan paket komunikasi.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kelompokkan paket per Cabang
  const branchPackagesMap = useMemo(() => {
    const map = {};

    allPackages.forEach((pkg) => {
      if (pkg.branchId) {
        if (!map[pkg.branchId]) {
          map[pkg.branchId] = [];
        }
        map[pkg.branchId].push(pkg);
      }
    });

    return map;
  }, [allPackages]);

  // Statistik untuk Tingkat 1
  const branchSummaries = useMemo(() => {
    return branches.map((branch) => {
      const pkgs = branchPackagesMap[branch.id] || [];
      const activeCount = pkgs.filter((p) => p.isActive).length;
      const inactiveCount = pkgs.length - activeCount;

      let priceRangeText = '-';
      if (pkgs.length > 0) {
        const prices = pkgs.map((p) => Number(p.harga || p.price || 0));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        priceRangeText = minPrice === maxPrice 
          ? formatRupiah(minPrice) 
          : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
      }

      return {
        ...branch,
        totalPackages: pkgs.length,
        activeCount,
        inactiveCount,
        priceRangeText,
        packages: pkgs,
      };
    });
  }, [branches, branchPackagesMap]);

  // Filter Cabang di Tingkat 1
  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return branchSummaries;
    return branchSummaries.filter((b) => 
      (b.name || '').toLowerCase().includes(q) ||
      (b.location || '').toLowerCase().includes(q)
    );
  }, [branchSummaries, branchSearch]);

  // Detail paket cabang terpilih (Tingkat 2)
  const currentBranchPackages = useMemo(() => {
    if (!selectedBranch) return [];
    return branchPackagesMap[selectedBranch.id] || [];
  }, [selectedBranch, branchPackagesMap]);

  // Filter Paket di Tingkat 2
  const filteredCurrentPackages = useMemo(() => {
    let list = currentBranchPackages;

    if (selectedCategory && selectedCategory !== 'semua') {
      list = list.filter((p) => (p.kategori || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (statusFilter && statusFilter !== 'semua') {
      const isAktif = statusFilter === 'Aktif';
      list = list.filter((p) => p.isActive === isAktif);
    }

    if (packageSearch.trim()) {
      const q = packageSearch.trim().toLowerCase();
      list = list.filter((p) => 
        (p.nama || p.name || '').toLowerCase().includes(q) ||
        String(p.durasi || p.durationMinutes || '').includes(q) ||
        String(p.harga || p.price || '').includes(q)
      );
    }

    return list;
  }, [currentBranchPackages, selectedCategory, statusFilter, packageSearch]);



  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TINGKAT 1: DAFTAR CABANG & RINGKASAN PAKET                    */}
      {/* ============================================================== */}
      {!selectedBranch ? (
        <>
          {/* Unified Control & Search Bar (1 Card) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama pondok atau lokasi/kabupaten..."
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0D7A73]/10 focus:border-[#0D7A73] transition-all shadow-2xs"
                />
              </div>

              {/* Mode & Action */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-600">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Mode: Hanya Pantau (Superadmin)
                </span>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Muat Ulang Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Sub-info ringkas peran Superadmin */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <Layers className="w-3.5 h-3.5 text-[#0D7A73] shrink-0" />
              <span>Tarif &amp; paket diterbitkan oleh Pengelola Pondok Pesantren masing-masing. Superadmin memantau seluruh katalog secara terpusat.</span>
            </div>
          </div>

          {/* Tabel Cabang (Tingkat 1) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6 text-left w-[35%]">Nama Pondok Pesantren</th>
                    <th className="py-3.5 px-6 text-center w-[25%]">Jumlah Paket</th>
                    <th className="py-3.5 px-6 text-center w-[25%]">Rentang Harga</th>
                    <th className="py-3.5 px-6 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="w-6 h-6 border-2 border-[#0D7A73]/20 border-t-[#0D7A73] rounded-full animate-spin"></span>
                          <span className="font-semibold text-xs text-slate-500">Memuat data pondok dan paket...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Building2 className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-500">Tidak ada pondok pesantren yang sesuai dengan pencarian.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch) => {
                          const hasNoPackages = branch.totalPackages === 0;

                          return (
                            <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0D7A73] flex items-center justify-center shrink-0 border border-teal-100">
                                    <Building2 className="w-4 h-4 text-[#0D7A73]" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">{branch.name}</div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{branch.location || '-'}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-6 text-center">
                                {hasNoPackages ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                                    Belum Ada Paket (0)
                                  </span>
                                ) : (
                                  <div className="inline-flex items-center justify-center gap-1.5">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                                      {branch.totalPackages} Paket
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      ({branch.activeCount} Aktif / {branch.inactiveCount} Nonaktif)
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-6 text-center font-semibold text-slate-700">
                                {branch.priceRangeText}
                              </td>

                              <td className="py-3.5 px-6 text-center">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => setSelectedBranch(branch)}
                                    className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-slate-700 hover:text-[#0D7A73] rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Lihat</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* ============================================================== */
            /* TINGKAT 2: DETAIL PAKET CABANG (HANYA LIHAT)                   */
            /* ============================================================== */
            <>
              {/* Header & Tombol Kembali */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranch(null);
                      setPackageSearch('');
                      setSelectedCategory('semua');
                      setStatusFilter('semua');
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0D7A73] transition-colors bg-slate-50 hover:bg-teal-50 px-3 py-1.5 rounded-xl border border-slate-200/80 hover:border-teal-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pondok
                  </button>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D7A73] flex items-center justify-center shrink-0 border border-teal-100">
                      <Building2 className="w-5 h-5 text-[#0D7A73]" />
                    </div>
                    <div>
                      <h1 className="text-lg font-black text-slate-900 tracking-tight">
                        {selectedBranch.name}
                      </h1>
                      <p className="text-xs text-slate-500">
                        Lokasi: {selectedBranch.location || '-'} | Total {currentBranchPackages.length} paket terdaftar
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Mode: Pemantauan Nasional
                  </span>
                </div>
              </div>

              {/* Filter Bar (Tab Kategori, Search, Filter Status) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Tab Kategori */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedCategory('semua')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === 'semua'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setSelectedCategory('telepon')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedCategory === 'telepon'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Telepon
                    </button>
                    <button
                      onClick={() => setSelectedCategory('video')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedCategory === 'video'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      Video Call
                    </button>
                  </div>

                  {/* Status Filter & Search */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari nama paket..."
                        value={packageSearch}
                        onChange={(e) => setPackageSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0D7A73]/10 focus:border-[#0D7A73] transition-all"
                      />
                    </div>

                    {/* Filter Status */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#0D7A73]/10 focus:border-[#0D7A73] transition-all cursor-pointer"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabel Detail Paket Cabang (Tingkat 2) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-6 text-center w-[28%]">Nama Paket</th>
                        <th className="py-3.5 px-6 text-center w-[18%]">Kategori</th>
                        <th className="py-3.5 px-6 text-center w-[18%]">Jumlah Menit</th>
                        <th className="py-3.5 px-6 text-center w-[20%]">Harga</th>
                        <th className="py-3.5 px-6 text-center w-[16%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentBranchPackages.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-14 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                                <Package className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-slate-800">Pondok Belum Memiliki Paket</p>
                                <p className="text-xs text-slate-500">
                                  Pengelola pondok ini belum membuat atau menerapkan paket komunikasi untuk santrinya.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredCurrentPackages.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-10 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Package className="w-6 h-6 text-slate-300" />
                              <p className="font-semibold text-xs text-slate-500">Tidak ada paket yang cocok dengan filter yang dipilih.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCurrentPackages.map((pkg) => {
                          const isVideo = (pkg.kategori || pkg.type || '').toString().toLowerCase().includes('vid');
                          const durasiMenit = pkg.durasi || pkg.durationMinutes || 0;
                          const hargaVal = pkg.harga || pkg.price || 0;

                          return (
                            <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6 text-center">
                                <div className="font-bold text-slate-900 text-xs">{pkg.nama || pkg.name}</div>
                              </td>

                              <td className="py-3.5 px-6 text-center">
                                <div className="flex items-center justify-center">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    isVideo
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                                    <span>{isVideo ? 'Video Call' : 'Telepon'}</span>
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-6 text-center font-bold text-slate-800">
                                <span className="inline-flex items-center justify-center gap-1 text-slate-700">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {durasiMenit} Menit
                                </span>
                              </td>

                              <td className="py-3.5 px-6 text-center font-bold text-slate-900">
                                {formatRupiah(hargaVal)}
                              </td>

                              <td className="py-3.5 px-6 text-center">
                                <div className="flex items-center justify-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    pkg.isActive
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                    <span>{pkg.isActive ? 'Aktif' : 'Nonaktif'}</span>
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
