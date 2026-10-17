import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Key, 
  Mail, 
  Phone, 
  Building2, 
  X, 
  Check, 
  ShieldCheck, 
  Search,
  RefreshCw 
} from 'lucide-react';
import { 
  getKanwilAdmins, 
  createKanwilAdmin, 
  resetKanwilAdminPassword,
  getAllKanwilsForSuperadmin 
} from '../../services/kanwilService';

export default function KanwilAdmins() {
  const [admins, setAdmins] = useState([]);
  const [kanwils, setKanwils] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Tambah Admin Kanwil
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    kanwilId: '',
    phone: '',
  });

  // Modal Reset Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adminList, kanwilList] = await Promise.all([
        getKanwilAdmins(),
        getAllKanwilsForSuperadmin(),
      ]);
      setAdmins(adminList);
      setKanwils(kanwilList);
    } catch (err) {
      console.error('Error fetching kanwil admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.kanwilId) {
      alert('Nama, Email, Password, dan Kantor Wilayah wajib diisi!');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await createKanwilAdmin(form);
      alert('Akun Admin Kanwil berhasil dibuat!');
      setIsAddModalOpen(false);
      setForm({ name: '', email: '', password: '', kanwilId: '', phone: '' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal membuat akun Admin Kanwil.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password baru minimal 6 karakter!');
      return;
    }

    setIsSubmittingReset(true);
    try {
      await resetKanwilAdminPassword(selectedAdmin.id, newPassword);
      alert(`Password untuk ${selectedAdmin.name} berhasil direset!`);
      setIsResetModalOpen(false);
      setSelectedAdmin(null);
      setNewPassword('');
    } catch (err) {
      alert(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const s = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s) ||
      (a.kanwil?.name && a.kanwil.name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manajemen Admin Kantor Wilayah</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola akun petugas administrator tingkat Kantor Wilayah (Role: KANWIL_ADMIN)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Admin Kanwil</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, atau Kanwil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <button
          onClick={fetchData}
          className="self-end sm:self-auto p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 cursor-pointer transition-colors"
          title="Segarkan data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabel Admin Kanwil */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Memuat daftar Admin Kanwil...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Belum ada akun Admin Kanwil yang terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Administrator</th>
                  <th className="py-3 px-4">Email Login</th>
                  <th className="py-3 px-4">Kantor Wilayah</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          {admin.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{admin.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {admin.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        <Building2 className="w-3 h-3" />
                        <span>{admin.kanwil?.name || 'Kanwil Tidak Ditemukan'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {admin.phone || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        admin.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{admin.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setNewPassword('');
                          setIsResetModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-medium cursor-pointer transition-colors text-[11px]"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Admin Kanwil */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Tambah Akun Admin Kanwil Baru</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Petugas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso (Admin Kanwil)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Login *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin.kanwil@kemenkumham.go.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Awal *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kantor Wilayah *
                </label>
                <select
                  required
                  value={form.kanwilId}
                  onChange={(e) => setForm({ ...form, kanwilId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Kantor Wilayah --</option>
                  {kanwils
                    .filter((k) => k.status === 'Aktif')
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.wilayah || k.region || 'Indonesia'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAdd}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {isResetModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800">Reset Kata Sandi Admin</h2>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="font-bold text-slate-800">{selectedAdmin.name}</div>
                <div className="text-slate-500 text-[11px]">{selectedAdmin.email}</div>
                <div className="text-blue-600 font-semibold text-[11px] mt-0.5">
                  {selectedAdmin.kanwil?.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingReset}
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingReset ? 'Mereset...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
