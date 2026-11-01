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
  ChevronDown,
  ShieldCheck,
  Landmark
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

// Helper ekstraksi Date objek dari berbagai format respons panggilan
const getCallDate = (call) => {
  if (!call) return null;
  const raw = call.date || call.startTime || call.createdAt || call.connectedAt || call.timestamp;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

export default function CallPerformanceComparisonChart({
  role = 'superadmin',
  kanwilId = null,
  kanwilName = 'Kantor Wilayah',
  initialBranches = []
}) {
  const isKanwil = role === 'kanwil';
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState('by_branch'); // 'by_branch' (Komparasi Antar Lapas) | 'by_month' (Tren Bulanan)
  const [metricType, setMetricType] = useState('calls'); // 'calls' (Volume Panggilan) | 'duration' (Durasi Menit)
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rawCalls, setRawCalls] = useState([]);

  // 1. Fetch calls & branches data secara sinkron
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // A. Ambil seluruh cabang
      let allBranches = [];
      try {
        const bRes = await getBranches({ limit: 200 });
        allBranches = Array.isArray(bRes?.items) ? bRes.items : (Array.isArray(bRes) ? bRes : []);
      } catch (e) {
        console.warn('[CallPerformanceChart] Fallback getBranches:', e);
      }

      // Filter cabang berdasarkan hak akses:
      // Superadmin: SEMUA Lapas se-Indonesia
      // Kanwil: HANYA UPT / Lapas di bawah naungan Kanwil tersebut
      let scopedBranches = allBranches;
      if (isKanwil) {
        scopedBranches = allBranches.filter((b) => {
          if (kanwilId && (b.kanwilId === kanwilId || b.kanwil?.id === kanwilId)) return true;
          if (kanwilName && kanwilName !== 'Kantor Wilayah') {
            const cleanKanwil = kanwilName.toLowerCase().replace(/^(kanwil|kantor wilayah)\s+/gi, '').trim();
            const bKanwil = (b.kanwilName || b.kanwil?.name || b.location || b.province || '').toLowerCase();
            if (bKanwil.includes(cleanKanwil)) return true;
          }
          return false;
        });

        // Fallback jika belum cocok dari kanwilId
        if (scopedBranches.length === 0 && initialBranches && initialBranches.length > 0) {
          scopedBranches = initialBranches;
        } else if (scopedBranches.length === 0 && allBranches.length > 0) {
          // Jika di database hanya ada 1 cabang (misal Lapas Malang), ambil cabang tersebut untuk Kanwil Jatim
          scopedBranches = allBranches;
        }
      }
      setBranches(scopedBranches);

      // B. Ambil riwayat panggilan riil
      let callList = [];
      if (isKanwil) {
        try {
          const cRes = await getKanwilCalls({ limit: 2000 });
          callList = Array.isArray(cRes?.items) ? cRes.items : [];
        } catch {
          const cRes = await getCallHistory({ limit: 2000 });
          callList = Array.isArray(cRes?.items) ? cRes.items : [];
        }
      } else {
        const cRes = await getCallHistory({ limit: 2000 });
        callList = Array.isArray(cRes?.items) ? cRes.items : [];
      }

      // Filter panggilan khusus Kanwil: Hanya panggilan milik UPT yang diampu Kanwil
      if (isKanwil && scopedBranches.length > 0) {
        const kanwilBranchIdSet = new Set(scopedBranches.map((b) => b.id || b._id));
        const kanwilBranchNameSet = new Set(
          scopedBranches.map((b) => (b.name || b.branchName || '').toLowerCase().trim())
        );

        callList = callList.filter((c) => {
          const bId = c.branchId || c.inmate?.branchId || c.branch?.id;
          if (bId && kanwilBranchIdSet.has(bId)) return true;
          const bName = (c.branchName || c.inmate?.branchName || c.branch?.name || '').toLowerCase().trim();
          return bName && kanwilBranchNameSet.has(bName);
        });
      }

      setRawCalls(callList);
    } catch (err) {
      console.warn('[CallPerformanceChart] Gagal memuat data panggilan/cabang:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isKanwil, kanwilId, kanwilName, initialBranches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hitung jumlah panggilan per bulan untuk deteksi otomatis bulan aktif
  const monthCounts = useMemo(() => {
    const counts = {};
    rawCalls.forEach((call) => {
      const d = getCallDate(call);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [rawCalls]);

  // Daftar bulan yang tersedia
  const availableMonths = useMemo(() => {
    const monthSet = new Set(Object.keys(monthCounts));
    monthSet.add(currentMonthKey);
    return Array.from(monthSet).sort().reverse();
  }, [monthCounts, currentMonthKey]);

  // Otomatis arahkan selectedMonth ke bulan yang memiliki data panggilan riil
  useEffect(() => {
    if (rawCalls.length > 0) {
      // Jika bulan yang dipilih tidak memiliki data sama sekali dan bukan 'all',
      // pindahkan ke bulan terbaru yang memiliki data panggilan!
      if (selectedMonth !== 'all' && (!monthCounts[selectedMonth] || monthCounts[selectedMonth] === 0)) {
        const activeMonths = Object.keys(monthCounts)
          .filter((k) => monthCounts[k] > 0)
          .sort()
          .reverse();

        if (activeMonths.length > 0) {
          setSelectedMonth(activeMonths[0]);
        }
      }
    }
  }, [rawCalls, monthCounts, selectedMonth]);

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

  // 1. PROSES DATA KOMPARASI ANTAR LAPAS (View Mode: by_branch)
  const comparisonByBranchData = useMemo(() => {
    const branchStats = new Map();

    // Pastikan setiap cabang yang terdaftar di naungan ini muncul di diagram
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

    // Akumulasikan data panggilan sesuai filter bulan
    rawCalls.forEach((call) => {
      const callDate = getCallDate(call);
      if (!callDate) return;

      const callMonthKey = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
      if (selectedMonth !== 'all' && callMonthKey !== selectedMonth) {
        return;
      }

      // Cocokkan cabang asosiasi
      const callBranchId = call.branchId || call.inmate?.branchId || call.branch?.id;
      let matchedBranchId = null;

      if (callBranchId && branchStats.has(callBranchId)) {
        matchedBranchId = callBranchId;
      } else if (call.branchName || call.inmate?.branchName || call.branch?.name) {
        const rawName = (call.branchName || call.inmate?.branchName || call.branch?.name || '').toLowerCase();
        for (const [bId, b] of branchStats.entries()) {
          if (b.branchName.toLowerCase().includes(rawName) || rawName.includes(b.shortName.toLowerCase())) {
            matchedBranchId = bId;
            break;
          }
        }
      }

      // Jika cabang belum ada di map dan diperbolehkan
      if (!matchedBranchId) {
        matchedBranchId = callBranchId || 'unknown_branch';
        const name = call.branchName || call.inmate?.branchName || call.branch?.name || 'Lapas Pemasyarakatan';
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
                         call.rawStatus === 'ENDED' || 
                         call.rawStatus === 'COMPLETED' || 
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

    // Urutkan dari Lapas dengan total panggilan tertinggi
    return result.sort((a, b) => b.totalCalls - a.totalCalls);
  }, [branches, rawCalls, selectedMonth]);

  // 2. PROSES DATA TREN BULANAN (View Mode: by_month)
  const monthlyTrendData = useMemo(() => {
    // Tentukan tahun acuan
    let targetYear = now.getFullYear();
    if (selectedMonth !== 'all') {
      const y = parseInt(selectedMonth.split('-')[0], 10);
      if (!isNaN(y)) targetYear = y;
    } else if (rawCalls.length > 0) {
      // Ambil tahun dari panggilan terakhir
      const lastCallDate = getCallDate(rawCalls[0]);
      if (lastCallDate) targetYear = lastCallDate.getFullYear();
    }

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
      const callDate = getCallDate(call);
      if (!callDate) return;

      const callYear = callDate.getFullYear();
      if (callYear !== targetYear) return;

      // Filter spesifik Lapas jika dipilih
      if (selectedBranchId !== 'all') {
        const callBranchId = call.branchId || call.inmate?.branchId || call.branch?.id;
        if (callBranchId !== selectedBranchId) return;
      }

      const mKey = `${callYear}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthsMap.get(mKey);
      if (!entry) return;

      const isAnswered = call.status === 'Answered' || 
                         call.rawStatus === 'ENDED' || 
                         call.rawStatus === 'COMPLETED' || 
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

  // Label periode yang sedang aktif ditampilkan
  const activePeriodLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Semua Periode (Akumulasi)';
    const [y, m] = selectedMonth.split('-');
    const mIdx = parseInt(m, 10) - 1;
    return `${MONTH_NAMES[mIdx] || m} ${y}`;
  }, [selectedMonth]);

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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B3D91] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4 text-[#0B3D91]" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {isKanwil 
                ? `Performa Panggilan Lapas di ${kanwilName}` 
                : 'Performa Panggilan Seluruh Lapas Nasional'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
              isKanwil 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-blue-50 text-[#0B3D91] border-blue-200'
            }`}>
              {isKanwil ? `Wilayah ${kanwilName}` : 'Tingkat Nasional (Semua Lapas)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 ml-10">
            {isKanwil
              ? `Khusus membandingkan performa ${branches.length} Lapas/UPT di bawah naungan ${kanwilName} di setiap bulannya secara sinkron`
              : `Membandingkan performa panggilan seluruh ${branches.length} Lapas se-Indonesia di setiap bulannya secara sinkron`}
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
                <option value="all">Semua Bulan ({rawCalls.length} Panggilan)</option>
                {availableMonths.map((mKey) => {
                  const [y, m] = mKey.split('-');
                  const label = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
                  const count = monthCounts[mKey] || 0;
                  return (
                    <option key={mKey} value={mKey}>
                      {label} ({count} Panggilan){mKey === currentMonthKey ? ' - Bulan Ini' : ''}
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
                <option value="all">{isKanwil ? 'Semua Lapas Wilayah' : 'Semua Lapas Nasional'}</option>
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
            Total Panggilan ({viewMode === 'by_branch' ? activePeriodLabel : 'Tahun Ini'})
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
          <span>
            {isKanwil 
              ? `Tersinkronisasi khusus UPT di lingkungan ${kanwilName}` 
              : 'Tersinkronisasi seluruh UPT/Lapas nasional'}
          </span>
        </span>
        <span className="text-slate-500">
          {viewMode === 'by_branch' 
            ? `Menampilkan ${comparisonByBranchData.length} Lapas (${activePeriodLabel})` 
            : `Menampilkan tren bulanan 12 bulan (${selectedBranchId === 'all' ? (isKanwil ? 'Semua Lapas Wilayah' : 'Semua Lapas') : 'Lapas Terpilih'})`}
        </span>
      </div>
    </div>
  );
}
