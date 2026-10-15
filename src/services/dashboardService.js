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

  const totalCalls = typeof data.totalCalls === 'number' ? data.totalCalls : (Number(data.totalCalls) || 0);
  const answeredCalls = typeof data.answeredCalls === 'number' ? data.answeredCalls : (Number(data.answeredCalls) || 0);

  // Hitung tingkat keberhasilan panggilan jika backend belum menyediakan field precalculated
  let successRate = null;
  if (typeof data.successRate === 'number') {
    successRate = data.successRate;
  } else if (totalCalls > 0) {
    successRate = Number(((answeredCalls / totalCalls) * 100).toFixed(1));
  }

  const totalRevenue = typeof data.totalRevenue === 'number' 
    ? data.totalRevenue 
    : (typeof data.totalOmzet === 'number' ? data.totalOmzet : null);

  const revenueGrowth = typeof data.revenueGrowth === 'number' ? data.revenueGrowth : null;
  const successRateGrowth = typeof data.successRateGrowth === 'number' ? data.successRateGrowth : null;

  return {
    totalCalls,
    totalRevenue,
    activeBranches,
    successRate,
    totalInmates: typeof data.totalInmates === 'number' ? data.totalInmates : 0,
    totalTransactions: typeof data.totalTransactions === 'number' ? data.totalTransactions : 0,
    revenueTrend: Array.isArray(data.revenueTrend)
      ? data.revenueTrend.map((item) => ({
          date: item.date || item.tanggal || '',
          amount: Number(item.amount ?? item.revenue) || 0,
        }))
      : [],
    callVolume: Array.isArray(data.callVolume ?? data.callVolumeTrend ?? data.callTrend)
      ? (data.callVolume ?? data.callVolumeTrend ?? data.callTrend).map((item) => ({
          date: item.date || item.tanggal || '',
          count: Number(item.count ?? item.totalCalls ?? item.calls) || 0,
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
    const [summaryRes, reportRes, canteenRes] = await Promise.allSettled([
      apiFetch(DASHBOARD_SUMMARY_ENDPOINT),
      apiFetch('/api/reports/summary?period=7'),
      apiFetch('/api/canteen/transactions?page=1&limit=100'),
    ]);

    const summaryData = summaryRes.status === 'fulfilled' ? (summaryRes.value?.data || summaryRes.value || {}) : {};
    const reportData = reportRes.status === 'fulfilled' ? (reportRes.value?.data || reportRes.value || {}) : {};
    
    // Ekstrak daftar transaksi kantin dari seluruh cabang UPT
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

    // Hitung total omzet seluruh cabang nasional
    const totalCanteenOmzet = canteenTxList
      .filter((t) => t.status === 'BERHASIL' || t.status === 'Berhasil' || t.status === 'SUCCESS' || !t.status)
      .reduce((sum, t) => sum + (Number(t.totalAmount || t.amount || t.package?.price || 0)), 0);

    const totalRevenue = typeof summaryData.totalRevenue === 'number' && summaryData.totalRevenue > 0
      ? summaryData.totalRevenue
      : (totalCanteenOmzet > 0 ? totalCanteenOmzet : (Number(summaryData.totalRevenue) || 0));

    // Bangun agregasi harian omzet 7 hari terakhir untuk grafik Tren Pendapatan
    const dailyRevenueMap = {};
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      last7Days.push(key);
      dailyRevenueMap[key] = 0;
    }

    canteenTxList.forEach((t) => {
      const dateStr = (t.createdAt || t.date || '').slice(0, 10);
      const amt = Number(t.totalAmount || t.amount || t.package?.price || 0);
      if (dateStr && dailyRevenueMap[dateStr] !== undefined) {
        dailyRevenueMap[dateStr] += amt;
      } else if (dateStr) {
        dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + amt;
      }
    });

    const computedDailyTrend = last7Days.map((dKey) => ({
      date: dKey,
      amount: dailyRevenueMap[dKey] || 0,
    }));

    // Cek apakah revenueTrend dari backend memiliki data positif (> 0)
    const beTrend = Array.isArray(summaryData.revenueTrend) && summaryData.revenueTrend.length > 0
      ? summaryData.revenueTrend
      : (Array.isArray(reportData.revenueTrend) ? reportData.revenueTrend : []);
    
    const beHasData = beTrend.some((item) => (Number(item.amount ?? item.revenue) || 0) > 0);

    const finalRevenueTrend = beHasData 
      ? beTrend 
      : (computedDailyTrend.some(i => i.amount > 0) ? computedDailyTrend : computedDailyTrend);

    const mergedData = {
      ...summaryData,
      totalRevenue,
      revenueTrend: finalRevenueTrend,
      callVolume: (summaryData.callVolume?.length ? summaryData.callVolume : reportData.callVolumeTrend) || [],
    };

    return mapDashboardSummary(mergedData);
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
