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
  Building2,
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { 
  getPackages, 
  createPackage, 
  updatePackage, 
  togglePackageStatus,
  deletePackage
} from '../../services/packageService';
import { DEFAULT_PACKAGES } from '../../config/defaultPackages';
import { useAuth } from '../../context/AuthContext';

export default function BranchPackages() {
  const { uptName } = useAuth();
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
      await createPackage({
        nama: tpl.nama,
        name: tpl.nama,
        kategori: tpl.kategori,
        durasi: Number(tpl.durasi),
        harga: Number(tpl.harga),
        status: 'Aktif',
      });

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
          });
          count++;
        } catch (err) {
          console.error(`Gagal menerapkan paket "${tpl.nama}":`, err);
        }
      }
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
      const data = await getPackages({
        search,
        kategori: selectedCategory,
        status: statusFilter === 'template' ? 'semua' : statusFilter,
      });
      // Sembunyikan paket yang branchId-nya kosong (paket global), supaya SPV hanya melihat dan mengelola paket UPT-nya sendiri
      const uptPackages = (data || []).filter(
        (p) => Boolean(p.branchId && String(p.branchId).trim() !== '')
      );
      setPackages(uptPackages);
    } catch (err) {
      console.error('Gagal memuat paket:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, statusFilter]);

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
    if (!formData.harga || isNaN(hargaNum) || hargaNum <= 0) {
      setFormError('Harga harus berupa angka lebih dari Rp 0.');
      return;
    }

    if (!formData.status) {
      setFormError('Status paket wajib dipilih.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, {
          name: trimmedName,
          kategori: formData.kategori,
          durasi: durasiNum,
          harga: hargaNum,
          status: formData.status,
        });
        showToast(`Paket "${trimmedName}" berhasil diperbarui.`);
      } else {
        await createPackage({
          name: trimmedName,
          kategori: formData.kategori,
          durasi: durasiNum,
          harga: hargaNum,
          status: formData.status,
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
  const displayedBranchPackages = packages.filter(() => {
    if (statusFilter === 'template') return false;
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

  const totalDisplayed = displayedBranchPackages.length + displayedTemplates.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200/60">
              <Building2 className="w-3 h-3" />
              <span>{uptName || 'UPT Pemasyarakatan'}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1.5">
            Kelola Paket
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur tarif dan paket layanan komunikasi untuk kasir Kantin dan warga binaan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs: Semua, Telepon, Video Call */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
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

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1565C0] transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
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
              <option value="template">Paket Rekomendasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Paket */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-[#1565C0] border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">Memuat data paket...</p>
          </div>
        ) : totalDisplayed === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak Ada Paket</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada paket yang sesuai dengan kriteria filter atau pencarian Anda.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
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
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Paket Manual</span>
              </button>
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
                {/* 1. Paket Cabang yang sudah terdaftar */}
                {displayedBranchPackages.map((pkg) => {
                  const isInactive = pkg.status === 'Nonaktif';
                  const isTelepon = (pkg.kategori || '').toLowerCase() === 'telepon';

                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isInactive ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Nama Paket */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>{pkg.nama || pkg.name}</span>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isTelepon
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          }`}
                        >
                          {isTelepon ? (
                            <Phone className="w-3 h-3" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                          <span>{isTelepon ? 'Telepon' : 'Video Call'}</span>
                        </span>
                      </td>

                      {/* Jumlah Menit */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        <div className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pkg.durasi || pkg.durationMinutes} Menit</span>
                        </div>
                      </td>

                      {/* Harga */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#1565C0] text-sm">
                        {formatRupiah(pkg.harga || pkg.price)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            !isInactive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              !isInactive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {pkg.status}
                        </span>
                      </td>

                      {/* Aksi: Ubah, Aktifkan/Nonaktifkan & Hapus */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pkg)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1565C0] transition cursor-pointer border border-blue-200/60"
                            title="Ubah Paket"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleClick(pkg)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              !isInactive
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                            title={!isInactive ? 'Nonaktifkan Paket' : 'Aktifkan Paket'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(pkg)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer border border-slate-200"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* 2. Divider Baris Template jika ada paket template yang belum diterapkan */}
                {displayedTemplates.length > 0 && (
                  <tr className="bg-emerald-50/50 border-y border-emerald-200/70">
                    <td colSpan={6} className="py-2.5 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Paket Rekomendasi
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {displayedTemplates.length} Tersedia
                          </span>
                        </div>
                        {displayedTemplates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleApplyAllTemplates(displayedTemplates)}
                            disabled={isApplyingTemplate}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {isApplyingTemplate ? (
                              <span className="animate-spin w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Terapkan Semua Sekaligus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* 3. Baris Paket Template dengan tombol Terapkan */}
                {displayedTemplates.map((tpl) => {
                  const isTelepon = (tpl.kategori || '').toLowerCase() === 'telepon';
                  const isApplyingThis = applyingTemplateName === tpl.nama;

                  return (
                    <tr
                      key={`tpl-${tpl.nama}`}
                      className="hover:bg-emerald-50/20 bg-emerald-50/10 transition-colors"
                    >
                      {/* Nama Paket */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/50">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-800 font-bold">{tpl.nama}</span>
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Rekomendasi
                              </span>
                            </div>
                            {tpl.deskripsi && (
                              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                                {tpl.deskripsi}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isTelepon
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          }`}
                        >
                          {isTelepon ? (
                            <Phone className="w-3 h-3" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                          <span>{isTelepon ? 'Telepon' : 'Video Call'}</span>
                        </span>
                      </td>

                      {/* Jumlah Menit */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        <div className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tpl.durasi} Menit</span>
                        </div>
                      </td>

                      {/* Harga */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#1565C0] text-sm">
                        {formatRupiah(tpl.harga)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Belum Diterapkan
                        </span>
                      </td>

                      {/* Aksi: Tombol Terapkan */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleApplySingleTemplate(tpl)}
                          disabled={isApplyingThis || isApplyingTemplate}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Terapkan paket template ini ke cabang Anda"
                        >
                          {isApplyingThis ? (
                            <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>Terapkan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                    min="1"
                    step="100"
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
