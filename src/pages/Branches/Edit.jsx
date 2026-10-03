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
  Power
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
    status: 'Active'
  });

  const [initialBranch, setInitialBranch] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBranchById(id).then(branch => {
      if (branch) {
        setInitialBranch(branch);
        setFormData({
          name: branch.name,
          location: branch.location,
          address: branch.address || '',
          phone: branch.phone || '',
          capacity: branch.capacity || '',
          status: branch.status || 'Active'
        });
      }
    }).catch(err => {
      console.log('[BranchEdit] Error load branch:', err);
    });
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
      setErrorMsg('Nama cabang tidak boleh kosong.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Kota / wilayah tidak boleh kosong.');
      return;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setErrorMsg('Kapasitas maksimal harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: ganti ke API BE saat endpoint tersedia
      await updateBranch(id, {
        name: formData.name.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        capacity: parseInt(formData.capacity, 10),
        status: formData.status
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
      } else if (err?.status === 404 || err?.status === 405 || err?.isNetworkError || err?.status === 0) {
        setErrorMsg('Fitur ini belum tersedia di sistem backend.');
      } else if (err?.status === 400) {
        setErrorMsg(err?.message || 'Data cabang tidak valid.');
      } else {
        setErrorMsg('Fitur ini belum tersedia di sistem backend.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!initialBranch && formData.name === '') {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Cabang Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Data cabang dengan ID {id} tidak ada di sistem.</p>
          <Link 
            to="/branches"
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Daftar Cabang
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">{formData.name || 'Cabang Tanpa Nama'}</h2>
              <span className="font-mono text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                {id?.toUpperCase()}
              </span>
            </div>
            <p className="text-blue-100 text-xs font-medium flex items-center justify-center sm:justify-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-200" /> {formData.location || 'Wilayah Belum Ditentukan'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-blue-100 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5 text-blue-300" />
                <span>Terisi: <strong className="text-white">{new Intl.NumberFormat('id-ID').format(initialBranch?.inmateCount || 0)} WBP</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
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
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Informasi Utama Cabang</h3>
              <p className="text-[11px] text-slate-500">Nama resmi fasilitas pemasyarakatan dan status operasional sistem</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Nama Cabang */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Cabang (Lapas / Rutan) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Lapas Kelas I Cipinang"
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
                      Cabang Aktif
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
                      Nonaktifkan Cabang
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Akses operator & komunikasi bilik ditangguhkan</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Kapasitas Maksimal */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kapasitas Maksimal (Daya Tampung WBP) <span className="text-rose-500">*</span>
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
                  placeholder="Contoh: 2500"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400">Digunakan untuk menghitung rasio kepadatan dan alokasi bilik komunikasi.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Lokasi & Kontak */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lokasi & Informasi Kontak</h3>
              <p className="text-[11px] text-slate-500">Detail alamat fisik dan saluran komunikasi resmi cabang</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kota / Wilayah */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kota / Wilayah <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Jakarta Timur"
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
                    placeholder="Contoh: 021-8190001"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Alamat Lengkap Fasilitas
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

