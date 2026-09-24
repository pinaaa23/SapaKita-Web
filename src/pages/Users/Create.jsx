import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Building2,
  Plus,
  AlertCircle,
  ShieldCheck,
  Store,
  MapPin,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { mockBranches, mockUsers } from '../../services/mockData';

const Create = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Admin Cabang',
    branchId: mockBranches[0]?.id || '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  const [isManualBranch, setIsManualBranch] = useState(false);
  const [manualBranch, setManualBranch] = useState({
    name: '',
    location: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
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
    if (!formData.password) {
      setErrorMsg('Password wajib diisi.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password dan konfirmasi password tidak cocok.');
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
      const newId = `u${mockUsers.length + 1}`;
      mockUsers.unshift({
        id: newId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        branchId: finalBranchId,
        status: formData.status,
        joinDate: new Date().toISOString().split('T')[0]
      });
      setIsSubmitting(false);
      navigate('/users');
    }, 350);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali ke Daftar Pengguna
        </Link>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Pendaftaran Petugas / Operator Baru</h2>
            <p className="text-blue-100 text-xs">
              Buat akun akses untuk Admin Cabang Lapas/Rutan atau Petugas Kasir Kantin
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
              <p className="text-[11px] text-slate-500">Data identitas petugas dan kontak untuk autentikasi sistem</p>
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

        {/* Section 2: Hak Akses & Penempatan Cabang */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Hak Akses & Penempatan Cabang</h3>
              <p className="text-[11px] text-slate-500">Konfigurasi peran otorisasi sistem dan unit penugasan</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Role Selection Cards */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilih Role / Peran Otorisasi <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleRoleChange('Admin Cabang')}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer text-left ${
                    formData.role === 'Admin Cabang'
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    formData.role === 'Admin Cabang' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.role === 'Admin Cabang' ? 'text-primary' : 'text-slate-700'}`}>
                      Admin Cabang
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Mengelola data WBP, verifikasi kontak keluarga, dan monitoring bilik panggilan cabang.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('Petugas Kantin')}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer text-left ${
                    formData.role === 'Petugas Kantin'
                      ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    formData.role === 'Petugas Kantin' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.role === 'Petugas Kantin' ? 'text-purple-800' : 'text-slate-700'}`}>
                      Petugas Kantin
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Memproses transaksi belanja kantin, top-up saldo voucher WBP, dan rekapitulasi setoran.
                    </p>
                  </div>
                </button>
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
          </div>
        </div>

        {/* Section 3: Keamanan & Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Autentikasi & Password Akun</h3>
              <p className="text-[11px] text-slate-500">Tentukan kata sandi awal untuk login pengguna pertama kali</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Konfirmasi Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Ulangi password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link 
            to="/users"
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
                <span>Simpan Pengguna</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Create;
