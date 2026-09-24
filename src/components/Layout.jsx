import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('pascall_sidebar_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return false; // Default COLLAPSED (false) as requested
  });

  useEffect(() => {
    localStorage.setItem('pascall_sidebar_open', isSidebarOpen);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4EFFC] via-[#EFF5FC] to-[#F8FAFC] font-sans text-slate-900 flex relative overflow-x-hidden">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`flex flex-col min-h-screen w-full transition-all duration-300 py-6 pr-6 ${isSidebarOpen ? 'pl-[264px]' : 'pl-[120px]'}`}>
        <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 pt-2 pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
