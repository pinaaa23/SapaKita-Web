import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Building2, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Award,
  Layers,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { getCallHistory, getKanwilCalls } from '../services/callService';
import { getBranches } from '../services/branchService';
import { getKanwilBranches } from '../services/kanwilService';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function CallPerformanceComparisonChart({
  role = 'superadmin',
  kanwilId = null,
  kanwilName = 'Kantor Wilayah',
}) {
  const isKanwil = role === 'kanwil';
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState('by_branch'); // 'by_branch' (Komparasi Antar Lapas) | 'by_month' (Tren Bulanan)
  const [metricType, setMetricType] = useState('calls'); // 'calls' (Volume Panggilan) | 'duration' (Durasi Menit)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rawCalls, setRawCalls] = useState([]);

  // Fetch calls & branches data secara sinkron
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Ambil daftar cabang/Lapas
      let branchList = [];
      if (isKanwil) {
        const bRes = await getKanwilBranches(kanwilId, { limit: 100 });
        branchList = Array.isArray(bRes?.items) ? bRes.items : (Array.isArray(bRes) ? bRes : []);
      } else {
        const bRes = await getBranches({ limit: 100 });
        branchList = Array.isArray(bRes?.items) ? bRes.items : (Array.isArray(bRes) ? bRes : []);
      }
      setBranches(branchList);

      // 2. Ambil riwayat panggilan riil
      let callList = [];
      if (isKanwil) {
        const cRes = await getKanwilCalls({ limit: 2000 });
        callList = Array.isArray(cRes?.items) ? cRes.items : [];
      } else {
        const cRes = await getCallHistory({ limit: 2000 });
        callList = Array.isArray(cRes?.items) ? cRes.items : [];
      }
      setRawCalls(callList);
    } catch (err) {
      console.warn('[CallPerformanceChart] Gagal memuat data panggilan/cabang:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isKanwil, kanwilId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Daftar bulan yang tersedia dari riwayat panggilan
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    monthSet.add(currentMonthKey);

    rawCalls.forEach((call) => {
      if (call.startTime || call.createdAt) {
        const d = new Date(call.startTime || call.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthSet.add(key);
        }
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [rawCalls, currentMonthKey]);

  // Format durasi detik ke teks rapi (misal: "12m 30s" atau "2j 15m")
  const formatDuration = (totalSeconds) => {
    const sec = Math.max(0, Math.round(totalSeconds || 0));
    if (sec < 60) return `${sec} dtk`;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins < 60) return `${mins}m ${remSec > 0 ? `${remSec}s` : ''}`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}j ${remMins}m`;
  };

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num || 0);

  // Mapping nama Lapas dari branchId / raw name
  const branchMap = useMemo(() => {
    const map = new Map();
    branches.forEach((b) => {
      if (b.id) map.set(b.id, b.name || b.branchName || 'Lapas');
      if (b._id) map.set(b._id, b.name || b.branchName || 'Lapas');
    });
    return map;
  }, [branches]);

  // 1. PROSES DATA KOMPARASI ANTAR LAPAS (View Mode: by_branch)
  const comparisonByBranchData = useMemo(() => {
    // Siapkan wadah untuk setiap Lapas yang terdaftar
    const branchStats = new Map();

    branches.forEach((b) => {
      const bId = b.id || b._id;
      const bName = b.name || b.branchName || 'Lapas';
      branchStats.set(bId, {
        branchId: bId,
        branchName: bName,
        shortName: bName.replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, ''),
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        totalSeconds: 0,
        totalMinutes: 0,
      });
    });

    // Loop semua panggilan dan akumulasikan sesuai bulan terpilih
    rawCalls.forEach((call) => {
      const callDate = new Date(call.startTime || call.createdAt);
      if (isNaN(callDate.getTime())) return;

      const callMonthKey = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
      if (selectedMonth !== 'all' && callMonthKey !== selectedMonth) {
        return;
      }

      // Cari cabang asosiasi
      const callBranchId = call.branchId || call.inmate?.branchId;
      let matchedBranchId = null;

      if (callBranchId && branchStats.has(callBranchId)) {
        matchedBranchId = callBranchId;
      } else if (call.branchName || call.inmate?.branchName) {
        const rawName = (call.branchName || call.inmate?.branchName || '').toLowerCase();
        for (const [bId, b] of branchStats.entries()) {
          if (b.branchName.toLowerCase().includes(rawName) || rawName.includes(b.shortName.toLowerCase())) {
            matchedBranchId = bId;
            break;
          }
        }
      }

      // Jika belum terdaftar di map (misal cabang baru dari panggilan), tambahkan
      if (!matchedBranchId) {
        matchedBranchId = callBranchId || 'unknown_branch';
        const name = call.branchName || call.inmate?.branchName || 'Lapas Pemasyarakatan';
        if (!branchStats.has(matchedBranchId)) {
          branchStats.set(matchedBranchId, {
            branchId: matchedBranchId,
            branchName: name,
            shortName: name.replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, ''),
            totalCalls: 0,
            answeredCalls: 0,
            missedCalls: 0,
            totalSeconds: 0,
            totalMinutes: 0,
          });
        }
      }

      const stats = branchStats.get(matchedBranchId);
      const isAnswered = call.status === 'Answered' || 
                         call.status === 'ENDED' || 
                         call.status === 'COMPLETED' || 
                         Boolean(call.connectedAt) || 
                         (Number(call.durationSeconds) > 0);

      const sec = Number(call.durationSeconds) || 0;

      stats.totalCalls += 1;
      if (isAnswered) {
        stats.answeredCalls += 1;
        stats.totalSeconds += sec;
        stats.totalMinutes = Number((stats.totalSeconds / 60).toFixed(1));
      } else {
        stats.missedCalls += 1;
      }
    });

    const result = Array.from(branchStats.values()).map((item) => {
      const successRate = item.totalCalls > 0 
        ? Number(((item.answeredCalls / item.totalCalls) * 100).toFixed(1)) 
        : 0;
      return {
        ...item,
        successRate,
      };
    });

    // Urutkan berdasarkan total panggilan tertinggi
    return result.sort((a, b) => b.totalCalls - a.totalCalls);
  }, [branches, rawCalls, selectedMonth]);

  // 2. PROSES DATA TREN BULANAN (View Mode: by_month)
  const monthlyTrendData = useMemo(() => {
    // Siapkan 12 bulan untuk tahun berjalan
    const targetYear = selectedMonth !== 'all' ? parseInt(selectedMonth.split('-')[0], 10) : now.getFullYear();
    const monthsMap = new Map();

    for (let m = 1; m <= 12; m++) {
      const mKey = `${targetYear}-${String(m).padStart(2, '0')}`;
      monthsMap.set(mKey, {
        monthKey: mKey,
        monthName: MONTH_SHORT[m - 1],
        fullName: `${MONTH_NAMES[m - 1]} ${targetYear}`,
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        totalSeconds: 0,
        totalMinutes: 0,
      });
    }

    rawCalls.forEach((call) => {
      const callDate = new Date(call.startTime || call.createdAt);
      if (isNaN(callDate.getTime())) return;

      const callYear = callDate.getFullYear();
      if (callYear !== targetYear) return;

      // Filter cabang jika dipilih Lapas spesifik
      if (selectedBranchId !== 'all') {
        const callBranchId = call.branchId || call.inmate?.branchId;
        if (callBranchId !== selectedBranchId) return;
      }

      const mKey = `${callYear}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthsMap.get(mKey);
      if (!entry) return;

      const isAnswered = call.status === 'Answered' || 
                         call.status === 'ENDED' || 
                         call.status === 'COMPLETED' || 
                         Boolean(call.connectedAt) || 
                         (Number(call.durationSeconds) > 0);

      const sec = Number(call.durationSeconds) || 0;

      entry.totalCalls += 1;
      if (isAnswered) {
        entry.answeredCalls += 1;
        entry.totalSeconds += sec;
        entry.totalMinutes = Number((entry.totalSeconds / 60).toFixed(1));
      } else {
        entry.missedCalls += 1;
      }
    });

    return Array.from(monthsMap.values()).map((entry) => {
      const successRate = entry.totalCalls > 0 
        ? Number(((entry.answeredCalls / entry.totalCalls) * 100).toFixed(1)) 
        : 0;
      return {
        ...entry,
        successRate,
      };
    });
  }, [rawCalls, selectedMonth, selectedBranchId, now]);

  // Statistik Ringkasan Periode Aktif
  const summaryMetrics = useMemo(() => {
    const activeData = viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData;
    const totalCalls = activeData.reduce((acc, d) => acc + d.totalCalls, 0);
    const answeredCalls = activeData.reduce((acc, d) => acc + d.answeredCalls, 0);
    const missedCalls = activeData.reduce((acc, d) => acc + d.missedCalls, 0);
    const totalSeconds = activeData.reduce((acc, d) => acc + d.totalSeconds, 0);
    const successRate = totalCalls > 0 ? Number(((answeredCalls / totalCalls) * 100).toFixed(1)) : 0;

    // Cari Lapas dengan panggilan terbanyak (Top Performer)
    const topLapas = comparisonByBranchData.length > 0 && comparisonByBranchData[0].totalCalls > 0
      ? comparisonByBranchData[0]
      : null;

    return {
      totalCalls,
      answeredCalls,
      missedCalls,
      totalSeconds,
      successRate,
      topLapas,
    };
  }, [viewMode, comparisonByBranchData, monthlyTrendData]);

  // Custom Tooltip Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload || {};

    const title = viewMode === 'by_branch' 
      ? (data.branchName || label) 
      : (data.fullName || label);

    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-xs min-w-[220px] animate-in fade-in-50 duration-150">
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0B3D91] flex items-center justify-center font-bold">
            {viewMode === 'by_branch' ? <Building2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
          </div>
          <span className="font-extrabold text-slate-800 text-xs truncate max-w-[180px]">
            {title}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B3D91]"></span>
              <span>Terjawab (Sukses):</span>
            </span>
            <span className="font-black text-[#0B3D91]">{formatNumber(data.answeredCalls)} panggilan</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]"></span>
              <span>Tidak Terjawab:</span>
            </span>
            <span className="font-bold text-rose-600">{formatNumber(data.missedCalls)} panggilan</span>
          </div>

          <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
            <span>Total Durasi Bicara:</span>
            <span className="font-bold text-slate-800">{formatDuration(data.totalSeconds)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Tingkat Keberhasilan:</span>
            <span className={`font-black ${data.successRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {data.successRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
      {/* 1. Header Komponen & Filter Navigasi */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B3D91] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4 text-[#0B3D91]" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {isKanwil 
                ? `Performa Panggilan Lapas di ${kanwilName}` 
                : 'Performa Panggilan Seluruh Lapas Nasional'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 ml-10">
            {isKanwil
              ? 'Komparasi performa panggilan antar-Lapas yang diampu Kanwil di setiap bulannya secara sinkron'
              : 'Komparasi performa panggilan antar-Lapas nasional di setiap bulannya secara sinkron'}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switcher Tampilan (Lapas vs Bulanan) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('by_branch')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_branch'
                  ? 'bg-white text-[#0B3D91] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Komparasi Antar Lapas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by_month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_month'
                  ? 'bg-white text-[#0B3D91] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tren Bulanan</span>
            </button>
          </div>

          {/* Filter Bulan (Aktif jika View Mode: by_branch) */}
          {viewMode === 'by_branch' ? (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 cursor-pointer"
              >
                <option value="all">Semua Bulan</option>
                {availableMonths.map((mKey) => {
                  const [y, m] = mKey.split('-');
                  const label = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
                  return (
                    <option key={mKey} value={mKey}>
                      {label} {mKey === currentMonthKey ? '(Bulan Ini)' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            /* Filter Cabang (Aktif jika View Mode: by_month) */
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">Semua Lapas</option>
                {branches.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name || b.branchName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Switcher Metrik (Panggilan vs Menit) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMetricType('calls')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricType === 'calls'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Jumlah Panggilan
            </button>
            <button
              type="button"
              onClick={() => setMetricType('duration')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricType === 'duration'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Durasi (Menit)
            </button>
          </div>

          {/* Tombol Sinkronisasi Data Riil */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            title="Sinkronkan data panggilan terbaru dari database"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0B3D91] border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0B3D91]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Mini di Atas Diagram */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-[#0B3D91]" />
            Total Panggilan
          </p>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {formatNumber(summaryMetrics.totalCalls)}
          </p>
          <p className="text-[10px] text-slate-400">
            {formatNumber(summaryMetrics.answeredCalls)} terjawab • {formatNumber(summaryMetrics.missedCalls)} gagal
          </p>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            Total Durasi Bicara
          </p>
          <p className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
            {formatDuration(summaryMetrics.totalSeconds)}
          </p>
          <p className="text-[10px] text-slate-400">Durasi riil terhubung</p>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            Success Rate
          </p>
          <p className="text-base sm:text-lg font-black text-blue-700 mt-0.5">
            {summaryMetrics.successRate}%
          </p>
          <p className="text-[10px] text-slate-400">Rasio panggilan sukses</p>
        </div>

        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
          <p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 truncate">
            <Award className="w-3 h-3 text-amber-600 shrink-0" />
            Lapas Teraktif
          </p>
          <p className="text-xs sm:text-sm font-black text-amber-900 mt-0.5 truncate" title={summaryMetrics.topLapas?.branchName || '-'}>
            {summaryMetrics.topLapas ? summaryMetrics.topLapas.shortName : '-'}
          </p>
          <p className="text-[10px] text-amber-700/80 truncate">
            {summaryMetrics.topLapas ? `${formatNumber(summaryMetrics.topLapas.totalCalls)} panggilan` : 'Belum ada panggilan'}
          </p>
        </div>
      </div>

      {/* 3. Area Diagram Batang Recharts */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {isLoading ? (
          <div className="h-full w-full bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
            Memuat data performa panggilan...
          </div>
        ) : (viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData).length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData}
              margin={{ top: 10, right: 10, bottom: 25, left: -10 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey={viewMode === 'by_branch' ? 'shortName' : 'monthName'}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                dy={8}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(val) => metricType === 'calls' ? formatNumber(val) : `${val}m`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
              />
              <Bar
                name={metricType === 'calls' ? 'Panggilan Terjawab (Sukses)' : 'Durasi Terjawab (Menit)'}
                dataKey={metricType === 'calls' ? 'answeredCalls' : 'totalMinutes'}
                fill="#0B3D91"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
              {metricType === 'calls' && (
                <Bar
                  name="Tidak Terjawab / Gagal"
                  dataKey="missedCalls"
                  fill="#F43F5E"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <PhoneCall className="w-8 h-8 text-slate-300 mb-2" />
            <span>Belum ada data panggilan pada periode ini</span>
          </div>
        )}
      </div>

      {/* Footer Penjelas */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Data tersinkronisasi otomatis dengan basis data panggilan riil</span>
        </span>
        <span className="text-slate-500">
          Menampilkan {viewMode === 'by_branch' ? `${comparisonByBranchData.length} Lapas` : '12 Bulan'}
        </span>
      </div>
    </div>
  );
}
