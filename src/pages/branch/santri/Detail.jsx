import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Power, 
  User, 
  Building2, 
  Wallet, 
  Calendar, 
  AlertCircle, 
  Users, 
  Phone, 
  KeyRound, 
  X, 
  Check,
  Eye,
  EyeOff 
} from 'lucide-react';
import { getInmates, updateInmateStatus, resetInmatePin } from '../../../services/santriService';
import { getBranches } from '../../../services/branchService';
import { getContacts } from '../../../services/contactService';
import { getAuthUser } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../config/menuConfig';

const SantriDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSupervisor, role, uptName, logout } = useAuth();
  const authUser = getAuthUser();
  const rawRole = (role || authUser?.role || '').toUpperCase();
  const isSuperAdmin = rawRole === 'SUPERADMIN' || rawRole === 'ADMIN_PUSAT' || role === ROLES.SUPERADMIN;
  const backRoute = isSuperAdmin ? '/santri' : '/branch/santri';

  const [santri, setSantri] = useState(null);
  const [toastMessage, setToastMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // State Reset PIN
  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [resetPinError, setResetPinError] = useState('');
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const showToast = (text, type = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  const loadSantri = async () => {
    setIsLoading(true);
    setAccessDenied(false);
    const targetIdentifier = decodeURIComponent(id || '').trim();
    try {
      const [res, branchesRes] = await Promise.allSettled([
        getInmates({ search: targetIdentifier }),
        isSuperAdmin ? getBranches({ limit: 100 }) : Promise.resolve(null)
      ]);

      if (res.status === 'rejected') {
        if (res.reason?.status === 403) {
          setAccessDenied(true);
          setSantri(null);
          return;
        }
        if (res.reason?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        throw res.reason;
      }

      const inmatesData = res.status === 'fulfilled' ? res.value : null;
      const branchesData = branchesRes.status === 'fulfilled' ? branchesRes.value : null;

      const branchesMap = {};
      if (branchesData) {
        const list = Array.isArray(branchesData?.items) ? branchesData.items : (Array.isArray(branchesData) ? branchesData : []);
        list.forEach(b => {
          if (b.id) branchesMap[b.id] = b.name;
        });
      }

      const found = inmatesData?.items?.find(i => 
        String(i.identifier || '').trim() === targetIdentifier || 
        String(i.wbpRegNumber || '').trim() === targetIdentifier ||
        String(i.id || '').trim() === targetIdentifier
      );

      if (found) {
        let resolvedBranchName = found.branchName || '-';
        if (!isSuperAdmin) {
          const sessionBranch = (uptName && uptName !== 'Cabang Terdaftar' && uptName !== 'UPT Anda') ? uptName : (authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : null));
          resolvedBranchName = sessionBranch || (found.branchName && found.branchName !== 'Pusat' && found.branchName !== '-' && found.branchName !== 'Cabang Terdaftar' ? found.branchName : 'Pondok Utama');
        } else if (found.branchId && branchesMap[found.branchId]) {
          resolvedBranchName = branchesMap[found.branchId];
        } else if (found.branchName && found.branchName !== '-' && found.branchName !== 'Cabang Terdaftar') {
          resolvedBranchName = found.branchName;
        } else {
          resolvedBranchName = (uptName && uptName !== 'Cabang Terdaftar' && uptName !== 'UPT Anda') ? uptName : 'Pondok Utama';
        }

        const effectiveBlockRoom = (!found.blockRoom || found.blockRoom === '-') 
          ? 'Asrama A / Kamar 01' 
          : found.blockRoom;

        let familyContacts = Array.isArray(found.families) ? [...found.families] : [];
        if (found.id) {
          try {
            const contactsRes = await getContacts({ inmateId: found.id });
            if (Array.isArray(contactsRes) && contactsRes.length > 0) {
              familyContacts = contactsRes.map((c, idx) => ({
                id: c.id || `fam-${idx}`,
                name: c.contactName || c.name || 'Wali Santri',
                relationship: c.relation || c.relationship || 'Orang Tua / Wali',
                phone: c.phone || '-',
                hasWhatsapp: c.hasWhatsapp,
                status: c.status || 'Approved',
                email: c.email || '',
              }));
            }
          } catch (e) {
            console.warn('[SantriDetail] Gagal mengambil data kontak wali dari contactService:', e);
          }
        }

        setSantri({
          id: found.id,
          wbpRegNumber: found.wbpRegNumber || found.identifier || '-',
          name: found.name || '-',
          callBalance: typeof found.callBalance === 'number' && !isNaN(found.callBalance) ? found.callBalance : null,
          blockRoom: effectiveBlockRoom,
          entryDate: found.entryDate || null,
          status: found.status || 'Aktif',
          commStatus: found.commStatus || 'Aktif',
          isActive: found.isActive !== undefined ? found.isActive : true,
          branchName: resolvedBranchName,
          families: familyContacts,
        });
      } else {
        setSantri(null);
      }
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setAccessDenied(true);
        setSantri(null);
        return;
      }
      console.log('[SantriDetail] Error load santri:', err);
      setSantri(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSantri();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-xs text-slate-500 mt-2 font-semibold">Memuat data Santri...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 max-w-xl mx-auto p-6 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Anda tidak memiliki akses ke data ini</h2>
        <p className="text-xs text-slate-500 mt-1">
          Role akun Anda tidak memiliki izin untuk melihat rincian data Santri pada server backend.
        </p>
        <Link 
          to={backRoute} 
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>
      </div>
    );
  }

  if (!santri) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 max-w-xl mx-auto p-6 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Data Santri tidak ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1">
          Santri dengan NIS/identifier <span className="font-mono font-bold text-slate-700">"{decodeURIComponent(id || '')}"</span> tidak ditemukan pada database server.
        </p>
        <Link 
          to={backRoute} 
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link 
          to={backRoute}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>

        {/* Action Buttons (Khusus Supervisor / SPV) */}
        {isSupervisor && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isTogglingStatus || santri.isActive === undefined}
              onClick={async () => {
                const newStatus = !santri.isActive;
                setIsTogglingStatus(true);
                try {
                  await updateInmateStatus(santri.id, newStatus);
                  showToast(newStatus ? 'Akun Santri berhasil diaktifkan.' : 'Akun Santri berhasil dinonaktifkan.', 'success');
                  await loadSantri();
                } catch (err) {
                  if (err?.status === 401) {
                    logout();
                    navigate('/login', { replace: true });
                    return;
                  }
                  if (err?.status === 403) {
                    showToast('Anda tidak memiliki akses.', 'error');
                  } else if (err?.status === 404 || err?.status === 405 || err?.isNetworkError || err?.status === 0) {
                    showToast('Fitur ini belum tersedia di sistem backend.', 'error');
                  } else if (err?.status === 400) {
                    showToast(err?.message || 'Permintaan gagal.', 'error');
                  } else {
                    showToast(err?.message || 'Gagal mengubah status Santri.', 'error');
                  }
                } finally {
                  setIsTogglingStatus(false);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                santri.commStatus === 'Aktif' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isTogglingStatus ? 'Memproses...' : (santri.commStatus === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun')}
            </button>

            <button
              type="button"
              onClick={() => {
                setNewPin('');
                setResetPinError('');
                setShowResetPassword(false);
                setIsResetPinModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset Password
            </button>

            <Link
              to={`/branch/santri/${santri.id}/edit`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Data
            </Link>
          </div>
        )}
      </div>

      {/* Hero Overview Card */}
      <div className="bg-gradient-to-r from-[#0D7A73] via-[#168B83] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* Avatar Thumbnail */}
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md p-1 border-2 border-white/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            <User className="w-12 h-12 text-white/90" />
          </div>

          {/* Core Santri Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{santri.name}</h2>
              <span className="font-mono text-xs font-bold bg-white/20 text-white px-3 py-0.5 rounded-full border border-white/30">
                NIS: {santri.wbpRegNumber}
              </span>
              {santri.status ? (
                <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                  santri.status === 'Aktif' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' :
                  santri.status === 'Dipindahkan' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' :
                  'bg-slate-500/30 text-slate-200 border border-slate-400/40'
                }`}>
                  {santri.status === 'Sudah Bebas' ? 'Alumni' : santri.status}
                </span>
              ) : (
                <span className="text-xs text-white/70 font-medium">-</span>
              )}
            </div>

            <p className="text-teal-100 text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-teal-200" /> {santri.branchName || '-'} • <strong className="text-white">{santri.blockRoom || '-'}</strong>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-teal-100 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-teal-300" /> Tanggal Terdaftar: {santri.entryDate ? new Date(santri.entryDate).toLocaleDateString('id-ID') : '-'}
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Wallet className="w-3.5 h-3.5 text-amber-300" /> Saldo Panggilan: <strong className="text-amber-300 font-extrabold">{typeof santri.callBalance === 'number' ? formatCurrency(santri.callBalance) : '-'}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <span>Status Akun:</span>
                <span className={`font-bold ${santri.commStatus === 'Aktif' ? 'text-emerald-300' : santri.commStatus ? 'text-rose-300' : 'text-teal-200'}`}>
                  {santri.commStatus || '-'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Identitas Lengkap Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Rincian Identitas Santri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Nama Lengkap</span>
            <span className="font-bold text-slate-800 text-sm">{santri.name}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">NIS (Nomor Induk Santri)</span>
            <span className="font-bold font-mono text-slate-800 text-sm">{santri.wbpRegNumber}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Pondok Pesantren</span>
            <span className="font-semibold text-slate-800">{santri.branchName || '-'}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Penempatan Asrama / Kamar</span>
            <span className="font-semibold text-slate-800">{santri.blockRoom || '-'}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Tanggal Terdaftar</span>
            <span className="font-semibold text-slate-800">{santri.entryDate ? new Date(santri.entryDate).toLocaleDateString('id-ID') : '-'}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Saldo Panggilan</span>
            <span className="font-bold text-emerald-700">{typeof santri.callBalance === 'number' ? formatCurrency(santri.callBalance) : '-'}</span>
          </div>
        </div>
      </div>

      {/* Card Wali Santri Terdaftar */}
      <div id="families" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Wali Santri Terdaftar ({santri.families?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Daftar kontak keluarga/wali resmi yang didaftarkan untuk layanan komunikasi santri
            </span>
          </div>
        </div>

        {santri.families && santri.families.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {santri.families.map((fam, idx) => (
              <div
                key={fam.id || idx}
                className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate" title={fam.name}>
                        {fam.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200/60 rounded-full text-[10px] font-bold">
                          {fam.relationship || 'Wali Santri'}
                        </span>
                        {fam.hasWhatsapp && (
                          <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[9px] font-bold">
                            WhatsApp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5 text-xs text-slate-700 font-mono font-bold">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fam.phone}</span>
                  </div>
                  {fam.status && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-sans font-semibold ${
                      fam.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {fam.status === 'Approved' ? 'Terverifikasi' : fam.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50/60 border border-slate-100 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Belum ada wali santri terdaftar</p>
            <p className="text-[11px] text-slate-400">
              Belum ada kontak keluarga/wali yang didaftarkan untuk santri ini.
            </p>
          </div>
        )}
      </div>

      {/* Modal Reset PIN */}
      {isResetPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Reset Password Santri</h3>
                  <p className="text-[11px] text-slate-400">Atur ulang password login untuk {santri.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newPin || newPin.length < 6) {
                  setResetPinError('Password baru harus minimal 6 karakter (bisa huruf/angka).');
                  return;
                }
                setIsResettingPin(true);
                setResetPinError('');
                try {
                  await resetInmatePin(santri.id, newPin);
                  showToast('Password Santri berhasil direset.', 'success');
                  setIsResetPinModalOpen(false);
                  setNewPin('');
                } catch (err) {
                  console.error('[SantriDetail] Reset Password failed:', err);
                  setResetPinError(err?.message || 'Gagal mereset password. Pastikan password minimal 6 karakter.');
                } finally {
                  setIsResettingPin(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru (Minimal 6 Karakter) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    maxLength={20}
                    required
                    placeholder="Masukkan minimal 6 karakter password baru (misal: santri123)"
                    value={newPin}
                    onChange={(e) => {
                      setNewPin(e.target.value);
                      setResetPinError('');
                    }}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    tabIndex={-1}
                    title={showResetPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {resetPinError && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {resetPinError}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Password ini digunakan oleh santri untuk login ke wartel SapaKita (bisa huruf/angka).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetPinModalOpen(false)}
                  disabled={isResettingPin}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResettingPin}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isResettingPin ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Simpan Password Baru
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SantriDetail;