import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  PhoneCall, 
  CreditCard, 
  BarChart3, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Cabang', icon: Building2, path: '/branches' },
    { name: 'Pengguna', icon: Users, path: '/users' },
    { name: 'Panggilan', icon: PhoneCall, path: '/calls' },
    { name: 'Transaksi', icon: CreditCard, path: '/transactions' },
    { name: 'Laporan', icon: BarChart3, path: '/reports' },
  ];

  return (
    <div className="w-64 bg-primary text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <PhoneCall className="text-primary w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-wide">PasCall</h1>
          <p className="text-xs text-blue-200">Superadmin Panel</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white/20 text-accent-DEFAULT font-medium shadow-sm' 
                  : 'hover:bg-white/10 text-blue-100 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-DEFAULT' : ''}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <Link 
          to="/login"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-white/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
