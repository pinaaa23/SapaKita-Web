import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  ShieldOff, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Key, 
  CheckCircle, 
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react';
import { mockUsers, mockBranches } from '../../services/mockData';
import Modal from '../../components/Modal';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Find user
  const initialUser = mockUsers.find(u => u.id === id);
  const [user, setUser] = useState(initialUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!user) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Pengguna Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Data pengguna dengan ID {id} tidak ada di sistem.</p>
          <Link 
            to="/users" 
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Daftar Pengguna
          </Link>
        </div>
      </div>
    );
  }

  const branch = mockBranches.find(b => b.id === user.branchId);

  const toggleStatus = () => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    
    // Direct mutation on mockUsers
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        status: newStatus
      };
    }

    setUser(prev => ({ ...prev, status: newStatus }));
    setIsModalOpen(false);
  };

  const handleResetPassword = () => {
    setToastMsg(`Tautan reset password berhasil dikirim ke alamat email ${user.email}`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-emerald-600 hover:text-emerald-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Link 
          to="/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pengguna
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            type="button"
            onClick={handleResetPassword}
            className="px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" /> Reset Password
          </button>
          
          <Link 
            to={`/users/${id}/edit`}
            className="px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 hover:text-primary hover:bg-slate-50 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Pengguna
          </Link>

          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-xs cursor-pointer shadow-2xs ${
              user.status === 'Active' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {user.status === 'Active' ? (
              <><ShieldOff className="w-3.5 h-3.5" /> Suspend Akun</>
            ) : (
              <><ShieldCheck className="w-3.5 h-3.5" /> Aktifkan Akun</>
            )}
          </button>
        </div>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">{user.name}</h2>
              <span className="font-mono text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                {user.id.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                user.role === 'Admin Cabang' 
                  ? 'bg-blue-400/25 text-blue-100 border border-blue-300/40' 
                  : 'bg-purple-400/25 text-purple-100 border border-purple-300/40'
              }`}>
                {user.role}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                user.status === 'Active' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40' : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                {user.status === 'Active' ? 'Aktif' : 'Suspended'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100 font-medium">
              <p className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-200" />
                <span>{branch ? branch.name : 'Unknown Branch'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-200" />
                <span>{user.email}</span>
              </p>
            </div>

            <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[11px] text-blue-200/80">
              <Calendar className="w-3 h-3" />
              <span>Bergabung pada {new Date(user.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info Pribadi & Kontak */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Detail Informasi Akun</h3>
              <p className="text-[11px] text-slate-500">Rincian hak akses dan data kontak terdaftar</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Nama Lengkap</p>
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Role Otorisasi</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                user.role === 'Admin Cabang' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>
                {user.role}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Penempatan Cabang</p>
              <Link to={`/branches/${user.branchId}`} className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {branch ? branch.name : 'Unknown Branch'}
              </Link>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Status Akses</p>
              <p className={`text-xs font-bold ${user.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {user.status === 'Active' ? 'Akun Aktif (Diizinkan Login)' : 'Suspended (Akses Ditangguhkan)'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Alamat Email</p>
              <p className="text-xs font-semibold text-slate-700">{user.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Nomor HP / WhatsApp</p>
              <p className="text-xs font-semibold text-slate-700">{user.phone || '-'}</p>
            </div>
          </div>
        </div>

        {/* Riwayat Aktivitas & Performa */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h3>
              <p className="text-[11px] text-slate-500">Log operasional & performa</p>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Sesi Login Terakhir</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Hari ini, 08:45 WIB</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {user.role === 'Admin Cabang' ? 'Verifikasi Kontak Bulan Ini' : 'Transaksi Kasir Bulan Ini'}
                </p>
                <p className="text-lg font-black text-slate-800 mt-1">
                  {user.role === 'Admin Cabang' ? '45 Kontak' : '120 Transaksi'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={toggleStatus}
        title={user.status === 'Active' ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
        message={
          user.status === 'Active'
            ? `Apakah Anda yakin ingin menonaktifkan akun ${user.name}? Pengguna ini tidak akan bisa login ke dalam sistem.`
            : `Apakah Anda yakin ingin mengaktifkan kembali akun ${user.name}?`
        }
        confirmText={user.status === 'Active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={user.status === 'Active'}
      />
    </div>
  );
};

export default Detail;
