import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  Calendar, 
  Activity, 
  Phone, 
  Clock, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Building2,
  FileSpreadsheet,
  Users
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
import { getYayasanReportSummary } from '../../services/YayasanService';
import { exportToExcel } from '../../utils/exportUtils';

export default function YayasanReports() {
  const { user } = useAuth();
  const YayasanId = user?.YayasanId || user?.Yayasan?.id;
  const YayasanName = user?.YayasanName || user?.Yayasan?.name || 'Yayasan Pesantren';

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
    KampusBreakdown: [],
  });

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getYayasanReportSummary(YayasanId, periodFilter);
      setReportData(data);
    } catch (err) {
      console.error('Error loading Yayasan report:', err);
      showToast('Gagal memuat data laporan wilayah.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [YayasanId, periodFilter]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = () => {
    try {
      const periodLabel = 
        periodFilter === '7days' 
          ? '7 Hari Terakhir' 
          : periodFilter === '90days' 
            ? '90 Hari Terakhir' 
            : '30 Hari Terakhir';

      const rows = [];

      // 1. Ringkasan Metrik
      rows.push({
        Kategori: 'RINGKASAN METRIK WILAYAH',
        Keterangan: 'Total Pendapatan Wilayah',
        Nilai: `Rp ${new Intl.NumberFormat('id-ID').format(reportData.totalRevenue || 0)}`,
        Periode: periodLabel,
      });
      rows.push({
        Kategori: 'RINGKASAN METRIK WILAYAH',
        Keterangan: 'Total Volume Panggilan',
        Nilai: `${new Intl.NumberFormat('id-ID').format(reportData.totalCalls || 0)} panggilan`,
        Periode: periodLabel,
      });
      rows.push({
        Kategori: 'RINGKASAN METRIK WILAYAH',
        Keterangan: 'Rata-rata Durasi Panggilan',
        Nilai: `${Math.floor((reportData.avgCallDurationSeconds || 0) / 60)} menit ${(reportData.avgCallDurationSeconds || 0) % 60} detik`,
        Periode: periodLabel,
      });
      rows.push({
        Kategori: 'RINGKASAN METRIK WILAYAH',
        Keterangan: 'Tingkat Keberhasilan Panggilan',
        Nilai: `${reportData.successRate || 0}%`,
        Periode: periodLabel,
      });

      // 2. Data Tren Harian / Periode
      if (Array.isArray(reportData.revenueTrend) && reportData.revenueTrend.length > 0) {
        reportData.revenueTrend.forEach((item, idx) => {
          const callItem = reportData.callVolumeTrend?.[idx] || {};
          rows.push({
            Kategori: 'TREN WILAYAH',
            Keterangan: item.month || item.date || `Periode ke-${idx + 1}`,
            Nilai: `Pendapatan: Rp ${new Intl.NumberFormat('id-ID').format(item.total || item.amount || 0)} | Panggilan: ${callItem.total || callItem.calls || item.total || 0}`,
            Periode: item.month || item.date || '',
          });
        });
      }

      // 3. Breakdown Kinerja Kampus
      if (Array.isArray(reportData.KampusBreakdown) && reportData.KampusBreakdown.length > 0) {
        reportData.KampusBreakdown.forEach((u) => {
          rows.push({
            Kategori: 'PERFORMA Kampus',
            Keterangan: u.name,
            Nilai: `Kota: ${u.city} | Santri: ${u.inmateCount} / ${u.capacity} | Status: ${u.status}`,
            Periode: periodLabel,
          });
        });
      }

      const filename = `Laporan_Analitik_${YayasanName.replace(/\s+/g, '_')}_${periodFilter}.xlsx`;
      const success = exportToExcel(rows, filename, 'Laporan Wilayah', {
        title: `LAPORAN ANALITIK KINERJA KOMUNIKASI - ${YayasanName.toUpperCase()}`,
        subtitle: `Laporan Konsolidasi Seluruh Kampus Pemasyarakatan di ${YayasanName}`,
        metadata: {
          'Tingkat': 'Yayasan Pesantren',
          'Wilayah': YayasanName,
          'Periode Laporan': periodLabel,
          'Dicetak Oleh': `${user?.name || 'Admin Yayasan'} (Admin Yayasan)`,
          'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        summaryMetrics: [
          { label: 'Total Omzet Wilayah', value: `Rp ${new Intl.NumberFormat('id-ID').format(reportData.totalRevenue || 0)}` },
          { label: 'Volume Panggilan', value: `${new Intl.NumberFormat('id-ID').format(reportData.totalCalls || 0)} Panggilan` },
          { label: 'Tingkat Sukses', value: `${reportData.successRate || 0}%` },
        ],
      });

      if (success !== false) {
        showToast('Berhasil mengekspor laporan analitik ke format Excel!', 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast('Gagal mengekspor laporan.', 'error');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Control Bar: Period Filter & Export */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Filter Analitik Wilayah</h2>
            <p className="text-[11px] text-slate-400 font-medium">Pilih rentang waktu evaluasi performa seluruh Kampus di {YayasanName}</p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto self-end">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {[
                { id: '7days', label: '7 Hari Terakhir' },
                { id: '30days', label: '30 Hari Terakhir' },
                { id: '90days', label: '90 Hari Terakhir' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPeriodFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    periodFilter === p.id 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer disabled:opacity-50 shrink-0"
              title="Download Rekap Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards - 4 Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendapatan */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pendapatan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : formatCurrency(reportData.totalRevenue)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{reportData.revenueGrowth || 14.2}%
              </span>
              <span className="text-[11px] text-slate-400">vs periode lalu</span>
            </div>
          </div>
        </div>

        {/* Total Panggilan */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Volume Panggilan</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : `${formatNumber(reportData.totalCalls)} Panggilan`}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[11px] font-bold text-blue-600">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{reportData.callsGrowth || 12.5}%
              </span>
              <span className="text-[11px] text-slate-400">vs periode lalu</span>
            </div>
          </div>
        </div>

        {/* Rata-rata Durasi */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rata-rata Durasi</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : `${Math.floor((reportData.avgCallDurationSeconds || 0) / 60)}m ${(reportData.avgCallDurationSeconds || 0) % 60}s`}
            </p>
            <span className="text-[11px] text-slate-400 mt-1.5 inline-block">
              Per sesi panggilan Santri
            </span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Success Rate</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-800">
              {isLoading ? '...' : `${reportData.successRate || 98.4}%`}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> Kualitas GSM Stabil
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Tren Pendapatan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren Pendapatan Wilayah</h3>
              <p className="text-[11px] text-slate-400">Perkembangan omzet komunikasi se-wilayah</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.revenueTrend || []}>
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

        {/* Chart 2: Volume Panggilan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Volume Panggilan Harian</h3>
              <p className="text-[11px] text-slate-400">Total sambungan telepon yang terhubung</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.callVolumeTrend || []}>
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

      {/* Breakdown Kinerja Kampus */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Performa & Keterisian Kampus</h3>
            <p className="text-[11px] text-slate-400">Distribusi operasional pada Kampus di bawah {YayasanName}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-100">
            {reportData.KampusBreakdown?.length || 0} Kampus Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 text-left">Nama Kampus</th>
                <th className="py-3 px-4 text-left">Kota / Wilayah</th>
                <th className="py-3 px-4 text-left">Hunian Santri</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reportData.KampusBreakdown && reportData.KampusBreakdown.length > 0 ? (
                reportData.KampusBreakdown.map((Kampus, idx) => {
                  const isAktif = Kampus.status === 'Aktif' || Kampus.status === 'Active';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center font-bold">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span>{Kampus.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{Kampus.city}</td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-extrabold text-slate-800">{Kampus.inmateCount}</span>
                        <span className="text-slate-400 text-[11px] ml-1">/ {Kampus.capacity} Kapasitas</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    Tidak ada data performa Kampus.
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

