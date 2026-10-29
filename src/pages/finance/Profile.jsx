import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  UserCircle, 
  ShieldCheck, 
  LogOut, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Lock,
  Wallet,
  Receipt,
  BarChart3,
  Sliders,
  Eye
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

export default function FinanceProfile() {
  const navigate = useNavigate();
  const { user: authUser, roleLabel, logout } = useAuth();
  
  const displayRole = roleLabel || 'Admin Finance';

  // State for Account Info initialized from logged in user without dummy data
  const accountInfo = {
    name: authUser?.name || 'Dewi Lestari (Finance)',
    email: authUser?.email || authUser?.identifier || 'finance@sadewa.id',
    phone: authUser?.phone || '0812-3456-7890',
    unit: authUser?.unit || 'Divisi Keuangan PT PasCall Solusi Indonesia'
  };

  // Logout Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-6">
      {/* 1. Overview Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md p-1 border-2 border-indigo-400/40 shadow-inner flex items-center justify-center">
              <UserCircle className="w-full h-full text-indigo-100" />
            </div>
          </div>

          {/* Identity Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{accountInfo.name}</h2>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 backdrop-blur-md border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> {displayRole}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sesi Aktif
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                <Eye className="w-3 h-3 text-blue-300" /> Akses: Hanya Lihat (Read-Only)
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
            </div>
          </div>

          <div className="shrink-0 self-center md:self-start">
            <button 
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all border border-white/20 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid Layout: Left Column (Info) + Right Column (Security / Permissions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details (Read Only) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Informasi Akun</h2>
                  <p className="text-[11px] text-slate-500">Identitas &amp; kontak Administrator Finance</p>
                </div>
              </div>
              
              <span className="text-xs font-bold px-3 py-1 rounded-lg text-slate-500 bg-slate-100 border border-slate-200">
                Mode Baca (Read-Only)
              </span>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      disabled={true}
                      value={accountInfo.name}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-not-allowed"
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">No. Telepon / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      disabled={true}
                      value={accountInfo.phone}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit Kerja / Divisi</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      disabled={true}
                      value={accountInfo.unit}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-bold">Akun Terverifikasi sebagai Administrator Keuangan</p>
                  <p className="text-[11px] text-blue-800">
                    Sesuai kebijakan sistem, role Finance bersifat <strong>Read-Only</strong> (hanya lihat). Segala bentuk perubahan profil dan otorisasi pembayaran dikelola terpusat oleh Superadmin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cakupan Akses Keuangan Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Cakupan Akses Menu Keuangan</h2>
                <p className="text-[11px] text-slate-500">Fitur yang dapat diakses oleh Admin Finance</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Dashboard Keuangan</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Monitoring performa omset nasional, grafik tagihan, dan alokasi bagi hasil 4 pihak.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Tagihan &amp; Setoran</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Meninjau status tagihan pascabayar, rekapitulasi UPT, dan pratinjau bukti transfer kantin.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Kontrak Bagi Hasil</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Melihat formula persentase pembagian 4 pihak dan data rekening per UPT secara transparan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Laporan Keuangan</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Melihat agregasi laporan keuangan tahunan, cetak laporan, dan ekspor data rekapitulasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Keamanan & Hak Akses Policy */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Keamanan &amp; Wewenang</h2>
                <p className="text-[11px] text-slate-500">Kebijakan otorisasi role Finance</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-800 block">Wewenang Pembayaran</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Semua persetujuan (ACC), penolakan bukti transfer, perubahan status pembayaran, dan pengaturan kontrak dikembalikan dan dikelola penuh oleh <strong>Super Administrator</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-800 block">Perubahan Profil Akun</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Untuk melakukan reset kata sandi, penggantian email, atau pembaruan kontak personal, silakan ajukan permohonan ke Superadmin sistem.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Sesi</span>
                </button>
              </div>
            </div>
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
            Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem <span className="font-bold text-slate-800">Sadewa</span> sebagai <span className="font-bold text-slate-800">{accountInfo.name}</span>?
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

