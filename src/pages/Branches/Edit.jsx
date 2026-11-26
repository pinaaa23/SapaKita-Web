import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Map, 
  Phone, 
  Users, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Power,
  Receipt,
  Wallet
} from 'lucide-react';
import { getBranchById, updateBranch } from '../../services/branchService';
import { logout } from '../../services/api';

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    capacity: '',
    status: 'Active',
    contractRatePerSecond: '',
    sharePondokPercent: '',
    shareDeveloperPercent: '',
    shareKepalaUptPercent: 0,
    shareKoperasiPercent: 0,
    shareInkopasindoPercent: 0,
    shareVendorPercent: 0
  });

  const [initialBranch, setInitialBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getBranchById(id)
      .then(branch => {
        if (!isMounted) return;
        if (branch) {
          setInitialBranch(branch);
          const pondokP = branch.sharePondokPercent ?? branch.shareKoperasiPercent ?? '';
          const devP = branch.shareDeveloperPercent ?? branch.shareVendorPercent ?? '';
          setFormData({
            name: branch.name || '',
            location: branch.location || '',
            address: branch.address === '-' ? '' : (branch.address || ''),
            phone: branch.phone === '-' ? '' : (branch.phone || ''),
            capacity: branch.capacity || '',
            status: branch.status === 'Active' || branch.status === 'Aktif' ? 'Active' : 'Inactive',
            contractRatePerSecond: branch.contractRatePerSecond ? Number(branch.contractRatePerSecond) : '',
            sharePondokPercent: pondokP !== '' ? Number(pondokP) : '',
            shareDeveloperPercent: devP !== '' ? Number(devP) : '',
            shareKepalaUptPercent: 0,
            shareKoperasiPercent: pondokP !== '' ? Number(pondokP) : 0,
            shareInkopasindoPercent: 0,
            shareVendorPercent: devP !== '' ? Number(devP) : 0
          });
        }
      })
      .catch(err => {
        console.log('[BranchEdit] Error load branch:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Nama Pondok Pesantren tidak boleh kosong.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Kota/Kabupaten tidak boleh kosong.');
      return;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setErrorMsg('Kapasitas Santri harus lebih besar dari 0.');
      return;
    }
    if (!formData.contractRatePerSecond || Number(formData.contractRatePerSecond) <= 0) {
      setErrorMsg('Tarif billing per detik harus lebih besar dari 0.');
      return;
    }

    if (formData.sharePondokPercent === '' || formData.shareDeveloperPercent === '') {
      setErrorMsg('Persentase bagi hasil Pondok Pesantren dan Developer wajib diisi.');
      return;
    }

    const pondokPercent = Number(formData.sharePondokPercent);
    const developerPercent = Number(formData.shareDeveloperPercent);
    const totalSplit = pondokPercent + developerPercent;
    if (Math.abs(totalSplit - 100) > 0.01) {
      setErrorMsg(`Total persentase bagi hasil harus tepat 100%. Saat ini: ${totalSplit}%`);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBranch(id, {
        name: formData.name.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        capacity: parseInt(formData.capacity, 10),
        status: formData.status === 'Active' ? 'Aktif' : 'Nonaktif',
        contractRatePerSecond: Number(formData.contractRatePerSecond),
        shareKepalaUptPercent: 0,
        shareKoperasiPercent: pondokPercent,
        shareInkopasindoPercent: 0,
        shareVendorPercent: developerPercent,
        sharePondokPercent: pondokPercent,
        shareDeveloperPercent: developerPercent,
      });
      navigate('/branches');
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setErrorMsg('Anda tidak memiliki akses.');
      } else if (err?.status === 400) {
        const errorDetail = Array.isArray(err?.data?.errors)
          ? err.data.errors.map(e => `${e.field}: ${e.message}`).join(', ')
          : (err?.message || 'Data pondok tidak valid.');
        setErrorMsg(errorDetail);
      } else if (err?.status === 404 || err?.status === 405 || err?.isNetworkError || err?.status === 0) {
        setErrorMsg('Fitur ini belum tersedia di sistem backend.');
      } else {
        setErrorMsg(err?.message || 'Gagal menyimpan perubahan data pondok.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 pb-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-9 w-36 bg-slate-200 rounded-xl" />
          <div className="h-7 w-28 bg-slate-200 rounded-full" />
        </div>
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!initialBranch) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Pondok Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Data pondok pesantren dengan ID {id} tidak ada di sistem.</p>
          <Link 
            to="/branches"
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Daftar Pondok
          </Link>
        </div>
      </div>
    );
  }

  const pondokPercentVal = Number(formData.sharePondokPercent || 0);
  const developerPercentVal = Number(formData.shareDeveloperPercent || 0);
  const currentTotalSplit = pondokPercentVal + developerPercentVal;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status Operasional:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            formData.status === 'Active' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${formData.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            {formData.status === 'Active' ? 'Aktif Beroperasi' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0D7A73] via-[#14968C] to-[#1E5D88] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">{formData.name || 'Pondok Tanpa Nama'}</h2>
              <span className="font-mono text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                {id?.toUpperCase()}
              </span>
            </div>
            <p className="text-teal-100 text-xs font-medium flex items-center justify-center sm:justify-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-200" /> {formData.location || 'Wilayah Belum Ditentukan'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-teal-100 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5 text-teal-300" />
                <span>Terisi: <strong className="text-white">{new Intl.NumberFormat('id-ID').format(initialBranch?.inmateCount || 0)} Santri</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Petugas: <strong className="text-white">{initialBranch?.adminCount || 1} Petugas</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Section 1: Identitas & Status Operasional */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-[#0D7A73]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Informasi Utama Pondok</h3>
              <p className="text-[11px] text-slate-500">Nama resmi pondok pesantren dan status operasional sistem</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Nama Pondok */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Pondok Pesantren <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Pondok Pesantren Al-Hikmah"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Status Operasional Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Operasional Layanan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleStatusChange('Active')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    formData.status === 'Active'
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.status === 'Active' ? 'text-emerald-800' : 'text-slate-700'}`}>
                      Pondok Aktif
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Layanan bilik telepon & operasional aktif berjalan</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('Inactive')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    formData.status === 'Inactive'
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.status === 'Inactive' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.status === 'Inactive' ? 'text-rose-800' : 'text-slate-700'}`}>
                      Nonaktifkan Pondok
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Akses operator & komunikasi bilik ditangguhkan</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Kapasitas Santri */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kapasitas Santri <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="number" 
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Contoh: 500"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400">Digunakan untuk menghitung rasio santri dan alokasi bilik komunikasi.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Lokasi & Kontak Pondok */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-[#0D7A73]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lokasi & Kontak Pondok</h3>
              <p className="text-[11px] text-slate-500">Detail alamat fisik dan saluran komunikasi resmi pondok</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kota / Wilayah */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kota/Kabupaten <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Jombang"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nomor Telepon Kantor / Hotline
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contoh: 0321-861000"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Alamat Lengkap Pondok
              </label>
              <div className="relative">
                <Map className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Masukkan alamat jalan, nomor, kecamatan, dan kode pos..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none shadow-2xs leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Tarif Billing & Bagi Hasil */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 text-[#0D7A73]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tarif Billing & Bagi Hasil</h3>
                <p className="text-[11px] text-slate-500">
                  Tarif panggilan santri per detik dan persentase bagi hasil 2 pihak (Pondok & Developer)
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Tarif Per Detik */}
            <div className="max-w-md space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tarif Panggilan Per Detik (Rp / detik) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">Rp</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  name="contractRatePerSecond"
                  value={formData.contractRatePerSecond}
                  onChange={handleChange}
                  placeholder="Masukkan tarif per detik"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              {formData.contractRatePerSecond ? (
                <p className="text-[11px] text-[#0D7A73] font-semibold">
                  Setara Rp {(Number(formData.contractRatePerSecond || 0) * 60).toLocaleString('id-ID')} / menit
                </p>
              ) : null}
            </div>

            {/* Bagi Hasil 2 Pihak */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Porsi Bagi Hasil (Total Harus 100%)</h4>
                  <p className="text-[11px] text-slate-400">Pembagian pendapatan bersih antara Pondok Pesantren dan Developer</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                  Math.abs(currentTotalSplit - 100) < 0.01
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  Total: {currentTotalSplit}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Pondok Pesantren (%) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="sharePondokPercent"
                    value={formData.sharePondokPercent}
                    onChange={handleChange}
                    placeholder="Contoh: 70"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-slate-400">Persentase bagian pihak pondok pesantren</p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Developer (%) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="shareDeveloperPercent"
                    value={formData.shareDeveloperPercent}
                    onChange={handleChange}
                    placeholder="Contoh: 30"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-slate-400">Persentase bagian developer penyedia sistem</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
  );
};

export default Edit;
