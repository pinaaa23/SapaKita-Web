import { apiFetch, logout } from '../api';
import { isDummyMode } from '../../dummy';

export const WARTEL_STORAGE_KEY = 'pascall_kantin_wartel_booths_v2';

export const DEFAULT_WARTEL_LIST = [
  { id: 'wartel-01', nomor: '01', nama: 'Wartel 01', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-02', nomor: '02', nama: 'Wartel 02', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-03', nomor: '03', nama: 'Wartel 03', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-04', nomor: '04', nama: 'Wartel 04', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-05', nomor: '05', nama: 'Wartel 05', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-06', nomor: '06', nama: 'Wartel 06', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-07', nomor: '07', nama: 'Wartel 07', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-08', nomor: '08', nama: 'Wartel 08', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-09', nomor: '09', nama: 'Wartel 09', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
  { id: 'wartel-10', nomor: '10', nama: 'Wartel 10', tipe: 'telepon', lokasi: 'Bilik Utama Wartel', status: 'tersedia', estimasiSelesai: null },
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
  } catch (e) {
    console.error('[WartelService] Gagal menyimpan custom booths:', e);
  }
}

/**
 * Menambahkan bilik wartel baru oleh kasir kantin (tersinkron ke backend API)
 */
export async function addCustomBooth({ nomor, nama, tipe = 'telepon', lokasi = 'Bilik Wartel', status = 'tersedia' }) {
  const currentBooths = getCustomBooths();

  // Format nomor: jika angka 1 digit -> 01, jika 2 digit -> 11, jika teks -> pertahankan
  let cleanNomor = String(nomor || '').trim();
  if (/^\d+$/.test(cleanNomor)) {
    cleanNomor = cleanNomor.padStart(2, '0');
  } else if (!cleanNomor) {
    cleanNomor = String(currentBooths.length + 1).padStart(2, '0');
  }

  const cleanNama = (nama && nama.trim()) || `Wartel ${cleanNomor}`;
  const cleanLokasi = (lokasi && lokasi.trim()) || 'Bilik Wartel';

  // 1. Simpan ke Backend API: POST /api/wartel/booths
  try {
    const res = await apiFetch('/api/wartel/booths', {
      method: 'POST',
      body: JSON.stringify({
        name: cleanNama,
        boothNumber: cleanNomor,
        location: cleanLokasi,
      }),
    });

    const created = res?.data || res;
    if (created && created.id) {
      const newBooth = {
        id: created.id,
        nomor: created.boothNumber || cleanNomor,
        nama: created.name || cleanNama,
        tipe: tipe || 'telepon',
        lokasi: created.location || cleanLokasi,
        status: created.status || status,
        estimasiSelesai: null,
        detail: null,
        createdAt: created.createdAt || new Date().toISOString(),
      };
      const updatedBooths = [...currentBooths.filter(b => b.id !== newBooth.id), newBooth];
      saveCustomBooths(updatedBooths);
      return newBooth;
    }
  } catch (err) {
    console.warn('[WartelService] Gagal menambahkan bilik ke backend, fallback simpan lokal:', err?.message || err);
  }

  // Fallback offline
  const newId = `wartel-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 6)}`;
  const newBooth = {
    id: newId,
    nomor: cleanNomor,
    nama: cleanNama,
    tipe: tipe || 'telepon',
    lokasi: cleanLokasi,
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
 * Memperbarui data bilik wartel tertentu (tersinkron ke backend API)
 */
export async function updateCustomBooth(id, updates = {}) {
  const currentBooths = getCustomBooths();
  const index = currentBooths.findIndex((b) => b.id === id);

  let cleanNomor = updates.nomor !== undefined ? String(updates.nomor).trim() : undefined;
  if (cleanNomor && /^\d+$/.test(cleanNomor)) {
    cleanNomor = cleanNomor.padStart(2, '0');
  }

  const cleanNama = updates.nama ? updates.nama.trim() : undefined;
  const cleanLokasi = updates.lokasi ? updates.lokasi.trim() : undefined;

  // 1. Simpan ke Backend API: PATCH /api/wartel/booths/:id
  try {
    const res = await apiFetch(`/api/wartel/booths/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: cleanNama,
        boothNumber: cleanNomor,
        location: cleanLokasi,
        status: updates.status,
      }),
    });

    const updated = res?.data || res;
    if (updated && updated.id) {
      const boothResult = {
        id: updated.id,
        nomor: updated.boothNumber || cleanNomor || (index !== -1 ? currentBooths[index].nomor : '01'),
        nama: updated.name || cleanNama || (index !== -1 ? currentBooths[index].nama : `Wartel ${cleanNomor}`),
        tipe: updates.tipe || (index !== -1 ? currentBooths[index].tipe : 'telepon'),
        lokasi: updated.location || cleanLokasi || (index !== -1 ? currentBooths[index].lokasi : 'Bilik Wartel'),
        status: updated.status || updates.status || 'tersedia',
      };

      if (index !== -1) {
        currentBooths[index] = { ...currentBooths[index], ...boothResult };
      }
      saveCustomBooths(currentBooths);
      return boothResult;
    }
  } catch (err) {
    console.warn('[WartelService] Gagal memperbarui bilik di backend, fallback update lokal:', err?.message || err);
  }

  // Fallback offline
  if (index === -1) return null;
  const current = currentBooths[index];
  const updatedBooth = {
    ...current,
    ...updates,
    nomor: cleanNomor || current.nomor,
    nama: cleanNama || current.nama,
    lokasi: cleanLokasi || current.lokasi,
    tipe: updates.tipe || current.tipe || 'telepon',
    status: updates.status || current.status || 'tersedia',
  };

  currentBooths[index] = updatedBooth;
  saveCustomBooths(currentBooths);
  return updatedBooth;
}

/**
 * Menghapus bilik wartel tertentu oleh kasir kantin (tersinkron ke backend API)
 */
export async function deleteCustomBooth(id) {
  // 1. Hapus di Backend API: DELETE /api/wartel/booths/:id
  try {
    await apiFetch(`/api/wartel/booths/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[WartelService] Gagal menghapus bilik di backend, fallback hapus lokal:', err?.message || err);
  }

  // Hapus dari cache lokal
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
 * Menggabungkan daftar bilik dari Backend API dengan status panggilan aktif real-time
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

    // Jika di database backend sudah ada daftar bilik fisik terdaftar, gunakan data database backend
    if (rawBeDaftar.length > 0) {
      const mapped = rawBeDaftar.map((item) => ({
        id: item.id,
        nomor: item.nomor || item.boothNumber || '01',
        nama: item.nama || item.name || `Wartel ${item.nomor || item.boothNumber || '01'}`,
        tipe: item.tipe || 'telepon',
        lokasi: item.lokasi || item.location || 'Bilik Wartel',
        status: item.status || 'tersedia',
        estimasiSelesai: item.estimasiSelesai ? Number(item.estimasiSelesai) : null,
        detail: item.detail || null,
      }));

      const summary = hitungRingkasanWartel(mapped, data.cabang);
      try {
        localStorage.setItem(WARTEL_STORAGE_KEY, JSON.stringify(mapped));
      } catch (e) {
        // Abaikan error cache lokal
      }

      return {
        waktuServer,
        cabang: {
          id: data?.cabang?.id || null,
          nama: data?.cabang?.nama || 'Cabang UPT',
          totalBilik: summary.total,
          bilikDigunakan: summary.digunakan,
          bilikTersedia: summary.tersedia,
          bilikPerbaikan: summary.perbaikan,
        },
        daftar: mapped,
      };
    }

    // Jika di backend masih 0 bilik (UPT baru), gunakan konfigurasi default lokal
    const summary = hitungRingkasanWartel(configuredBooths);
    return {
      waktuServer,
      cabang: {
        id: data?.cabang?.id || null,
        nama: data?.cabang?.nama || 'Cabang UPT',
        totalBilik: summary.total,
        bilikDigunakan: summary.digunakan,
        bilikTersedia: summary.tersedia,
        bilikPerbaikan: summary.perbaikan,
      },
      daftar: configuredBooths,
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
  const perbaikan = validList.filter((item) => item.status === 'perbaikan' || item.status === 'rusak').length;
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
