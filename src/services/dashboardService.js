import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan bila rute backend berbeda
export const DASHBOARD_SUMMARY_ENDPOINT = '/api/dashboard/summary';

/**
 * Mapper terpusat untuk menstandarisasi data ringkasan dashboard
 * Format output yang diharapkan:
 * {
 *   totalCalls: number,
 *   totalRevenue: number,
 *   activeBranches: number,
 *   successRate: number,
 *   revenueTrend: [{ date: string, amount: number }],
 *   callVolume: [{ date: string, count: number }],
 *   callsGrowth?: number | null,
 *   revenueGrowth?: number | null,
 *   branchesGrowth?: number | null,
 *   successRateGrowth?: number | null
 * }
 */
export const mapDashboardSummary = (raw) => {
  const data = raw?.data || raw || {};

  return {
    totalCalls: typeof data.totalCalls === 'number' ? data.totalCalls : (Number(data.totalCalls) || 0),
    totalRevenue: typeof data.totalRevenue === 'number' ? data.totalRevenue : (Number(data.totalRevenue) || 0),
    activeBranches: typeof data.activeBranches === 'number' ? data.activeBranches : (Number(data.activeBranches) || 0),
    successRate: typeof data.successRate === 'number' ? data.successRate : (Number(data.successRate) || 0),
    revenueTrend: Array.isArray(data.revenueTrend)
      ? data.revenueTrend.map((item) => ({
          date: item.date || '',
          amount: Number(item.amount ?? item.revenue) || 0,
        }))
      : [],
    callVolume: Array.isArray(data.callVolume ?? data.callTrend)
      ? (data.callVolume ?? data.callTrend).map((item) => ({
          date: item.date || '',
          count: Number(item.count ?? item.calls) || 0,
        }))
      : [],
    callsGrowth: typeof data.callsGrowth === 'number' ? data.callsGrowth : null,
    revenueGrowth: typeof data.revenueGrowth === 'number' ? data.revenueGrowth : null,
    branchesGrowth: typeof data.branchesGrowth === 'number' ? data.branchesGrowth : null,
    successRateGrowth: typeof data.successRateGrowth === 'number' ? data.successRateGrowth : null,
  };
};

/**
 * Memanggil endpoint ringkasan dashboard Superadmin
 * Jika respons 401, otomatis memicu logout.
 * Jika endpoint belum ada (404) atau server tidak dapat dihubungi,
 * fungsi akan mengembalikan struktur data kosong default secara aman.
 */
export const getDashboardSummary = async () => {
  try {
    const response = await apiFetch(DASHBOARD_SUMMARY_ENDPOINT);
    return mapDashboardSummary(response);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    // Catat log untuk kebutuhan debugging tanpa melempar error teknis ke UI
    console.log('[DashboardService] Memuat data default/kosong:', error?.message || error);
    return mapDashboardSummary({});
  }
};

export default {
  DASHBOARD_SUMMARY_ENDPOINT,
  mapDashboardSummary,
  getDashboardSummary,
};
