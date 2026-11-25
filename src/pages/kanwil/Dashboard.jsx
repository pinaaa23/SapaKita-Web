import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  MapPin, 
  Activity, 
  RefreshCw,
  Wallet,
  ArrowUpRight,
  Plus,
  ExternalLink
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getYayasanDashboardSummary, getYayasanBranches } from '../../services/YayasanService';
import CallPerformanceComparisonChart from '../../components/CallPerformanceComparisonChart';

export default function YayasanDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const YayasanId = user?.YayasanId || user?.Yayasan?.id;
  const YayasanName = user?.YayasanName || user?.Yayasan?.name || 'Yayasan Pesantren';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumData, branchData] = await Promise.all([
        getYayasanDashboardSummary(YayasanId),
        getYayasanBranches(YayasanId, { limit: 10 })
      ]);
      setSummary(sumData);
      setBranches(branchData.items || []);
    } catch (err) {
      console.error('Error fetching Yayasan dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [YayasanId, user]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  // Compute aggregated stats
  const totalKampussCount = summary?.totalKampuss || branches.length || 0;
  const activeKampussCount = summary?.activeBranches || branches.filter(b => b.status === 'Active' || b.status === 'Aktif').length || 0;
  const totalSantrisCount = summary?.totalSantris || summary?.totalInmates || branches.reduce((sum, b) => sum + (b.inmateCount || 0), 0);

  return (
    <div className="space-y-5 relative">
      {/* 4 Clickable KPI Cards Grid - Seamless Integration with Pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Kampus -> Links to /Yayasan/branches */}
        <Link 
          to="/Yayasan/branches"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-primary/50 flex flex-col justify-between transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-primary transition-colors">
              Total Kampus
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-white transition-all">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? '...' : totalKampussCount}
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
              {activeKampussCount} Kampus Aktif Beroperasi
            </span>
          </div>
        </Link>

        {/* Card 2: Santri Terdata -> Links to /Yayasan/inmates */}
        <Link 
          to="/Yayasan/inmates"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-400 flex flex-col justify-between transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors">
              Santri Terdata
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? '...' : formatNumber(totalSantrisCount)}
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 inline-block">
              Seluruh Kampus di wilayah {YayasanName}
            </span>
          </div>
        </Link>

        {/* Card 3: Success Rate -> Links to /Yayasan/reports */}
        <Link 
          to="/Yayasan/reports"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-400 flex flex-col justify-between transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition-colors">
              Success Rate
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? '...' : `${summary?.successRate || 98.4}%`}
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimal (koneksi stabil)</span>
            </div>
          </div>
        </Link>

        {/* Card 4: Estimasi Transaksi -> Links to /Yayasan/reports */}
        <Link 
          to="/Yayasan/reports"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 flex flex-col justify-between transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition-colors">
              Estimasi Transaksi
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-800 truncate tracking-tight">
                {isLoading ? '...' : formatCurrency(summary?.totalRevenue || 0)}
              </p>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{summary?.revenueGrowth || 14.2}% pertumbuhan
            </span>
          </div>
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart: Tren Pendapatan */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren Pendapatan Wilayah</h3>
              <p className="text-[11px] text-slate-400">Konsolidasi seluruh Kampus di bawah {YayasanName}</p>
            </div>
            <Link 
              to="/Yayasan/reports"
              className="text-primary hover:text-primary-dark text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Lihat Laporan <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}jt`} 
                />
                <RechartsTooltip 
                  formatter={(val) => [formatCurrency(val), 'Pendapatan']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0B3D91" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#0B3D91' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Chart: Volume Panggilan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Volume Panggilan</h3>
              <p className="text-[11px] text-slate-400">Aktivitas 7 hari terakhir</p>
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              title="Segarkan data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.callVolume || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip 
                  formatter={(val) => [`${val} Panggilan`, 'Volume']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Diagram Batang Performa Panggilan Antar-Pesantren & Bulanan */}
      <CallPerformanceComparisonChart 
        role="Yayasan" 
        YayasanId={YayasanId} 
        YayasanName={YayasanName} 
        initialBranches={branches}
      />

      {/* Tabel Kampus di Bawah Naungan Yayasan */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar Kampus di Wilayah</h2>
            <p className="text-[11px] text-slate-400">Monitoring operasional seluruh Kampus di bawah naungan {YayasanName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-100">
              {branches.length} Kampus Terdata
            </span>
            <Link 
              to="/Yayasan/branches"
              className="text-primary hover:text-primary-dark text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Kelola Kampus <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-left w-[34%]">Nama Kampus</th>
                <th className="py-3.5 px-4 text-left w-[22%]">Lokasi</th>
                <th className="py-3.5 px-4 text-left w-[24%]">Kapasitas & Santri</th>
                <th className="py-3.5 px-4 text-center w-[10%]">Status</th>
                <th className="py-3.5 px-4 text-center w-[10%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-44 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1.5" /><div className="h-1.5 bg-slate-100 rounded w-36" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-14 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-200 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : branches.length > 0 ? (
                branches.map((b) => {
                  const isAktif = b.status === 'Active' || b.status === 'Aktif';
                  const occupancyPct = b.capacity ? (b.inmateCount / b.capacity) * 100 : 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold shrink-0 border border-blue-100/80">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <Link 
                              to={`/Yayasan/inmates?branchId=${b.id}`}
                              className="font-bold text-slate-800 text-sm whitespace-nowrap hover:text-primary transition-colors inline-block"
                            >
                              {b.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-medium">{b.phone || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.city || b.location || 'Indonesia'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <Link 
                          to={`/Yayasan/inmates?branchId=${b.id}`}
                          title="Klik untuk melihat data Santri cabang ini"
                          className="group inline-block"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-sm group-hover:text-primary transition-colors">
                              {formatNumber(b.inmateCount)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">/ {b.capacity} Kapasitas</span>
                          </div>
                          <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className={`h-full rounded-full ${
                                occupancyPct > 100 
                                  ? 'bg-rose-500' 
                                  : occupancyPct > 80 
                                    ? 'bg-amber-500' 
                                    : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(100, occupancyPct)}%` }}
                            ></div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isAktif 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link 
                          to={`/Yayasan/inmates?branchId=${b.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Data Santri</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Belum ada Kampus di wilayah ini</p>
                      <p className="text-slate-400 max-w-sm">
                        Yayasan Pesantren {YayasanName} belum memiliki Unit Pelaksana Teknis yang terdaftar.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

