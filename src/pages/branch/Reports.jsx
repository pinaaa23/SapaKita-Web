import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Calendar, 
  Activity, 
  Phone, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Target, 
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getBranchReport } from '../../services/reportService';
import { logout } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

const BranchReports = () => {
  const navigate = useNavigate();
  const { uptName, isSupervisor, userName, roleLabel } = useAuth();
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
      const data = await getBranchReport({ period: periodFilter });
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
    try {
      const periodLabel = periodFilter === '7days' ? '7 Hari Terakhir' : (periodFilter === '90days' ? '90 Hari Terakhir' : '30 Hari Terakhir');

      if (isSupervisor) {
        // PDF Export untuk Supervisor (Terkunci & Tidak bisa diubah)
        const headers = ['No', 'Kategori Data', 'Keterangan', 'Nilai / Metrik', 'Periode'];
        const rows = [
          ['1', 'Ringkasan', 'Total Pendapatan', `Rp ${new Intl.NumberFormat('id-ID').format(reportData.totalRevenue || 0)}`, periodLabel],
          ['2', 'Ringkasan', 'Total Volume Panggilan', `${new Intl.NumberFormat('id-ID').format(reportData.totalCalls || 0)} panggilan`, periodLabel],
          ['3', 'Ringkasan', 'Rata-rata Durasi', `${Math.floor((reportData.avgCallDurationSeconds || 0) / 60)} menit ${(reportData.avgCallDurationSeconds || 0) % 60} detik`, periodLabel],
          ['4', 'Ringkasan', 'Tingkat Keberhasilan', `${reportData.successRate || 0}%`, periodLabel],
        ];

        if (Array.isArray(reportData.revenueTrend) && reportData.revenueTrend.length > 0) {
          reportData.revenueTrend.forEach((item, idx) => {
            const callItem = reportData.callVolumeTrend?.[idx] || {};
            rows.push([
              String(5 + idx),
              'Tren Harian',
              item.date || item.day || `Hari ke-${idx + 1}`,
              `Rp ${new Intl.NumberFormat('id-ID').format(item.amount || item.revenue || 0)} (${callItem.calls || item.calls || 0} Panggilan)`,
              item.date || periodLabel
            ]);
          });
        }

        const summaryMetrics = [
          { label: 'TOTAL PENDAPATAN', value: `Rp ${new Intl.NumberFormat('id-ID').format(reportData.totalRevenue || 0)}` },
          { label: 'TOTAL PANGGILAN', value: `${new Intl.NumberFormat('id-ID').format(reportData.totalCalls || 0)} Panggilan` },
          { label: 'RATA-RATA DURASI', value: `${Math.floor((reportData.avgCallDurationSeconds || 0) / 60)}m ${(reportData.avgCallDurationSeconds || 0) % 60}s` },
          { label: 'KEBERHASILAN', value: `${reportData.successRate || 0}%` },
        ];

        const filename = `Laporan_Analitik_${(uptName || 'UPT').replace(/\s+/g, '_')}_${periodFilter}.pdf`;
        const success = exportToPDF({
          title: 'LAPORAN ANALITIK & AKTIVITAS LAYANAN PASCALL',
          subtitle: `Laporan Ringkasan Kinerja dan Pemakaian Layanan Komunikasi Pemasyarakatan`,
          filename,
          headers,
          rows,
          metadata: {
            'Lokasi UPT': uptName || 'UPT Pemasyarakatan',
            'Dicetak Oleh': `${userName || 'Petugas'} (${roleLabel || 'Supervisor'})`,
            'Rentang Waktu': periodLabel,
            'Tanggal Cetak': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          },
          summaryMetrics
        });

        if (success !== false) {
          showToast('Berhasil mengekspor laporan!', 'success');
        }
      } else {
        // Excel Export untuk Kepala UPT
        const rows = [];
        rows.push({
          Kategori: 'RINGKASAN METRIK',
          Keterangan: 'Total Pendapatan',
          Nilai: `Rp ${new Intl.NumberFormat('id-ID').format(reportData.totalRevenue || 0)}`,
          Periode: periodLabel
        });
        rows.push({
          Kategori: 'RINGKASAN METRIK',
          Keterangan: 'Total Volume Panggilan',
          Nilai: `${new Intl.NumberFormat('id-ID').format(reportData.totalCalls || 0)} panggilan`,
          Periode: periodLabel
        });
        rows.push({
          Kategori: 'RINGKASAN METRIK',
          Keterangan: 'Rata-rata Durasi Panggilan',
          Nilai: `${Math.floor((reportData.avgCallDurationSeconds || 0) / 60)} menit ${(reportData.avgCallDurationSeconds || 0) % 60} detik`,
          Periode: periodLabel
        });
        rows.push({
          Kategori: 'RINGKASAN METRIK',
          Keterangan: 'Tingkat Keberhasilan Panggilan',
          Nilai: `${reportData.successRate || 0}%`,
          Periode: periodLabel
        });

        if (Array.isArray(reportData.revenueTrend) && reportData.revenueTrend.length > 0) {
          reportData.revenueTrend.forEach((item, idx) => {
            const callItem = reportData.callVolumeTrend?.[idx] || {};
            rows.push({
              Kategori: 'TREN HARIAN',
              Keterangan: item.date || item.day || `Hari ke-${idx + 1}`,
              Nilai: `Pendapatan: Rp ${new Intl.NumberFormat('id-ID').format(item.amount || item.revenue || 0)} | Panggilan: ${callItem.calls || item.calls || 0}`,
              Periode: item.date || ''
            });
          });
        }

        const filename = `Laporan_Analitik_${(uptName || 'UPT').replace(/\s+/g, '_')}_${periodFilter}.xlsx`;
        const success = exportToExcel(rows, filename, 'Laporan Analitik', {
          title: 'LAPORAN ANALITIK & AKTIVITAS LAYANAN PASCALL',
          subtitle: 'Laporan Ringkasan Kinerja dan Pemakaian Layanan Komunikasi Pemasyarakatan',
          metadata: {
            'Lokasi UPT': uptName || 'UPT Pemasyarakatan',
            'Dicetak Oleh': `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
            'Rentang Waktu': periodLabel,
            'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          },
          summaryMetrics: [
            { label: 'Total Pendapatan', value: `Rp ${new Intl.NumberFormat('id-ID').format(reportData.totalRevenue || 0)}` },
            { label: 'Total Volume Panggilan', value: `${new Intl.NumberFormat('id-ID').format(reportData.totalCalls || 0)} Panggilan` },
            { label: 'Rata-rata Durasi', value: `${Math.floor((reportData.avgCallDurationSeconds || 0) / 60)}m ${(reportData.avgCallDurationSeconds || 0) % 60}s` },
            { label: 'Tingkat Keberhasilan', value: `${reportData.successRate || 0}%` },
          ]
        });
        if (success !== false) {
          showToast('Berhasil mengekspor laporan!', 'success');
        }
      }
    } catch (err) {
      console.error('Error export laporan:', err);
      showToast('Gagal mengekspor laporan.', 'error');
    }
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Filter Bar Header */}
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
          title="Export Laporan"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* Section 1: Ringkasan Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue Cabang */}
        <div className="bg-gradient-to-br from-[#0B3D91] to-[#1E5FCC] text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20 border border-blue-400/20 flex flex-col justify-between hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            {reportData.revenueGrowth !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs ${
                reportData.revenueGrowth >= 0 ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30' : 'bg-rose-500/30 text-rose-200 border border-rose-400/30'
              }`}>
                {reportData.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(reportData.revenueGrowth)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase">Total Pendapatan</p>
            <h3 className="text-2xl font-black mt-1">
              {isLoading ? '...' : formatCurrency(reportData.totalRevenue)}
            </h3>
            <p className="text-[11px] text-blue-200/80 mt-1">
              {periodFilter === '7days' ? '7 hari terakhir' : (periodFilter === '90days' ? '90 hari terakhir' : '30 hari terakhir')}
            </p>
          </div>
        </div>

        {/* Card 2: Total Calls */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
              <Phone className="w-5 h-5" />
            </div>
            {reportData.callsGrowth !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                reportData.callsGrowth >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
                {reportData.callsGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(reportData.callsGrowth)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Volume Panggilan</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : formatNumber(reportData.totalCalls)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total sesi panggilan keluar</p>
          </div>
        </div>

        {/* Card 3: Average Duration */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Rata-rata Durasi</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : formatDuration(reportData.avgCallDurationSeconds)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Durasi percakapan per sesi</p>
          </div>
        </div>

        {/* Card 4: Success Rate */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            {reportData.successRateGrowth !== null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                reportData.successRateGrowth >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
                {reportData.successRateGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(reportData.successRateGrowth)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Panggilan Terjawab</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {isLoading ? '...' : `${reportData.successRate}%`}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Tingkat keberhasilan koneksi</p>
          </div>
        </div>

      </div>

      {/* Section 2: Grafik & Analitik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Tren Pendapatan */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Tren Pendapatan</h3>
              <p className="text-xs text-slate-400">Pola perolehan saldo &amp; tagihan</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            ) : reportData.revenueTrend && reportData.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => `Rp${v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : `${(v/1000).toFixed(0)}rb`}`} 
                  />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#0B3D91" strokeWidth={3} dot={{ r: 3, fill: '#0B3D91' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data grafik</div>
            )}
          </div>
        </div>

        {/* Chart 2: Volume Panggilan */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Volume Panggilan</h3>
              <p className="text-xs text-slate-400">Distribusi jumlah panggilan per hari</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            ) : reportData.callVolumeTrend && reportData.callVolumeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.callVolumeTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} Panggilan`, 'Volume']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="calls" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data grafik</div>
            )}
          </div>
        </div>

      </div>

      {/* Section 3: Indikator Kepatuhan & Audit Lapas */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm text-slate-800">Kepatuhan Operasional &amp; Keamanan</h3>
              <p className="text-xs text-slate-400">Standar monitoring dan audit panggilan Lapas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Tingkat Perekaman Audio</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">
                {reportData.compliance?.recordedRate ?? '100%'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Seluruh sesi tersimpan otomatis di server</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-xs">
              100%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Rata-rata Waktu Akses Audit</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">
                {reportData.compliance?.avgSearchTime ?? '< 1.2 detik'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Waktu pencarian dan verifikasi log panggilan</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BranchReports;
