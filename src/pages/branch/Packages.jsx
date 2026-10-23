import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Phone, 
  Video, 
  Search, 
  Filter,
  Edit3, 
  Power, 
  AlertCircle, 
  X, 
  Check,
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { 
  getPackages, 
  createPackage, 
  updatePackage, 
  togglePackageStatus,
  deletePackage,
  notifyPackagesUpdated
} from '../../services/packageService';
import { DEFAULT_PACKAGES } from '../../config/defaultPackages';
import { useAuth } from '../../context/AuthContext';

export default function BranchPackages() {
  const { uptName, user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [applyingTemplateName, setApplyingTemplateName] = useState(null);
  const [selectedPackageForToggle, setSelectedPackageForToggle] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'telepon',
    durasi: '',
    harga: '',
    status: 'Aktif',
  });
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Menerapkan 1 paket template tertentu ke cabang
  const handleApplySingleTemplate = async (tpl) => {
    setApplyingTemplateName(tpl.nama);
    try {
      const currentBId = user?.branchId || user?.branch?.id;
      await createPackage({
        nama: tpl.nama,
        name: tpl.nama,
        kategori: tpl.kategori,
        durasi: Number(tpl.durasi),
        harga: Number(tpl.harga),
        status: 'Aktif',
        ...(currentBId ? { branchId: currentBId } : {}),
      });

      notifyPackagesUpdated();
      showToast(`Paket "${tpl.nama}" berhasil diterapkan dan kini aktif untuk cabang Anda.`);
      await fetchPackagesData();
    } catch (err) {
      console.error(`Gagal menerapkan paket template "${tpl.nama}":`, err);
      const detail = err.data?.errors?.map((e) => `${e.field}: ${e.message}`).join(', ');
      showToast(detail ? `${err.message} (${detail})` : (err.message || `Gagal menerapkan paket "${tpl.nama}".`));
    } finally {
      setApplyingTemplateName(null);
    }
  };

  // Menerapkan semua template yang ditampilkan sekaligus
  const handleApplyAllTemplates = async (templatesToApply) => {
    if (!templatesToApply || templatesToApply.length === 0) return;
    setIsApplyingTemplate(true);
    try {
      const currentBId = user?.branchId || user?.branch?.id;
      let count = 0;
      for (const tpl of templatesToApply) {
        try {
          await createPackage({
            nama: tpl.nama,
            name: tpl.nama,
            kategori: tpl.kategori,
            durasi: Number(tpl.durasi),
            harga: Number(tpl.harga),
            status: 'Aktif',
            ...(currentBId ? { branchId: currentBId } : {}),
          });
          count++;
        } catch (err) {
          console.error(`Gagal menerapkan paket "${tpl.nama}":`, err);
        }
      }
      notifyPackagesUpdated();
      showToast(`Berhasil menerapkan ${count} paket template ke cabang Anda.`);
      await fetchPackagesData();
    } catch (err) {
      console.error('Gagal menerapkan semua template:', err);
      showToast('Terjadi kesalahan saat menerapkan template.');
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const fetchPackagesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentBId = user?.branchId || user?.branch?.id;
      const data = await getPackages({
        branchId: currentBId,
        search,
        kategori: selectedCategory,
        status: statusFilter === 'template' ? 'semua' : statusFilter,
        allowEmpty: true,
      });
      // Sembunyikan paket yang branchId-nya kosong / null (paket global),
      // dan pastikan paket hanya milik cabang SPV itu sendiri dari BE (tanpa paket global dan tanpa fallback)
      const uptPackages = (data || []).filter((p) => {
        if (!p.branchId || String(p.branchId).trim() === '') return false;
        if (currentBId) {
          return String(p.branchId).toLowerCase() === String(currentBId).toLowerCase();
        }
        return true;
      });
      setPackages(uptPackages);

      // Sinkronisasikan paket cabang yang aktif ke shared storage agar Kantin langsung sinkron
      const currentBName = uptName || user?.branch?.name || uptPackages[0]?.branch;
      try {
        if (currentBId) {
          localStorage.setItem(`pascall_branch_packages_${currentBId}`, JSON.stringify(uptPackages));
          localStorage.setItem('pascall_active_branch_id', currentBId);
        }
        if (currentBName) {
          localStorage.setItem('pascall_active_branch_name', currentBName);
        }

        if (uptPackages.length > 0) {
          localStorage.setItem('pascall_latest_branch_packages', JSON.stringify(uptPackages));
          localStorage.setItem('pascall_upt_packages_v7', JSON.stringify(uptPackages));
        } else {
          localStorage.removeItem('pascall_latest_branch_packages');
          localStorage.removeItem('pascall_upt_packages_v7');
        }
      } catch {}
      notifyPackagesUpdated();
    } catch (err) {
      console.error('Gagal memuat paket:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, statusFilter, uptName, user]);

  useEffect(() => {
    fetchPackagesData();
  }, [fetchPackagesData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      nama: '',
      kategori: 'telepon',
      durasi: '',
      harga: '',
      status: 'Aktif',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      nama: pkg.nama || pkg.name || '',
      kategori: pkg.kategori || 'telepon',
      durasi: String(pkg.durasi || pkg.durationMinutes || ''),
      harga: String(pkg.harga || pkg.price || ''),
      status: pkg.status || 'Aktif',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = formData.nama.trim();
    if (!trimmedName) {
      setFormError('Nama paket wajib diisi.');
      return;
    }

    if (!formData.kategori) {
      setFormError('Kategori paket wajib dipilih.');
      return;
    }

    const durasiNum = Number(formData.durasi);
    if (!formData.durasi || isNaN(durasiNum) || durasiNum <= 0) {
      setFormError('Jumlah menit harus berupa angka lebih dari 0.');
      return;
    }

    const hargaNum = Number(formData.harga);
    if (formData.harga === '' || formData.harga === undefined || formData.harga === null || isNaN(hargaNum) || hargaNum < 0) {
      setFormError('Harga harus berupa angka valid (minimal Rp 0).');
      return;
    }

    if (!formData.status) {
      setFormError('Status paket wajib dipilih.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentBId = user?.branchId || user?.branch?.id;
      if (editingPackage) {
        await updatePackage(editingPackage.id, {
          nama: trimmedName,
          name: trimmedName,
          kategori: formData.kategori,
          durasi: durasiNum,
          harga: hargaNum,
          status: formData.status,
          ...(currentBId ? { branchId: currentBId } : {}),
        });
        showToast(`Paket "${trimmedName}" berhasil diperbarui.`);
      } else {
        await createPackage({
          nama: trimmedName,
          name: trimmedName,
          kategori: formData.kategori,
          durasi: durasiNum,
          harga: hargaNum,
          status: formData.status,
          ...(currentBId ? { branchId: currentBId } : {}),
        });
        showToast(`Paket "${trimmedName}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      fetchPackagesData();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan paket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleClick = (pkg) => {
    if (pkg.status === 'Aktif') {
      setSelectedPackageForToggle(pkg);
      setIsConfirmModalOpen(true);
    } else {
      executeToggleStatus(pkg);
    }
  };

  const executeToggleStatus = async (pkg) => {
    const target = pkg || selectedPackageForToggle;
    if (!target) return;
    setIsSubmitting(true);
    try {
      const updated = await togglePackageStatus(target.id, target.status);
      showToast(
        `Paket "${target.nama || target.name}" berhasil ${updated.status === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      setIsConfirmModalOpen(false);
      setSelectedPackageForToggle(null);
      fetchPackagesData();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status paket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteDeletePackage = async () => {
    if (!packageToDelete) return;
    setIsSubmitting(true);
    setDeleteError('');
    try {
      await deletePackage(packageToDelete.id);
      showToast(`Paket "${packageToDelete.nama || packageToDelete.name}" berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      fetchPackagesData();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus paket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  // Filter paket cabang yang sudah tersimpan
  const displayedBranchPackages = packages.filter((pkg) => {
    // Filter Kategori
    if (selectedCategory !== 'semua') {
      const kat = (pkg.kategori || '').toLowerCase();
      if (kat !== selectedCategory.toLowerCase()) return false;
    }

    // Filter Status
    if (statusFilter !== 'semua') {
      if (statusFilter === 'template') return false;
      if (pkg.status !== statusFilter) return false;
    }

    // Pencarian kata kunci
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (pkg.nama || pkg.name || '').toLowerCase();
      const kat = (pkg.kategori || '').toLowerCase();
      const durasi = String(pkg.durasi || pkg.durationMinutes || '');
      const harga = String(pkg.harga || pkg.price || '');
      if (!name.includes(q) && !kat.includes(q) && !durasi.includes(q) && !harga.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Kriteria mendeteksi paket template rekomendasi yang "Sudah Diterapkan":
  // Paket dianggap sudah diterapkan jika cabang sudah memiliki paket dengan nama yang sama,
  // ATAU memiliki paket dengan spesifikasi identik (kategori, durasi menit, dan nominal harga).
  const isTemplateApplied = (tpl) => {
    return packages.some((p) => {
      const pName = (p.nama || p.name || '').trim().toLowerCase();
      const tplName = tpl.nama.trim().toLowerCase();
      if (pName === tplName) return true;

      const pKat = (p.kategori || '').toLowerCase();
      const tKat = (tpl.kategori || '').toLowerCase();
      const pDur = Number(p.durasi || p.durationMinutes || 0);
      const tDur = Number(tpl.durasi || 0);
      const pHarga = Number(p.harga || p.price || 0);
      const tHarga = Number(tpl.harga || 0);

      return pKat === tKat && pDur === tDur && pHarga === tHarga;
    });
  };

  const unappliedTemplates = DEFAULT_PACKAGES.filter((tpl) => !isTemplateApplied(tpl));

  // Filter paket template berdasarkan kategori, search, dan status
  const displayedTemplates = unappliedTemplates.filter((tpl) => {
    if (selectedCategory !== 'semua' && tpl.kategori !== selectedCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = tpl.nama.toLowerCase().includes(q);
      const matchDesc = (tpl.deskripsi || '').toLowerCase().includes(q);
      const matchDurasi = String(tpl.durasi).includes(q);
      const matchHarga = String(tpl.harga).includes(q);
      if (!matchName && !matchDesc && !matchDurasi && !matchHarga) {
        return false;
      }
    }
    if (statusFilter === 'Aktif' || statusFilter === 'Nonaktif') {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Toolbar: Tabs Kategori, Search, Filter Status, dan Tombol Tambah Paket */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Category Tabs: Semua, Telepon, Video Call */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('semua')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'semua'
                ? 'bg-white text-[#1565C0] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('telepon')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'telepon'
                ? 'bg-[#1565C0] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Telepon</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('video')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'video'
                ? 'bg-[#1565C0] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Call</span>
          </button>
        </div>

        {/* Search, Filter Status & Tombol Tambah Paket */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Cari nama paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1565C0] transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter Status Paket"
              className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
              {unappliedTemplates.length > 0 && <option value="template">Rekomendasi</option>}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] active:scale-95 text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket</span>
          </button>
        </div>
      </div>

      {/* 1. Tabel Utama: Paket Layanan Terdaftar di UPT */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Subheader */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#1565C0]" />
            <h3 className="text-xs font-bold text-slate-800">
              Daftar Paket Terdaftar
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {displayedBranchPackages.length} Paket
            </span>
          </div>
          {statusFilter !== 'semua' && statusFilter !== 'template' && (
            <span className="text-[11px] text-slate-400 font-medium">
              Status: <strong className="text-slate-700">{statusFilter}</strong>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-[#1565C0] border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">Memuat data paket...</p>
          </div>
        ) : displayedBranchPackages.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Paket Terdaftar</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== 'semua' || statusFilter !== 'semua'
                ? 'Tidak ada paket terdaftar yang cocok dengan filter atau kata kunci pencarian Anda.'
                : 'Cabang Anda belum memiliki paket layanan. Anda dapat menambahkan paket manual atau menerapkan paket rekomendasi sistem di bawah.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              {(search || selectedCategory !== 'semua' || statusFilter !== 'semua') ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('semua');
                    setStatusFilter('semua');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer border border-slate-200"
                >
                  <span>Reset Filter</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Paket Baru</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[620px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Nama Paket</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Jumlah Menit</th>
                  <th className="py-3.5 px-4 text-right">Harga</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBranchPackages.map((pkg) => {
                  const isInactive = pkg.status === 'Nonaktif' || pkg.isActive === false;
                  const isTelepon = (pkg.kategori || '').toLowerCase() === 'telepon';

                  return (
                    <tr
                      key={pkg.id}
                      className={`transition-colors ${
                        isInactive
                          ? 'bg-slate-100/75 border-l-4 border-l-rose-400 opacity-80 hover:bg-slate-100'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Nama Paket */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isInactive
                                ? 'bg-slate-200/70 text-slate-400 border-slate-300'
                                : isTelepon
                                ? 'bg-blue-50/80 text-[#1565C0] border-blue-100'
                                : 'bg-purple-50/80 text-purple-700 border-purple-100'
                            }`}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span
                              className={
                                isInactive
                                  ? 'text-slate-600 line-through decoration-slate-300 font-semibold text-xs'
                                  : 'text-slate-800 font-bold text-xs'
                              }
                            >
                              {pkg.nama || pkg.name}
                            </span>
                            {isInactive && (
                              <span className="block text-[10px] font-semibold text-rose-500 mt-0.5">
                                • Tidak Tampil di Kasir Kantin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isInactive
                              ? 'bg-slate-100 text-slate-500 border border-slate-200'
                              : isTelepon
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          }`}
                        >
                          {isTelepon ? <Phone className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                          <span>{isTelepon ? 'Telepon' : 'Video Call'}</span>
                        </span>
                      </td>

                      {/* Jumlah Menit */}
                      <td className={`py-3.5 px-4 text-center font-bold ${isInactive ? 'text-slate-400' : 'text-slate-700'}`}>
                        <div className="inline-flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isInactive ? 'text-slate-300' : 'text-slate-400'}`} />
                          <span>{pkg.durasi || pkg.durationMinutes} Menit</span>
                        </div>
                      </td>

                      {/* Harga */}
                      <td
                        className={`py-3.5 px-4 text-right text-sm ${
                          isInactive
                            ? 'text-slate-400 font-bold line-through decoration-slate-300'
                            : 'font-extrabold text-[#1565C0]'
                        }`}
                      >
                        {formatRupiah(pkg.harga || pkg.price)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                            !isInactive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              !isInactive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isInactive ? 'Nonaktif' : 'Aktif'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pkg)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1565C0] transition cursor-pointer border border-blue-200/60 shadow-2xs hover:scale-105"
                            title="Ubah Paket"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleClick(pkg)}
                            className={`p-1.5 rounded-lg transition cursor-pointer shadow-2xs hover:scale-105 border ${
                              !isInactive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/80'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                            }`}
                            title={
                              !isInactive
                                ? 'Nonaktifkan Paket (Sembunyikan dari Kasir Kantin)'
                                : 'Aktifkan Paket (Tampilkan di Kasir Kantin)'
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(pkg)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer border border-slate-200 shadow-2xs hover:scale-105"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Bagian Terpisah: Paket Rekomendasi Sistem (Standar Nasional) */}
      {displayedTemplates.length > 0 && statusFilter !== 'Aktif' && statusFilter !== 'Nonaktif' && (
        <div className="bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 rounded-2xl border border-emerald-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Paket Rekomendasi Sistem
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {displayedTemplates.length} Tersedia
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Template paket standar nasional yang dapat langsung diterapkan ke UPT Anda dalam 1-klik.
              </p>
            </div>

            {displayedTemplates.length >= 1 && (
              <button
                type="button"
                onClick={() => handleApplyAllTemplates(displayedTemplates)}
                disabled={isApplyingTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isApplyingTemplate ? (
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Terapkan Semua Sekaligus</span>
              </button>
            )}
          </div>

          {/* Grid Card Rekomendasi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {displayedTemplates.map((tpl) => {
              const isTelepon = (tpl.kategori || '').toLowerCase() === 'telepon';
              const isApplyingThis = applyingTemplateName === tpl.nama;

              return (
                <div
                  key={`tpl-${tpl.nama}`}
                  className="bg-white rounded-xl p-4 border border-emerald-100/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isTelepon
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                        }`}
                      >
                        {isTelepon ? <Phone className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                        <span>{isTelepon ? 'Telepon' : 'Video Call'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{tpl.durasi} Menit</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {tpl.nama}
                      </h4>
                      <p className="text-base font-black text-[#1565C0] mt-1">
                        {formatRupiah(tpl.harga)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplySingleTemplate(tpl)}
                    disabled={isApplyingThis || isApplyingTemplate}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-transparent font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isApplyingThis ? (
                      <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>{isApplyingThis ? 'Menerapkan...' : 'Terapkan Paket'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Paket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingPackage ? 'Ubah Paket Komunikasi' : 'Tambah Paket Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {uptName || 'UPT Pemasyarakatan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Input Nama Paket */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Paket <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Paket Telepon 15 Menit"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Kategori Paket */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Layanan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kategori: 'telepon' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formData.kategori === 'telepon'
                        ? 'bg-blue-50 border-[#1565C0] text-[#1565C0]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Telepon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kategori: 'video' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formData.kategori === 'video'
                        ? 'bg-purple-50 border-purple-600 text-purple-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Call</span>
                  </button>
                </div>
              </div>

              {/* Durasi & Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Menit <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="15"
                      value={formData.durasi}
                      onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium pointer-events-none">
                      Mnt
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="15000"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Paket */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Paket <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Aktif">Aktif (Tampil di Kasir Kantin)</option>
                  <option value="Nonaktif">Nonaktif (Disembunyikan dari Kantin)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : editingPackage ? 'Simpan Perubahan' : 'Tambah Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Nonaktifkan */}
      {isConfirmModalOpen && selectedPackageForToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Power className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Nonaktifkan Paket?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Paket <span className="font-bold text-slate-700">"{selectedPackageForToggle.nama || selectedPackageForToggle.name}"</span> tidak akan muncul di kasir Kantin. Transaksi lama tetap tersimpan utuh.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setSelectedPackageForToggle(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeToggleStatus()}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Paket */}
      {isDeleteModalOpen && packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Hapus Paket?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus paket <span className="font-bold text-slate-700">"{packageToDelete.nama || packageToDelete.name}"</span>?
            </p>

            {deleteError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-tight">{deleteError}</p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPackageToDelete(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeletePackage}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Paket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
