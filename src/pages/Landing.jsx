import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  Wifi, 
  Phone, 
  Video, 
  Wallet, 
  Clock, 
  UserCheck, 
  Mic, 
  FileBadge, 
  Monitor, 
  Building2, 
  Headset, 
  Lock,
  PhoneCall,
  Check,
  Smartphone,
  ChevronRight,
  FileText
} from 'lucide-react';

// Hero Telephone Graphic with Concentric Signal Rings, Glow, and Floating Badges
const PhoneHandset3D = () => {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto aspect-square flex items-center justify-center">
      {/* SVG Gradient Definition for Phone Icon */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="heroPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="70%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Atmospheric Diffuse Glow Behind Phone */}
      <div className="absolute inset-4 rounded-full bg-blue-500/25 blur-3xl transform scale-110 animate-pulse pointer-events-none"></div>
      <div className="absolute inset-14 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none"></div>

      {/* Concentric Thin Signal Rings (Cincin Gelombang Transparan) */}
      {/* Outer Ring 3 (~360px) */}
      <div className="absolute w-[330px] h-[330px] sm:w-[370px] sm:h-[370px] rounded-full border border-blue-400/20 pointer-events-none flex items-center justify-center">
        {/* Accent Visual Dot on Outer Ring */}
        <div className="absolute top-[14%] right-[12%] w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8] ring-4 ring-[#0B1C39] animate-pulse"></div>
      </div>

      {/* Middle Ring 2 (~290px) */}
      <div className="absolute w-[265px] h-[265px] sm:w-[295px] sm:h-[295px] rounded-full border border-cyan-400/25 border-dashed pointer-events-none"></div>

      {/* Inner Ring 1 (~225px) */}
      <div className="absolute w-[210px] h-[210px] sm:w-[230px] sm:h-[230px] rounded-full border border-blue-400/30 pointer-events-none"></div>

      {/* Radial Gradient Glow Pedestal (Lingkaran Background ~270px) */}
      <div className="relative z-10 w-[240px] h-[240px] sm:w-[270px] sm:h-[270px] rounded-full bg-gradient-to-b from-blue-600/30 via-blue-950/60 to-[#0B1C39]/80 backdrop-blur-md border border-cyan-400/30 flex items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.4)] group">
        {/* Inner subtle glow disc */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-cyan-400/10 via-transparent to-blue-500/20 pointer-events-none"></div>

        {/* Clear, Recognizable Telephone Icon (Lucide Phone) in Large Size (180-200px) */}
        <Phone 
          className="w-[150px] h-[150px] sm:w-[185px] sm:h-[185px] drop-shadow-[0_12px_32px_rgba(56,189,248,0.55)] fill-cyan-400/10 transform -rotate-12 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6"
          stroke="url(#heroPhoneGrad)"
          strokeWidth={1.8}
        />
      </div>

      {/* Floating Glassmorphic Badge 1: VERIFIED */}
      <div className="absolute top-4 left-0 sm:left-2 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xl animate-[bounce_4s_infinite]">
        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
          <ShieldCheck className="w-3.5 h-3.5" />
        </span>
        <span className="tracking-wide text-white font-bold">VERIFIED</span>
      </div>

      {/* Floating Glassmorphic Badge 2: CONNECTED */}
      <div className="absolute bottom-6 right-0 sm:right-2 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xl animate-[pulse_3s_infinite]">
        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/40">
          <Wifi className="w-3.5 h-3.5" />
        </span>
        <span className="tracking-wide text-white font-bold">CONNECTED</span>
      </div>
    </div>
  );
};


