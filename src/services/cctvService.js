import { apiFetch, API_BASE_URL } from './api';

const CCTV_ENDPOINT = '/api/cctv';
const CCTV_LOCAL_STORAGE_KEY = 'pascall_cctv_slots_v1';

// Sample streaming URLs for quick preview / demo testing
export const SAMPLE_CCTV_STREAMS = [
  {
    name: 'CCTV 01 - Portir & Pintu Utama',
    location: 'Gerbang Utama Lapas',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    name: 'CCTV 02 - Ruang Kunjungan WBP',
    location: 'Aula Kunjungan Lt 1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    name: 'CCTV 03 - Koridor Blok Hunian A',
    location: 'Blok A Koridor Tengah',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    name: 'CCTV 04 - Area Wartel & Kantin',
    location: 'Wartelsus & Ruang Kasir',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
];

const getDefaultSlots = () => [
  {
    id: 'slot-1',
    channel: 1,
    name: 'CCTV 01 - Portir & Pintu Utama',
    location: 'Gerbang Utama Lapas',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ACTIVE',
    isRecording: true,
    notes: 'Pemantauan area keluar masuk portir lapas',
  },
  {
    id: 'slot-2',
    channel: 2,
    name: 'CCTV 02 - Ruang Kunjungan WBP',
    location: 'Aula Kunjungan Lt 1',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    status: 'ACTIVE',
    isRecording: true,
    notes: 'Monitoring aktivitas tatap muka keluarga & WBP',
  },
  {
    id: 'slot-3',
    channel: 3,
    name: 'CCTV 03 - Koridor Blok Hunian A',
    location: 'Blok A Koridor Tengah',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    status: 'ACTIVE',
    isRecording: true,
    notes: 'Pemantauan lorong sel kamar warga binaan',
  },
  {
    id: 'slot-4',
    channel: 4,
    name: 'CCTV 04 - Area Wartel & Kantin',
    location: 'Wartelsus & Ruang Kasir',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    status: 'ACTIVE',
    isRecording: true,
    notes: 'Monitoring bilik telepon wartel & transaksi kantin',
  },
];

const getStoredSlots = () => {
  try {
    const raw = localStorage.getItem(CCTV_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[cctvService] Error reading localStorage:', e);
  }
  return getDefaultSlots();
};

const persistSlots = (slots) => {
  try {
    localStorage.setItem(CCTV_LOCAL_STORAGE_KEY, JSON.stringify(slots));
  } catch (e) {
    console.warn('[cctvService] Error writing localStorage:', e);
  }
};

export const cctvService = {
  /**
   * Mengambil daftar 4 slot CCTV UPT
   */
  async getCctvList(branchId) {
    try {
      const endpoint = branchId ? `${CCTV_ENDPOINT}?branchId=${branchId}` : CCTV_ENDPOINT;
      const res = await apiFetch(endpoint);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Simpan ke local cache untuk fallback offline
        persistSlots(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('[cctvService] API getCctvList error, fallback to cached slots:', err.message);
    }
    return getStoredSlots();
  },

  /**
   * Menyimpan / memperbarui 1 slot CCTV (Khusus Kepala UPT)
   */
  async saveCctvSlot(slotData) {
    try {
      const res = await apiFetch(CCTV_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(slotData),
      });
      if (res && res.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[cctvService] API saveCctvSlot error, fallback to local storage:', err.message);
    }

    // Local storage fallback
    const current = getStoredSlots();
    const existingIndex = current.findIndex((s) => s.channel === slotData.channel);
    const updatedSlot = {
      id: slotData.id || `slot-${slotData.channel}`,
      channel: slotData.channel,
      name: slotData.name,
      location: slotData.location || '',
      streamUrl: slotData.streamUrl,
      status: slotData.status || 'ACTIVE',
      isRecording: slotData.isRecording ?? true,
      notes: slotData.notes || '',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...updatedSlot };
    } else {
      current.push(updatedSlot);
    }
    persistSlots(current);
    return updatedSlot;
  },

  /**
   * Menyimpan ke-4 slot CCTV sekaligus (Khusus Kepala UPT)
   */
  async saveBulkCctv(slots) {
    try {
      const res = await apiFetch(`${CCTV_ENDPOINT}/bulk`, {
        method: 'POST',
        body: JSON.stringify({ slots }),
      });
      if (res && res.success) {
        persistSlots(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('[cctvService] API saveBulkCctv error, fallback to local storage:', err.message);
    }

    persistSlots(slots);
    return slots;
  },

  /**
   * Menghapus / mereset slot CCTV (Khusus Kepala UPT)
   */
  async deleteCctv(id) {
    try {
      await apiFetch(`${CCTV_ENDPOINT}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[cctvService] API deleteCctv error, fallback to local storage:', err.message);
    }

    const current = getStoredSlots();
    const updated = current.map((s) =>
      s.id === id || String(s.channel) === String(id)
        ? { ...s, streamUrl: '', status: 'INACTIVE', isRecording: false }
        : s
    );
    persistSlots(updated);
    return { success: true };
  },

  /**
   * Mengambil rekaman histori CCTV dari storage recording (Playback / Waktu Kebelakang)
   */
  async getCctvRecordings({ cctvId, channel, date, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (cctvId) params.append('cctvId', cctvId);
    if (channel) params.append('channel', channel);
    if (date) params.append('date', date);
    params.append('page', page);
    params.append('limit', limit);

    try {
      const res = await apiFetch(`${CCTV_ENDPOINT}/recordings?${params.toString()}`);
      if (res && res.success) {
        return res;
      }
    } catch (err) {
      console.warn('[cctvService] API getCctvRecordings error, fallback to synthetic data:', err.message);
    }

    // Generate local clips based on slots for the date
    const slots = getStoredSlots();
    const activeSlots = channel ? slots.filter((s) => s.channel === Number(channel)) : slots;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const clips = [];
    activeSlots.forEach((slot) => {
      const hours = [8, 10, 12, 14, 16];
      hours.forEach((h) => {
        const sTime = `${targetDate}T${String(h).padStart(2, '0')}:00:00.000Z`;
        const eTime = `${targetDate}T${String(h).padStart(2, '0')}:59:59.000Z`;
        clips.push({
          id: `rec-${slot.channel}-${h}`,
          cctvId: slot.id,
          channel: slot.channel,
          title: `Rekaman ${slot.name} (${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00)`,
          startTime: sTime,
          endTime: eTime,
          durationSec: 3600,
          storageKey: `cctv-recordings/storage/${slot.id}/${targetDate}-${h}.mp4`,
          fileSize: 450 * 1024 * 1024,
          status: 'READY',
          streamUrl: slot.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          cctv: {
            id: slot.id,
            channel: slot.channel,
            name: slot.name,
            location: slot.location,
          },
        });
      });
    });

    return {
      success: true,
      total: clips.length,
      page: 1,
      limit,
      totalPages: 1,
      data: clips,
    };
  },

  /**
   * Menghasilkan URL playback rekaman CCTV
   */
  async getPlaybackStreamUrl(recordingId) {
    try {
      const res = await apiFetch(`${CCTV_ENDPOINT}/recordings/${recordingId}/stream-url`);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[cctvService] API getPlaybackStreamUrl error:', err.message);
    }
    return {
      recordingId,
      streamUrl: `${API_BASE_URL}${CCTV_ENDPOINT}/recordings/${recordingId}/stream`,
    };
  },
};

export default cctvService;
