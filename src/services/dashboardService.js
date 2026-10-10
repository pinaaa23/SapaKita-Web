import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan bila rute backend berbeda
export const DASHBOARD_SUMMARY_ENDPOINT = '/api/dashboard/summary';

/**
 * Mapper terpusat untuk menstandarisasi data ringkasan dashboard
 */
export const mapDashboardSummary = (raw) => {
  const data = raw?.data || raw || {};

  // Di backend (dashboard.service.ts), totalBranches dihitung dari count({ where: { status: 'Aktif' } })
  const activeBranches = typeof data.totalBranches === 'number' 
    ? data.totalBranches 
    : (typeof data.activeBranches === 'number' ? data.activeBranches : 0);

  // Field yang belum dikirim oleh BE endpoint /api/dashboard/summary diset null agar ditampilkan '-'
  const totalRevenue = typeof data.totalRevenue === 'number' ? data.totalRevenue : null;
  const revenueGrowth = typeof data.revenueGrowth === 'number' ? data.revenueGrowth : null;
  const successRate = typeof data.successRate === 'number' ? data.successRate : null;
  const successRateGrowth = typeof data.successRateGrowth === 'number' ? data.successRateGrowth : null;

  return {
    totalCalls: typeof data.totalCalls === 'number' ? data.totalCalls : (Number(data.totalCalls) || 0),
    totalRevenue,
    activeBranches,
    successRate,
    revenueTrend: Array.isArray(data.revenueTrend)
      ? data.revenueTrend.map((item) => ({
          date: item.date || '',
          amount: Number(item.amount ?? item.revenue) || 0,
        }))
      : [],
    callVolume: Array.isArray(data.callVolume ?? data.callVolumeTrend ?? data.callTrend)
      ? (data.callVolume ?? data.callVolumeTrend ?? data.callTrend).map((item) => ({
          date: item.date || '',
          count: Number(item.count ?? item.calls) || 0,
        }))
      : [],
    callsGrowth: typeof data.callsGrowth === 'number' ? data.callsGrowth : null,
    revenueGrowth,
    branchesGrowth: typeof data.branchesGrowth === 'number' ? data.branchesGrowth : null,
    successRateGrowth,
  };
};

/**
 * Memanggil endpoint ringkasan dashboard Superadmin
 * Jika mode demo aktif, memuat data dari dummyStore
 */
export const getDashboardSummary = async () => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const stats = dummyStore.getSuperadminStats();
    return {
      totalCalls: stats.totalCalls,
      totalRevenue: stats.totalRevenue,
      activeBranches: stats.activeBranches,
      successRate: stats.successRate,
      revenueTrend: [
        { date: '28 Sep', amount: 35964 },
        { date: '29 Sep', amount: 47952 },
        { date: '30 Sep', amount: 29970 },
        { date: '01 Okt', amount: 53946 },
        { date: '02 Okt', amount: stats.totalRevenue },
      ],
      callVolume: [
        { date: '28 Sep', count: 3 },
        { date: '29 Sep', count: 4 },
        { date: '30 Sep', count: 2 },
        { date: '01 Okt', count: 5 },
        { date: '02 Okt', count: stats.totalCalls },
      ],
      callsGrowth: 14.2,
      revenueGrowth: 18.5,
      branchesGrowth: 0,
      successRateGrowth: 3.1,
    };
  }

  try {
    const response = await apiFetch(DASHBOARD_SUMMARY_ENDPOINT);
    return mapDashboardSummary(response);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[DashboardService] Error memuat data ringkasan dashboard:', error?.message || error);
    return mapDashboardSummary({});
  }
};

export default {
  DASHBOARD_SUMMARY_ENDPOINT,
  mapDashboardSummary,
  getDashboardSummary,
};
