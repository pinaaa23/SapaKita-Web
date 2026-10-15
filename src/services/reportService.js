import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta di atas file agar mudah disesuaikan
export const BRANCH_REPORT_ENDPOINT = '/api/reports/branch-summary';
export const SUMMARY_REPORT_ENDPOINT = '/api/reports/summary';

/**
 * Mapper fleksibel untuk menstandarisasi data Laporan & Analitik dari backend
 */
export const mapReportData = (raw) => {
  const data = raw?.data || raw || {};
  const summary = data.nationalSummary || data.summary || data;

  const totalRevenue = typeof summary.totalRevenue === 'number' 
    ? summary.totalRevenue 
    : (Number(summary.totalRevenue ?? data.totalRevenue ?? summary.revenue ?? data.revenue) || 0);

  const totalCalls = typeof summary.totalCalls === 'number' 
    ? summary.totalCalls 
    : (Number(summary.totalCalls ?? data.totalCalls ?? summary.calls ?? data.calls) || 0);

  const avgCallDurationSeconds = typeof summary.avgCallDurationSeconds === 'number' 
    ? summary.avgCallDurationSeconds 
    : (Number(summary.avgCallDurationSeconds ?? data.avgCallDurationSeconds ?? summary.avgDuration ?? data.avgDuration) || 0);

  const successRate = typeof summary.successRate === 'number' 
    ? summary.successRate 
    : (Number(summary.successRate ?? data.successRate) || 0);

  const rawRevenueTrend = Array.isArray(data.revenueTrend) 
    ? data.revenueTrend 
    : (Array.isArray(data.trendData) ? data.trendData : []);
  
  const revenueTrend = rawRevenueTrend.map(item => {
    const val = typeof item.amount === 'number' ? item.amount : (Number(item.amount ?? item.revenue) || 0);
    return {
      date: item.date || item.tanggal || '',
      amount: val,
      revenue: val,
    };
  }).filter(i => i.date);

  const rawCallVolumeTrend = Array.isArray(data.callVolumeTrend) 
    ? data.callVolumeTrend 
    : (Array.isArray(data.trendData) ? data.trendData : []);

  const callVolumeTrend = rawCallVolumeTrend.map(item => {
    const countVal = typeof item.calls === 'number' 
      ? item.calls 
      : (Number(item.calls ?? item.totalCalls ?? item.count) || 0);
    return {
      date: item.date || item.tanggal || '',
      calls: countVal,
      count: countVal,
      totalCalls: countVal,
      answeredCalls: typeof item.answeredCalls === 'number' ? item.answeredCalls : 0,
      missedCalls: typeof item.missedCalls === 'number' ? item.missedCalls : 0,
    };
  }).filter(i => i.date);

  const revenueGrowth = typeof data.revenueGrowth === 'number' 
    ? data.revenueGrowth 
    : (typeof data.revenueGrowthPercent === 'number' ? data.revenueGrowthPercent : null);

  const callsGrowth = typeof data.callsGrowth === 'number' 
    ? data.callsGrowth 
    : (typeof data.callsGrowthPercent === 'number' ? data.callsGrowthPercent : null);

  const successRateGrowth = typeof data.successRateGrowth === 'number' 
    ? data.successRateGrowth 
    : (typeof data.successRateGrowthPercent === 'number' ? data.successRateGrowthPercent : null);

  // Field kepatuhan (compliance): jika tidak dikirim BE, kembalikan null agar ditampilkan '-'
  const recordedRate = typeof data.compliance?.recordedRate === 'number' 
    ? data.compliance.recordedRate 
    : (typeof data.recordedRate === 'number' ? data.recordedRate : null);

  const avgSearchTime = typeof data.compliance?.avgSearchTime === 'number' 
    ? data.compliance.avgSearchTime 
    : (typeof data.avgSearchTime === 'number' ? data.avgSearchTime : null);

  return {
    totalRevenue,
    totalCalls,
    avgCallDurationSeconds,
    successRate,
    revenueTrend,
    callVolumeTrend,
    revenueGrowth,
    callsGrowth,
    successRateGrowth,
    branchComparison: Array.isArray(data.branchComparison) ? data.branchComparison : [],
    compliance: {
      recordedRate,
      avgSearchTime,
    }
  };
};

