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
    id: 'd51b1c3d-388b-434b-8275-8aa1614fc406',
    nama: 'Paket Suara 5 Menit',
    name: 'Paket Suara 5 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 5,
    durationMinutes: 5,
    harga: 5000,
    price: 5000,
    status: 'Aktif',
    isActive: true,
    branchId: 'f628171c-3c38-4c97-909b-a4ec5e2e0fa1',
    branch: 'Lapas II Yogyakarta',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: '2e3855bf-5fbe-4e81-ae15-f333f1d31648',
    nama: 'Paket Suara 15 Menit',
    name: 'Paket Suara 15 Menit',
    kategori: 'telepon',
    type: 'AUDIO',
    durasi: 15,
    durationMinutes: 15,
    harga: 12000,
    price: 12000,
    status: 'Aktif',
    isActive: true,
    branchId: 'f628171c-3c38-4c97-909b-a4ec5e2e0fa1',
    branch: 'Lapas II Yogyakarta',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: '1efccde6-af3c-4bb0-be50-3cb7326df247',
    nama: 'Paket Video Call 10 Menit',
    name: 'Paket Video Call 10 Menit',
    kategori: 'video',
    type: 'VIDEO',
    durasi: 10,
    durationMinutes: 10,
    harga: 20000,
    price: 20000,
    status: 'Aktif',
    isActive: true,
    branchId: 'f628171c-3c38-4c97-909b-a4ec5e2e0fa1',
    branch: 'Lapas II Yogyakarta',
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
    branchId: item.branchId || null,
    branch: item.branch?.name || item.branch || (item.branchId ? '' : 'Paket Global (Lama)'),
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

export const getStoredPackages = (allowEmpty = false) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return allowEmpty ? [] : defaultPackages;
    }
    const parsed = JSON.parse(raw);
    const mapped = Array.isArray(parsed) ? parsed.map(mapPackageItem).filter(Boolean) : [];
    // Bersihkan data paket legacy lama (5994, 11988, dst) dari storage browser
    const cleaned = mapped.filter((p) => {
      const h = Number(p.harga || p.price || 0);
      return ![5994, 11988, 17982, 23976, 29970, 35964].includes(h);
    });
    if (cleaned.length === 0) {
      return allowEmpty ? [] : defaultPackages;
    }
    return cleaned;
  } catch (err) {
    console.error('Error membaca storage paket:', err);
    return allowEmpty ? [] : defaultPackages;
  }
};

export const notifyPackagesUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pascall_packages_updated'));
    try {
      localStorage.setItem('pascall_packages_last_updated', Date.now().toString());
    } catch {}
  }
};

