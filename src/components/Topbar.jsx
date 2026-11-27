import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, UserCircle, LogOut, User, X, ArrowLeft, Wallet, Menu } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import { ROLES } from '../config/menuConfig';
import { getAuthToken } from '../services/api';

const Topbar = ({ toggleMobileMenu }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isBranchAdmin = location.pathname === '/branch' || location.pathname.startsWith('/branch/');
  const { role: normRole, roleLabel: userRole, userName, uptName, user, logout } = useAuth();
  const isKanwilUser = normRole === ROLES.ADMIN_KANWIL || location.pathname.startsWith('/kanwil');
  const isFinanceUser = normRole === ROLES.FINANCE || location.pathname.startsWith('/finance');
  const profileLink = isBranchAdmin ? '/branch/profile' : (isKanwilUser ? '/kanwil/profile' : '/profile');

  const getPageDetails = (pathname) => {
    // Yayasan / Kanwil Admin Page Details
    const activeKanwilName =
      user?.kanwilName ||
      user?.kanwil?.name ||
      'Yayasan Pesantren';

    if (pathname.startsWith('/kanwil/branches/create')) return { title: 'Tambah Pondok Pesantren', subtitle: `Daftarkan pondok pesantren baru di bawah naungan ${activeKanwilName}` };
    if (pathname.startsWith('/kanwil/branches')) return { title: 'Daftar Pondok Pesantren', subtitle: `Pondok pesantren binaan di bawah naungan ${activeKanwilName}` };
    if (pathname.startsWith('/kanwil/santri') || pathname.startsWith('/kanwil/inmates')) return { title: 'Data Santri', subtitle: `Daftar seluruh santri/santriwati di ${activeKanwilName}` };
    if (pathname.startsWith('/kanwil/calls')) return { title: 'Panggilan', subtitle: `Log aktivitas panggilan dan rekaman audio seluruh pondok di ${activeKanwilName}` };
    if (pathname.startsWith('/kanwil/canteen-topup')) return { title: 'Tagihan Kopontren', subtitle: `Laporan tagihan bulanan kopontren seluruh pondok di ${activeKanwilName}` };
    if (pathname.startsWith('/kanwil/reports')) return { title: 'Laporan', subtitle: `Laporan & analitik performa seluruh pondok di ${activeKanwilName}` };
    if (pathname.startsWith('/kanwil/profile')) return { title: 'Profil Yayasan', subtitle: 'Informasi akun & pengaturan profil yayasan' };
    if (pathname === '/kanwil' || pathname === '/kanwil/' || pathname.startsWith('/kanwil/dashboard')) {
      return { title: 'Dashboard', subtitle: `Selamat Datang, ${activeKanwilName}!` };
    }

    // Branch / Pondok Admin Page Details
    if (pathname.startsWith('/branch/santri/create') || pathname.startsWith('/branch/inmates/create')) return { title: 'Tambah Santri Baru', subtitle: 'Form pendaftaran santri baru dan input NIS' };
    if (pathname.includes('/edit') && (pathname.startsWith('/branch/santri') || pathname.startsWith('/branch/inmates'))) return { title: 'Edit Data Santri', subtitle: 'Perbarui informasi & data santri/santriwati' };
    if (pathname.startsWith('/branch/santri/') || pathname.startsWith('/branch/inmates/')) return { title: 'Detail Santri', subtitle: 'Informasi lengkap data santri, asrama, dan kontak wali' };
    if (pathname.startsWith('/branch/santri') || pathname.startsWith('/branch/inmates')) return { title: 'Data Santri', subtitle: uptName ? `Kelola data santri di ${uptName}` : 'Kelola data santri di pondok pesantren Anda' };

    if (pathname.startsWith('/branch/cctv')) return { title: 'Pemantauan CCTV', subtitle: uptName ? `Monitoring siaran langsung CCTV bilik wartel dan area antrean santri di ${uptName}` : 'Monitoring siaran langsung CCTV bilik wartel dan arsip rekaman video' };
    if (pathname.startsWith('/branch/recordings')) return { title: 'Rekaman Panggilan', subtitle: 'Log aktivitas panggilan, audio player, dan transkrip AI Whisper santri' };
    if (pathname.startsWith('/branch/contacts')) return { title: 'Persetujuan Kontak Wali Santri', subtitle: 'Verifikasi nomor telepon orang tua/wali santri' };
    if (pathname.startsWith('/branch/users')) return { title: 'Kelola Pengguna Pondok', subtitle: 'Manajemen akun Supervisor Kesantrian dan Operator Kopontren' };
    if (pathname.startsWith('/branch/packages')) return { title: 'Kelola Paket', subtitle: uptName ? `Atur tarif dan durasi paket panggilan santri di ${uptName}` : 'Atur tarif dan paket layanan komunikasi untuk kasir Kopontren dan santri' };
    if (pathname.startsWith('/branch/transactions')) return { title: 'Riwayat Transaksi', subtitle: 'Data transaksi voucher & pembayaran kopontren' };
    if (pathname.startsWith('/branch/reports')) return { title: 'Laporan & Analitik', subtitle: 'Ringkasan performa & statistik komunikasi santri pondok' };
    if (pathname.startsWith('/branch/profile')) return { title: 'Profil Pengguna', subtitle: 'Informasi akun & pengaturan profil staf pondok' };
    if (pathname === '/branch' || pathname === '/branch/' || pathname === '/branch/dashboard' || pathname.startsWith('/branch/dashboard')) {
      const greetingName = userName || userRole || (normRole === ROLES.SUPERVISOR ? 'Supervisor' : 'Pimpinan Pondok');
      return { title: 'Dashboard', subtitle: greetingName ? `Selamat Datang, ${greetingName}!` : 'Selamat Datang di SapaKita!' };
    }
    
    // Superadmin Page Details
    if (pathname.startsWith('/branches/create')) return { title: 'Tambah Pondok Pesantren', subtitle: 'Daftarkan pondok pesantren baru ke sistem' };
    if (pathname.includes('/edit') && pathname.startsWith('/branches')) return { title: 'Edit Pondok Pesantren', subtitle: 'Perbarui data operasional pondok pesantren' };
    if (pathname.startsWith('/branches/')) return { title: 'Detail Pondok Pesantren', subtitle: 'Informasi operasional & data pondok pesantren' };
    if (pathname.startsWith('/branches')) return { title: 'Manajemen Pondok Pesantren', subtitle: 'Kelola data operasional seluruh pondok pesantren yang terdaftar' };

    if (pathname.startsWith('/yayasan-management') || pathname.startsWith('/kanwil-management')) return { title: 'Manajemen Yayasan Pesantren', subtitle: 'Kelola Yayasan / Pengurus Pusat sebagai induk pembina pondok pesantren' };
    if (pathname.startsWith('/finance-accounts')) return { title: 'Admin Keuangan', subtitle: 'Kelola akun tim keuangan SapaKita untuk memantau tagihan dan setoran' };

    if (pathname.startsWith('/santri/') || pathname.startsWith('/inmates/')) return { title: 'Detail Santri', subtitle: 'Informasi lengkap data santri' };
    if (pathname.startsWith('/santri') || pathname.startsWith('/inmates')) return { title: 'Data Santri', subtitle: 'Seluruh santri/santriwati di semua pondok pesantren' };

    if (pathname.startsWith('/calls/')) return { title: 'Detail Rekaman Panggilan', subtitle: 'Informasi panggilan & pemutaran rekaman audio' };
    if (pathname.startsWith('/calls')) return { title: 'Riwayat Panggilan', subtitle: 'Catatan panggilan seluruh pondok pesantren' };

    if (pathname.startsWith('/transactions/')) return { title: 'Detail Transaksi', subtitle: 'Rincian transaksi & status pembayaran voucher' };
    if (pathname.startsWith('/transactions')) return { title: 'Transaksi Voucher', subtitle: 'Rekapitulasi penjualan voucher kopontren' };

    if (pathname.startsWith('/packages')) return { title: 'Katalog Paket Pondok', subtitle: 'Monitoring tarif, durasi, dan status paket panggilan seluruh pondok pesantren' };
    if (pathname.startsWith('/canteen-topup')) return { title: 'Tagihan Kopontren', subtitle: 'Laporan tagihan bulanan seluruh pondok pesantren, penggunaan detik bicara, dan verifikasi transfer' };

    if (pathname.startsWith('/reports')) return { title: 'Laporan & Analitik', subtitle: 'Statistik & analitik agregat seluruh pondok pesantren' };
    if (pathname.startsWith('/profile')) return { title: 'Profil Superadmin', subtitle: 'Kelola informasi akun & preferensi sistem' };

    // Finance Admin Page Details
    if (pathname.startsWith('/finance/billing') || pathname === '/billing') {
      return { 
        title: 'Tagihan & Setoran', 
        subtitle: 'Konfirmasi setoran kasir kopontren, rekapitulasi penagihan bulanan seluruh pondok, dan riwayat verifikasi' 
      };
    }
    if (pathname.startsWith('/contracts') || pathname.startsWith('/finance/contracts')) {
      return { 
        title: 'Kontrak Bagi Hasil', 
        subtitle: 'Pengaturan persentase bagi hasil platform vs pesantren dan tarif per detik dasar' 
      };
    }
    if (pathname.startsWith('/finance/reports')) {
      return { 
        title: 'Laporan Keuangan', 
        subtitle: 'Rekapitulasi pembagian hasil platform dan performa penerimaan omset kopontren' 
      };
    }
    if (pathname.startsWith('/finance/dashboard') || pathname === '/finance' || pathname === '/finance/') {
      return { 
        title: 'Dashboard Keuangan', 
        subtitle: 'Ringkasan performa finansial, omset tagihan, dan status setoran kopontren' 
      };
    }

    // Kopontren Page Details
    if (pathname.startsWith('/kopontren/kontak') || pathname.startsWith('/kantin/kontak')) {
      return {
        title: 'Kelola Kontak Wali Santri',
        subtitle: 'Daftarkan nomor telepon orang tua/wali santri (maksimal 10 kontak per santri)',
      };
    }
    if (pathname.startsWith('/kopontren/status-wartel') || pathname.startsWith('/kantin/status-wartel')) {
      return {
        title: 'Status Ketersediaan Wartel',
        subtitle: 'Pantau ketersediaan bilik wartel santri secara real-time di pondok pesantren',
      };
    }
    if (pathname.startsWith('/kopontren/riwayat') || pathname.startsWith('/kantin/riwayat')) {
      return {
        title: 'Rekap & Riwayat Penjualan',
        subtitle: 'Laporan pemasukan omzet penjualan voucher dan transaksi kasir Kopontren',
      };
    }
    if (pathname.startsWith('/kopontren/tagihan') || pathname.startsWith('/kopontren/top-up-saldo') || pathname.startsWith('/kantin/tagihan')) {
      return {
        title: 'Tagihan Bulanan Kopontren',
        subtitle: 'Rekapitulasi tagihan pascabayar per detik bicara dan konfirmasi setoran ke platform',
      };
    }
    if (pathname.startsWith('/kopontren/voucher') || pathname.startsWith('/kantin/voucher')) {
      return {
        title: 'Voucher Transaksi',
        subtitle: 'Informasi kode voucher 5 karakter unik dan instruksi login bilik santri',
      };
    }
    if (pathname.startsWith('/kopontren/struk') || pathname.startsWith('/kantin/struk')) {
      return {
        title: 'Struk Transaksi Kasir',
        subtitle: 'Bukti pembelian resmi paket komunikasi santri di Kopontren',
      };
    }
    if (pathname === '/kopontren' || pathname === '/kopontren/' || pathname === '/kantin' || pathname === '/kantin/') {
      return {
        title: 'Katalog Paket Komunikasi',
        subtitle: 'Pilihan paket telepon suara dan video call santri di Koperasi Pondok Pesantren',
      };
    }

    return { title: 'Dashboard Overview', subtitle: 'Ringkasan operasional ekosistem SapaKita seluruh pesantren' };
  };

  const pageDetails = getPageDetails(location.pathname);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('all');
  
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const fetchNotifs = async () => {
    const token = getAuthToken();
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const notifList = await getNotifications();
      setNotifications(Array.isArray(notifList) ? notifList : []);
    } catch (err) {
      console.log('[Topbar] Gagal mengambil notifikasi:', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifs();

    const handleUpdate = () => {
      fetchNotifs();
    };

    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('pascall_notification_updated', handleUpdate);
    const handleStorage = (e) => {
      if (e?.key && !['notifications', 'pascall_notifications'].includes(e.key)) return;
      if (getAuthToken()) {
        fetchNotifs();
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(fetchNotifs, 6000);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('pascall_notification_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Search Items List (Navigation only)
  const searchDatabase = isBranchAdmin ? [
    { title: 'Data Santri', category: 'Halaman', link: '/branch/santri', desc: 'Kelola data santri, NIS, & asrama' },
    { title: 'Tambah Santri Baru', category: 'Aksi Cepat', link: '/branch/santri/create', desc: 'Daftarkan santri baru / import excel' },
    { title: 'Pemantauan CCTV', category: 'Halaman', link: '/branch/cctv', desc: 'Siaran langsung CCTV bilik wartel santri' },
    ...(normRole === ROLES.KEPALA_UPT || normRole === ROLES.SUPERADMIN ? [
      { title: 'Rekaman Panggilan', category: 'Halaman', link: '/branch/recordings', desc: 'Pemutaran rekaman audio & transkrip AI Whisper santri' },
      { title: 'Kelola Pengguna', category: 'Halaman', link: '/branch/users', desc: 'Kelola akun Supervisor & Operator Kopontren' },
    ] : []),
    ...(normRole === ROLES.SUPERVISOR ? [
      { title: 'Kelola Paket', category: 'Halaman', link: '/branch/packages', desc: 'Atur tarif dan paket layanan komunikasi pondok' },
    ] : []),
    { title: 'Riwayat Transaksi', category: 'Halaman', link: '/branch/transactions', desc: 'Data penjualan voucher kopontren' },
    { title: 'Laporan & Analitik Pondok', category: 'Halaman', link: '/branch/reports', desc: 'Statistik panggilan & analitik pondok' },
    { title: 'Profil Pengguna', category: 'Pengaturan', link: '/branch/profile', desc: 'Informasi akun & keamanan pengguna' },
  ] : (isKanwilUser ? [
    { title: 'Dashboard', category: 'Halaman', link: '/kanwil/dashboard', desc: 'Ringkasan operasional pondok binaan yayasan' },
    { title: 'Daftar Pondok Pesantren', category: 'Halaman', link: '/kanwil/branches', desc: 'Daftar pondok pesantren binaan yayasan' },
    { title: 'Data Santri', category: 'Halaman', link: '/kanwil/santri', desc: 'Data seluruh santri se-yayasan' },
    { title: 'Laporan Yayasan', category: 'Halaman', link: '/kanwil/reports', desc: 'Statistik dan performa komunikasi seluruh pondok' },
  ] : [
    { title: 'Yayasan Pesantren', category: 'Halaman', link: '/yayasan-management', desc: 'Kelola Yayasan / Pengurus Pusat' },
    { title: 'Admin Keuangan', category: 'Halaman', link: '/finance-accounts', desc: 'Kelola akun tim keuangan SapaKita' },
    { title: 'Pondok Pesantren', category: 'Halaman', link: '/branches', desc: 'Daftar & status pondok pesantren nasional' },
    { title: 'Data Santri', category: 'Halaman', link: '/santri', desc: 'Daftar santri seluruh pondok pesantren' },
    { title: 'Riwayat Panggilan', category: 'Halaman', link: '/calls', desc: 'Catatan panggilan seluruh pondok pesantren' },
    { title: 'Transaksi Voucher', category: 'Halaman', link: '/transactions', desc: 'Rekapitulasi penjualan voucher kopontren' },
    { title: 'Katalog Paket Pondok', category: 'Halaman', link: '/packages', desc: 'Monitoring paket panggilan seluruh pondok' },
    { title: 'Laporan Pusat', category: 'Halaman', link: '/reports', desc: 'Statistik & analitik agregat' },
    { title: 'Profil Admin Pusat', category: 'Pengaturan', link: '/profile', desc: 'Informasi akun Superadmin' },
  ]);

  const filteredSearchResults = searchValue.trim() === '' 
    ? searchDatabase.slice(0, 5) 
    : searchDatabase.filter(item => 
        item.title.toLowerCase().includes(searchValue.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.category.toLowerCase().includes(searchValue.toLowerCase())
      );

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const markAllAsRead = () => {
    markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleReadNotif = (id) => {
    markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeNotifTab === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="pt-0 pb-3 px-0 flex items-center justify-between gap-2 z-40 relative">
      {/* Left section */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1">
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Buka Menu"
          className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white text-slate-700 hover:text-teal-700 hover:bg-slate-50 flex items-center justify-center shadow-xs border border-slate-200/80 shrink-0 cursor-pointer transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {location.pathname === '/branch/profile' ? (
          <Link 
            to="/branch/dashboard"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 hover:text-teal-700 transition-all bg-white hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs cursor-pointer group shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-700 transition-colors" /> <span className="hidden sm:inline">Kembali ke </span>Dashboard
          </Link>
        ) : location.pathname === '/profile' ? (
          <Link 
            to="/dashboard"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 hover:text-teal-700 transition-all bg-white hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs cursor-pointer group shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-700 transition-colors" /> <span className="hidden sm:inline">Kembali ke </span>Dashboard
          </Link>
        ) : (
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight truncate">{pageDetails.title}</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate hidden sm:block">{pageDetails.subtitle}</p>
          </div>
        )}
      </div>

      {/* Right section: Compact Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        
        {/* Expandable Search Button & Dropdown */}
        <div className="relative flex items-center" ref={searchRef}>
          {isSearchOpen ? (
            <div className="relative">
              <div className="flex items-center bg-white rounded-full shadow-md border border-slate-200/90 px-3 sm:px-3.5 py-1.5 transition-all w-56 sm:w-72 md:w-80 ring-2 ring-teal-600/20">
                <Search className="w-4 h-4 text-teal-700 shrink-0 mr-1.5 sm:mr-2" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-xs text-slate-800 focus:outline-none font-medium"
                />
                <button 
                  onClick={() => { setIsSearchOpen(false); setSearchValue(''); }} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1 p-1 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Instant Search Results Dropdown */}
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {searchValue ? 'Hasil Pencarian' : 'Rekomendasi Menu'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {filteredSearchResults.length} ditemukan
                  </span>
                </div>
                
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          navigate(item.link);
                          setIsSearchOpen(false);
                          setSearchValue('');
                        }}
                        className="px-4 py-2.5 hover:bg-teal-50/60 cursor-pointer transition-colors flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-teal-100 text-slate-500 group-hover:text-teal-700 shrink-0 mt-0.5 transition-colors">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 truncate transition-colors">
                              {item.title}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-400 text-xs">
                      Tidak ada hasil yang sesuai dengan "<span className="font-semibold text-slate-600">{searchValue}</span>"
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              title="Pencarian"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 hover:text-teal-700 flex items-center justify-center shadow-xs border border-slate-200/80 transition-all cursor-pointer hover:shadow-md"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Notifikasi"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 hover:text-teal-700 flex items-center justify-center shadow-xs border border-slate-200/80 transition-all cursor-pointer hover:shadow-md"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="flex px-4 pt-2 border-b border-slate-100 gap-4 text-xs font-semibold text-slate-500">
                <button 
                  onClick={() => setActiveNotifTab('all')}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${
                    activeNotifTab === 'all' 
                      ? 'border-teal-700 text-teal-700 font-bold' 
                      : 'border-transparent hover:text-slate-700'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button 
                  onClick={() => setActiveNotifTab('unread')}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${
                    activeNotifTab === 'unread' 
                      ? 'border-teal-700 text-teal-700 font-bold' 
                      : 'border-transparent hover:text-slate-700'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        toggleReadNotif(n.id);
                        if (n.link) {
                          navigate(n.link);
                          setIsNotificationsOpen(false);
                        }
                      }}
                      className={`px-4 py-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start gap-3 relative group ${
                        !n.read ? (n.type === 'canteen_topup' ? 'bg-amber-50/40' : 'bg-teal-50/40') : ''
                      }`}
                    >
                      {!n.read && (
                        <span className={`absolute left-2 top-4 w-1.5 h-1.5 rounded-full ${
                          n.type === 'canteen_topup' ? 'bg-amber-500' : 'bg-teal-600'
                        }`}></span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'canteen_topup'
                          ? (!n.read ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400')
                          : (!n.read ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400')
                      }`}>
                        {n.type === 'canteen_topup' ? (
                          <Wallet className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5 line-clamp-2">
                          {n.desc}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-slate-400 text-xs">
                    Belum ada notifikasi
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                <button 
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 px-3 cursor-pointer"
                >
                  Tutup Popover
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200/80 mx-1"></div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 bg-white hover:bg-slate-50 p-1.5 pl-3 pr-2.5 rounded-full transition-all border border-slate-200/80 shadow-sm cursor-pointer hover:shadow-md"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
              <p className="text-[10px] text-teal-700 font-semibold">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100 text-teal-700">
              <UserCircle className="w-6 h-6 text-teal-700" />
            </div>
          </div>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-semibold text-slate-800">{userName}</p>
                <p className="text-xs text-teal-700 font-medium">{userRole}</p>
              </div>
              {!isFinanceUser && (
                <>
                  <Link 
                    to={profileLink}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Lihat Profil
                  </Link>
                  <div className="h-px bg-slate-100 my-1"></div>
                </>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
