import { apiFetch, logout } from './api';
import { mockRecordings } from './mockRecordings';

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
 * Helper untuk filter mock recordings secara lokal
 */
const getFilteredMockRecordings = ({
  search = '',
  status = '',
  callType = '',
  startDate = '',
  endDate = '',
  page = 1,
  limit = 20,
}) => {
  let list = [...mockRecordings];

  // Filter tipe panggilan (voice / video)
  if (callType && callType !== 'All' && callType !== 'all') {
    const isVideoReq = callType.toLowerCase().includes('video');
    list = list.filter((c) => isVideoReq ? c.callType === 'Video' : c.callType === 'Voice');
  }

  // Filter status (Answered / Missed)
  if (status && status !== 'All' && status !== 'all') {
    const normStat = status.toLowerCase();
    list = list.filter((c) => c.status.toLowerCase() === normStat);
  }

  // Filter pencarian teks
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((c) =>
      (c.inmateName || '').toLowerCase().includes(q) ||
      (c.inmateId || '').toLowerCase().includes(q) ||
      (c.familyName || '').toLowerCase().includes(q) ||
      (c.familyPhone || '').toLowerCase().includes(q)
    );
  }

  // Filter rentang tanggal
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    list = list.filter((c) => new Date(c.date) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    list = list.filter((c) => new Date(c.date) <= end);
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginatedItems = list.slice(startIndex, startIndex + limit).map(mapCallItem);

  return {
    items: paginatedItems,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
  };
};

/**
 * Mengambil daftar riwayat panggilan dengan parameter pencarian, rentang tanggal, dan pagination
 */
export const getCallHistory = async ({
  search = '',
  page = 1,
  limit = 20,
  status = '',
  branchId = '',
  callType = '',
  startDate = '',
  endDate = '',
} = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (status && status !== 'All') params.append('status', status.toUpperCase());
  if (branchId && branchId !== 'All') params.append('branchId', branchId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
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

    if (rawList.length === 0) {
      // Jika backend belum menyediakan data, gunakan mockRecordings
      return getFilteredMockRecordings({ search, status, callType, startDate, endDate, page, limit });
    }

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
    console.log('[CallService] Menggunakan mock data riwayat panggilan:', error?.message || error);
    return getFilteredMockRecordings({ search, status, callType, startDate, endDate, page, limit });
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
    // Fallback dari mock data
    const found = mockRecordings.find(c => c.id === id);
    if (found) return mapCallItem(found);
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
