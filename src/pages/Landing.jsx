import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Mail, Phone, Wallet, Clock, Shield, Mic, Monitor, IdCard, Download, Video, MessageSquare } from 'lucide-react';
import mockupPascall from '../assets/mockup_pascall.png';
import warmConnectionImg from '../assets/warm_connection.jpg';
import lapasImg from '../assets/lapas.jpg';
import familyCallImg from '../assets/family_call.jpg';
import securityConnectionImg from '../assets/security_connection.jpg';

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
// DATA (Reference Card Layout with Overlapping Circular Icons & Gradient Fills)
// ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Panggilan Suara & Video',
    desc: 'Keluarga dapat memilih jadwal panggilan suara maupun video yang tersedia. Sistem otomatis mengingatkan waktu agar tidak terlewat.',
    cardGradient: 'linear-gradient(150deg, #2563eb 0%, #3b82f6 45%, #6366f1 100%)',
    shadowColor: 'rgba(37, 99, 235, 0.32)',
    bracketColor: '#2563eb',
    icon: Phone,
  },
  {
    title: 'Sistem Saldo Praktis',
    desc: 'Isi saldo dilakukan resmi melalui petugas kantin di lapas. Saldo otomatis siap digunakan untuk panggilan tanpa prosedur rumit.',
    cardGradient: 'linear-gradient(150deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%)',
    shadowColor: 'rgba(99, 102, 241, 0.32)',
    bracketColor: '#6366f1',
    icon: Wallet,
  },
  {
    title: 'Riwayat Panggilan Tertata',
    desc: 'Setiap panggilan (waktu, durasi, dan kontak) tersimpan rapi dalam sistem secara transparan untuk pengawasan dan kenyamanan bersama.',
    cardGradient: 'linear-gradient(150deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
    shadowColor: 'rgba(2, 132, 199, 0.32)',
    bracketColor: '#0284c7',
    icon: Clock,
  },
  {
    title: 'Kontak Terverifikasi Sah',
    desc: 'Admin memverifikasi setiap kontak keluarga melalui KTP resmi untuk memastikan hanya pihak keluarga sah yang terhubung.',
    cardGradient: 'linear-gradient(150deg, #4338ca 0%, #7c3aed 50%, #9333ea 100%)',
    shadowColor: 'rgba(124, 58, 237, 0.32)',
    bracketColor: '#7c3aed',
    icon: Shield,
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Daftar Akun',
    desc: 'Buat akun dengan nomor handphone.',
    Icon: IdCard,
    cardBg: 'linear-gradient(145deg, #f0f7ff 0%, #dbeafe 100%)',
    borderColor: '#93c5fd',
    accentColor: '#1d4ed8',
    dotColor: '#2563eb',
    iconBg: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    shadowColor: 'rgba(37, 99, 235, 0.14)',
  },
  {
    num: '02',
    title: 'Verifikasi Kontak',
    desc: 'Lakukan verifikasi kontak keluarga via KTP.',
    Icon: Shield,
    cardBg: 'linear-gradient(145deg, #faf5ff 0%, #ede9fe 100%)',
    borderColor: '#c4b5fd',
    accentColor: '#6d28d9',
    dotColor: '#7c3aed',
    iconBg: 'linear-gradient(135deg, #7c3aed, #c084fc)',
    shadowColor: 'rgba(124, 58, 237, 0.14)',
  },
  {
    num: '03',
    title: 'Top Up Saldo',
    desc: 'Isi saldo melalui petugas kantin di dalam lapas.',
    Icon: Wallet,
    cardBg: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
    borderColor: '#fcd34d',
    accentColor: '#b45309',
    dotColor: '#d97706',
    iconBg: 'linear-gradient(135deg, #d97706, #fbbf24)',
    shadowColor: 'rgba(217, 119, 6, 0.14)',
  },
  {
    num: '04',
    title: 'Mulai Panggilan',
    desc: 'Pilih jadwal dan mulai panggilan sesuai waktu yang tersedia.',
    Icon: Phone,
    cardBg: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
    borderColor: '#86efac',
    accentColor: '#15803d',
    dotColor: '#16a34a',
    iconBg: 'linear-gradient(135deg, #16a34a, #4ade80)',
    shadowColor: 'rgba(22, 163, 74, 0.14)',
  },
];

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
    desc: 'Sesuai standar lembaga pemasyarakatan.',
    Icon: Shield,
    gradient: 'linear-gradient(135deg, #0d9488 0%, #0284c7 50%, #2563eb 100%)',
    shadowColor: 'rgba(13, 148, 136, 0.22)',
  },
];

