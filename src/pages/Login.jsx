import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  UserPlus, 
  PhoneCall, 
  AlertCircle 
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  // Local state
  const [identifier, setIdentifier] = useState('admin.cipinang@pascall.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick switch credentials helper
  const selectRole = (role) => {
    setError('');
    if (role === 'pusat') {
      setIdentifier('admin.pusat@pascall.id');
      setPassword('password123');
    } else {
      setIdentifier('admin.cipinang@pascall.id');
      setPassword('password123');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!identifier.trim()) {
      setError('Email atau username tidak boleh kosong.');
      return;
    }

    if (!password) {
      setError('Password tidak boleh kosong.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);

    // Simulate authentication logic
    setTimeout(() => {
      setIsLoading(false);
      const lower = identifier.toLowerCase();
      // Route intelligently: if branch admin, go to branch dashboard, otherwise superadmin dashboard
      if (lower.includes('branch') || lower.includes('cipinang') || lower.includes('cabang') || lower.includes('budi')) {
        navigate('/branch/dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#071328] text-white font-sans selection:bg-blue-500 selection:text-white px-4 py-12 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* BACKGROUND PLACEHOLDER: Cinematic Night Lapas Atmosphere & Radial Gradient */}
      {/* TODO: ganti background ini dengan foto asli suasana lapas malam hari */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep Night Sky Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060E1E] via-[#0B1C39] to-[#040913]"></div>

        {/* Cinematic Radial Glows (Simulating Spotlight & Neon Handset Glow) */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]"></div>

        {/* Vignette Shadow Overlay to keep maximum focus on login card */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(4,9,19,0.85)_100%)]"></div>

        {/* Minimalist Lapas Watchtower & Facility Silhouette at bottom with low opacity */}
        <div className="absolute bottom-0 inset-x-0 h-48 opacity-25 flex items-end justify-center pointer-events-none">
          <svg className="w-full max-w-5xl h-full" viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none">
            {/* Left Facility Wings */}
            <rect x="120" y="90" width="160" height="110" fill="#0E2448" />
            <rect x="140" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="170" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="200" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="230" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="140" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="170" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="200" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="230" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />

            {/* Right Facility Wings */}
            <rect x="720" y="90" width="160" height="110" fill="#0E2448" />
            <rect x="740" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="770" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="800" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="830" y="110" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="740" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="770" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="800" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
            <rect x="830" y="140" width="14" height="14" rx="2" fill="#38BDF8" opacity="0.4" />

            {/* Central Main Building & Watchtower */}
            <rect x="420" y="70" width="160" height="130" fill="#091A36" />
            <rect x="470" y="20" width="60" height="60" fill="#0B2042" />
            <polygon points="460,20 500,0 540,20" fill="#1D4ED8" />
            <line x1="500" y1="0" x2="500" y2="-10" stroke="#38BDF8" strokeWidth="2" />
            <circle cx="500" cy="-10" r="2.5" fill="#60A5FA" />
            {/* Tower Observation Windows */}
            <rect x="480" y="30" width="10" height="12" rx="1" fill="#FFFFFF" opacity="0.8" />
            <rect x="495" y="30" width="10" height="12" rx="1" fill="#FFFFFF" opacity="0.8" />
            <rect x="510" y="30" width="10" height="12" rx="1" fill="#FFFFFF" opacity="0.8" />

            {/* Perimeter Wall & Fence */}
            <rect x="0" y="180" width="1000" height="20" fill="#040A17" />
            <line x1="0" y1="180" x2="1000" y2="180" stroke="#1E3A8A" strokeWidth="2" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING GLASSMORPHIC LOGIN CARD */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[440px] bg-slate-900/60 backdrop-blur-2xl border border-blue-400/25 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(3,10,25,0.75)]">
        
        {/* Subtle Card Ambient Highlight Ring */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 bg-blue-500/20 blur-2xl pointer-events-none"></div>

        {/* 1. Logo PasCall (Same as Landing Page) */}
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B1C39] rounded-full flex items-center justify-center">
                <PhoneCall className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Pas<span className="text-cyan-400">Call</span>
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Judul & 3. Subjudul */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Masuk untuk mengakses sistem manajemen PasCall.
          </p>
        </div>

        {/* Quick Demo Role Picker Tabs */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => selectRole('cabang')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              identifier.toLowerCase().includes('cipinang') || identifier.toLowerCase().includes('cabang')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Cabang
          </button>
          <button
            type="button"
            onClick={() => selectRole('pusat')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              identifier.toLowerCase().includes('pusat')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Pusat (Superadmin)
          </button>
        </div>

        {/* Validation Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 4. Input Email / Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Email / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan email atau username"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 hover:border-blue-400/40 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
            </div>
          </div>

          {/* 5. Input Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 hover:border-blue-400/40 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 6. Baris Ingat Saya / Lupa Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 focus:ring-1 cursor-pointer"
              />
              <span>Ingat saya</span>
            </label>
            
            <Link 
              to="/forgot-password" 
              className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors"
            >
              Lupa password?
            </Link>
          </div>

          {/* 7. Tombol Masuk (Full-width, Solid Blue Gradient with Arrow) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memproses...</span>
              </span>
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* 8. Divider "atau" */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-white/10"></div>
            <span className="absolute bg-[#0D1D38] px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
              atau
            </span>
          </div>

          {/* 9. Tombol "Daftar sebagai Admin" (Outline, Transparent Blue Border, Person-Add Icon) */}
          <Link
            to="/register"
            className="w-full border border-blue-400/40 hover:border-blue-400 hover:bg-blue-500/10 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 text-sm"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Daftar sebagai Admin</span>
          </Link>

        </form>

        {/* 10. Teks Bawah */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <span>Belum memiliki akun admin? </span>
          <Link 
            to="/register" 
            className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors"
          >
            Daftar sekarang
          </Link>
        </div>

      </div>

      {/* Subtle Bottom Copyright */}
      <div className="absolute bottom-4 inset-x-0 text-center text-[11px] text-slate-500 pointer-events-none">
        &copy; 2026 PasCall. Sistem Komunikasi Terverifikasi Lembaga Pemasyarakatan.
      </div>

    </div>
  );
}
