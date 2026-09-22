import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, ShieldOff, ShieldCheck, User, Mail, Phone, Building, Calendar, Key, CheckCircle, Clock } from 'lucide-react';
import { mockUsers, mockBranches } from '../../services/mockData';
import Modal from '../../components/Modal';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Find user
  const initialUser = mockUsers.find(u => u.id === id);
  const [user, setUser] = useState(initialUser);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700">Pengguna tidak ditemukan</h2>
        <button onClick={() => navigate('/users')} className="mt-4 text-primary hover:underline">Kembali ke daftar pengguna</button>
      </div>
    );
  }

  const branch = mockBranches.find(b => b.id === user.branchId);

  const toggleStatus = () => {
    setUser({ ...user, status: user.status === 'Active' ? 'Suspended' : 'Active' });
  };

  const handleResetPassword = () => {
    // Simulasi reset password
    alert(`Tautan reset password telah dikirim ke ${user.email}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/users"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                user.role === 'Admin Cabang' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {user.role}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.status === 'Active' ? 'Aktif' : 'Suspended'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleResetPassword}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Key className="w-4 h-4" /> Reset Password
          </button>
          <Link 
            to={`/users/${id}/edit`}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              user.status === 'Active' 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {user.status === 'Active' ? (
              <><ShieldOff className="w-4 h-4" /> Suspend Akun</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Aktifkan Akun</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Pribadi & Kontak */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Informasi Akun</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Nama Lengkap</p>
                <p className="text-slate-800 font-medium">{user.name}</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Penugasan Cabang</p>
                <Link to={`/branches/${user.branchId}`} className="text-primary font-medium hover:underline">
                  {branch ? branch.name : 'Unknown'}
                </Link>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
                <p className="text-slate-800 font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Nomor HP</p>
                <p className="text-slate-800 font-medium">{user.phone}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Tanggal Bergabung</p>
                <p className="text-slate-800 font-medium">
                  {new Date(user.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Aktivitas Singkat */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-800">Aktivitas Terbaru</h3>
          </div>
          <div className="p-5 flex-1">
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <div className="mt-0.5 text-primary">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-slate-800 font-medium">Terakhir login</p>
                  <p className="text-xs text-slate-500 mt-0.5">Hari ini, 08:45 WIB</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <div className="mt-0.5 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-slate-800 font-medium">
                    {user.role === 'Admin Cabang' ? 'Total kontak disetujui (Bulan ini)' : 'Total transaksi diproses (Bulan ini)'}
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {user.role === 'Admin Cabang' ? '45 Kontak' : '120 Transaksi'}
                  </p>
                </div>
              </li>
            </ul>
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
            ? `Apakah Anda yakin ingin menonaktifkan akun ${user.name}? Pengguna ini tidak akan bisa login ke sistem.`
            : `Apakah Anda yakin ingin mengaktifkan kembali akun ${user.name}?`
        }
        confirmText={user.status === 'Active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={user.status === 'Active'}
      />
    </div>
  );
};

export default Detail;