export const saveStoredPackages = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifyPackagesUpdated();
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
  allowEmpty = false,
} = {}) => {
  if (isDummyMode()) {
    let list = getStoredPackages(allowEmpty);

    if (branchId && branchId !== 'All') {
      list = list.filter((p) => p.branchId && String(p.branchId).toLowerCase() === String(branchId).toLowerCase());
    }

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

    if (beList.length === 0 && !allowEmpty) {
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
    if (allowEmpty) {
      return [];
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
 * Aturan: Paket di kantin HANYA ada jika sudah ditetapkan (dibuat/diaktifkan) oleh Supervisor untuk cabang UPT tersebut.
 * Jika SPV belum menetapkan paket, kantin tidak memiliki paket (list kosong).
 */
export const getPaketKantin = async ({ kategori = 'telepon' } = {}) => {
  const user = getAuthUser();

  // UPT ID HARUS diambil murni dari user profile akun Kantin yang sedang login.
  // Jangan pernah fallback ke session storage cabang lain atau SPV cabang lain.
  const userBranchId = user?.branchId || user?.branch?.id;

  // Jika akun belum terasosiasi dengan cabang atau branchId belum tersedia,
  // kantin TIDAK BOLEH menampilkan paket apapun (wajib list kosong).
  if (!userBranchId) {
    return [];
  }

  // 1. Ambil paket dari BE dengan filter branchId UPT ini & allowEmpty: true (tidak boleh fallback ke defaultPackages)
  let rawList = [];
  let fetchSucceeded = false;
  try {
    rawList = await getPackages({
      branchId: userBranchId,
      kategori: 'semua',
      activeOnly: true,
      allowEmpty: true,
    });
    fetchSucceeded = true;
  } catch (err) {
    console.warn('[getPaketKantin] BE fetch error, falling back to sync cache:', err?.message || err);
  }

  let list = [];

  if (fetchSucceeded) {
    const bePackages = Array.isArray(rawList) ? rawList : [];

    // Filter paket: HANYA yang secara spesifik memiliki branchId cabang ini (dibuat/diterapkan oleh SPV UPT ini).
    // Paket global (branchId null/kosong) atau paket milik UPT lain DILARANG KERAS ditampilkan di Kantin.
    const branchSpecific = bePackages.filter((p) => {
      if (!p.branchId || String(p.branchId).trim() === '') return false;
      if (p.isActive === false || p.status === 'Nonaktif') return false;

      // branchId paket HARUS sama persis dengan userBranchId milik akun Kantin ini
      return String(p.branchId).toLowerCase() === String(userBranchId).toLowerCase();
    });

    list = branchSpecific;

    // Sinkronkan cache lokal khusus cabang ini
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pascall_branch_packages_${userBranchId}`, JSON.stringify(list));
        if (list.length > 0) {
          localStorage.setItem('pascall_latest_branch_packages', JSON.stringify(list));
          localStorage.setItem('pascall_upt_packages_v7', JSON.stringify(list));
          localStorage.setItem('pascall_active_branch_id', userBranchId);
        } else {
          // Jika belum ada paket dari SPV di cabang ini, bersihkan shared cache agar tidak memakai data lama/cabang lain
          localStorage.removeItem('pascall_latest_branch_packages');
          localStorage.removeItem('pascall_upt_packages_v7');
        }
      } catch {}
    }
  } else {
    // 2. Hanya jika request ke BE error/offline: gunakan cache yang terverifikasi khusus milik cabang ini
    try {
      const cached = localStorage.getItem(`pascall_branch_packages_${userBranchId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed.filter((p) => {
            if (!p.branchId || String(p.branchId).trim() === '') return false;
            if (String(p.branchId).toLowerCase() !== String(userBranchId).toLowerCase()) return false;
            return p.isActive !== false && p.status !== 'Nonaktif';
          });
        }
      }
    } catch {}
    // Catatan: Jika tidak ada cache milik cabang ini, list tetap [] (TIDAK BOLEH fallback ke defaultPackages)
  }

  // 3. Pastikan tidak ada paket legacy preset 6/12/18/24/30/36 yang lolos
  list = list.filter((p) => {
    const harga = Number(p.harga || p.price || 0);
    return ![5994, 11988, 17982, 23976, 29970, 35964].includes(harga);
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
      branchId: pkg.branchId || null,
      branch: pkg.branch || null,
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
    const current = getStoredPackages(true);
    saveStoredPackages([newPackage, ...current]);
    notifyPackagesUpdated();
    return newPackage;
  }

  const isUuid = (str) =>
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

  const payload = {
    nama: nameStr,
    kategori: kategoriEnum,
    durasi: durasiNum,
    harga: hargaNum,
    status: statusEnum,
    ...(data.branchId && isUuid(data.branchId) ? { branchId: data.branchId.trim() } : {}),
  };

  const res = await apiFetch(PACKAGES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const item = mapPackageItem(res?.data || res);
  // Simpan ke local storage backup & trigger event realtime
  try {
    const current = getStoredPackages(true);
    saveStoredPackages([item, ...current.filter((p) => p.id !== item.id)]);
  } catch {}
  notifyPackagesUpdated();
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
    const current = getStoredPackages(true);
    const updated = current.map((item) =>
      item.id === id 
        ? mapPackageItem({ ...item, ...data, id, nama: nameStr || item.nama, name: nameStr || item.name }) 
        : item
    );
    saveStoredPackages(updated);
    notifyPackagesUpdated();
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

  const item = mapPackageItem(res?.data || res);
  try {
    const current = getStoredPackages(true);
    saveStoredPackages(current.map((p) => (p.id === id ? item : p)));
  } catch {}
  notifyPackagesUpdated();
  return item;
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
    const current = getStoredPackages(true);
    const target = current.find((i) => i.id === id);
    if (!target) throw new Error('Paket tidak ditemukan');
    target.status = statusEnum;
    target.isActive = isActive;
    saveStoredPackages(current);
    notifyPackagesUpdated();
    return target;
  }

  const res = await apiFetch(PACKAGE_STATUS_ENDPOINT(id), {
    method: 'PATCH',
    body: JSON.stringify({ status: statusEnum }),
  });

  const item = mapPackageItem(res?.data || res);
  try {
    const current = getStoredPackages(true);
    saveStoredPackages(current.map((p) => (p.id === id ? item : p)));
  } catch {}
  notifyPackagesUpdated();
  return item;
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
    const current = getStoredPackages(true);
    const filtered = current.filter((i) => i.id !== id);
    saveStoredPackages(filtered);
    notifyPackagesUpdated();
    return { success: true, message: 'Paket berhasil dihapus' };
  }

  try {
    const res = await apiFetch(PACKAGE_DETAIL_ENDPOINT(id), {
      method: 'DELETE',
    });
    try {
      const current = getStoredPackages(true);
      saveStoredPackages(current.filter((i) => i.id !== id));
    } catch {}
    notifyPackagesUpdated();
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
