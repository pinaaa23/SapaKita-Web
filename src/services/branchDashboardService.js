import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const BRANCH_SUMMARY_ENDPOINT = '/api/dashboard/branch-summary';

/**
 * Mapper untuk menstandarisasi data ringkasan dashboard Admin Cabang
 */
export const mapBranchSummary = (raw) => {
  const data = raw?.data || raw || {};

  return {
    totalCalls: typeof data.totalCalls === 'number' ? data.totalCalls : (Number(data.totalCalls) || 0),
    answeredCalls: typeof data.answeredCalls === 'number' ? data.answeredCalls : (Number(data.answeredCalls ?? data.answered) || 0),
    missedCalls: typeof data.missedCalls === 'number' ? data.missedCalls : (Number(data.missedCalls ?? data.missed) || 0),
    totalInmates: typeof data.totalInmates === 'number' ? data.totalInmates : (Number(data.totalInmates ?? data.inmates) || 0),
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
  try {
    const response = await apiFetch(BRANCH_SUMMARY_ENDPOINT);
    return mapBranchSummary(response);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[BranchDashboardService] Fallback data kosong ringkasan cabang:', error?.message || error);
    return mapBranchSummary({});
  }
};

export default {
  BRANCH_SUMMARY_ENDPOINT,
  mapBranchSummary,
  getBranchSummary,
};
