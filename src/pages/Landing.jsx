import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, Wallet, Clock, Shield, Mic, Monitor, IdCard, Download, Video, MessageSquare } from 'lucide-react';

/**
 * Link URL unduhan aplikasi PasCall (APK / Play Store).
 * Ubah nilai variabel ini jika link download sudah siap.
 */
const APP_LINK_URL = '#';

/**
 * ================================================================
 * PasCall Landing Page — Clean Flat & Gradient Cards Theme
 * ================================================================
 * Visual redesign based on reference pitch-deck styling:
 * - Flat alternating section background (#ffffff / #f0f6ff)
 * - Soft gradient cards for features (blue-indigo-purple)
 * - Pastel gradient cards for step timeline
 * - Full-gradient donut charts for radial stats
 * ================================================================
 */

// ──────────────────────────────────────────────────────────────────
// SQUIGGLE — clean crisp blue wave
// ──────────────────────────────────────────────────────────────────
function Squiggle({ className = '', width = 140, height = 32, id: idProp }) {
  const uid = idProp || `sq-${width}`;
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
// SHIELD LINE ART (refined for container block)
// ──────────────────────────────────────────────────────────────────
function ShieldArt() {
  return (
    <svg width="110" height="128" viewBox="0 0 120 140" fill="none" aria-hidden="true">
      <path d="M60 8 L106 24 L106 72 C106 100 84 122 60 130 C36 122 14 100 14 72 L14 24 Z" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="rgba(255,255,255,0.06)" />
      <path d="M60 20 L96 33 L96 72 C96 95 79 114 60 122 C41 114 24 95 24 72 L24 33 Z" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
      <rect x="43" y="68" width="34" height="26" rx="4" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="rgba(255,255,255,0.06)" />
      <path d="M48 68 L48 58 Q48 46 60 46 Q72 46 72 58 L72 68" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="78" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
      <line x1="60" y1="82" x2="60" y2="88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M90 22 L95 28 L105 16" stroke="rgba(134,239,172,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────
// DATA (Soft gradient feature cards following style_gradient_cards)
// ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Panggilan suara & video terjadwal',
    desc: 'Keluarga dapat memilih jadwal panggilan suara maupun video yang tersedia. Sistem akan otomatis mengingatkan waktunya agar tidak terlewat.',
    gradient: 'linear-gradient(145deg, #2563eb 0%, #4f46e5 100%)',
    shadowColor: 'rgba(37, 99, 235, 0.22)',
    icon: Phone,
  },
  {
    title: 'Sistem saldo/top-up mudah',
    desc: 'Isi saldo dilakukan oleh narapidana langsung melalui petugas kantin di dalam lapas. Saldo tersebut otomatis siap digunakan untuk panggilan tanpa proses tambahan.',
    gradient: 'linear-gradient(145deg, #1d4ed8 0%, #6366f1 100%)',
    shadowColor: 'rgba(29, 78, 216, 0.22)',
    icon: Wallet,
  },
  {
    title: 'Riwayat panggilan tercatat',
    desc: 'Setiap panggilan (waktu, durasi, dan kontak yang dihubungi) tersimpan rapi dalam sistem. Pihak yang berwenang dapat menelusuri kembali seluruh riwayat kapan saja secara transparan.',
    gradient: 'linear-gradient(145deg, #4338ca 0%, #7c3aed 100%)',
    shadowColor: 'rgba(67, 56, 202, 0.22)',
    icon: Clock,
  },
  {
    title: 'Kontak yang sudah terverifikasi',
    desc: 'Admin lapas memverifikasi setiap kontak keluarga melalui KTP sebelum dapat dihubungi. Hal ini memastikan hanya kontak sah dan terdaftar yang bisa terhubung dengan narapidana.',
    gradient: 'linear-gradient(145deg, #3b82f6 0%, #8b5cf6 100%)',
    shadowColor: 'rgba(59, 130, 246, 0.22)',
    icon: Shield,
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Daftar Akun',
    desc: 'Buat akun dengan nomor handphone.',
    Icon: IdCard,
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #eff6ff 100%)',
    borderColor: '#bfdbfe',
    accentColor: '#2f6fed',
    dotColor: '#2f6fed',
    iconBg: 'linear-gradient(135deg, #2f6fed, #60a5fa)',
  },
  {
    num: '02',
    title: 'Verifikasi Kontak',
    desc: 'Lakukan verifikasi kontak keluarga via KTP.',
    Icon: Shield,
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)',
    borderColor: '#e9d5ff',
    accentColor: '#8b5cf6',
    dotColor: '#8b5cf6',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
  },
  {
    num: '03',
    title: 'Top Up Saldo',
    desc: 'Isi saldo melalui petugas kantin di dalam lapas.',
    Icon: Wallet,
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 100%)',
    borderColor: '#fde68a',
    accentColor: '#f59e0b',
    dotColor: '#f59e0b',
    iconBg: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
  },
  {
    num: '04',
    title: 'Mulai Panggilan',
    desc: 'Pilih jadwal dan mulai panggilan sesuai waktu yang tersedia.',
    Icon: Phone,
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
    borderColor: '#bbf7d0',
    accentColor: '#22c55e',
    dotColor: '#22c55e',
    iconBg: 'linear-gradient(135deg, #22c55e, #86efac)',
  },
];

