import { apiFetch, logout, getAuthUser } from './api';
import { isDummyMode } from '../dummy';

export const PACKAGES_ENDPOINT = '/api/packages';
export const PACKAGE_DETAIL_ENDPOINT = (id) => `/api/packages/${id}`;

// Storage key untuk data paket per cabang
const STORAGE_KEY = 'pascall_upt_packages_v7';

/**
 * Mendapatkan nama/ID cabang dari user yang sedang login
 */
export const getCurrentBranch = () => {
  const user = getAuthUser();
  if (!user) return 'Lapas Cipinang';
  return (
    user.branch?.name ||
    user.branchName ||
    (typeof user.branch === 'string' ? user.branch : 'Lapas Cipinang')
  );
};

/**
 * Data paket komunikasi default untuk cabang
 */
export const defaultPackages = [
  {
    id: 'pkt-telp-6',
    nama: 'Paket Telepon 6 Menit',
    kategori: 'telepon',
    durasi: 6,
    harga: 5994,
    status: 'Aktif',
    branch: 'Lapas Cipinang',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-12',
    nama: 'Paket Telepon 12 Menit',
    kategori: 'telepon',
    durasi: 12,
    harga: 11988,
    status: 'Aktif',
    branch: 'Lapas Cipinang',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-18',
    nama: 'Paket Telepon 18 Menit',
    kategori: 'telepon',
    durasi: 18,
    harga: 17982,
    status: 'Aktif',
    branch: 'Lapas Cipinang',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-24',
    nama: 'Paket Telepon 24 Menit',
    kategori: 'telepon',
    durasi: 24,
    harga: 23976,
    status: 'Aktif',
    branch: 'Lapas Cipinang',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-30',
    nama: 'Paket Telepon 30 Menit',
    kategori: 'telepon',
    durasi: 30,
    harga: 29970,
    status: 'Aktif',
    branch: 'Lapas Cipinang',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-36',
    nama: 'Paket Telepon 36 Menit',
    kategori: 'telepon',
    durasi: 36,
    harga: 35964,
    status: 'Aktif',
    branch: 'Lapas Cipinang',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
];

export const getStoredPackages = () => {
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

export const saveStoredPackages = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pascall_packages_updated', { detail: items }));
    }
  } catch (err) {
    console.error('Error menyimpan storage paket:', err);
  }
};

/**
 * Mengambil daftar paket komunikasi
 */
export const getPackages = async ({
  branchId,
  search = '',
  kategori = 'semua',
  status = 'semua',
  activeOnly = false,
} = {}) => {
  if (isDummyMode()) {
    const { dummyStore } = await import('../dummy/store');
    let list = dummyStore.getPackages();

    if (kategori && kategori !== 'semua') {
      const katLower = kategori.toLowerCase();
      list = list.filter((p) => {
        const itemKat = (p.kategori || '').toLowerCase();
        return itemKat === katLower;
      });
    }

    if (activeOnly) {
      list = list.filter((p) => p.status === 'Aktif' || p.isActive !== false);
    } else if (status && status !== 'semua') {
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
  }

  try {
    const activeBranch = branchId || getCurrentBranch();
    const params = new URLSearchParams();
    if (activeBranch) params.append('branch', activeBranch);
    if (search && search.trim()) params.append('search', search.trim());
    if (kategori && kategori !== 'semua') params.append('kategori', kategori);
    if (status && status !== 'semua') params.append('status', status);

    const queryString = params.toString();
    const url = queryString ? `${PACKAGES_ENDPOINT}?${queryString}` : PACKAGES_ENDPOINT;

    // Coba request ke backend terlebih dahulu
    try {
      const res = await apiFetch(url);
      if (res && (Array.isArray(res) || Array.isArray(res?.data))) {
        let beList = Array.isArray(res) ? res : res.data;
        if (activeOnly) {
          beList = beList.filter((p) => p.status === 'Aktif' || p.isActive !== false);
        }
        return beList;
      }
    } catch {
      // Return empty list if BE fails
      return [];
    }

    return [];
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    return [];
  }
};


/**
 * Mengambil paket aktif khusus untuk Halaman Paket Kantin
 * Menghasilkan struktur data yang siap dikonsumsi oleh kartu dan modal kantin.
 * TODO: ganti dengan endpoint BE untuk paket per cabang
 */
export const getPaketKantin = async ({ branchId, kategori = 'telepon' } = {}) => {
  const activeBranch = branchId || getCurrentBranch();
  const list = await getPackages({
    branchId: activeBranch,
    kategori,
    activeOnly: true,
  });

  return list.map((pkg) => {
    const hargaTotal = Number(pkg.harga || 0);
    const dpp = Math.round(hargaTotal / 1.11);
    const ppn = hargaTotal - dpp;

    return {
      id: pkg.id,
      nama: pkg.nama,
      kategori: pkg.kategori || 'telepon',
      menit: Number(pkg.durasi || 0),
      durasi: `${pkg.durasi || 0} Menit`,
      keterangan: 'Semua Operator',
      harga: hargaTotal,
      total: hargaTotal,
      dpp,
      ppn,
      status: pkg.status || 'Aktif',
      branch: pkg.branch || activeBranch,
    };
  });
};

/**
 * Membuat paket baru oleh Supervisor
 * TODO: ganti dengan endpoint BE untuk paket per cabang
 */
export const createPackage = async (data) => {
  const branch = data.branch || getCurrentBranch();
  const durasiNum = Number(data.durasi);
  const hargaNum = Number(data.harga);

  const newPackage = {
    id: `pkt-${data.kategori || 'telp'}-${Date.now()}`,
    nama: data.nama.trim(),
    kategori: data.kategori || 'telepon',
    durasi: durasiNum,
    harga: hargaNum,
    status: data.status || 'Aktif',
    branch,
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
 * Memperbarui paket yang ada oleh Supervisor
 * TODO: ganti dengan endpoint BE untuk paket per cabang
 */
export const updatePackage = async (id, data) => {
  const durasiNum = data.durasi !== undefined ? Number(data.durasi) : undefined;
  const hargaNum = data.harga !== undefined ? Number(data.harga) : undefined;

  const patchData = {
    ...data,
    ...(durasiNum !== undefined ? { durasi: durasiNum } : {}),
    ...(hargaNum !== undefined ? { harga: hargaNum } : {}),
  };

  try {
    const res = await apiFetch(PACKAGE_DETAIL_ENDPOINT(id), {
      method: 'PATCH',
      body: JSON.stringify(patchData),
    });
    const current = getStoredPackages();
    const updated = current.map((item) =>
      item.id === id ? { ...item, ...patchData, id } : item
    );
    saveStoredPackages(updated);
    return res || updated.find((i) => i.id === id);
  } catch {
    const current = getStoredPackages();
    const updated = current.map((item) =>
      item.id === id ? { ...item, ...patchData, id } : item
    );
    saveStoredPackages(updated);
    return updated.find((i) => i.id === id);
  }
};

/**
 * Mengubah status paket (Aktif <-> Nonaktif)
 * Tidak ada penghapusan permanen agar transaksi lama tetap aman.
 * TODO: ganti dengan endpoint BE untuk paket per cabang
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
  getCurrentBranch,
  defaultPackages,
  getStoredPackages,
  saveStoredPackages,
  getPackages,
  getPaketKantin,
  createPackage,
  updatePackage,
  togglePackageStatus,
};
