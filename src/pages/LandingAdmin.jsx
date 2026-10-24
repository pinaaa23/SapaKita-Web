import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Mail, 
  Wallet, 
  Clock, 
  Shield, 
  Mic, 
  Monitor, 
  IdCard, 
  FileText, 
  Users, 
  BarChart3, 
  LogIn, 
  CheckCircle2
} from 'lucide-react';
import adminDashboardMockup from '../assets/admin_dashboard_mockup.jpg';

/**
 * ================================================================
 * PasCall Admin Landing Page — Clean Flat & Gradient Cards Theme
 * ================================================================
 * Khusus Admin (Admin Pusat & Admin Cabang).
 * Menggunakan gaya visual, palet warna, animasi, dan background
 * yang konsisten dengan desain sistem PasCall.
 * ================================================================
 */

// ──────────────────────────────────────────────────────────────────
// SQUIGGLE — Clean crisp blue wave
// ──────────────────────────────────────────────────────────────────
function Squiggle({ className = '', width = 125, height = 22, id: idProp }) {
  const uid = idProp || `sq-admin-${width}`;
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 140 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(47,111,237,0.25))' }}
    >
      <path
        d="M4 20 C12 4, 20 4, 28 16 C36 28, 44 4, 52 16 C60 28, 68 4, 76 16 C84 28, 92 4, 100 16 C108 28, 116 4, 124 16 C132 28, 136 20, 138 18"
        stroke={`url(#${uid})`}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id={uid} x1="0" y1="16" x2="140" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93bbfc" />
          <stop offset="50%" stopColor="#2f6fed" />
          <stop offset="100%" stopColor="#1a4fc9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────
// DATA FITUR ADMIN (Section 2)
// ──────────────────────────────────────────────────────────────────
const ADMIN_FEATURES = [
  {
    title: 'Manajemen Kontak',
    desc: 'Verifikasi dan kelola daftar kontak keluarga warga binaan lewat data KTP.',
    cardGradient: 'linear-gradient(150deg, #2563eb 0%, #3b82f6 45%, #6366f1 100%)',
    shadowColor: 'rgba(37, 99, 235, 0.32)',
    bracketColor: '#2563eb',
    icon: Users,
  },
  {
    title: 'Saldo & Top Up',
    desc: 'Isi dan pantau saldo warga binaan dengan riwayat yang jelas.',
    cardGradient: 'linear-gradient(150deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%)',
    shadowColor: 'rgba(99, 102, 241, 0.32)',
    bracketColor: '#6366f1',
    icon: Wallet,
  },
  {
    title: 'Riwayat Panggilan',
    desc: 'Lihat waktu, durasi, dan kontak setiap panggilan kapan saja.',
    cardGradient: 'linear-gradient(150deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
    shadowColor: 'rgba(2, 132, 199, 0.32)',
    bracketColor: '#0284c7',
    icon: Clock,
  },
  {
    title: 'Laporan & Rekap',
    desc: 'Rekap aktivitas panggilan dan saldo untuk evaluasi dan pelaporan.',
    cardGradient: 'linear-gradient(150deg, #4338ca 0%, #7c3aed 50%, #9333ea 100%)',
    shadowColor: 'rgba(124, 58, 237, 0.32)',
    bracketColor: '#7c3aed',
    icon: BarChart3,
  },
];

// ──────────────────────────────────────────────────────────────────
// DATA KEAMANAN & TRANSPARANSI (Section 3)
// ──────────────────────────────────────────────────────────────────
const SECURITY_ITEMS = [
  {
    label: 'Rekaman Panggilan',
    desc: 'Semua panggilan direkam dan bisa diaudit.',
    Icon: Mic,
    gradient: 'linear-gradient(135deg, #e11d48 0%, #be185d 50%, #7c3aed 100%)',
    shadowColor: 'rgba(225, 29, 72, 0.22)',
  },
  {
    label: 'Verifikasi KTP',
    desc: 'Kontak diverifikasi via KTP.',
    Icon: IdCard,
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4f46e5 100%)',
    shadowColor: 'rgba(37, 99, 235, 0.22)',
  },
  {
    label: 'Monitoring Real-time',
    desc: 'Dashboard monitoring untuk admin.',
    Icon: Monitor,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #9333ea 100%)',
    shadowColor: 'rgba(124, 58, 237, 0.22)',
  },
  {
    label: 'Standar Keamanan',
    desc: 'Sesuai standar institusi dan regulasi.',
    Icon: Shield,
    gradient: 'linear-gradient(135deg, #0d9488 0%, #0284c7 50%, #2563eb 100%)',
    shadowColor: 'rgba(13, 148, 136, 0.22)',
  },
];

