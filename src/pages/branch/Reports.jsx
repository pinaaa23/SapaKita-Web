import React, { useState } from 'react';
import { Download, Calendar, Activity, Phone, Clock, DollarSign, CheckCircle2, Target, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { mockReportData } from '../../services/mockData';
import { exportToCSV } from '../../utils/exportUtils';

const BranchReports = () => {
  const [periodFilter, setPeriodFilter] = useState('30days');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [exportToast, setExportToast] = useState('');

  const handleFilterChange = (e) => {
    setPeriodFilter(e.target.value);
    setShowCustomDate(e.target.value === 'custom');
  };

  const handleExport = () => {
    const dataToExport = mockReportData.trendData.map(d => ({
      Tanggal: d.date,
      Revenue_IDR: d.revenue * 0.15,
      Jumlah_Panggilan: Math.floor(d.calls * 0.15),
      Kategori: 'Cabang Lapas Cipinang'
    }));
    
    const success = exportToCSV(dataToExport, `Laporan_Analistik_Cabang_${periodFilter}.csv`);
    if (success !== false) {
      setExportToast('Laporan analistik cabang berhasil diexport (.csv)!');
      setTimeout(() => setExportToast(''), 4000);
    }
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
    <div className="space-y-5">
      {/* Filter Bar Header */}
      <div className="flex justify-between items-center">
        {exportToast ? (
          <div className="p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            {exportToast}
          </div>
        ) : <div></div>}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {showCustomDate ? (
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-2 py-1 shadow-sm w-full sm:w-auto">
              <input type="date" className="text-xs border-none focus:ring-0 text-slate-600 px-1 py-1 bg-transparent" />
              <span className="text-slate-400 text-xs">-</span>
              <input type="date" className="text-xs border-none focus:ring-0 text-slate-600 px-1 py-1 bg-transparent" />
              <button onClick={() => {setPeriodFilter('30days'); setShowCustomDate(false)}} className="text-slate-400 hover:text-rose-500 ml-1 text-xs cursor-pointer">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={periodFilter} 
                onChange={handleFilterChange}
                className="bg-transparent focus:outline-none text-xs font-bold text-slate-700 flex-1 cursor-pointer"
              >
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="thisMonth">Bulan Ini</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>
          )}
          
          <button 
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Laporan
          </button>
        </div>
      </div>

      {/* Section 1: Ringkasan Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue Cabang */}
        <div className="bg-gradient-to-br from-[#0B3D91] to-[#1E5FCC] text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20 border border-blue-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
              +12.4%
            </span>
          </div>
          <div>
            <h3 className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue Cabang</h3>
            <p className="text-2xl font-extrabold text-white">Rp {formatCompactNumber(mockReportData.summary.totalRevenue * 0.15)}</p>
          </div>
        </div>

        {/* Card 2: Total Panggilan Lokal */}
        <div className="bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-[#0B3D91] rounded-2xl p-5 shadow-lg shadow-amber-500/20 border border-amber-300/40 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-[#0B3D91]/15 backdrop-blur-md rounded-xl flex items-center justify-center text-[#0B3D91] shrink-0 border border-[#0B3D91]/20">
              <Phone className="w-5 h-5 text-[#0B3D91]" />
            </div>
            <span className="text-[10px] font-extrabold bg-[#0B3D91]/15 text-[#0B3D91] px-2.5 py-0.5 rounded-full border border-[#0B3D91]/20">
              Lokal
            </span>
          </div>
          <div>
            <h3 className="text-[#0B3D91]/80 text-xs font-bold uppercase tracking-wider mb-1">Total Panggilan Lokal</h3>
            <p className="text-2xl font-extrabold text-[#0B3D91]">{new Intl.NumberFormat('id-ID').format(mockReportData.summary.totalCalls * 0.15)}</p>
          </div>
        </div>

        {/* Card 3: Rata-rata Durasi */}
        <div className="bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white rounded-2xl p-5 shadow-lg shadow-purple-900/20 border border-purple-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
              Rata-rata
            </span>
          </div>
          <div>
            <h3 className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-1">Rata-rata Durasi</h3>
            <p className="text-2xl font-extrabold text-white">{mockReportData.summary.avgDuration}</p>
          </div>
        </div>

        {/* Card 4: Call Success Rate */}
        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/20 border border-emerald-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
              +0.5%
            </span>
          </div>
          <div>
            <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Call Success Rate</h3>
            <p className="text-2xl font-extrabold text-white">{mockReportData.summary.successRate}%</p>
          </div>
        </div>

      </div>

      {/* Section 2: Grafik Tren */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Revenue Harian (Cabang)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockReportData.trendData.map(d => ({ ...d, revenue: d.revenue * 0.15 }))}>
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
                  contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={3} dot={{r: 4, fill: '#0D9488', strokeWidth: 0}} activeDot={{r: 6, fill: '#1E293B', stroke: '#0D9488', strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calls Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Volume Panggilan (Cabang)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockReportData.trendData.map(d => ({ ...d, calls: Math.floor(d.calls * 0.15) }))}>
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
                  contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="calls" fill="#0B3D91" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Compliance / Audit */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 flex flex-col p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Kepatuhan Operasional Cabang</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Keberhasilan Perekaman */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Keberhasilan Perekaman Suara</p>
                  <p className="text-xs text-slate-500 mt-0.5">Target: 100%</p>
                </div>
                <span className="text-lg font-bold text-green-600">{mockReportData.compliance.recordedRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden flex">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${mockReportData.compliance.recordedRate}%` }}></div>
                <div className="bg-red-400 h-2.5 rounded-r-full" style={{ width: `${100 - mockReportData.compliance.recordedRate}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Memenuhi standar kepatuhan minimum cabang.
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
                  Performa pencarian arsip lokal sangat baik dan sesuai SOP PasCall.
                </p>
              </div>
            </div>
        </div>
      </div>
      
    </div>
  );
};

export default BranchReports;
