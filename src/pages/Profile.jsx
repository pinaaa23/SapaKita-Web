import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  Camera, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  LogOut, 
  Clock, 
  Calendar,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/Modal';

const Profile = () => {
  const navigate = useNavigate();
  
  // State for Account Info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    name: 'Admin Pusat',
    email: 'admin.pusat@pascall.id',
    phone: '081234567890',
    unit: 'Direktorat Jenderal Pemasyarakatan'
  });
  const [infoSuccess, setInfoSuccess] = useState(false);

  // State for Password
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Logout Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleSaveInfo = (e) => {
    e.preventDefault();
    setIsEditingInfo(false);
    setInfoSuccess(true);
    setTimeout(() => setInfoSuccess(false), 3000);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwords.new !== passwords.confirm) {
      setPasswordError('Password Baru dan Konfirmasi Password tidak sama.');
      return;
    }

    if (passwords.new.length < 6) {
      setPasswordError('Password harus minimal 6 karakter.');
      return;
    }

    setPasswordSuccess(true);
    setPasswords({ current: '', new: '', confirm: '' });
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-6">
      {/* Overview Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative group cursor-pointer shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md p-1 border-2 border-indigo-400/40 shadow-inner flex items-center justify-center">
              <UserCircle className="w-full h-full text-indigo-100" />
            </div>
            <div className="absolute inset-0 bg-slate-950/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Identity Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{accountInfo.name}</h2>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 backdrop-blur-md border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Superadmin
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sesi Aktif
              </span>
            </div>
            
            <p className="text-slate-300 text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-indigo-300" /> {accountInfo.unit}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> {accountInfo.email}
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> {accountInfo.phone}
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <span>ID Operator:</span> <strong className="text-white">ADM-HQ-001</strong>
              </div>
            </div>
          </div>

          <div className="shrink-0 self-center md:self-start">
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all border border-white/20 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {infoSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Informasi profil berhasil diperbarui!
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Informasi Akun</h2>
                  <p className="text-[11px] text-slate-500">Perbarui identitas & kontak Superadmin</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isEditingInfo ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                {isEditingInfo ? 'Batal Edit' : 'Edit Informasi'}
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSaveInfo} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                    {isEditingInfo ? (
                      <input 
                        type="text" 
                        value={accountInfo.name}
                        onChange={(e) => setAccountInfo({...accountInfo, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                        required
                      />
                    ) : (
                      <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-800">
                        {accountInfo.name}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Email</label>
                    {isEditingInfo ? (
                      <input 
                        type="email" 
                        value={accountInfo.email}
                        onChange={(e) => setAccountInfo({...accountInfo, email: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                        required
                      />
                    ) : (
                      <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {accountInfo.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Handphone</label>
                    {isEditingInfo ? (
                      <input 
                        type="tel" 
                        value={accountInfo.phone}
                        onChange={(e) => setAccountInfo({...accountInfo, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                        required
                      />
                    ) : (
                      <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {accountInfo.phone}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit Kerja / Instansi</label>
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {accountInfo.unit}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Sistem</label>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      <ShieldCheck className="w-3.5 h-3.5" /> Superadmin Pusat
                    </span>
                  </div>

                  {isEditingInfo && (
                    <button type="submit" className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-bold shadow-md cursor-pointer">
                      <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Activity */}
        <div className="space-y-6">
          
          {/* Security Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Keamanan Password</h2>
                <p className="text-[11px] text-slate-500">Perbarui kata sandi secara berkala</p>
              </div>
            </div>
            
            <form onSubmit={handleSavePassword} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showPassword.current ? 'text' : 'password'} 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <input 
                    type={showPassword.new ? 'text' : 'password'} 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="Min 6 karakter"
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('new')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input 
                    type={showPassword.confirm ? 'text' : 'password'} 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="Ulangi password baru"
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  Password berhasil diperbarui!
                </div>
              )}

              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-bold shadow-md cursor-pointer">
                Simpan Password Baru
              </button>
            </form>
          </div>

          {/* Activity Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Aktivitas Sesi</h2>
                <p className="text-[11px] text-slate-500">Log akses & verifikasi sistem</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Login Terakhir</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">22 Sep 2026, 08:15 WIB</p>
                  <span className="text-[10px] text-slate-400 font-mono">IP: 192.168.1.45 (Jakarta)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Akun Dibuat</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">15 Jan 2025, 10:00 WIB</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => navigate('/login')}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sesi Superadmin saat ini?"
        confirmText="Logout"
        cancelText="Batal"
        isDanger={true}
      />

    </div>
  );
};

export default Profile;
