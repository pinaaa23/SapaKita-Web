import { apiFetch, logout } from '../api';
import { isDummyMode } from '../../dummy';

export const MAX_WARTEL_COUNT = 10;

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
    { id: 'wartel-09', nama: 'Wartel 09', status: 'tersedia', estimasiSelesai: null },
    { id: 'wartel-10', nama: 'Wartel 10', status: 'tersedia', estimasiSelesai: null },
  ];
};

export function getStoredWartel() {
  return seedWartelAwal();
}

/**
 * Mengambil data status bilik wartel dari backend GET /api/wartel/status
 * Dibatasi maksimal 10 bilik sesuai kapasitas fisik bilik telepon.
 */
export async function getStatusWartel() {
  if (isDummyMode()) {
    const now = Date.now();
    const currentList = seedWartelAwal();
    return {
      waktuServer: now,
      cabang: { totalBilik: MAX_WARTEL_COUNT, bilikTersedia: 5, bilikDigunakan: 5 },
      daftar: currentList,
    };
  }

  try {
    const res = await apiFetch('/api/wartel/status');
    const data = res?.data || res;

    const waktuServer = Number(data?.waktuServer || Date.now());
    const rawDaftar = (Array.isArray(data?.daftar) ? data.daftar : []).slice(0, MAX_WARTEL_COUNT);

    const mappedDaftar = rawDaftar.map((item) => ({
      id: item.id,
      nama: item.nama || item.name || `Wartel ${item.id}`,
      nomor: item.nama || item.id,
      status: item.status === 'digunakan' ? 'digunakan' : 'tersedia',
      estimasiSelesai: item.estimasiSelesai ? Number(item.estimasiSelesai) : null,
      detail: item.detail || null,
    }));

    const digunakanCount = mappedDaftar.filter((item) => item.status === 'digunakan').length;
    const totalBilik = Math.min(Number(data?.cabang?.totalBilik) || MAX_WARTEL_COUNT, MAX_WARTEL_COUNT);
    const tersediaCount = Math.max(0, totalBilik - digunakanCount);

    const cabang = {
      id: data?.cabang?.id || null,
      nama: data?.cabang?.nama || 'Cabang Lapas',
      totalBilik,
      bilikDigunakan: digunakanCount,
      bilikTersedia: tersediaCount,
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
    console.error('[WartelService] Gagal memuat status wartel:', err?.message || err);
    throw err;
  }
}

/**
 * Menghitung ringkasan ketersediaan wartel
 */
export function hitungRingkasanWartel(list = [], cabang = null) {
  if (cabang && typeof cabang.totalBilik === 'number') {
    const total = Math.min(cabang.totalBilik, MAX_WARTEL_COUNT);
    const digunakan = Math.min(cabang.bilikDigunakan || 0, total);
    return {
      total,
      tersedia: Math.max(0, total - digunakan),
      digunakan,
    };
  }

  const validList = (Array.isArray(list) ? list : []).slice(0, MAX_WARTEL_COUNT);
  const total = validList.length || MAX_WARTEL_COUNT;
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