/**
 * Normalisasi parameter periode (7, 30, 90)
 */
const normalizePeriod = (period) => {
  if (!period) return '30';
  const str = String(period).toLowerCase();
  if (str.includes('7')) return '7';
  if (str.includes('90')) return '90';
  return '30';
};

/**
 * Mengambil data laporan cabang (Kepala UPT / Supervisor)
 * Mengintegrasikan data transaksi paket kantin & log panggilan khusus cabang UPT tersebut
 */
export const getBranchReport = async ({ period = '30' } = {}) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const stats = dummyStore.getBranchStats('b1');
    return mapReportData({
      totalRevenue: stats.totalTopup,
      totalCalls: stats.totalCalls,
      avgCallDurationSeconds: 650,
      successRate: stats.totalCalls > 0 ? Math.round((stats.answeredCalls / stats.totalCalls) * 100) : 100,
      revenueGrowth: 14.5,
      callsGrowth: 10.2,
      successRateGrowth: 2.0,
      revenueTrend: [
        { date: '28 Sep', amount: 23976 },
        { date: '29 Sep', amount: 35964 },
        { date: '30 Sep', amount: 17982 },
        { date: '01 Okt', amount: 29970 },
        { date: '02 Okt', amount: stats.totalTopup },
      ],
      callVolumeTrend: [
        { date: '28 Sep', calls: 2, count: 2 },
        { date: '29 Sep', calls: 3, count: 3 },
        { date: '30 Sep', calls: 1, count: 1 },
        { date: '01 Okt', calls: 4, count: 4 },
        { date: '02 Okt', calls: stats.totalCalls, count: stats.totalCalls },
      ],
      compliance: {
        recordedRate: 100,
        avgSearchTime: 2.8,
      },
    });
  }

  const normPeriod = normalizePeriod(period);
  const url = `${BRANCH_REPORT_ENDPOINT}?period=${normPeriod}`;

  try {
    const [reportRes, canteenRes, recordingsRes] = await Promise.allSettled([
      apiFetch(url),
      apiFetch('/api/canteen/transactions?page=1&limit=200'),
      apiFetch('/api/recordings?page=1&limit=200'),
    ]);

    const rawReport = reportRes.status === 'fulfilled' ? reportRes.value : {};
    let mapped = mapReportData(rawReport);

    // 1. Ekstrak transaksi kantin cabang UPT ini (BE otomatis memfilter per UPT untuk Kepala UPT)
    let canteenTxList = [];
    if (canteenRes.status === 'fulfilled') {
      const val = canteenRes.value;
      canteenTxList = Array.isArray(val)
        ? val
        : (Array.isArray(val?.items)
          ? val.items
          : (Array.isArray(val?.data?.items)
            ? val.data.items
            : (Array.isArray(val?.data)
              ? val.data
              : [])));
    }

    // 2. Ekstrak rekaman panggilan cabang UPT ini (BE otomatis memfilter per UPT untuk Kepala UPT)
    let recordingsList = [];
    if (recordingsRes.status === 'fulfilled') {
      const val = recordingsRes.value;
      recordingsList = Array.isArray(val)
        ? val
        : (Array.isArray(val?.data)
          ? val.data
          : (Array.isArray(val?.items)
            ? val.items
            : []));
    }

    // Siapkan bucket tanggal sesuai periode (7, 30, atau 90 hari)
    const numDays = parseInt(normPeriod, 10) || 30;
    const dateList = [];
    const dailyRevMap = {};
    const dailyCallsMap = {};
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dateList.push(key);
      dailyRevMap[key] = 0;
      dailyCallsMap[key] = 0;
    }

    // Hitung total omzet kantin cabang UPT
    let totalCanteenRevenue = 0;
    canteenTxList.forEach((t) => {
      const isSuccess = t.status === 'BERHASIL' || t.status === 'Berhasil' || t.status === 'SUCCESS' || !t.status;
      if (isSuccess) {
        const amt = Number(t.totalAmount || t.amount || t.package?.price || 0);
        totalCanteenRevenue += amt;

        const dateKey = (t.createdAt || t.date || '').slice(0, 10);
        if (dateKey && dailyRevMap[dateKey] !== undefined) {
          dailyRevMap[dateKey] += amt;
        } else if (dateKey) {
          dailyRevMap[dateKey] = (dailyRevMap[dateKey] || 0) + amt;
        }
      }
    });

    // Hitung volume panggilan harian cabang UPT
    recordingsList.forEach((rec) => {
      const dateKey = (rec.createdAt || rec.call?.createdAt || '').slice(0, 10);
      if (dateKey && dailyCallsMap[dateKey] !== undefined) {
        dailyCallsMap[dateKey] += 1;
      } else if (dateKey) {
        dailyCallsMap[dateKey] = (dailyCallsMap[dateKey] || 0) + 1;
      }
    });

    const computedRevenueTrend = dateList.map((dKey) => ({
      date: dKey,
      amount: dailyRevMap[dKey] || 0,
      revenue: dailyRevMap[dKey] || 0,
    }));

    const computedCallVolumeTrend = dateList.map((dKey) => ({
      date: dKey,
      calls: dailyCallsMap[dKey] || 0,
      count: dailyCallsMap[dKey] || 0,
      totalCalls: dailyCallsMap[dKey] || 0,
    }));

    // Cek apakah data dari branch-summary backend memiliki angka > 0
    const beRevenueHasData = mapped.revenueTrend && mapped.revenueTrend.some((i) => (i.amount || i.revenue) > 0);
    const beCallsHasData = mapped.callVolumeTrend && mapped.callVolumeTrend.some((i) => (i.calls || i.totalCalls || i.count) > 0);

    const finalRevenueTrend = beRevenueHasData
      ? mapped.revenueTrend
      : (computedRevenueTrend.length > 0 ? computedRevenueTrend : mapped.revenueTrend);

    const finalCallVolumeTrend = beCallsHasData
      ? mapped.callVolumeTrend
      : (computedCallVolumeTrend.length > 0 ? computedCallVolumeTrend : mapped.callVolumeTrend);

    const finalTotalRevenue = mapped.totalRevenue > 0
      ? mapped.totalRevenue
      : (totalCanteenRevenue > 0 ? totalCanteenRevenue : mapped.totalRevenue);

    const finalTotalCalls = mapped.totalCalls > 0
      ? mapped.totalCalls
      : (recordingsList.length > 0 ? recordingsList.length : mapped.totalCalls);

    return {
      ...mapped,
      totalRevenue: finalTotalRevenue,
      totalCalls: finalTotalCalls,
      revenueTrend: finalRevenueTrend,
      callVolumeTrend: finalCallVolumeTrend,
      transactions: canteenTxList,
      recordings: recordingsList,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[ReportService] Gagal mengambil laporan cabang:`, error?.message || error);
    return mapReportData({});
  }
};

/**
 * Mengambil data laporan agregat nasional / pusat (Superadmin)
 */
export const getSummaryReport = async ({ period = '30' } = {}) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const stats = dummyStore.getSuperadminStats();
    return mapReportData({
      totalRevenue: stats.totalRevenue,
      totalCalls: stats.totalCalls,
      avgCallDurationSeconds: 710,
      successRate: stats.successRate,
      revenueGrowth: 18.2,
      callsGrowth: 12.8,
      successRateGrowth: 3.1,
      revenueTrend: [
        { date: '28 Sep', amount: 35964 },
        { date: '29 Sep', amount: 47952 },
        { date: '30 Sep', amount: 29970 },
        { date: '01 Okt', amount: 53946 },
        { date: '02 Okt', amount: stats.totalRevenue },
      ],
      callVolumeTrend: [
        { date: '28 Sep', count: 3 },
        { date: '29 Sep', count: 4 },
        { date: '30 Sep', count: 2 },
        { date: '01 Okt', count: 5 },
        { date: '02 Okt', count: stats.totalCalls },
      ],
      compliance: {
        recordedRate: 99.4,
        avgSearchTime: 3.5,
      },
    });
  }

  const normPeriod = normalizePeriod(period);
  const url = `${SUMMARY_REPORT_ENDPOINT}?period=${normPeriod}`;

  try {
    const [reportRes, canteenRes] = await Promise.allSettled([
      apiFetch(url),
      apiFetch('/api/canteen/transactions?page=1&limit=200'),
    ]);

    const rawReport = reportRes.status === 'fulfilled' ? reportRes.value : {};
    let mapped = mapReportData(rawReport);

    // Ekstrak transaksi pembelian paket kantin seluruh cabang UPT
    let canteenTxList = [];
    if (canteenRes.status === 'fulfilled') {
      const val = canteenRes.value;
      canteenTxList = Array.isArray(val)
        ? val
        : (Array.isArray(val?.items)
          ? val.items
          : (Array.isArray(val?.data?.items)
            ? val.data.items
            : (Array.isArray(val?.data)
              ? val.data
              : [])));
    }

    // Hitung total revenue riil dari seluruh cabang
    const totalCanteenRevenue = canteenTxList
      .filter((t) => t.status === 'BERHASIL' || t.status === 'Berhasil' || t.status === 'SUCCESS' || !t.status)
      .reduce((sum, t) => sum + (Number(t.totalAmount || t.amount || t.package?.price || 0)), 0);

    // Bangun agregasi harian omzet untuk periode terpilih (7, 30, atau 90 hari)
    const numDays = parseInt(normPeriod, 10) || 30;
    const dailyRevMap = {};
    const dateList = [];
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dateList.push(key);
      dailyRevMap[key] = 0;
    }

    canteenTxList.forEach((t) => {
      const dateKey = (t.createdAt || t.date || '').slice(0, 10);
      const amt = Number(t.totalAmount || t.amount || t.package?.price || 0);
      if (dateKey && dailyRevMap[dateKey] !== undefined) {
        dailyRevMap[dateKey] += amt;
      } else if (dateKey) {
        dailyRevMap[dateKey] = (dailyRevMap[dateKey] || 0) + amt;
      }
    });

    const computedDailyTrend = dateList.map((dKey) => ({
      date: dKey,
      amount: dailyRevMap[dKey] || 0,
    }));

    // Cek apakah revenueTrend dari backend memiliki data positif (> 0)
    const beTrendHasData = mapped.revenueTrend && mapped.revenueTrend.some((i) => i.amount > 0);

    const finalRevenueTrend = beTrendHasData
      ? mapped.revenueTrend
      : (computedDailyTrend.length > 0 ? computedDailyTrend : mapped.revenueTrend);

    const finalTotalRevenue = mapped.totalRevenue > 0 
      ? mapped.totalRevenue 
      : (totalCanteenRevenue > 0 ? totalCanteenRevenue : mapped.totalRevenue);

    return {
      ...mapped,
      totalRevenue: finalTotalRevenue,
      revenueTrend: finalRevenueTrend,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[ReportService] Gagal mengambil laporan pusat:`, error?.message || error);
    return mapReportData({});
  }
};

export default {
  BRANCH_REPORT_ENDPOINT,
  SUMMARY_REPORT_ENDPOINT,
  mapReportData,
  getBranchReport,
  getSummaryReport,
};

