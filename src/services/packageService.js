import { apiFetch, logout } from './api';

export const PACKAGES_ENDPOINT = '/api/packages';
export const PACKAGE_DETAIL_ENDPOINT = (id) => `/api/packages/${id}`;

const STORAGE_KEY = 'pascall_upt_packages_v6';

/**
 * Konfigurasi Tarif PasCall
 * Tarif per detik: Telepon = Rp15/detik, Video Call = Rp25/detik
 * PPN = 11%
 */
export const TARIFF = {
  ratesPerSecond: {
    telepon: 15,
    video: 25,
  },
  ppnRate: 0.11,
  presets: [15, 30, 50, 60, 100],
};

export function calcPrice(type, minutes) {
  const typeKey = (type || 'telepon').toLowerCase();
  const rateKey = typeKey.includes('video') ? 'video' : 'telepon';
  const rate = TARIFF.ratesPerSecond[rateKey] || (typeKey.includes('video') ? 25 : 15);

  const dpp = Math.round(Number(minutes) * 60 * rate);
  const ppn = Math.round(dpp * TARIFF.ppnRate);
  const total = dpp + ppn;

  return { dpp, ppn, total };
}

/**
 * Data paket komunikasi PasCall (Tersedia untuk Kepala UPT & Supervisor)
 */
export const defaultPackages = [
  // 1. Paket Telepon 50 Menit (Rp25.000)
  {
    id: 'pkt-telp-50',
    nama: 'Paket Telepon 50 Menit',
    kategori: 'telepon',
    durasi: 50,
    harga: 25000,
    status: 'Aktif',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  // 2. Paket Telepon 100 Menit (Rp50.000)
  {
    id: 'pkt-telp-100',
    nama: 'Paket Telepon 100 Menit',
    kategori: 'telepon',
    durasi: 100,
    harga: 50000,
    status: 'Aktif',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  // 3. Paket Video Call 30 Menit (Rp30.000)
  {
    id: 'pkt-video-30',
    nama: 'Paket Video Call 30 Menit',
    kategori: 'video',
    durasi: 30,
    harga: 30000,
    status: 'Aktif',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  // 4. Paket Video Call 60 Menit (Rp60.000)
  {
    id: 'pkt-video-60',
    nama: 'Paket Video Call 60 Menit',
    kategori: 'video',
    durasi: 60,
    harga: 60000,
    status: 'Aktif',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  // 5. Paket Telepon 15 Menit (Rp10.000)
  {
    id: 'pkt-telp-15',
    nama: 'Paket Telepon 15 Menit',
    kategori: 'telepon',
    durasi: 15,
    harga: 10000,
    status: 'Aktif',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  // 6. Paket Video Call 15 Menit (Rp18.000)
  {
    id: 'pkt-video-15',
    nama: 'Paket Video Call 15 Menit',
    kategori: 'video',
    durasi: 15,
    harga: 18000,
    status: 'Aktif',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
];

const getStoredPackages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPackages));
      return defaultPackages;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultPackages;
  } catch (err) {
    console.error('Error membaca storage paket:', err);
    return defaultPackages;
  }
};

const saveStoredPackages = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error menyimpan storage paket:', err);
  }
};

/**
 * Mengambil daftar paket komunikasi dengan filter kategori, status, dan pencarian
 */
export const getPackages = async ({
  search = '',
  kategori = 'semua',
  status = 'semua',
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (kategori && kategori !== 'semua') params.append('kategori', kategori);
    if (status && status !== 'semua') params.append('status', status);

    const queryString = params.toString();
    const url = queryString ? `${PACKAGES_ENDPOINT}?${queryString}` : PACKAGES_ENDPOINT;

    // Coba request ke backend terlebih dahulu
    try {
      const res = await apiFetch(url);
      if (res && (Array.isArray(res) || Array.isArray(res?.data))) {
        return Array.isArray(res) ? res : res.data;
      }
    } catch {
      // Fallback ke localStorage mock
    }

    let list = getStoredPackages();

    if (kategori && kategori !== 'semua') {
      list = list.filter((p) => (p.kategori || '').toLowerCase() === kategori.toLowerCase());
    }

    if (status && status !== 'semua') {
      list = list.filter((p) => (p.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.nama || '').toLowerCase().includes(q) ||
          String(p.durasi).includes(q) ||
          String(p.harga).includes(q)
      );
    }

    return list;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    return getStoredPackages();
  }
};

/**
 * Membuat paket baru
 */
export const createPackage = async (data) => {
  const newPackage = {
    id: `pkt-${Date.now()}`,
    nama: data.nama.trim(),
    kategori: data.kategori || 'telepon',
    durasi: Number(data.durasi),
    harga: Number(data.harga),
    status: data.status || 'Aktif',
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await apiFetch(PACKAGES_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(newPackage),
    });
    const current = getStoredPackages();
    saveStoredPackages([res || newPackage, ...current]);
    return res || newPackage;
  } catch {
    const current = getStoredPackages();
    const updated = [newPackage, ...current];
    saveStoredPackages(updated);
    return newPackage;
  }
};

/**
 * Memperbarui paket yang ada
 */
export const updatePackage = async (id, data) => {
  try {
    const res = await apiFetch(PACKAGE_DETAIL_ENDPOINT(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const current = getStoredPackages();
    const updated = current.map((item) =>
      item.id === id ? { ...item, ...data, id } : item
    );
    saveStoredPackages(updated);
    return res || updated.find((i) => i.id === id);
  } catch {
    const current = getStoredPackages();
    const updated = current.map((item) =>
      item.id === id ? { ...item, ...data, id } : item
    );
    saveStoredPackages(updated);
    return updated.find((i) => i.id === id);
  }
};

/**
 * Mengubah status paket (Aktif / Nonaktif)
 */
export const togglePackageStatus = async (id) => {
  const current = getStoredPackages();
  const target = current.find((i) => i.id === id);
  if (!target) throw new Error('Paket tidak ditemukan');

  const newStatus = target.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  return await updatePackage(id, { status: newStatus });
};

export default {
  PACKAGES_ENDPOINT,
  PACKAGE_DETAIL_ENDPOINT,
  TARIFF,
  calcPrice,
  defaultPackages,
  getPackages,
  createPackage,
  updatePackage,
  togglePackageStatus,
};