const STATS = [
  {
    value: '100%',
    label: 'panggilan direkam',
    gradId: 'dial-grad-1',
    gradient: ['#2563eb', '#3b82f6', '#4f46e5'],
    glow: 'rgba(37, 99, 235, 0.35)',
    tickGlow: '#3b82f6',
  },
  {
    value: '8',
    label: 'cabang lapas',
    gradId: 'dial-grad-2',
    gradient: ['#1d4ed8', '#4f46e5', '#7c3aed'],
    glow: 'rgba(79, 70, 229, 0.35)',
    tickGlow: '#6366f1',
  },
  {
    value: '24/7',
    label: 'pusat bantuan',
    gradId: 'dial-grad-3',
    gradient: ['#4338ca', '#6366f1', '#8b5cf6'],
    glow: 'rgba(99, 102, 241, 0.35)',
    tickGlow: '#8b5cf6',
  },
  {
    value: '3 menit',
    label: 'rata-rata verifikasi kontak',
    gradId: 'dial-grad-4',
    gradient: ['#0284c7', '#2563eb', '#6366f1'],
    glow: 'rgba(2, 132, 199, 0.35)',
    tickGlow: '#0ea5e9',
  },
];

// Pre-generate 48 radial tick mark angles
const DIAL_TICKS = Array.from({ length: 48 }, (_, i) => (i * 360) / 48);

