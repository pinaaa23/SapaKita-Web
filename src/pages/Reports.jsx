import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Calendar, 
  Activity, 
  Phone, 
  Clock, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getSummaryReport } from '../services/reportService';
import { logout } from '../services/api';

const Reports = () => {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState('30days');
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalCalls: 0,
    avgCallDurationSeconds: 0,
    successRate: 0,
    revenueTrend: [],
    callVolumeTrend: [],
    revenueGrowth: null,
    callsGrowth: null,
    successRateGrowth: null,
    compliance: {
      recordedRate: null,
      avgSearchTime: null,
    }
  });

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSummaryReport({ period: periodFilter });
      setReportData(data);
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        showToast('Anda tidak memiliki akses.', 'error');
      }
      setReportData({
        totalRevenue: 0,
        totalCalls: 0,
        avgCallDurationSeconds: 0,
        successRate: 0,
        revenueTrend: [],
        callVolumeTrend: [],
        revenueGrowth: null,
        callsGrowth: null,
        successRateGrowth: null,
        compliance: {
          recordedRate: null,
          avgSearchTime: null,
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [periodFilter, navigate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = () => {
    showToast('Fitur ini belum tersedia di sistem backend', 'error');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value || 0);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          toastMessage.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs w-full sm:w-auto">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <select 
            value={periodFilter} 
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="90days">90 Hari Terakhir</option>
          </select>
        </div>
        
        <button 
          type="button"
          onClick={handleExport}
          className="w-full sm:w-auto px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Data
        </button>
      </div>

      {/* Section 1: Ringkasan Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue Nasional */}
        <div className="bg-gradient-to-br from-[#0B3D91] to-[#1E5FCC] text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20 border border-blue-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            {typeof reportData.revenueGrowth === 'number' && (
              <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
                {reportData.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {reportData.revenueGrowth >= 0 ? `+${reportData.revenueGrowth}%` : `${reportData.revenueGrowth}%`}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</h3>
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : formatCurrency(reportData.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Card 2: Total Panggilan */}
        <div className="bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706] text-[#0B3D91] rounded-2xl p-5 shadow-lg shadow-amber-500/20 border border-amber-300/40 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-[#0B3D91]/15 backdrop-blur-md rounded-xl flex items-center justify-center text-[#0B3D91] shrink-0 border border-[#0B3D91]/20">
              <Phone className="w-5 h-5 text-[#0B3D91]" />
            </div>
            {typeof reportData.callsGrowth === 'number' ? (
              <span className="text-[10px] font-extrabold bg-[#0B3D91]/15 text-[#0B3D91] px-2.5 py-0.5 rounded-full border border-[#0B3D91]/20">
                {reportData.callsGrowth >= 0 ? `+${reportData.callsGrowth}%` : `${reportData.callsGrowth}%`}
              </span>
            ) : (
              <span className="text-[10px] font-extrabold bg-[#0B3D91]/15 text-[#0B3D91] px-2.5 py-0.5 rounded-full border border-[#0B3D91]/20">
                Nasional
              </span>
            )}
          </div>
          <div>
            <h3 className="text-[#0B3D91]/80 text-xs font-bold uppercase tracking-wider mb-1">Total Panggilan</h3>
            <p className="text-2xl font-extrabold text-[#0B3D91]">
              {isLoading ? '...' : formatNumber(reportData.totalCalls)}
            </p>
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
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : formatDuration(reportData.avgCallDurationSeconds)}
            </p>
          </div>
        </div>

        {/* Card 4: Call Success Rate */}
        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white rounded-2xl p-5 shadow-lg shadow-emerald-900/20 border border-emerald-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {typeof reportData.successRateGrowth === 'number' && (
              <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
                {reportData.successRateGrowth >= 0 ? `+${reportData.successRateGrowth}%` : `${reportData.successRateGrowth}%`}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Call Success Rate</h3>
            <p className="text-2xl font-extrabold text-white">
              {isLoading ? '...' : `${reportData.successRate}%`}
            </p>
          </div>
        </div>

      </div>

      {/* Section 2: Grafik Tren */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-6">Tren Revenue Harian (Nasional)</h3>
          <div className="h-[300px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-300 animate-pulse">
                Memuat data grafik...
              </div>
            ) : reportData.revenueTrend && reportData.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.revenueTrend}>
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
                    tickFormatter={(val) => `Rp${formatNumber(val)}`}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={3} dot={{r: 4, fill: '#0D9488', strokeWidth: 0}} activeDot={{r: 6, fill: '#1E293B', stroke: '#0D9488', strokeWidth: 2}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart2 className="w-10 h-10 mb-2 text-slate-300" />
                <p className="font-semibold text-xs text-slate-600">Belum ada data</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Belum ada data tren revenue untuk periode yang dipilih.</p>
              </div>
            )}
          </div>
        </div>

        {/* Calls Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-6">Tren Volume Panggilan (Nasional)</h3>
          <div className="h-[300px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-300 animate-pulse">
                Memuat data grafik...
              </div>
            ) : reportData.callVolumeTrend && reportData.callVolumeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.callVolumeTrend}>
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
                    tickFormatter={(val) => formatNumber(val)}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [formatNumber(value), 'Panggilan']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="count" fill="#0B3D91" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart2 className="w-10 h-10 mb-2 text-slate-300" />
                <p className="font-semibold text-xs text-slate-600">Belum ada data</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Belum ada data volume panggilan untuk periode yang dipilih.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Compliance / Audit */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Kepatuhan Operasional & Audit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Keberhasilan Perekaman Suara</p>
                  <p className="text-xs text-slate-500 mt-0.5">Target: 100%</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {reportData.compliance.recordedRate !== null ? `${reportData.compliance.recordedRate}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden flex">
                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${reportData.compliance.recordedRate || 0}%` }}></div>
                <div className="bg-slate-200 h-2.5 rounded-r-full flex-1"></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 
                {reportData.compliance.recordedRate !== null ? 'Memenuhi standar kepatuhan minimum.' : 'Data kepatuhan belum tercatat.'}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Rata-rata Waktu Pencarian Arsip</p>
                  <p className="text-xs text-slate-500 mt-0.5">Target SLA: {'< 10 detik'}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {reportData.compliance.avgSearchTime !== null ? `${reportData.compliance.avgSearchTime}s` : '0s'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {reportData.compliance.avgSearchTime !== null 
                    ? 'Performa pencarian arsip sangat baik dan memenuhi SLA yang ditentukan.' 
                    : 'Performa pencarian arsip akan ditampilkan saat data tersedia.'}
                </p>
              </div>
            </div>
        </div>
      </div>
      
    </div>
  );
};

export default Reports;
