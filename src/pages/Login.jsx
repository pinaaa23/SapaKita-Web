import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, Lock, Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary transform -skew-y-6 origin-top-left z-0"></div>
      
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md z-10 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <PhoneCall className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">PasCall</h1>
          <p className="text-slate-500 mt-2 text-sm text-center">Superadmin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="email" 
                defaultValue="superadmin@pascall.id"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="admin@pascall.id"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                defaultValue="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-slate-600">Ingat Saya</span>
            </label>
            <a href="#" className="text-primary font-medium hover:underline">Lupa Password?</a>
          </div>

          <button 
            type="submit" 
            className="w-full bg-accent-DEFAULT hover:bg-accent-hover text-white font-semibold py-3 rounded-lg shadow-lg shadow-accent-DEFAULT/30 transition-all transform hover:-translate-y-0.5"
          >
            Masuk ke Dashboard
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2026 PasCall - Sistem Komunikasi Wartel Lapas.<br/>Mendekatkan Hati, Tanpa Batas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
