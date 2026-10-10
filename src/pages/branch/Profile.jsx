import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  UserCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  LogOut, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { changePasswordApi, updateProfileApi } from '../../services/api';

const BranchProfile = () => {
  const navigate = useNavigate();
  const { user: authUser, roleLabel, isSupervisor, logout } = useAuth();
  
  const displayRole = roleLabel || (isSupervisor ? 'Supervisor' : 'Kepala UPT');

  // State for Account Info initialized from logged in BE user without dummy data
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    name: authUser?.name || displayRole,
    email: authUser?.email || authUser?.identifier || '-',
    phone: authUser?.phone || '-',
    branch: authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : 'UPT Lapas')
  });

  // Sinkronisasi data akun ketika authUser dimuat dari backend
  useEffect(() => {
    if (authUser && !isEditingInfo) {
      setAccountInfo({
        name: authUser?.name || displayRole,
        email: authUser?.email || authUser?.identifier || '-',
        phone: authUser?.phone || '-',
        branch: authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : 'UPT Lapas')
      });
    }
  }, [authUser, isEditingInfo, displayRole]);

  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

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
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Logout Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess(false);
    setIsSubmittingInfo(true);

    try {
      await updateProfileApi({
        name: accountInfo.name,
        phone: accountInfo.phone
      });
      setIsEditingInfo(false);
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err) {
      console.log('[BranchProfile] Gagal update profil:', err);
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      const beError = err?.data?.message || (Array.isArray(err?.data?.errors) ? err.data.errors.map(e => e.message).join(', ') : null);
      if (beError) {
        setInfoError(beError);
      } else if (err?.status === 403) {
        setInfoError('Anda tidak memiliki akses.');
      } else if (err?.isNetworkError) {
        setInfoError('Server backend tidak dapat dihubungi');
      } else {
        setInfoError(err?.message || 'Gagal memperbarui profil');
      }
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwords.new.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setPasswordError('Password baru dan konfirmasi tidak sama.');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await changePasswordApi({
        oldPassword: passwords.current,
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm
      });
      setPasswordSuccess(true);
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.log('[BranchProfile] Gagal ubah password:', err);
      const beError = err?.data?.message || (Array.isArray(err?.data?.errors) ? err.data.errors.map(e => e.message).join(', ') : null);
      if (beError) {
        setPasswordError(beError);
      } else if (err?.status === 401) {
        setPasswordError('Password lama salah atau sesi Anda telah berakhir.');
      } else if (err?.status === 403) {
        setPasswordError('Anda tidak memiliki akses.');
      } else if (err?.isNetworkError) {
        setPasswordError('Server backend tidak dapat dihubungi');
      } else {
        setPasswordError(err?.message || 'Gagal mengubah kata sandi');
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Overview Banner Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md p-1 border-2 border-white/40 shadow-inner flex items-center justify-center">
              <UserCircle className="w-full h-full text-white/90" />
            </div>
          </div>

          {/* Identity Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{accountInfo.name}</h2>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/30">
                <ShieldCheck className="w-3.5 h-3.5" /> {displayRole}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sesi Aktif
              </span>
            </div>
            
            <p className="text-blue-100 text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-blue-200" /> {accountInfo.branch}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-blue-100/90 font-medium">
              <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-lg">
                <Mail className="w-3.5 h-3.5 text-blue-300" /> {accountInfo.email}
              </div>
              <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-blue-300" /> {accountInfo.phone}
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

      {infoError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{infoError}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Informasi Akun</h2>
                  <p className="text-[11px] text-slate-500">Perbarui identitas & kontak operator cabang</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setIsEditingInfo(!isEditingInfo);
                  setInfoError('');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isEditingInfo ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' : 'text-primary bg-primary/10 hover:bg-primary/20'
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
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
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {accountInfo.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Handphone</label>
                    {isEditingInfo ? (
                      <input 
                        type="tel" 
                        value={accountInfo.phone}
                        onChange={(e) => setAccountInfo({...accountInfo, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Cabang Operasional</label>
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      {accountInfo.branch}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Sistem</label>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                      <ShieldCheck className="w-3.5 h-3.5" /> {displayRole}
                    </span>
                  </div>

                  {isEditingInfo && (
                    <button 
                      type="submit" 
                      disabled={isSubmittingInfo}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" /> {isSubmittingInfo ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                <p className="text-[11px] text-slate-500">Perbarui kata sandi akun</p>
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
                    placeholder="Min 8 karakter"
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

              <button 
                type="submit" 
                disabled={isSubmittingPassword}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPassword ? 'Memproses...' : 'Simpan Password Baru'}
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
                <p className="text-[11px] text-slate-500">Informasi status login operator</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Status Akses</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Sesi login aktif ({displayRole})</p>
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
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Logout"
        message={`Apakah Anda yakin ingin keluar dari sesi ${displayRole} saat ini?`}
        confirmText="Logout"
        cancelText="Batal"
        isDanger={true}
      />

    </div>
  );
};

export default BranchProfile;
