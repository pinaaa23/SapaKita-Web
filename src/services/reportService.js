import { apiFetch, logout } from './api';

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
    : (Number(data.totalRevenue ?? data.revenue) || 0);

  const totalCalls = typeof data.totalCalls === 'number' 
    ? data.totalCalls 
    : (Number(data.totalCalls ?? data.calls) || 0);

  const avgCallDurationSeconds = typeof data.avgCallDurationSeconds === 'number' 
    ? data.avgCallDurationSeconds 
    : (Number(data.avgCallDurationSeconds ?? data.avgDuration ?? data.avgDurationSeconds) || 0);

  const successRate = typeof data.successRate === 'number' 
    ? data.successRate 
    : (Number(data.successRate) || 0);

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
 * Mengambil data laporan cabang (Admin Cabang)
 */
export const getBranchReport = async ({ period = '30' } = {}) => {
  const normPeriod = normalizePeriod(period);
  const url = `${BRANCH_REPORT_ENDPOINT}?period=${normPeriod}`;

  try {
    const res = await apiFetch(url);
    console.log(`[ReportService] Response GET ${url}:`, res);
    return mapReportData(res);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[ReportService] Fallback data kosong laporan cabang (${url}):`, error?.message || error);
    return mapReportData({});
  }
};

/**
 * Mengambil data laporan agregat nasional / pusat (Superadmin)
 */
export const getSummaryReport = async ({ period = '30' } = {}) => {
  const normPeriod = normalizePeriod(period);
  const url = `${SUMMARY_REPORT_ENDPOINT}?period=${normPeriod}`;

  try {
    const res = await apiFetch(url);
    console.log(`[ReportService] Response GET ${url}:`, res);
    return mapReportData(res);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[ReportService] Fallback data kosong laporan pusat (${url}):`, error?.message || error);
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
