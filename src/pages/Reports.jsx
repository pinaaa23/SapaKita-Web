import React, { useState } from 'react';
import { Download, Calendar, Activity, Phone, Clock, DollarSign, Target, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockReportData } from '../services/mockData';
import StatCard from '../components/StatCard';

const Reports = () => {
  const [periodFilter, setPeriodFilter] = useState('30days');
  const [showCustomDate, setShowCustomDate] = useState(false);

  const handleFilterChange = (e) => {
    setPeriodFilter(e.target.value);
    setShowCustomDate(e.target.value === 'custom');
  };

  const handleExport = () => {
    alert('Laporan sedang diexport ke format PDF/Excel. Fitur ini masih dalam tahap simulasi.');
  };

  const formatCurrency = (value) => {
    if (value === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCompactNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan & Analitik</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan performa dan kepatuhan dari seluruh cabang.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {showCustomDate ? (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm w-full sm:w-auto">
              <input type="date" className="text-sm border-none focus:ring-0 text-slate-600 px-1 py-1 bg-transparent" />
              <span className="text-slate-400">-</span>
              <input type="date" className="text-sm border-none focus:ring-0 text-slate-600 px-1 py-1 bg-transparent" />
              <button onClick={() => {setPeriodFilter('30days'); setShowCustomDate(false)}} className="text-slate-400 hover:text-red-500 ml-1">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select 
                value={periodFilter} 
                onChange={handleFilterChange}
                className="bg-transparent focus:outline-none text-sm font-medium text-slate-600 flex-1"
              >
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="thisMonth">Bulan Ini</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>
          )}
          
          <button 
            onClick={handleExport}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
          >
            <Download className="w-4 h-4" /> Export Laporan
          </button>
        </div>
      </div>

      {/* Section 1: Ringkasan Umum */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`Rp ${formatCompactNumber(mockReportData.summary.totalRevenue)}`} 
          icon={DollarSign} 
          trend={mockReportData.summary.revenueChange} 
          trendUp={true} 
        />
        <StatCard 
          title="Total Panggilan" 
          value={new Intl.NumberFormat('id-ID').format(mockReportData.summary.totalCalls)} 
          icon={Phone} 
        />
        <StatCard 
          title="Rata-rata Durasi" 
          value={mockReportData.summary.avgDuration} 
          icon={Clock} 
        />
        <StatCard 
          title="Call Success Rate" 
          value={`${mockReportData.summary.successRate}%`} 
          icon={Activity} 
          trend="+0.5%" 
          trendUp={true} 
        />
      </div>

      {/* Section 2: Grafik Tren */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Revenue Harian</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockReportData.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => `Rp${formatCompactNumber(val)}`}
                />
                <RechartsTooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                  contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={3} dot={{r: 4, fill: '#F5A623', strokeWidth: 0}} activeDot={{r: 6, fill: '#1E293B', stroke: '#F5A623', strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calls Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Volume Panggilan</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockReportData.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <RechartsTooltip 
                  formatter={(value) => [new Intl.NumberFormat('id-ID').format(value), 'Panggilan']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="calls" fill="#1E293B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 3: Perbandingan Antar Cabang */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">Peringkat Performa Cabang</h3>
            <span className="text-xs text-slate-500">Berdasarkan Total Revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Peringkat</th>
                  <th className="px-5 py-3 font-medium">Cabang</th>
                  <th className="px-5 py-3 font-medium text-right">Revenue</th>
                  <th className="px-5 py-3 font-medium text-right">Panggilan</th>
                  <th className="px-5 py-3 font-medium text-center">Sukses</th>
                  <th className="px-5 py-3 font-medium text-center">Rata-rata Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockReportData.branchRankings.map((branch, idx) => (
                  <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        idx === 1 ? 'bg-slate-200 text-slate-700' : 
                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{branch.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">{formatCurrency(branch.revenue)}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{new Intl.NumberFormat('id-ID').format(branch.calls)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        branch.successRate >= 95 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {branch.successRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-slate-600">{branch.avgDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Compliance & Audit Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-800">Kepatuhan & Audit</h3>
          </div>
          <div className="p-6 flex flex-col gap-8">
            
            {/* Keberhasilan Perekaman */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Keberhasilan Perekaman Video</p>
                  <p className="text-xs text-slate-500 mt-0.5">Target: 100%</p>
                </div>
                <span className="text-lg font-bold text-green-600">{mockReportData.compliance.recordedRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden flex">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${mockReportData.compliance.recordedRate}%` }}></div>
                <div className="bg-red-400 h-2.5 rounded-r-full" style={{ width: `${100 - mockReportData.compliance.recordedRate}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Memenuhi standar kepatuhan minimum.
              </p>
            </div>

            {/* SLA Pencarian */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Rata-rata Waktu Pencarian Arsip</p>
                  <p className="text-xs text-slate-500 mt-0.5">Target SLA: {'< 10 detik'}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{mockReportData.compliance.avgSearchTime}s</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Performa pencarian log dan transkrip sangat sehat, di bawah batas maksimal SLA 10 detik.
                </p>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{mockReportData.compliance.pendingApprovals}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Kontak Pending Approval</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
