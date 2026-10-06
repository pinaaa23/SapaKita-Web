import { apiFetch, logout } from '../api';
import { isDummyMode } from '../../dummy';

export const seedWartelAwal = () => {
  const now = Date.now();
  return [
    { id: 'wartel-01', nama: 'Wartel 01', status: 'digunakan', estimasiSelesai: now + 90 * 1000 },
    { id: 'wartel-02', nama: 'Wartel 02', status: 'tersedia', estimasiSelesai: null },
    { id: 'wartel-03', nama: 'Wartel 03', status: 'digunakan', estimasiSelesai: now + 480 * 1000 },
    { id: 'wartel-04', nama: 'Wartel 04', status: 'tersedia', estimasiSelesai: null },
    { id: 'wartel-05', nama: 'Wartel 05', status: 'digunakan', estimasiSelesai: now + 150 * 1000 },
    { id: 'wartel-06', nama: 'Wartel 06', status: 'digunakan', estimasiSelesai: now + 720 * 1000 },
    { id: 'wartel-07', nama: 'Wartel 07', status: 'tersedia', estimasiSelesai: null },
    { id: 'wartel-08', nama: 'Wartel 08', status: 'digunakan', estimasiSelesai: now + 300 * 1000 },
  ];
};

export function getStoredWartel() {
  return seedWartelAwal();
}

/**
 * Mengambil data status bilik wartel dari backend GET /api/wartel/status
 */
export async function getStatusWartel() {
  if (isDummyMode()) {
    const now = Date.now();
    const currentList = seedWartelAwal();
    return {
      waktuServer: now,
      cabang: { totalBilik: 8, bilikTersedia: 4, bilikDigunakan: 4 },
      daftar: currentList,
    };
  }

  try {
    const res = await apiFetch('/api/wartel/status');
    const data = res?.data || res;

    const waktuServer = Number(data?.waktuServer || Date.now());
    const cabang = data?.cabang || null;
    const rawDaftar = Array.isArray(data?.daftar) ? data.daftar : [];

    const mappedDaftar = rawDaftar.map((item) => ({
      id: item.id,
      nama: item.nama || item.name || `Wartel ${item.id}`,
      nomor: item.nama || item.id,
      status: item.status === 'digunakan' ? 'digunakan' : 'tersedia',
      estimasiSelesai: item.estimasiSelesai ? Number(item.estimasiSelesai) : null,
      detail: item.detail || null,
    }));

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
    console.error('[WartelService] Gagal memuat status wartel:', err?.message || err);
    throw err;
  }
}

/**
 * Menghitung ringkasan ketersediaan wartel
 */
export function hitungRingkasanWartel(list = [], cabang = null) {
  if (cabang && typeof cabang.totalBilik === 'number') {
    return {
      total: cabang.totalBilik,
      tersedia: cabang.bilikTersedia ?? (cabang.totalBilik - (cabang.bilikDigunakan || 0)),
      digunakan: cabang.bilikDigunakan ?? 0,
    };
  }

  const validList = Array.isArray(list) ? list : [];
  const total = validList.length;
  const digunakan = validList.filter((item) => item.status === 'digunakan').length;
  const tersedia = total - digunakan;

  return {
    total,
    tersedia,
    digunakan,
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
};
