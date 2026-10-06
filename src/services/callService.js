import { apiFetch, logout, getRecordingsApi, getRecordingByIdApi, getRecordingStreamUrlApi } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const RECORDINGS_ENDPOINT = '/api/recordings';
export const RECORDING_DETAIL_ENDPOINT = (id) => `/api/recordings/${id}`;
export const CALL_HISTORY_ENDPOINT = '/api/recordings';
export const CALL_DETAIL_ENDPOINT = (id) => `/api/recordings/${id}`;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

/**
 * Mapper fleksibel untuk menstandarisasi setiap item rekaman & transkrip panggilan
 */
export const mapCallItem = (item) => {
  if (!item) return null;

  // Mendukung struktur prisma Recording { id, callId, storageUrl, transcriptText, transcriptStatus, call: { ... } }
  // maupun response BE standar / dummy
  const call = item.call || item;

  const rawStatus = (call.status || (call.connectedAt ? 'COMPLETED' : 'NO_ANSWER')).toUpperCase();
  let normalizedStatus = 'Missed';
  if (rawStatus === 'ANSWERED' || rawStatus === 'COMPLETED' || (call.durationSeconds && call.durationSeconds > 0)) {
    normalizedStatus = 'Answered';
  } else if (rawStatus === 'BUSY') {
    normalizedStatus = 'Busy';
  } else if (rawStatus === 'MISSED' || rawStatus === 'NO_ANSWER') {
    normalizedStatus = 'Missed';
  } else {
    normalizedStatus = item.status || 'Missed';
  }

  const rawType = (call.type || call.callType || item.callType || 'AUDIO').toUpperCase();
  const isVideo = rawType.includes('VIDEO');
  const callType = isVideo ? 'Video' : 'Voice';
  const backendType = isVideo ? 'VIDEO' : 'AUDIO';

  const recordingId = item.id || item.recordingId || call.recordingId || call.id;
  const storageUrl = item.storageUrl || call.storageUrl;
  const isDemo = isDummyMode();
  const sampleAudio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  const transcript = item.transcriptText || item.transcript || call.transcriptText || call.transcript || '';
  const transcriptStatus = item.transcriptStatus || call.transcriptStatus || (transcript ? 'COMPLETED' : null);

  const hasRecording = Boolean(
    storageUrl || 
    item.recordingUrl || 
    call.recordingUrl || 
    item.hasRecording || 
    call.hasRecording || 
    (isDemo && normalizedStatus === 'Answered')
  );

  const recordingUrl = storageUrl 
    ? (storageUrl.startsWith('http') ? storageUrl : `${API_BASE_URL}/api/recordings/${recordingId}/stream`)
    : (item.recordingUrl || call.recordingUrl || (isDemo && hasRecording ? sampleAudio : ''));

  // Jalur panggilan (Web / GSM)
  // TODO: ganti dengan field dari backend saat endpoint backend menyediakan field channel
  const rawChannel = (call.channel || call.via || call.source || item.channel || item.via || item.source || '').toString().toLowerCase();
  let channel = 'web';
  if (rawChannel.includes('gsm') || rawChannel.includes('cellular') || rawChannel.includes('phone') || rawChannel.includes('pstn') || rawChannel.includes('seluler')) {
    channel = 'gsm';
  } else if (rawChannel.includes('web') || rawChannel.includes('webrtc') || rawChannel.includes('sip') || rawChannel.includes('voip')) {
    channel = 'web';
  } else {
    // Penentuan deterministik untuk data dummy/mock agar stabil
    const idStr = String(recordingId || call.id || 'rec-0');
    const charCode = idStr.charCodeAt(idStr.length - 1) || 0;
    channel = charCode % 2 === 0 ? 'web' : 'gsm';
  }

  return {
    id: recordingId,
    callId: item.callId || call.id || recordingId,
    recordingId,
    branchId: call.inmate?.branchId || item.branchId || call.branchId || '',
    branchName: call.inmate?.branch?.name || item.branchName || call.branchName || '-',
    inmateId: call.inmate?.identifier || item.inmateId || call.inmateId || item.inmateIdentifier || item.wbpRegNumber || '-',
    inmateName: call.inmate?.name || item.inmateName || call.inmateName || 'Narapidana',
    familyId: call.family?.id || item.familyId || call.familyId || '',
    familyName: call.family?.name || item.familyName || call.familyName || 'Keluarga',
    familyPhone: call.family?.phone || item.familyPhone || call.familyPhone || item.family?.email || '-',
    date: item.createdAt || call.connectedAt || call.date || item.date || new Date().toISOString(),
    durationSeconds: typeof call.durationSeconds === 'number' 
      ? call.durationSeconds 
      : (typeof item.durationSeconds === 'number' ? item.durationSeconds : (Number(item.duration) || 0)),
    cost: typeof item.cost === 'number' 
      ? item.cost 
      : (typeof call.cost === 'number' ? call.cost : (Number(item.amount ?? item.cost) || Math.round((call.durationSeconds || item.durationSeconds || 0) * 25))),
    status: normalizedStatus,
    rawStatus,
    callType,
    backendType,
    channel,
    hasRecording,
    recordingUrl,
    transcript,
    transcriptStatus,
  };
};

