/**
 * Mock Storage Helper untuk PasCall Superadmin
 * Digunakan untuk menyimpan data sementara di localStorage FE
 * ketika endpoint backend belum tersedia.
 * 
 * TODO: ganti ke API BE saat endpoint tersedia
 */

// Flag utama untuk mengaktifkan/menonaktifkan mock Superadmin di satu tempat
export const USE_MOCK_SUPERADMIN = false;

export const MOCK_UPT_KEY = 'pascall_mock_upt';
export const MOCK_NAPI_KEY = 'pascall_mock_napi';

/**
 * Helper umum membaca data dari localStorage dengan try/catch & JSON parse aman
 */
export const getStorageItem = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`[mockStorage] Gagal membaca key "${key}" dari localStorage:`, err);
    return fallback;
  }
};

/**
 * Helper umum menyimpan data ke localStorage dengan try/catch aman
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[mockStorage] Gagal menyimpan key "${key}" ke localStorage:`, err);
    return false;
  }
};

/**
 * Helper umum menghapus data dari localStorage dengan try/catch aman
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`[mockStorage] Gagal menghapus key "${key}" dari localStorage:`, err);
    return false;
  }
};

// ============================================================================
// MOCK UPT / CABANG (Key: pascall_mock_upt)
// ============================================================================

/**
 * Mengambil seluruh data mock UPT dari localStorage
 */
export const getMockUpt = () => {
  const items = getStorageItem(MOCK_UPT_KEY, []);
  if (!Array.isArray(items)) return [];
  const napiList = getStorageItem(MOCK_NAPI_KEY, INITIAL_MOCK_NAPI);

  return items.map(item => {
    const branchInmates = Array.isArray(napiList) ? napiList.filter(n => {
      if (!n) return false;
      if (n.branchId && (n.branchId === item.id || n.branchId === item._id)) return true;
      if (!n.branchName || !item.name) return false;
      const cleanInmateBranch = n.branchName.toLowerCase().replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, '').trim();
      const cleanBranch = item.name.toLowerCase().replace(/^(lapas|rutan|kelas|kls|i|ii|iia|iib)\s+/gi, '').trim();
      return cleanInmateBranch === cleanBranch || 
             n.branchName.toLowerCase().includes(cleanBranch) || 
             item.name.toLowerCase().includes(cleanInmateBranch);
    }) : [];

    return {
      ...item,
      inmateCount: branchInmates.length,
      isMock: true,
    };
  });
};

/**
 * Menambahkan data mock UPT baru
 * PENTING: Password TIDAK disimpan ke localStorage demi keamanan
 */
