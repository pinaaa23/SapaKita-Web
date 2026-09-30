import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const CALL_HISTORY_ENDPOINT = '/api/call/history';
export const CALL_DETAIL_ENDPOINT = (id) => `/api/call/history/${id}`;

/**
 * Mapper fleksibel untuk menstandarisasi setiap item riwayat panggilan
 */
export const mapCallItem = (item) => {
  if (!item) return null;

  const rawStatus = (item.status || 'NO_ANSWER').toUpperCase();
  let normalizedStatus = 'Missed';
  if (rawStatus === 'ANSWERED' || rawStatus === 'COMPLETED') normalizedStatus = 'Answered';
  else if (rawStatus === 'BUSY') normalizedStatus = 'Busy';
  else if (rawStatus === 'MISSED' || rawStatus === 'NO_ANSWER') normalizedStatus = 'Missed';
  else normalizedStatus = item.status || 'Missed';

  const rawType = (item.callType || item.type || 'AUDIO').toUpperCase();
  const isVideo = rawType.includes('VIDEO');
  const callType = isVideo ? 'Video' : 'Voice';
  const backendType = isVideo ? 'VIDEO' : 'AUDIO';

  return {
    id: item.id || item.callId || item._id,
    branchId: item.branchId || item.inmate?.branchId || 'b1',
    branchName: item.branch?.name || item.branchName || 'Cabang Cipinang',
    inmateId: item.inmate?.identifier || item.inmateId || item.inmateIdentifier || item.wbpRegNumber || '-',
    inmateName: item.inmate?.name || item.inmateName || 'Narapidana',
    familyId: item.familyId || item.family?.id || '',
    familyName: item.family?.name || item.familyName || 'Keluarga',
    familyPhone: item.family?.phone || item.familyPhone || item.family?.email || '-',
    date: item.date || item.createdAt || new Date().toISOString(),
    durationSeconds: typeof item.durationSeconds === 'number' ? item.durationSeconds : (Number(item.duration) || 0),
    cost: typeof item.cost === 'number' ? item.cost : (Number(item.amount ?? item.cost) || 0),
    status: normalizedStatus,
    rawStatus,
    callType,
    backendType,
    hasRecording: Boolean(item.hasRecording ?? item.recordingUrl ?? false),
    recordingUrl: item.recordingUrl || '',
    transcript: item.transcript || '',
    transcriptStatus: item.transcriptStatus || (item.transcript ? 'Ready' : null),
  };
};

/**
 * Mengambil daftar riwayat panggilan dengan parameter pencarian dan pagination
 */
export const getCallHistory = async ({
  search = '',
  page = 1,
  limit = 20,
  status = '',
  branchId = '',
  callType = '',
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (status && status !== 'All') params.append('status', status.toUpperCase());
  if (branchId && branchId !== 'All') params.append('branchId', branchId);
  if (callType && callType !== 'All') {
    const normalizedType = callType.toUpperCase().includes('VIDEO') ? 'VIDEO' : 'AUDIO';
    params.append('type', normalizedType);
  }

  const queryString = params.toString();
  const url = queryString ? `${CALL_HISTORY_ENDPOINT}?${queryString}` : CALL_HISTORY_ENDPOINT;

  try {
    const res = await apiFetch(url);
    console.log('[CallService] Response GET /api/call/history:', res);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.calls)
            ? res.calls
            : [];

    const total = typeof res?.total === 'number'
      ? res.total
      : typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : rawList.length;

    const totalPages = typeof res?.totalPages === 'number'
      ? res.totalPages
      : typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(total / limit));

    return {
      items: rawList.map(mapCallItem).filter(Boolean),
      total,
      page: Number(res?.page || res?.pagination?.page || page),
      limit: Number(res?.limit || res?.pagination?.limit || limit),
      totalPages,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[CallService] Fallback data kosong riwayat panggilan:', error?.message || error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
};

/**
 * Mengambil detail riwayat panggilan berdasarkan ID
 */
export const getCallById = async (id) => {
  if (!id) throw new Error('ID Panggilan diperlukan');

  const endpoint = CALL_DETAIL_ENDPOINT(id);
  try {
    const res = await apiFetch(endpoint);
    console.log(`[CallService] Response GET ${endpoint}:`, res);
    const item = res?.data || res?.item || res?.call || res;
    return mapCallItem(item);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[CallService] Gagal memuat detail panggilan (${id}):`, error?.message || error);
    throw error;
  }
};

export default {
  CALL_HISTORY_ENDPOINT,
  CALL_DETAIL_ENDPOINT,
  mapCallItem,
  getCallHistory,
  getCallById,
};
