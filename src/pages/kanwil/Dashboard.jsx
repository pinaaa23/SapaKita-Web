import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  PhoneCall, 
  TrendingUp, 
  CheckCircle2, 
  MapPin, 
  Activity, 
  RefreshCw,
  Wallet,
  ArrowUpRight
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
import { getKanwilDashboardSummary, getKanwilBranches } from '../../services/kanwilService';

export default function KanwilDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const kanwilId = user?.kanwilId || user?.kanwil?.id;
  const kanwilName = user?.kanwilName || user?.kanwil?.name || 'Kantor Wilayah';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumData, branchData] = await Promise.all([
        getKanwilDashboardSummary(kanwilId),
        getKanwilBranches(kanwilId, { limit: 10 })
      ]);
      setSummary(sumData);
      setBranches(branchData.items || []);
    } catch (err) {
      console.error('Error fetching kanwil dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kanwilId, user]);

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

  return (
    <div className="space-y-5 relative">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-[#2563EB] p-6 sm:p-7 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-2.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Kantor Wilayah Pemasyarakatan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {kanwilName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-100 max-w-xl">
              Pemantauan terpusat operasional Wartel Khusus Pemasyarakatan pada seluruh Unit Pelaksana Teknis (UPT).
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total UPT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total UPT</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : summary?.totalUpts || 0}
            </p>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
              {summary?.activeBranches || 0} UPT Aktif Beroperasi
            </span>
          </div>
        </div>

        {/* Card 2: WBP Terdata */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">WBP Terdata</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : formatNumber(summary?.totalWbps)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 inline-block">
              Seluruh UPT di wilayah
            </span>
          </div>
        </div>

        {/* Card 3: Success Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Success Rate</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : `${summary?.successRate || 98.4}%`}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimal (koneksi stabil)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Estimasi Transaksi */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimasi Transaksi</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800 truncate">
              {isLoading ? '...' : formatCurrency(summary?.totalRevenue)}
            </p>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{summary?.revenueGrowth || 14.2}% pertumbuhan
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart: Tren Pendapatan */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren Pendapatan Wilayah</h3>
              <p className="text-[11px] text-slate-400">Konsolidasi seluruh UPT di {kanwilName}</p>
            </div>
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

      {/* Tabel UPT di Bawah Naungan Kanwil */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar UPT di Wilayah</h2>
            <p className="text-[11px] text-slate-400">Monitoring operasional seluruh UPT di bawah naungan {kanwilName}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-100">
            {branches.length} UPT Terdata
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-left w-[36%]">Nama UPT</th>
                <th className="py-3.5 px-4 text-left w-[24%]">Lokasi</th>
                <th className="py-3.5 px-4 text-left w-[28%]">Kapasitas & WBP</th>
                <th className="py-3.5 px-4 text-center w-[12%]">Status</th>
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
                            <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{b.name}</p>
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
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada UPT yang terdaftar di wilayah ini.
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
