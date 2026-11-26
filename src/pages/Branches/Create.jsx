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
  X,
  Receipt
} from 'lucide-react';
import { createBranch, buildCreateBranchPayload } from '../../services/branchService';
import { getAllYayasansForSuperadmin } from '../../services/YayasanService';
import { logout } from '../../services/api';

export const ADMIN_EMAIL_DOMAIN = 'sapakita.id';

const generateAdminEmail = (name, location) => {
  // Ambil teks sumber: utamakan lokasi jika ada, atau nama cabang
  const rawText = (location && location.trim()) || (name && name.trim()) || '';
  if (!rawText) return '';

  // Filter kata-kata umum/formal agar format email ringkas, ramah pengguna, & mudah dihafal
  const noiseWords = [
    'lembaga', 'pemasyarakatan', 'rumah', 'tahanan', 'negara',
    'Pesantren', 'Pesantren', 'kelas', 'kls', 'khusus', 'narkotika', 'anak', 'wanita', 'pemuda',
    'iia', 'iib', 'iiia', 'iiib', 'i', 'ii', 'iii', 'iv', 'v'
  ];

  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(w => w && !noiseWords.includes(w));

  // Jika kata inti tersisa ada, pakai kata tersebut. Jika terfilter semua, pakai teks asli yang disanitasi
  const coreSlug = (words.length > 0 ? words.join('-') : rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .replace(/^-+|-+$/g, '');

  return coreSlug ? `pimpinan.${coreSlug}@${ADMIN_EMAIL_DOMAIN}` : '';
};

const generateRandomPassword = () => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const all = uppers + lowers + numbers;

  let pass = '';
  // Pastikan memuat huruf besar, huruf kecil, dan angka
  pass += uppers[Math.floor(Math.random() * uppers.length)];
  pass += lowers[Math.floor(Math.random() * lowers.length)];
  pass += numbers[Math.floor(Math.random() * numbers.length)];

  // Total 10 karakter alfanumerik yang kuat, rapi, dan mudah dihafal
  for (let i = 3; i < 10; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
};

const Create = () => {
  const navigate = useNavigate();
  
  // Yayasans list state for dropdown
  const [Yayasans, setYayasans] = useState([]);

  // Branch form state
  const [formData, setFormData] = useState({
    name: '',
    YayasanId: '',
    location: '',
    address: '',
    phone: '',
    capacity: '',
    status: 'Active',
    headName: '',
    contractRatePerSecond: '',
    sharePondokPercent: '',
    shareDeveloperPercent: '',
    shareKepalaUptPercent: 0,
    shareKoperasiPercent: 0,
    shareInkopasindoPercent: 0,
    shareVendorPercent: 0
  });

  useEffect(() => {
    const fetchYayasans = async () => {
      try {
        const list = await getAllYayasansForSuperadmin();
        setYayasans(Array.isArray(list) ? list : []);
      } catch (err) {
        console.log('[BranchCreate] Error fetching Yayasans:', err);
      }
    };
    fetchYayasans();
    handleAutoGeneratePassword();
  }, []);

  // Admin account state
  const [adminEmail, setAdminEmail] = useState('');
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => generateRandomPassword());
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State (stores credentials once in memory only)
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const handleBranchNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, name: val };
      if (!isEmailManuallyEdited) {
        setAdminEmail(generateAdminEmail(next.name, next.location));
      }
      return next;
    });
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, location: val };
      if (!isEmailManuallyEdited) {
        setAdminEmail(generateAdminEmail(next.name, next.location));
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
      setErrorMsg('Nama Pondok Pesantren tidak boleh kosong.');
      return;
    }
    if (!formData.YayasanId) {
      setErrorMsg('Yayasan Induk wajib dipilih.');
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim()) {
      setErrorMsg('Email login Pimpinan Pondok wajib diisi.');
      return;
    }
    if (!emailRegex.test(adminEmail.trim())) {
      setErrorMsg('Format email login Pimpinan Pondok tidak valid.');
      return;
    }

    if (!adminPassword) {
      setErrorMsg('Password akun Pimpinan Pondok wajib diisi.');
      return;
    }
    if (adminPassword.length < 8) {
      setErrorMsg('Password minimal harus 8 karakter.');
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

    // Jika BE masih mewajibkan 4 field persen, kirim 0 untuk field yang tidak dipakai dan petakan porsi 2 pihak
    const payload = buildCreateBranchPayload({
      ...formData,
      shareKepalaUptPercent: 0,
      shareKoperasiPercent: pondokPercent,
      shareInkopasindoPercent: 0,
      shareVendorPercent: developerPercent,
      sharePondokPercent: pondokPercent,
      shareDeveloperPercent: developerPercent,
    }, {
      email: adminEmail.trim(),
      password: adminPassword
    });

    try {
      const res = await createBranch(payload);
      const newBranchId = res?.id || res?.data?.id || res?.branch?.id || res?.data?.branch?.id;

      // Store in transient memory state only (never in storage)
      setCreatedCredentials({
        branchName: formData.name.trim(),
        branchId: newBranchId,
        email: adminEmail.trim(),
        password: adminPassword,
      });
    } catch (err) {
      console.log('[BranchCreate] Error submit branch:');
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setErrorMsg('Anda tidak memiliki akses.');
      } else if (err?.status === 404 || err?.status === 405 || err?.isNetworkError || err?.status === 0) {
        setErrorMsg('Fitur ini belum tersedia di sistem backend');
      } else if (err?.status === 400) {
        const msg = err?.data?.message || err?.message || 'Email sudah dipakai, gunakan yang lain.';
        setErrorMsg(msg);
      } else {
        setErrorMsg(err?.data?.message || err?.message || 'Fitur ini belum tersedia di sistem backend');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    // Clear credentials from state immediately
    setCreatedCredentials(null);
    setAdminPassword('');
    navigate('/branches');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/branches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pondok
        </Link>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0D7A73] via-[#14968C] to-[#1E5D88] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Pendaftaran Pondok Pesantren & Akun Pimpinan</h2>
            <p className="text-teal-100 text-xs">
              Daftarkan pondok pesantren baru dan buatkan akun login untuk Pimpinan Pondok
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
        
        {/* Section 1: Informasi Utama Pondok */}
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
            {/* Nama Pondok Pesantren */}
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
                  onChange={handleBranchNameChange}
                  required
                  placeholder="Contoh: Pondok Pesantren Al-Hikmah"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Yayasan Induk */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Yayasan Induk <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <select 
                  name="YayasanId"
                  value={formData.YayasanId}
                  onChange={(e) => setFormData(prev => ({ ...prev, YayasanId: e.target.value }))}
                  required
                  className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs cursor-pointer"
                >
                  <option value="">-- Pilih Yayasan Induk --</option>
                  {Yayasans.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} {k.wilayah ? `(${k.wilayah})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400">Pilih Yayasan pembina resmi pondok pesantren ini.</p>
            </div>

            {/* Status Awal Layanan Toggle */}
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
                    <p className="text-[11px] text-slate-500 mt-0.5">Pondok langsung siap digunakan dan terhubung ke server</p>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  required
                  min="1"
                  placeholder="Contoh: 500"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400">Digunakan untuk menghitung rasio kepadatan dan alokasi bilik komunikasi santri.</p>
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
              <p className="text-[11px] text-slate-500">Detail alamat fisik dan nomor telepon resmi pondok pesantren</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kota/Kabupaten */}
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
                    onChange={handleLocationChange}
                    required
                    placeholder="Contoh: Surakarta"
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
                    placeholder="Contoh: 021-8190001"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Alamat Lengkap Pondok */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Alamat Lengkap Pondok
              </label>
              <div className="relative">
                <Map className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows="3"
                  placeholder="Masukkan alamat jalan, nomor, kecamatan, dan kode pos pondok..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs resize-none leading-relaxed"
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
                  Tarif panggilan santri per detik dan porsi bagi hasil 2 pihak (Pondok Pesantren dan Developer)
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
                  placeholder="Contoh: 15"
                  value={formData.contractRatePerSecond}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractRatePerSecond: e.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-[#0D7A73] font-semibold">
                {formData.contractRatePerSecond 
                  ? `Setara Rp ${(Number(formData.contractRatePerSecond || 0) * 60).toLocaleString('id-ID')} / menit`
                  : 'Masukkan tarif per detik untuk menghitung perkiraan biaya per menit.'}
              </p>
            </div>

            {/* Bagi Hasil 2 Pihak: Pondok Pesantren & Developer */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Porsi Bagi Hasil (2 Pihak)</h4>
                  <p className="text-[11px] text-slate-400">Total akumulasi wajib tepat 100%</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                  Math.abs((Number(formData.sharePondokPercent || 0) + Number(formData.shareDeveloperPercent || 0)) - 100) < 0.01
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  Total: {Number(formData.sharePondokPercent || 0) + Number(formData.shareDeveloperPercent || 0)}%
                </span>
              </div>

              {/* 2 Kolom Persen Lebar Sama Rata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Pondok Pesantren (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    name="sharePondokPercent"
                    value={formData.sharePondokPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, sharePondokPercent: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-400">Porsi bagi hasil untuk pihak Pondok Pesantren</p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Developer (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    name="shareDeveloperPercent"
                    value={formData.shareDeveloperPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, shareDeveloperPercent: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-400">Porsi bagi hasil untuk pengembang platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Akun Pimpinan Pondok */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 text-[#0D7A73]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Akun Pimpinan Pondok</h3>
                <p className="text-[11px] text-slate-500">Akun ini dipakai Pimpinan Pondok untuk login ke dashboard</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoGeneratePassword}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0D7A73] border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acak Ulang Password</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Nama Lengkap Pimpinan Pondok */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Pimpinan Pondok
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="headName"
                  value={formData.headName}
                  onChange={(e) => setFormData(prev => ({ ...prev, headName: e.target.value }))}
                  placeholder="Contoh: KH. Abdullah Gymnastiar"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Opsional. Jika dikosongkan, sistem akan otomatis menggunakan format "Pimpinan [Nama Pondok]".
              </p>
            </div>

            {/* Email Login */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Login Pimpinan <span className="text-rose-500">*</span>
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
                  placeholder={`pimpinan.al-hikmah@${ADMIN_EMAIL_DOMAIN}`}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Email ini terisi otomatis dari nama pondok dan lokasi. Tetap bisa disesuaikan manual oleh Admin Pusat.
              </p>
            </div>

            {/* Password Akun Pimpinan Pondok */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password Akun Pimpinan Pondok <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Rekomendasi Otomatis
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGeneratePassword}
                  className="text-[11px] text-primary hover:text-primary-dark font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Acak Ulang Password
                </button>
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
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(adminPassword, 'password')}
                    className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
                    title="Salin password"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <p>
                  Password diisi otomatis oleh sistem dan dapat disesuaikan manual bila diperlukan. Minimal 8 karakter.
                </p>
                {copiedField === 'password' && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 shrink-0 ml-2">
                    <Check className="w-3 h-3" /> Password berhasil disalin!
                  </span>
                )}
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
                <span>Daftarkan Pondok & Akun Pimpinan</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Success Modal (Shows credentials ONCE, not saved in storage) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#0D7A73] via-[#14968C] to-[#1E5D88] text-white relative">
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
                  <h3 className="text-base font-bold">Pondok Pesantren & Akun Pimpinan Berhasil Dibuat</h3>
                  <p className="text-xs text-teal-100 mt-0.5">{createdCredentials.branchName}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Catat/salin sekarang. Password tidak bisa dilihat lagi setelah jendela ini ditutup demi keamanan sistem.
                </p>
              </div>

              {/* Credential Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Login Pimpinan Pondok</p>
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
                    className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
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
};

export default Create;

