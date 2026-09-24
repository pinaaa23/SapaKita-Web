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
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-[#06091a] text-white font-sans selection:bg-blue-500 selection:text-white px-4 py-4 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* BACKGROUND: Same image as Landing Page, but focused on another area (bottom/center wave) */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `url('/bg-sections/background_pascall.png') center bottom / cover no-repeat, #06091a`,
            filter: 'contrast(1.05) brightness(0.9)',
          }}
          aria-hidden="true"
        />
        {/* Soft Radial Vignette Overlay to maintain focal point on login card */}
        <div
          className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(6,9,26,0.55)_0%,rgba(6,9,26,0.92)_85%)]"
          aria-hidden="true"
        />
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 right-1/3 w-[500px] h-[300px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING GLASSMORPHIC LOGIN CARD (Compact height - fit 1 screen without scroll) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#0b1329]/80 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
        
        {/* Subtle Ambient Highlight Ring */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-16 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl pointer-events-none" />

        {/* 1. Logo PasCall */}
        <div className="flex justify-center mb-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <svg width="28" height="21" viewBox="0 0 32 24" fill="none" aria-hidden="true" className="group-hover:scale-105 transition-transform duration-200">
              <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#login-hdr-g)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <defs>
                <linearGradient id="login-hdr-g" x1="0" y1="12" x2="32" y2="12">
                  <stop offset="0%" stopColor="#a855f7"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-extrabold tracking-tight text-white">PasCall</span>
          </Link>
        </div>

        {/* 2. Judul & Subjudul */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Masuk untuk mengakses sistem manajemen PasCall.
          </p>
        </div>

        {/* Quick Demo Role Picker Tabs */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => selectRole('cabang')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              identifier.toLowerCase().includes('cipinang') || identifier.toLowerCase().includes('cabang')
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Cabang
          </button>
          <button
            type="button"
            onClick={() => selectRole('pusat')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              identifier.toLowerCase().includes('pusat')
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Pusat
          </button>
        </div>

        {/* Validation Error Alert */}
        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Input Email / Username */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-300 tracking-wide uppercase">
              Email / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan email atau username"
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 hover:border-purple-400/40 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-300 tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 hover:border-purple-400/40 focus:border-cyan-400 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Baris Ingat Saya / Lupa Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-600 bg-white/10 text-purple-600 focus:ring-purple-400 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-[11px]">Ingat saya</span>
            </label>
            
            <Link 
              to="/forgot-password" 
              className="text-cyan-400 hover:text-cyan-300 hover:underline text-[11px] font-medium transition-colors"
            >
              Lupa password?
            </Link>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
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

          {/* Divider "atau" */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t border-white/10"></div>
            <span className="absolute bg-[#0b1329] px-2.5 text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              atau
            </span>
          </div>

          {/* Tombol "Daftar sebagai Admin" */}
          <Link
            to="/register"
            className="w-full border border-white/15 hover:border-purple-400/50 hover:bg-white/5 text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Daftar sebagai Admin</span>
          </Link>

        </form>

        {/* Teks Bawah */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
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
      <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-slate-500 pointer-events-none">
        &copy; 2026 PasCall. Sistem Komunikasi Terverifikasi Lembaga Pemasyarakatan.
      </div>

    </div>
  );
}
