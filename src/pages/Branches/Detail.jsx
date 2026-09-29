import React, { useState } from 'react';
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
  CheckCircle2, 
  Activity,
  UserCheck
} from 'lucide-react';
import { mockBranches, mockUsers, mockCalls, mockTransactions } from '../../services/mockData';
import StatCard from '../../components/StatCard';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(() => mockBranches.find(b => b.id === id));
  const branchUsers = mockUsers.filter(u => u.branchId === id);
  const branchCalls = mockCalls.filter(c => c.branchId === id);
  const branchTransactions = mockTransactions.filter(
    t => t.branchId === id && (t.status === 'Success' || t.status === 'Berhasil')
  );

  if (!branch) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center my-8">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-700">Cabang Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">Data cabang dengan ID "{id}" tidak tersedia dalam sistem.</p>
        <button 
          onClick={() => navigate('/branches')} 
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all cursor-pointer"
        >
          Kembali ke Daftar Cabang
        </button>
      </div>
    );
  }

  const totalCalls = branchCalls.length;
  const totalRevenue = branchTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const occupancyRate = branch.capacity > 0 ? Math.round((branch.inmateCount / branch.capacity) * 100) : 0;
  const isOvercapacity = branch.inmateCount > branch.capacity;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleToggleStatus = () => {
    const branchIndex = mockBranches.findIndex(b => b.id === id);
    if (branchIndex !== -1) {
      const nextStatus = mockBranches[branchIndex].status === 'Active' ? 'Inactive' : 'Active';
      mockBranches[branchIndex].status = nextStatus;
      setBranch({ ...mockBranches[branchIndex] });
    }
  };

  return (
    <div className="space-y-6 pb-8">
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
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{branch.location}</span>
              <span className="text-slate-300">•</span>
              <span>ID: {branch.id.toUpperCase()}</span>
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
        <StatCard 
          title="Total Panggilan (Cabang)" 
          value={`${totalCalls} Panggilan`}
          icon={PhoneCall} 
          color="blue"
        />
        <StatCard 
          title="Total Pendapatan (Cabang)" 
          value={formatCurrency(totalRevenue)} 
          icon={Wallet} 
          color="green"
        />
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

              <div className="space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Status Operasional PasCall
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
                <div key={user.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                      {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.role}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
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
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                Belum ada data petugas yang terhubung ke cabang ini.
              </div>
            )}
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
            <Link
              to="/users"
              className="w-full py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              Kelola Pengguna di Menu Pengguna
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
