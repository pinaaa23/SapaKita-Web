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
    if (pathname.startsWith('/branch/inmates/create')) return { title: 'Tambah Narapidana Baru', subtitle: 'Form pendaftaran warga binaan baru' };
    if (pathname.includes('/edit') && pathname.startsWith('/branch/inmates')) return { title: 'Edit Data Narapidana', subtitle: 'Perbarui informasi & penempatan warga binaan' };
    if (pathname.startsWith('/branch/inmates/')) return { title: 'Detail Narapidana', subtitle: 'Informasi lengkap, kontak keluarga & riwayat panggilan' };
    if (pathname.startsWith('/branch/inmates')) return { title: 'Data Narapidana', subtitle: 'Kelola data warga binaan di Lapas Kelas I Cipinang' };

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

  // Notification State
  const [notifications, setNotifications] = useState(() => {
    return isBranchAdmin ? [
      { id: 1, title: 'Permohonan Kontak Baru', desc: 'Siti Aminah mengajukan verifikasi kontak keluarga WBP Ahmad Supriyadi.', time: '5 min lalu', read: false, type: 'contact', link: '/branch/contacts' },
      { id: 2, title: 'Setoran Saldo Berhasil', desc: 'Setoran saldo Rp 150.000 via QRIS oleh Budi H. telah terverifikasi.', time: '1 jam lalu', read: false, type: 'transaction', link: '/branch/transactions' },
      { id: 3, title: 'Panggilan Selesai', desc: 'Panggilan Bilik 02 oleh WBP Rahmat Hidayat telah selesai (14:32 WIB).', time: '3 jam lalu', read: true, type: 'call', link: '/branch/reports' },
      { id: 4, title: 'Pembaruan Sistem', desc: 'Sistem perekaman panggilan otomatis telah diperbarui ke versi v2.4.', time: 'Kemarin', read: true, type: 'system', link: '/branch/profile' }
    ] : [
      { id: 1, title: 'Cabang Baru Didaftarkan', desc: 'Lapas Kelas 1 Cipinang telah aktif dan terhubung ke server pusat.', time: '10 min lalu', read: false, type: 'branch', link: '/branches' },
      { id: 2, title: 'Operator Baru', desc: 'Admin Cabang Cipinang mengkonfirmasi pendaftaran operator baru.', time: '2 jam lalu', read: false, type: 'user', link: '/users' },
      { id: 3, title: 'Laporan Bulanan Siap', desc: 'Laporan rekapitulasi transaksi nasional bulan ini dapat diunduh.', time: '5 jam lalu', read: true, type: 'report', link: '/reports' }
    ];
  });
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState('all'); // 'all' | 'unread'
  
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  // Search Items List
  const searchDatabase = isBranchAdmin ? [
    { title: 'Daftar Kontak Keluarga', category: 'Halaman', link: '/branch/contacts', desc: 'Kelola persetujuan & verifikasi kontak keluarga' },
    { title: 'Riwayat Transaksi', category: 'Halaman', link: '/branch/transactions', desc: 'Data setoran saldo & pembayaran cabang' },
    { title: 'Laporan & Analistik Cabang', category: 'Halaman', link: '/branch/reports', desc: 'Statistik panggilan & keuangan cabang' },
    { title: 'Profil Operator', category: 'Pengaturan', link: '/branch/profile', desc: 'Informasi akun & keamanan operator' },
    { title: 'WBP Ahmad Supriyadi', category: 'Kontak WBP', link: '/branch/contacts', desc: 'Kamar 102B - Cabang Cipinang' },
    { title: 'WBP Rahmat Hidayat', category: 'Kontak WBP', link: '/branch/contacts', desc: 'Kamar 105A - Cabang Cipinang' },
    { title: 'Tambah Kontak Baru', category: 'Aksi Cepat', link: '/branch/contacts', desc: 'Buka form pendaftaran kontak keluarga' },
  ] : [
    { title: 'Kelola Cabang', category: 'Halaman', link: '/branches', desc: 'Daftar & status cabang PasCall nasional' },
    { title: 'Kelola Pengguna', category: 'Halaman', link: '/users', desc: 'Daftar pengguna & peran operator' },
    { title: 'Riwayat Panggilan', category: 'Halaman', link: '/calls', desc: 'Catatan panggilan seluruh cabang' },
    { title: 'Data Transaksi Nasional', category: 'Halaman', link: '/transactions', desc: 'Rekapitulasi keuangan seluruh Indonesia' },
    { title: 'Laporan Pusat', category: 'Halaman', link: '/reports', desc: 'Statistik & analistik agregat' },
    { title: 'Profil Admin Pusat', category: 'Pengaturan', link: '/profile', desc: 'Informasi akun Superadmin' },
    { title: 'Lapas Kelas 1 Cipinang', category: 'Cabang', link: '/branches', desc: 'Status: Aktif - Jakarta Timur' },
  ];

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
    navigate('/login');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleReadNotif = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeNotifTab === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="pt-0 pb-3 px-0 flex items-center justify-between z-40 relative">
      {/* Left section: Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{pageDetails.title}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{pageDetails.subtitle}</p>
      </div>

      {/* Right section: Compact Actions */}
      <div className="flex items-center gap-3">
        
        {/* Expandable Search Button & Dropdown */}
        <div className="relative flex items-center" ref={searchRef}>
          {isSearchOpen ? (
            <div className="relative">
              <div className="flex items-center bg-white rounded-full shadow-md border border-slate-200/90 px-3.5 py-1.5 transition-all w-72 md:w-80 ring-2 ring-primary/20">
                <Search className="w-4 h-4 text-primary shrink-0 mr-2" />
                <input 
                  type="text" 
                  placeholder="Cari menu, kontak, transaksi..." 
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
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
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
                        className="px-4 py-2.5 hover:bg-primary/5 cursor-pointer transition-colors flex items-start gap-3 group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-primary/10 text-slate-500 group-hover:text-primary shrink-0 mt-0.5 transition-colors">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-primary truncate transition-colors">
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
              className="w-10 h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center justify-center shadow-sm border border-slate-200/80 transition-all cursor-pointer hover:shadow-md"
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
            className="relative w-10 h-10 rounded-full bg-white text-slate-600 hover:bg-slate-50 hover:text-primary flex items-center justify-center shadow-sm border border-slate-200/80 transition-all cursor-pointer hover:shadow-md"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex px-4 pt-2 border-b border-slate-100 gap-4 text-xs font-semibold text-slate-500">
                <button 
                  onClick={() => setActiveNotifTab('all')}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${
                    activeNotifTab === 'all' 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent hover:text-slate-700'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button 
                  onClick={() => setActiveNotifTab('unread')}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${
                    activeNotifTab === 'unread' 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent hover:text-slate-700'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
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
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {!n.read && (
                        <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-primary"></span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        !n.read ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Bell className="w-4 h-4" />
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
                    Tidak ada notifikasi {activeNotifTab === 'unread' ? 'belum dibaca' : ''}.
                  </div>
                )}
              </div>

              {/* Footer */}
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
        
        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 bg-white hover:bg-slate-50 p-1.5 pl-3 pr-2.5 rounded-full transition-all border border-slate-200/80 shadow-sm cursor-pointer hover:shadow-md"
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
