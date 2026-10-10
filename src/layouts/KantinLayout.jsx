import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  History, 
  PhoneCall, 
  LogOut, 
  User, 
  Store, 
  Calendar, 
  Wallet,
  Bell,
  CheckCircle2,
  X
} from 'lucide-react';
import { formatTanggal } from '../utils/formatKantin';
import { useAuth } from '../context/AuthContext';
import WartelBadgeSidebar from '../components/kantin/WartelBadgeSidebar';
import SaldoBadgeSidebar from '../components/kantin/SaldoBadgeSidebar';
import { getUnreadApprovedTopupCountSync } from '../services/kantin/saldoService';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/notificationService';

/**
 * KantinLayout - Layout khusus untuk halaman Operator Kantin.
 * Hanya dipakai untuk route /kantin/*.
 * Dilengkapi badge angka notifikasi dana top up masuk & notification bell realtime.
 */
export default function KantinLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userName, logout } = useAuth();

  // State notifikasi & badge dana masuk
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('all'); // 'all' | 'unread'
  const notifRef = useRef(null);

  const fetchNotifData = async () => {
    try {
      const list = await getNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Gagal mengambil notifikasi kantin:', err);
    }
  };

  useEffect(() => {
    fetchNotifData();

    const handleUpdate = () => {
      fetchNotifData();
    };

    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('pascall_notification_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(fetchNotifData, 6000);

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('pascall_notification_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
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

  // Tentukan judul halaman berdasarkan route saat ini
  const getJudulHalaman = () => {
    const path = location.pathname;
    if (path === '/kantin' || path === '/kantin/') return 'Katalog Paket Komunikasi';
    if (path.startsWith('/kantin/status-wartel')) return 'Status Wartel Lapas';
    if (path.startsWith('/kantin/riwayat')) return 'Rekap & Riwayat Transaksi';
    if (path.startsWith('/kantin/top-up-saldo')) return 'Top Up Saldo Kantin';
    if (path.startsWith('/kantin/struk')) return 'Struk Bukti Transaksi';
    if (path.startsWith('/kantin/voucher')) return 'Voucher Transaksi';
    return 'PasCall Kantin';
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sesi Kasir Operator?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const menuItems = [
    { to: '/kantin', label: 'Paket', icon: ShoppingBag, end: true },
    { to: '/kantin/status-wartel', label: 'Status Wartel', icon: PhoneCall, end: false },
    { to: '/kantin/riwayat', label: 'Riwayat', icon: History, end: false },
    { to: '/kantin/top-up-saldo', label: 'Top Up Saldo', icon: Wallet, end: false, isTopup: true },
  ];

  // Tampilkan email atau nama user
  const displayName = userName || user?.name || user?.email || 'Operator Kantin';
  const displayEmail = user?.email || '';

  return (
    <div className="h-screen max-h-screen bg-[#F5F7FA] flex flex-col md:flex-row text-[#1E293B] w-full max-w-full overflow-hidden">

      {/* SIDEBAR DESKTOP / TABLET (Hidden on Mobile) */}
      <aside className="no-print hidden md:flex flex-col w-64 bg-white border-r border-[#E2E8F0] shrink-0 h-full max-h-screen z-30 overflow-hidden select-none">
        {/* Logo Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1565C0] to-[#0D47A1] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline font-black text-lg tracking-tight leading-none">
                <span className="text-[#1E293B]">Pas</span>
                <span className="text-[#1565C0]">Call</span>
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mt-0.5">
                Kantin Lapas
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menus (Paket, Status Wartel, Riwayat, Top Up Saldo) */}
        <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Petugas
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.isTopup && unreadApprovedCount > 0;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 relative ${
                    isActive
                      ? 'bg-[#E3F2FD] text-[#1565C0] shadow-2xs'
                      : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors shrink-0 ${
                        isActive ? 'text-[#1565C0]' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>

                    {/* Badge angka notifikasi dana masuk */}
                    {showBadge && (
                      <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] text-[10px] font-extrabold bg-emerald-500 text-white rounded-full shadow-xs animate-pulse shrink-0">
                        {unreadApprovedCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Badge Ringkas Status Wartel di Bawah Menu Navigasi */}
          <div className="pt-3 px-0.5">
            <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ketersediaan Unit
            </div>
            <WartelBadgeSidebar />
          </div>

          {/* Badge Saldo Kantin */}
          <div className="pt-2 px-0.5">
            <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Kantin
            </div>
            <SaldoBadgeSidebar />
          </div>
        </nav>

        {/* Footer Sidebar: Info Operator & Tombol Logout */}
        <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/70 space-y-2 shrink-0 mt-auto">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1565C0] flex items-center justify-center font-bold shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate" title={displayEmail}>
                  {displayEmail || 'Operator Kantin'}
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition cursor-pointer border border-rose-200/60 shadow-2xs"
            title="Keluar dari sesi kasir"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 h-full max-h-screen overflow-y-auto pb-20 md:pb-6 relative">
        {/* TOPBAR */}
        <header className="no-print bg-white border-b border-[#E2E8F0] sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-3">
            {/* Brand icon on mobile */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1565C0] text-white flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-800">
                Pas<span className="text-[#1565C0]">Call</span>
              </span>
            </div>
            <h1 className="hidden sm:block text-base font-bold text-slate-800">
              {getJudulHalaman()}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-[#1565C0]" />
              <span>{formatTanggal(new Date(), false)}</span>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Notifikasi"
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-center shadow-xs border border-slate-200/80 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {/* Notif Popover Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
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
                            {n.type === 'canteen_topup_approved' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : n.type === 'canteen_topup_rejected' ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Wallet className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-xs ${
                                  !n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
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

            {/* Mobile Logout Quick Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="md:hidden p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* OUTLET KONTEN */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* BOTTOM NAVIGATION FOR MOBILE (Paket, Status Wartel, Riwayat, Top Up Saldo) */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40 px-3 py-2 flex justify-around shadow-lg">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const showBadge = item.isTopup && unreadApprovedCount > 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 sm:px-5 rounded-xl transition font-bold text-xs ${
                  isActive
                    ? 'text-[#1565C0]'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition relative ${
                      isActive ? 'bg-[#E3F2FD]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {showBadge && (
                      <>
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </>
                    )}
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}