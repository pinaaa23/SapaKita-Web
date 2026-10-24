import React, { useState, useEffect } from 'react';
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
  Power,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { createKanwilBranch } from '../../../services/kanwilService';

export const ADMIN_EMAIL_DOMAIN = 'sadewa.id';

const generateHeadEmail = (name, location) => {
  const rawText = (location && location.trim()) || (name && name.trim()) || '';
  if (!rawText) return '';

  const noiseWords = [
    'lembaga', 'pemasyarakatan', 'rumah', 'tahanan', 'negara',
    'lapas', 'rutan', 'kelas', 'kls', 'khusus', 'narkotika', 'anak', 'wanita', 'pemuda',
    'iia', 'iib', 'iiia', 'iiib', 'i', 'ii', 'iii', 'iv', 'v'
  ];

  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(w => w && !noiseWords.includes(w));

  const coreSlug = (words.length > 0 ? words.join('-') : rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .replace(/^-+|-+$/g, '');

  return coreSlug ? `kepala.${coreSlug}@${ADMIN_EMAIL_DOMAIN}` : '';
};

const generateRandomPassword = () => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const all = uppers + lowers + numbers;

  let pass = '';
  pass += uppers[Math.floor(Math.random() * uppers.length)];
  pass += lowers[Math.floor(Math.random() * lowers.length)];
  pass += numbers[Math.floor(Math.random() * numbers.length)];

  for (let i = 3; i < 10; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
};

export default function KanwilBranchCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const kanwilId = user?.kanwilId || user?.kanwil?.id;
  const kanwilName = user?.kanwilName || user?.kanwil?.name || 'Kantor Wilayah';
  const kanwilProvince = user?.kanwil?.provinces?.[0] || user?.kanwil?.region || user?.wilayah || 'Jawa Barat';

  // Branch form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    capacity: '',
    status: 'Active',
    headName: ''
  });

  // Admin account state
  const [adminEmail, setAdminEmail] = useState('');
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State with created credentials
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const handleBranchNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, name: val };
      if (!isEmailManuallyEdited) {
        setAdminEmail(generateHeadEmail(next.name, next.location));
      }
      return next;
    });
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, location: val };
      if (!isEmailManuallyEdited) {
        setAdminEmail(generateHeadEmail(next.name, next.location));
      }
      return next;
    });
  };

  const handleEmailChange = (e) => {
    setAdminEmail(e.target.value);
    setIsEmailManuallyEdited(true);
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleAutoGeneratePassword = () => {
    const pwd = generateRandomPassword();
    setAdminPassword(pwd);
    setAdminConfirmPassword(pwd);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim()) {
      setErrorMsg('Email login Kepala UPT wajib diisi.');
      return;
    }
    if (!emailRegex.test(adminEmail.trim())) {
      setErrorMsg('Format email login Kepala UPT tidak valid.');
      return;
    }

    if (!adminPassword) {
      setErrorMsg('Password akun Kepala UPT wajib diisi.');
      return;
    }
    if (adminPassword.length < 8) {
      setErrorMsg('Password minimal harus 8 karakter.');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setErrorMsg('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      city: formData.location.trim(),
      location: formData.location.trim(),
      province: kanwilProvince,
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      capacity: parseInt(formData.capacity, 10) || 500,
      status: formData.status === 'Active' ? 'Aktif' : 'Nonaktif',
      headName: formData.headName.trim() || `Kepala ${formData.name.trim()}`,
      headEmail: adminEmail.trim().toLowerCase(),
      headPassword: adminPassword,
      headPhone: formData.phone.trim() || undefined,
    };

    try {
      const res = await createKanwilBranch(kanwilId, payload);
      const newBranchId = res?.id || res?.branch?.id || res?.data?.id;

      setCreatedCredentials({
        branchName: formData.name.trim(),
        branchId: newBranchId,
        email: adminEmail.trim(),
        password: adminPassword,
      });
    } catch (err) {
      console.error('[KanwilBranchCreate] Error submit branch:', err);
      const msg = err?.data?.message || err?.message || 'Gagal mendaftarkan UPT baru.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setCreatedCredentials(null);
    setAdminPassword('');
    setAdminConfirmPassword('');
    navigate('/kanwil/branches', {
      state: { successMessage: `UPT ${formData.name.trim()} berhasil didaftarkan di ${kanwilName}!` }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar - Exactly as in Superadmin */}
      <div className="flex items-center justify-between">
        <Link 
          to="/kanwil/branches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali ke Daftar Cabang
        </Link>
      </div>

      {/* Hero Overview Banner Card - Identical Superadmin Design */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Pendaftaran UPT & Akun Kepala UPT</h2>
            <p className="text-blue-100 text-xs">
              Daftarkan lapas atau rutan baru di bawah naungan {kanwilName} dan buatkan akun login untuk Kepala UPT
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
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
        
        {/* Section 1: Identitas & Status Operasional */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Informasi Utama UPT</h3>
              <p className="text-[11px] text-slate-500">Nama resmi fasilitas pemasyarakatan dan status operasional sistem</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Nama UPT */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama UPT (Lapas / Rutan) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleBranchNameChange}
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
                    <p className="text-[11px] text-slate-500 mt-0.5">UPT langsung siap digunakan dan terhubung ke server</p>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
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

        {/* Section 2: Lokasi & Kontak (NO PROVINSI CAKUPAN FIELD) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lokasi & Informasi Kontak</h3>
              <p className="text-[11px] text-slate-500">Detail alamat fisik dan saluran komunikasi resmi UPT</p>
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
                    onChange={handleLocationChange}
                    required
                    placeholder="Contoh: Bandung"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 022-8190001"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows="3"
                  placeholder="Masukkan alamat jalan, nomor, kecamatan, dan kode pos..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs resize-none leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Akun Kepala UPT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Akun Kepala UPT</h3>
                <p className="text-[11px] text-slate-500">Akun ini dipakai Kepala UPT untuk login ke dashboard</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoGeneratePassword}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buat Otomatis Password</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Nama Lengkap Kepala UPT */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Lengkap Pejabat / Kepala UPT
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="headName"
                  value={formData.headName}
                  onChange={(e) => setFormData(prev => ({ ...prev, headName: e.target.value }))}
                  placeholder="Contoh: Dr. H. Hendra Setiawan, S.H., M.H."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Opsional. Jika dikosongkan, sistem akan otomatis menggunakan format "Kepala [Nama Cabang]".
              </p>
            </div>

            {/* Email Login */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                {adminEmail && (
                  <button
                    type="button"
                    onClick={() => handleCopy(adminEmail, 'email')}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'email' ? 'Disalin' : 'Salin Email'}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="email" 
                  name="branch_admin_email"
                  autoComplete="off"
                  value={adminEmail}
                  onChange={handleEmailChange}
                  required
                  placeholder={`kepala.lapas-bandung@${ADMIN_EMAIL_DOMAIN}`}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Email ini terisi otomatis dari nama UPT dan lokasi. Tetap bisa disesuaikan manual bila diperlukan.
              </p>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {adminPassword && (
                    <button
                      type="button"
                      onClick={() => handleCopy(adminPassword, 'password')}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'password' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'password' ? 'Disalin' : 'Salin Password'}</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    name="branch_admin_password"
                    autoComplete="new-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Konfirmasi Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="branch_admin_confirm_password"
                    autoComplete="new-password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    required
                    placeholder="Ketik ulang password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Password default dapat diacak otomatis dengan tombol di atas atau diketik manual minimal 8 karakter.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/kanwil/branches"
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Batal
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan UPT & Akun Kepala UPT</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Success Modal (Shows credentials ONCE, exactly as in Superadmin) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
              <button
                type="button"
                onClick={handleCloseSuccessModal}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">UPT dan Akun Kepala UPT Berhasil Dibuat</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">{createdCredentials.branchName} ({kanwilName})</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Catat atau salin sekarang. Password tidak bisa dilihat lagi setelah jendela ini ditutup demi keamanan sistem.
                </p>
              </div>

              {/* Credential Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Login Kepala UPT</p>
                    <p className="text-xs font-bold text-slate-800 font-mono truncate mt-0.5">{createdCredentials.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.email, 'modal-email')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedField === 'modal-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedField === 'modal-email' ? 'Disalin!' : 'Salin'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password Awal</p>
                    <p className="text-xs font-bold text-slate-800 font-mono truncate mt-0.5 tracking-wider">{createdCredentials.password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.password, 'modal-password')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedField === 'modal-password' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'modal-password' ? 'Disalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Close Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseSuccessModal}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Saya Sudah Menyimpan Kredensial Ini & Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
