import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Users,
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Power, 
  ShieldCheck, 
  Store, 
  Info
} from 'lucide-react';
import { createUser, generateRandomPassword } from '../../../services/userService';
import { getBranchById, getBranches } from '../../../services/branchService';
import { ROLES, ROLE_LABELS } from '../../../config/menuConfig';
import { useAuth } from '../../../context/AuthContext';

/**
 * Ekstraksi slug cabang yang bersih dari nama cabang, profil user, atau fallback
 */
export const extractBranchSlug = (branchName, user) => {
  const isInvalidCandidate = (c) => {
    if (!c || typeof c !== 'string' || !c.trim()) return true;
    const lower = c.trim().toLowerCase();
    return lower === 'upt anda' || 
           lower === 'lapas pusat' || 
           lower === 'cabang terdaftar' || 
           lower === 'upt terdaftar' || 
           lower === 'cabang' || 
           lower === 'upt';
  };

  const candidates = [
    branchName,
    user?.branch?.name,
    user?.branchName,
    typeof user?.branch === 'string' ? user.branch : '',
    user?.branchLocation,
    user?.branch?.location,
    user?.branch?.slug,
    user?.uptName,
  ].filter(c => !isInvalidCandidate(c));

  const stopwords = [
    'kepala', 'admin', 'supervisor', 'spv', 'kasir', 'operator', 'staf', 'staff', 'petugas', 'pejabat',
    'lapas', 'rutan', 'bapas', 'rupbasan', 'kelas', 'kls', 'iia', 'iib', 'iiia', 'iiib', 'i', 'ii', 'iii',
    'upt', 'kota', 'kabupaten', 'wilayah', 'kantin', 'wartel', 'lembaga', 'pemasyarakatan', 'rumah', 'tahanan', 'negara',
    'cabang', 'terdaftar', 'indonesia'
  ];

  const isStopwordOrClassNumber = (w) => {
    if (!w) return true;
    if (stopwords.includes(w)) return true;
    // Angka numerik murni (misal: '1', '2', '3')
    if (/^\d+$/.test(w)) return true;
    // Format kelas angka atau romawi (misal: '1a', '1b', '2a', '2b', 'i', 'ii', 'iii', 'iv', 'v')
    if (/^(\d+|i|ii|iii|iv|v)[a-z]?$/i.test(w)) return true;
    return false;
  };

  for (const candidate of candidates) {
    const rawWords = candidate
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const meaningfulWords = rawWords.filter(w => !isStopwordOrClassNumber(w));
    if (meaningfulWords.length > 0) {
      return meaningfulWords.slice(0, 2).join('-');
    }
  }

  // Coba ekstrak dari email user/kepala UPT jika ada (contoh: kepala.yogyakarta@sadewa.id -> yogyakarta)
  if (user?.email && user.email.includes('@')) {
    const localPart = user.email.split('@')[0];
    const parts = localPart.split('.');
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      const cleanSlug = part
        .replace(/^(lapas|rutan|bapas|kls|kelas)-*/i, '')
        .replace(/^(\d+|i|ii|iii|iv|v)[a-z]?-*/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (cleanSlug && !isStopwordOrClassNumber(cleanSlug)) {
        return cleanSlug;
      }
    }
  }

  return 'yogyakarta';
};

/**
 * Generator rekomendasi email petugas UPT PasCall
 * Format: peran.nama.cabang@sadewa.id (Contoh: spv.salsabila.yogyakarta@sadewa.id)
 */
export const generateUserEmail = (name, role, branchName, user) => {
  const roleSlug = role === ROLES.OPERATOR_KANTIN ? 'kantin' : 'spv';
  const branchSlug = extractBranchSlug(branchName, user);

  // Ekstrak nama panggilan petugas (kata pertama nama, misal "salsabila")
  let nameSlug = '';
  if (name && typeof name === 'string' && name.trim()) {
    const nameWords = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    nameSlug = nameWords.slice(0, 1).join('');
  }

  const parts = [roleSlug];
  if (nameSlug) parts.push(nameSlug);
  if (branchSlug) parts.push(branchSlug);

  return `${parts.join('.')}@sadewa.id`;
};