export const addMockUpt = (uptData) => {
  const current = getMockUpt();
  const id = uptData.id || `mock-upt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = uptData.createdAt || new Date().toISOString();

  // Pastikan TIDAK menyimpan password akun admin/kepala UPT
  const { password, adminPassword, confirmPassword, adminConfirmPassword, ...safeData } = uptData;

  const rawStatus = (safeData.status || 'Active').toLowerCase();
  const isActive = rawStatus === 'active' || rawStatus === 'aktif';

  const newUpt = {
    id,
    name: safeData.name?.trim() || 'UPT Baru',
    location: safeData.location?.trim() || safeData.city?.trim() || 'Indonesia',
    address: safeData.address?.trim() || '-',
    phone: safeData.phone?.trim() || '-',
    capacity: Number(safeData.capacity) || 500,
    inmateCount: Number(safeData.inmateCount) || 0,
    adminCount: Number(safeData.adminCount) || 1,
    adminEmail: safeData.adminEmail?.trim() || safeData.email?.trim() || (safeData.admin?.email ? safeData.admin.email.trim() : null),
    status: isActive ? 'Active' : 'Inactive',
    isActive,
    createdAt,
    isMock: true,
  };

  const updated = [newUpt, ...current.filter(item => item.id !== id)];
  setStorageItem(MOCK_UPT_KEY, updated);
  return newUpt;
};

/**
 * Memperbarui data mock UPT berdasarkan ID
 */
export const updateMockUpt = (id, updatedFields) => {
  const current = getMockUpt();
  const updated = current.map(item => {
    if (item.id === id) {
      const isAct = updatedFields.isActive !== undefined 
        ? Boolean(updatedFields.isActive) 
        : (updatedFields.status ? (updatedFields.status.toUpperCase() === 'ACTIVE' || updatedFields.status.toUpperCase() === 'AKTIF') : item.isActive);
      const stat = updatedFields.status || (isAct ? 'Active' : 'Inactive');
      return { 
        ...item, 
        ...updatedFields, 
        isActive: isAct, 
        status: stat, 
        isMock: true 
      };
    }
    return item;
  });
  setStorageItem(MOCK_UPT_KEY, updated);
  return updated.find(item => item.id === id);
};

/**
 * Menghapus data mock UPT berdasarkan ID
 */
export const deleteMockUpt = (id) => {
  const current = getMockUpt();
  const filtered = current.filter(item => item.id !== id);
  setStorageItem(MOCK_UPT_KEY, filtered);
  return true;
};

// ============================================================================
// MOCK NARAPIDANA UNTUK SUPERADMIN (Key: pascall_mock_napi)
// ============================================================================

// 5 data contoh awal napi (nama, NIP, UPT) dibuat sekali saat localStorage kosong
export const INITIAL_MOCK_NAPI = [
  {
    id: 'mock-napi-001',
    identifier: 'WBP-2026-001',
    wbpRegNumber: 'WBP-2026-001',
    name: 'Ahmad Pratama',
    branchId: 'mock-upt-cipinang',
    branchName: 'Lapas Kelas I Cipinang',
    callBalance: 75000,
    blockRoom: 'Blok B - Kamar 04',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    entryDate: '2026-01-10T08:30:00.000Z',
    createdAt: '2026-01-10T08:30:00.000Z',
    isMock: true,
    families: [
      { id: 'fam-m1-1', name: 'Siti Rohayati', relationship: 'Istri', phone: '081298765431' },
      { id: 'fam-m1-2', name: 'Dodi Pratama', relationship: 'Anak', phone: '081298765432' },
    ],
  },
  {
    id: 'mock-napi-002',
    identifier: 'WBP-2026-002',
    wbpRegNumber: 'WBP-2026-002',
    name: 'Budi Santoso',
    branchId: 'mock-upt-salemba',
    branchName: 'Lapas Kelas IIA Salemba',
    callBalance: 45000,
    blockRoom: 'Blok A - Kamar 02',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    entryDate: '2026-01-15T10:15:00.000Z',
    createdAt: '2026-01-15T10:15:00.000Z',
    isMock: true,
    families: [
      { id: 'fam-m2-1', name: 'Ratna Dewi', relationship: 'Orang Tua', phone: '081311223344' },
      { id: 'fam-m2-2', name: 'Indah Permatasari', relationship: 'Saudara', phone: '081311223355' },
    ],
  },
  {
    id: 'mock-napi-003',
    identifier: 'WBP-2026-003',
    wbpRegNumber: 'WBP-2026-003',
    name: 'Hendra Wijaya',
    branchId: 'mock-upt-surakarta',
    branchName: 'Rutan Kelas I Surakarta',
    callBalance: 120000,
    blockRoom: 'Blok C - Kamar 12',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    entryDate: '2026-02-01T14:20:00.000Z',
    createdAt: '2026-02-01T14:20:00.000Z',
    isMock: true,
    families: [
      { id: 'fam-m3-1', name: 'Agus Gunawan', relationship: 'Saudara', phone: '081922334455' },
    ],
  },
  {
    id: 'mock-napi-004',
    identifier: 'WBP-2026-004',
    wbpRegNumber: 'WBP-2026-004',
    name: 'Rian Kurniawan',
    branchId: 'mock-upt-cipinang',
    branchName: 'Lapas Kelas I Cipinang',
    callBalance: 0,
    blockRoom: 'Blok A - Kamar 08',
    status: 'Suspended',
    commStatus: 'Nonaktif',
    isActive: false,
    entryDate: '2026-02-10T09:00:00.000Z',
    createdAt: '2026-02-10T09:00:00.000Z',
    isMock: true,
    families: [
      { id: 'fam-m4-1', name: 'Tuti Hartati', relationship: 'Istri', phone: '082133445566' },
    ],
  },
  {
    id: 'mock-napi-005',
    identifier: 'WBP-2026-005',
    wbpRegNumber: 'WBP-2026-005',
    name: 'Dedi Supriyadi',
    branchId: 'mock-upt-medan',
    branchName: 'Lapas Kelas I Medan',
    callBalance: 30000,
    blockRoom: 'Blok B - Kamar 06',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    entryDate: '2026-02-25T11:45:00.000Z',
    createdAt: '2026-02-25T11:45:00.000Z',
    isMock: true,
    families: [
      { id: 'fam-m5-1', name: 'Halimah', relationship: 'Orang Tua', phone: '081244556677' },
      { id: 'fam-m5-2', name: 'Farhan Ridwan', relationship: 'Saudara', phone: '081244556688' },
    ],
  },
  {
    id: 'mock-napi-006',
    identifier: 'NIP-8192',
    wbpRegNumber: 'NIP-8192',
    name: 'Putri Wahaha',
    branchId: 'f628171c-3c38-4c97-909b-a4ec5e2e0fa1',
    branchName: 'Lapas II Yogyakarta',
    callBalance: 50000,
    blockRoom: 'Blok Wanita - Kamar 02',
    status: 'Aktif',
    commStatus: 'Aktif',
    isActive: true,
    entryDate: '2026-03-01T10:00:00.000Z',
    createdAt: '2026-03-01T10:00:00.000Z',
    isMock: true,
    families: [
      { id: 'fam-m6-1', name: 'Bambang Wahaha', relationship: 'Orang Tua', phone: '081298768192' },
    ],
  },
];

/**
 * Mengambil seluruh data mock Narapidana Superadmin dari localStorage
 * Jika belum ada di localStorage, menginisialisasi data contoh awal
 */
export const getMockNapi = () => {
  try {
    const raw = localStorage.getItem(MOCK_NAPI_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_NAPI_KEY, JSON.stringify(INITIAL_MOCK_NAPI));
      return INITIAL_MOCK_NAPI;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const items = parsed.map(item => ({ ...item, isMock: true }));
      // Pastikan narapidana contoh default (seperti NIP-8192) tetap tersedia jika belum ada di localStorage
      let hasNew = false;
      for (const initItem of INITIAL_MOCK_NAPI) {
        const exists = items.some(it => 
          (it.identifier && it.identifier.toLowerCase() === initItem.identifier.toLowerCase()) ||
          (it.wbpRegNumber && it.wbpRegNumber.toLowerCase() === initItem.wbpRegNumber.toLowerCase()) ||
          (it.id && it.id === initItem.id)
        );
        if (!exists) {
          items.push(initItem);
          hasNew = true;
        }
      }
      if (hasNew) {
        try {
          localStorage.setItem(MOCK_NAPI_KEY, JSON.stringify(items));
        } catch {}
      }
      return items;
    }
    return INITIAL_MOCK_NAPI;
  } catch (err) {
    console.warn('[mockStorage] Error membaca mock napi:', err);
    return INITIAL_MOCK_NAPI;
  }
};

/**
 * Menambahkan data mock Narapidana baru
 */
export const addMockNapi = (napiData) => {
  const current = getMockNapi();
  const id = napiData.id || `mock-napi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = napiData.createdAt || new Date().toISOString();

  const newNapi = {
    id,
    identifier: napiData.identifier || napiData.wbpRegNumber || napiData.nip || `WBP-${Date.now().toString().slice(-4)}`,
    wbpRegNumber: napiData.wbpRegNumber || napiData.identifier || napiData.nip || `WBP-${Date.now().toString().slice(-4)}`,
    name: napiData.name?.trim() || 'Narapidana Baru',
    branchId: napiData.branchId || '',
    branchName: napiData.branchName || napiData.cabang || napiData.upt || 'Lapas Kelas II Yogyakarta',
    callBalance: typeof napiData.callBalance === 'number' ? napiData.callBalance : (Number(napiData.callBalance) || 0),
    blockRoom: napiData.blockRoom || 'Blok A / Kamar 1A',
    status: napiData.status || 'Aktif',
    commStatus: napiData.commStatus || 'Aktif',
    isActive: napiData.isActive !== undefined ? Boolean(napiData.isActive) : true,
    entryDate: napiData.entryDate || createdAt,
    createdAt,
    families: Array.isArray(napiData.families) ? napiData.families : [],
    isMock: true,
  };

  const updated = [newNapi, ...current.filter(item => item.id !== id)];
  setStorageItem(MOCK_NAPI_KEY, updated);
  return newNapi;
};

/**
 * Memperbarui data mock Narapidana berdasarkan ID / identifier
 */
export const updateMockNapi = (id, updatedFields) => {
  const current = getMockNapi();
  const updated = current.map(item => {
    if (item.id === id || item.identifier === id || item.wbpRegNumber === id) {
      return { 
        ...item, 
        ...updatedFields, 
        isMock: true 
      };
    }
    return item;
  });
  setStorageItem(MOCK_NAPI_KEY, updated);
  return updated.find(item => item.id === id || item.identifier === id || item.wbpRegNumber === id);
};

/**
 * Menghapus data mock Narapidana berdasarkan ID / identifier
 */
export const deleteMockNapi = (id) => {
  const current = getMockNapi();
  const filtered = current.filter(item => item.id !== id && item.identifier !== id && item.wbpRegNumber !== id);
  setStorageItem(MOCK_NAPI_KEY, filtered);
  return true;
};

export default {
  USE_MOCK_SUPERADMIN,
  MOCK_UPT_KEY,
  MOCK_NAPI_KEY,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getMockUpt,
  addMockUpt,
  updateMockUpt,
  deleteMockUpt,
  getMockNapi,
  addMockNapi,
  updateMockNapi,
  deleteMockNapi,
};
