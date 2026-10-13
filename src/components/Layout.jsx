import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('pascall_sidebar_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return false; // Default COLLAPSED (false) as requested
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pascall_sidebar_open', isSidebarOpen);
  }, [isSidebarOpen]);

  // Tutup menu drawer otomatis setiap berpindah rute
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

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

      {/* Sidebar Navigasi */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Konten Utama Aplikasi */}
      <div className={`flex flex-col min-h-screen w-full min-w-0 max-w-full transition-all duration-300 px-3.5 sm:px-6 py-4 md:py-6 md:pr-6 ${isSidebarOpen ? 'md:pl-[264px]' : 'md:pl-[120px]'}`}>
        <Topbar 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
          toggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 pt-2 pb-6 min-w-0 w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
