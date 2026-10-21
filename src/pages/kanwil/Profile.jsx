import React, { useState } from 'react';
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
  MapPin,
  Globe2,
  Tag
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { changePasswordApi, updateProfileApi } from '../../services/api';

export default function KanwilProfile() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const kanwilName = authUser?.kanwilName || authUser?.kanwil?.name || 'Kantor Wilayah';
  const kanwilCode = authUser?.kanwil?.code || 'KW';
  const kanwilRegion = authUser?.kanwil?.region || kanwilName;
  const kanwilProvinces = authUser?.kanwil?.provinces || (authUser?.wilayah ? [authUser.wilayah] : ['Wilayah Kerja Kanwil']);

  // State for Account Info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    name: authUser?.name || 'Administrator Kanwil',
    email: authUser?.email || authUser?.identifier || '-',
    phone: authUser?.phone || '-',
    unit: `Kantor Wilayah Ditjen Pemasyarakatan - ${kanwilName}`
  });
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
        phone: accountInfo.phone,
        unit: accountInfo.unit
      });
      setIsEditingInfo(false);
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err) {
      console.log('[KanwilProfile] Gagal update profil:', err);
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
      console.log('[KanwilProfile] Gagal ubah password:', err);
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
    <div className="max-w-6xl mx-auto space-y-5 pb-6">
      {/* Overview Banner Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md p-1 border-2 border-blue-300/40 shadow-inner flex items-center justify-center">
              <UserCircle className="w-full h-full text-blue-100" />
            </div>
          </div>

          {/* Identity Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{accountInfo.name}</h2>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-100 backdrop-blur-md border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Kanwil
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sesi Aktif
              </span>
            </div>
            
            <p className="text-blue-100 text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-blue-200" /> {kanwilName}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-blue-100 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Mail className="w-3.5 h-3.5 text-blue-300" /> {accountInfo.email}
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
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

      {/* Grid Layout: 2 Cols for Info, 1 Col for Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Wilayah & Account Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Identitas Kantor Wilayah */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-primary">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Identitas Kantor Wilayah (Kanwil)</h2>
                  <p className="text-[11px] text-slate-500">Yurisdiksi & cakupan koordinasi Unit Pelaksana Teknis</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Aktif Beroperasi
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Nama Kantor Wilayah</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{kanwilName}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Kode Kanwil</span>
                  <span className="text-sm font-mono font-bold text-primary mt-1 block">{kanwilCode}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Provinsi Cakupan / Yurisdiksi Kerja</span>
                <div className="flex flex-wrap gap-2">
                  {kanwilProvinces.map((prov, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-100/70 text-blue-800 border border-blue-200"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {prov}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Seluruh pendaftaran UPT baru oleh Kanwil ini akan otomatis berada di bawah yurisdiksi provinsi cakupan di atas.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Informasi Akun Pengguna */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Informasi Administrator</h2>
                  <p className="text-[11px] text-slate-500">Perbarui identitas & kontak penanggung jawab Kanwil</p>
                </div>
              </div>
              
            </div>

            <form onSubmit={handleSaveInfo} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      disabled={!isEditingInfo}
                      value={accountInfo.name}
                      onChange={(e) => setAccountInfo({...accountInfo, name: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Login</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      disabled={true}
                      value={accountInfo.email}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Email login dikelola oleh Superadmin</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">No. Telepon / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      disabled={!isEditingInfo}
                      value={accountInfo.phone}
                      onChange={(e) => setAccountInfo({...accountInfo, phone: e.target.value})}
                      placeholder="0812xxxxxxx"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit Kerja / Instansi</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      disabled={true}
                      value={accountInfo.unit}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>


            </form>
          </div>
        </div>

        {/* Right Column: Keamanan & Ganti Password */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <div className="p-2 rounded-lg bg-blue-50 text-primary">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Keamanan & Password</h2>
                <p className="text-[11px] text-slate-500">Ubah kata sandi akun Admin Kanwil</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Kata sandi berhasil diubah!
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    placeholder="Ulangi kata sandi baru"
                    required
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSubmittingPassword || !passwords.current || !passwords.new || !passwords.confirm}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmittingPassword ? 'Memproses...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Konfirmasi Keluar"
      >
        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin keluar dari sistem <span className="font-bold text-slate-800">PasCall</span> sebagai Administrator <span className="font-bold text-slate-800">{kanwilName}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleLogoutConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