const Create = () => {
  const navigate = useNavigate();
  const { uptName, user, logout } = useAuth();
  
  const getInitialBranch = () => {
    const isBad = (v) => !v || typeof v !== 'string' || !v.trim() || 
      ['upt anda', 'cabang terdaftar', 'upt terdaftar'].includes(v.trim().toLowerCase());
    if (!isBad(uptName)) return uptName.trim();
    if (!isBad(user?.branch?.name)) return user.branch.name.trim();
    if (!isBad(user?.branchName)) return user.branchName.trim();
    return 'Lapas II Yogyakarta';
  };

  const [resolvedBranchName, setResolvedBranchName] = useState(getInitialBranch);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(ROLES.SUPERVISOR);
  const [status, setStatus] = useState('Active');
  
  const [email, setEmail] = useState(() => generateUserEmail('', ROLES.SUPERVISOR, getInitialBranch(), user));
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);
  const [password, setPassword] = useState(() => generateRandomPassword());
  
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Resolusi nama UPT/Cabang jika belum terisi dari context
  useEffect(() => {
    const isBad = (v) => !v || typeof v !== 'string' || !v.trim() || 
      ['upt anda', 'cabang terdaftar', 'upt terdaftar'].includes(v.trim().toLowerCase());

    if (!isBad(uptName)) {
      setResolvedBranchName(uptName.trim());
      return;
    }

    const bName = user?.branch?.name || user?.branchName;
    if (!isBad(bName)) {
      setResolvedBranchName(bName.trim());
      return;
    }

    // Ambil langsung dari profile pengguna di backend jika belum tersedia
    import('../../../services/api').then(({ apiFetch }) => {
      apiFetch('/api/users/profile')
        .then((res) => {
          const profile = res?.data || res;
          const fetchedBranchName = profile?.branch?.name || profile?.branchName;
          if (fetchedBranchName) {
            setResolvedBranchName(fetchedBranchName);
          }
        })
        .catch(() => {});
    }).catch(() => {});
  }, [uptName, user]);

  // Sinkronisasi rekomendasi email otomatis
  useEffect(() => {
    if (!isEmailManuallyEdited) {
      setEmail(generateUserEmail(name, role, resolvedBranchName, user));
    }
  }, [resolvedBranchName, role, name, isEmailManuallyEdited, user]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!isEmailManuallyEdited) {
      setEmail(generateUserEmail(val, role, resolvedBranchName, user));
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === ROLES.SUPERVISOR) {
      setIsEmailManuallyEdited(false);
      setEmail(generateUserEmail(name, ROLES.SUPERVISOR, resolvedBranchName, user));
    } else if (!isEmailManuallyEdited) {
      setEmail(generateUserEmail(name, newRole, resolvedBranchName, user));
    }
  };

  const handleEmailChange = (e) => {
    if (role === ROLES.SUPERVISOR) return;
    setEmail(e.target.value);
    setIsEmailManuallyEdited(true);
  };

  const handleAutoGeneratePassword = () => {
    const pwd = generateRandomPassword();
    setPassword(pwd);
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

    if (!name.trim()) {
      setErrorMsg('Nama lengkap pengguna wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrorMsg('Email login wajib diisi.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Format email login tidak valid.');
      return;
    }

    if (!password) {
      setErrorMsg('Password sementara wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password minimal harus 8 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const effectiveBranchId = user?.branchId || user?.branch?.id || localStorage.getItem('pascall_active_branch_id') || undefined;

      await createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        password,
        status,
        branchId: effectiveBranchId,
      });

      setCreatedCredentials({
        name: name.trim(),
        email: email.trim(),
        role,
        password,
        status,
        phone: phone.trim() || '-',
        branchName: resolvedBranchName || uptName || 'UPT Sadewa',
      });
    } catch (err) {
      console.log('[UserCreate] Error submit user:', err);
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
        const errorDetail = err?.data?.errors?.map(e => e.message).join(', ');
        const msg = errorDetail || err?.data?.message || err?.message || 'Validasi gagal. Periksa kembali isian form.';
        setErrorMsg(msg);
      } else {
        setErrorMsg(err?.data?.message || err?.message || 'Gagal mendaftarkan pengguna baru.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    const successText = `Pengguna "${createdCredentials?.name}" (${ROLE_LABELS[createdCredentials?.role] || createdCredentials?.role}) berhasil didaftarkan.`;
    setCreatedCredentials(null);
    navigate('/branch/users', {
      state: { successMessage: successText },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/branch/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali ke Kelola Pengguna
        </Link>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Pendaftaran Pengguna Baru Pondok</h2>
            <p className="text-blue-100 text-xs">
              Daftarkan akun staf Supervisor Kesantrian atau Operator Kopontren untuk mengelola operasional {uptName || 'Pondok'}
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
        
        {/* Section 1: Identitas & Peran Pengguna */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Informasi Profil & Peran</h3>
              <p className="text-[11px] text-slate-500">Nama lengkap petugas dan tingkat wewenang akses di cabang ini</p>
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
                  value={name}
                  onChange={handleNameChange}
                  required
                  placeholder="Contoh: Salsabila Rahmawati"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Nomor Handphone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nomor Telepon / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Pilihan Role Pengguna */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Peran / Role Pengguna <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Supervisor Card */}
                <button
                  type="button"
                  onClick={() => handleRoleChange(ROLES.SUPERVISOR)}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all cursor-pointer text-left ${
                    role === ROLES.SUPERVISOR
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    role === ROLES.SUPERVISOR ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold ${role === ROLES.SUPERVISOR ? 'text-primary' : 'text-slate-800'}`}>
                        Supervisor (SPV)
                      </p>
                      {role === ROLES.SUPERVISOR && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Kelola data santri dan operasional kesantrian pondok.
                    </p>
                  </div>
                </button>

                {/* Operator Kantin Card */}
                <button
                  type="button"
                  onClick={() => handleRoleChange(ROLES.OPERATOR_KANTIN)}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all cursor-pointer text-left ${
                    role === ROLES.OPERATOR_KANTIN
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    role === ROLES.OPERATOR_KANTIN ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold ${role === ROLES.OPERATOR_KANTIN ? 'text-amber-800' : 'text-slate-800'}`}>
                        Operator Kantin
                      </p>
                      {role === ROLES.OPERATOR_KANTIN && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Layanan kasir pengisian paket, transaksi tunai, cetak struk/voucher, dan monitoring wartel.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Kredensial Login & Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Kredensial Akun & Keamanan</h3>
              <p className="text-[11px] text-slate-500">Akun email dan password sementara untuk login pertama kali</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Email Login */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Login Petugas <span className="text-rose-500">*</span>
                </label>
                {role === ROLES.SUPERVISOR ? (
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Dibuat Otomatis (Read-only)
                  </span>
                ) : !isEmailManuallyEdited ? (
                  <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Rekomendasi Otomatis
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailManuallyEdited(false);
                      setEmail(generateUserEmail(name, role, resolvedBranchName, user));
                    }}
                    className="text-[11px] text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Gunakan Rekomendasi
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={handleEmailChange}
                  readOnly={role === ROLES.SUPERVISOR}
                  required
                  placeholder="Contoh: spv.salsabila.cipinang@sadewa.id"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none transition-all shadow-2xs font-mono ${
                    role === ROLES.SUPERVISOR
                      ? 'bg-slate-100/80 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                      : 'bg-white border border-slate-200 text-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Format standar: <span className="text-slate-600">peran.nama.cabang@sadewa.id</span>
              </p>
            </div>

            {/* Password Sementara */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password Sementara <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoGeneratePassword}
                  className="text-[11px] text-primary hover:text-primary-dark font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Buat Ulang Password
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(password, 'password')}
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
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Akun Awal */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Akun Awal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStatus('Active')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    status === 'Active'
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${status === 'Active' ? 'text-emerald-800' : 'text-slate-700'}`}>
                      Langsung Aktif
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Petugas langsung dapat login menggunakan akun ini</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('Inactive')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    status === 'Inactive'
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'Inactive' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${status === 'Inactive' ? 'text-rose-800' : 'text-slate-700'}`}>
                      Nonaktif / Penangguhan
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Akun dibuat tetapi belum diizinkan untuk login</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Notice Box */}
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-900">Pemberitahuan Keamanan</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Pengguna disarankan untuk mengganti kata sandi sementara saat pertama kali berhasil masuk demi menjaga kerahasiaan akun.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link
            to="/branch/users"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all text-center"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pengguna Baru</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ================================================================
          SUCCESS MODAL: KREDENSIAL PENGGUNA BERHASIL DIBUAT
          ================================================================ */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Akun Pengguna Baru Berhasil Didaftarkan!
              </h3>
              <p className="text-xs text-slate-500">
                Kredensial login akun petugas telah berhasil dibuat. Salin dan berikan kredensial login berikut kepada staf yang bersangkutan.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Pondok Pesantren</span>
                <span className="font-bold text-slate-800">
                  {createdCredentials.branchName || resolvedBranchName || uptName || 'Pondok Pesantren'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Nama Petugas</span>
                <span className="font-bold text-slate-800">{createdCredentials.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Role Sistem</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  createdCredentials.role === ROLES.OPERATOR_KANTIN
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-primary border border-blue-200'
                }`}>
                  {ROLE_LABELS[createdCredentials.role] || createdCredentials.role}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Email / Username Login</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-slate-800">{createdCredentials.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.email, 'modal-email')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer transition-colors"
                    title="Salin Email"
                  >
                    {copiedField === 'modal-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Password Sementara</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80">
                    {createdCredentials.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.password, 'modal-pass')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer transition-colors"
                    title="Salin Password"
                  >
                    {copiedField === 'modal-pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status Akun Awal</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                  createdCredentials.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${createdCredentials.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {createdCredentials.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Copy All Button & Close Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const bName = createdCredentials.branchName || resolvedBranchName || uptName || 'Pondok Pesantren';
                  const roleLabel = ROLE_LABELS[createdCredentials.role] || createdCredentials.role;
                  const statusLabel = createdCredentials.status === 'Active' ? 'Aktif' : 'Nonaktif';
                  const fullText = `*Kredensial Akun Pengguna SapaKita*\nPondok Pesantren: ${bName}\nNama Petugas: ${createdCredentials.name}\nRole Pengguna: ${roleLabel}\nUsername / Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nStatus Akun: ${statusLabel}\n\nSilakan login di portal SapaKita.`;
                  handleCopy(fullText, 'modal-all');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedField === 'modal-all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Semua Kredensial Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin Semua Kredensial (Format Teks)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseSuccessModal}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
              >
                Selesai & Lihat Daftar Pengguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create;