const SECURITY_ITEMS = [
  { label: 'Rekaman Panggilan',    desc: 'Semua panggilan direkam dan bisa diaudit.',       Icon: Mic,     bg: '#ef4444' },
  { label: 'Verifikasi KTP',       desc: 'Kontak diverifikasi via KTP.',                    Icon: IdCard,  bg: '#2f6fed' },
  { label: 'Monitoring Real-time', desc: 'Dashboard monitoring untuk admin.',               Icon: Monitor, bg: '#8b5cf6' },
  { label: 'Standar Keamanan',     desc: 'Sesuai standar lembaga pemasyarakatan.',          Icon: Shield,  bg: '#22c55e' },
];

const STATS = [
  {
    value: '100%',
    label: 'panggilan direkam',
    gradId: 'stat-grad-1',
    gradient: ['#2563eb', '#4f46e5'],
    glow: 'rgba(37, 99, 235, 0.18)',
  },
  {
    value: '8',
    label: 'cabang lapas',
    gradId: 'stat-grad-2',
    gradient: ['#1d4ed8', '#6366f1'],
    glow: 'rgba(29, 78, 216, 0.18)',
  },
  {
    value: '24/7',
    label: 'pusat bantuan',
    gradId: 'stat-grad-3',
    gradient: ['#4338ca', '#7c3aed'],
    glow: 'rgba(67, 56, 202, 0.18)',
  },
  {
    value: '3 menit',
    label: 'rata-rata verifikasi kontak',
    gradId: 'stat-grad-4',
    gradient: ['#3b82f6', '#8b5cf6'],
    glow: 'rgba(59, 130, 246, 0.18)',
  },
];

// ──────────────────────────────────────────────────────────────────
// RADIAL STAT CIRCLE — Full Gradient Donut Chart
// ──────────────────────────────────────────────────────────────────
function RadialStatCircle({ value, label, gradient, gradId, glow }) {
  const size = 150;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = 58;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center group transition-all duration-300 hover:scale-105">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Soft Ambient Glow */}
        <div
          className="absolute inset-2 rounded-full pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            filter: 'blur(16px)',
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative z-10 overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>

          {/* 1. Outer Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(219, 234, 254, 0.6)"
            strokeWidth={strokeWidth}
          />

          {/* 2. Full Donut Gradient Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={0}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ filter: `drop-shadow(0 3px 8px ${gradient[0]}35)` }}
          />

          {/* 3. Center White Disc */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 2}
            fill="#ffffff"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.04))' }}
          />
        </svg>

        {/* Center Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          {value.includes(' ') ? (
            <div className="text-center leading-tight">
              <span className="block text-2xl font-black text-[#101828] tracking-tight">
                {value.split(' ')[0]}
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5b6472] -mt-0.5">
                {value.split(' ')[1]}
              </span>
            </div>
          ) : (
            <span
              className={`font-black text-[#101828] tracking-tight ${
                value.length > 3 ? 'text-2xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {value}
            </span>
          )}
        </div>
      </div>

      {/* Label below circle */}
      <p className="mt-4 text-xs sm:text-sm font-semibold text-[#344054] text-center max-w-[145px] leading-snug group-hover:text-[#101828] transition-colors">
        {label}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// ANIMATED LETTER-BY-LETTER REVEAL (Calm & readable pacing)
// ──────────────────────────────────────────────────────────────────
function AnimatedLetterReveal({ text, startIndex = 0, letterDelay = 0.075, baseDelay = 1.0, className = '', letterClassName = '' }) {
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
function useScrollReveal(threshold = 0.15) {
  const [isVisible, setIsVisible] = React.useState(false);
  const domRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (domRef.current) observer.unobserve(domRef.current);
      }
    }, { threshold });

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold]);

  return [domRef, isVisible];
}

