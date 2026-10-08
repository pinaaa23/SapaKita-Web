import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Phone, 
  Video, 
  Search, 
  Filter,
  CheckCircle2, 
  Edit3, 
  Power, 
  AlertCircle, 
  X, 
  Info,
  Check,
  Clock,
  Coins,
  Trash2,
  Sparkles
} from 'lucide-react';
import { 
  getPackages, 
  createPackage, 
  updatePackage, 
  togglePackageStatus,
  deletePackage
} from '../../services/packageService';

export default function PackagesList() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  const fetchPackagesData = async () => {
    setIsLoading(true);
    try {
      const data = await getPackages({
        search,
        kategori: selectedCategory,
        status: statusFilter,
      });
      setPackages(data || []);
    } catch (err) {
      console.error('Gagal memuat paket:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesData();
  }, [search, selectedCategory, statusFilter]);

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

  const totalActive = packages.filter((p) => p.status === 'Aktif' || p.isActive).length;
  const totalInactive = packages.length - totalActive;

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

      {/* Header Halaman & Tombol Tambah */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200/60">
              <Package className="w-3.5 h-3.5" />
              <span>Paket Komunikasi Nasional</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Kelola Paket Komunikasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar paket dan tarif panggilan yang berlaku seragam untuk seluruh UPT Lapas & Rutan di Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span>Aktif: <strong className="text-emerald-600">{totalActive}</strong></span>
            <span>•</span>
            <span>Nonaktif: <strong className="text-slate-400">{totalInactive}</strong></span>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket</span>
          </button>
        </div>
      </div>

      {/* Filter Kategori Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Kategori Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setSelectedCategory('semua')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              selectedCategory === 'semua'
                ? 'bg-white text-[#1565C0] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua Paket</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-100 text-slate-600 font-bold">
              {packages.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('telepon')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'telepon'
                ? 'bg-white text-[#1565C0] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            <span>Telepon</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'video'
                ? 'bg-white text-[#1565C0] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-indigo-500" />
            <span>Video Call</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, menit, tarif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="semua">Status: Semua</option>
              <option value="aktif">Status: Aktif</option>
              <option value="nonaktif">Status: Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Kelola Paket */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nama Paket</th>
                <th className="py-3.5 px-4 sm:px-6">Kategori</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Jumlah Menit</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Harga Paket</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-semibold">Memuat daftar paket...</p>
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">Tidak ada paket ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau kategori filter Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => {
                  const isAudio = pkg.kategori === 'telepon' || pkg.type === 'AUDIO';
                  const isActive = pkg.status === 'Aktif' || pkg.isActive;

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Nama Paket */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isAudio ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {isAudio ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {pkg.nama || pkg.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Berlaku Nasional
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isAudio
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}
                        >
                          {isAudio ? <Phone className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                          <span>{isAudio ? 'Telepon Suara' : 'Video Call'}</span>
                        </span>
                      </td>

                      {/* Jumlah Menit */}
                      <td className="py-4 px-4 sm:px-6 text-center font-bold text-slate-700 text-sm">
                        <div className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pkg.durasi || pkg.durationMinutes} Menit</span>
                        </div>
                      </td>

                      {/* Harga */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <span className="font-black text-slate-900 text-sm">
                          {formatRupiah(pkg.harga || pkg.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Termasuk PPN</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pkg)}
                            title="Edit Paket"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active / Inactive */}
                          <button
                            type="button"
                            onClick={() => handleToggleClick(pkg)}
                            title={isActive ? 'Nonaktifkan Paket' : 'Aktifkan Paket'}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isActive
                                ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(pkg)}
                            title="Hapus Paket"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL: TAMBAH / EDIT PAKET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    {editingPackage ? 'Edit Paket Komunikasi' : 'Tambah Paket Baru'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Paket ini akan berlaku seragam untuk semua UPT Lapas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Paket */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Paket <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Paket Telepon 15 Menit"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Kategori Paket */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Layanan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kategori: 'telepon' })}
                    className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition cursor-pointer ${
                      formData.kategori === 'telepon'
                        ? 'border-[#1565C0] bg-blue-50/60 text-[#1565C0]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-bold">Telepon Suara</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kategori: 'video' })}
                    className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition cursor-pointer ${
                      formData.kategori === 'video'
                        ? 'border-[#1565C0] bg-blue-50/60 text-[#1565C0]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span className="text-xs font-bold">Video Call</span>
                  </button>
                </div>
              </div>

              {/* Durasi & Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jumlah Menit <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="15"
                      value={formData.durasi}
                      onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                      Menit
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Harga Paket <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="500"
                      placeholder="15000"
                      value={formData.harga}
                      onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                      Rp
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Paket */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Publikasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Aktif' })}
                    className={`py-2 px-3 rounded-xl border-2 text-center text-xs font-bold transition cursor-pointer ${
                      formData.status === 'Aktif'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Aktif (Dijual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Nonaktif' })}
                    className={`py-2 px-3 rounded-xl border-2 text-center text-xs font-bold transition cursor-pointer ${
                      formData.status === 'Nonaktif'
                        ? 'border-slate-500 bg-slate-100 text-slate-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Nonaktif (Draft)
                  </button>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingPackage ? 'Simpan Perubahan' : 'Tambah Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI TOGGLE STATUS */}
      {isConfirmModalOpen && selectedPackageForToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Power className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Nonaktifkan Paket?
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Paket "<strong>{selectedPackageForToggle.nama || selectedPackageForToggle.name}</strong>" tidak akan muncul lagi di kasir kantin seluruh UPT.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeToggleStatus(selectedPackageForToggle)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer"
              >
                {isSubmitting ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS PAKET */}
      {isDeleteModalOpen && packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Hapus Paket Komunikasi?
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus paket "<strong>{packageToDelete.nama || packageToDelete.name}</strong>"? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <p className="text-xs text-rose-600 font-semibold mb-4">{deleteError}</p>
            )}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeletePackage}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
