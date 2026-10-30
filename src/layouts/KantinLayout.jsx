import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  History, 
  PhoneCall, 
  LogOut, 
  User, 
  Calendar, 
  Wallet, 
  Bell, 
  CheckCircle2, 
  X, 
  Users,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatTanggal } from '../utils/formatKantin';
import { getAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import WartelBadgeSidebar from '../components/kantin/WartelBadgeSidebar';
import SaldoBadgeSidebar from '../components/kantin/SaldoBadgeSidebar';
import sadewaBlue from '../assets/sadewa_blue.png';
import ikonSadewa from '../assets/ikon_sadewa.png';
import { getUnreadApprovedTopupCountSync } from '../services/kantin/saldoService';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notificationService';

/**
 * KantinLayout - Layout khusus untuk halaman Operator Kantin.
 * Mengadopsi arsitektur Sidebar Superadmin (Modern Floating Gradient Pill Sidebar).
 * Dilengkapi notifikasi realtime, status wartel, dan saldo pascabayar.
 */
export default function KantinLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userName, logout } = useAuth();

  // Sidebar toggle state (seperti Superadmin)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('pascall_kantin_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pascall_kantin_sidebar_open', isSidebarOpen);
  }, [isSidebarOpen]);

  // Tutup drawer mobile otomatis setiap berpindah rute
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // State notifikasi & badge dana masuk
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('all'); // 'all' | 'unread'
  const notifRef = useRef(null);
  const mainContentRef = useRef(null);

  // Auto reset scroll ke atas setiap berpindah halaman di kantin
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const isFetchingNotifRef = useRef(false);

  const fetchNotifData = async () => {
    if (isFetchingNotifRef.current) return;
    if (!getAuthToken()) { setNotifications([]); return; }
    isFetchingNotifRef.current = true;
    try {
      const list = await getNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Gagal mengambil notifikasi kantin:', err);
    } finally {
      isFetchingNotifRef.current = false;
    }
  };

  useEffect(() => {
    fetchNotifData();

    const handleUpdate = () => {
      fetchNotifData();
    };

    const handleStorage = (e) => {
      if (e && e.key && (e.key.includes('notif') || e.key.includes('topup'))) {
        fetchNotifData();
      }
    };

    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('pascall_notification_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(fetchNotifData, 20000);

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('pascall_notification_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const unreadApprovedCount = notifications.filter(
    (n) => !n.read && (n.type?.includes('TOPUP_APPROVED') || n.type === 'canteen_topup_approved')
  ).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id) => {
    markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeNotifTab === 'unread') return !n.read;
    return true;
  });

  // Tentukan info halaman (badge, judul, dan subtitle/keterangan) berdasarkan route
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/kantin' || path === '/kantin/') {
      return {
        badge: 'Katalog Voucher',
        title: 'Katalog Paket Komunikasi',
        subtitle: 'Pilihan paket telepon dan video call resmi untuk warga binaan pemasyarakatan. Voucher langsung dicetak dan siap digunakan di bilik wartel.',
      };
    }
    if (path.startsWith('/kantin/kontak')) {
      return {
        badge: 'Manajemen Kontak',
        title: 'Kelola Kontak Keluarga WBP',
        subtitle: 'Daftarkan dan tinjau nomor kontak keluarga yang diizinkan untuk setiap warga binaan (maksimal 10 kontak). Sistem otomatis mendeteksi kanal WhatsApp atau GSM Seluler.',
      };
    }
    if (path.startsWith('/kantin/status-wartel')) {
      return {
        badge: 'Monitoring Bilik',
        title: 'Status Ketersediaan Wartel',
        subtitle: 'Pantau ketersediaan bilik wartel secara real-time. Anda dapat menambah, mengedit, atau menyesuaikan jumlah bilik sesuai kondisi fisik wartel cabang.',
      };
    }
    if (path.startsWith('/kantin/riwayat')) {
      return {
        badge: 'Laporan Penjualan',
        title: 'Rekap & Riwayat Penjualan',
        subtitle: 'Laporan rekapitulasi pemasukan omzet penjualan voucher dan daftar riwayat transaksi kasir kantin.',
      };
    }
    if (path.startsWith('/kantin/tagihan') || path.startsWith('/kantin/top-up-saldo')) {
      return {
        badge: 'Sistem Pascabayar',
        title: 'Tagihan Bulanan Kantin',
        subtitle: 'Tagihan bulanan dihitung dari akumulasi durasi paket/voucher yang dibeli WBP di kantin dikalikan tarif per detik dan porsi setoran ke Admin Finance.',
      };
    }
    if (path.startsWith('/kantin/voucher')) {
      return {
        badge: 'Cetak Voucher',
        title: 'Voucher Transaksi',
        subtitle: 'Informasi kode voucher dan instruksi penggunaan bilik telepon wartel.',
      };
    }
    if (path.startsWith('/kantin/struk')) {
      return {
        badge: 'Bukti Transaksi',
        title: 'Struk Transaksi Kasir',
        subtitle: 'Bukti pembelian resmi paket komunikasi kantin.',
      };
    }
    return {
      badge: 'Layanan Kantin',
      title: 'PasCall Kantin',
      subtitle: 'Sistem Layanan Komunikasi Wartel Pemasyarakatan.',
    };
  };

  const pageInfo = getPageInfo();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { to: '/kantin', label: 'Paket Voucher', icon: ShoppingBag, end: true },
    { to: '/kantin/kontak', label: 'Kontak WBP', icon: Users, end: false },
    { to: '/kantin/status-wartel', label: 'Status Wartel', icon: PhoneCall, end: false },
    { to: '/kantin/riwayat', label: 'Riwayat Penjualan', icon: History, end: false },
    { to: '/kantin/tagihan', label: 'Tagihan Bulanan', icon: Wallet, end: false },
  ];

  // Tampilkan email atau nama user
  const displayName = userName || user?.name || user?.email || 'Operator Kantin';
  const displayEmail = user?.email || '';
  const isExpandedView = isSidebarOpen || isMobileMenuOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4EFFC] via-[#EFF5FC] to-[#F8FAFC] font-sans text-slate-900 flex relative overflow-x-hidden w-full max-w-full">

      {/* Backdrop Gelap saat Drawer Mobile Terbuka */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR MODERN (Mengadopsi Layout Sidebar Superadmin) */}
      <aside className={`fixed left-3.5 top-3.5 bottom-3.5 md:left-6 md:top-6 md:bottom-6 z-50 transition-all duration-300 ${
        isMobileMenuOpen ? 'translate-x-0 w-64 max-w-[85vw]' : '-translate-x-[150%] md:translate-x-0'
      } ${isSidebarOpen ? 'md:w-60' : 'md:w-[80px]'}`}>

        {/* Toggle Button on the side edge of sidebar (Desktop only) */}
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          aria-label="Toggle Sidebar"
          className="hidden md:flex absolute -right-3 top-14 z-50 w-6 h-6 bg-white text-[#0B3D91] rounded-full items-center justify-center shadow-md hover:bg-slate-50 hover:scale-110 transition-all cursor-pointer border border-blue-100"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 text-[#0B3D91]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#0B3D91]" />
          )}
        </button>

        {/* Main Floating Gradient Sidebar Container */}
        <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-[#0B3D91] to-[#1E5FCC] text-white flex flex-col shadow-2xl overflow-hidden select-none">
          
          {/* 1. Header / Logo */}
          <div className={`pt-5 pb-3 transition-all duration-300 flex items-center ${isExpandedView ? 'justify-between pl-[24px] pr-4' : 'justify-center px-2'}`}>
            {isExpandedView ? (
              <div className="flex flex-col items-start min-w-0 overflow-hidden">
                <img 
                  src={sadewaBlue} 
                  alt="Sadewa" 
                  className="w-[110px] h-auto object-contain object-left drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" 
                />
                <p className="text-[11px] text-blue-100/90 font-medium tracking-wide mt-1 truncate max-w-full">
                  Operator Kantin
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-1">
                <img 
                  src={ikonSadewa} 
                  alt="Sadewa" 
                  className="w-8 h-8 object-contain drop-shadow-sm" 
                />
              </div>
            )}
            {/* Tombol X untuk close drawer di layar mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Tutup Menu"
              className="md:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thin Divider Line */}
          <div className="mx-4 mb-2">
            <div className="border-b border-white/15 w-full"></div>
          </div>

          {/* 2. Menu Items Container */}
          <nav className="flex-1 min-h-0 overflow-y-auto py-1 px-3 space-y-1.5 no-scrollbar">
            {isExpandedView && (
              <div className="px-3 py-1 text-[10px] font-bold text-blue-200/70 uppercase tracking-wider">
                Menu Petugas
              </div>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.isTopup && unreadApprovedCount > 0;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={!isExpandedView ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center transition-all duration-200 ${
                      !isExpandedView
                        ? `mx-auto w-10 h-10 justify-center rounded-2xl relative ${
                            isActive
                              ? 'bg-white text-[#0B3D91] shadow-md font-bold'
                              : 'text-blue-100 hover:bg-white/10 hover:text-white'
                          }`
                        : `px-3.5 py-2.5 gap-3 rounded-2xl font-semibold text-xs ${
                            isActive
                              ? 'bg-white text-[#0B3D91] shadow-md font-bold'
                              : 'text-blue-100 hover:bg-white/10 hover:text-white'
                          }`
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0B3D91]' : 'text-blue-200'}`} />
                      {isExpandedView && <span className="truncate">{item.label}</span>}

                      {/* Badge angka notifikasi dana masuk */}
                      {showBadge && (
                        <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] text-[10px] font-extrabold bg-emerald-400 text-slate-900 rounded-full shadow-xs animate-pulse shrink-0">
                          {unreadApprovedCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Badges Ringkas Kantin (Ketersediaan Unit & Tagihan Pascabayar) */}
            {isExpandedView && (
              <>
                <div className="pt-3 px-1">
                  <div className="px-2 pb-1.5 text-[10px] font-bold text-blue-200/70 uppercase tracking-wider">
                    Ketersediaan Unit
                  </div>
                  <WartelBadgeSidebar isDarkTheme={true} />
                </div>

                <div className="pt-2 px-1">
                  <div className="px-2 pb-1.5 text-[10px] font-bold text-blue-200/70 uppercase tracking-wider">
                    Tagihan Pascabayar
                  </div>
                  <SaldoBadgeSidebar isDarkTheme={true} />
                </div>
              </>
            )}
          </nav>

          {/* 3. Footer Sidebar: Info Operator & Tombol Logout */}
          <div className={`p-3.5 bg-black/10 border-t border-white/10 space-y-2 shrink-0 mt-auto ${!isExpandedView ? 'px-2' : ''}`}>
            {isExpandedView ? (
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate" title={displayName}>
                      {displayName}
                    </div>
                    <div className="text-[10px] text-blue-200 truncate" title={displayEmail}>
                      {displayEmail || 'Operator Kantin'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-white" title={displayName}>
                <User className="w-4 h-4" />
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 rounded-xl transition cursor-pointer border border-rose-400/20 shadow-xs ${
                !isExpandedView ? 'w-10 h-10 p-0 mx-auto' : 'w-full'
              }`}
              title="Keluar dari sesi kasir"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isExpandedView && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA APLIKASI */}
      <div 
        ref={mainContentRef}
        className={`flex-1 flex flex-col min-w-0 min-h-screen max-w-full transition-all duration-300 px-3.5 sm:px-6 py-4 md:py-6 md:pr-6 ${
          isSidebarOpen ? 'md:pl-[272px]' : 'md:pl-[112px]'
        }`}
      >
        {/* HEADER JUDUL HALAMAN: Langsung judul bersih tanpa box background */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-1">
          <div className="flex items-start sm:items-center gap-3">
            {/* Hamburger Button untuk Mobile Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka Menu"
              className="md:hidden w-10 h-10 rounded-2xl bg-white text-slate-700 hover:text-blue-600 flex items-center justify-center shadow-xs border border-slate-200/80 shrink-0 cursor-pointer transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100/80 text-blue-800 border border-blue-200/60">
                  {pageInfo.badge}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">Kantin</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {pageInfo.title}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Fitur Tanggal & Notifikasi Bell (Sejajar dengan Judul) */}
          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-2xs">
              <Calendar className="w-4 h-4 text-[#1565C0]" />
              <span>{formatTanggal(new Date(), false)}</span>
            </div>

            {/* Notification Bell Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Notifikasi"
                className="relative w-10 h-10 rounded-2xl bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-center shadow-2xs border border-slate-200/90 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {/* Notif Popover Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">Notifikasi Kantin</h4>
                      {unreadNotifCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                          {unreadNotifCount} baru
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex px-4 pt-2 border-b border-slate-100 gap-4 text-xs font-semibold text-slate-500">
                    <button
                      onClick={() => setActiveNotifTab('all')}
                      className={`pb-2 border-b-2 transition cursor-pointer ${
                        activeNotifTab === 'all'
                          ? 'border-[#1565C0] text-[#1565C0] font-bold'
                          : 'border-transparent hover:text-slate-700'
                      }`}
                    >
                      Semua ({notifications.length})
                    </button>
                    <button
                      onClick={() => setActiveNotifTab('unread')}
                      className={`pb-2 border-b-2 transition cursor-pointer ${
                        activeNotifTab === 'unread'
                          ? 'border-[#1565C0] text-[#1565C0] font-bold'
                          : 'border-transparent hover:text-slate-700'
                      }`}
                    >
                      Belum Dibaca ({unreadNotifCount})
                    </button>
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {filteredNotifs.length > 0 ? (
                      filteredNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            handleToggleRead(n.id);
                            if (n.link) {
                              navigate(n.link);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`px-4 py-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start gap-3 relative ${
                            !n.read ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          {!n.read && (
                            <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === 'canteen_topup_approved'
                                ? 'bg-emerald-100 text-emerald-600'
                                : n.type === 'canteen_topup_rejected'
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-blue-100 text-[#1565C0]'
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p
                                className={`text-xs truncate ${
                                  !n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                                }`}
                              >
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
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 px-3 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OUTLET KONTEN */}
        <main className="flex-1 w-full max-w-full">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
