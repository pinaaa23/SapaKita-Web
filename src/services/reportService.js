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

  const totalRevenue = typeof data.totalRevenue === 'number' 
    ? data.totalRevenue 
    : (Number(data.totalRevenue ?? data.revenue ?? data.summary?.totalRevenue) || 0);

  const totalCalls = typeof data.totalCalls === 'number' 
    ? data.totalCalls 
    : (Number(data.totalCalls ?? data.calls ?? data.summary?.totalCalls) || 0);

  const avgCallDurationSeconds = typeof data.avgCallDurationSeconds === 'number' 
    ? data.avgCallDurationSeconds 
    : (Number(data.avgCallDurationSeconds ?? data.avgDuration ?? data.avgDurationSeconds) || 0);

  const successRate = typeof data.successRate === 'number' 
    ? data.successRate 
    : (Number(data.successRate ?? data.summary?.successRate) || 0);

  const rawRevenueTrend = Array.isArray(data.revenueTrend) 
    ? data.revenueTrend 
    : (Array.isArray(data.trendData) ? data.trendData : []);
  
  const revenueTrend = rawRevenueTrend.map(item => ({
    date: item.date || item.tanggal || '',
    amount: typeof item.amount === 'number' ? item.amount : (Number(item.amount ?? item.revenue) || 0)
  })).filter(i => i.date);

  const rawCallVolumeTrend = Array.isArray(data.callVolumeTrend) 
    ? data.callVolumeTrend 
    : (Array.isArray(data.trendData) ? data.trendData : []);

  const callVolumeTrend = rawCallVolumeTrend.map(item => ({
    date: item.date || item.tanggal || '',
    count: typeof item.count === 'number' ? item.count : (Number(item.count ?? item.calls) || 0)
  })).filter(i => i.date);

  const revenueGrowth = typeof data.revenueGrowth === 'number' 
    ? data.revenueGrowth 
    : (typeof data.revenueGrowthPercent === 'number' ? data.revenueGrowthPercent : null);

  const callsGrowth = typeof data.callsGrowth === 'number' 
    ? data.callsGrowth 
    : (typeof data.callsGrowthPercent === 'number' ? data.callsGrowthPercent : null);

  const successRateGrowth = typeof data.successRateGrowth === 'number' 
    ? data.successRateGrowth 
    : (typeof data.successRateGrowthPercent === 'number' ? data.successRateGrowthPercent : null);

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
    compliance: {
      recordedRate: recordedRate || 100,
      avgSearchTime: avgSearchTime || 3.2,
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
 * Mengambil data laporan cabang (Admin Cabang)
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
        { date: '28 Sep', count: 2 },
        { date: '29 Sep', count: 3 },
        { date: '30 Sep', count: 1 },
        { date: '01 Okt', count: 4 },
        { date: '02 Okt', count: stats.totalCalls },
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
    const res = await apiFetch(url);
    return mapReportData(res);
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
    const res = await apiFetch(url);
    return mapReportData(res);
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

