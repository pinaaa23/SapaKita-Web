import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  KeyRound, 
  Power, 
  Mail, 
  X, 
  Check, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  CircleDollarSign,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getFinanceAccounts, 
  createFinanceAccount, 
  toggleFinanceAccountStatus, 
  resetFinanceAccountPassword 
} from '../../services/financeAccountService';
import { generateRandomPassword } from '../../services/userService';

/**
 * Helper untuk men-generate email resmi Finance dari Nama Lengkap
 * Contoh: "Julaika" -> "finance.julaika@sadewa.id"
 *         "Siti Rahmawati" -> "finance.siti.rahmawati@sadewa.id"
 */
const generateFinanceEmailFromName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .join('.');
  if (!clean) return '';
  return `finance.${clean}@sadewa.id`;
};

export default function FinanceAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal 1: Tambah Akun
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isEmailCustomized, setIsEmailCustomized] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'Aktif',
  });
  const [addFormError, setAddFormError] = useState('');

  // Modal 2: Hasil Pembuatan Akun (Password Sekali Tampil dengan Tombol Salin)
  const [isCreateSuccessModalOpen, setIsCreateSuccessModalOpen] = useState(false);
  const [newlyCreatedAccount, setNewlyCreatedAccount] = useState(null);

  // Modal 3: Konfirmasi Reset Password
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [selectedAccountForReset, setSelectedAccountForReset] = useState(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Modal 4: Hasil Reset Password (Password Baru Sekali Tampil)
  const [isResetResultModalOpen, setIsResetResultModalOpen] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');

  // Modal 5: Konfirmasi Toggle Status (Aktifkan / Nonaktifkan)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedAccountForStatus, setSelectedAccountForStatus] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Copy helper
  const [copiedField, setCopiedField] = useState('');

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField('');
    }, 2000);
  };

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getFinanceAccounts({
        search,
        status: statusFilter,
      });
      setAccounts(res.items || []);
    } catch (err) {
      console.error('Gagal mengambil daftar akun Finance:', err);
      showToast('Gagal memuat daftar akun Finance', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Buka Modal Tambah Akun (Inisialisasi form & password acak baru)
  const openAddModal = () => {
    const autoPass = generateRandomPassword();
    setAddForm({
      name: '',
      email: '',
      password: autoPass,
      phone: '',
      status: 'Aktif',
    });
    setIsEmailCustomized(false);
    setShowPassword(true);
    setAddFormError('');
    setIsAddModalOpen(true);
  };

  // Handle perubahan Nama Lengkap -> Otomatis buat email jika belum dicustom manual
  const handleNameChange = (val) => {
    setAddForm((prev) => {
      const nextEmail = !isEmailCustomized ? generateFinanceEmailFromName(val) : prev.email;
      return {
        ...prev,
        name: val,
        email: nextEmail,
      };
    });
  };

  // Handle perubahan manual pada input email
  const handleEmailChange = (val) => {
    setIsEmailCustomized(true);
    setAddForm((prev) => ({
      ...prev,
      email: val,
    }));
  };

  // Reset email agar kembali sinkron otomatis dengan nama
  const handleResetEmailToAuto = () => {
    setIsEmailCustomized(false);
    setAddForm((prev) => ({
      ...prev,
      email: generateFinanceEmailFromName(prev.name),
    }));
  };

  // Acak ulang password baru di form
  const handleRegeneratePassword = () => {
    const freshPass = generateRandomPassword();
    setAddForm((prev) => ({
      ...prev,
      password: freshPass,
    }));
  };

  // Submit Tambah Akun
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setAddFormError('');

    if (!addForm.name.trim()) {
      setAddFormError('Nama lengkap wajib diisi.');
      return;
    }

    let finalEmail = addForm.email.trim();
    if (!finalEmail) {
      setAddFormError('Email login wajib diisi.');
      return;
    }

    // Normalisasi domain @sadewa.id jika user hanya mengetik prefix
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@sadewa.id`;
    } else if (!finalEmail.toLowerCase().endsWith('@sadewa.id')) {
      setAddFormError('Email login wajib menggunakan domain @sadewa.id (contoh: finance.nama@sadewa.id)');
      return;
    }

    if (!addForm.password || addForm.password.trim().length < 6) {
      setAddFormError('Password minimal 6 karakter.');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await createFinanceAccount({
        name: addForm.name.trim(),
        email: finalEmail.toLowerCase(),
        password: addForm.password.trim(),
        phone: addForm.phone.trim(),
        status: addForm.status,
      });

      if (res?.success) {
        setNewlyCreatedAccount({
          name: addForm.name.trim(),
          email: finalEmail.toLowerCase(),
          password: addForm.password.trim(),
          status: addForm.status,
          source: res.source,
        });

        setIsAddModalOpen(false);
        setIsCreateSuccessModalOpen(true);
        fetchAccounts();
      } else {
        setAddFormError(res?.message || 'Gagal membuat akun Finance');
      }
    } catch (err) {
      setAddFormError(err?.message || 'Terjadi kesalahan sistem saat membuat akun');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Konfirmasi & Eksekusi Reset Password
  const handleExecuteResetPassword = async () => {
    if (!selectedAccountForReset) return;
    setIsSubmittingReset(true);
    try {
      const res = await resetFinanceAccountPassword(selectedAccountForReset.id);
      if (res?.success) {
        setNewResetPassword(res.password);
        setIsResetConfirmModalOpen(false);
        setIsResetResultModalOpen(true);
        showToast(`Password untuk ${selectedAccountForReset.name} berhasil direset!`);
      } else {
        showToast(res?.message || 'Gagal mereset kata sandi', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Gagal mereset kata sandi', 'error');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Konfirmasi & Eksekusi Toggle Status
  const handleExecuteToggleStatus = async () => {
    if (!selectedAccountForStatus) return;
    setIsSubmittingStatus(true);
    const targetStatus = selectedAccountForStatus.isActive ? 'Nonaktif' : 'Aktif';

    try {
      const res = await toggleFinanceAccountStatus(selectedAccountForStatus.id, targetStatus);
      if (res?.success) {
        showToast(`Akun ${selectedAccountForStatus.name} berhasil diubah menjadi '${targetStatus}'`);
        setIsStatusModalOpen(false);
        setSelectedAccountForStatus(null);
        fetchAccounts();
      } else {
        showToast(res?.message || 'Gagal mengubah status akun', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Gagal mengubah status akun', 'error');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-md hover:bg-black/5 text-slate-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Search Input, Status Filter & Tombol Tambah Akun Finance */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau email akun Finance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-bold"
          >
            <option value="All">Semua Status</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Nonaktif">Status: Nonaktif</option>
          </select>

          <button
            onClick={fetchAccounts}
            className="p-2 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"
            title="Segarkan data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Tombol Tambah Akun Finance: Sesuai Tema Resmi Sadewa (bg-primary / hover:bg-primary-dark) */}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs font-bold shadow-md shadow-primary/20 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Finance</span>
          </button>
        </div>
      </div>

      {/* Tabel Daftar Akun Finance */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Memuat daftar akun Finance...
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            {search || statusFilter !== 'All' 
              ? 'Tidak ada akun Finance yang sesuai dengan filter.' 
              : 'Belum ada akun Finance yang terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr 
                    key={acc.id} 
                    className={`hover:bg-slate-50/70 transition-colors ${!acc.isActive ? 'bg-slate-50/40 opacity-75' : ''}`}
                  >
                    {/* Nama Lengkap */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
                          {acc.name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{acc.name}</span>
                          <span className="text-[10px] text-primary font-bold inline-flex items-center gap-1">
                            <CircleDollarSign className="w-3 h-3 text-primary" />
                            <span>Finance Pusat</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{acc.email}</span>
                      </div>
                    </td>

                    {/* Status (Aktif / Nonaktif) */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${acc.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{acc.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                    </td>

                    {/* Aksi: Reset Password & Nonaktifkan/Aktifkan */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedAccountForReset(acc);
                            setIsResetConfirmModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 font-medium cursor-pointer transition-colors text-[11px]"
                          title="Reset password akun"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAccountForStatus(acc);
                            setIsStatusModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors text-[11px] ${
                            acc.isActive
                              ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={acc.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                        >
                          <Power className={`w-3.5 h-3.5 ${acc.isActive ? 'text-rose-500' : 'text-emerald-500'}`} />
                          <span>{acc.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Form Tambah Akun Finance */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Tambah Akun Finance</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {addFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{addFormError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Julaika"
                  value={addForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-medium"
                />
              </div>

              {/* Email Login (Domain @sadewa.id) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Login (domain @sadewa.id) *
                  </label>
                  {isEmailCustomized && addForm.name && (
                    <button
                      type="button"
                      onClick={handleResetEmailToAuto}
                      className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      Otomatis dari Nama
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="finance.nama@sadewa.id"
                    value={addForm.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full pl-3 pr-24 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-mono font-medium"
                  />
                  {!addForm.email.includes('@') && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      @sadewa.id
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Terisi otomatis dari nama. Contoh: <code className="text-primary font-bold font-mono">finance.nama@sadewa.id</code>
                </p>
              </div>

              {/* Password Akun (Otomatis & Bisa Diedit / Diganti) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password Akun *
                  </label>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    title="Buat kata sandi acak baru"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Acak Ulang</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password atau gunakan acak"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-3 pr-20 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 font-mono tracking-wider font-bold"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(addForm.password, 'form-pass')}
                      className="p-1 rounded text-slate-400 hover:text-primary cursor-pointer transition-colors"
                      title="Salin password"
                    >
                      {copiedField === 'form-pass' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Password otomatis dibuatkan. Anda dapat mengubahnya secara manual jika ingin kata sandi sendiri.
                </p>
              </div>

              {/* Status Akun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Akun *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, status: 'Aktif' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      addForm.status === 'Aktif'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Aktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, status: 'Nonaktif' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      addForm.status === 'Nonaktif'
                        ? 'bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-400/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Nonaktif</span>
                  </button>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAdd}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white cursor-pointer shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Hasil Pembuatan Akun (Password Sekali Tampil dengan Tombol Salin) */}
      {isCreateSuccessModalOpen && newlyCreatedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Akun Finance Berhasil Dibuat</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">{newlyCreatedAccount.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSuccessModalOpen(false)}
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

              {/* Rincian Akun */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nama Lengkap</span>
                  <span className="font-bold text-slate-800">{newlyCreatedAccount.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Login</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-slate-700 font-bold">{newlyCreatedAccount.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(newlyCreatedAccount.email, 'email')}
                      className="text-primary hover:underline text-[11px] font-bold cursor-pointer"
                    >
                      {copiedField === 'email' ? 'Disalin!' : 'Salin Email'}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status Akun</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-0.5">
                    {newlyCreatedAccount.status}
                  </span>
                </div>
              </div>

              {/* Password Baru */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-inner">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password Akun</p>
                  <p className="text-sm font-bold font-mono tracking-wider truncate mt-0.5 text-emerald-400">
                    {newlyCreatedAccount.password}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(newlyCreatedAccount.password, 'create-pass')}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedField === 'create-pass' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedField === 'create-pass' ? 'Disalin!' : 'Salin Password'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateSuccessModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Saya Sudah Menyimpan Akun Ini &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Reset Password */}
      {isResetConfirmModalOpen && selectedAccountForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Reset Password Akun Finance?
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Sistem akan membuatkan kata sandi acak baru untuk akun <strong>"{selectedAccountForReset.name}"</strong> ({selectedAccountForReset.email}).
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
                  disabled={isSubmittingReset}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReset ? 'Mereset...' : 'Ya, Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Hasil Reset Password (Password Baru Sekali Tampil dengan Tombol Salin) */}
      {isResetResultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Password Berhasil Direset</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">{selectedAccountForReset?.name}</p>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password Baru Sementara</p>
                  <p className="text-sm font-bold text-slate-800 font-mono tracking-wider truncate mt-0.5">{newResetPassword}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(newResetPassword, 'reset-pass')}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedField === 'reset-pass' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
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

      {/* MODAL 5: Konfirmasi Toggle Status (Aktifkan / Nonaktifkan) */}
      {isStatusModalOpen && selectedAccountForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                selectedAccountForStatus.isActive 
                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                <Power className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedAccountForStatus.isActive ? 'Nonaktifkan Akun Finance?' : 'Aktifkan Akun Finance?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin {selectedAccountForStatus.isActive ? 'menonaktifkan' : 'mengaktifkan'} akun <strong>"{selectedAccountForStatus.name}"</strong> ({selectedAccountForStatus.email})?
                </p>
                {selectedAccountForStatus.isActive && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200/60">
                    Pengguna tidak akan dapat login ke dashboard Finance selama akun dalam status nonaktif.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteToggleStatus}
                  disabled={isSubmittingStatus}
                  className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50 ${
                    selectedAccountForStatus.isActive
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  }`}
                >
                  {isSubmittingStatus 
                    ? 'Memproses...' 
                    : (selectedAccountForStatus.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
