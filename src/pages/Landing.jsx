import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, Mail, Phone, Wallet, Clock, Shield, Mic, Monitor, IdCard } from 'lucide-react';

/**
 * ================================================================
 * PasCall Landing Page — v2
 * ================================================================
 * PLACEHOLDER NOTES:
 * - Lapas photo (section 2): gradient placeholder.
 *   TODO: Replace with <img src="/assets/lapas.jpg" alt="..." />
 *   when the photo file is available.
 * - Phone mockup screen: dummy "Riwayat Panggilan" data.
 *   TODO: Replace inner screen content with real app screenshot.
 * ================================================================
 */

// ──────────────────────────────────────────────────────────────────
// SQUIGGLE — thick neon-style wave, cyan → purple → magenta
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
      style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.45)) drop-shadow(0 0 20px rgba(192,38,211,0.25))' }}
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
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="45%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SquiggleSmall({ className = '' }) {
  return <Squiggle className={className} width={90} height={22} id="sq-sm" />;
}

// ──────────────────────────────────────────────────────────────────
// PHONE MOCKUP — realistic 3D device, metallic frame, glass reflection
// ──────────────────────────────────────────────────────────────────
function PhoneMockup() {
  /* --- PLACEHOLDER: All screen content is placeholder data.
     TODO: Replace with a real app screenshot when available. --- */
  const calls = [
    { name: 'Budi Santoso',  type: 'Video', sub: 'Durasi 8:47',  color: '#7c3aed', dir: 'keluar' },
    { name: 'Siti Aisyah',   type: 'Suara', sub: 'Kemarin',       color: '#0284c7', dir: 'masuk'  },
    { name: 'Ahmad Nur',     type: 'Video', sub: 'Durasi 12:03', color: '#059669', dir: 'keluar' },
    { name: 'Ibu Rini',      type: 'Suara', sub: 'Kemarin',       color: '#d97706', dir: 'masuk'  },
    { name: 'Rizky Pratama', type: 'Video', sub: 'Durasi 9:18',  color: '#dc2626', dir: 'keluar' },
  ];

  const ArrowIcon = ({ dir }) => {
    const color = dir === 'keluar' ? '#818cf8' : '#34d399';
    return (
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {dir === 'keluar'
          ? <path d="M2 10 L10 2 M6 2 H10 V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M10 2 L2 10 M6 10 H2 V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
    );
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Secondary blurred phone (Jadwal screen) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 40, left: -80, width: 210,
          borderRadius: 28,
          background: 'linear-gradient(145deg, #131830, #0c1020)',
          border: '2px solid rgba(255,255,255,0.05)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          filter: 'blur(2.5px)',
          opacity: 0.5,
          zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
        }}
      >
        <div style={{ width: 70, height: 20, background: '#06091a', borderRadius: '0 0 12px 12px', margin: '0 auto' }} />
        <div style={{ padding: '12px 14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 10 }}>Jadwal Panggilan</p>
          {[{ day: 'Senin', time: '10:00–10:30' }, { day: 'Rabu', time: '14:00–14:30' }, { day: "Jum'at", time: '09:00–09:30' }].map(s => (
            <div key={s.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{s.day}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600 }}>{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ambient glow */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: -32, background: 'radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.28) 0%, rgba(168,85,247,0.12) 50%, transparent 75%)', borderRadius: '50%', filter: 'blur(24px)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Primary phone frame */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative', zIndex: 2, width: 265, borderRadius: 38,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.12) 100%)',
          padding: 3,
          boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 12px 30px rgba(0,0,0,0.4), 0 2px 8px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
          transform: 'perspective(800px) rotateY(-8deg) rotateX(4deg)',
        }}
      >
        {/* Screen */}
        <div style={{ borderRadius: 36, background: 'linear-gradient(165deg, #181e3a, #0e1225)', overflow: 'hidden', position: 'relative' }}>
          {/* Status bar */}
          <div style={{ padding: '10px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600 }}>9:41</span>
            <div style={{ width: 80, height: 22, background: '#06091a', borderRadius: 20, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 8 }} />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[3,5,7,9].map((h,i) => <div key={i} style={{ width: 3, height: h, background: i < 3 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', borderRadius: 1 }} />)}
              <div style={{ width: 20, height: 9, border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 2, marginLeft: 4, position: 'relative' }}>
                <div style={{ position: 'absolute', right: -4, top: 2, width: 3, height: 5, background: 'rgba(255,255,255,0.4)', borderRadius: '0 1px 1px 0' }} />
                <div style={{ width: '65%', height: '100%', background: '#22c55e', borderRadius: 1 }} />
              </div>
            </div>
          </div>
          {/* Content */}
          <div style={{ padding: '8px 14px 10px' }}>
            <p style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: 13, textAlign: 'center', marginBottom: 10 }}>Riwayat Panggilan</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {['Semua','Video','Suara'].map((tab, i) => (
                <div key={tab} style={{ flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 600, textAlign: 'center', borderRadius: 20, background: i === 0 ? 'linear-gradient(90deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.06)', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.45)' }}>{tab}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {calls.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '6px 8px' }}>
                  <div style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                    {c.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 9.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <ArrowIcon dir={c.dir} />
                      <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 7.5 }}>{c.type} · {c.sub}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom nav */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '7px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,9,26,0.5)' }}>
            {[{l:'Beranda',a:false},{l:'Jadwal',a:false},{l:'Riwayat',a:true},{l:'Profil',a:false}].map((n) => (
              <div key={n.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 18, height: 18, borderRadius: n.a ? 6 : 4, background: n.a ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: n.a ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: n.a ? 700 : 400 }}>{n.l}</span>
              </div>
            ))}
          </div>
          {/* Glass reflection */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '55%', height: '38%', background: 'linear-gradient(135deg, rgba(255,255,255,0.07), transparent)', borderRadius: '36px 0 0 0', pointerEvents: 'none' }} />
        </div>
        {/* Side buttons */}
        <div aria-hidden="true" style={{ position: 'absolute', left: -4, top: 84, width: 4, height: 26, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.2))', borderRadius: '3px 0 0 3px' }} />
        <div aria-hidden="true" style={{ position: 'absolute', left: -4, top: 118, width: 4, height: 44, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.2))', borderRadius: '3px 0 0 3px' }} />
        <div aria-hidden="true" style={{ position: 'absolute', right: -4, top: 108, width: 4, height: 52, background: 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))', borderRadius: '0 3px 3px 0' }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// SHIELD LINE ART
// ──────────────────────────────────────────────────────────────────
function ShieldArt() {
  return (
    <svg width="110" height="128" viewBox="0 0 120 140" fill="none" aria-hidden="true">
      <path d="M60 8 L106 24 L106 72 C106 100 84 122 60 130 C36 122 14 100 14 72 L14 24 Z" stroke="rgba(168,85,247,0.4)" strokeWidth="2" fill="rgba(88,28,135,0.15)" />
      <path d="M60 20 L96 33 L96 72 C96 95 79 114 60 122 C41 114 24 95 24 72 L24 33 Z" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" fill="none" />
      <rect x="43" y="68" width="34" height="26" rx="4" stroke="rgba(192,38,211,0.6)" strokeWidth="2" fill="rgba(139,92,246,0.12)" />
      <path d="M48 68 L48 58 Q48 46 60 46 Q72 46 72 58 L72 68" stroke="rgba(192,38,211,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="78" r="4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
      <line x1="60" y1="82" x2="60" y2="88" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M90 22 L95 28 L105 16" stroke="rgba(34,197,94,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────
// CHAT BUBBLE — with tail + leading icon circle
// ──────────────────────────────────────────────────────────────────
function ChatBubble({ text, bg, tailLeft = false, IconCmp }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexDirection: tailLeft ? 'row' : 'row-reverse', maxWidth: 260 }}>
      <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
        <IconCmp size={15} color="white" aria-hidden="true" strokeWidth={1.8} />
      </div>
      <div style={{ background: bg, borderRadius: tailLeft ? '4px 16px 16px 16px' : '16px 4px 16px 16px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
        <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{text}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// DATA
// ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { title: 'Panggilan suara & video terjadwal', desc: 'Atur waktu panggilan sesuai jadwal yang tersedia.',                                   bg: 'linear-gradient(145deg, #7e22ce, #c026d3)', icon: Phone,  radius: '20px 8px 20px 8px' },
  { title: 'Sistem saldo/top-up mudah',          desc: 'Isi saldo langsung melalui petugas kantin di dalam lapas.',                           bg: 'linear-gradient(145deg, #2563eb, #0891b2)', icon: Wallet, radius: '8px 20px 8px 20px' },
  { title: 'Riwayat panggilan tercatat',          desc: 'Semua panggilan tersimpan rapi dan mudah ditelusuri.',                                bg: 'linear-gradient(145deg, #4338ca, #7c3aed)', icon: Clock,  radius: '20px 8px 20px 8px' },
  { title: 'Kontak yang sudah terverifikasi',     desc: 'Hanya kontak yang telah diverifikasi via KTP yang dapat dihubungi.',                 bg: 'linear-gradient(145deg, #c026d3, #7c3aed)', icon: Shield, radius: '8px 20px 8px 20px' },
];

const STEPS = [
  { num: '01', title: 'Daftar Akun',       desc: 'Buat akun dengan nomor handphone.',                                       grad: 'from-purple-600 to-fuchsia-600', offset: false, lineGrad: '#7c3aed, #2563eb' },
  { num: '02', title: 'Verifikasi Kontak', desc: 'Lakukan verifikasi kontak keluarga via KTP.',                             grad: 'from-blue-600 to-purple-600',   offset: true,  lineGrad: '#2563eb, #c026d3' },
  { num: '03', title: 'Top Up Saldo',      desc: 'Isi saldo melalui petugas kantin di dalam lapas.',                        grad: 'from-indigo-600 to-blue-600',   offset: false, lineGrad: '#7c3aed, #2563eb' },
  { num: '04', title: 'Mulai Panggilan',   desc: 'Pilih jadwal dan mulai panggilan sesuai waktu yang tersedia.',            grad: 'from-fuchsia-600 to-purple-600', offset: true,  lineGrad: '#2563eb, #c026d3' },
];

const SECURITY_ITEMS = [
  { text: 'Semua panggilan direkam dan bisa diaudit',       Icon: Mic     },
  { text: 'Kontak diverifikasi via KTP',                    Icon: IdCard  },
  { text: 'Dashboard monitoring real-time untuk admin',      Icon: Monitor },
  { text: 'Sesuai standar keamanan lembaga pemasyarakatan', Icon: Shield  },
];

const STATS = [
  { value: '100%',    label: 'panggilan direkam'          },
  { value: '8',       label: 'cabang lapas'                },
  { value: '24/7',    label: 'pusat bantuan'               },
  { value: '3 menit', label: 'rata-rata verifikasi kontak' },
];

// ──────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const handleSmoothScroll = (e) => {
    e.preventDefault();
    document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="relative min-h-screen text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Full-page background */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ background: `url('/bg-sections/background_pascall.png') top center / 100% auto no-repeat, #06091a` }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 55%, #06091a 82%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10">

        {/* ==============================================================
            HEADER
            ============================================================== */}
        <header className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-5 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 lp-focus-ring" aria-label="PasCall beranda">
            <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true">
              <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#hdr-g)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <defs>
                <linearGradient id="hdr-g" x1="0" y1="12" x2="32" y2="12">
                  <stop offset="0%" stopColor="#a855f7"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-extrabold tracking-tight text-white">PasCall</span>
          </a>
          <Link
            to="/login"
            className="lp-focus-ring px-6 py-2 rounded-full text-sm font-semibold text-white
                       bg-gradient-to-r from-purple-600 to-blue-600
                       hover:from-purple-500 hover:to-blue-500 transition-colors duration-200"
          >
            Login
          </Link>
        </header>

        {/* ==============================================================
            SECTION 1 — HERO
            ============================================================== */}
        <section
          id="hero"
          className="relative pt-6 sm:pt-10 lg:pt-14 pb-10 sm:pb-12 lg:pb-14 px-6 sm:px-10 lg:px-16 xl:px-20"
        >
          <div
            className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center"
            style={{ maxWidth: '1200px' }}
          >
            {/* Left */}
            <div className="lg:col-span-6 lp-hero-animate">
              <h1 className="text-[clamp(2.4rem,5.2vw,4.2rem)] font-extrabold leading-[1.05] tracking-tight text-left mb-5">
                <span className="block">Mendekatkan</span>
                <span className="block">Hati,</span>
                <span className="block relative whitespace-nowrap">
                  <span className="lp-text-outline">Tanpa Batas</span>
                  {/* Squiggle #1 — crosses hero title */}
                  <span className="absolute -bottom-4 left-0" aria-hidden="true">
                    <Squiggle width={130} height={28} id="sq-hero" />
                  </span>
                </span>
              </h1>

              <p className="lp-hero-animate-delay-1 text-base sm:text-lg text-white/65 leading-relaxed max-w-[480px] mt-9 mb-8">
                PasCall menghubungkan narapidana dengan keluarga melalui panggilan yang
                terverifikasi, tercatat, dan diawasi petugas.
              </p>

              {/* Primary CTA */}
              <div className="lp-hero-animate-delay-2">
                <a
                  href="#cara-kerja"
                  onClick={handleSmoothScroll}
                  className="lp-btn-glow lp-focus-ring inline-flex items-center gap-2.5 px-8 py-3.5
                             rounded-full text-white font-bold text-sm
                             bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-700
                             transition-all duration-200"
                >
                  Lihat cara kerja
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Right — phone mockup */}
            <div className="lg:col-span-6 flex justify-center lg:justify-center lp-hero-animate-delay-3">
              <div className="relative">
                <PhoneMockup />
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/35 lp-scroll-bounce">
            <span className="text-[10px] font-semibold tracking-widest uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </section>

        {/* ==============================================================
            SECTION 2 — MASALAH
            ============================================================== */}
        <section className="relative py-12 sm:py-16 lg:py-22 px-6 sm:px-10 lg:px-16 xl:px-20">
          <div
            className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            style={{ maxWidth: '1080px' }}
          >
            {/* Left */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-tight text-left mb-3">
                Komunikasi terbatas,<br />berdampak besar.
              </h2>
              {/* Squiggle #2 */}
              <SquiggleSmall className="mb-5" />
              <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-[440px]">
                Selama ini komunikasi narapidana dengan keluarga terbatas dan sulit diawasi.
                PasCall hadir sebagai solusi yang terjamin, aman, dan mudah diakses.
              </p>
            </div>

            {/* Right — photo panel + chat bubbles */}
            <div className="relative">
              {/* TODO: Replace this placeholder with:
                  <img src="/assets/lapas.jpg" alt="Gedung lembaga pemasyarakatan"
                       className="lp-clip-skew w-full rounded-2xl object-cover"
                       style={{ aspectRatio:'4/3', filter:'brightness(0.65)' }} />
                  when assets/lapas.jpg is available. */}
              <div
                className="lp-clip-skew w-full rounded-2xl overflow-hidden"
                style={{ aspectRatio: '4/3', background: 'linear-gradient(155deg, #1a0533, #1e1b4b 45%, #0f2340)', position: 'relative' }}
                role="img"
                aria-label="Foto lembaga pemasyarakatan (placeholder — ganti dengan lapas.jpg)"
              >
                {/* Grid texture */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} aria-hidden="true">
                  <defs>
                    <pattern id="lp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.6"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#lp-grid)"/>
                </svg>
                {/* Building silhouette */}
                <svg style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: '55%', opacity: 0.18 }} viewBox="0 0 200 100" fill="none" aria-hidden="true">
                  <rect x="30" y="40" width="50" height="60" fill="white" />
                  <rect x="90" y="20" width="40" height="80" fill="white" />
                  <rect x="145" y="50" width="35" height="50" fill="white" />
                  <rect x="0" y="60" width="30" height="40" fill="white" />
                  <line x1="110" y1="20" x2="110" y2="4" stroke="white" strokeWidth="2"/>
                  <line x1="104" y1="4" x2="116" y2="4" stroke="white" strokeWidth="2"/>
                  <rect x="38" y="50" width="7" height="7" fill="#06091a" />
                  <rect x="53" y="50" width="7" height="7" fill="#06091a" />
                  <rect x="38" y="65" width="7" height="7" fill="#06091a" />
                  <rect x="96" y="30" width="7" height="7" fill="#06091a" />
                  <rect x="111" y="30" width="7" height="7" fill="#06091a" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(37,99,235,0.12))' }} />
              </div>

              {/* Staggered chat bubbles overlapping the photo edge */}
              <div style={{ position: 'absolute', top: '14%', right: '-4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ alignSelf: 'flex-end', marginRight: 4 }}>
                  <ChatBubble
                    text="Jangkauan lebih dekat untuk keluarga."
                    bg="linear-gradient(135deg, #7c3aed, #6d28d9)"
                    tailLeft={false}
                    IconCmp={Phone}
                  />
                </div>
                <div style={{ alignSelf: 'flex-start', marginLeft: -20 }}>
                  <ChatBubble
                    text="Aman, terverifikasi, dan tercatat."
                    bg="linear-gradient(135deg, #2563eb, #0891b2)"
                    tailLeft={true}
                    IconCmp={Shield}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 3 — FITUR UTAMA
            ============================================================== */}
        <section className="relative py-12 sm:py-16 lg:py-22 px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>
            <div className="mb-10 sm:mb-12 flex flex-wrap items-end gap-3">
              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold leading-tight">
                Untuk keluarga,<br />lebih mudah dan aman.
              </h2>
              {/* Squiggle #3 */}
              <Squiggle width={100} height={24} id="sq-feat" />
            </div>

            {/* Asymmetric feature cards, vibrant solid gradients, no border */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`relative overflow-hidden p-5 sm:p-6 ${i === 1 ? 'sm:mt-6' : ''} ${i === 2 ? 'sm:-mt-3' : ''}`}
                    style={{ background: f.bg, borderRadius: f.radius }}
                  >
                    {/* Line icon, top-right, subtle */}
                    <div className="absolute top-5 right-5 opacity-25">
                      <Icon size={26} color="white" aria-hidden="true" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 pr-8">{f.title}</h3>
                    <p className="text-white/65 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 4 — KEAMANAN
            ============================================================== */}
        <section className="relative py-12 sm:py-16 lg:py-22 px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-8 sm:p-10 lg:p-12 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #2e1065, #1e1b4b 45%, #172554)', borderRadius: '32px 8px 32px 8px' }}
            >
              {/* Wavy texture */}
              <svg aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '50%', opacity: 0.05 }} viewBox="0 0 200 300" fill="none" preserveAspectRatio="none">
                {[0,30,60,90,120,150,180,210,240,270].map((y, i) => (
                  <path key={i} d={`M${i%2===0?0:200} ${y} Q 100 ${y+14} ${i%2===0?200:0} ${y+28}`} stroke="white" strokeWidth="1" fill="none" />
                ))}
              </svg>
              {/* Shield decoration */}
              <div aria-hidden="true" style={{ position: 'absolute', bottom: -20, right: 20, opacity: 0.45 }}>
                <ShieldArt />
              </div>
              {/* Left */}
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-extrabold leading-tight text-white mb-4">
                  Transparan untuk institusi,<br />terpercaya untuk semua.
                </h2>
                <p className="text-white/55 text-sm leading-relaxed max-w-[320px]">
                  PasCall dirancang dengan standar keamanan tinggi agar setiap komunikasi
                  dapat dipantau, dicatat, dan diaudit oleh pihak lapas.
                </p>
              </div>
              {/* Right — icon list */}
              <div className="relative z-10">
                {SECURITY_ITEMS.map(({ text, Icon }, idx) => (
                  <div
                    key={text}
                    className="flex items-start gap-3 py-4"
                    style={{ borderBottom: idx < SECURITY_ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
                  >
                    <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color="rgba(168,85,247,0.9)" aria-hidden="true" strokeWidth={1.8} />
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 5 — CARA KERJA (vertical timeline)
            ============================================================== */}
        <section
          id="cara-kerja"
          className="relative py-12 sm:py-16 lg:py-22 px-6 sm:px-10 lg:px-16 xl:px-20"
        >
          <div
            className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start"
            style={{ maxWidth: '1080px' }}
          >
            {/* Left — timeline */}
            <div className="relative">
              {/* Vertical gradient connector line */}
              <div
                aria-hidden="true"
                style={{ position: 'absolute', left: 31, top: 32, bottom: 32, width: 2, background: 'linear-gradient(to bottom, #7c3aed, #2563eb, #7c3aed, #c026d3)', borderRadius: 4 }}
              />
              <div className="space-y-5">
                {STEPS.map((s, i) => (
                  <div key={s.num} className="flex gap-5 items-start" style={{ marginLeft: s.offset ? 24 : 0 }}>
                    {/* Step circle with outer ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div
                          className={`bg-gradient-to-br ${s.grad}`}
                          style={{ width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'white', fontStyle: 'italic' }}
                        >
                          {s.num}
                        </div>
                      </div>
                    </div>
                    {/* Step panel */}
                    <div
                      className="flex-1 rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid`, borderImage: `linear-gradient(to bottom, ${s.lineGrad}) 1`, marginTop: 7 }}
                    >
                      <h3 className="text-sm sm:text-base font-bold text-white mb-1">{s.title}</h3>
                      <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — big decorative title */}
            <div className="relative lg:pt-4">
              {/* Giant outline "4" as background decoration */}
              <div
                aria-hidden="true"
                style={{ position: 'absolute', top: -24, right: -20, fontSize: 'clamp(140px, 18vw, 220px)', fontWeight: 900, fontStyle: 'italic', color: 'transparent', WebkitTextStroke: '1.5px rgba(168,85,247,0.15)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}
              >
                4
              </div>
              <h2
                className="relative z-10 font-extrabold leading-tight text-white"
                style={{ fontSize: 'clamp(2.4rem,5vw,3.8rem)' }}
              >
                Mudah dalam<br />4 langkah.
              </h2>
              {/* Squiggle #4 */}
              <div className="mt-4">
                <Squiggle width={120} height={26} id="sq-steps" />
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            SECTION 6 — CTA + STATS
            ============================================================== */}
        <section className="relative pt-10 sm:pt-14 pb-0 px-6 sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>

            {/* CTA Block */}
            <div
              className="p-8 sm:p-10 lg:p-12 mb-12 sm:mb-16"
              style={{ background: 'linear-gradient(135deg, #c026d3, #581c87 40%, #3730a3 70%, #1e3a5f)', borderRadius: '32px 8px 8px 32px' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2">
                    Segera hadir untuk keluarga Anda.
                  </h2>
                  <p className="text-white/65 text-sm sm:text-base max-w-[460px]">
                    PasCall sedang dipersiapkan. Hubungi kami untuk informasi lebih lanjut.
                  </p>
                </div>
                <a
                  href="mailto:cs@pascall.id"
                  className="lp-btn-glow lp-focus-ring inline-flex items-center gap-2.5 px-7 py-3.5
                             rounded-full text-white font-bold text-sm shrink-0
                             bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-700
                             transition-all duration-200"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Hubungi Kami
                </a>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-y-8 mb-12 sm:mb-16">
              {STATS.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  <div className="text-center px-5 sm:px-8 lg:px-10">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight" style={{ fontStyle: 'italic' }}>
                      {stat.value}
                    </p>
                    <p className="text-white/45 text-xs sm:text-sm mt-1 font-medium">{stat.label}</p>
                  </div>
                  {i < STATS.length - 1 && <div className="lp-stat-divider hidden sm:block h-12" aria-hidden="true" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ==============================================================
            FOOTER
            ============================================================== */}
        <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-10 lg:px-16 xl:px-20" style={{ background: 'rgba(6,9,26,0.85)' }}>
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40" style={{ maxWidth: '1080px' }}>
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <span className="text-white font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                <svg width="20" height="15" viewBox="0 0 32 24" fill="none" aria-hidden="true">
                  <path d="M2 20 C6 6, 10 6, 14 14 C18 22, 22 4, 26 8 C28 10, 30 6, 30 4" stroke="url(#ftr-g)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  <defs>
                    <linearGradient id="ftr-g" x1="0" y1="12" x2="32" y2="12">
                      <stop offset="0%" stopColor="#a855f7"/>
                      <stop offset="100%" stopColor="#06b6d4"/>
                    </linearGradient>
                  </defs>
                </svg>
                PasCall
              </span>
              <span className="text-white/25">Program komunikasi terverifikasi</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <a href="#" className="hover:text-white/70 transition-colors lp-focus-ring">Syarat &amp; Ketentuan</a>
              <span className="text-white/15">|</span>
              <a href="#" className="hover:text-white/70 transition-colors lp-focus-ring">Kebijakan Privasi</a>
              <span className="text-white/15">|</span>
              <a href="#" className="hover:text-white/70 transition-colors lp-focus-ring">Bantuan</a>
              <span className="text-white/15">|</span>
              <a href="mailto:cs@pascall.id" className="hover:text-white/70 transition-colors lp-focus-ring inline-flex items-center gap-1">
                <Mail className="w-3 h-3" aria-hidden="true" />
                cs@pascall.id
              </a>
            </div>
            <p className="text-white/25 text-center sm:text-right">© 2026 PasCall. Seluruh hak cipta dilindungi.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
