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
  AlertCircle
} from 'lucide-react';
import { getInmates, updateInmateStatus } from '../../../services/inmateService';
import { getBranches } from '../../../services/branchService';
import { logout, getAuthUser } from '../../../services/api';

const InmatesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const rawRole = (authUser?.role || '').toUpperCase();
  const isSuperAdmin = rawRole === 'SUPERADMIN' || rawRole === 'ADMIN_PUSAT';
  const backRoute = isSuperAdmin ? '/inmates' : '/branch/inmates';

  const [inmate, setInmate] = useState(null);
  const [toastMessage, setToastMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const showToast = (text, type = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  const loadInmate = async () => {
    setIsLoading(true);
    setAccessDenied(false);
    const targetIdentifier = decodeURIComponent(id || '').trim();
    try {
      // Panggil getInmates dan daftar cabang jika Superadmin
      const [res, branchesRes] = await Promise.allSettled([
        getInmates({ search: targetIdentifier }),
        isSuperAdmin ? getBranches({ limit: 100 }) : Promise.resolve(null)
      ]);

      if (res.status === 'rejected') {
        if (res.reason?.status === 403) {
          setAccessDenied(true);
          setInmate(null);
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

      // Map branches untuk Superadmin
      const branchesMap = {};
      if (branchesData) {
        const list = Array.isArray(branchesData?.items) ? branchesData.items : (Array.isArray(branchesData) ? branchesData : []);
        list.forEach(b => {
          if (b.id) branchesMap[b.id] = b.name;
        });
      }

      // Cocokkan persis identifier / wbpRegNumber / id dengan parameter URL
      const found = inmatesData?.items?.find(i => 
        String(i.identifier || '').trim() === targetIdentifier || 
        String(i.wbpRegNumber || '').trim() === targetIdentifier ||
        String(i.id || '').trim() === targetIdentifier
      );

      if (found) {
        // Tentukan nama cabang:
        // BRANCH_ADMIN -> dari data sesi login
        // SUPERADMIN -> dari daftar cabang berdasarkan branchId (jangan tampilkan UUID)
        let resolvedBranchName = '-';
        if (!isSuperAdmin) {
          const sessionBranch = authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : null);
          resolvedBranchName = sessionBranch || '-';
        } else if (found.branchId && branchesMap[found.branchId]) {
          resolvedBranchName = branchesMap[found.branchId];
        }

        setInmate({
          id: found.id,
          wbpRegNumber: found.wbpRegNumber || found.identifier || '-',
          name: found.name || '-',
          callBalance: typeof found.callBalance === 'number' && !isNaN(found.callBalance) ? found.callBalance : null,
          blockRoom: found.blockRoom || null,
          entryDate: found.entryDate || null,
          status: found.status || null,
          commStatus: found.commStatus || null,
          isActive: found.isActive,
          branchName: resolvedBranchName
        });
      } else {
        setInmate(null);
      }
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setAccessDenied(true);
        setInmate(null);
        return;
      }
      console.log('[InmatesDetail] Error load inmate:', err);
      setInmate(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInmate();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-xs text-slate-500 mt-2 font-semibold">Memuat data narapidana...</p>
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
          Role akun Anda tidak memiliki izin untuk melihat rincian data narapidana pada server backend.
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

  if (!inmate) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 max-w-xl mx-auto p-6 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Data narapidana tidak ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1">
          Narapidana dengan NIP/identifier <span className="font-mono font-bold text-slate-700">"{decodeURIComponent(id || '')}"</span> tidak ditemukan pada database server.
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
      <div className="flex items-center justify-between">
        <Link 
          to={backRoute}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>

        {/* Action buttons only visible for Branch Admin, hidden for Superadmin (Read-only) */}
        {!isSuperAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isTogglingStatus || inmate.isActive === undefined}
              onClick={async () => {
                const newStatus = !inmate.isActive;
                setIsTogglingStatus(true);
                try {
                  await updateInmateStatus(inmate.id, newStatus);
                  showToast(newStatus ? 'Akun narapidana berhasil diaktifkan.' : 'Akun narapidana berhasil dinonaktifkan.', 'success');
                  await loadInmate();
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
                    showToast('Fitur ini belum tersedia di sistem backend.', 'error');
                  }
                } finally {
                  setIsTogglingStatus(false);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                inmate.commStatus === 'Aktif' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isTogglingStatus ? 'Memproses...' : (inmate.commStatus === 'Aktif' ? 'Nonaktifkan Akun Komunikasi' : 'Aktifkan Akun Komunikasi')}
            </button>

            <Link
              to={`/branch/inmates/${inmate.id}/edit`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Data
            </Link>
          </div>
        )}
      </div>

      {/* Hero Overview Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* Avatar Thumbnail */}
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md p-1 border-2 border-white/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            <User className="w-12 h-12 text-white/90" />
          </div>

          {/* Core Inmate Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{inmate.name}</h2>
              <span className="font-mono text-xs font-bold bg-white/20 text-white px-3 py-0.5 rounded-full border border-white/30">
                NIP: {inmate.wbpRegNumber}
              </span>
              {inmate.status ? (
                <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                  inmate.status === 'Aktif' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' :
                  inmate.status === 'Dipindahkan' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' :
                  'bg-slate-500/30 text-slate-200 border border-slate-400/40'
                }`}>
                  {inmate.status}
                </span>
              ) : (
                <span className="text-xs text-white/70 font-medium">-</span>
              )}
            </div>

            <p className="text-blue-100 text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-blue-200" /> {inmate.branchName || '-'} • <strong className="text-white">{inmate.blockRoom || '-'}</strong>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-blue-100 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-blue-300" /> Tanggal Terdaftar: {inmate.entryDate ? new Date(inmate.entryDate).toLocaleDateString('id-ID') : '-'}
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Wallet className="w-3.5 h-3.5 text-amber-300" /> Saldo Panggilan: <strong className="text-amber-300 font-extrabold">{typeof inmate.callBalance === 'number' ? formatCurrency(inmate.callBalance) : '-'}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <span>Status Akun:</span>
                <span className={`font-bold ${inmate.commStatus === 'Aktif' ? 'text-emerald-300' : inmate.commStatus ? 'text-rose-300' : 'text-blue-200'}`}>
                  {inmate.commStatus || '-'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Identitas Lengkap Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Rincian Identitas WBP
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Nama Lengkap</span>
            <span className="font-bold text-slate-800 text-sm">{inmate.name}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">NIP (Nomor Induk Narapidana)</span>
            <span className="font-bold font-mono text-slate-800 text-sm">{inmate.wbpRegNumber}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Cabang Lapas</span>
            <span className="font-semibold text-slate-800">{inmate.branchName || '-'}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Penempatan Blok / Kamar</span>
            <span className="font-semibold text-slate-800">{inmate.blockRoom || '-'}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Tanggal Terdaftar</span>
            <span className="font-semibold text-slate-800">{inmate.entryDate ? new Date(inmate.entryDate).toLocaleDateString('id-ID') : '-'}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium mb-1">Saldo Panggilan</span>
            <span className="font-bold text-emerald-700">{typeof inmate.callBalance === 'number' ? formatCurrency(inmate.callBalance) : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InmatesDetail;
