import { apiFetch, logout } from '../api';
import { isDummyMode } from '../../dummy';

export const WARTEL_STORAGE_KEY = 'pascall_kantin_wartel_booths_v2';

export const DEFAULT_WARTEL_LIST = [
  { id: 'wartel-01', nomor: '01', nama: 'Wartel 01', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-02', nomor: '02', nama: 'Wartel 02', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-03', nomor: '03', nama: 'Wartel 03', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-04', nomor: '04', nama: 'Wartel 04', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-05', nomor: '05', nama: 'Wartel 05', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-06', nomor: '06', nama: 'Wartel 06', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-07', nomor: '07', nama: 'Wartel 07', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-08', nomor: '08', nama: 'Wartel 08', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-09', nomor: '09', nama: 'Wartel 09', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-10', nomor: '10', nama: 'Wartel 10', tipe: 'telepon', lokasi: 'Bilik Utama Lapas', status: 'tersedia', estimasiSelesai: null },
];

/**
 * Mengambil daftar konfigurasi bilik kustom kasir kantin dari LocalStorage
 */
export function getCustomBooths() {
  if (typeof window === 'undefined') return [...DEFAULT_WARTEL_LIST];
  try {
    const raw = localStorage.getItem(WARTEL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WARTEL_STORAGE_KEY, JSON.stringify(DEFAULT_WARTEL_LIST));
      return [...DEFAULT_WARTEL_LIST];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_WARTEL_LIST];
  } catch (e) {
    console.warn('[WartelService] Gagal membaca custom booths dari localStorage:', e);
    return [...DEFAULT_WARTEL_LIST];
  }
}

/**
 * Menyimpan konfigurasi bilik kustom ke LocalStorage dan mengirim event sinkronisasi
 */
export function saveCustomBooths(booths) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WARTEL_STORAGE_KEY, JSON.stringify(booths));
    window.dispatchEvent(new CustomEvent('pascall_wartel_booths_updated', { detail: booths }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('[WartelService] Gagal menyimpan custom booths:', e);
  }
}

/**
 * Menambahkan bilik wartel baru oleh kasir kantin
 */
export function addCustomBooth({ nomor, nama, tipe = 'telepon', lokasi = 'Bilik Lapas', status = 'tersedia' }) {
  const currentBooths = getCustomBooths();

  // Format nomor: jika angka 1 digit -> 01, jika 2 digit -> 11, jika teks -> pertahankan
  let cleanNomor = String(nomor || '').trim();
  if (/^\d+$/.test(cleanNomor)) {
    cleanNomor = cleanNomor.padStart(2, '0');
  } else if (!cleanNomor) {
    cleanNomor = String(currentBooths.length + 1).padStart(2, '0');
  }

  const cleanNama = (nama && nama.trim()) || `Wartel ${cleanNomor}`;
  const newId = `wartel-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 6)}`;

  const newBooth = {
    id: newId,
    nomor: cleanNomor,
    nama: cleanNama,
    tipe: tipe || 'telepon',
    lokasi: (lokasi && lokasi.trim()) || 'Bilik Lapas',
    status: status === 'perbaikan' ? 'perbaikan' : 'tersedia',
    estimasiSelesai: null,
    detail: null,
    createdAt: new Date().toISOString(),
  };

  const updatedBooths = [...currentBooths, newBooth];
  saveCustomBooths(updatedBooths);
  return newBooth;
}

/**
 * Memperbarui data bilik wartel tertentu
 */
export function updateCustomBooth(id, updates = {}) {
  const currentBooths = getCustomBooths();
  const index = currentBooths.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = currentBooths[index];
  let cleanNomor = updates.nomor !== undefined ? String(updates.nomor).trim() : current.nomor;
  if (/^\d+$/.test(cleanNomor)) {
    cleanNomor = cleanNomor.padStart(2, '0');
  }

  const updatedBooth = {
    ...current,
    ...updates,
    nomor: cleanNomor || current.nomor,
    nama: (updates.nama && updates.nama.trim()) || current.nama,
    lokasi: (updates.lokasi && updates.lokasi.trim()) || current.lokasi,
    tipe: updates.tipe || current.tipe || 'telepon',
    status: updates.status || current.status || 'tersedia',
  };

  currentBooths[index] = updatedBooth;
  saveCustomBooths(currentBooths);
  return updatedBooth;
}

/**
 * Menghapus bilik wartel tertentu oleh kasir kantin
 */
export function deleteCustomBooth(id) {
  const currentBooths = getCustomBooths();
  const filtered = currentBooths.filter((b) => b.id !== id);
  saveCustomBooths(filtered);
  return true;
}

/**
 * Mengembalikan konfigurasi bilik ke 10 bilik standar
 */
