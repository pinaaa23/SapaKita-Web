import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMenuItemsByRole, normalizeRole, ROLES, ROLE_LABELS } from '../config/menuConfig';
import { getPendingTopupCountSync } from '../services/canteenTopupService';
import { getAuthToken } from '../services/api';
import sapakitaLogoWhite from '../assets/logo_sapakita_white.png';
import sapakitaIcon from '../assets/icon_sapakita.png';

const Sidebar = ({ isSidebarOpen, isCollapsed, toggleSidebar, isMobileMenuOpen, closeMobileMenu }) => {
  const isOpen = isSidebarOpen !== undefined ? isSidebarOpen : !isCollapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const isBranchAdmin = location.pathname === '/branch' || location.pathname.startsWith('/branch/');
  const isKanwilAdmin = location.pathname === '/kanwil' || location.pathname.startsWith('/kanwil/');
  const isFinance = location.pathname === '/finance' || location.pathname.startsWith('/finance/');
  
  const { role: currentRole, roleLabel, uptName, user, logout } = useAuth();
  const branchDisplayName = uptName || user?.branch?.name || user?.branchName || 'Kampus Pondok Pesantren';

  const [pendingTopupCount, setPendingTopupCount] = useState(() => getPendingTopupCountSync());
  const [financePendingCount, setFinancePendingCount] = useState(0);

  const menuContainerRef = useRef(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const checkScroll = () => {
    const el = menuContainerRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
    setCanScrollMore(hasMore);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    const updateCount = async () => {
      setPendingTopupCount(getPendingTopupCountSync());
      if (!getAuthToken()) return;
      try {
        const { getTopupSummary } = await import('../services/canteenTopupService');
        const summary = await getTopupSummary();
        if (isMounted && typeof summary?.totalPending === 'number') {
          setPendingTopupCount(summary.totalPending);
        }
      } catch {
        // Abaikan error jaringan background
      }
    };

    const updateFinanceCount = async () => {
      if (!getAuthToken()) return;
      const activeRole = normalizeRole(currentRole || localStorage.getItem('role') || user?.role);
      if (activeRole !== ROLES.SUPERADMIN && activeRole !== ROLES.FINANCE) {
        return;
      }
      try {
        const { getPendingCanteenDepositCount } = await import('../services/financeService');
        if (isMounted) {
          const count = await getPendingCanteenDepositCount();
          setFinancePendingCount(Number(count) || 0);
        }
      } catch {
        // Abaikan
      }
    };

    updateCount();
    updateFinanceCount();
    window.addEventListener('canteen_topup_changed', updateCount);
    window.addEventListener('finance_billing_updated', updateFinanceCount);
    const handleStorage = (e) => {
      if (e?.key && !e.key.includes('canteen') && !e.key.includes('topup')) return;
      if (getAuthToken()) {
        updateCount();
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => {
      updateCount();
      updateFinanceCount();
    }, 8000);

    return () => {
      isMounted = false;
      window.removeEventListener('canteen_topup_changed', updateCount);
      window.removeEventListener('finance_billing_updated', updateFinanceCount);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [currentRole, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  
  const storedRole = localStorage.getItem('role') || localStorage.getItem('user_role') || user?.role;
  const normalizedStored = normalizeRole(storedRole);
  const normalizedCurrent = normalizeRole(currentRole);

  const effectiveRole = normalizedCurrent || 
    normalizedStored || 
    (isFinance
      ? ROLES.FINANCE
      : isBranchAdmin 
        ? (storedRole?.toLowerCase().includes('spv') || storedRole?.toLowerCase().includes('supervisor') 
            ? ROLES.SUPERVISOR 
            : ROLES.KEPALA_UPT) 
        : (isKanwilAdmin ? ROLES.ADMIN_KANWIL : ROLES.SUPERADMIN));
  
  const effectiveRoleLabel = roleLabel || 
    ROLE_LABELS[effectiveRole] || 
    (effectiveRole === ROLES.FINANCE ? 'Admin Keuangan Platform' :
     effectiveRole === ROLES.ADMIN_KANWIL ? 'Admin Yayasan' : 
     effectiveRole === ROLES.SUPERVISOR ? 'Supervisor Kesantrian' : 
     effectiveRole === ROLES.KEPALA_UPT ? 'Pimpinan Kampus' : 'Super Administrator');

  const menuItems = getMenuItemsByRole(effectiveRole);
  const isExpandedView = isOpen || isMobileMenuOpen;

  return (
    <div className={`fixed left-3.5 top-3.5 bottom-3.5 md:left-6 md:top-6 md:bottom-6 z-50 transition-all duration-300 ${
      isMobileMenuOpen ? 'translate-x-0 w-64 max-w-[85vw]' : '-translate-x-[150%] md:translate-x-0'
    } ${isOpen ? 'md:w-56' : 'md:w-[80px]'}`}>
      
      {/* Toggle Button on the side edge of sidebar (Desktop only) */}
      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          aria-label="Toggle Sidebar"
          className="hidden md:flex absolute -right-3 top-14 z-50 w-6 h-6 bg-white text-[#0E7A74] rounded-full items-center justify-center shadow-md hover:bg-slate-50 hover:scale-110 transition-all cursor-pointer border border-teal-100"
        >
          {isOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 text-[#0E7A74]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#0E7A74]" />
          )}
        </button>
      )}

      {/* Main Sidebar Container (Soft Blue-Green Gradient Theme) */}
      <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-[#0E7A74] via-[#166B7C] to-[#1E5D88] text-white flex flex-col shadow-2xl overflow-hidden">
        
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
                {effectiveRoleLabel}
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
            onClick={closeMobileMenu}
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
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          <div 
            ref={menuContainerRef}
            onScroll={checkScroll}
            className="flex-1 overflow-y-auto py-1 flex flex-col gap-1.5 px-0 no-scrollbar [&::-webkit-scrollbar]:hidden" 
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              maskImage: canScrollMore ? 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)' : 'none',
              WebkitMaskImage: canScrollMore ? 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)' : 'none'
            }}
          >
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path) && 
                               (item.path !== '/dashboard' || location.pathname === '/dashboard') && 
                               (item.path !== '/branch/dashboard' || location.pathname === '/branch/dashboard') &&
                               (item.path !== '/kanwil/dashboard' || location.pathname === '/kanwil/dashboard') &&
                               (item.path !== '/finance/dashboard' || location.pathname === '/finance/dashboard');
              
              const isCanteenTopupMenu = item.path === '/canteen-topup';
              const isFinanceBillingMenu = item.path === '/finance/billing';
              const showBadge = (isCanteenTopupMenu && pendingTopupCount > 0) || (isFinanceBillingMenu && financePendingCount > 0);
              const badgeCount = isFinanceBillingMenu ? financePendingCount : pendingTopupCount;

              const ItemIcon = item.icon || LayoutDashboard;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => closeMobileMenu?.()}
                  title={!isExpandedView ? (showBadge ? `${item.name} (${badgeCount} setoran baru)` : item.name) : undefined}
                  className={`flex items-center transition-all duration-300 ${
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
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <ItemIcon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0E7A74]' : 'text-teal-200'}`} />
                    {!isExpandedView && showBadge && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-[#0E7A74]"></span>
                      </span>
                    )}
                  </div>

                  {isExpandedView && (
                    <>
                      <span className="whitespace-nowrap text-sm font-medium flex-1 truncate">
                        {item.name}
                      </span>
                      {showBadge && (
                        <span 
                          className="relative flex h-2.5 w-2.5 ml-auto shrink-0" 
                          title={`${badgeCount} setoran baru menunggu verifikasi`}
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-sm"></span>
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
            <div className="h-2 shrink-0" />
          </div>
        </div>

        {/* 3. Kampus / Yayasan Info & 4. Logout */}
        <div className={`pb-4.5 pt-1.5 mt-auto shrink-0 z-20 transition-all duration-300 ${!isExpandedView ? 'px-2 flex flex-col items-center gap-2' : 'px-0 flex flex-col gap-1'}`}>
          {isBranchAdmin && (
            <div className={`bg-white/10 rounded-2xl flex items-center transition-all duration-300 ${
              !isExpandedView 
                ? 'w-11 h-11 justify-center p-0 mb-1' 
                : 'mx-3 p-3 gap-2.5 mb-1.5'
            }`}>
               <div className="relative shrink-0">
                 <Building2 className="w-5 h-5 text-white" />
               </div>
               {isExpandedView && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <p className="text-xs font-semibold text-white">{branchDisplayName}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                     <p className="text-[10px] text-teal-200">Online</p>
                   </div>
                 </div>
               )}
            </div>
          )}

          {effectiveRole === 'admin_kanwil' && (
            <div className={`bg-white/10 rounded-2xl flex items-center transition-all duration-300 ${
              !isExpandedView 
                ? 'w-11 h-11 justify-center p-0 mb-1' 
                : 'mx-3 p-3 gap-2.5 mb-1.5'
            }`}>
               <div className="relative shrink-0">
                 <Building2 className="w-5 h-5 text-white" />
               </div>
               {isExpandedView && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <p className="text-xs font-semibold text-white truncate">{user?.kanwilName || user?.kanwil?.name || 'Yayasan Pesantren'}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                     <p className="text-[10px] text-teal-200">Online</p>
                   </div>
                 </div>
               )}
            </div>
          )}

          <button 
            type="button"
            onClick={() => {
              closeMobileMenu?.();
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
            {isExpandedView && (
              <span className="whitespace-nowrap text-sm font-medium">Keluar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