// ──────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const [sec2Ref, isSec2Visible] = useScrollReveal(0.18);
  const [sec6Ref, isSec6Visible] = useScrollReveal(0.15);

  const handleSmoothScroll = (e) => {
    e.preventDefault();
    document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="relative min-h-screen text-[#101828] antialiased overflow-x-hidden bg-white"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* ==============================================================
          HEADER (Slides down slowly from top)
          ============================================================== */}
      <header className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-5 flex items-center justify-between bg-white lp-header-animate">
        <a href="#" className="flex items-center gap-2 lp-focus-ring" aria-label="PasCall beranda">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true">
            <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#hdr-g)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <defs>
              <linearGradient id="hdr-g" x1="0" y1="12" x2="32" y2="12">
                <stop offset="0%" stopColor="#2f6fed"/>
                <stop offset="100%" stopColor="#60a5fa"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-extrabold tracking-tight text-[#101828]">PasCall</span>
        </a>
        <Link
          to="/login"
          className="lp-focus-ring px-6 py-2 rounded-full text-sm font-semibold text-white
                     bg-[#2f6fed] hover:bg-[#1a5fd4] transition-colors duration-200 shadow-md shadow-blue-500/20"
        >
          Login
        </Link>
      </header>

      {/* ==============================================================
          SECTION 1 — HERO (Flat White Background)
          ============================================================== */}
      <section
        id="hero"
        className="relative pt-6 sm:pt-10 lg:pt-14 pb-12 sm:pb-16 lg:pb-20 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white"
      >
        <div
          className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center"
          style={{ maxWidth: '1200px' }}
        >
          {/* Left Column */}
          <div className="lg:col-span-6">
            <h1 className="text-[clamp(2.4rem,5.2vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight text-left mb-5 text-[#101828]">
              <span className="block">
                <AnimatedLetterReveal text="Mendekatkan" startIndex={0} baseDelay={1.0} letterDelay={0.075} />
              </span>
              <span className="block">
                <AnimatedLetterReveal text="Hati," startIndex={12} baseDelay={1.0} letterDelay={0.075} />
              </span>
              <span className="block relative whitespace-nowrap">
                <AnimatedLetterReveal text="Tanpa Batas" startIndex={18} baseDelay={1.0} letterDelay={0.075} letterClassName="text-[#2f6fed]" />
                {/* Squiggle — blue wave below "Tanpa Batas" */}
                <span className="absolute top-full mt-3.5 left-0 lp-squiggle-animate" aria-hidden="true">
                  <Squiggle width={130} height={28} id="sq-hero" />
                </span>
              </span>
            </h1>

            <p className="lp-hero-swipe-left text-base sm:text-lg text-[#475467] leading-relaxed max-w-[480px] mt-10 sm:mt-12 mb-8">
              PasCall menghubungkan narapidana dengan keluarga melalui panggilan yang
              terverifikasi, tercatat, dan diawasi petugas.
            </p>

            {/* Hero CTAs (Fade & rise up after description & mockup) */}
            <div className="lp-hero-buttons-animate flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-4.5">
              {/* Primary CTA */}
              <a
                href={APP_LINK_URL}
                className="lp-focus-ring inline-flex items-center justify-center gap-2.5 px-7 py-3.5
                           rounded-full text-white font-bold text-sm
                           bg-[#2f6fed] hover:bg-[#1a5fd4]
                           transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Dapatkan PasCall
              </a>

              {/* Secondary CTA */}
              <a
                href="#cara-kerja"
                onClick={handleSmoothScroll}
                className="lp-focus-ring inline-flex items-center justify-center gap-2 px-6 py-3.5
                           rounded-full text-[#2f6fed] hover:text-[#1a5fd4] font-semibold text-sm
                           border border-[#2f6fed]/30 hover:border-[#2f6fed]/60 bg-blue-50/50 hover:bg-blue-50
                           transition-all duration-200"
              >
                Lihat cara kerja
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right — Mockup Image (Swipes in from right simultaneously with description) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end items-center lp-hero-swipe-right mt-4 lg:mt-0">
            <div className="relative w-full max-w-[310px] sm:max-w-[370px] lg:max-w-[440px] lg:translate-x-1">

              {/* 0. Nova Pro Style Radial Glow — Centered behind Mockup with rich vibrancy */}
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[540px] h-[480px] sm:h-[540px] rounded-full pointer-events-none -z-10"
                style={{
                  background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.75) 0%, rgba(139, 92, 246, 0.60) 25%, rgba(99, 102, 241, 0.42) 48%, rgba(59, 130, 246, 0.20) 68%, transparent 80%)',
                  filter: 'blur(38px)',
                }}
              />

              {/* 1. Soft Blur Blobs (CSS Blurs) */}
              <div
                aria-hidden="true"
                className="absolute -top-12 -right-8 w-[280px] h-[280px] rounded-full pointer-events-none -z-10"
                style={{
                  background: 'linear-gradient(135deg, #dbe9ff 0%, #eef4fd 100%)',
                  filter: 'blur(60px)',
                  opacity: 0.6,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-8 -left-8 w-[240px] h-[240px] rounded-full pointer-events-none -z-10"
                style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #e0effe 100%)',
                  filter: 'blur(60px)',
                  opacity: 0.5,
                }}
              />

              {/* 2. Dashed Circle Outlines (Higher Opacity & Vibrant Rings) */}
              <div
                aria-hidden="true"
                className="absolute -top-10 -right-8 w-[360px] sm:w-[430px] h-[360px] sm:h-[430px] rounded-full border-2 border-dashed border-[#60a5fa]/85 sm:border-[#3b82f6]/75 pointer-events-none -z-10"
              />
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[270px] sm:w-[310px] h-[270px] sm:h-[310px] rounded-full border-[1.5px] border-dashed border-[#818cf8]/70 pointer-events-none -z-10"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-4 -left-8 w-[230px] sm:w-[270px] h-[230px] sm:h-[270px] rounded-full border-[1.5px] border-dashed border-[#60a5fa]/65 pointer-events-none -z-10"
              />

              {/* 3. Small Accent Dots */}
              <div aria-hidden="true" className="absolute top-4 -left-3 w-2 h-2 rounded-full bg-[#2f6fed] opacity-70 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute -top-3 right-12 w-2.5 h-2.5 rounded-full bg-[#60a5fa] opacity-80 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute top-1/2 -left-6 w-1.5 h-1.5 rounded-full bg-[#93c5fd] opacity-90 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute bottom-20 -right-3 w-2 h-2 rounded-full bg-[#2f6fed] opacity-65 pointer-events-none -z-10" />
              <div aria-hidden="true" className="absolute -bottom-2 right-16 w-2.5 h-2.5 rounded-full bg-[#60a5fa] opacity-75 pointer-events-none -z-10" />

              {/* 4. Floating Communication Icon Badges */}
              {/* Phone Icon */}
              <div
                className="absolute -top-3 -left-3 sm:-top-4 sm:-left-5 z-20 p-2.5 sm:p-3 rounded-2xl bg-white border border-blue-100 shadow-[0_8px_20px_rgba(47,111,237,0.15)] flex items-center justify-center transition-transform duration-300 hover:scale-110"
                aria-hidden="true"
                title="Panggilan Suara"
              >
                <Phone size={18} className="text-[#2f6fed]" strokeWidth={2.2} />
              </div>

              {/* Video Call Icon */}
              <div
                className="absolute -top-4 right-8 sm:-top-5 sm:right-12 z-20 p-2.5 sm:p-3 rounded-2xl bg-white border border-indigo-100 shadow-[0_8px_20px_rgba(99,102,241,0.16)] flex items-center justify-center transition-transform duration-300 hover:scale-110"
                aria-hidden="true"
                title="Panggilan Video"
              >
                <Video size={18} className="text-[#6366f1]" strokeWidth={2.2} />
              </div>

              {/* Message Icon */}
              <div
                className="absolute top-[46%] -left-6 sm:-left-8 z-20 p-2.5 sm:p-3 rounded-2xl bg-white border border-sky-100 shadow-[0_8px_20px_rgba(2,132,199,0.15)] flex items-center justify-center transition-transform duration-300 hover:scale-110"
                aria-hidden="true"
                title="Pesan & Komunikasi"
              >
                <MessageSquare size={17} className="text-[#0284c7]" strokeWidth={2.2} />
              </div>

              {/* Voice / Mic Icon */}
              <div
                className="absolute bottom-10 -left-4 sm:bottom-12 sm:-left-6 z-20 p-2 sm:p-2.5 rounded-xl bg-white border border-amber-100 shadow-[0_6px_16px_rgba(245,158,11,0.14)] flex items-center justify-center transition-transform duration-300 hover:scale-110"
                aria-hidden="true"
                title="Audio Terpantau"
              >
                <Mic size={15} className="text-[#f59e0b]" strokeWidth={2.2} />
              </div>

              {/* Shield / Security Icon */}
              <div
                className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-4 z-20 p-2.5 sm:p-3 rounded-2xl bg-white border border-emerald-100 shadow-[0_8px_20px_rgba(34,197,94,0.15)] flex items-center justify-center transition-transform duration-300 hover:scale-110"
                aria-hidden="true"
                title="Terverifikasi & Aman"
              >
                <Shield size={18} className="text-[#22c55e]" strokeWidth={2.2} />
              </div>

              {/* 5. Mockup image */}
              <img
                src="/reference/mockup_pascall.png"
                alt="Mockup Aplikasi PasCall"
                className="relative z-10 w-full h-auto object-contain max-w-full block pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 2 — MASALAH YANG DISELESAIKAN (Seamless Gradient Background)
          ============================================================== */}
      <section
        ref={sec2Ref}
        className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f6ff 16%, #f0f6ff 84%, #ffffff 100%)',
        }}
      >
        <div
          className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          style={{ maxWidth: '1080px' }}
        >
          {/* Left Column — Swipes in from Left on Scroll */}
          <div className={`flex flex-col justify-center lp-reveal-left ${isSec2Visible ? 'lp-reveal-active' : ''}`}>
            {/* Eyebrow label */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-[2px] bg-gradient-to-r from-[#2f6fed] to-[#60a5fa] rounded-full" />
              <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#2f6fed]">
                Masalah Yang Diselesaikan
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-[2.3rem] font-extrabold leading-[1.22] text-left text-[#101828] mb-5">
              Komunikasi terbatas,<br />
              <span className="relative inline-block mt-1">
                <span className="text-[#2f6fed]">
                  berdampak besar.
                </span>
                <span className="absolute -bottom-2.5 left-0 w-full overflow-hidden h-3 pointer-events-none" aria-hidden="true">
                  <Squiggle width={110} height={18} id="sq-sec2" />
                </span>
              </span>
            </h2>

            {/* Paragraph */}
            <p className="text-[#475467] text-sm sm:text-base leading-relaxed max-w-[470px] mb-8">
              Selama ini komunikasi narapidana dengan keluarga terbatas dan sulit diawasi.
              PasCall hadir sebagai solusi yang terjamin, aman, dan mudah diakses.
            </p>

            {/* Mini Stats Cards */}
            <div className="pt-6 border-t border-blue-200/60 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border border-blue-100/80 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="w-[3px] h-9 rounded-full bg-gradient-to-b from-[#2f6fed] to-[#60a5fa] shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#101828] font-mono leading-none">
                    85%
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-[#5b6472] font-medium leading-tight mt-1">
                    kendala jadwal kunjungan
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border border-blue-100/80 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="w-[3px] h-9 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#c4b5fd] shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#101828] font-mono leading-none">
                    1x/mgg
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-[#5b6472] font-medium leading-tight mt-1">
                    rata-rata batas kunjungan
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border border-blue-100/80 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="w-[3px] h-9 rounded-full bg-gradient-to-b from-[#f59e0b] to-[#fcd34d] shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#101828] font-mono leading-none">
                    100%
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-[#5b6472] font-medium leading-tight mt-1">
                    pengawasan terjamin
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Layered Collage — Swipes in from Right on Scroll */}
          <div className={`relative w-full pt-4 pb-6 px-2 sm:px-4 lp-reveal-right ${isSec2Visible ? 'lp-reveal-active' : ''}`}>
            {/* Collage Grid */}
            <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-4 items-start">
              {/* Box 1 — Lapas Building */}
              <div
                className="col-span-7 relative group overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.01] border-2 border-white bg-white"
                style={{
                  borderRadius: '24px 8px 20px 24px',
                  aspectRatio: '4/3',
                }}
              >
                {/* Corner Brackets */}
                <svg className="absolute top-2.5 left-2.5 w-9 h-9 pointer-events-none z-20" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <path d="M 3 14 L 3 3 L 14 3" stroke="url(#lapas-brk-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="lapas-brk-1" x1="0" y1="0" x2="36" y2="36">
                      <stop offset="0%" stopColor="#2f6fed" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>

                <img
                  src="/assets/lapas.jpg"
                  alt="Gedung Lembaga Pemasyarakatan"
                  className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2.5 left-3 text-[10px] font-extrabold uppercase tracking-widest text-white z-20 bg-[#2f6fed]/85 px-2 py-0.5 rounded backdrop-blur-sm">
                  Fasilitas Lapas
                </span>
              </div>

              {/* Box 2 — Family Call Photo */}
              <div
                className="col-span-5 relative group overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.03] -ml-4 sm:-ml-6 mt-3 sm:mt-4 z-20 transform rotate-[2.5deg] border-2 border-white bg-white"
                style={{
                  borderRadius: '12px 24px 14px 24px',
                  aspectRatio: '1/1',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src="/assets/family_call.jpg"
                  alt="Keluarga melakukan panggilan video"
                  className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/15 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Box 3 — Security Connection */}
              <div
                className="col-span-5 relative group overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.01] -mt-3 sm:-mt-4 z-10 transform -rotate-[1.5deg] border-2 border-white bg-white"
                style={{
                  borderRadius: '24px 10px 24px 12px',
                  aspectRatio: '1/1',
                }}
              >
                <img
                  src="/assets/security_connection.jpg"
                  alt="Jaringan komunikasi aman PasCall"
                  className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/15 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Box 4 — Standar Lapas Card */}
              <div
                className="col-span-7 relative group overflow-hidden shadow-lg p-4 sm:p-5 flex flex-col justify-between min-h-[145px] -mt-2 sm:-mt-3 z-10 border border-blue-100/80 bg-white"
                style={{
                  borderRadius: '10px 24px 12px 24px',
                }}
              >
                {/* Accent glow */}
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-blue-100/60 to-indigo-50/40 blur-xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#2f6fed]">
                    Standar Lapas
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                </div>

                <div className="relative z-10 mt-2 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-[#344054] leading-relaxed">
                    Sistem komunikasi terintegrasi dengan pemantauan real-time.
                  </p>
                </div>
              </div>
            </div>

            {/* Badge Card 1 */}
            <div className="absolute -top-3 right-0 sm:-top-4 sm:right-2 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-blue-100/80 shadow-md max-w-[250px] sm:max-w-[270px] transition-transform hover:scale-[1.02]">
              <div className="w-7 h-7 rounded-full bg-[#2f6fed] flex items-center justify-center shrink-0 shadow-sm">
                <Phone size={13} className="text-white" strokeWidth={2} />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-[#344054] leading-snug m-0">
                Jangkauan lebih dekat untuk keluarga.
              </p>
            </div>

            {/* Badge Card 2 */}
            <div className="absolute -bottom-3 left-1 sm:-bottom-4 sm:left-2 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-blue-100/80 shadow-md max-w-[230px] sm:max-w-[250px] transition-transform hover:scale-[1.02]">
              <div className="w-7 h-7 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0 shadow-sm">
                <Shield size={13} className="text-white" strokeWidth={2} />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-[#344054] leading-snug m-0">
                Aman, terverifikasi, dan tercatat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 3 — FITUR UTAMA (Flat White with Soft Gradient Cards)
          ============================================================== */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto" style={{ maxWidth: '1120px' }}>
          {/* Header */}
          <div className="mb-14 sm:mb-16 text-center max-w-[760px] mx-auto flex flex-col items-center">
            <div className="mb-3">
              <Squiggle width={110} height={24} id="sq-feat" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-extrabold leading-tight text-[#101828] mt-2">
              Komunikasi yang lebih mudah dan aman, untuk semua pihak.
            </h2>
          </div>

          {/* 4 Soft Gradient Feature Cards (following style_gradient_cards reference) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 text-white"
                  style={{
                    background: f.gradient,
                    boxShadow: `0 14px 32px -4px ${f.shadowColor}`,
                  }}
                >
                  {/* Subtle top inner light highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-3xl pointer-events-none" />

                  <div>
                    {/* Frosted Translucent Icon Box */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <Icon size={26} color="white" aria-hidden="true" strokeWidth={2} />
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-white mb-3 leading-snug">
                      {f.title}
                    </h3>
                  </div>

                  <p className="text-blue-50/90 text-xs sm:text-sm leading-relaxed mt-2 font-normal">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 4 — KEAMANAN (Gradient Block Container)
          ============================================================== */}
      <section className="relative py-12 sm:py-16 lg:py-20 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto" style={{ maxWidth: '1080px' }}>
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-8 sm:p-10 lg:p-12 relative overflow-hidden text-white"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%)',
              borderRadius: '32px 8px 32px 8px',
              boxShadow: '0 16px 40px -10px rgba(37, 99, 235, 0.35)',
            }}
          >
            {/* Wavy texture */}
            <svg aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '50%', opacity: 0.06 }} viewBox="0 0 200 300" fill="none" preserveAspectRatio="none">
              {[0,30,60,90,120,150,180,210,240,270].map((y, i) => (
                <path key={i} d={`M${i%2===0?0:200} ${y} Q 100 ${y+14} ${i%2===0?200:0} ${y+28}`} stroke="#ffffff" strokeWidth="1" fill="none" />
              ))}
            </svg>

            {/* Shield decoration */}
            <div aria-hidden="true" style={{ position: 'absolute', bottom: -20, right: 20, opacity: 0.2, pointerEvents: 'none' }}>
              <ShieldArt />
            </div>

            {/* Left */}
            <div className="lg:col-span-5 relative z-10 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold leading-tight text-white">
                Transparan untuk institusi,<br />terpercaya untuk semua.
              </h2>
              <div className="w-20 h-[3px] bg-gradient-to-r from-blue-300 to-indigo-200 rounded-full mt-4" />
            </div>

            {/* Right — 2x2 Grid with Translucent Cards */}
            <div className="lg:col-span-7 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5 items-center">
              {SECURITY_ITEMS.map((item) => {
                const Icon = item.Icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 transition-all shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-snug">
                        {item.label}
                      </h3>
                      <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-md relative z-10"
                      style={{
                        background: item.bg,
                        boxShadow: `0 6px 16px ${item.bg}40`,
                      }}
                    >
                      <Icon size={26} color="white" aria-hidden="true" strokeWidth={1.8} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 5 — CARA KERJA (Flat White Background)
          ============================================================== */}
      <section
        id="cara-kerja"
        className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white"
      >
        <div className="mx-auto" style={{ maxWidth: '1080px' }}>
          {/* Header */}
          <div className="text-center max-w-[600px] mx-auto mb-12 lg:mb-16 relative">
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-tight text-[#101828] mb-3">
              Mudah dalam 4 langkah.
            </h2>
            <div className="mt-3 flex justify-center">
              <Squiggle width={120} height={26} id="sq-steps" />
            </div>
          </div>

          {/* DESKTOP: Zig-Zag Timeline with Pastel Cards */}
          <div className="relative hidden lg:block" style={{ height: '460px' }}>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 1080 460"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="elbow-path-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2f6fed" />
                  <stop offset="33%" stopColor="#8b5cf6" />
                  <stop offset="66%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>

              <line x1="135" y1="260" x2="135" y2="275" stroke="url(#elbow-path-grad)" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.4" />
              <line x1="405" y1="200" x2="405" y2="185" stroke="url(#elbow-path-grad)" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.4" />
              <line x1="675" y1="260" x2="675" y2="275" stroke="url(#elbow-path-grad)" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.4" />
              <line x1="945" y1="200" x2="945" y2="185" stroke="url(#elbow-path-grad)" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.4" />

              <path
                d="M 135 260 L 135 242 Q 135 230, 147 230 L 393 230 Q 405 230, 405 218 L 405 200 L 405 218 Q 405 230, 417 230 L 663 230 Q 675 230, 675 242 L 675 260 L 675 242 Q 675 230, 687 230 L 933 230 Q 945 230, 945 218 L 945 200"
                stroke="url(#elbow-path-grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dot 1 */}
              <circle cx="135" cy="260" r="12" fill="#2f6fed" opacity="0.12" />
              <circle cx="135" cy="260" r="5.5" fill="#2f6fed" />
              <circle cx="135" cy="260" r="2" fill="#ffffff" />

              {/* Dot 2 */}
              <circle cx="405" cy="200" r="12" fill="#8b5cf6" opacity="0.12" />
              <circle cx="405" cy="200" r="5.5" fill="#8b5cf6" />
              <circle cx="405" cy="200" r="2" fill="#ffffff" />

              {/* Dot 3 */}
              <circle cx="675" cy="260" r="12" fill="#f59e0b" opacity="0.12" />
              <circle cx="675" cy="260" r="5.5" fill="#f59e0b" />
              <circle cx="675" cy="260" r="2" fill="#ffffff" />

              {/* Dot 4 */}
              <circle cx="945" cy="200" r="12" fill="#22c55e" opacity="0.12" />
              <circle cx="945" cy="200" r="5.5" fill="#22c55e" />
              <circle cx="945" cy="200" r="2" fill="#ffffff" />
            </svg>

            {/* 4 Step Cards */}
            <div className="grid grid-cols-4 gap-6 h-full relative z-10">
              {STEPS.map((s, i) => {
                const Icon = s.Icon;
                const isTop = i % 2 === 1;

                return (
                  <div
                    key={s.num}
                    className={`relative flex flex-col ${
                      isTop ? 'justify-start pt-[10px]' : 'justify-end pb-[10px]'
                    }`}
                  >
                    <div
                      className="group p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full max-w-[235px] h-[175px] mx-auto flex flex-col justify-between"
                      style={{
                        background: s.cardBg,
                        border: `1px solid ${s.borderColor}`,
                        borderLeft: `3.5px solid ${s.dotColor}`,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm mb-2.5 transition-transform duration-300 group-hover:scale-110"
                          style={{ background: s.iconBg }}
                        >
                          <Icon size={18} color="white" aria-hidden="true" strokeWidth={2} />
                        </div>

                        <span
                          className="text-[10px] font-extrabold tracking-[0.18em] uppercase block mb-1"
                          style={{ color: s.accentColor }}
                        >
                          LANGKAH {s.num}
                        </span>

                        <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-snug">
                          {s.title}
                        </h3>
                      </div>

                      <p className="text-[#5b6472] text-xs leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE: Vertical Timeline */}
          <div className="block lg:hidden relative pl-4 sm:pl-6">
            <div
              aria-hidden="true"
              className="absolute left-7 sm:left-9 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#2f6fed] via-[#8b5cf6] to-[#22c55e] rounded-full pointer-events-none"
            />

            <div className="space-y-6 relative z-10">
              {STEPS.map((s) => {
                const Icon = s.Icon;
                return (
                  <div key={s.num} className="flex items-start gap-4 sm:gap-6">
                    <div className="relative mt-5 flex items-center justify-center shrink-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full relative z-10 shadow-sm"
                        style={{ background: s.dotColor }}
                      />
                      <div
                        className="absolute w-7 h-7 rounded-full opacity-20 blur-[2px]"
                        style={{ background: s.dotColor }}
                      />
                    </div>

                    <div
                      className="flex-1 p-5 rounded-2xl shadow-sm transition-all"
                      style={{
                        background: s.cardBg,
                        border: `1px solid ${s.borderColor}`,
                        borderLeft: `3px solid ${s.dotColor}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm mb-2.5"
                        style={{ background: s.iconBg }}
                      >
                        <Icon size={18} color="white" aria-hidden="true" strokeWidth={2} />
                      </div>

                      <span
                        className="text-[10px] font-extrabold tracking-[0.18em] uppercase block mb-1"
                        style={{ color: s.accentColor }}
                      >
                        LANGKAH {s.num}
                      </span>

                      <h3 className="text-sm sm:text-base font-extrabold text-[#101828] mb-1 leading-snug">
                        {s.title}
                      </h3>

                      <p className="text-[#5b6472] text-xs sm:text-sm leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 6 — STATISTIK RADIAL & CTA PENUTUP (Seamless Gradient Background)
          ============================================================== */}
      <section
        ref={sec6Ref}
        className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f6ff 16%, #f0f6ff 84%, #ffffff 100%)',
        }}
      >
        <div
          className={`mx-auto transition-all duration-1000 ${isSec6Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ maxWidth: '1080px' }}
        >

          {/* Radial Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 justify-items-center items-start mb-14 sm:mb-18">
            {STATS.map((stat) => (
              <RadialStatCircle key={stat.label} {...stat} />
            ))}
          </div>

          {/* CTA Block */}
          <div className="flex justify-center">
            <div
              className="w-full max-w-[840px] px-7 sm:px-10 py-6 sm:py-8 rounded-3xl relative overflow-hidden border border-blue-100 bg-white shadow-xl shadow-blue-900/5 transition-all hover:shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#101828] leading-snug mb-2">
                    PasCall, kini hadir untuk keluarga Anda.
                  </h3>
                  <p className="text-[#475467] text-xs sm:text-sm max-w-[480px]">
                    Unduh aplikasi PasCall sekarang dan mulai terhubung dengan keluarga tercinta.
                  </p>
                </div>
                <a
                  href={APP_LINK_URL}
                  className="lp-focus-ring inline-flex items-center gap-2 px-6 py-3.5
                             rounded-full text-white font-bold text-xs sm:text-sm shrink-0
                             bg-[#2f6fed] hover:bg-[#1a5fd4]
                             transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Dapatkan PasCall
                </a>
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
                <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#ftr-g)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <defs>
                  <linearGradient id="ftr-g" x1="0" y1="12" x2="32" y2="12">
                    <stop offset="0%" stopColor="#2f6fed"/>
                    <stop offset="100%" stopColor="#60a5fa"/>
                  </linearGradient>
                </defs>
              </svg>
              PasCall
            </span>
            <span className="text-[#98a2b3]">Program komunikasi terverifikasi</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a href="#" className="hover:text-[#2f6fed] transition-colors lp-focus-ring">Syarat &amp; Ketentuan</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-[#2f6fed] transition-colors lp-focus-ring">Kebijakan Privasi</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-[#2f6fed] transition-colors lp-focus-ring">Bantuan</a>
            <span className="text-gray-300">|</span>
            <a href="mailto:cs@pascall.id" className="hover:text-[#2f6fed] transition-colors lp-focus-ring inline-flex items-center gap-1">
              <Mail className="w-3 h-3" aria-hidden="true" />
              cs@pascall.id
            </a>
          </div>
          <p className="text-[#98a2b3] text-center sm:text-right">© 2026 PasCall. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