// ──────────────────────────────────────────────────────────────────
// SEGMENTED DIAL STAT CIRCLE — Radial Ticks + Synchronized Progress Arc
// ──────────────────────────────────────────────────────────────────
function SegmentedDialCircle({ value, label, gradient, gradId, glow, tickGlow, isVisible, delay = 0 }) {
  const size = 176;
  const center = size / 2;
  const outerRadius = 78;
  const circ = 2 * Math.PI * outerRadius; // ~490.08

  // Numerical extraction for synchronous counter
  const numericMatch = value.match(/^(\d+)(.*)$/);
  const isNumericOnly = numericMatch && !value.includes('/') && !value.includes(' ');
  const targetNum = isNumericOnly ? parseInt(numericMatch[1], 10) : 0;
  const suffix = isNumericOnly ? numericMatch[2] : '';

  // Synchronized animation states
  const [isDialRevealed, setIsDialRevealed] = React.useState(false);
  const [arcProgress, setArcProgress] = React.useState(0); // 0 to 1
  const [displayCount, setDisplayCount] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);

  React.useEffect(() => {
    if (!isVisible) return;

    let animFrameId = null;
    let arcTimeoutId = null;

    // TAHAP 1: Dial base & white inner circle appear statically
    const revealTimeoutId = setTimeout(() => {
      setIsDialRevealed(true);
    }, delay);

    // TAHAP 2 & 3: Progress arc fills and number counts up in 100% synchronous lockstep
    arcTimeoutId = setTimeout(() => {
      const duration = 1400; // ms
      let startTime = null;

      const step = (now) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: smooth cubic ease-out
        const eased = 1 - Math.pow(1 - progress, 3);

        setArcProgress(eased);
        if (isNumericOnly) {
          setDisplayCount(Math.round(eased * targetNum));
        }

        if (progress < 1) {
          animFrameId = requestAnimationFrame(step);
        } else {
          setIsCompleted(true);
        }
      };

      animFrameId = requestAnimationFrame(step);
    }, delay + 350);

    return () => {
      clearTimeout(revealTimeoutId);
      clearTimeout(arcTimeoutId);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isVisible, delay, isNumericOnly, targetNum]);

  const currentDashoffset = circ * (1 - arcProgress);
  const activeTickCount = Math.round(arcProgress * DIAL_TICKS.length);

  return (
    <div
      className="flex flex-col items-center group transition-all duration-300 hover:scale-105"
      style={{
        opacity: isDialRevealed ? 1 : 0,
        transform: isDialRevealed ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Soft Ambient Radial Glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            filter: 'blur(22px)',
            opacity: arcProgress > 0.05 ? 0.9 : 0,
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
              <stop offset="50%" stopColor={gradient[1] || gradient[0]} />
              <stop offset="100%" stopColor={gradient[gradient.length - 1]} />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={gradient[0]} floodOpacity="0.45" />
            </filter>
          </defs>

          {/* 1. LAYER: 48 Radial Dial Tick Marks (Inactive Base + Active Illuminated) */}
          <g>
            {DIAL_TICKS.map((angle, idx) => {
              const isActive = idx < activeTickCount;
              return (
                <line
                  key={idx}
                  x1={center}
                  y1={center - 70}
                  x2={center}
                  y2={center - 60}
                  stroke={isActive ? tickGlow : 'rgba(203, 213, 225, 0.75)'}
                  strokeWidth={isActive ? 2.4 : 1.6}
                  strokeLinecap="round"
                  transform={`rotate(${angle} ${center} ${center})`}
                  style={{
                    transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
                  }}
                />
              );
            })}
          </g>

          {/* 2. LAYER: Inner Concentric Guide Ring */}
          <circle
            cx={center}
            cy={center}
            r={54}
            fill="none"
            stroke="rgba(226, 232, 240, 0.9)"
            strokeWidth={1.5}
          />

          {/* 3. LAYER: Outer Smooth Base Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="rgba(226, 232, 240, 0.65)"
            strokeWidth={5}
          />

          {/* 4. LAYER: Active Animated Glowing Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={currentDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{
              filter: `url(#glow-${gradId})`,
            }}
          />

          {/* 5. LAYER: Floating White Center Disc with Depth Elevation */}
          <circle
            cx={center}
            cy={center}
            r={46}
            fill="#ffffff"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.04))',
            }}
          />
        </svg>

        {/* 6. LAYER: Synchronized Center Number Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none">
          {isNumericOnly ? (
            <span className="font-black text-[1.9rem] sm:text-3xl text-[#101828] tracking-tight">
              {displayCount}{suffix}
            </span>
          ) : value.includes(' ') ? (
            <div
              className="text-center leading-tight transition-all duration-500"
              style={{
                opacity: isCompleted ? 1 : 0.2,
                transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
              }}
            >
              <span className="block text-[1.85rem] sm:text-3xl font-black text-[#101828] tracking-tight">
                {value.split(' ')[0]}
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#475467] -mt-0.5">
                {value.split(' ')[1]}
              </span>
            </div>
          ) : (
            <span
              className="font-black text-[1.75rem] sm:text-3xl text-[#101828] tracking-tight transition-all duration-500"
              style={{
                opacity: isCompleted ? 1 : 0.2,
                transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
              }}
            >
              {value}
            </span>
          )}
        </div>
      </div>

      {/* Label below dial */}
      <p className="mt-4 text-xs sm:text-sm font-semibold text-[#475467] text-center max-w-[150px] leading-snug group-hover:text-[#101828] transition-colors">
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
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const [sec2Ref, isSec2Visible] = useScrollReveal(0.15, '0px 0px -120px 0px');
  const [sec3Ref, isSec3Visible] = useScrollReveal(0.32, '0px 0px -25% 0px');
  const [sec4Ref, isSec4Visible] = useScrollReveal(0.32, '0px 0px -25% 0px');
  const [sec5Ref, isSec5Visible] = useScrollReveal(0.2, '0px 0px -80px 0px');
  const [sec6Ref, isSec6Visible] = useScrollReveal(0.32, '0px 0px -20% 0px');

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
        <a href="#" className="flex items-center gap-2 lp-focus-ring" aria-label="Sadewa beranda">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true">
            <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#hdr-g)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <defs>
              <linearGradient id="hdr-g" x1="0" y1="12" x2="32" y2="12">
                <stop offset="0%" stopColor="#2f6fed"/>
                <stop offset="100%" stopColor="#60a5fa"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-extrabold tracking-tight text-[#101828]">Sadewa</span>
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
              Sadewa menjaga komunikasi Anda dengan orang tercinta tetap aman, terverifikasi, dan tercatat, di mana pun mereka berada.
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
                Dapatkan Sadewa
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
                  background: 'linear-gradient(135deg, #dbe9ff 0%, #dbe9fc 100%)',
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

              {/* 2. Dashed Circle Outlines (Animated Walking / Rotating Rings) */}
              <div
                aria-hidden="true"
                className="absolute -top-10 -right-8 w-[360px] sm:w-[430px] h-[360px] sm:h-[430px] rounded-full border-2 border-dashed border-[#60a5fa]/85 sm:border-[#3b82f6]/75 pointer-events-none -z-10 lp-dash-spin-1"
              />
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 w-[270px] sm:w-[310px] h-[270px] sm:h-[310px] rounded-full border-[1.5px] border-dashed border-[#818cf8]/70 pointer-events-none -z-10 lp-dash-spin-2"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-4 -left-8 w-[230px] sm:w-[270px] h-[230px] sm:h-[270px] rounded-full border-[1.5px] border-dashed border-[#60a5fa]/65 pointer-events-none -z-10 lp-dash-spin-3"
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
                src={mockupPascall}
                alt="Mockup Aplikasi Sadewa"
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
        className="relative pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-18 lg:pb-14 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dbe9fc 12%, #dbe9fc 88%, #ffffff 100%)',
        }}
      >
        <div
          className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
          style={{ maxWidth: '1100px' }}
        >
          {/* Left Column — 2x2 Custom Curved Image Collage (Swipes in from Left on Scroll) */}
          <div className={`lg:col-span-6 relative w-full lp-reveal-left ${isSec2Visible ? 'lp-reveal-active' : ''}`}>
            <div className="relative p-2.5 sm:p-4 max-w-[480px] mx-auto">
              {/* Outer Top-Left Blue Contour Ribbon Accent */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 w-24 sm:w-32 h-24 sm:h-32 rounded-tl-[44px] sm:rounded-tl-[54px] border-t-[7px] border-l-[7px] sm:border-t-[9px] sm:border-l-[9px] border-[#2f6fed] -z-0 pointer-events-none"
              />

              {/* Outer Bottom-Right Dark Navy Contour Ribbon Accent */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-24 sm:w-32 h-24 sm:h-32 rounded-br-[44px] sm:rounded-br-[54px] border-b-[7px] border-r-[7px] sm:border-b-[9px] sm:border-r-[9px] border-[#0f172a] -z-0 pointer-events-none"
              />

              {/* 2x2 Image Grid */}
              <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 items-center">
                {/* 1. Top-Left Image: Warm Connection */}
                <div
                  className="relative group overflow-hidden bg-white shadow-md transition-all duration-300 hover:scale-[1.02] border-2 border-white"
                  style={{
                    borderRadius: '34px 12px 12px 12px',
                    aspectRatio: '1/1',
                  }}
                >
                  <img
                    src={warmConnectionImg}
                    alt="Komunikasi hangat dan bermakna bersama orang tercinta"
                    className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* 2. Top-Right Image: Modern Lapas Facility */}
                <div
                  className="relative group overflow-hidden bg-white shadow-md transition-all duration-300 hover:scale-[1.02] border-2 border-white"
                  style={{
                    borderRadius: '12px 16px 12px 12px',
                    aspectRatio: '1/1',
                  }}
                >
                  <img
                    src={lapasImg}
                    alt="Fasilitas institusi pemasyarakatan terintegrasi digital"
                    className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/15 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* 3. Bottom-Left Image: Family Video Call */}
                <div
                  className="relative group overflow-hidden bg-white shadow-md transition-all duration-300 hover:scale-[1.02] border-2 border-white"
                  style={{
                    borderRadius: '12px 12px 12px 16px',
                    aspectRatio: '1/1',
                  }}
                >
                  <img
                    src={familyCallImg}
                    alt="Keluarga bahagia terhubung lewat panggilan video"
                    className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/15 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* 4. Bottom-Right Image: Secure Encrypted Infrastructure */}
                <div
                  className="relative group overflow-hidden bg-white shadow-md transition-all duration-300 hover:scale-[1.02] border-2 border-white"
                  style={{
                    borderRadius: '12px 12px 34px 12px',
                    aspectRatio: '1/1',
                  }}
                >
                  <img
                    src={securityConnectionImg}
                    alt="Jaringan komunikasi aman dan terenkripsi"
                    className="w-full h-full object-cover brightness-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/15 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Center Seal Badge (Matching Reference Center Rosette Stamp) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center drop-shadow-[0_8px_20px_rgba(47,111,237,0.35)]">
                  {/* Scalloped Stamp Badge */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-[#2f6fed]" fill="currentColor">
                    <path d="M50 0 L58 10 L70 5 L75 17 L88 16 L89 29 L100 33 L97 45 L100 57 L91 63 L91 76 L78 78 L74 90 L61 88 L54 98 L44 94 L34 100 L28 89 L16 90 L14 78 L2 73 L5 61 L0 49 L7 39 L4 27 L16 24 L17 12 L29 14 L37 4 L47 8 Z" />
                  </svg>
                  {/* Inner White Ring & Arrow Icon */}
                  <div className="absolute w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center text-[#2f6fed] shadow-inner">
                    <ArrowUpRight size={18} className="stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* Modern Geometric Dot Grid Accent at Bottom Left */}
              <div
                aria-hidden="true"
                className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-5 z-20 pointer-events-none grid grid-cols-3 gap-1.5 p-1 bg-white/40 backdrop-blur-xs rounded-lg"
              >
                <div className="w-2 h-2 rounded-full bg-[#2f6fed] opacity-90" />
                <div className="w-2 h-2 rounded-full bg-[#60a5fa] opacity-60" />
                <div className="w-2 h-2 rounded-full bg-[#93c5fd] opacity-40" />
                <div className="w-2 h-2 rounded-full bg-[#60a5fa] opacity-60" />
                <div className="w-2 h-2 rounded-full bg-[#2f6fed] opacity-90" />
                <div className="w-2 h-2 rounded-full bg-[#60a5fa] opacity-50" />
                <div className="w-2 h-2 rounded-full bg-[#93c5fd] opacity-40" />
                <div className="w-2 h-2 rounded-full bg-[#60a5fa] opacity-50" />
                <div className="w-2 h-2 rounded-full bg-[#2f6fed] opacity-80" />
              </div>
            </div>
          </div>

          {/* Right Column — Typography, Narrative & Stats (Swipes in from Right on Scroll) */}
          <div className={`lg:col-span-6 flex flex-col justify-center lp-reveal-right ${isSec2Visible ? 'lp-reveal-active' : ''}`}>
            {/* Eyebrow Label with // prefix */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base sm:text-lg font-black text-[#2f6fed] font-mono leading-none select-none">
                //
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#475467]">
                Masalah Yang Diselesaikan
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold leading-[1.2] text-left text-[#101828] mb-4 tracking-tight">
              Komunikasi terbatas,<br />
              <span className="text-[#2f6fed]">berdampak besar.</span>
            </h2>

            {/* Narrative Paragraph */}
            <p className="text-[#475467] text-sm sm:text-base leading-relaxed max-w-[490px] mb-6">
              Keterbatasan waktu kunjungan fisik dan jarak tempuh seringkali menjadi kendala utama bagi keluarga. Sadewa hadir menjembatani kehangatan komunikasi dengan sistem yang aman, terverifikasi, dan mudah diakses.
            </p>

            {/* 3 Metric Columns with Dividers (Matching Reference) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-5 border-y border-blue-200/70 my-4 bg-white/60 backdrop-blur-sm rounded-xl px-3.5 sm:px-5">
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#2f6fed] tracking-tight leading-none">
                  85%
                </span>
                <span className="block text-[11px] sm:text-xs text-[#5b6472] font-semibold leading-tight mt-1.5">
                  Kendala Jarak & Waktu
                </span>
              </div>

              <div className="border-l border-blue-200/70 pl-3.5 sm:pl-5">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#2f6fed] tracking-tight leading-none">
                  1x/mgg
                </span>
                <span className="block text-[11px] sm:text-xs text-[#5b6472] font-semibold leading-tight mt-1.5">
                  Batas Tatap Muka
                </span>
              </div>

              <div className="border-l border-blue-200/70 pl-3.5 sm:pl-5">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#2f6fed] tracking-tight leading-none">
                  100%
                </span>
                <span className="block text-[11px] sm:text-xs text-[#5b6472] font-semibold leading-tight mt-1.5">
                  Terjamin Aman
                </span>
              </div>
            </div>

            {/* Signature / Official Verification Footer (Matching Reference) */}
            <div className="flex items-center gap-3.5 pt-2">
              <div className="w-10 h-10 rounded-full bg-blue-100/90 border border-blue-200 flex items-center justify-center text-[#2f6fed] shrink-0 shadow-sm">
                <Shield size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="block text-sm sm:text-base font-extrabold text-[#101828] tracking-tight font-serif italic">
                  Sadewa Indonesia
                </span>
                <span className="block text-[10px] sm:text-[11px] font-semibold text-[#64748b] tracking-wider uppercase">
                  Sistem Layanan Terpadu & Terintegrasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 3 — FITUR UTAMA (Flat White Background)
          ============================================================== */}
      <section
        ref={sec3Ref}
        className="relative pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20 lg:pb-24 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white"
      >
        <div className="mx-auto" style={{ maxWidth: '1120px' }}>
          {/* Header (Slides down from above with pure translateY + fade-in) */}
          <div
            className="mb-10 sm:mb-12 text-center max-w-[760px] mx-auto flex flex-col items-center"
            style={{
              opacity: isSec3Visible ? 1 : 0,
              transform: isSec3Visible ? 'translateY(0)' : 'translateY(-35px)',
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold leading-tight text-[#101828]">
              Komunikasi yang lebih mudah dan aman, untuk semua pihak.
            </h2>
          </div>

          {/* 4 Feature Cards Layout with Pure Slide-Down (translateY) Staggered Animation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 items-stretch pt-2">
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              const isEven = idx % 2 === 1; // Cards 2 and 4
              const staggerDelay = `${200 + idx * 220}ms`;

              return (
                <div
                  key={f.title}
                  className={`group relative flex flex-col items-center transition-all duration-300 ${
                    isEven ? 'lg:mt-7' : 'lg:-mt-2'
                  }`}
                  style={{
                    opacity: isSec3Visible ? 1 : 0,
                    transform: isSec3Visible ? 'translateY(0)' : 'translateY(-38px)',
                    transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: isSec3Visible ? staggerDelay : '0ms',
                    pointerEvents: isSec3Visible ? 'auto' : 'none',
                  }}
                >
                  {/* Top Circular Icon Badge (With Corner Framing Brackets for ALL 4 Cards) */}
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
          SECTION 4 — KEAMANAN (Light Blue Background with Gradient Cards)
          ============================================================== */}
      <section
        ref={sec4Ref}
        className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dbe9fc 12%, #dbe9fc 88%, #ffffff 100%)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1080px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Block (Slides in from Left as a unified block) */}
            <div
              className="lg:col-span-5 flex flex-col justify-center"
              style={{
                opacity: isSec4Visible ? 1 : 0,
                transform: isSec4Visible ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-[2px] bg-gradient-to-r from-[#2f6fed] to-[#60a5fa] rounded-full" />
                <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#2f6fed]">
                  Keamanan & Transparansi
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold leading-[1.22] text-[#101828]">
                Transparan untuk institusi,<br />
                <span className="text-[#2f6fed]">terpercaya untuk semua.</span>
              </h2>
              <div className="w-20 h-[3.5px] bg-gradient-to-r from-[#2f6fed] to-[#8b5cf6] rounded-full mt-4 mb-4" />
              <p className="text-[#475467] text-sm sm:text-base leading-relaxed max-w-[420px]">
                Seluruh aktivitas komunikasi diawasi dengan standar keamanan tinggi untuk menjamin integritas dan ketenangan setiap pihak.
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
                      opacity: isSec4Visible ? 1 : 0,
                      transform: isSec4Visible ? 'scale(1)' : 'scale(0.92)',
                      transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: isSec4Visible ? cardDelay : '0ms',
                      pointerEvents: isSec4Visible ? 'auto' : 'none',
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
          SECTION 5 — CARA KERJA (Progressive Traveling Line Animation)
          ============================================================== */}
      <section
        id="cara-kerja"
        ref={sec5Ref}
        className="relative py-12 sm:py-16 lg:py-20 px-6 sm:px-10 lg:px-16 xl:px-20 bg-white"
      >
        <div className="mx-auto" style={{ maxWidth: '1080px' }}>
          {/* Header */}
          <div className="text-center max-w-[700px] mx-auto mb-8 sm:mb-10 lg:mb-12 relative">
            {/* 1. Eyebrow: Slides down first */}
            <div
              className="flex items-center justify-center gap-2 mb-2"
              style={{
                opacity: isSec5Visible ? 1 : 0,
                transform: isSec5Visible ? 'translateY(0)' : 'translateY(-24px)',
                transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isSec5Visible ? '0ms' : '0ms',
              }}
            >
              <div className="w-5 h-[2px] bg-gradient-to-r from-[#2f6fed] to-[#60a5fa] rounded-full" />
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-[#2f6fed]">
                Alur Penggunaan Layanan
              </span>
              <div className="w-5 h-[2px] bg-gradient-to-r from-[#60a5fa] to-[#2f6fed] rounded-full" />
            </div>

            {/* 2. Main Title: Slides down after eyebrow */}
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold leading-tight text-[#101828]"
              style={{
                opacity: isSec5Visible ? 1 : 0,
                transform: isSec5Visible ? 'translateY(0)' : 'translateY(-28px)',
                transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isSec5Visible ? '280ms' : '0ms',
              }}
            >
              Prosedur Layanan dalam 4 Langkah Mudah
            </h2>
          </div>

          {/* DESKTOP: Zig-Zag Timeline with Traveling Path Animation */}
          <div className="relative hidden lg:block" style={{ height: '260px' }}>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 1080 260"
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

              {/* 0. Subtle Background Guide Track */}
              <path
                d="M 135 144 L 135 136 Q 135 130, 147 130 L 393 130 Q 405 130, 405 116 Q 405 130, 417 130 L 663 130 Q 675 130, 675 144 Q 675 130, 687 130 L 933 130 Q 945 130, 945 116"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                style={{
                  opacity: isSec5Visible ? 0.9 : 0,
                  transition: 'opacity 0.6s ease-out',
                  transitionDelay: isSec5Visible ? '500ms' : '0ms',
                }}
              />

              {/* 1. Progressive Line Segment 1 (Step 1 -> Step 2) */}
              <path
                d="M 135 144 L 135 136 Q 135 130, 147 130 L 393 130 Q 405 130, 405 116"
                stroke="url(#elbow-path-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="300"
                style={{
                  strokeDashoffset: isSec5Visible ? 0 : 300,
                  transition: 'stroke-dashoffset 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: isSec5Visible ? '1250ms' : '0ms',
                }}
              />

              {/* 2. Progressive Line Segment 2 (Step 2 -> Step 3) */}
              <path
                d="M 405 116 Q 405 130, 417 130 L 663 130 Q 675 130, 675 144"
                stroke="url(#elbow-path-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="300"
                style={{
                  strokeDashoffset: isSec5Visible ? 0 : 300,
                  transition: 'stroke-dashoffset 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: isSec5Visible ? '2450ms' : '0ms',
                }}
              />

              {/* 3. Progressive Line Segment 3 (Step 3 -> Step 4) */}
              <path
                d="M 675 144 Q 675 130, 687 130 L 933 130 Q 945 130, 945 116"
                stroke="url(#elbow-path-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="300"
                style={{
                  strokeDashoffset: isSec5Visible ? 0 : 300,
                  transition: 'stroke-dashoffset 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: isSec5Visible ? '3650ms' : '0ms',
                }}
              />

              {/* Dashed lines to cards synchronized with each step */}
              <line
                x1="135" y1="144" x2="135" y2="158"
                stroke="url(#elbow-path-grad)"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                style={{
                  opacity: isSec5Visible ? 0.4 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: isSec5Visible ? '700ms' : '0ms',
                }}
              />
              <line
                x1="405" y1="102" x2="405" y2="116"
                stroke="url(#elbow-path-grad)"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                style={{
                  opacity: isSec5Visible ? 0.4 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: isSec5Visible ? '1900ms' : '0ms',
                }}
              />
              <line
                x1="675" y1="144" x2="675" y2="158"
                stroke="url(#elbow-path-grad)"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                style={{
                  opacity: isSec5Visible ? 0.4 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: isSec5Visible ? '3100ms' : '0ms',
                }}
              />
              <line
                x1="945" y1="102" x2="945" y2="116"
                stroke="url(#elbow-path-grad)"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                style={{
                  opacity: isSec5Visible ? 0.4 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: isSec5Visible ? '4300ms' : '0ms',
                }}
              />

              {/* Dot 1 */}
              <g
                style={{
                  opacity: isSec5Visible ? 1 : 0,
                  transform: isSec5Visible ? 'scale(1)' : 'scale(0)',
                  transformOrigin: '135px 144px',
                  transition: 'opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: isSec5Visible ? '700ms' : '0ms',
                }}
              >
                <circle cx="135" cy="144" r="10" fill="#2f6fed" opacity="0.15" />
                <circle cx="135" cy="144" r="4.5" fill="#2f6fed" />
                <circle cx="135" cy="144" r="1.5" fill="#ffffff" />
              </g>

              {/* Dot 2 */}
              <g
                style={{
                  opacity: isSec5Visible ? 1 : 0,
                  transform: isSec5Visible ? 'scale(1)' : 'scale(0)',
                  transformOrigin: '405px 116px',
                  transition: 'opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: isSec5Visible ? '1900ms' : '0ms',
                }}
              >
                <circle cx="405" cy="116" r="10" fill="#8b5cf6" opacity="0.15" />
                <circle cx="405" cy="116" r="4.5" fill="#8b5cf6" />
                <circle cx="405" cy="116" r="1.5" fill="#ffffff" />
              </g>

              {/* Dot 3 */}
              <g
                style={{
                  opacity: isSec5Visible ? 1 : 0,
                  transform: isSec5Visible ? 'scale(1)' : 'scale(0)',
                  transformOrigin: '675px 144px',
                  transition: 'opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: isSec5Visible ? '3100ms' : '0ms',
                }}
              >
                <circle cx="675" cy="144" r="10" fill="#f59e0b" opacity="0.15" />
                <circle cx="675" cy="144" r="4.5" fill="#f59e0b" />
                <circle cx="675" cy="144" r="1.5" fill="#ffffff" />
              </g>

              {/* Dot 4 */}
              <g
                style={{
                  opacity: isSec5Visible ? 1 : 0,
                  transform: isSec5Visible ? 'scale(1)' : 'scale(0)',
                  transformOrigin: '945px 116px',
                  transition: 'opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: isSec5Visible ? '4300ms' : '0ms',
                }}
              >
                <circle cx="945" cy="116" r="10" fill="#22c55e" opacity="0.15" />
                <circle cx="945" cy="116" r="4.5" fill="#22c55e" />
                <circle cx="945" cy="116" r="1.5" fill="#ffffff" />
              </g>
            </svg>

            {/* 4 Step Cards — Appears in Sequence after Traveling Line Arrives */}
            <div className="grid grid-cols-4 gap-6 h-full relative z-10">
              {STEPS.map((s, i) => {
                const Icon = s.Icon;
                const isTop = i % 2 === 1;
                const stepDelays = ['700ms', '1900ms', '3100ms', '4300ms'];
                const cardDelay = stepDelays[i];
                const initialTranslate = isTop ? 'translateY(-24px)' : 'translateY(24px)';

                return (
                  <div
                    key={s.num}
                    className={`relative flex flex-col ${
                      isTop ? 'justify-start pt-1' : 'justify-end pb-1'
                    }`}
                  >
                    <div
                      className="group px-4 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full max-w-[220px] h-[98px] mx-auto flex flex-col justify-center"
                      style={{
                        background: s.cardBg,
                        border: `1.5px solid ${s.borderColor}`,
                        borderLeft: `4.5px solid ${s.dotColor}`,
                        boxShadow: `0 8px 24px ${s.shadowColor}`,
                        opacity: isSec5Visible ? 1 : 0,
                        transform: isSec5Visible ? 'translateY(0)' : initialTranslate,
                        transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                        transitionDelay: isSec5Visible ? cardDelay : '0ms',
                        pointerEvents: isSec5Visible ? 'auto' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                          style={{ background: s.iconBg }}
                        >
                          <Icon size={14} color="white" aria-hidden="true" strokeWidth={2.2} />
                        </div>

                        <span
                          className="text-[10px] font-extrabold tracking-[0.18em] uppercase"
                          style={{ color: s.accentColor }}
                        >
                          LANGKAH {s.num}
                        </span>
                      </div>

                      <h3 className="text-[14px] sm:text-[15px] font-extrabold text-[#101828] leading-snug">
                        {s.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE: Vertical Timeline — Sequential Traveling Line */}
          <div className="block lg:hidden relative pl-4 sm:pl-6 max-w-[420px] mx-auto">
            <div
              aria-hidden="true"
              className="absolute left-7 sm:left-9 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#2f6fed] via-[#8b5cf6] to-[#22c55e] rounded-full pointer-events-none origin-top"
              style={{
                transform: isSec5Visible ? 'scaleY(1)' : 'scaleY(0)',
                transition: 'transform 3.8s cubic-bezier(0.25, 1, 0.5, 1)',
                transitionDelay: isSec5Visible ? '700ms' : '0ms',
              }}
            />

            <div className="space-y-4 relative z-10">
              {STEPS.map((s, idx) => {
                const Icon = s.Icon;
                const stepDelays = ['700ms', '1900ms', '3100ms', '4300ms'];
                const cardDelay = stepDelays[idx];

                return (
                  <div
                    key={s.num}
                    className="flex items-center gap-4 sm:gap-5"
                    style={{
                      opacity: isSec5Visible ? 1 : 0,
                      transform: isSec5Visible ? 'translateY(0)' : 'translateY(22px)',
                      transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: isSec5Visible ? cardDelay : '0ms',
                    }}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
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
                      className="flex-1 p-3.5 sm:p-4 rounded-2xl transition-all flex items-center gap-3.5"
                      style={{
                        background: s.cardBg,
                        border: `1.5px solid ${s.borderColor}`,
                        borderLeft: `4.5px solid ${s.dotColor}`,
                        boxShadow: `0 4px 16px ${s.shadowColor}`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                        style={{ background: s.iconBg }}
                      >
                        <Icon size={16} color="white" aria-hidden="true" strokeWidth={2.2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className="text-[10px] font-extrabold tracking-[0.16em] uppercase block mb-0.5"
                          style={{ color: s.accentColor }}
                        >
                          LANGKAH {s.num}
                        </span>

                        <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-snug">
                          {s.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          SECTION 6 — STATISTIK RADIAL & CTA PENUTUP (3-Stage Sequential Animation)
          ============================================================== */}
      <section
        ref={sec6Ref}
        className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16 xl:px-20"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dbe9fc 12%, #dbe9fc 88%, #ffffff 100%)',
        }}
      >
        <div
          className="mx-auto"
          style={{ maxWidth: '1080px' }}
        >

          {/* TAHAP 2 — Radial Stats Row (Staggered Battery Filling from Left to Right) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 justify-items-center items-start mb-14 sm:mb-18">
            {STATS.map((stat, idx) => {
              const statDelays = [100, 280, 460, 640];
              const delay = statDelays[idx];

              return (
                <SegmentedDialCircle
                  key={stat.label}
                  {...stat}
                  isVisible={isSec6Visible}
                  delay={delay}
                />
              );
            })}
          </div>

          {/* TAHAP 3 — CTA Block (Appears after all 4 circles finish filling) */}
          <div className="flex justify-center">
            <div
              className="w-full max-w-[840px] px-7 sm:px-10 py-6 sm:py-8 rounded-3xl relative overflow-hidden border border-blue-100 bg-white shadow-xl shadow-blue-900/5 transition-all hover:shadow-2xl"
              style={{
                opacity: isSec6Visible ? 1 : 0,
                transform: isSec6Visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isSec6Visible ? '2450ms' : '0ms',
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#101828] leading-snug mb-2">
                    Sadewa, kini hadir untuk keluarga Anda.
                  </h3>
                  <p className="text-[#475467] text-xs sm:text-sm max-w-[480px]">
                    Unduh aplikasi Sadewa sekarang dan mulai terhubung dengan keluarga tercinta.
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
                  Dapatkan Sadewa
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
              Sadewa
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
            <a href="mailto:cs@sadewa.id" className="hover:text-[#2f6fed] transition-colors lp-focus-ring inline-flex items-center gap-1">
              <Mail className="w-3 h-3" aria-hidden="true" />
              cs@sadewa.id
            </a>
          </div>
          <p className="text-[#98a2b3] text-center sm:text-right">© 2026 Sadewa. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