export function resetCustomBoothsToDefault() {
  saveCustomBooths(DEFAULT_WARTEL_LIST);
  return [...DEFAULT_WARTEL_LIST];
}

export function seedWartelAwal() {
  return getCustomBooths();
}

export function getStoredWartel() {
  return getCustomBooths();
}

/**
 * Mengambil data status bilik wartel:
 * Menggabungkan daftar bilik kustom kantin dengan status panggilan aktif dari Backend
 */
export async function getStatusWartel() {
  const configuredBooths = getCustomBooths();

  if (isDummyMode()) {
    const now = Date.now();
    return {
      waktuServer: now,
      cabang: hitungRingkasanWartel(configuredBooths),
      daftar: configuredBooths,
    };
  }

  try {
    const res = await apiFetch('/api/wartel/status');
    const data = res?.data || res;
    const waktuServer = Number(data?.waktuServer || Date.now());
    const rawBeDaftar = Array.isArray(data?.daftar) ? data.daftar : [];

    // Buat lookup map dari backend berdasarkan id, nama, atau nomor
    const beCallMap = new Map();
    rawBeDaftar.forEach((item) => {
      if (item.status === 'digunakan') {
        const keyId = item.id?.toString().toLowerCase();
        const keyNama = item.nama?.toString().toLowerCase();
        const keyNomor = item.nomor?.toString().toLowerCase();
        if (keyId) beCallMap.set(keyId, item);
        if (keyNama) beCallMap.set(keyNama, item);
        if (keyNomor) beCallMap.set(keyNomor, item);
      }
    });

    // Gabungkan konfigurasi bilik kasir dengan status panggilan aktif dari server
    const mappedDaftar = configuredBooths.map((booth) => {
      const matchId = booth.id?.toLowerCase();
      const matchNama = booth.nama?.toLowerCase();
      const matchNomor = booth.nomor?.toLowerCase();

      const activeCall =
        beCallMap.get(matchId) ||
        beCallMap.get(matchNama) ||
        beCallMap.get(matchNomor) ||
        beCallMap.get(`wartel ${matchNomor}`) ||
        null;

      if (activeCall) {
        return {
          ...booth,
          status: 'digunakan',
          estimasiSelesai: activeCall.estimasiSelesai ? Number(activeCall.estimasiSelesai) : null,
          detail: activeCall.detail || activeCall.inmate || null,
        };
      }

      // Jika sedang disetel 'perbaikan' oleh kantin, pertahankan status perbaikan
      if (booth.status === 'perbaikan') {
        return {
          ...booth,
          status: 'perbaikan',
          estimasiSelesai: null,
          detail: null,
        };
      }

      return {
        ...booth,
        status: 'tersedia',
        estimasiSelesai: null,
        detail: null,
      };
    });

    const summary = hitungRingkasanWartel(mappedDaftar);

    const cabang = {
      id: data?.cabang?.id || null,
      nama: data?.cabang?.nama || 'Cabang Lapas',
      totalBilik: summary.total,
      bilikDigunakan: summary.digunakan,
      bilikTersedia: summary.tersedia,
      bilikPerbaikan: summary.perbaikan,
    };

    return {
      waktuServer,
      cabang,
      daftar: mappedDaftar,
    };
  } catch (err) {
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.warn('[WartelService] Gagal memuat status wartel dari backend, menggunakan konfigurasi kustom kantin:', err?.message || err);
    const summary = hitungRingkasanWartel(configuredBooths);
    return {
      waktuServer: Date.now(),
      cabang: {
        totalBilik: summary.total,
        bilikTersedia: summary.tersedia,
        bilikDigunakan: summary.digunakan,
        bilikPerbaikan: summary.perbaikan,
      },
      daftar: configuredBooths,
    };
  }
}

/**
 * Menghitung ringkasan ketersediaan wartel secara dinamis
 */
export function hitungRingkasanWartel(list = [], cabang = null) {
  const validList = Array.isArray(list) ? list : [];
  const total = validList.length;
  const digunakan = validList.filter((item) => item.status === 'digunakan').length;
  const perbaikan = validList.filter((item) => item.status === 'perbaikan').length;
  const tersedia = Math.max(0, total - digunakan - perbaikan);

  return {
    total,
    tersedia,
    digunakan,
    perbaikan,
  };
}

/**
 * Refresh status wartel secara manual
 */
export async function refreshWartelStatus() {
  return await getStatusWartel();
}

export default {
  getStatusWartel,
  hitungRingkasanWartel,
  refreshWartelStatus,
  seedWartelAwal,
  getStoredWartel,
  getCustomBooths,
  saveCustomBooths,
  addCustomBooth,
  updateCustomBooth,
  deleteCustomBooth,
  resetCustomBoothsToDefault,
  DEFAULT_WARTEL_LIST,
  WARTEL_STORAGE_KEY,
};
