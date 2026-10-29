import { apiFetch, logout, getAuthToken, getRecordingsApi, getRecordingByIdApi, getRecordingStreamUrlApi, API_BASE_URL } from './api';
import { isDummyMode } from '../dummy';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const RECORDINGS_ENDPOINT = '/api/recordings';
export const RECORDING_DETAIL_ENDPOINT = (id) => `/api/recordings/${id}`;
export const CALL_HISTORY_ENDPOINT = '/api/recordings';
export const CALL_DETAIL_ENDPOINT = (id) => `/api/recordings/${id}`;

/**
 * Mapper fleksibel untuk menstandarisasi setiap item rekaman & transkrip panggilan
 */
export const mapCallItem = (item) => {
  if (!item) return null;

  // Mendukung struktur prisma Recording { id, callId, storageUrl, transcriptText, transcriptStatus, call: { ... } }
  // maupun response Call { id, status, durationSeconds, recording: { storageUrl, ... } }
  const call = item.call || item;
  const recordingObj = item.recording || call.recording || (item.storageUrl ? item : null);

  const recordingId = recordingObj?.id || item.recordingId || call.recordingId || item.id || call.id;
  const storageUrl = recordingObj?.storageUrl || item.storageUrl || call.storageUrl;
  const isDemo = isDummyMode();
  const sampleAudio = 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';

  const transcript = recordingObj?.transcriptText || item.transcriptText || item.transcript || call.transcriptText || call.transcript || '';
  const transcriptStatus = recordingObj?.transcriptStatus || item.transcriptStatus || call.transcriptStatus || (transcript ? 'COMPLETED' : null);

  const durationSec = typeof call.durationSeconds === 'number' 
    ? call.durationSeconds 
    : (typeof item.durationSeconds === 'number' ? item.durationSeconds : (Number(item.duration) || 0));

  let hasRecording = Boolean(
    storageUrl || 
    recordingObj?.storageUrl ||
    item.recordingUrl || 
    call.recordingUrl || 
    item.hasRecording || 
    call.hasRecording ||
    (isDemo && durationSec > 0)
  );

  const rawStatus = String(
    call.rawStatus ||
    call.status ||
    item.rawStatus ||
    item.status ||
    (call.connectedAt ? 'COMPLETED' : 'NO_ANSWER')
  ).toUpperCase();
  const endReason = String(call.endReason || item.endReason || '').toLowerCase();

  let normalizedStatus = 'Missed';
  let statusText = 'Tidak Terjawab';

  // 1. Panggilan DITOLAK (REJECTED / DITOLAK)
  if (
    rawStatus === 'REJECTED' ||
    rawStatus === 'DITOLAK' ||
    rawStatus.includes('REJECT') ||
    rawStatus.includes('TOLAK') ||
    endReason.includes('reject')
  ) {
    normalizedStatus = 'Rejected';
    statusText = 'Ditolak';
  }
  // 2. Panggilan TERJAWAB (ANSWERED / CONNECTED / ENDED / COMPLETED)
  else if (
    (rawStatus === 'ANSWERED' ||
      rawStatus === 'COMPLETED' ||
      rawStatus === 'CONNECTED' ||
      rawStatus === 'ENDED' ||
      rawStatus === 'TERJAWAB' ||
      Boolean(call.connectedAt) ||
      durationSec > 0) &&
    rawStatus !== 'MISSED' &&
    rawStatus !== 'FAILED'
  ) {
    normalizedStatus = 'Answered';
    statusText = 'Terjawab';
  }
  // 3. Panggilan SIBUK
  else if (rawStatus === 'BUSY' || rawStatus === 'SIBUK') {
    normalizedStatus = 'Busy';
    statusText = 'Sibuk';
  }
  // 4. Default: TIDAK TERJAWAB
  else {
    normalizedStatus = 'Missed';
    statusText = 'Tidak Terjawab';
  }

  // Jika memang ada objek rekaman atau storageUrl, hasRecording tetap TRUE agar bisa diputar
  if (storageUrl || recordingObj?.storageUrl || item.recordingUrl || call.recordingUrl) {
    hasRecording = true;
  }

  const rawType = (call.type || call.callType || item.callType || 'AUDIO').toUpperCase();
  const isVideo = rawType.includes('VIDEO');
  const callType = isVideo ? 'Video' : 'Voice';
  const backendType = isVideo ? 'VIDEO' : 'AUDIO';

  const token = getAuthToken();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';

  const recordingUrl = hasRecording
    ? (storageUrl 
        ? (storageUrl.startsWith('http') ? storageUrl : `${API_BASE_URL}/api/recordings/${recordingId}/stream${tokenQuery}`)
        : (item.recordingUrl || call.recordingUrl || `${API_BASE_URL}/api/recordings/${recordingId}/stream${tokenQuery}`))
    : '';

  // Jalur panggilan (Web / GSM)
  const rawChannel = String(
    call.channel ||
    call.via ||
    call.source ||
    item.channel ||
    item.via ||
    item.source ||
    call.routeType ||
    call.route ||
    item.routeType ||
    item.route ||
    ''
  ).toLowerCase();

  let channel = 'web';
  if (
    rawChannel.includes('gsm') ||
    rawChannel.includes('sip_trunk') ||
    rawChannel.includes('cellular') ||
    rawChannel.includes('phone') ||
    rawChannel.includes('pstn') ||
    rawChannel.includes('seluler')
  ) {
    channel = 'gsm';
  } else if (
    rawChannel.includes('web') ||
    rawChannel.includes('livekit') ||
    rawChannel.includes('webrtc') ||
    rawChannel.includes('voip')
  ) {
    channel = 'web';
  } else {
    // Penentuan deterministik untuk data dummy/mock agar stabil
    const idStr = String(recordingId || call.id || 'rec-0');
    const charCode = idStr.charCodeAt(idStr.length - 1) || 0;
    channel = charCode % 2 === 0 ? 'web' : 'gsm';
  }

  const branchObj = item.branch || call.branch || call.inmate?.branch || null;
  const resolvedBranchId = branchObj?.id || call.inmate?.branchId || item.branchId || call.branchId || '';
  const resolvedBranchName = branchObj?.name || call.inmate?.branch?.name || item.branchName || call.branchName || '-';

  const resolvedPhone = item.targetPhone || item.destinationPhone || item.familyPhone || item.call?.family?.phone || '-';

  return {
    id: recordingId,
    callId: item.callId || call.id || recordingId,
    recordingId,
    branch: branchObj,
    branchId: resolvedBranchId,
    branchName: resolvedBranchName,
    inmateId: call.inmate?.identifier || item.inmateId || call.inmateId || item.inmateIdentifier || item.wbpRegNumber || '-',
    inmateName: call.inmate?.name || item.inmateName || call.inmateName || 'Narapidana',
    familyId: call.family?.id || item.familyId || call.familyId || '',
    familyName: call.family?.name || item.familyName || call.familyName || 'Keluarga',
    familyPhone: resolvedPhone,
    destinationPhone: resolvedPhone,
    targetPhone: resolvedPhone,
    targetNumber: resolvedPhone,
    date: item.createdAt || call.connectedAt || call.date || item.date || new Date().toISOString(),
    durationSeconds: typeof call.durationSeconds === 'number' 
      ? call.durationSeconds 
      : (typeof item.durationSeconds === 'number' ? item.durationSeconds : (Number(item.duration) || 0)),
    cost: (() => {
      const durationSec = typeof call.durationSeconds === 'number' 
        ? call.durationSeconds 
        : (typeof item.durationSeconds === 'number' ? item.durationSeconds : (Number(item.duration) || 0));
      const ratePerSec = Number(call.ratePerSecond || item.ratePerSecond || call.inmate?.branch?.contractRatePerSecond || item.branch?.contractRatePerSecond || 15);
      const rawCost = (typeof item.totalCost === 'number' && item.totalCost > 0)
        ? item.totalCost
        : ((typeof call.totalCost === 'number' && call.totalCost > 0)
          ? call.totalCost
          : ((typeof item.cost === 'number' && item.cost > 0)
            ? item.cost
            : ((typeof call.cost === 'number' && call.cost > 0)
              ? call.cost
              : null)));
      return rawCost !== null ? rawCost : (durationSec > 0 ? Math.round(durationSec * ratePerSec) : 0);
    })(),
    status: normalizedStatus,
    statusText,
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
 * Mengambil daftar rekaman panggilan khusus Kanwil
 * Endpoint: GET /api/kanwil/calls (Role: KANWIL_ADMIN, SUPERADMIN)
 */
export const getKanwilCalls = async ({
  search = '',
  page = 1,
  limit = 20,
  status = '',
  branchId = '',
  callType = '',
  startDate = '',
  endDate = '',
  channel = '',
} = {}) => {
  const query = new URLSearchParams();
  if (search && search.trim()) query.append('search', search.trim());
  if (page) query.append('page', String(page));
  if (limit) query.append('limit', String(limit));
  if (branchId && branchId !== 'All' && branchId !== 'semua') query.append('branchId', branchId);
  if (status && status !== 'All' && status !== 'semua') query.append('status', status);
  if (channel && channel !== 'All' && channel !== 'all' && channel !== 'semua') query.append('channel', channel.toLowerCase());
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  try {
    const res = await apiFetch(`/api/kanwil/calls?${query.toString()}`);
    let rawList = res?.data || res?.items || (Array.isArray(res) ? res : []);
    if (!Array.isArray(rawList)) rawList = [];

    const items = rawList.map(mapCallItem);
    return {
      items,
      total: res?.pagination?.total ?? res?.total ?? items.length,
      page: res?.pagination?.page ?? Number(page) ?? 1,
      limit: res?.pagination?.limit ?? Number(limit) ?? 20,
      totalPages: res?.pagination?.totalPages ?? Math.max(1, Math.ceil(items.length / (Number(limit) || 20))),
    };
  } catch (err) {
    console.warn('[callService] Gagal memuat /api/kanwil/calls, fallback ke /api/recordings:', err?.message || err);
    return getCallHistory({
      search,
      page,
      limit,
      status,
      branchId,
      callType,
      channel,
      startDate,
      endDate,
    });
  }
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
  channel = '',
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

    if (channel && channel !== 'All' && channel !== 'all') {
      calls = calls.filter((c) => (c.channel || 'web').toLowerCase() === channel.toLowerCase());
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
    const query = new URLSearchParams();
    if (page) query.append('page', String(page));
    if (limit) query.append('limit', String(limit));
    if (search) query.append('search', search);
    if (branchId && branchId !== 'All' && branchId !== 'all') query.append('branchId', branchId);
    if (status && status !== 'All' && status !== 'all') {
      const s = String(status).toUpperCase();
      if (s === 'REJECTED' || s === 'DITOLAK') query.append('status', 'REJECTED');
      else if (s === 'MISSED' || s === 'TIDAK TERJAWAB') query.append('status', 'MISSED');
      else if (s === 'ANSWERED' || s === 'TERJAWAB') query.append('status', 'ENDED');
      else query.append('status', status);
    }
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (callType && callType !== 'All' && callType !== 'all') query.append('callType', callType);
    if (channel && channel !== 'All' && channel !== 'all') query.append('channel', channel.toLowerCase());

    const callsRes = await apiFetch(`/api/calls?${query.toString()}`).catch(() => null);
    if (callsRes && (Array.isArray(callsRes.data) || Array.isArray(callsRes.items))) {
      const rawList = Array.isArray(callsRes.data) ? callsRes.data : callsRes.items;
      let mappedItems = rawList.map(mapCallItem).filter(Boolean);

      const total = typeof callsRes.pagination?.total === 'number'
        ? callsRes.pagination.total
        : mappedItems.length;

      const totalPages = typeof callsRes.pagination?.totalPages === 'number'
        ? callsRes.pagination.totalPages
        : Math.max(1, Math.ceil(total / limit));

      return {
        items: mappedItems,
        total,
        page: Number(callsRes.pagination?.page || page),
        limit: Number(callsRes.pagination?.limit || limit),
        totalPages,
      };
    }

    const res = await getRecordingsApi({
      search,
      page,
      limit,
      status: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status?.toUpperCase()) ? status : undefined,
      branchId,
      startDate,
      endDate,
      channel,
      callType,
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

  const token = getAuthToken();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  const directProxyUrl = `${API_BASE_URL}/api/recordings/${recordingId}/stream${tokenQuery}`;

  try {
    const res = await getRecordingStreamUrlApi(recordingId);
    if (res?.data?.directStreamUrl) {
      const full = res.data.directStreamUrl.startsWith('http')
        ? res.data.directStreamUrl
        : `${API_BASE_URL}${res.data.directStreamUrl}`;
      return full.includes('token=') || !token ? full : `${full}${full.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    }
    if (res?.data?.streamUrl && !res.data.streamUrl.includes('localhost:9000')) {
      return res.data.streamUrl;
    }
    return directProxyUrl;
  } catch (err) {
    console.warn('[CallService] Stream URL API fallback ke direct proxy:', err?.message || err);
    return directProxyUrl;
  }
};

/**
 * Mengambil ringkasan kanal panggilan (Web vs GSM)
 * Endpoint: GET /api/calls/channel-summary (Superadmin, Kanwil, Branch Admin, Supervisor)
 */
export const getCallChannelSummary = async ({
  search = '',
  branchId = '',
  status = '',
  type = '',
  callType = '',
  startDate = '',
  endDate = '',
} = {}) => {
  if (isDummyMode()) {
    return {
      totalWebSeconds: 0,
      totalGsmSeconds: 0,
      totalWebCalls: 0,
      totalGsmCalls: 0,
      percentageWeb: 0,
      percentageGsm: 0,
      totalCalls: 0,
      totalSeconds: 0,
    };
  }

  const query = new URLSearchParams();
  if (search && search.trim()) query.append('search', search.trim());
  if (branchId && branchId !== 'All' && branchId !== 'all') query.append('branchId', branchId);

  if (status && status !== 'All' && status !== 'all') {
    const s = String(status).toUpperCase();
    if (s === 'REJECTED' || s === 'DITOLAK') query.append('status', 'REJECTED');
    else if (s === 'MISSED' || s === 'TIDAK TERJAWAB') query.append('status', 'MISSED');
    else if (s === 'ANSWERED' || s === 'TERJAWAB') query.append('status', 'ENDED');
    else query.append('status', status);
  }

  const resolvedType = callType || type;
  if (resolvedType && resolvedType !== 'All' && resolvedType !== 'all') {
    query.append('type', resolvedType);
  }

  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  const qs = query.toString();
  const url = qs ? `/api/calls/channel-summary?${qs}` : '/api/calls/channel-summary';
  const res = await apiFetch(url);
  return res?.data || res;
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
  getCallChannelSummary,
};


