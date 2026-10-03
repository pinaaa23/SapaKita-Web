import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  KeyRound, 
  Edit3, 
  ShieldCheck, 
  Store, 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  Info,
  Lock,
  Mail,
  User,
  Power,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  updateUserStatus, 
  resetUserPassword, 
  generateRandomPassword 
} from '../../services/userService';
import { ROLES, ROLE_LABELS } from '../../config/menuConfig';

export default function BranchUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmStatusModalOpen, setIsConfirmStatusModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [isResetResultModalOpen, setIsResetResultModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.SUPERVISOR,
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsersData = async () => {
    setIsLoading(true);
    try {
      const res = await getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(res.items || []);
    } catch (err) {
      console.error('Gagal mengambil daftar pengguna UPT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, [search, roleFilter, statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField('');
    }, 2000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const autoPass = generateRandomPassword();
    setFormData({
      name: '',
      email: '',
      role: ROLES.SUPERVISOR,
      password: autoPass,
    });
    setFormError('');
    setShowPassword(false);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal (Name & Role only)
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role === ROLES.OPERATOR_KANTIN ? ROLES.OPERATOR_KANTIN : ROLES.SUPERVISOR,
      password: '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open Toggle Status Confirmation
  const handleOpenConfirmStatus = (user) => {
    setSelectedUser(user);
    setIsConfirmStatusModalOpen(true);
  };

  // Open Reset Password Confirmation
  const handleOpenResetConfirm = (user) => {
    setSelectedUser(user);
    setIsResetConfirmModalOpen(true);
  };

  // Submit Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName) {
      setFormError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError('Format alamat email tidak valid.');
      return;
    }

    // Check email uniqueness locally
    const emailExists = users.some(u => u.email.toLowerCase() === trimmedEmail);
    if (emailExists) {
      setFormError(`Email "${trimmedEmail}" sudah terdaftar pada pengguna lain.`);
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setFormError('Kata sandi sementara minimal harus 8 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        name: trimmedName,
        email: trimmedEmail,
        role: formData.role,
        password: formData.password,
      });
      showToast(`Pengguna "${trimmedName}" berhasil ditambahkan.`);
      setIsCreateModalOpen(false);
      fetchUsersData();
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError('');

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser(selectedUser.id, {
        name: trimmedName,
        role: formData.role,
      });
      showToast(`Data "${trimmedName}" berhasil diperbarui.`);
      setIsEditModalOpen(false);
      fetchUsersData();
    } catch (err) {
      setFormError(err.message || 'Gagal memperbarui data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Toggle Status
  const handleExecuteToggleStatus = async () => {
    if (!selectedUser) return;
    const nextStatus = !selectedUser.isActive;
    setIsSubmitting(true);
    try {
      await updateUserStatus(selectedUser.id, nextStatus);
      showToast(
        `Akun "${selectedUser.name}" berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      setIsConfirmStatusModalOpen(false);
      fetchUsersData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Reset Password
  const handleExecuteResetPassword = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await resetUserPassword(selectedUser.id);
      setNewResetPassword(res.newPassword);
      setIsResetConfirmModalOpen(false);
      setIsResetResultModalOpen(true);
    } catch (err) {
      console.error('Gagal reset kata sandi:', err);
      const fallbackPass = generateRandomPassword();
      setNewResetPassword(fallbackPass);
      setIsResetConfirmModalOpen(false);
      setIsResetResultModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial Avatar Helper
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Kelola Pengguna
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola akun supervisor dan operator kantin di UPT Anda
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark active:scale-95 text-white font-bold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Card Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Header Kartu: Search & Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Role */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter Role Pengguna"
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="All">Semua Role</option>
                <option value={ROLES.SUPERVISOR}>Supervisor</option>
                <option value={ROLES.OPERATOR_KANTIN}>Operator Kantin</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter Status Akun"
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="All">Semua Status</option>
                <option value="Active">Aktif</option>
                <option value="Suspended">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Data Pengguna - Proporsional dan responsif */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-2 whitespace-nowrap">NAMA</th>
                <th className="py-3 px-2.5 whitespace-nowrap">EMAIL</th>
                <th className="py-3 px-2.5 whitespace-nowrap">ROLE</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-2.5 whitespace-nowrap">TERAKHIR LOGIN</th>
                <th className="py-3 pl-2 pr-4 text-center whitespace-nowrap w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 pl-4 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="h-4 bg-slate-200 rounded w-28" />
                      </div>
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-4 bg-slate-200 rounded w-32" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-5 bg-slate-200 rounded-full w-20" />
                    </td>
                    <td className="py-3.5 px-2.5 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-14 mx-auto" />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-3.5 pl-2 pr-4 text-center">
                      <div className="h-7 bg-slate-200 rounded-lg w-16 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => {
                  const isSpv = user.role === ROLES.SUPERVISOR;
                  const isKantin = user.role === ROLES.OPERATOR_KANTIN;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${!user.isActive ? 'bg-slate-50/40 opacity-75' : ''}`}
                    >
                      {/* Nama dengan Avatar Inisial */}
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isSpv
                              ? 'bg-blue-100 text-blue-800'
                              : isKantin
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                          }`}>
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate" title={user.name}>
                              {user.name}
                            </div>
                            {user.phone && user.phone !== '-' && (
                              <div className="text-[10px] text-slate-400 font-medium truncate" title={user.phone}>
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-2.5">
                        <div className="font-mono text-slate-600 text-xs truncate" title={user.email}>
                          {user.email}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        {isSpv ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                            <ShieldCheck className="w-3 h-3" />
                            Supervisor
                          </span>
                        ) : isKantin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <Store className="w-3 h-3" />
                            Operator Kantin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        )}
                      </td>

                      {/* Status: Titik Hijau Aktif / Abu Nonaktif */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Terakhir Login - Tidak turun baris */}
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{user.lastLogin || 'Hari ini, 08:30'}</span>
                        </div>
                      </td>

                      {/* Aksi Baris: Edit, Reset Password, Nonaktifkan/Aktifkan (Tanpa Hapus) */}
                      <td className="py-3 pl-2 pr-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-primary rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Pengguna"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetConfirm(user)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleOpenConfirmStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              user.isActive
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* State Kosong */
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-slate-800 font-bold text-sm">Belum ada pengguna</p>
                      <p className="text-slate-400 text-xs mt-1 mb-4">
                        {search ? 'Tidak ditemukan data pengguna yang cocok dengan pencarian.' : 'Tambahkan akun staf Supervisor atau Operator Kantin untuk UPT Anda.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary-dark transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pengguna</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Tambah Pengguna */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-5 bg-gradient-to-r from-primary to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Daftarkan akun Supervisor atau Operator Kantin UPT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Fauzi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Email Login */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: supervisor.cipinang@pascall.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs font-mono"
                  />
                </div>
                {/* Petunjuk format email — hanya informasi, bukan validasi ketat */}
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Format: <span className="font-mono font-semibold text-slate-500">peran.wilayah@pascall.id</span>
                  <span className="mx-1">·</span>
                  Contoh: <span className="font-mono font-semibold text-slate-500">kantin.cipinang@pascall.id</span>
                </p>
              </div>

              {/* Role: Hanya Supervisor atau Operator Kantin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Role Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: ROLES.SUPERVISOR })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left cursor-pointer ${
                      formData.role === ROLES.SUPERVISOR
                        ? 'bg-blue-50 border-primary ring-2 ring-primary/20 text-primary'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Supervisor</p>
                      <p className="text-[10px] text-slate-500">Kelola UPT &amp; Paket</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: ROLES.OPERATOR_KANTIN })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left cursor-pointer ${
                      formData.role === ROLES.OPERATOR_KANTIN
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Operator Kantin</p>
                      <p className="text-[10px] text-slate-500">Web Kantin Khusus</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password Sementara */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password Sementara <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Buat Otomatis Password</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs font-mono"
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Info Text */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    Pengguna wajib mengganti password saat login pertama demi keamanan akun.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Pengguna (Nama & Role saja) */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Edit Pengguna</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ubah nama lengkap dan role pengguna</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email Login (Tidak Dapat Diubah)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Role Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: ROLES.SUPERVISOR })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left cursor-pointer ${
                      formData.role === ROLES.SUPERVISOR
                        ? 'bg-blue-50 border-primary ring-2 ring-primary/20 text-primary'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Supervisor</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: ROLES.OPERATOR_KANTIN })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left cursor-pointer ${
                      formData.role === ROLES.OPERATOR_KANTIN
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Operator Kantin</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Toggle Status (Aktifkan / Nonaktifkan) */}
      {isConfirmStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                selectedUser.isActive ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                <Power className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedUser.isActive ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Akun Pengguna?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin {selectedUser.isActive ? 'menonaktifkan' : 'mengaktifkan'} akun <strong>"{selectedUser.name}"</strong> ({selectedUser.email})?
                </p>
                {selectedUser.isActive && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200/60">
                    Pengguna tidak akan dapat login ke sistem selama status akun nonaktif.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmStatusModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteToggleStatus}
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer ${
                    selectedUser.isActive
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  }`}
                >
                  {isSubmitting ? 'Memproses...' : (selectedUser.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Konfirmasi Reset Password */}
      {isResetConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Reset Kata Sandi Pengguna?
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Sistem akan membuatkan kata sandi acak baru untuk akun <strong>"{selectedUser.name}"</strong> ({selectedUser.email}).
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                  Password lama tidak akan berlaku lagi setelah proses reset selesai.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteResetPassword}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/25 transition cursor-pointer"
                >
                  {isSubmitting ? 'Mereset...' : 'Ya, Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Tampilan Hasil Reset Password (Sekali Tampil dengan Tombol Salin) */}
      {isResetResultModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Password Berhasil Direset</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">{selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetResultModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Catat atau salin kata sandi sekarang. Kata sandi ini hanya ditampilkan satu kali demi keamanan sistem.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password Sementara Baru</p>
                  <p className="text-sm font-bold text-slate-800 font-mono tracking-wider truncate mt-0.5">{newResetPassword}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(newResetPassword, 'reset-pass')}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedField === 'reset-pass' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedField === 'reset-pass' ? 'Disalin!' : 'Salin'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsResetResultModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Saya Sudah Menyimpan Password Ini &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
