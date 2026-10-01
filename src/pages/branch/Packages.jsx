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
  Tag,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  getPackages, 
  createPackage, 
  updatePackage, 
  togglePackageStatus 
} from '../../services/packageService';

export default function BranchPackages() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPackageForToggle, setSelectedPackageForToggle] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'telepon',
    durasi: '',
    harga: '',
    status: 'Aktif',
  });
  const [formError, setFormError] = useState('');
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
      nama: pkg.nama || '',
      kategori: pkg.kategori || 'telepon',
      durasi: pkg.durasi || '',
      harga: pkg.harga || '',
      status: pkg.status || 'Aktif',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = formData.nama.trim();
    if (!trimmedName) {
      setFormError('Nama paket wajib diisi.');
      return;
    }

    const durasiNum = Number(formData.durasi);
    if (!formData.durasi || isNaN(durasiNum) || durasiNum <= 0) {
      setFormError('Durasi harus berupa angka positif (lebih dari 0 menit).');
      return;
    }

    const hargaNum = Number(formData.harga);
    if (!formData.harga || isNaN(hargaNum) || hargaNum <= 0) {
      setFormError('Harga harus berupa angka positif (lebih dari Rp0).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, {
          nama: trimmedName,
          kategori: formData.kategori,
          durasi: durasiNum,
          harga: hargaNum,
          status: formData.status,
        });
        showToast(`Paket "${trimmedName}" berhasil diperbarui.`);
      } else {
        await createPackage({
          nama: trimmedName,
          kategori: formData.kategori,
          durasi: durasiNum,
          harga: hargaNum,
          status: formData.status,
        });
        showToast(`Paket "${trimmedName}" berhasil dibuat.`);
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
      const updated = await togglePackageStatus(target.id);
      showToast(
        `Paket "${target.nama}" berhasil ${updated.status === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      setIsConfirmModalOpen(false);
      setSelectedPackageForToggle(null);
      fetchPackagesData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status paket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

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
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Kelola Paket
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur paket telepon dan video call untuk warga binaan
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark active:scale-95 text-white font-bold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Paket</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs: Semua, Telepon, Video Call (Tanpa Combo) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('semua')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'semua'
                ? 'bg-white text-primary shadow-xs'
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
                ? 'bg-primary text-white shadow-xs'
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
                ? 'bg-primary text-white shadow-xs'
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
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
            </select>
          </div>
        </div>
      </div>

      {/* Grid Kartu Paket (3 Kolom Responsif) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse space-y-4 h-56 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/3 mt-2" />
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-7 bg-slate-200 rounded w-1/2" />
              </div>
              <div className="h-8 bg-slate-200 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const isInactive = pkg.status === 'Nonaktif';
            const isTelepon = pkg.kategori === 'telepon';

            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                  isInactive
                    ? 'border-slate-200 bg-slate-50/50 opacity-65'
                    : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                {/* Bagian Atas: Kategori, Status, Nama Paket, dan Durasi */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Badge Kategori */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isTelepon
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                      }`}
                    >
                      {isTelepon ? <Phone className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      <span>{isTelepon ? 'Telepon' : 'Video Call'}</span>
                    </span>

                    {/* Badge Status */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        !isInactive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${!isInactive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {pkg.status}
                    </span>
                  </div>

                  {/* Nama Paket */}
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                    {pkg.nama}
                  </h3>

                  {/* Durasi Panggilan (Dengan Ikon Centang, tanpa teks Semua Operator) */}
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{pkg.durasi} Menit</span>
                  </div>
                </div>

                {/* Bagian Tengah: Harga & Status PPN */}
                <div className="pt-4 pb-3 border-b border-slate-100 mt-4 mb-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>HARGA</span>
                    <span className="text-[10px] text-slate-400 font-normal">Termasuk PPN 11%</span>
                  </div>
                  <div className="text-2xl font-black text-primary tracking-tight mt-1">
                    {formatRupiah(pkg.harga)}
                  </div>
                </div>

                {/* Bagian Bawah: Toggle Status & Tombol Edit */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  {/* Toggle Aktif / Nonaktif */}
                  <button
                    type="button"
                    onClick={() => handleToggleClick(pkg)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      !isInactive
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                    }`}
                    title={!isInactive ? "Nonaktifkan Paket" : "Aktifkan Paket"}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{!isInactive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </button>

                  {/* Tombol Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(pkg)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary font-bold text-xs transition cursor-pointer border border-blue-100"
                    title="Edit Data Paket"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* State Kosong */
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-xs text-center">
          <div className="max-w-sm mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-slate-800 font-bold text-base">Belum ada paket</h3>
            <p className="text-slate-400 text-xs mt-1 mb-5">
              {search || selectedCategory !== 'semua' || statusFilter !== 'semua'
                ? 'Tidak ditemukan paket yang cocok dengan filter pencarian.'
                : 'Buat paket panggilan komunikasi pertama untuk warga binaan di UPT ini.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Buat / Edit Paket (Kategori 2 Kolom: Telepon & Video Call) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-5 bg-gradient-to-r from-primary to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  {editingPackage ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingPackage ? 'Edit Paket Komunikasi' : 'Buat Paket Komunikasi Baru'}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {editingPackage ? 'Perbarui informasi tarif dan durasi paket' : 'Tentukan nama, tarif, durasi, dan kategori paket'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Paket */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Paket <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket Telepon 50 Menit"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
                />
              </div>

              {/* Kategori Paket: Telepon & Video Call (2 Kolom Lebar Sama Rata) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kategori Layanan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kategori: 'telepon' })}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition text-center cursor-pointer ${
                      formData.kategori === 'telepon'
                        ? 'bg-blue-50 border-primary ring-2 ring-primary/20 text-primary'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-bold">Telepon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, kategori: 'video' })}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition text-center cursor-pointer ${
                      formData.kategori === 'video'
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span className="text-xs font-bold">Video Call</span>
                  </button>
                </div>
              </div>

              {/* Grid Durasi & Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Durasi dalam Menit */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Durasi (Menit) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Contoh: 50"
                      value={formData.durasi}
                      onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Harga dalam Rp */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Harga (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="number"
                      required
                      min="100"
                      step="100"
                      placeholder="Contoh: 25000"
                      value={formData.harga}
                      onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status Paket */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status Paket
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Aktif' })}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      formData.status === 'Aktif'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Aktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Nonaktif' })}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      formData.status === 'Nonaktif'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Nonaktif</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingPackage ? 'Simpan Perubahan' : 'Buat Paket')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Konfirmasi Penonaktifan Paket (Tanpa Hapus) */}
      {isConfirmModalOpen && selectedPackageForToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Nonaktifkan Paket Komunikasi?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin menonaktifkan <strong>"{selectedPackageForToggle.nama}"</strong>?
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-left mt-3">
                  <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Paket tidak akan muncul di kantin, riwayat transaksi tetap tersimpan.</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setSelectedPackageForToggle(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => executeToggleStatus(selectedPackageForToggle)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/25 transition cursor-pointer"
                >
                  {isSubmitting ? 'Memproses...' : 'Ya, Nonaktifkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
