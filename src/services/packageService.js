import { apiFetch, logout, getAuthUser } from './api';
import { isDummyMode } from '../dummy';

export const PACKAGES_ENDPOINT = '/api/packages';
export const PACKAGE_DETAIL_ENDPOINT = (id) => `/api/packages/${id}`;
export const PACKAGE_STATUS_ENDPOINT = (id) => `/api/packages/${id}/status`;

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
    name: 'Paket Telepon 6 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 6,
    durationMinutes: 6,
    harga: 5994,
    price: 5994,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-12',
    nama: 'Paket Telepon 12 Menit',
    name: 'Paket Telepon 12 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 12,
    durationMinutes: 12,
    harga: 11988,
    price: 11988,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-18',
    nama: 'Paket Telepon 18 Menit',
    name: 'Paket Telepon 18 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 18,
    durationMinutes: 18,
    harga: 17982,
    price: 17982,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-24',
    nama: 'Paket Telepon 24 Menit',
    name: 'Paket Telepon 24 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 24,
    durationMinutes: 24,
    harga: 23976,
    price: 23976,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-30',
    nama: 'Paket Telepon 30 Menit',
    name: 'Paket Telepon 30 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 30,
    durationMinutes: 30,
    harga: 29970,
    price: 29970,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-36',
    nama: 'Paket Telepon 36 Menit',
    name: 'Paket Telepon 36 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 36,
    durationMinutes: 36,
    harga: 35964,
    price: 35964,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-telp-3-non',
    nama: 'Paket Telepon Hemat 3 Menit',
    name: 'Paket Telepon Hemat 3 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 3,
    durationMinutes: 3,
    harga: 3000,
    price: 3000,
    status: 'Nonaktif',
    isActive: false,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-vid-10',
    nama: 'Paket Video Call 10 Menit',
    name: 'Paket Video Call 10 Menit',
    kategori: 'video',
    type: 'VIDEO',
    durasi: 10,
    durationMinutes: 10,
    harga: 15000,
    price: 15000,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-vid-15',
    nama: 'Paket Video Call 15 Menit',
    name: 'Paket Video Call 15 Menit',
    kategori: 'video',
    type: 'VIDEO',
    durasi: 15,
    durationMinutes: 15,
    harga: 22500,
    price: 22500,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-vid-30',
    nama: 'Paket Video Call 30 Menit',
    name: 'Paket Video Call 30 Menit',
    kategori: 'video',
    type: 'VIDEO',
    durasi: 30,
    durationMinutes: 30,
    harga: 45000,
    price: 45000,
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'pkt-vid-45-non',
    nama: 'Paket Video Call Spesial 45 Menit',
    name: 'Paket Video Call Spesial 45 Menit',
    kategori: 'video',
    type: 'VIDEO',
    durasi: 45,
    durationMinutes: 45,
    harga: 65000,
    price: 65000,
    status: 'Nonaktif',
    isActive: false,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
];

/**
 * Mapper fleksibel untuk menstandarisasi item paket dari format BE Prisma maupun mock FE
 */
