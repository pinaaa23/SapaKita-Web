import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Map, 
  Phone, 
  Users, 
  Plus, 
  AlertCircle,
  Power
} from 'lucide-react';
import { mockBranches } from '../../services/mockData';

const Create = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    capacity: '',
    status: 'Active'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = (e) => {
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

    setTimeout(() => {
      const newId = `b${mockBranches.length + 1}`;
      mockBranches.push({
        id: newId,
        name: formData.name,
        location: formData.location,
        address: formData.address,
        phone: formData.phone,
        capacity: parseInt(formData.capacity, 10),
        inmateCount: 0,
        adminCount: 1,
        status: formData.status
      });
      setIsSubmitting(false);
      navigate('/branches');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/branches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali ke Daftar Cabang
        </Link>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Pendaftaran Cabang Baru</h2>
            <p className="text-blue-100 text-xs">
              Daftarkan lapas atau rutan baru untuk mengaktifkan sistem monitoring & bilik telepon PasCall
            </p>
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
                Status Awal Layanan
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
                      Langsung Aktif
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Cabang langsung siap digunakan dan terhubung ke server</p>
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
                      Draft / Nonaktif
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Didaftarkan terlebih dahulu sebelum aktivasi perangkat</p>
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
          <Link 
            to="/branches"
            className="px-5 py-2.5 bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors shadow-2xs"
          >
            Batal
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan Cabang</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Create;

