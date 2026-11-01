import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Building2, 
  PhoneCall, 
  Clock, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Award,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { getCallHistory, getKanwilCalls } from '../services/callService';
import { getBranches } from '../services/branchService';

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
        const bRes = await getBranches({ limit: 100 });
        allBranches = Array.isArray(bRes?.items) ? bRes.items : (Array.isArray(bRes?.data) ? bRes.data : (Array.isArray(bRes) ? bRes : []));
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
          scopedBranches = allBranches;
        }
      }
      setBranches(scopedBranches);

      // Helper pagination aman dengan limit 100 sesuai batas Zod backend
      const fetchAllCalls = async (fetcher) => {
        let allItems = [];
        let page = 1;
        let totalPages = 1;
        do {
          const res = await fetcher({ page, limit: 100 });
          const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          allItems = allItems.concat(items);
          totalPages = Number(res?.totalPages) || (res?.total ? Math.ceil(res.total / 100) : 1);
          page += 1;
        } while (page <= totalPages && page <= 10);
        return allItems;
      };

      // B. Ambil riwayat panggilan riil
      let callList = [];
      if (isKanwil) {
        try {
          callList = await fetchAllCalls(getKanwilCalls);
        } catch (e1) {
          console.warn('[CallPerformanceChart] getKanwilCalls fallback:', e1);
          callList = await fetchAllCalls(getCallHistory);
        }
      } else {
        callList = await fetchAllCalls(getCallHistory);
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
        shortName: bName.replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, '').trim() || bName,
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
            shortName: name.replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, '').trim() || name,
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
                         call.status === 'COMPLETED' ||
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

    const isFewBranches = branchStats.size <= 4;
    const result = Array.from(branchStats.values()).map((item) => {
      const successRate = item.totalCalls > 0 
        ? Number(((item.answeredCalls / item.totalCalls) * 100).toFixed(1)) 
        : 0;
      // Gunakan nama lengkap jika cabang sedikit (<= 4) agar rapi, atau shortName jika banyak
      const displayLabel = isFewBranches ? item.branchName : item.shortName;
      return {
        ...item,
        displayLabel,
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
                         call.status === 'COMPLETED' ||
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
        displayLabel: entry.monthName,
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

  // Custom Tooltip Recharts tanpa background abu-abu gelap
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
          <span className="font-extrabold text-slate-800 text-xs truncate max-w-[200px]">
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0B3D91] flex items-center justify-center font-bold shadow-2xs">
              <BarChart3 className="w-4.5 h-4.5 text-[#0B3D91]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
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
              <p className="text-xs text-slate-400 mt-0.5">
                {isKanwil
                  ? `Sinkronisasi performa panggilan ${branches.length} Lapas/UPT di bawah naungan ${kanwilName}`
                  : `Sinkronisasi performa panggilan seluruh ${branches.length} Lapas se-Indonesia`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Switcher Tampilan (Komparasi Lapas vs Tren Bulanan) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-semibold border border-slate-200/50">
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
              <span>Komparasi Lapas</span>
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

          {/* Filter Periode Bulan (by_branch) atau Cabang (by_month) */}
          {viewMode === 'by_branch' ? (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 cursor-pointer shadow-2xs"
              >
                <option value="all">Semua Periode ({rawCalls.length} Panggilan)</option>
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
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 cursor-pointer max-w-[200px] truncate shadow-2xs"
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

          {/* Switcher Metrik (Panggilan vs Durasi) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-semibold border border-slate-200/50">
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

          {/* Tombol Segarkan */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            title="Segarkan data panggilan terbaru"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0B3D91] border border-slate-200 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0B3D91]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Mini di Atas Diagram */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#0B3D91]" />
              Total Panggilan
            </span>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded-md">
              {viewMode === 'by_branch' ? (selectedMonth === 'all' ? 'Akumulasi' : activePeriodLabel) : 'Tahun Ini'}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatNumber(summaryMetrics.totalCalls)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-emerald-600 font-semibold">{formatNumber(summaryMetrics.answeredCalls)} terjawab</span>
            <span className="mx-1">•</span>
            <span className="text-rose-500 font-medium">{formatNumber(summaryMetrics.missedCalls)} gagal</span>
          </p>
        </div>

        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Total Durasi Bicara
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
            {formatDuration(summaryMetrics.totalSeconds)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Durasi riil terhubung</p>
        </div>

        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Success Rate
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
            {summaryMetrics.successRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rasio panggilan berhasil</p>
        </div>

        <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/50 hover:bg-amber-50/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold mb-1 truncate">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Lapas Teraktif
            </span>
          </div>
          <p className="text-sm sm:text-base font-black text-amber-900 tracking-tight truncate mt-0.5" title={summaryMetrics.topLapas?.branchName || '-'}>
            {summaryMetrics.topLapas ? summaryMetrics.topLapas.branchName : '-'}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-0.5 truncate">
            {summaryMetrics.topLapas ? `${formatNumber(summaryMetrics.topLapas.totalCalls)} sesi panggilan` : 'Belum ada panggilan'}
          </p>
        </div>
      </div>

      {/* 3. Area Diagram Batang Recharts */}
      <div className="h-72 sm:h-84 w-full pt-2">
        {isLoading ? (
          <div className="h-full w-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
            Memuat data performa panggilan...
          </div>
        ) : (viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData).length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData}
              margin={{ top: 12, right: 12, bottom: 20, left: -10 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="displayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                dy={8}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickFormatter={(val) => metricType === 'calls' ? formatNumber(val) : `${val}m`}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={false} 
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 600 }}
              />
              <Bar
                name={metricType === 'calls' ? 'Panggilan Terjawab (Sukses)' : 'Durasi Terjawab (Menit)'}
                dataKey={metricType === 'calls' ? 'answeredCalls' : 'totalMinutes'}
                fill="#0B3D91"
                radius={[6, 6, 0, 0]}
                maxBarSize={55}
              />
              {metricType === 'calls' && (
                <Bar
                  name="Tidak Terjawab / Gagal"
                  dataKey="missedCalls"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
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
