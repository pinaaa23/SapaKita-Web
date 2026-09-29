import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Building2, 
  Calendar,
  Save, 
  CheckCircle2, 
  AlertCircle,
  Power,
  ShieldCheck,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { mockBranches, mockUsers } from '../../services/mockData';

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Admin Cabang',
    branchId: '',
    email: '',
    phone: '',
    status: 'Active'
  });

  const [isManualBranch, setIsManualBranch] = useState(false);
  const [manualBranch, setManualBranch] = useState({
    name: '',
    location: ''
  });

  const [initialUser, setInitialUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = mockUsers.find(u => u.id === id);
    if (user) {
      setInitialUser(user);
      setFormData({
        name: user.name || '',
        role: user.role || 'Admin Cabang',
        branchId: user.branchId || (mockBranches[0]?.id || ''),
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || 'Active'
      });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({ ...prev, role: newRole }));
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Alamat email tidak boleh kosong.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Nomor telepon / HP tidak boleh kosong.');
      return;
    }

    let finalBranchId = formData.branchId;

    if (isManualBranch) {
      if (!manualBranch.name.trim()) {
        setErrorMsg('Nama cabang manual tidak boleh kosong.');
        return;
      }
      if (!manualBranch.location.trim()) {
        setErrorMsg('Kota / wilayah cabang manual tidak boleh kosong.');
        return;
      }

      // Check if branch already exists by name
      const existingBranch = mockBranches.find(
        b => b.name.toLowerCase() === manualBranch.name.trim().toLowerCase()
      );

      if (existingBranch) {
        finalBranchId = existingBranch.id;
      } else {
        const newBranchId = `b${mockBranches.length + 1}`;
        mockBranches.push({
          id: newBranchId,
          name: manualBranch.name.trim(),
          location: manualBranch.location.trim(),
          address: `${manualBranch.name.trim()}, ${manualBranch.location.trim()}`,
          phone: '',
          capacity: 1000,
          inmateCount: 0,
          adminCount: 1,
          status: 'Active'
        });
        finalBranchId = newBranchId;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          branchId: finalBranchId,
          status: formData.status
        };
      }
      setIsSubmitting(false);
      navigate(`/users/${id}`);
    }, 350);
  };

  const currentBranch = isManualBranch 
    ? { name: manualBranch.name || 'Cabang Baru (Manual)', location: manualBranch.location || '' }
    : mockBranches.find(b => b.id === (formData.branchId || initialUser?.branchId));

  if (!initialUser && formData.name === '') {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Pengguna Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Data akun dengan ID {id} tidak terdaftar di sistem.</p>
          <Link 
            to="/users"
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Daftar Pengguna
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to={`/users/${id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali ke Detail
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status Akun:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            formData.status === 'Active' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${formData.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            {formData.status === 'Active' ? 'Akun Aktif' : 'Suspended'}
          </span>
        </div>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">{formData.name || 'Pengguna Tanpa Nama'}</h2>
              <span className="font-mono text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                {id?.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                formData.role === 'Admin Cabang' 
                  ? 'bg-blue-400/25 text-blue-100 border border-blue-300/40' 
                  : 'bg-purple-400/25 text-purple-100 border border-purple-300/40'
              }`}>
                {formData.role}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100 font-medium">
              <p className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-200" />
                <span>
                  {currentBranch ? `${currentBranch.name}${currentBranch.location ? ` (${currentBranch.location})` : ''}` : 'Cabang belum ditentukan'}
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-200" />
                <span>{formData.email || 'Belum ada email'}</span>
              </p>
            </div>

            {initialUser?.joinDate && (
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[11px] text-blue-200/80">
                <Calendar className="w-3 h-3" />
                <span>Terdaftar sejak {new Date(initialUser.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Section 1: Informasi Profil & Kontak */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Informasi Pribadi & Kontak</h3>
              <p className="text-[11px] text-slate-500">Data identitas petugas dan saluran komunikasi aktif</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Lengkap Petugas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alamat Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Alamat Email Resmi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="nama@pascall.id"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Nomor Telepon / HP */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Hak Akses, Cabang & Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Hak Akses & Penempatan Cabang</h3>
              <p className="text-[11px] text-slate-500">Konfigurasi peran otorisasi sistem dan unit lapas/rutan</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Role Card */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Role / Peran Otorisasi
              </label>
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-primary">Admin Cabang</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Otorisasi Resmi</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Mengelola data WBP, verifikasi kontak keluarga, dan monitoring bilik panggilan cabang.
                  </p>
                </div>
              </div>
            </div>

            {/* Cabang Penempatan (Dropdown & Manual Toggle) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lokasi Penempatan Cabang <span className="text-rose-500">*</span>
                </label>
                
                {/* Switcher Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsManualBranch(false)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      !isManualBranch ? 'bg-white text-primary shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pilih dari Daftar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualBranch(true)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      isManualBranch ? 'bg-white text-primary shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    + Input Manual
                  </button>
                </div>
              </div>

              {!isManualBranch ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <select 
                      name="branchId"
                      value={formData.branchId}
                      onChange={(e) => {
                        if (e.target.value === '__manual__') {
                          setIsManualBranch(true);
                        } else {
                          handleChange(e);
                        }
                      }}
                      required
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs appearance-none cursor-pointer"
                    >
                      {mockBranches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.location})
                        </option>
                      ))}
                      <option value="__manual__">+ Tambah Cabang Baru (Input Manual)...</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400">Petugas hanya dapat mengakses data dan fitur terkait cabang ini.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> Input Cabang / Lapas Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManualBranch(false)}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Gunakan Pilihan Dropdown
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Nama Cabang (Lapas / Rutan) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                        <input 
                          type="text"
                          value={manualBranch.name}
                          onChange={(e) => setManualBranch(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Contoh: Lapas Kelas IIA Salemba"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Kota / Wilayah <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                        <input 
                          type="text"
                          value={manualBranch.location}
                          onChange={(e) => setManualBranch(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Contoh: Jakarta Pusat"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-blue-700 font-medium bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    Cabang baru ini otomatis tersimpan ke daftar master cabang PasCall saat formulir disimpan.
                  </p>
                </div>
              )}
            </div>

            {/* Status Akun Pengguna */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Izin Akses Akun
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
                      Akun Aktif
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Petugas memiliki akses login penuh ke sistem</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('Suspended')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    formData.status === 'Suspended'
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.status === 'Suspended' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.status === 'Suspended' ? 'text-rose-800' : 'text-slate-700'}`}>
                      Nonaktif / Suspended
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Akses masuk dan otorisasi login ditangguhkan</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link 
            to={`/users/${id}`}
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