// ──────────────────────────────────────────────────────────────────
// ANIMATED LETTER-BY-LETTER REVEAL (Calm & readable pacing)
// ──────────────────────────────────────────────────────────────────
function AnimatedLetterReveal({ text, startIndex = 0, letterDelay = 0.03, baseDelay = 0.4, className = '', letterClassName = '' }) {
  return (
    <span className={className}>
      {text.split('').map((char, idx) => (
        <span
          key={idx}
          className={`inline-block ${letterClassName}`}
          style={{
            opacity: 0,
            animation: 'lp-letter-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            animationDelay: `${baseDelay + (startIndex + idx) * letterDelay}s`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// SCROLL REVEAL HOOK
// ──────────────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.2, rootMargin = '0px 0px -120px 0px') {
  const [isVisible, setIsVisible] = React.useState(false);
  const domRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      },
      { threshold, rootMargin }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold, rootMargin]);

  return [domRef, isVisible];
}

// ──────────────────────────────────────────────────────────────────
// MAIN COMPONENT — LandingAdmin
// ──────────────────────────────────────────────────────────────────
function LandingAdmin() {
  const [sec2Ref, isSec2Visible] = useScrollReveal(0.15, '0px 0px -120px 0px');
  const [sec3Ref, isSec3Visible] = useScrollReveal(0.25, '0px 0px -20% 0px');
  const [sec4Ref, isSec4Visible] = useScrollReveal(0.2, '0px 0px -10% 0px');

  const handleSmoothScroll = (e) => {
    e.preventDefault();
    document.getElementById('fitur-admin')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="relative min-h-screen text-[#101828] antialiased overflow-x-hidden bg-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* ==============================================================
          HEADER (Navbar Rapi dengan Logo dan Badge Admin di Kiri)
          ============================================================== */}
      <header className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-5 flex items-center justify-between bg-white lp-header-animate sticky top-0 z-50 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/95">
        <Link to="/" className="flex items-center gap-2.5 lp-focus-ring" aria-label="PasCall Beranda Admin">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true">
            <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#hdr-g-admin)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <defs>
              <linearGradient id="hdr-g-admin" x1="0" y1="12" x2="32" y2="12">
                <stop offset="0%" stopColor="#2f6fed"/>
                <stop offset="100%" stopColor="#60a5fa"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-[#101828]">PasCall</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2f6fed] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Admin</span>
          </div>
        </Link>
      </header>

      {/* ==============================================================
          SECTION 1 — HERO (Flat White Background)
          ============================================================== */}
      <section
        id="hero"
        className="relative pt-6 sm:pt-10 lg:pt-12 pb-14 sm:pb-18 lg:pb-20 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white"
      >
        <div
          className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 xl:gap-14 items-center"
          style={{ maxWidth: '1200px' }}
        >
          {/* Left Column — Max width constrained to prevent hitting mockup */}
          <div className="lg:col-span-6 z-10 w-full max-w-[500px]">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-[#2f6fed] text-xs font-bold mb-4 lp-hero-swipe-left">
              <span className="w-2 h-2 rounded-full bg-[#2f6fed] animate-pulse" />
              Sistem Manajemen PasCall
            </div>

            {/* Judul Hero — Rapi 3 baris di layar laptop, proporsional, tidak menabrak gambar */}
            <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] xl:text-[1.95rem] font-extrabold leading-[1.22] tracking-tight text-left mb-5 text-[#101828]">
              <span className="block">
                <AnimatedLetterReveal text="Kelola Layanan Komunikasi," startIndex={0} baseDelay={0.4} letterDelay={0.025} />
              </span>
              <span className="block text-[#2f6fed] mt-1">
                <AnimatedLetterReveal 
                  text="Lebih Tertib" 
                  startIndex={26} 
                  baseDelay={0.4} 
                  letterDelay={0.03} 
                  letterClassName="text-[#2f6fed]" 
                />
              </span>
              <span className="block relative whitespace-nowrap text-[#2f6fed]">
                <AnimatedLetterReveal 
                  text="dan Terpantau" 
                  startIndex={38} 
                  baseDelay={0.4} 
                  letterDelay={0.03} 
                  letterClassName="text-[#2f6fed]" 
                />
                {/* Squiggle tepat di bawah baris terakhir judul */}
                <span className="absolute top-full mt-2 left-0 lp-squiggle-animate" aria-hidden="true">
                  <Squiggle width={125} height={22} id="sq-admin-hero" />
                </span>
              </span>
            </h1>

            {/* Deskripsi dengan jarak cukup ke garis gelombang */}
            <p className="lp-hero-swipe-left text-sm sm:text-base text-[#475467] leading-relaxed max-w-[460px] mt-8 sm:mt-10 mb-8">
              PasCall membantu admin mengelola layanan komunikasi warga binaan dengan aman, terverifikasi, dan tercatat dalam satu sistem.
            </p>

            {/* Hero CTAs */}
            <div className="lp-hero-buttons-animate flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Primary CTA: Login */}
              <Link
                to="/login"
                className="lp-focus-ring inline-flex items-center justify-center gap-2 px-7 py-3.5
                           rounded-full text-white font-bold text-sm sm:text-base
                           bg-[#2f6fed] hover:bg-[#1a5fd4]
                           transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                Login
              </Link>

              {/* Secondary CTA: Lihat Fitur */}
              <a
                href="#fitur-admin"
                onClick={handleSmoothScroll}
                className="lp-focus-ring inline-flex items-center justify-center gap-2 px-6 py-3.5
                           rounded-full text-[#2f6fed] hover:text-[#1a5fd4] font-semibold text-sm sm:text-base
                           border border-[#2f6fed]/30 hover:border-[#2f6fed]/60 bg-blue-50/50 hover:bg-blue-50
                           transition-all duration-200"
              >
                Lihat Fitur
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Column — Dashboard Mockup Preview */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end items-center lp-hero-swipe-right mt-6 lg:mt-0">
            <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px]">

              {/* 0. Ambient Radial Glow Background */}
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] sm:w-[520px] h-[460px] sm:h-[520px] rounded-full pointer-events-none -z-10"
                style={{
                  background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.60) 0%, rgba(139, 92, 246, 0.45) 25%, rgba(99, 102, 241, 0.30) 48%, rgba(59, 130, 246, 0.15) 68%, transparent 80%)',
                  filter: 'blur(38px)',
                }}
              />

              {/* 1. Soft Blur Blobs */}
              <div
                aria-hidden="true"
                className="absolute -top-12 -right-8 w-[260px] h-[260px] rounded-full pointer-events-none -z-10"
                style={{
                  background: 'linear-gradient(135deg, #dbe9ff 0%, #dbe9fc 100%)',
                  filter: 'blur(60px)',
                  opacity: 0.6,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-8 -left-8 w-[220px] h-[220px] rounded-full pointer-events-none -z-10"
                style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #e0effe 100%)',
                  filter: 'blur(60px)',
                  opacity: 0.5,
                }}
              />

              {/* 2. Dashed Circle Outlines */}
              <div
                aria-hidden="true"
                className="absolute -top-8 -right-8 w-[360px] sm:w-[420px] h-[360px] sm:h-[420px] rounded-full border-2 border-dashed border-[#60a5fa]/70 pointer-events-none -z-10 lp-dash-spin-1"
              />
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 w-[260px] sm:w-[310px] h-[260px] sm:h-[310px] rounded-full border-[1.5px] border-dashed border-[#818cf8]/55 pointer-events-none -z-10 lp-dash-spin-2"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-2 -left-8 w-[220px] sm:w-[260px] h-[220px] sm:h-[260px] rounded-full border-[1.5px] border-dashed border-[#60a5fa]/50 pointer-events-none -z-10 lp-dash-spin-3"
              />

              {/* 3. Small Accent Dots */}
              <div aria-hidden="true" className="absolute top-4 -left-3 w-2 h-2 rounded-full bg-[#2f6fed] opacity-70 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute -top-3 right-12 w-2.5 h-2.5 rounded-full bg-[#60a5fa] opacity-80 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute top-1/2 -left-6 w-1.5 h-1.5 rounded-full bg-[#93c5fd] opacity-90 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute bottom-20 -right-3 w-2 h-2 rounded-full bg-[#2f6fed] opacity-65 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute -bottom-2 right-16 w-2.5 h-2.5 rounded-full bg-[#60a5fa] opacity-75 pointer-events-none -z-10" />

              {/* 4. Floating Feature Badges */}
              {/* Badge 1: Verification */}
              <div
                className="absolute -top-3 -left-3 sm:-top-4 sm:-left-5 z-20 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-blue-100 shadow-[0_8px_24px_rgba(47,111,237,0.18)] flex items-center gap-2 transition-transform duration-300 hover:scale-105"
                title="Verifikasi KTP Warga Binaan"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                  <IdCard size={18} strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-bold text-[#101828]">Verifikasi KTP</span>
                  <span className="block text-[9px] text-[#22c55e] font-semibold flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Validasi Akurat
                  </span>
                </div>
              </div>

              {/* Badge 2: Monitoring Realtime */}
              <div
                className="absolute -top-4 right-4 sm:-top-5 sm:right-6 z-20 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-100 shadow-[0_8px_24px_rgba(99,102,241,0.18)] flex items-center gap-2 transition-transform duration-300 hover:scale-105"
                title="Monitoring Realtime"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                  <Monitor size={18} strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-bold text-[#101828]">Live Activity</span>
                  <span className="block text-[9px] text-[#6366f1] font-semibold">24/7 Terpantau</span>
                </div>
              </div>

              {/* Badge 3: Audit & Laporan */}
              <div
                className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-4 z-20 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-100 shadow-[0_8px_24px_rgba(34,197,94,0.18)] flex items-center gap-2.5 transition-transform duration-300 hover:scale-105"
                title="Laporan & Rekapitulasi"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <FileText size={18} strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-bold text-[#101828]">Audit & Laporan</span>
                  <span className="block text-[9px] text-[#059669] font-semibold">Otomatis & Siap Cetak</span>
                </div>
              </div>

              {/* 5. Mockup Image Frame */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.18)] border-4 border-white/90 bg-white group transition-all duration-300 hover:shadow-[0_25px_60px_rgba(47,111,237,0.25)]">
                <img
                  src={adminDashboardMockup}
                  alt="Tampilan Dashboard PasCall"
                  className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 2 — FITUR UNTUK ADMIN (Light Blue Background)
          ============================================================== */}
      <section
        id="fitur-admin"
        ref={sec2Ref}
        className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dbe9fc 12%, #dbe9fc 88%, #ffffff 100%)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1120px' }}>
          {/* Header */}
          <div
            className="mb-10 sm:mb-12 text-center max-w-[760px] mx-auto flex flex-col items-center"
            style={{
              opacity: isSec2Visible ? 1 : 0,
              transform: isSec2Visible ? 'translateY(0)' : 'translateY(-35px)',
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base sm:text-lg font-black text-[#2f6fed] font-mono leading-none select-none">
                //
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#475467]">
                Fitur Utama Admin
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold leading-tight text-[#101828]">
              Semua yang dibutuhkan admin, dalam satu sistem.
            </h2>
          </div>

          {/* 4 Feature Cards Layout with Slide-Down Staggered Animation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 items-stretch pt-2">
            {ADMIN_FEATURES.map((f, idx) => {
              const Icon = f.icon;
              const isEven = idx % 2 === 1; // Cards 2 and 4
              const staggerDelay = `${200 + idx * 200}ms`;

              return (
                <div
                  key={f.title}
                  className={`group relative flex flex-col items-center transition-all duration-300 ${
                    isEven ? 'lg:mt-7' : 'lg:-mt-2'
                  }`}
                  style={{
                    opacity: isSec2Visible ? 1 : 0,
                    transform: isSec2Visible ? 'translateY(0)' : 'translateY(-38px)',
                    transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: isSec2Visible ? staggerDelay : '0ms',
                    pointerEvents: isSec2Visible ? 'auto' : 'none',
                  }}
                >
                  {/* Top Circular Icon Badge (With Corner Framing Brackets) */}
                  <div className="relative z-30 mb-5 flex items-center justify-center">
                    {/* Top-Left Bracket */}
                    <svg
                      className="absolute -top-3 -left-4 w-7 h-7 pointer-events-none z-20 transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1"
                      viewBox="0 0 32 32"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M 3 24 L 3 3 L 24 3"
                        stroke={f.bracketColor}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Top-Right Bracket */}
                    <svg
                      className="absolute -top-3 -right-4 w-7 h-7 pointer-events-none z-20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      viewBox="0 0 32 32"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M 8 3 L 29 3 L 29 24"
                        stroke={f.bracketColor}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Circle Badge */}
                    <div
                      className="w-22 h-22 sm:w-24 sm:h-24 rounded-full p-2 bg-white flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                      style={{
                        boxShadow: `0 12px 28px -4px ${f.shadowColor}`,
                        border: '3px solid rgba(255,255,255,0.95)',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center shadow-inner"
                        style={{
                          background: f.cardGradient,
                        }}
                      >
                        <Icon size={32} color="#ffffff" strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  {/* Card Body with Rich Vibrant Gradient */}
                  <div
                    className="relative w-full flex-1 rounded-3xl p-6 sm:p-7 pt-7 pb-8 flex flex-col justify-between text-center transition-all duration-300 hover:scale-[1.02] text-white min-h-[240px] overflow-hidden"
                    style={{
                      background: f.cardGradient,
                      boxShadow: `0 18px 38px -6px ${f.shadowColor}`,
                    }}
                  >
                    {/* Top inner subtle highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white mb-3 leading-snug">
                        {f.title}
                      </h3>
                      <p className="text-blue-50/95 text-xs sm:text-sm leading-relaxed font-normal">
                        {f.desc}
                      </p>
                    </div>

                    {/* Subtle bottom decorative dash */}
                    <div className="mt-5 pt-4 border-t border-white/15 flex justify-center">
                      <div className="w-10 h-1 rounded-full bg-white/40 transition-all duration-300 group-hover:w-16 group-hover:bg-white/80" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 3 — KEAMANAN & TRANSPARANSI (Flat White Background)
          ============================================================== */}
      <section
        ref={sec3Ref}
        className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white"
      >
        <div className="mx-auto" style={{ maxWidth: '1080px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Block */}
            <div
              className="lg:col-span-5 flex flex-col justify-center"
              style={{
                opacity: isSec3Visible ? 1 : 0,
                transform: isSec3Visible ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-[2px] bg-gradient-to-r from-[#2f6fed] to-[#60a5fa] rounded-full" />
                <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#2f6fed]">
                  Keamanan &amp; Transparansi
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold leading-[1.22] text-[#101828]">
                Transparan untuk institusi,<br />
                <span className="text-[#2f6fed]">terpercaya untuk semua.</span>
              </h2>
              <div className="w-20 h-[3.5px] bg-gradient-to-r from-[#2f6fed] to-[#8b5cf6] rounded-full mt-4 mb-4" />
              <p className="text-[#475467] text-sm sm:text-base leading-relaxed max-w-[420px]">
                Seluruh aktivitas dikelola dengan standar keamanan tinggi dan dapat diaudit oleh pihak berwenang.
              </p>
            </div>

            {/* Right — 2x2 Grid with Staggered Scale-Fade Cards in Z-pattern */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              {SECURITY_ITEMS.map((item, idx) => {
                const Icon = item.Icon;
                const cardDelay = `${120 + idx * 160}ms`;

                return (
                  <div
                    key={item.label}
                    className="group relative flex items-center justify-between gap-4 p-5 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-white overflow-hidden"
                    style={{
                      background: item.gradient,
                      boxShadow: `0 12px 28px -4px ${item.shadowColor}`,
                      opacity: isSec3Visible ? 1 : 0,
                      transform: isSec3Visible ? 'scale(1)' : 'scale(0.92)',
                      transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: isSec3Visible ? cardDelay : '0ms',
                      pointerEvents: isSec3Visible ? 'auto' : 'none',
                    }}
                  >
                    {/* Top inner subtle highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                    <div className="flex-1 min-w-0 pr-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-white mb-1 leading-snug">
                        {item.label}
                      </h3>
                      <p className="text-white/90 text-xs sm:text-sm leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>

                    <div
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110"
                    >
                      <Icon size={24} color="#ffffff" aria-hidden="true" strokeWidth={2} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 4 — AJAKAN MASUK + BANTUAN (Light Blue Background)
          ============================================================== */}
      <section
        ref={sec4Ref}
        className="relative py-14 sm:py-18 lg:py-22 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dbe9fc 14%, #dbe9fc 86%, #ffffff 100%)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="flex justify-center">
            <div
              className="w-full max-w-[880px] px-8 sm:px-12 py-8 sm:py-10 rounded-3xl relative overflow-hidden border border-blue-100/90 bg-white shadow-[0_12px_36px_rgba(47,111,237,0.08)] hover:shadow-[0_18px_45px_rgba(47,111,237,0.13)] transition-all"
              style={{
                opacity: isSec4Visible ? 1 : 0,
                transform: isSec4Visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Subtle top accent border line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600 opacity-80" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#101828] leading-snug mb-2">
                    Siap mengelola layanan PasCall?
                  </h3>
                  <p className="text-[#475467] text-sm sm:text-base max-w-[500px] mb-3">
                    Masuk dengan akun admin Anda. Lupa password atau butuh bantuan? Hubungi tim dukungan.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#5b6472]">
                    <Mail className="w-3.5 h-3.5 text-[#2f6fed]" aria-hidden="true" />
                    <span>Email dukungan:</span>
                    <a href="mailto:cs@sadewa.id" className="font-semibold text-[#2f6fed] hover:underline lp-focus-ring">
                      cs@sadewa.id
                    </a>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    to="/login"
                    className="lp-focus-ring inline-flex items-center gap-2 px-7 py-3.5
                               rounded-full text-white font-bold text-sm sm:text-base shrink-0
                               bg-[#2f6fed] hover:bg-[#1a5fd4]
                               transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          FOOTER (Flat White Background with Subtle Top Border)
          ============================================================== */}
      <footer className="border-t border-gray-200/80 py-8 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5b6472]" style={{ maxWidth: '1080px' }}>
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span className="text-[#101828] font-extrabold text-sm tracking-tight flex items-center gap-1.5">
              <svg width="20" height="15" viewBox="0 0 32 24" fill="none" aria-hidden="true">
                <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#ftr-g-admin)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <defs>
                  <linearGradient id="ftr-g-admin" x1="0" y1="12" x2="32" y2="12">
                    <stop offset="0%" stopColor="#2f6fed"/>
                    <stop offset="100%" stopColor="#60a5fa"/>
                  </linearGradient>
                </defs>
              </svg>
              PasCall
            </span>
            <span className="text-[#98a2b3]">Sistem manajemen layanan komunikasi</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a href="#" className="hover:text-[#2f6fed] transition-colors lp-focus-ring">Syarat &amp; Ketentuan</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-[#2f6fed] transition-colors lp-focus-ring">Kebijakan Privasi</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-[#2f6fed] transition-colors lp-focus-ring">Bantuan</a>
            <span className="text-gray-300">|</span>
            <a href="mailto:cs@sadewa.id" className="hover:text-[#2f6fed] transition-colors lp-focus-ring inline-flex items-center gap-1">
              <Mail className="w-3 h-3" aria-hidden="true" />
              cs@sadewa.id
            </a>
          </div>
          <p className="text-[#98a2b3] text-center sm:text-right">© 2026 PasCall. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingAdmin;
