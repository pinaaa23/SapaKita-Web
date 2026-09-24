import React from 'react';
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
import { mockDashboardStats, mockBranches, mockCalls, mockTransactions } from '../services/mockData';

const Dashboard = () => {
  const navigate = useNavigate();

  // Synchronize stats dynamically with active datasets
  const activeBranchesCount = mockBranches.filter(b => b.status === 'Active').length;
  const totalCallsCount = mockCalls.length;
  const answeredCallsCount = mockCalls.filter(c => c.status === 'Answered').length;
  const dynamicSuccessRate = totalCallsCount > 0 
    ? ((answeredCallsCount / totalCallsCount) * 100).toFixed(1) 
    : mockDashboardStats.successRate;
  
  const totalRevenueAmount = mockTransactions
    .filter(t => t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  return (
    <div className="space-y-5 relative">
      {/* Stats Grid - 4 Cards Layout matching branch dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Panggilan" 
          value={formatNumber(totalCallsCount)} 
          icon={PhoneCall} 
          color="blue"
          trend="up"
          trendValue="12.5"
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenueAmount)} 
          icon={Wallet} 
          color="green"
          trend="up"
          trendValue="8.2"
        />
        <StatCard 
          title="Cabang Aktif" 
          value={activeBranchesCount} 
          icon={Building2} 
          color="primary"
        />
        <StatCard 
          title="Success Rate" 
          value={`${dynamicSuccessRate}%`} 
          icon={Activity} 
          color="accent"
          trend="up"
          trendValue="1.1"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart */}
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDashboardStats.revenueTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => `Rp ${val / 1000}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0B3D91" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                  activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart / Calls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800">Volume Panggilan</h2>
            <p className="text-slate-500 text-[11px]">Distribusi panggilan per hari</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDashboardStats.callTrend} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: 'numeric' })}
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
                  labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="calls" 
                  fill="#1E5FCC" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

