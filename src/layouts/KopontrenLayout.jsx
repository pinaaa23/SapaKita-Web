import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  History, 
  PhoneCall, 
  LogOut, 
  User, 
  X, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/Topbar';
import WartelBadgeSidebar from '../components/kopontren/WartelBadgeSidebar';
import sapakitaLogoWhite from '../assets/logo_sapakita_white.png';
import sapakitaIcon from '../assets/icon_sapakita.png';

/**
 * KopontrenLayout - Layout resmi untuk halaman Operator Kopontren.
 * Mengadopsi arsitektur Layout & Sidebar standar SapaKita (Modern Floating Gradient Pill Sidebar).
 */
export default function KopontrenLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userName, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sapakita_kopontren_sidebar_open');
    return saved !== null ? saved === 'true' : false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sapakita_kopontren_sidebar_open', isSidebarOpen);
  }, [isSidebarOpen]);

  // Tutup drawer mobile otomatis setiap berpindah rute
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { to: '/kopontren', label: 'Paket Voucher', icon: ShoppingBag, end: true },
    { to: '/kopontren/kontak', label: 'Kontak Wali Santri', icon: Users, end: false },
    { to: '/kopontren/status-wartel', label: 'Status Wartel Santri', icon: PhoneCall, end: false },
    { to: '/kopontren/riwayat', label: 'Riwayat Penjualan', icon: History, end: false },
  ];

  const displayName = userName || user?.name || user?.email || 'Operator Kopontren';
  const displayEmail = user?.email || '';
  const isExpandedView = isSidebarOpen || isMobileMenuOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F4F1] via-[#EDF6F7] to-[#F1F8FA] font-sans text-slate-900 flex relative overflow-x-hidden w-full max-w-full">

      {/* Backdrop Gelap saat Drawer Mobile Terbuka */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR NAVIGASI */}
      <aside className={`fixed left-3.5 top-3.5 bottom-3.5 md:left-6 md:top-6 md:bottom-6 z-50 transition-all duration-300 ${
        isMobileMenuOpen ? 'translate-x-0 w-64 max-w-[85vw]' : '-translate-x-[150%] md:translate-x-0'
      } ${isSidebarOpen ? 'md:w-56' : 'md:w-[80px]'}`}>

        {/* Toggle Button di tepi sidebar (Desktop only) */}
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          aria-label="Toggle Sidebar"
          className="hidden md:flex absolute -right-3 top-14 z-50 w-6 h-6 bg-white text-[#0E7A74] rounded-full items-center justify-center shadow-md hover:bg-slate-50 hover:scale-110 transition-all cursor-pointer border border-teal-100"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 text-[#0E7A74]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#0E7A74]" />
          )}
        </button>

        {/* Main Floating Gradient Sidebar Container (Inverted Soft Blue-Green Theme) */}
        <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-[#1F5F8B] via-[#16707C] to-[#0D7A73] text-white flex flex-col shadow-2xl overflow-hidden select-none">
          
          {/* 1. Header: Logo SapaKita on top, Role underneath */}
          <div className={`pt-4 pb-2 transition-all duration-300 flex items-center ${isExpandedView ? 'justify-between pl-4.5 pr-3.5' : 'justify-center px-2'}`}>
            {isExpandedView ? (
              <div className="flex flex-col items-start min-w-0 overflow-hidden w-full">
                {/* Logo SapaKita */}
                <div className="flex items-center w-full">
                  <img 
                    src={sapakitaLogoWhite} 
                    alt="SapaKita" 
                    className="w-[136px] max-w-full h-auto object-contain object-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.22)]" 
                  />
                </div>
                {/* Role Label underneath Logo */}
                <p className="text-[11px] text-teal-100/90 font-medium tracking-wide mt-1.5 truncate max-w-full">
                  Operator Kopontren
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-1">
                <img 
                  src={sapakitaIcon} 
                  alt="SapaKita" 
                  className="w-8 h-8 object-contain drop-shadow-md" 
                />
              </div>
            )}
            {/* Tombol X untuk close drawer di layar mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Tutup Menu"
              className="md:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thin Divider Line */}
          <div className="mx-3.5 mb-2 mt-0.5">
            <div className="border-b border-white/15 w-full"></div>
          </div>

          {/* 2. Menu Items Container */}
          <div className="flex-1 overflow-y-auto py-1 flex flex-col gap-1.5 px-0 no-scrollbar [&::-webkit-scrollbar]:hidden">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={!isExpandedView ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center transition-all duration-300 ${
                      !isExpandedView
                        ? `mx-auto w-10 h-10 justify-center rounded-2xl relative ${
                            isActive
                              ? 'bg-white text-[#0E7A74] shadow-md font-bold'
                              : 'text-teal-100 hover:bg-white/10 hover:text-white'
                          }`
                        : `mx-3 px-3.5 py-[9px] gap-3 rounded-2xl ${
                            isActive
                              ? 'bg-white text-[#0E7A74] shadow-md font-bold'
                              : 'text-teal-100 hover:bg-white/10 hover:text-white'
                          }`
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative shrink-0 flex items-center justify-center">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0E7A74]' : 'text-teal-200'}`} />
                      </div>
                      {isExpandedView && (
                        <span className="whitespace-nowrap text-sm font-medium flex-1 truncate">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Badges Ringkas Wartel Santri */}
            {isExpandedView && (
              <div className="mx-3 mt-1.5 mb-1 p-1 bg-white/10 rounded-2xl">
                <WartelBadgeSidebar isDarkTheme={true} />
              </div>
            )}
          </div>

          {/* 3. Footer Sidebar */}
          <div className={`pb-4.5 pt-1.5 mt-auto shrink-0 z-20 transition-all duration-300 ${!isExpandedView ? 'px-2 flex flex-col items-center gap-2' : 'px-0 flex flex-col gap-1'}`}>
            {isExpandedView ? (
              <div className="mx-3 p-3 bg-white/10 rounded-2xl flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <p className="text-[10px] text-teal-200 truncate">{displayEmail || 'Operator Kopontren'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-11 h-11 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-white mb-1" title={displayName}>
                <User className="w-5 h-5" />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              title={!isExpandedView ? "Keluar" : undefined}
              className={`flex items-center transition-colors rounded-2xl text-red-300 hover:bg-white/10 hover:text-red-200 cursor-pointer ${
                !isExpandedView 
                  ? 'w-11 h-11 justify-center p-0 mx-auto' 
                  : 'mx-3 px-3.5 py-2.5 gap-3'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {isExpandedView && <span className="whitespace-nowrap text-sm font-medium">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA APLIKASI */}
      <div className={`flex flex-col min-h-screen w-full min-w-0 max-w-full transition-all duration-300 px-3.5 sm:px-6 py-4 md:py-6 md:pr-6 ${isSidebarOpen ? 'md:pl-[264px]' : 'md:pl-[120px]'}`}>
        <Topbar 
          toggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
          isSidebarOpen={isSidebarOpen} 
          toggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 pt-2 pb-6 min-w-0 w-full max-w-full">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
