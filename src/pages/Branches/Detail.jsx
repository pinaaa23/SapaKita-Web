import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  AlertTriangle, 
  PhoneCall, 
  Wallet, 
  Users, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  UserCheck,
  AlertCircle,
  Key,
  Copy,
  Check,
  X,
  Landmark,
  Receipt
} from 'lucide-react';
import { getBranchById, updateBranchStatus } from '../../services/branchService';
import { getUsers, resetUserPassword } from '../../services/userService';
import { getCallHistory } from '../../services/callService';
import { getBalanceTransactions } from '../../services/balanceService';
import { apiFetch, logout } from '../../services/api';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(null);
  const [branchUsers, setBranchUsers] = useState([]);
  const [branchCalls, setBranchCalls] = useState([]);
  const [totalCallsCount, setTotalCallsCount] = useState(0);
  const [branchTransactions, setBranchTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Reset Password Modal State
  const [resetModalData, setResetModalData] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadBranchDetail = async () => {
    setIsLoading(true);
    try {
      const b = await getBranchById(id);
      if (b && !b.kanwil && !b.kanwilName) {
        try {
          const kRes = await apiFetch('/api/kanwil');
          const kanwils = kRes?.data || [];
          for (const k of kanwils) {
            if (Array.isArray(k.branches) && k.branches.some((br) => (br.id || br) === b.id || (br.name && br.name === b.name))) {
              b.kanwil = k;
              b.kanwilName = k.name;
              break;
            }
          }
        } catch (_) {}
      }
      setBranch(b);
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setBranch(null);
    }

    try {
      const [uRes, cRes, tRes] = await Promise.allSettled([
        getUsers({ branchId: id, limit: 100 }),
        getCallHistory({ branchId: id, limit: 500 }),
        getBalanceTransactions({ branchId: id, limit: 500 }),
      ]);
      if (uRes.status === 'fulfilled') {
        const rawUsers = uRes.value?.items || [];
        // Pastikan hanya petugas yang benar-benar terdaftar di cabang bersangkutan
        const onlyThisBranchUsers = rawUsers.filter(
          (u) => String(u.branchId) === String(id) || String(u.branch?.id) === String(id)
        );
        setBranchUsers(onlyThisBranchUsers);
      }
      if (cRes.status === 'fulfilled') {
        const callData = cRes.value;
        const rawCalls = callData?.items || [];
        setBranchCalls(rawCalls);
        const total = typeof callData?.total === 'number'
          ? callData.total
          : typeof callData?.pagination?.total === 'number'
            ? callData.pagination.total
            : rawCalls.length;
        setTotalCallsCount(total);
      }
      if (tRes.status === 'fulfilled') {
        const rawTransactions = tRes.value?.items || [];
        // Pastikan hanya transaksi yang benar-benar milik cabang bersangkutan
        const onlyThisBranchTransactions = rawTransactions.filter(
          (t) => String(t.branchId) === String(id)
        );
        setBranchTransactions(onlyThisBranchTransactions);
      }
    } catch (e) {
      console.log('[BranchDetail] Error load related items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchDetail();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!branch) return;
    const nextStatus = !branch.isActive;
    try {
      await updateBranchStatus(id, nextStatus ? 'Aktif' : 'Nonaktif');
      showToast(nextStatus ? 'Cabang berhasil diaktifkan.' : 'Cabang berhasil dinonaktifkan.');
      await loadBranchDetail();
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      showToast(err?.data?.message || err?.message || 'Gagal mengubah status cabang.');
    }
  };

  const handleResetPassword = async (user) => {
    if (!user?.id) return;
    setIsResetting(true);
    try {
      const res = await resetUserPassword(user.id);
      const newPwd = res?.newPassword || res?.password || res?.data?.newPassword || res?.data?.password;
      if (newPwd) {
        setResetModalData({
          userName: user.name,
          userEmail: user.email,
          newPassword: newPwd
        });
      } else {
        showToast(`Tautan reset password telah dikirim ke ${user.email}`);
      }
    } catch (err) {
      console.log('[BranchDetail] Error reset password:');
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      showToast('Fitur ini belum tersedia di sistem backend');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="space-y-5 max-w-lg mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Cabang Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Data cabang dengan ID {id} tidak ditemukan atau belum tersedia.</p>
          <Link 
            to="/branches" 
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Daftar Cabang
          </Link>
        </div>
      </div>
    );
  }

  const totalCalls = totalCallsCount || branchCalls.length;
  const totalRevenue = branchTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const occupancyRate = branch.capacity > 0 ? Math.round((branch.inmateCount / branch.capacity) * 100) : 0;
  const isOvercapacity = occupancyRate > 100;
  const adminEmailDisplay = branch.adminEmail || branchUsers[0]?.email || null;

  // Rincian Status Panggilan Cabang
  const answeredCallsCount = branchCalls.filter(
    (c) => c.status === 'Answered' || c.status === 'Terjawab' || c.status === 'ENDED' || c.status === 'CONNECTED'
  ).length;

  const rejectedCallsCount = branchCalls.filter(
    (c) => c.status === 'Rejected' || c.status === 'Ditolak' || c.status === 'REJECTED'
  ).length;

  const missedCallsCount = branchCalls.filter(
    (c) => c.status === 'Missed' || c.status === 'Tidak Terjawab' || c.status === 'MISSED' || c.status === 'Busy' || c.status === 'Sibuk'
  ).length;

  const loadedCallsCount = branchCalls.length;
  const callScale = (loadedCallsCount > 0 && totalCalls > loadedCallsCount) ? (totalCalls / loadedCallsCount) : 1;

  const displayAnswered = callScale === 1 ? answeredCallsCount : Math.round(answeredCallsCount * callScale);
  const displayRejected = callScale === 1 ? rejectedCallsCount : Math.round(rejectedCallsCount * callScale);
  const displayMissed = callScale === 1 ? missedCallsCount : Math.max(0, totalCalls - displayAnswered - displayRejected);

  const answeredPercentage = totalCalls > 0 ? Math.round((displayAnswered / totalCalls) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-amber-600 hover:text-amber-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex items-center gap-3.5">
          <Link 
            to="/branches"
            className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 shadow-2xs"
            title="Kembali ke Daftar Cabang"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-bold text-slate-800 text-base md:text-lg">{branch.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                branch.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {branch.status === 'Active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{branch.location}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Landmark className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{branch.kanwil?.name || branch.kanwilName || 'Belum Terhubung ke Kanwil'}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span>ID: {String(branch.id).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link 
            to={`/branches/${id}/edit`}
            className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-primary" /> Edit Cabang
          </Link>
          <button 
            type="button"
            onClick={handleToggleStatus}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              branch.status === 'Active'
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> 
            {branch.status === 'Active' ? 'Nonaktifkan Cabang' : 'Aktifkan Cabang'}
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total Panggilan (Cabang) dengan Sub-metrics Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Panggilan (Cabang)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-xl font-extrabold text-slate-800">{totalCalls} Panggilan</h3>
                {totalCalls > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {answeredPercentage}% Berhasil
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            {/* Segmented Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
              {totalCalls > 0 ? (
                <>
                  <div 
                    title={`Terjawab: ${displayAnswered} (${answeredPercentage}%)`}
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(displayAnswered / totalCalls) * 100}%` }}
                  />
                  <div 
                    title={`Tidak Terjawab: ${displayMissed}`}
                    className="h-full bg-amber-400 transition-all duration-500" 
                    style={{ width: `${(displayMissed / totalCalls) * 100}%` }}
                  />
                  <div 
                    title={`Ditolak: ${displayRejected}`}
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ width: `${(displayRejected / totalCalls) * 100}%` }}
                  />
                </>
              ) : (
                <div className="h-full bg-slate-200 w-full" />
              )}
            </div>

            {/* Sub-metrics Status Badges */}
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mt-2 flex-wrap gap-1">
              <span className="flex items-center gap-1.5" title="Panggilan berhasil terhubung">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong className="text-slate-800 font-bold">{displayAnswered}</strong> Terjawab</span>
              </span>
              <span className="flex items-center gap-1.5" title="Panggilan tidak diangkat">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                <span><strong className="text-slate-800 font-bold">{displayMissed}</strong> Tak Terjawab</span>
              </span>
              <span className="flex items-center gap-1.5" title="Panggilan ditolak tujuan">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span><strong className="text-slate-800 font-bold">{displayRejected}</strong> Ditolak</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pendapatan (Cabang) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan (Cabang)</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-full"></div>
            </div>
            <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 mt-1.5">
              <span>{branchTransactions.length} Transaksi Kantin</span>
              <span className="text-emerald-700 font-bold">100% Kas Kantin UPT</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tingkat Hunian (Okupansi) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tingkat Hunian (Okupansi)</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{occupancyRate}%</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${isOvercapacity ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-primary border border-blue-100'}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyRate > 100 
                    ? 'bg-rose-500' 
                    : occupancyRate > 80 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 mt-1.5">
              <span>{new Intl.NumberFormat('id-ID').format(branch.inmateCount)} WBP Aktif</span>
              <span>Kapasitas: {new Intl.NumberFormat('id-ID').format(branch.capacity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Operational Details & Branch Officers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Informasi Lembaga & Operasional</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Data Terverifikasi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Nama Lembaga
                </p>
                <p className="text-slate-800 font-bold text-sm">{branch.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Wilayah / Kota
                </p>
                <p className="text-slate-800 font-bold text-sm">{branch.location}</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" /> Kantor Wilayah (Kanwil)
                </p>
                {branch.kanwil?.name || branch.kanwilName ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      <Landmark className="w-3.5 h-3.5 text-blue-600" />
                      {branch.kanwil?.name || branch.kanwilName}
                    </span>
                    {branch.kanwil?.region && (
                      <span className="text-[11px] text-slate-500 font-medium">({branch.kanwil.region})</span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    Belum Ditetapkan ke Kanwil
                  </span>
                )}
              </div>

              <div className="md:col-span-2 space-y-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Alamat Lengkap
                </p>
                <p className="text-slate-700 font-medium leading-relaxed">{branch.address || '-'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Kontak / Telepon Kantor
                </p>
                <p className="text-slate-800 font-bold">{branch.phone || '-'}</p>
              </div>

              {/* Email Kepala UPT */}
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Login Kepala UPT
                </p>
                <p className="text-slate-800 font-mono font-bold text-xs">
                  {adminEmailDisplay || 'Belum diatur'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Status Operasional Sadewa
                </p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    branch.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${branch.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {branch.status === 'Active' ? 'Sistem Aktif & Terhubung' : 'Sistem Dinonaktifkan'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Kapasitas Maksimal
                </p>
                <p className="text-slate-800 font-bold text-sm">
                  {new Intl.NumberFormat('id-ID').format(branch.capacity)} <span className="text-slate-500 font-normal text-xs">Orang</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Jumlah WBP Terdaftar
                </p>
                <p className="text-slate-800 font-bold text-sm">
                  {new Intl.NumberFormat('id-ID').format(branch.inmateCount)} <span className="text-slate-500 font-normal text-xs">Orang</span>
                </p>
              </div>

              {/* Tarif Kontrak Billing */}
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" /> Tarif Panggilan Billing
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-black font-mono text-sm">
                    Rp {Number(branch.contractRatePerSecond || 15).toLocaleString('id-ID')} / detik
                  </span>
                  <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Rp {(Number(branch.contractRatePerSecond || 15) * 60).toLocaleString('id-ID')} / menit
                  </span>
                </div>
              </div>

              {/* Bagi Hasil 4 Pihak */}
              <div className="md:col-span-2 space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" /> Porsi Bagi Hasil 4 Pihak
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Kepala UPT</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">{branch.shareKepalaUptPercent || 5}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Koperasi Lapas</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">{branch.shareKoperasiPercent || 30}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Inkopasindo</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">{branch.shareInkopasindoPercent || 10}%</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Vendor Sadewa</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">{branch.shareVendorPercent || 55}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Officers Sidebar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Petugas Terdaftar</h3>
            </div>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-lg border border-primary/20">
              {branchUsers.length} Petugas
            </span>
          </div>

          <div className="p-0 flex-1 overflow-y-auto divide-y divide-slate-100">
            {branchUsers.length > 0 ? (
              branchUsers.map(user => (
                <div key={user.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.role}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                          <Mail className="w-2.5 h-2.5" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {user.status === 'Active' ? 'Aktif' : 'Suspended'}
                    </span>
                  </div>

                  {/* Reset Password Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => handleResetPassword(user)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Reset password login petugas ini"
                    >
                      <Key className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                Belum ada data petugas yang terhubung ke cabang ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Success Modal (Shown ONCE with credentials) */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-700 text-white relative">
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Password Berhasil Direset</h3>
                  <p className="text-xs text-indigo-100 mt-0.5">{resetModalData.userName}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Catat/salin sekarang. Password tidak bisa dilihat lagi setelah jendela ini ditutup demi keamanan sistem.
                </p>
              </div>

              {/* Credential Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Pengguna</p>
                    <p className="text-xs font-bold text-slate-800 font-mono truncate mt-0.5">{resetModalData.userEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(resetModalData.userEmail, 'reset-email')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedField === 'reset-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedField === 'reset-email' ? 'Disalin!' : 'Salin'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password Baru</p>
                    <p className="text-xs font-bold text-slate-800 font-mono truncate mt-0.5 tracking-wider">{resetModalData.newPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(resetModalData.newPassword, 'reset-password')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedField === 'reset-password' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'reset-password' ? 'Disalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Close Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalData(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Tutup & Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Detail;
