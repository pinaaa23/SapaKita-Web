import { apiFetch, logout } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const BRANCH_SUMMARY_ENDPOINT = '/api/dashboard/branch-summary';

/**
 * Mapper untuk menstandarisasi data ringkasan dashboard Admin Cabang
 */
export const mapBranchSummary = (raw) => {
  const data = raw?.data || raw || {};

  return {
    totalCalls: typeof data.totalCalls === 'number' ? data.totalCalls : null,
    answeredCalls: typeof data.answeredCalls === 'number' ? data.answeredCalls : null,
    missedCalls: typeof data.missedCalls === 'number' ? data.missedCalls : null,
    totalInmates: typeof data.totalInmates === 'number' ? data.totalInmates : null,
    callsGrowth: typeof data.callsGrowth === 'number' ? data.callsGrowth : null,
    answeredGrowth: typeof data.answeredGrowth === 'number' ? data.answeredGrowth : null,
    missedGrowth: typeof data.missedGrowth === 'number' ? data.missedGrowth : null,
    inmatesGrowth: typeof data.inmatesGrowth === 'number' ? data.inmatesGrowth : null,
  };
};

/**
 * Mengambil ringkasan data dashboard cabang
 */
export const getBranchSummary = async () => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const stats = dummyStore.getBranchStats('b1');
    return {
      totalCalls: stats.totalCalls,
      answeredCalls: stats.answeredCalls,
      missedCalls: stats.missedCalls,
      totalInmates: stats.totalInmates,
      callsGrowth: 12.5,
      answeredGrowth: 15.0,
      missedGrowth: -5.2,
      inmatesGrowth: 0,
    };
  }

  try {
    const response = await apiFetch(BRANCH_SUMMARY_ENDPOINT);
    return mapBranchSummary(response);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[BranchDashboardService] Endpoint belum ada, menunggu endpoint BE:', error?.message || error);
    return mapBranchSummary(null);
  }
};

export const SUPERVISOR_SUMMARY_ENDPOINT = '/api/dashboard/supervisor-summary';

/**
 * Mengambil ringkasan data dashboard khusus Supervisor (SPV)
 */
export const getSupervisorSummary = async () => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    return dummyStore.getSupervisorStats('b1');
  }

  try {
    const response = await apiFetch(SUPERVISOR_SUMMARY_ENDPOINT);
    const data = response?.data || response || {};
    return {
      totalPackages: typeof data.totalPackages === 'number' ? data.totalPackages : null,
      activePackages: typeof data.activePackages === 'number' ? data.activePackages : null,
      todayTransactions: typeof data.todayTransactions === 'number' ? data.todayTransactions : null,
      totalInmates: typeof data.totalInmates === 'number' ? data.totalInmates : null,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[BranchDashboardService] Endpoint SPV belum ada, menunggu endpoint BE:', error?.message || error);
    return {
      totalPackages: null,
      activePackages: null,
      todayTransactions: null,
      totalInmates: null,
    };
  }
};

export default {
  BRANCH_SUMMARY_ENDPOINT,
  SUPERVISOR_SUMMARY_ENDPOINT,
  mapBranchSummary,
  getBranchSummary,
  getSupervisorSummary,
};