export const mapPackageItem = (item) => {
  if (!item) return null;

  const rawType = (item.type || item.kategori || 'AUDIO').toUpperCase();
  const isVideo = rawType.includes('VIDEO');
  const type = isVideo ? 'VIDEO' : 'AUDIO';
  const kategori = isVideo ? 'video' : 'telepon';

  const rawStatus = (item.status || 'ACTIVE').toUpperCase();
  const isActive = item.isActive !== undefined 
    ? Boolean(item.isActive) 
    : (rawStatus === 'ACTIVE' || rawStatus === 'AKTIF');

  const durasiNum = typeof item.durationMinutes === 'number' 
    ? item.durationMinutes 
    : (typeof item.durasi === 'number' ? item.durasi : (Number(item.durationMinutes || item.durasi) || 0));

  const hargaNum = typeof item.price === 'number' 
    ? item.price 
    : (typeof item.harga === 'number' ? item.harga : (Number(item.price || item.harga) || 0));

  return {
    id: item.id || `pkt-${Date.now()}`,
    nama: item.name || item.nama || 'Paket Tanpa Nama',
    name: item.name || item.nama || 'Paket Tanpa Nama',
    kategori,
    type,
    durasi: durasiNum,
    durationMinutes: durasiNum,
    harga: hargaNum,
    price: hargaNum,
    status: isActive ? 'Aktif' : 'Nonaktif',
    rawStatus,
    isActive,
    branchId: item.branchId || '',
    branch: item.branch?.name || item.branch || 'Lapas Cipinang',
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

export const getStoredPackages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPackages));
      return defaultPackages;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(mapPackageItem) : defaultPackages;
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
    let list = getStoredPackages();

    if (kategori && kategori !== 'semua') {
      const katLower = kategori.toLowerCase();
      list = list.filter((p) => (p.kategori || '').toLowerCase() === katLower);
    }

    if (activeOnly) {
      list = list.filter((p) => p.isActive !== false && p.status !== 'Nonaktif');
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
    const params = new URLSearchParams();
    if (branchId && branchId !== 'All') params.append('branchId', branchId);
    if (search && search.trim()) params.append('search', search.trim());
    if (status && status !== 'semua') {
      params.append('status', (status === 'Aktif' || status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE');
    }

    const queryString = params.toString();
    const url = queryString ? `${PACKAGES_ENDPOINT}?${queryString}` : PACKAGES_ENDPOINT;

    const res = await apiFetch(url);
    let beList = [];
    if (res && Array.isArray(res)) {
      beList = res;
    } else if (res && Array.isArray(res?.data)) {
      beList = res.data;
    }

    if (beList.length === 0) {
      // Fallback ke stored packages jika BE belum ada data
      beList = getStoredPackages();
    }

    let mapped = beList.map(mapPackageItem).filter(Boolean);

    if (kategori && kategori !== 'semua') {
      const katLower = kategori.toLowerCase();
      mapped = mapped.filter((p) => p.kategori === katLower);
    }

    if (activeOnly) {
      mapped = mapped.filter((p) => p.isActive !== false && p.status !== 'Nonaktif');
    }

    return mapped;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.warn('[PackageService] Fallback ke stored packages:', error?.message || error);
    let list = getStoredPackages();
    if (kategori && kategori !== 'semua') {
      list = list.filter((p) => (p.kategori || '').toLowerCase() === kategori.toLowerCase());
    }
    if (activeOnly) {
      list = list.filter((p) => p.isActive !== false && p.status !== 'Nonaktif');
    }
    return list;
  }
};

/**
 * Mengambil paket aktif khusus untuk Halaman Paket Kantin
 */
export const getPaketKantin = async ({ kategori = 'telepon' } = {}) => {
  const list = await getPackages({
    kategori,
    activeOnly: true,
  });

  return list.map((pkg) => {
    const hargaTotal = Number(pkg.harga || pkg.price || 0);
    const dpp = Math.round(hargaTotal / 1.11);
    const ppn = hargaTotal - dpp;
    const durasiMenit = Number(pkg.durasi || pkg.durationMinutes || 0);

    return {
      id: pkg.id,
      nama: pkg.nama || pkg.name,
      kategori: (pkg.kategori || pkg.type || 'telepon').toLowerCase().includes('vid') ? 'video' : 'telepon',
      menit: durasiMenit,
      durasi: `${durasiMenit} Menit`,
      keterangan: 'Semua Operator',
      harga: hargaTotal,
      total: hargaTotal,
      dpp,
      ppn,
      status: pkg.status || 'Aktif',
      isActive: true,
    };
  });
};

/**
 * Membuat paket baru oleh Supervisor / Petugas Lapas
 */
export const createPackage = async (data) => {
  const durasiNum = Number(data.durasi || data.durationMinutes);
  const hargaNum = Number(data.harga || data.price);
  const rawKat = (data.kategori || data.type || 'telepon').toString().toLowerCase();
  const kategoriEnum = rawKat.includes('vid') ? 'video' : 'telepon';
  const isStatusNonaktif = data.status === 'Nonaktif' || data.status === 'INACTIVE' || data.isActive === false;
  const statusEnum = isStatusNonaktif ? 'Nonaktif' : 'Aktif';
  const nameStr = (data.nama || data.name || '').trim();

  if (isDummyMode()) {
    const newPackage = mapPackageItem({
      id: `pkt-${kategoriEnum}-${Date.now()}`,
      nama: nameStr,
      name: nameStr,
      kategori: kategoriEnum,
      type: kategoriEnum === 'video' ? 'VIDEO' : 'AUDIO',
      durasi: durasiNum,
      durationMinutes: durasiNum,
      harga: hargaNum,
      price: hargaNum,
      status: statusEnum,
      isActive: statusEnum === 'Aktif',
      createdAt: new Date().toISOString(),
    });
    const current = getStoredPackages();
    saveStoredPackages([newPackage, ...current]);
    return newPackage;
  }

  const payload = {
    nama: nameStr,
    kategori: kategoriEnum,
    durasi: durasiNum,
    harga: hargaNum,
    status: statusEnum,
    ...(data.branchId ? { branchId: data.branchId } : {}),
  };

  const res = await apiFetch(PACKAGES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const item = mapPackageItem(res?.data || res);
  return item;
};

/**
 * Memperbarui paket yang ada oleh Supervisor / Petugas Lapas / Superadmin
 */
export const updatePackage = async (id, data) => {
  if (!id) throw new Error('ID Paket diperlukan');

  const durasiNum = data.durasi !== undefined 
    ? Number(data.durasi) 
    : data.durationMinutes !== undefined 
      ? Number(data.durationMinutes) 
      : undefined;

  const hargaNum = data.harga !== undefined 
    ? Number(data.harga) 
    : data.price !== undefined 
      ? Number(data.price) 
      : undefined;

  let kategoriEnum = undefined;
  if (data.kategori || data.type) {
    const rawKat = (data.kategori || data.type).toString().toLowerCase();
    kategoriEnum = rawKat.includes('vid') ? 'video' : 'telepon';
  }

  let statusEnum = undefined;
  if (data.status !== undefined || data.isActive !== undefined) {
    const isStatusNonaktif = data.status === 'Nonaktif' || data.status === 'INACTIVE' || data.isActive === false;
    statusEnum = isStatusNonaktif ? 'Nonaktif' : 'Aktif';
  }

  const nameStr = (data.nama || data.name || '').trim();

  if (isDummyMode()) {
    const current = getStoredPackages();
    const updated = current.map((item) =>
      item.id === id 
        ? mapPackageItem({ ...item, ...data, id, nama: nameStr || item.nama, name: nameStr || item.name }) 
        : item
    );
    saveStoredPackages(updated);
    return updated.find((i) => i.id === id);
  }

  const payload = {
    ...(nameStr ? { nama: nameStr } : {}),
    ...(durasiNum !== undefined ? { durasi: durasiNum } : {}),
    ...(hargaNum !== undefined ? { harga: hargaNum } : {}),
    ...(kategoriEnum ? { kategori: kategoriEnum } : {}),
    ...(statusEnum ? { status: statusEnum } : {}),
    ...(data.branchId !== undefined ? { branchId: data.branchId } : {}),
  };

  const res = await apiFetch(PACKAGE_DETAIL_ENDPOINT(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return mapPackageItem(res?.data || res);
};

/**
 * Mengubah status paket (Aktif <-> Nonaktif)
 */
export const updatePackageStatus = async (id, statusOrIsActive) => {
  if (!id) throw new Error('ID Paket diperlukan');

  const isActive = typeof statusOrIsActive === 'boolean'
    ? statusOrIsActive
    : (statusOrIsActive === 'Aktif' || statusOrIsActive === 'ACTIVE');

  const statusEnum = isActive ? 'Aktif' : 'Nonaktif';

  if (isDummyMode()) {
    const current = getStoredPackages();
    const target = current.find((i) => i.id === id);
    if (!target) throw new Error('Paket tidak ditemukan');
    target.status = statusEnum;
    target.isActive = isActive;
    saveStoredPackages(current);
    return target;
  }

  const res = await apiFetch(PACKAGE_STATUS_ENDPOINT(id), {
    method: 'PATCH',
    body: JSON.stringify({ status: statusEnum }),
  });

  return mapPackageItem(res?.data || res);
};

/**
 * Toggle status paket aktif / nonaktif
 */
export const togglePackageStatus = async (id, currentStatus) => {
  const isCurrentlyActive = currentStatus === 'Aktif' || currentStatus === 'ACTIVE' || currentStatus === true;
  return await updatePackageStatus(id, !isCurrentlyActive);
};

/**
 * Menghapus paket komunikasi
 */
export const deletePackage = async (id) => {
  if (!id) throw new Error('ID Paket diperlukan');

  if (isDummyMode()) {
    const current = getStoredPackages();
    const filtered = current.filter((i) => i.id !== id);
    saveStoredPackages(filtered);
    return { success: true, message: 'Paket berhasil dihapus' };
  }

  try {
    const res = await apiFetch(PACKAGE_DETAIL_ENDPOINT(id), {
      method: 'DELETE',
    });
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.error(`[PackageService] Gagal menghapus paket (${id}):`, error?.message || error);
    throw error;
  }
};

export default {
  PACKAGES_ENDPOINT,
  PACKAGE_DETAIL_ENDPOINT,
  PACKAGE_STATUS_ENDPOINT,
  mapPackageItem,
  getCurrentBranch,
  defaultPackages,
  getStoredPackages,
  saveStoredPackages,
  getPackages,
  getPaketKantin,
  createPackage,
  updatePackage,
  updatePackageStatus,
  togglePackageStatus,
  deletePackage,
};
