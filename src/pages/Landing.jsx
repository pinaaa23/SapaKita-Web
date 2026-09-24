import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  PhoneCall, 
  Video, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  UserCheck, 
  Headset, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Send, 
  Mail, 
  MapPin, 
  Menu, 
  X, 
  ChevronRight, 
  FileText, 
  Download, 
  HelpCircle,
  Sparkles,
  Smartphone,
  Globe2,
  Users
} from 'lucide-react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'keluarga',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', phone: '', role: 'keluarga', message: '' });
      setFormSubmitted(false);
    }, 4000);
  };

  const navLinks = [
    { label: 'Beranda', href: '#hero' },
    { label: 'Tentang', href: '#penjelasan' },
    { label: 'Fitur Utama', href: '#fitur' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
    { label: 'Kontak', href: '#kontak' }
  ];

  return (
    <div className="min-h-screen bg-[#060D1F] text-white font-sans selection:bg-cyan-500 selection:text-white antialiased overflow-x-hidden">

      {/* ========================================================================= */}
      {/* NAVBAR STICKY / FIXED WITH BLUR & SMOOTH NAVIGATION                      */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060D1F]/80 backdrop-blur-lg border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#060D1F] rounded-[10px] flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Pas<span className="text-cyan-400">Call</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-medium -mt-1">
                Layanan Pemasyarakatan
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Action: Login Petugas / Keluarga */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/login"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-2 group"
            >
              <span>Masuk Portal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#071126] border-b border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-base font-medium text-slate-200 hover:text-cyan-400 border-b border-white/5"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <Link 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl text-center font-semibold flex items-center justify-center gap-2"
              >
                <span>Masuk Portal PasCall</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>


      {/* ========================================================================= */}
      {/* 1. SECTION HERO (0% - 15%)                                               */}
      {/* Background: bg-hero.png (Wave cyan-biru tengah-atas, wifi/bubble framing) */}
      {/* ========================================================================= */}
      <section 
        id="hero"
        className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/bg-sections/bg-hero.png')` }}
      >
        {/* Top & Bottom Dark Navy Gradient Fades for Seamless Connection */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060D1F] via-[#060D1F]/70 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none z-10" />

        {/* Central Ambient Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full" />
        </div>

        {/* Main Hero Content - Focused at Center above the light waves */}
        <div className="relative z-20 max-w-4xl mx-auto text-center px-4 sm:px-6">
          
          {/* Badge Program */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 backdrop-blur-md shadow-lg shadow-cyan-500/10 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Platform Komunikasi Resmi Pemasyarakatan</span>
          </div>

          {/* Grand Logo / Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-4">
            Pas<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Call</span>
          </h1>

          {/* Motto */}
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-200 tracking-wide mb-6">
            "Mendekatkan Hati Tanpa Batas"
          </p>

          {/* Supporting Description */}
          <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
            Layanan panggilan video dan suara terverifikasi yang menghubungkan warga binaan 
            dengan keluarga tercinta secara aman, tertib, dan transparan di bawah pengawasan petugas.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a 
              href="#fitur"
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 hover:from-cyan-400 hover:to-blue-600 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
            >
              <span>Jelajahi Fitur</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a 
              href="#cara-kerja"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-all hover:border-cyan-400/50"
            >
              <span>Cara Kerja</span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Terdaftar & Terawasi</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Enkripsi Sesi Aman</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Bebas Pungli & Transparan</span>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. SECTION PENJELASAN (15% - 40%)                                         */}
      {/* Background: bg-penjelasan.png (Gelap/kosong, aksen telepon kanan)        */}
      {/* ========================================================================= */}
      <section 
        id="penjelasan"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/bg-sections/bg-penjelasan.png')` }}
      >
        {/* Seamless Navy Overlays */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Content focused on Left & Center-Left, leaving the Right Phone Icon Unobstructed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8 space-y-8">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kenapa PasCall Dibutuhkan?</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Menjembatani Jarak, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                  Menjaga Martabat & Ketertiban
                </span>
              </h2>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                Di dalam lembaga pemasyarakatan, hak berkomunikasi narapidana dengan keluarga 
                adalah bagian penting dari proses pembinaan dan pemulihan mental. Namun, tanpa 
                sistem digital yang aman, komunikasi konvensional rentan disalahgunakan, memicu antrean 
                panjang, hingga praktik percaloan yang memberatkan keluarga.
              </p>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                <strong className="text-white">PasCall hadir sebagai solusi digital terintegrasi:</strong> menghadirkan 
                akses telekomunikasi terjadwal, terverifikasi dengan data kependudukan (KTP/KK), 
                serta dipantau secara langsung oleh petugas jaga. Komunikasi menjadi lebih tertib, 
                adil bagi semua warga binaan, dan bebas dari pungutan liar.
              </p>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                
                <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-cyan-400/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Ikatan Keluarga</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mendukung rehabilitasi moral narapidana melalui dukungan kasih sayang keluarga.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-cyan-400/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Pengawasan Penuh</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sistem pemantauan aktif yang mencegah tindak penipuan dan komunikasi terlarang.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-cyan-400/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Tarif Transparan</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Semua transaksi tercatat secara elektronik tanpa pembayaran tunai di tempat.
                  </p>
                </div>

              </div>

            </div>

            {/* Right side left open intentionally for the background phone accent to shine */}
            <div className="hidden lg:block lg:col-span-4" />

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. SECTION FITUR UTAMA (40% - 62%)                                        */}
      {/* Background: bg-fitur.png (Globe network kiri-bawah, wave, bubble)        */}
      {/* ========================================================================= */}
      <section 
        id="fitur"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/bg-sections/bg-fitur.png')` }}
      >
        {/* Seamless Navy Overlays */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Header placed on TOP-LEFT (above globe network position, not covering it) */}
          <div className="max-w-2xl mb-14 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-3">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Teknologi & Keunggulan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Fitur Utama PasCall
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Arsitektur terintegrasi yang menghadirkan kepatuhan keamanan tingkat tinggi 
              sekaligus kemudahan akses bagi pihak keluarga di mana pun berada.
            </p>
          </div>

          {/* Cards Grid with Rich Glassmorphism (Semi-transparan + Blur agar teks tajam di atas background) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Panggilan Video & Suara HD
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Komunikasi jernih dengan latensi rendah dan kompresi adaptif yang tetap stabil 
                bahkan di jaringan terbatas lingkungan lapas/rutan.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Verifikasi Identitas Keluarga
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Hanya kontak keluarga resmi yang telah tervalidasi KTP & KK yang dapat terhubung, 
                menjamin privasi serta mencegah penyusupan pihak luar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Headset className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Monitoring & Intervensi Petugas
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dashboard khusus bagi petugas jaga untuk mengawasi sesi panggilan secara berkala, 
                lengkap dengan fitur peringatan dan pemutusan darurat jika ada pelanggaran.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Jadwal Reservasi Otomatis
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sistem penjadwalan antrean cerdas yang membagi waktu panggilan secara adil, 
                mencegah kerumunan fisik di wartelsuspas.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Dompet Digital & Tarif Resmi
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sistem saldo non-tunai dengan tarif per menit yang transparan dan dapat 
                diisi ulang langsung oleh keluarga melalui transfer bank / e-wallet.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Audit Trail & Log Resmi
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pencatatan riwayat panggilan lengkap dengan stempel waktu, durasi, dan identitas 
                penelepon untuk keperluan pelaporan institusional.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. SECTION LANGKAH / CARA KERJA (62% - 82%)                               */}
      {/* Background: bg-cara-kerja.png (Ikon wifi di sisi kanan, relatif kosong)   */}
      {/* ========================================================================= */}
      <section 
        id="cara-kerja"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/bg-sections/bg-cara-kerja.png')` }}
      >
        {/* Seamless Navy Overlays */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Alur Penggunaan Mudah</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Cara Kerja PasCall
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Empat tahapan sederhana dari proses verifikasi hingga sesi panggilan terlaksana dengan lancar.
            </p>
          </div>

          {/* Horizontal Numbered Steps (Aligned with margin on right to let wifi icon shine) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto pr-0 lg:pr-12">
            
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-[#09152e]/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/30">
                  1
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Registrasi & Verifikasi</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Keluarga mengunduh aplikasi dan mendaftarkan dokumen identitas (KTP/KK) untuk validasi hubungan dengan warga binaan.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verifikasi 1x24 Jam</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-[#09152e]/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
                  2
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pilih Jadwal Sesi</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Keluarga memesan jadwal panggilan sesuai ketersediaan slot waktu bilik komunikasi di rutan/lapas terkait.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Slot Fleksibel</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-[#09152e]/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30">
                  3
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Persiapan Petugas</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Petugas mengonfirmasi jadwal, menjemput warga binaan, dan mendampingi masuk ke bilik terminal panggilan.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pendampingan Petugas</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-[#09152e]/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30">
                  4
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Panggilan Terhubung</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Sesi video/suara berlangsung dengan durasi yang telah ditentukan secara aman, tenang, dan diawasi.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Koneksi Aman & Jernih</span>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. SECTION KONTAK (82% - 100%)                                            */}
      {/* Background: bg-kontak.png (Divider, smartphone di sisi kanan)             */}
      {/* ========================================================================= */}
      <section 
        id="kontak"
        className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-cover bg-bottom bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/bg-sections/bg-kontak.png')` }}
      >
        {/* Top Dark Navy Overlay */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060D1F] via-[#060D1F]/80 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* 2 Columns: Form on LEFT, Smartphone illustration on RIGHT left unobstructed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
            
            {/* Left Column: Form & Contact Info */}
            <div className="lg:col-span-7 space-y-8">
              
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-3">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bantuan & Kontak Resmi</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                  Hubungi Tim PasCall
                </h2>
                <p className="text-slate-300 text-base sm:text-lg">
                  Butuh informasi pendaftaran, kendala verifikasi, atau panduan instalasi? 
                  Kirimkan pesan kepada helpdesk resmi kami.
                </p>
              </div>

              {/* Contact Form with Glassmorphism */}
              <div className="p-8 rounded-3xl bg-[#09152e]/85 backdrop-blur-md border border-white/10 shadow-2xl">
                {formSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">Pesan Anda Berhasil Terkirim!</h3>
                    <p className="text-sm text-slate-300">
                      Tim bantuan kami akan segera menghubungi Anda melalui nomor telepon / WhatsApp yang dicantumkan.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Masukkan nama Anda"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500 text-sm transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Nomor Telepon / WA
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Contoh: 08123456789"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500 text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Kategori Pengguna
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#09152e] border border-white/15 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white text-sm transition-all"
                      >
                        <option value="keluarga">Keluarga Warga Binaan</option>
                        <option value="petugas">Petugas Lapas / Rutan</option>
                        <option value="institusi">Institusi / Mitra Resmi</option>
                        <option value="lainnya">Pertanyaan Umum Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Pesan atau Kendala
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tuliskan pesan Anda secara jelas..."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500 text-sm transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-blue-700 hover:from-cyan-400 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Pesan Sekarang</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Contacts Info Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-medium">Call Center</div>
                    <div className="text-xs font-bold text-white">0800-1-PASCALL</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-medium">Email Bantuan</div>
                    <div className="text-xs font-bold text-white">support@pascall.id</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-medium">Jam Layanan</div>
                    <div className="text-xs font-bold text-white">24/7 Siaga Bantuan</div>
                  </div>
                </div>
              </div>

              {/* Download App Badges placed on the LEFT */}
              <div className="p-6 rounded-2xl bg-[#09152e]/80 backdrop-blur-md border border-white/10 max-w-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span>Aplikasi Mobile PasCall</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Tersedia untuk smartphone Android & iOS bagi keluarga warga binaan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-cyan-400/50 transition-all">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <div className="text-left leading-tight">
                        <div className="text-[9px] uppercase text-slate-400 font-medium">GET IT ON</div>
                        <div className="text-xs font-bold text-white">Google Play</div>
                      </div>
                    </div>
                    <div className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-cyan-400/50 transition-all">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <div className="text-left leading-tight">
                        <div className="text-[9px] uppercase text-slate-400 font-medium">DOWNLOAD ON</div>
                        <div className="text-xs font-bold text-white">App Store</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Kept COMPLETELY EMPTY to showcase the Smartphone Illustration in background */}
            <div className="hidden lg:block lg:col-span-5 pointer-events-none min-h-[480px]" />

          </div>

          {/* ========================================================================= */}
          {/* FOOTER (Using natural divider from background)                            */}
          {/* ========================================================================= */}
          <footer className="pt-10 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-sm">
                Pas<span className="text-cyan-400">Call</span>
              </span>
              <span className="text-slate-500">|</span>
              <span>© {new Date().getFullYear()} Hak Cipta Dilindungi Undang-Undang.</span>
            </div>

            <div className="flex items-center gap-6">
              <a href="#hero" className="hover:text-cyan-400 transition-colors">Beranda</a>
              <a href="#penjelasan" className="hover:text-cyan-400 transition-colors">Tentang</a>
              <a href="#fitur" className="hover:text-cyan-400 transition-colors">Fitur</a>
              <a href="#cara-kerja" className="hover:text-cyan-400 transition-colors">Cara Kerja</a>
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Portal Login</Link>
            </div>

          </footer>

        </div>
      </section>

    </div>
  );
}
