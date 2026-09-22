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
  User as UserIcon
} from 'lucide-react';
import Modal from '../components/Modal';

const Profile = () => {
  const navigate = useNavigate();
  
  // State for Account Info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    name: 'Admin Pusat',
    email: 'admin.pusat@pascall.id',
    phone: '081234567890'
  });

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
    // Dummy save action
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

    // Dummy success
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi akun dan pengaturan keamanan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Informasi Akun
              </h2>
              <button 
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  isEditingInfo ? 'text-slate-500 hover:bg-slate-100' : 'text-primary bg-primary/10 hover:bg-primary/20'
                }`}
              >
                {isEditingInfo ? 'Batal Edit' : 'Edit Info Akun'}
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-8">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer">
                    <UserCircle className="w-24 h-24 text-slate-300 bg-slate-50 rounded-full" />
                    <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <button className="text-xs font-medium text-slate-500 hover:text-primary transition-colors">
                    Ubah Foto
                  </button>
                </div>

                {/* Info Form */}
                <form onSubmit={handleSaveInfo} className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role Sistem</label>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      <ShieldCheck className="w-3.5 h-3.5" /> Superadmin
                    </span>
                    <p className="text-xs text-slate-400 mt-1.5">Role tidak dapat diubah secara mandiri.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                      {isEditingInfo ? (
                        <input 
                          type="text" 
                          value={accountInfo.name}
                          onChange={(e) => setAccountInfo({...accountInfo, name: e.target.value})}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          required
                        />
                      ) : (
                        <p className="text-slate-800 font-medium py-2">{accountInfo.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <div className="relative">
                        {!isEditingInfo && <Mail className="absolute left-0 top-2.5 text-slate-400 w-4 h-4" />}
                        {isEditingInfo ? (
                          <input 
                            type="email" 
                            value={accountInfo.email}
                            onChange={(e) => setAccountInfo({...accountInfo, email: e.target.value})}
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            required
                          />
                        ) : (
                          <p className="text-slate-800 font-medium py-2 pl-6">{accountInfo.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor HP</label>
                      <div className="relative">
                        {!isEditingInfo && <Phone className="absolute left-0 top-2.5 text-slate-400 w-4 h-4" />}
                        {isEditingInfo ? (
                          <input 
                            type="tel" 
                            value={accountInfo.phone}
                            onChange={(e) => setAccountInfo({...accountInfo, phone: e.target.value})}
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            required
                          />
                        ) : (
                          <p className="text-slate-800 font-medium py-2 pl-6">{accountInfo.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditingInfo && (
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
                        <Save className="w-4 h-4" /> Simpan Perubahan
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Activity */}
        <div className="space-y-6">
          
          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Keamanan
              </h2>
            </div>
            
            <form onSubmit={handleSavePassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showPassword.current ? 'text' : 'password'} 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <input 
                    type={showPassword.new ? 'text' : 'password'} 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('new')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <input 
                    type={showPassword.confirm ? 'text' : 'password'} 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                  Password berhasil diperbarui!
                </div>
              )}

              <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                Simpan Password Baru
              </button>
            </form>
          </div>

          {/* Activity Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Aktivitas Akun
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Login Terakhir</p>
                  <p className="text-xs text-slate-500 mt-0.5">22 Sep 2026, 08:15 WIB (IP: 192.168.1.45)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Akun Dibuat</p>
                  <p className="text-xs text-slate-500 mt-0.5">15 Jan 2025, 10:00 WIB</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Logout Action Area */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-semibold shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Akun
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Konfirmasi Keluar"
      >
        <div className="py-4">
          <p className="text-slate-600 mb-6">Apakah Anda yakin ingin keluar dari sesi Superadmin saat ini?</p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Profile;
