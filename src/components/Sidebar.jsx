import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  PhoneCall, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Contact,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isSidebarOpen, isCollapsed, toggleSidebar }) => {
  const isOpen = isSidebarOpen !== undefined ? isSidebarOpen : !isCollapsed;
  const location = useLocation();
  const isBranchAdmin = location.pathname.startsWith('/branch');
  
  const superadminMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Cabang', icon: Building2, path: '/branches' },
    { name: 'Pengguna', icon: Users, path: '/users' },
    { name: 'Panggilan', icon: PhoneCall, path: '/calls' },
    { name: 'Transaksi', icon: CreditCard, path: '/transactions' },
    { name: 'Laporan', icon: BarChart3, path: '/reports' },
  ];

  const branchMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
    { name: 'Kontak', icon: Contact, path: '/branch/contacts' },
    { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
    { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
  ];

  const menuItems = isBranchAdmin ? branchMenuItems : superadminMenuItems;

  return (
    <div className={`fixed left-6 top-6 bottom-6 z-50 transition-all duration-300 ${isOpen ? 'w-56' : 'w-[80px]'}`}>
      
      {/* Toggle Button on the side edge of sidebar */}
      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          title={isOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          aria-label="Toggle Sidebar"
          className="absolute -right-3 top-14 z-50 w-6 h-6 bg-white text-[#0B3D91] rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 hover:scale-110 transition-all cursor-pointer border border-blue-100"
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
        
        {/* 1. Header / Logo (Side-by-side when open) */}
        <div className={`pt-6 pb-4 transition-all duration-300 ${isOpen ? 'px-5 flex items-center gap-3' : 'px-2 flex flex-col items-center justify-center'}`}>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-md">
            <PhoneCall className="text-[#0B3D91] w-5 h-5" />
          </div>
          {isOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-extrabold text-lg tracking-wider text-white leading-tight">PasCall</h1>
              <p className="text-[11px] text-blue-200 font-medium">Branch Operator</p>
            </div>
          )}
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
                             (item.path !== '/branch/dashboard' || location.pathname === '/branch/dashboard');
            
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!isOpen ? item.name : undefined}
                className={`flex items-center transition-all duration-300 ${
                  !isOpen 
                    ? `mx-auto w-11 h-11 justify-center rounded-2xl ${
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
                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0B3D91]' : 'text-blue-200'}`} />
                {isOpen && (
                  <span className="whitespace-nowrap text-sm font-medium">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 3. Branch Info & 4. Logout */}
        <div className={`pb-5 pt-2 mt-auto transition-all duration-300 ${!isOpen ? 'px-2 flex flex-col items-center gap-2' : 'px-3'}`}>
          {isBranchAdmin && (
            <div className={`bg-white/10 rounded-2xl flex items-center transition-all duration-300 ${
              !isOpen 
                ? 'w-11 h-11 justify-center p-0 mb-1' 
                : 'p-3 gap-2.5 mb-2.5 mx-1'
            }`}>
               <div className="relative shrink-0">
                 <Building2 className="w-5 h-5 text-white" />
               </div>
               {isOpen && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <p className="text-xs font-semibold text-white">Cabang Cipinang</p>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                     <p className="text-[10px] text-blue-200">Online</p>
                   </div>
                 </div>
               )}
            </div>
          )}

          <Link 
            to="/login"
            title={!isOpen ? "Keluar" : undefined}
            className={`flex items-center transition-colors rounded-2xl text-red-300 hover:bg-white/10 hover:text-red-200 ${
              !isOpen 
                ? 'w-11 h-11 justify-center p-0 mx-auto' 
                : 'mx-1 px-3.5 py-2.5 gap-3'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isOpen && (
              <span className="whitespace-nowrap text-sm font-medium">Keluar</span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