// Custom SVG 3D Shield Graphic for Security Section (PURE BLUE BRAND GRADIENTS)
const SecurityShield3D = () => {
  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto aspect-square flex items-center justify-center">
      {/* Outer Cyan Glow Aura - Pure Blue/Cyan */}
      <div className="absolute inset-0 rounded-full bg-blue-600/20 blur-3xl animate-pulse"></div>

      {/* Orbit Rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none animate-[spin_20s_linear_infinite]" viewBox="0 0 300 300" fill="none">
        <ellipse cx="150" cy="150" rx="130" ry="60" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6" transform="rotate(-25 150 150)" />
        <ellipse cx="150" cy="150" rx="130" ry="60" stroke="#3B82F6" strokeWidth="2" opacity="0.8" transform="rotate(25 150 150)" />
      </svg>

      {/* Pure Blue 3D Shield Vector */}
      <svg className="relative z-10 w-3/4 h-3/4 drop-shadow-[0_15px_30px_rgba(11,30,70,0.9)]" viewBox="0 0 200 240" fill="none">
        <defs>
          <linearGradient id="shieldBlueGrad" x1="20" y1="10" x2="180" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="35%" stopColor="#3B82F6" />
            <stop offset="70%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0B1C39" />
          </linearGradient>
          <linearGradient id="shieldBlueHighlight" x1="30" y1="15" x2="140" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Base Shield */}
        <path 
          d="M 100 15 C 145 15 180 30 180 75 C 180 145 130 205 100 225 C 70 205 20 145 20 75 C 20 30 55 15 100 15 Z" 
          fill="url(#shieldBlueGrad)" 
          stroke="#60A5FA" 
          strokeWidth="3"
        />

        {/* Inner Border Shield */}
        <path 
          d="M 100 28 C 138 28 168 40 168 80 C 168 138 124 190 100 208 C 76 190 32 138 32 80 C 32 40 62 28 100 28 Z" 
          stroke="#38BDF8" 
          strokeWidth="1.5" 
          fill="none" 
          opacity="0.6"
        />

        {/* Gloss Overlay */}
        <path 
          d="M 100 20 C 140 20 170 32 170 75 C 170 115 145 160 115 190 C 105 140 120 70 100 20 Z" 
          fill="url(#shieldBlueHighlight)" 
        />

        {/* Lock Emblem in Center */}
        <g transform="translate(100, 110)">
          <rect x="-20" y="-10" width="40" height="42" rx="8" fill="#FFFFFF" shadow="0 4px 12px rgba(0,0,0,0.3)" />
          <path d="M -12 -10 V -20 C -12 -27 12 -27 12 -10 V -10" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="0" cy="8" r="4" fill="#1E40AF" />
          <path d="M 0 10 V 18" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0B1C39] text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* SECTION 1: NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0B1C39]/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B1C39] rounded-full flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Pas<span className="text-cyan-400">Call</span>
              </span>
            </div>
          </Link>

          {/* Right Action: Login Button */}
          <Link 
            to="/login"
            className="border border-white/30 hover:border-white text-white hover:bg-white/10 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-white/10 flex items-center gap-2"
          >
            <span>Login</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </Link>

        </div>
      </nav>

      {/* SECTION 2: HERO SECTION */}
      <section className="relative pt-12 pb-24 lg:pt-16 lg:pb-32 bg-gradient-to-b from-[#0B1C39] via-[#0F2A52] to-[#0B1C39] overflow-hidden">
        {/* Subtle Decorative Background Arcs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-4 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Program Komunikasi Terverifikasi
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
                TETAP TERHUBUNG.<br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-300 bg-clip-text text-transparent">
                  TETAP TERJAGA.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                PasCall menghubungkan narapidana dengan keluarga melalui panggilan yang terverifikasi, tercatat, dan diawasi oleh petugas.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a 
                  href="#download" 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
                >
                  <Download className="w-5 h-5" />
                  <span>Unduh PasCall</span>
                </a>

                <a 
                  href="#cara-kerja" 
                  className="w-full sm:w-auto border border-white/30 hover:bg-white/10 text-white font-medium px-7 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all"
                >
                  <span>Lihat Cara Kerja</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Middle Column (3D Retro Phone Art) */}
            <div className="lg:col-span-4 flex justify-center py-4 lg:py-0">
              <PhoneHandset3D />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 text-center lg:text-left space-y-6">
              <div className="space-y-3">
                <span className="text-3xl font-black tracking-tight text-white">
                  Pas<span className="text-cyan-400">Call</span>
                </span>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Cara yang lebih mudah untuk tetap terhubung dengan keluarga melalui komunikasi yang aman dan terverifikasi.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tersedia di
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  {/* Google Play Badge */}
                  <div className="bg-[#0F172A] border border-white/15 hover:border-blue-400/50 rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-all hover:bg-slate-800">
                    <svg className="w-6 h-6 fill-current text-cyan-400" viewBox="0 0 24 24">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] uppercase text-slate-400 font-medium">GET IT ON</div>
                      <div className="text-xs font-bold text-white">Google Play</div>
                    </div>
                  </div>

                  {/* App Store Badge */}
                  <div className="bg-[#0F172A] border border-white/15 hover:border-blue-400/50 rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-all hover:bg-slate-800">
                    <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                    </svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] uppercase text-slate-400 font-medium">Download on the</div>
                      <div className="text-xs font-bold text-white">App Store</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: MASALAH YANG DISELESAIKAN (WITH EXPEDIENT DUOTONE LAPAS TOWER PANEL) */}
      <section className="py-20 bg-white text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Masalah yang Diselesaikan
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Komunikasi terbatas,<br />berdampak besar.
              </h2>
              
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Selama ini komunikasi narapidana dengan keluarga terbatas dan sulit diawasi. PasCall hadir sebagai solusi resmi, aman, dan mudah diakses.
              </p>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
                  <span>Solusi komunikasi resmi dan legal dalam lingkungan Lapas</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
                  <span>Menjaga kehangatan hubungan keluarga warga binaan</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Duotone Lapas Watchtower & Building Graphic with 2 Floating Chips */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#EAF2FC] via-[#DBEAFE] to-[#C2DDFA] p-8 sm:p-12 shadow-xl border border-blue-200/80 min-h-[360px] flex items-center justify-center">
              
              {/* Mechanical Flat Duotone Lapas Building & Watchtower Silhouette with Window Grids */}
              <div className="absolute inset-0 pointer-events-none flex items-end justify-center overflow-hidden">
                <svg className="w-full h-full max-h-[330px]" viewBox="0 0 500 320" fill="none">
                  <defs>
                    <linearGradient id="panelSkyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EFF6FF" />
                      <stop offset="100%" stopColor="#BFDBFE" />
                    </linearGradient>
                  </defs>

                  {/* Panel Background Sky */}
                  <rect width="500" height="320" fill="url(#panelSkyGrad)" />

                  {/* LEFT WING BUILDING (Rectangle with 3x3 Window Grid) */}
                  <rect x="40" y="170" width="110" height="150" fill="#1E40AF" rx="2" />
                  {/* Left Wing Windows */}
                  <rect x="58" y="195" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="86" y="195" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="114" y="195" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="58" y="235" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="86" y="235" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="114" y="235" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="58" y="275" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="86" y="275" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="114" y="275" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />

                  {/* RIGHT WING BUILDING (Rectangle with 3x3 Window Grid) */}
                  <rect x="350" y="170" width="110" height="150" fill="#1E40AF" rx="2" />
                  {/* Right Wing Windows */}
                  <rect x="368" y="195" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="396" y="195" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="424" y="195" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="368" y="235" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="396" y="235" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="424" y="235" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="368" y="275" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="396" y="275" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />
                  <rect x="424" y="275" width="18" height="20" rx="2" fill="#E0F2FE" opacity="0.8" />

                  {/* MAIN BUILDING (Central Vertical Rectangle, 60% Panel Height) */}
                  <rect x="150" y="125" width="200" height="195" fill="#1E3A8A" rx="3" />

                  {/* MAIN BUILDING WINDOW GRID (4 Columns x 5 Rows) */}
                  {/* Row 1 */}
                  <rect x="175" y="145" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="215" y="145" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="263" y="145" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="303" y="145" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  {/* Row 2 */}
                  <rect x="175" y="180" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="215" y="180" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="263" y="180" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="303" y="180" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  {/* Row 3 */}
                  <rect x="175" y="215" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="215" y="215" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="263" y="215" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="303" y="215" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  {/* Row 4 */}
                  <rect x="175" y="250" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="215" y="250" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="263" y="250" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="303" y="250" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  {/* Row 5 */}
                  <rect x="175" y="285" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="215" y="285" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="263" y="285" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />
                  <rect x="303" y="285" width="22" height="20" rx="2" fill="#BAE6FD" opacity="0.9" />

                  {/* WATCHTOWER (Rectangle on Top of Main Building with Observation Deck & Roof) */}
                  {/* Tower Shaft */}
                  <rect x="215" y="45" width="70" height="80" fill="#1D4ED8" />
                  {/* Observation Deck Cabin */}
                  <rect x="200" y="32" width="100" height="36" rx="3" fill="#0F2A52" />
                  {/* Observation Windows */}
                  <rect x="212" y="40" width="18" height="20" rx="2" fill="#FFFFFF" opacity="0.95" />
                  <rect x="241" y="40" width="18" height="20" rx="2" fill="#FFFFFF" opacity="0.95" />
                  <rect x="270" y="40" width="18" height="20" rx="2" fill="#FFFFFF" opacity="0.95" />
                  {/* Tower Triangular Roof */}
                  <polygon points="195,32 250,8 305,32" fill="#2563EB" />
                  {/* Antenna Mast */}
                  <line x1="250" y1="8" x2="250" y2="-5" stroke="#38BDF8" strokeWidth="3" />
                  <circle cx="250" cy="-5" r="3" fill="#60A5FA" />

                  {/* Ground Line */}
                  <rect x="0" y="316" width="500" height="4" fill="#0B1C39" />
                </svg>
              </div>

              {/* Overlay Floating White Glassmorphic Chips */}
              <div className="relative z-10 w-full space-y-4">
                
                {/* Floating Chip 1 */}
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/80 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Jangkauan lebih dekat untuk keluarga.</h4>
                    <p className="text-slate-500 text-xs">Mempermudah silaturahmi tanpa terkendala jarak.</p>
                  </div>
                </div>

                {/* Floating Chip 2 */}
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/80 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Aman, terverifikasi, dan tercatat.</h4>
                    <p className="text-slate-500 text-xs">Sistem keamanan terintegrasi penuh untuk Lapas.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: FITUR UTAMA */}
      <section className="py-20 bg-[#EAF2FC] text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100/80 px-3 py-1 rounded-full border border-blue-200">
              Fitur Utama
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mt-3">
              Untuk keluarga,<br />lebih mudah dan aman.
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl border border-blue-100/80 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                  Panggilan suara & video terjadwal
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Atur waktu panggilan sesuai jadwal yang tersedia.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl border border-blue-100/80 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Wallet className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                  Sistem saldo/top-up mudah
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Isi saldo langsung melalui petugas kantin di dalam lapas.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl border border-blue-100/80 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                  Riwayat panggilan tercatat
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Semua panggilan tersimpan rapi dan mudah ditelusuri.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-xl border border-blue-100/80 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                  Kontak yang sudah terverifikasi
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Hanya kontak yang telah diverifikasi via KTP yang dapat dihubungi.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5: KEAMANAN & KEPERCAYAAN */}
      <section className="py-24 bg-[#0B1C39] relative overflow-hidden text-white">
        {/* Glow backdrop - Pure Blue */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Column 1: Shield Graphic */}
            <div className="lg:col-span-4 flex justify-center">
              <SecurityShield3D />
            </div>

            {/* Column 2: Header & Description */}
            <div className="lg:col-span-4 space-y-5 text-center lg:text-left">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-400/20">
                Keamanan & Kepercayaan
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Transparan untuk institusi, terpercaya untuk semua.
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                PasCall dirancang dengan standar keamanan tinggi agar setiap komunikasi dapat dipantau, dicatat, dan diaudit oleh pihak lapas.
              </p>
            </div>

            {/* Column 3: 4 Security Items */}
            <div className="lg:col-span-4 space-y-5">
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-400/30">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Semua panggilan direkam & bisa diaudit.</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Penjaminan akuntabilitas penuh bagi petugas.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-400/30">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Kontak diverifikasi via KTP.</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Hanya pihak keluarga sah yang terhubung.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-400/30">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Dashboard monitoring real-time untuk admin.</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Pengawasan langsung aktivitas komunikasi.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-400/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Sesuai standar keamanan lembaga pemasyarakatan.</h4>
                  <p className="text-xs text-slate-[#94A3B8] mt-0.5">Memenuhi regulasi Kemenkumham / Ditjen PAS.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: CARA KERJA (CONSISTENT DISTINCT ICONS) */}
      <section id="cara-kerja" className="py-24 bg-white text-slate-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Cara Kerja
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mt-3">
              Mudah dalam 4 langkah.
            </h2>
            <p className="text-slate-600 text-base mt-2 max-w-xl">
              Proses yang jelas dan sederhana, agar keluarga bisa segera terhubung dengan orang tercinta.
            </p>
          </div>

          {/* 4 Steps Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1: Download & Daftar */}
            <div className="relative space-y-4 group">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  1
                </span>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Download className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Download & Daftar
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Keluarga mengunduh aplikasi dan melakukan pendaftaran.
              </p>
            </div>

            {/* Step 2: Verifikasi Kontak */}
            <div className="relative space-y-4 group">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  2
                </span>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Verifikasi Kontak
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Kontak diverifikasi oleh admin cabang.
              </p>
            </div>

            {/* Step 3: Top Up Saldo */}
            <div className="relative space-y-4 group">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  3
                </span>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Top Up Saldo
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Isi saldo di kantin lapas.
              </p>
            </div>

            {/* Step 4: Mulai Panggilan */}
            <div className="relative space-y-4 group">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  4
                </span>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PhoneCall className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Mulai Panggilan
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Lakukan panggilan sesuai jadwal yang tersedia.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 7: STATS STRIP (EXPLICIT DISTINCT ICONS FOR EACH STATISTIC) */}
      <section className="py-10 bg-[#EAF2FC] border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Stat 1: Mic Icon for "Panggilan direkam" */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">100%</div>
                <div className="text-xs font-semibold text-slate-600 mt-1">Panggilan direkam</div>
              </div>
            </div>

            {/* Stat 2: Building2 Icon for "Cabang Lapas" */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">8</div>
                <div className="text-xs font-semibold text-slate-600 mt-1">Cabang Lapas</div>
              </div>
            </div>

            {/* Stat 3: Headset Icon for "Pusat Bantuan" */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Headset className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">24/7</div>
                <div className="text-xs font-semibold text-slate-600 mt-1">Pusat Bantuan</div>
              </div>
            </div>

            {/* Stat 4: Clock Icon for "Rata-rata verifikasi" */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">3 menit</div>
                <div className="text-xs font-semibold text-slate-600 mt-1">Rata-rata verifikasi kontak</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 8: FOOTER */}
      <footer className="bg-[#071328] text-slate-400 py-16 border-t border-white/10 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
            
            {/* Left */}
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  Pas<span className="text-cyan-400">Call</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Program komunikasi terverifikasi
              </p>
              <p className="text-xs text-slate-500 pt-2">
                © 2026 PasCall. Seluruh hak cipta dilindungi.
              </p>
            </div>

            {/* Middle Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-300">
              <a href="#tnc" className="hover:text-cyan-400 transition-colors">Syarat & Ketentuan</a>
              <a href="#privacy" className="hover:text-cyan-400 transition-colors">Kebijakan Privasi</a>
              <a href="#faq" className="hover:text-cyan-400 transition-colors">Bantuan</a>
            </div>

            {/* Right Contact */}
            <div className="flex items-center justify-center md:justify-end gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-400/20 text-cyan-400 flex items-center justify-center">
                <Headset className="w-5 h-5" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Hubungi Kami</div>
                <a href="mailto:cs@pascall.id" className="text-xs font-bold text-white hover:text-cyan-400 transition-colors">
                  cs@pascall.id
                </a>
              </div>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
