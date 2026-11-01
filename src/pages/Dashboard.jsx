import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneCall, 
  Wallet, 
  Building2, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import StatCard from '../components/StatCard';
import CallPerformanceComparisonChart from '../components/CallPerformanceComparisonChart';
import { getDashboardSummary } from '../services/dashboardService';
import { logout } from '../services/api';
import { USE_MOCK_SUPERADMIN } from '../services/mockStorage';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalCalls: 0,
    totalRevenue: 0,
    activeBranches: 0,
    successRate: 0,
    revenueTrend: [],
    callVolume: [],
    callsGrowth: null,
    revenueGrowth: null,
    branchesGrowth: null,
    successRateGrowth: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardSummary();
        if (isMounted) {
          setSummaryData(data);
        }
      } catch (err) {
        if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        console.log('[Dashboard] Gagal memuat data ringkasan:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value || 0);
  };

  const getTrendProps = (growth) => {
    if (typeof growth !== 'number' || isNaN(growth)) {
      return { trend: null, trendValue: null };
    }
    return {
      trend: growth >= 0 ? 'up' : 'down',
      trendValue: Math.abs(growth).toString(),
    };
  };

  return (
    <div className="space-y-5 relative">
      {/* Stats Grid - 4 Cards Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/80 animate-pulse h-32 flex flex-col justify-between"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-6 w-32 bg-slate-200 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard 
              title="Total Panggilan" 
              value={formatNumber(summaryData.totalCalls)} 
              icon={PhoneCall} 
              color="blue"
              {...getTrendProps(summaryData.callsGrowth)}
            />
            <StatCard 
              title="Total Revenue" 
              value={summaryData.totalRevenue !== null ? formatCurrency(summaryData.totalRevenue) : '-'} 
              icon={Wallet} 
              color="green"
              {...getTrendProps(summaryData.revenueGrowth)}
            />
            <StatCard 
              title="Cabang Aktif" 
              value={formatNumber(summaryData.activeBranches)} 
              icon={Building2} 
              color="primary"
              {...getTrendProps(summaryData.branchesGrowth)}
            />
            <StatCard 
              title="Success Rate" 
              value={summaryData.successRate !== null ? `${summaryData.successRate}%` : '-'} 
              icon={Activity} 
              color="accent"
              {...getTrendProps(summaryData.successRateGrowth)}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart: Tren Pendapatan */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Tren Pendapatan (Revenue)</h2>
              <p className="text-[11px] text-slate-500">Akumulasi pendapatan transaksi seluruh cabang</p>
            </div>
            <button 
              onClick={() => navigate('/reports')}
              className="text-primary hover:text-primary-dark text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Lihat Laporan <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full w-full bg-slate-50/70 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs" />
            ) : summaryData.revenueTrend && summaryData.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryData.revenueTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      try {
                        const parsed = new Date(val);
                        return isNaN(parsed.getTime()) ? val : parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                      } catch {
                        return val;
                      }
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => `Rp ${val >= 1000 ? (val / 1000) + 'k' : val}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                    labelFormatter={(label) => {
                      try {
                        const parsed = new Date(label);
                        return isNaN(parsed.getTime()) ? label : parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                      } catch {
                        return label;
                      }
                    }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0B3D91" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span>Belum ada data</span>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Chart: Volume Panggilan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800">Volume Panggilan</h2>
            <p className="text-slate-500 text-[11px]">Distribusi panggilan per hari</p>
          </div>
          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full w-full bg-slate-50/70 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs" />
            ) : summaryData.callVolume && summaryData.callVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData.callVolume} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      try {
                        const parsed = new Date(val);
                        return isNaN(parsed.getTime()) ? val : parsed.toLocaleDateString('id-ID', { day: 'numeric' });
                      } catch {
                        return val;
                      }
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${formatNumber(value)} Panggilan`, 'Volume']}
                    labelFormatter={(label) => {
                      try {
                        const parsed = new Date(label);
                        return isNaN(parsed.getTime()) ? label : parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                      } catch {
                        return label;
                      }
                    }}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#1E5FCC" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span>Belum ada data</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagram Batang Performa Panggilan Antar-Lapas & Bulanan */}
      <CallPerformanceComparisonChart role="superadmin" />
    </div>
  );
};

export default Dashboard;
