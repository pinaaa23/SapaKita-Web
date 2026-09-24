import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, UserCircle, LogOut, User, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Topbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isBranchAdmin = location.pathname.startsWith('/branch');
  const userName = isBranchAdmin ? 'Admin Cipinang' : 'Admin Pusat';
  const userRole = isBranchAdmin ? 'Branch Operator' : 'Superadmin';
  const profileLink = isBranchAdmin ? '/branch/profile' : '/profile';

  const getPageDetails = (pathname) => {
    if (pathname.startsWith('/branch/contacts')) return { title: 'Daftar Kontak Keluarga', subtitle: 'Kelola persetujuan kontak keluarga narapidana' };
    if (pathname.startsWith('/branch/transactions')) return { title: 'Riwayat Transaksi', subtitle: 'Data transaksi setoran & pembayaran cabang' };
    if (pathname.startsWith('/branch/reports')) return { title: 'Laporan & Analistik', subtitle: 'Ringkasan performa & statistik layanan' };
    if (pathname.startsWith('/branch/profile')) return { title: 'Profil Operator', subtitle: 'Informasi akun & pengaturan profil' };
    if (pathname.startsWith('/branch')) return { title: 'Dashboard', subtitle: `Selamat Datang, ${userName}!` };
    
    if (pathname.startsWith('/branches')) return { title: 'Kelola Cabang', subtitle: 'Daftar & status cabang PasCall' };
    if (pathname.startsWith('/users')) return { title: 'Kelola Pengguna', subtitle: 'Daftar pengguna & peran operator' };
    if (pathname.startsWith('/calls')) return { title: 'Riwayat Panggilan', subtitle: 'Catatan panggilan seluruh cabang' };
    if (pathname.startsWith('/transactions')) return { title: 'Data Transaksi', subtitle: 'Rekapitulasi keuangan nasional' };
    if (pathname.startsWith('/reports')) return { title: 'Laporan Pusat', subtitle: 'Statistik & analistik agregat' };
    return { title: 'Dashboard Overview', subtitle: `Selamat Datang, ${userName}!` };
  };

  const pageDetails = getPageDetails(location.pathname);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <div className="pt-0 pb-3 px-0 flex items-center justify-between z-40 relative">
      {/* Left section: Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{pageDetails.title}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{pageDetails.subtitle}</p>
      </div>

      {/* Right section: Compact Actions */}
      <div className="flex items-center gap-3">
        
        {/* Expandable Search Button */}
        <div className="relative flex items-center">
          {isSearchOpen ? (
            <div className="flex items-center bg-white rounded-full shadow-sm border border-slate-200/80 px-3 py-1.5 transition-all w-64 animate-in fade-in zoom-in-95 duration-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input 
                type="text" 
                placeholder="Cari sesuatu..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
              />
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchValue(''); }} 
                className="text-slate-400 hover:text-slate-600 ml-1 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              title="Pencarian"
              className="w-10 h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center shadow-sm border border-slate-200/80 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </div>

        {/* Notifications Button */}
        <button 
          title="Notifikasi"
          className="relative w-10 h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center shadow-sm border border-slate-200/80 transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-200/80 mx-1"></div>
        
        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 bg-white hover:bg-slate-50 p-1.5 pl-3 pr-2.5 rounded-full transition-all border border-slate-200/80 shadow-sm cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-500 font-medium">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-600">
              <UserCircle className="w-6 h-6 text-slate-500" />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-semibold text-slate-800">{userName}</p>
                <p className="text-xs text-slate-500">{userRole}</p>
              </div>
              <Link 
                to={profileLink}
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                Lihat Profil
              </Link>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
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
