import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
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

const EMPTY_INITIAL_BRANCHES = [];

export default function CallPerformanceComparisonChart({
  role = 'superadmin',
  kanwilId = null,
  kanwilName = 'Kantor Wilayah',
  initialBranches = EMPTY_INITIAL_BRANCHES
}) {
  const isKanwil = role === 'kanwil';
  const initialBranchesRef = useRef(initialBranches);
  useEffect(() => {
    initialBranchesRef.current = initialBranches;
  }, [initialBranches]);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState('by_branch'); // 'by_branch' (Komparasi Kampus Pondok) | 'by_month' (Tren Bulanan)
  const [metricType, setMetricType] = useState('calls'); // 'calls' (Volume Panggilan) | 'duration' (Durasi Menit)
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [topLimit, setTopLimit] = useState('all'); // 'all' | '10' | '20'

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [branches, setBranches] = useState([]);
  const [rawCalls, setRawCalls] = useState([]);

  // 1. Fetch calls & branches data secara sinkron
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // A. Ambil seluruh kampus/cabang
      let allBranches = [];
      try {
        const bRes = await getBranches({ limit: 100 });
        allBranches = Array.isArray(bRes?.items) ? bRes.items : (Array.isArray(bRes?.data) ? bRes.data : (Array.isArray(bRes) ? bRes : []));
      } catch (e) {
        console.warn('[CallPerformanceChart] Fallback getBranches:', e);
      }

      // Filter cabang berdasarkan hak akses:
      // Superadmin: SEMUA Kampus Pondok se-Indonesia
      // Yayasan: HANYA Kampus Pondok di bawah naungan Yayasan tersebut
      let scopedBranches = allBranches;
      if (isKanwil) {
        scopedBranches = allBranches.filter((b) => {
          if (kanwilId && (b.kanwilId === kanwilId || b.kanwil?.id === kanwilId)) return true;
          if (kanwilName && kanwilName !== 'Kantor Wilayah' && kanwilName !== 'Yayasan Pesantren') {
            const cleanKanwil = kanwilName.toLowerCase().replace(/^(yayasan|kantor wilayah|kanwil)\s+/gi, '').trim();
            const bKanwil = (b.kanwilName || b.kanwil?.name || b.location || b.province || '').toLowerCase();
            if (bKanwil.includes(cleanKanwil)) return true;
          }
          return false;
        });

        // Fallback jika belum cocok dari kanwilId
        if (scopedBranches.length === 0 && initialBranchesRef.current && initialBranchesRef.current.length > 0) {
          scopedBranches = initialBranchesRef.current;
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
      try {
        callList = await fetchAllCalls(getCallHistory);
      } catch (errCalls) {
        console.warn('[CallPerformanceChart] getCallHistory fallback:', errCalls);
        if (isKanwil) {
          callList = await fetchAllCalls(getKanwilCalls).catch(() => []);
        }
      }

      // Filter panggilan khusus Yayasan: Hanya panggilan milik Kampus yang diampu Yayasan
      if (isKanwil && scopedBranches.length > 0) {
        const kanwilBranchIdSet = new Set(scopedBranches.map((b) => String(b.id || b._id)));
        const kanwilBranchNameSet = new Set(
          scopedBranches.map((b) => (b.name || b.branchName || '').toLowerCase().trim())
        );

        callList = callList.filter((c) => {
          const bId = String(c.branchId || c.inmate?.branchId || c.branch?.id || '');
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
  }, [isKanwil, kanwilId, kanwilName]);

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
  }, [rawCalls.length, selectedMonth]);

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

  // 1. PROSES DATA KOMPARASI ANTAR KAMPUS PONDOK (View Mode: by_branch)
  const comparisonByBranchData = useMemo(() => {
    const branchStats = new Map();

    // Pastikan setiap kampus yang terdaftar di naungan ini muncul di diagram
    branches.forEach((b) => {
      const bId = b.id || b._id;
      const bName = b.name || b.branchName || 'Kampus Pondok';
      branchStats.set(bId, {
        branchId: bId,
        branchName: bName,
        shortName: bName.replace(/^(pesantren|ponpes|pondok|kampus|cabang)\s+/gi, '').trim() || bName,
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

      // Cocokkan cabang/kampus asosiasi
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
        const name = call.branchName || call.inmate?.branchName || call.branch?.name || 'Kampus Pesantren';
        if (!branchStats.has(matchedBranchId)) {
          branchStats.set(matchedBranchId, {
            branchId: matchedBranchId,
            branchName: name,
            shortName: name.replace(/^(pesantren|ponpes|pondok|kampus|cabang)\s+/gi, '').trim() || name,
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
        stats.totalMinutes = Number((stats.totalSeconds / 60).toFixed(2));
      } else {
        stats.missedCalls += 1;
      }
    });

    const isFewBranches = branchStats.size <= 4;
    const result = Array.from(branchStats.values()).map((item) => {
      const successRate = item.totalCalls > 0 
        ? Number(((item.answeredCalls / item.totalCalls) * 100).toFixed(1)) 
        : 0;
      const displayLabel = isFewBranches ? item.branchName : item.shortName;
      return {
        ...item,
        displayLabel,
        successRate,
      };
    });

    // Urutkan dari Kampus Pondok dengan total panggilan tertinggi
    const sorted = result.sort((a, b) => b.totalCalls - a.totalCalls);
    if (topLimit !== 'all' && viewMode === 'by_branch') {
      const limitNum = parseInt(topLimit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        return sorted.slice(0, limitNum);
      }
    }
    return sorted;
  }, [branches, rawCalls, selectedMonth, topLimit, viewMode]);

  // 2. PROSES DATA TREN BULANAN (View Mode: by_month)
  const monthlyTrendData = useMemo(() => {
    // Tentukan tahun acuan secara stabil
    let targetYear = new Date().getFullYear();
    if (selectedMonth !== 'all') {
      const y = parseInt(selectedMonth.split('-')[0], 10);
      if (!isNaN(y)) targetYear = y;
    } else if (rawCalls.length > 0) {
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

      // Filter spesifik Kampus jika dipilih
      if (selectedBranchId !== 'all') {
        const callBranchId = String(call.branchId || call.inmate?.branchId || call.branch?.id || '');
        const targetId = String(selectedBranchId);
        if (callBranchId !== targetId) {
          const targetBranch = branches.find(b => String(b.id || b._id) === targetId);
          const targetName = (targetBranch?.name || targetBranch?.branchName || '').toLowerCase().trim();
          const callBranchName = (call.branchName || call.inmate?.branchName || call.branch?.name || '').toLowerCase().trim();
          if (!targetName || !callBranchName || !callBranchName.includes(targetName)) {
            return;
          }
        }
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
      if (!entry.branchMap) entry.branchMap = {};
      const bName = call.branchName || call.inmate?.branchName || call.branch?.name || 'Kampus Pondok';
      entry.branchMap[bName] = (entry.branchMap[bName] || 0) + 1;

      if (isAnswered) {
        entry.answeredCalls += 1;
        entry.totalSeconds += sec;
        entry.totalMinutes = Number((entry.totalSeconds / 60).toFixed(2));
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
  }, [rawCalls, selectedMonth, selectedBranchId, branches]);

  // Statistik Ringkasan Periode Aktif
  const summaryMetrics = useMemo(() => {
    const activeData = viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData;
    const totalCalls = activeData.reduce((acc, d) => acc + d.totalCalls, 0);
    const answeredCalls = activeData.reduce((acc, d) => acc + d.answeredCalls, 0);
    const missedCalls = activeData.reduce((acc, d) => acc + d.missedCalls, 0);
    const totalSeconds = activeData.reduce((acc, d) => acc + d.totalSeconds, 0);
    const successRate = totalCalls > 0 ? Number(((answeredCalls / totalCalls) * 100).toFixed(1)) : 0;

    const topPondok = comparisonByBranchData.length > 0 && comparisonByBranchData[0].totalCalls > 0
      ? comparisonByBranchData[0]
      : null;

    return {
      totalCalls,
      answeredCalls,
      missedCalls,
      totalSeconds,
      successRate,
      topPondok,
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
          <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#0D7A73] flex items-center justify-center font-bold">
            {viewMode === 'by_branch' ? <Building2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
          </div>
          <span className="font-extrabold text-slate-800 text-xs truncate max-w-[200px]">
            {title}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0D7A73]"></span>
              <span>Terjawab (Sukses):</span>
            </span>
            <span className="font-black text-[#0D7A73]">{formatNumber(data.answeredCalls)} panggilan</span>
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

          {viewMode === 'by_month' && data.branchMap && Object.keys(data.branchMap).length > 0 && selectedBranchId === 'all' && (
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
              <span className="font-bold text-slate-700 block mb-1">Rincian Kontribusi Pondok:</span>
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {Object.entries(data.branchMap).map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center text-slate-600">
                    <span className="truncate max-w-[140px]">• {name}</span>
                    <span className="font-semibold text-slate-800">{count} pgl</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4">
      {/* 1. Header Komponen & Filter Navigasi */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0D7A73] flex items-center justify-center font-bold shadow-2xs">
              <BarChart3 className="w-4.5 h-4.5 text-[#0D7A73]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {isKanwil 
                    ? `Performa Panggilan Pondok di ${kanwilName}` 
                    : 'Performa Panggilan Seluruh Pondok Pesantren'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  isKanwil 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-teal-50 text-[#0D7A73] border-teal-200'
                }`}>
                  {isKanwil ? `Yayasan ${kanwilName}` : 'Tingkat Nasional (Semua Pondok)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKanwil
                  ? `Sinkronisasi performa panggilan ${branches.length} Pondok Pesantren di bawah naungan ${kanwilName}`
                  : `Sinkronisasi performa panggilan seluruh ${branches.length} Pondok Pesantren se-Indonesia`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Switcher Tampilan (Komparasi Kampus Pondok vs Tren Bulanan) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-semibold border border-slate-200/50">
            <button
              type="button"
              onClick={() => setViewMode('by_branch')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_branch'
                  ? 'bg-white text-[#0D7A73] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Komparasi Pondok Pesantren</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by_month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'by_month'
                  ? 'bg-white text-[#0D7A73] shadow-xs font-bold'
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
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D7A73]/20 cursor-pointer shadow-2xs"
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
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D7A73]/20 cursor-pointer max-w-[200px] truncate shadow-2xs"
              >
                <option value="all">{isKanwil ? 'Semua Pondok Wilayah' : 'Semua Pondok Pesantren'}</option>
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
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0D7A73] border border-slate-200 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0D7A73]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Mini di Atas Diagram */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100/90 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#0D7A73]" />
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
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              Success Rate
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-teal-700 tracking-tight">
            {summaryMetrics.successRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rasio panggilan berhasil</p>
        </div>

        <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/50 hover:bg-amber-50/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold mb-1 truncate">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Pondok Teraktif
            </span>
          </div>
          <p className="text-sm sm:text-base font-black text-amber-900 tracking-tight truncate mt-0.5" title={summaryMetrics.topPondok?.branchName || '-'}>
            {summaryMetrics.topPondok ? summaryMetrics.topPondok.branchName : '-'}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-0.5 truncate">
            {summaryMetrics.topPondok ? `${formatNumber(summaryMetrics.topPondok.totalCalls)} sesi panggilan` : 'Belum ada panggilan'}
          </p>
        </div>
      </div>

      {/* 2.5 Header Legend Rapi & Sejajar (HTML-Based) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-[#0D7A73] rounded-full"></span>
            <span>{viewMode === 'by_branch' ? 'Distribusi Panggilan per Pondok Pesantren' : 'Tren Panggilan 12 Bulan'}</span>
          </span>
          {viewMode === 'by_branch' && branches.length > 10 && (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setTopLimit('all')}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${topLimit === 'all' ? 'bg-white text-[#0D7A73] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua ({branches.length})
              </button>
              <button
                type="button"
                onClick={() => setTopLimit('10')}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${topLimit === '10' ? 'bg-white text-[#0D7A73] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setTopLimit('20')}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${topLimit === '20' ? 'bg-white text-[#0D7A73] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Top 20
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D7A73]"></span>
            <span>{metricType === 'calls' ? 'Panggilan Terjawab (Sukses)' : 'Durasi Terjawab'}</span>
          </span>
          {metricType === 'calls' && (
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]"></span>
              <span>Tidak Terjawab / Gagal</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Area Diagram Batang Recharts Responsif Dinamis (Mendukung hingga 60+ Pondok) */}
      {(() => {
        const currentData = viewMode === 'by_branch' ? comparisonByBranchData : monthlyTrendData;
        const itemCount = currentData.length;
        const hasData = summaryMetrics.totalCalls > 0 || (viewMode === 'by_branch' && itemCount > 0);
        const needsScroll = viewMode === 'by_branch' && itemCount > 12;
        const dynamicMinWidth = needsScroll ? Math.max(900, itemCount * 65) : '100%';
        const isAngled = viewMode === 'by_branch' && itemCount > 5;

        return (
          <div className="h-76 sm:h-84 w-full pt-1 overflow-x-auto custom-scrollbar">
            <div style={{ minWidth: dynamicMinWidth, height: '100%' }}>
              {isLoading ? (
                <div className="h-full w-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Memuat data performa panggilan...
                </div>
              ) : (summaryMetrics.totalCalls > 0 && itemCount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentData}
                    margin={{ top: 10, right: 16, bottom: isAngled ? 25 : 10, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="displayLabel"
                      axisLine={{ stroke: '#CBD5E1', strokeWidth: 1.5 }}
                      tickLine={{ stroke: '#CBD5E1', strokeWidth: 1.5 }}
                      tick={{ fill: '#334155', fontSize: itemCount > 8 ? 10 : 12, fontWeight: 700 }}
                      angle={isAngled ? -25 : 0}
                      textAnchor={isAngled ? 'end' : 'middle'}
                      height={isAngled ? 50 : 30}
                      dy={isAngled ? 4 : 8}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                      allowDecimals={false}
                      domain={[0, (dataMax) => Math.max(dataMax, 5)]}
                      tickFormatter={(val) => metricType === 'calls' ? formatNumber(val) : `${val}m`}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={false} 
                    />
                    {/* StackId menjamin kolom batang 100% tegak lurus presisi tepat di atas label & garis axis */}
                    <Bar
                      name={metricType === 'calls' ? 'Panggilan Terjawab (Sukses)' : 'Durasi Terjawab (Menit)'}
                      dataKey={metricType === 'calls' ? 'answeredCalls' : 'totalMinutes'}
                      fill="#0D7A73"
                      stackId="callsStack"
                      radius={metricType === 'calls' ? [4, 4, 0, 0] : [6, 6, 0, 0]}
                      maxBarSize={55}
                    />
                    {metricType === 'calls' && (
                      <Bar
                        name="Tidak Terjawab / Gagal"
                        dataKey="missedCalls"
                        fill="#F43F5E"
                        stackId="callsStack"
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
          </div>
        );
      })()}

      {/* Footer Penjelas */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>
            {isKanwil 
              ? `Tersinkronisasi khusus UPT di lingkungan ${kanwilName}` 
              : 'Tersinkronisasi seluruh pondok pesantren nasional'}
          </span>
        </div>
        <div className="text-slate-400 font-medium">
          {viewMode === 'by_branch' 
            ? `Menampilkan ${comparisonByBranchData.length} Pondok Pesantren • ${activePeriodLabel}` 
            : `Menampilkan tren 12 bulan • ${selectedBranchId === 'all' ? (isKanwil ? 'Semua Pondok Wilayah' : 'Semua Pondok') : 'Pondok Terpilih'}`}
        </div>
      </div>
    </div>
  );
}