/**
 * Mengambil daftar rekaman & transkrip dari backend /api/recordings
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
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    let calls = dummyStore.getCalls({
      branchId: branchId || null,
      status: status || '',
      search: search || '',
    });

    if (callType && callType !== 'All' && callType !== 'all') {
      const isVideoReq = callType.toLowerCase().includes('video');
      calls = calls.filter((c) => isVideoReq ? c.callType === 'Video' : c.callType === 'Voice');
    }

    const total = calls.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = calls.slice(startIndex, startIndex + limit).map(mapCallItem);

    return {
      items: paginated,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    };
  }

  try {
    const res = await getRecordingsApi({
      search,
      page,
      limit,
      status: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status?.toUpperCase()) ? status : undefined,
      branchId,
      startDate,
      endDate,
    });

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.recordings)
            ? res.recordings
            : [];

    let mappedItems = rawList.map(mapCallItem).filter(Boolean);

    // Filter callType lokal jika diperlukan
    if (callType && callType !== 'All' && callType !== 'all') {
      const isVideoReq = callType.toLowerCase().includes('video');
      mappedItems = mappedItems.filter((c) => isVideoReq ? c.callType === 'Video' : c.callType === 'Voice');
    }

    // Filter status lokal (Answered/Missed) jika status filter bukan enum backend
    if (status && status !== 'All' && !['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status.toUpperCase())) {
      const normStat = status.toLowerCase();
      mappedItems = mappedItems.filter((c) => c.status.toLowerCase() === normStat);
    }

    const total = typeof res?.total === 'number'
      ? res.total
      : typeof res?.pagination?.total === 'number'
        ? res.pagination.total
        : mappedItems.length;

    const totalPages = typeof res?.totalPages === 'number'
      ? res.totalPages
      : typeof res?.pagination?.totalPages === 'number'
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(total / limit));

    return {
      items: mappedItems,
      total,
      page: Number(res?.page || res?.pagination?.page || page),
      limit: Number(res?.limit || res?.pagination?.limit || limit),
      totalPages,
    };
  } catch (error) {
    if (error?.status === 401) {
      logout();
    }
    console.error('[CallService] Gagal memuat data rekaman:', error?.message || error);
    throw error;
  }
};

/**
 * Mengambil detail rekaman dan transkrip lengkap berdasarkan ID
 */
export const getCallById = async (id) => {
  if (!id) throw new Error('ID Panggilan / Rekaman diperlukan');

  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    const item = dummyStore.getCallById(id);
    if (item) return mapCallItem(item);
    throw new Error('Data rekaman tidak ditemukan');
  }

  try {
    const res = await getRecordingByIdApi(id);
    const item = res?.data || res?.item || res?.recording || res;
    if (item) return mapCallItem(item);
    throw new Error('Data rekaman tidak ditemukan');
  } catch (error) {
    if (error?.status === 401) {
      logout();
    }
    console.error(`[CallService] Gagal fetch detail rekaman ${id}:`, error?.message || error);
    throw error;
  }
};

/**
 * Mengambil presigned streaming URL untuk pemutaran audio
 */
export const getAudioStreamUrl = async (recordingId) => {
  if (!recordingId) return null;

  if (isDummyMode()) {
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }

  try {
    const res = await getRecordingStreamUrlApi(recordingId);
    return res?.data?.streamUrl || res?.data?.directStreamUrl || null;
  } catch (err) {
    console.error('[CallService] Gagal mengambil streaming URL:', err?.message || err);
    return null;
  }
};

export default {
  RECORDINGS_ENDPOINT,
  RECORDING_DETAIL_ENDPOINT,
  CALL_HISTORY_ENDPOINT,
  CALL_DETAIL_ENDPOINT,
  mapCallItem,
  getCallHistory,
  getCallById,
  getAudioStreamUrl,
};

