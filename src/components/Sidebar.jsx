import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  X,
  LayoutDashboard,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMenuItemsByRole, normalizeRole, ROLES, ROLE_LABELS } from '../config/menuConfig';
import { getPendingTopupCountSync } from '../services/canteenTopupService';
import ikonSadewa from '../assets/ikon_sadewa.png';

const Sidebar = ({ isSidebarOpen, isCollapsed, toggleSidebar, isMobileMenuOpen, closeMobileMenu }) => {
  const isOpen = isSidebarOpen !== undefined ? isSidebarOpen : !isCollapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const isBranchAdmin = location.pathname === '/branch' || location.pathname.startsWith('/branch/');
  const isKanwilAdmin = location.pathname === '/kanwil' || location.pathname.startsWith('/kanwil/');
  const isFinance = location.pathname === '/finance' || location.pathname.startsWith('/finance/');
  
  const { role: currentRole, roleLabel, uptName, user, logout } = useAuth();
  const uptDisplayName = uptName || user?.branch?.name || user?.branchName || 'UPT Pemasyarakatan';

  // State hitungan permintaan top up kantin yang menunggu persetujuan
  const [pendingTopupCount, setPendingTopupCount] = useState(() => getPendingTopupCountSync());
  const [financePendingCount, setFinancePendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const updateCount = async () => {
      setPendingTopupCount(getPendingTopupCountSync());
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
      try {
        const { getPendingCanteenDepositCount } = await import('../services/financeService');
        if (isMounted) {
          setFinancePendingCount(getPendingCanteenDepositCount());
        }
      } catch {
        // Abaikan
      }
    };

    updateCount();
    updateFinanceCount();
    window.addEventListener('canteen_topup_changed', updateCount);
    window.addEventListener('finance_billing_updated', updateFinanceCount);
    window.addEventListener('storage', updateCount);
    const interval = setInterval(() => {
      updateCount();
      updateFinanceCount();
    }, 8000);

    return () => {
      isMounted = false;
      window.removeEventListener('canteen_topup_changed', updateCount);
      window.removeEventListener('finance_billing_updated', updateFinanceCount);
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

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
    (effectiveRole === ROLES.FINANCE ? 'Admin Finance' :
     effectiveRole === ROLES.ADMIN_KANWIL ? 'Admin Kanwil' : 
     effectiveRole === ROLES.SUPERVISOR ? 'Supervisor' : 
     effectiveRole === ROLES.KEPALA_UPT ? 'Kepala UPT' : 'Super Administrator');

  const menuItems = getMenuItemsByRole(effectiveRole);
  const isExpandedView = isOpen || isMobileMenuOpen;
  const isSadewaRole = effectiveRole === ROLES.SUPERADMIN || effectiveRole === ROLES.FINANCE || effectiveRole === ROLES.ADMIN_KANWIL || effectiveRole === ROLES.KEPALA_UPT || effectiveRole === ROLES.SUPERVISOR;

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
          className="hidden md:flex absolute -right-3 top-14 z-50 w-6 h-6 bg-white text-[#0B3D91] rounded-full items-center justify-center shadow-md hover:bg-slate-50 hover:scale-110 transition-all cursor-pointer border border-blue-100"
        >
          {isOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 text-[#0B3D91]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#0B3D91]" />
          )}
        </button>
      )}

      {/* Main Sidebar Container */}
      <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-[#0B3D91] to-[#1E5FCC] text-white flex flex-col shadow-2xl overflow-hidden">
        
        {/* 1. Header / Logo */}
        <div className={`pt-5 md:pt-6 pb-4 transition-all duration-300 flex items-center ${isExpandedView ? 'justify-between px-4 md:px-5' : 'justify-center px-2'}`}>
          <div className={`flex items-center ${isExpandedView ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              {isSadewaRole ? (
                <img 
                  src={ikonSadewa} 
                  alt="Sadewa" 
                  className="w-full h-full object-contain p-1" 
                />
              ) : (
                <PhoneCall className="text-[#0B3D91] w-5 h-5" />
              )}
            </div>
            {isExpandedView && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-extrabold text-lg tracking-wider text-white leading-tight">
                  {isSadewaRole ? 'Sadewa' : 'PasCall'}
                </h1>
                <p className="text-[11px] text-blue-200 font-medium">
                  {effectiveRoleLabel}
                </p>
              </div>
            )}
          </div>
          {/* Tombol X untuk close drawer di layar mobile */}
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Tutup Menu"
            className="md:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thin Divider Line */}
        <div className="px-4 mb-2">
          <div className="border-b border-white/20 w-full"></div>
        </div>

        {/* 2. Menu Items */}
        <div className="flex-1 overflow-y-auto py-1 flex flex-col gap-2 px-0 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) && 
                             (item.path !== '/dashboard' || location.pathname === '/dashboard') && 
                             (item.path !== '/branch/dashboard' || location.pathname === '/branch/dashboard') &&
                             (item.path !== '/kanwil/dashboard' || location.pathname === '/kanwil/dashboard');
            
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
                title={!isExpandedView ? (showBadge ? `${item.name} (${badgeCount} setoran/permohonan baru)` : item.name) : undefined}
                className={`flex items-center transition-all duration-300 ${
                  !isExpandedView 
                    ? `mx-auto w-11 h-11 justify-center rounded-2xl relative ${
                        isActive 
                          ? 'bg-white text-[#0B3D91] shadow-md font-bold' 
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }` 
                    : `mx-3 px-3.5 py-2.5 gap-3 rounded-2xl ${
                        isActive 
                          ? 'bg-white text-[#0B3D91] shadow-md font-bold' 
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <ItemIcon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0B3D91]' : 'text-blue-200'}`} />
                  {/* Penanda bulatan kecil berkedip saat sidebar tertutup (collapsed) */}
                  {!isExpandedView && showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-[#0B3D91]"></span>
                    </span>
                  )}
                </div>

                {isExpandedView && (
                  <>
                    <span className="whitespace-nowrap text-sm font-medium flex-1 truncate">
                      {item.name}
                    </span>
                    {/* Penanda bulatan kecil berkedip saat sidebar terbuka */}
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
        </div>

        {/* 3. UPT Info & 4. Logout */}
        <div className={`pb-5 pt-2 mt-auto transition-all duration-300 ${!isExpandedView ? 'px-2 flex flex-col items-center gap-2' : 'px-3'}`}>
          {isBranchAdmin && (
            <div className={`bg-white/10 rounded-2xl flex items-center transition-all duration-300 ${
              !isExpandedView 
                ? 'w-11 h-11 justify-center p-0 mb-1' 
                : 'p-3 gap-2.5 mb-2.5 mx-1'
            }`}>
               <div className="relative shrink-0">
                 <Building2 className="w-5 h-5 text-white" />
               </div>
               {isExpandedView && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <p className="text-xs font-semibold text-white">{uptDisplayName}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                     <p className="text-[10px] text-blue-200">Online</p>
                   </div>
                 </div>
               )}
            </div>
          )}

          {effectiveRole === 'admin_kanwil' && (
            <div className={`bg-white/10 rounded-2xl flex items-center transition-all duration-300 ${
              !isExpandedView 
                ? 'w-11 h-11 justify-center p-0 mb-1' 
                : 'p-3 gap-2.5 mb-2.5 mx-1'
            }`}>
               <div className="relative shrink-0">
                 <Building2 className="w-5 h-5 text-white" />
               </div>
               {isExpandedView && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <p className="text-xs font-semibold text-white truncate">{user?.kanwilName || user?.kanwil?.name || 'Kantor Wilayah'}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                     <p className="text-[10px] text-blue-200">Online</p>
                   </div>
                 </div>
               )}
            </div>
          )}

          {effectiveRole === ROLES.FINANCE && (
            <div className={`bg-white/10 rounded-2xl flex items-center transition-all duration-300 ${
              !isExpandedView 
                ? 'w-11 h-11 justify-center p-0 mb-1' 
                : 'p-3 gap-2.5 mb-2.5 mx-1'
            }`}>
               <div className="relative shrink-0">
                 <Wallet className="w-5 h-5 text-emerald-300" />
               </div>
               {isExpandedView && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin Finance'}</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                     <p className="text-[10px] text-emerald-200 font-medium">Divisi Keuangan</p>
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
                : 'mx-1 px-3.5 py-2.5 gap-3 w-[calc(100%-8px)]'
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
