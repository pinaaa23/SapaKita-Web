/**
 * Service Modul Kantor Wilayah (Kanwil)
 * Terhubung langsung ke PasCall Backend API (/api/kanwil, /api/branches, /api/dashboard, /api/inmates)
 * Mendukung fallback offline jika backend belum siap.
 */

import { apiFetch } from './api';
import { getInmates } from './inmateService';

export const isKanwilDemoEnabled = () => true;

/**
 * Autentikasi akun Admin Kanwil fallback
 */
export const authenticateKanwil = (identifier, password) => {
  const cleanId = String(identifier || '').trim().toLowerCase();
  if (!cleanId.includes('kanwil')) return null;

  return {
    token: `jwt-kanwil-fallback-${Date.now()}`,
    user: {
      id: 'kanwil-jabar',
      name: 'Admin Kanwil Jawa Barat',
      email: cleanId,
      role: 'admin_kanwil',
      kanwilId: 'kanwil-jabar',
      kanwilName: 'Kanwil Jawa Barat',
      wilayah: 'Jawa Barat',
    },
  };
};

/**
 * Mengambil daftar seluruh provinsi resmi Indonesia (38 provinsi Kemendagri / BPS)
 */
export const getOfficialProvinces = async () => {
  try {
    const res = await apiFetch('/api/kanwil/provinces');
    return res.data || [];
  } catch (err) {
    console.warn('[KanwilService] Fallback getOfficialProvinces:', err?.message);
    return [
      'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
      'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta',
      'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali',
      'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
      'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
      'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan',
      'Sulawesi Tenggara', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat',
      'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'
    ];
  }
};

/**
 * Mengambil laporan audit UPT vs Kanwil (Status: COCOK, TIDAK COCOK, TIDAK DIKETAHUI)
 */
export const getKanwilAuditReport = async () => {
  try {
    const res = await apiFetch('/api/kanwil/audit-report');
    return (res.data || []).map((item) => ({
      ...item,
      branchId: item.branchId || item.id,
      branchName: item.branchName || item.name || 'UPT Tanpa Nama',
      branchCity: item.branchCity || item.city || item.location || '-',
      branchProvince: item.branchProvince || item.province || '',
    }));
  } catch (err) {
    console.error('[KanwilService] Gagal memuat audit report:', err);
    return [];
  }
};

/**
 * Mengambil daftar UPT yang belum ditetapkan atau tidak cocok dengan wilayah Kanwil
 */
export const getUnassignedBranches = async () => {
  try {
    const res = await apiFetch('/api/kanwil/unassigned-branches');
    return res.data || [];
  } catch (err) {
    console.error('[KanwilService] Gagal memuat unassigned branches:', err);
    return [];
  }
};

/**
 * Superadmin menetapkan Provinsi baku dan Kanwil untuk UPT tertentu
 */
export const assignBranchKanwil = async (branchId, { province, kanwilId, reason }) => {
  return await apiFetch(`/api/branches/${branchId}/assign-kanwil`, {
    method: 'POST',
    body: JSON.stringify({ province, kanwilId, reason }),
  });
};

/**
 * Mengambil seluruh daftar Kanwil untuk Superadmin beserta UPT binaan dan Kepala UPT
 */
export const getAllKanwilsForSuperadmin = async () => {
  try {
    const [kanwilRes, branchRes] = await Promise.all([
      apiFetch('/api/kanwil'),
      apiFetch('/api/branches?limit=500').catch((e) => {
        console.warn('[KanwilService] Fallback branches fetch error:', e?.message);
        return { data: [] };
      }),
    ]);

    const items = kanwilRes.data || [];
    const allBranches = branchRes.data || [];

    // Kelompokkan cabang berdasarkan kanwilId
    const branchesByKanwil = new Map();
    allBranches.forEach((b) => {
      if (b.kanwilId) {
        if (!branchesByKanwil.has(b.kanwilId)) {
          branchesByKanwil.set(b.kanwilId, []);
        }
        branchesByKanwil.get(b.kanwilId).push({
          id: b.id,
          name: b.name,
          city: b.city || b.location || '-',
          province: b.province || '-',
          address: b.address || '-',
          phone: b.phone || '-',
          status: b.status || 'Aktif',
          capacity: b.capacity || 0,
          inmateCount: b.inmateCount || 0,
          headAdmin: b.headAdmin || null,
          headName: b.headName || b.headAdmin?.name || 'Belum Ditentukan',
          headEmail: b.headEmail || b.headAdmin?.email || '-',
          headPhone: b.headPhone || b.headAdmin?.phone || '-',
        });
      }
    });

    return items.map((k) => {
      const assignedFromBranches = branchesByKanwil.get(k.id) || [];
      const branchList = assignedFromBranches.length > 0
        ? assignedFromBranches
        : (k.branches || []).map((b) => ({
            id: b.id,
            name: b.name,
            city: b.city || b.location || '-',
            province: b.province || '-',
            address: b.address || '-',
            phone: b.phone || '-',
            status: b.status || 'Aktif',
            capacity: b.capacity || 0,
            inmateCount: b.inmateCount || 0,
            headAdmin: b.headAdmin || null,
            headName: b.headName || b.headAdmin?.name || 'Belum Ditentukan',
            headEmail: b.headEmail || b.headAdmin?.email || '-',
            headPhone: b.headPhone || b.headAdmin?.phone || '-',
          }));

      const finalUptCount = Math.max(branchList.length, k.branchCount || k._count?.branches || 0);

      return {
        id: k.id,
        code: k.code,
        name: k.name,
        kanwilName: k.name,
        wilayah: k.region,
        region: k.region,
        status: k.status,
        provinces: k.provinces || [],
        uptCount: finalUptCount,
        assignedUpts: branchList,
        adminCount: k.adminCount || k._count?.users || (k.adminUser ? 1 : 0),
        adminUser: k.adminUser || (k.users && k.users[0]) || null,
        adminEmail: k.adminUser?.email || (k.users && k.users[0]?.email) || null,
        adminName: k.adminUser?.name || (k.users && k.users[0]?.name) || null,
        adminPhone: k.adminUser?.phone || (k.users && k.users[0]?.phone) || null,
        createdAt: k.createdAt,
      };
    });
  } catch (err) {
    console.error('[KanwilService] Error fetching kanwils from API:', err);
    throw err;
  }
};

/**
 * Mengambil semua UPT beserta status keterikatan Kanwil untuk Superadmin
 */
export const getAllAvailableUptsForSuperadmin = async (currentKanwilId = null) => {
  try {
    const res = await apiFetch('/api/branches');
    const branches = res.data || [];
    return branches.map((u) => {
      const isAssignedToOther = u.kanwilId && u.kanwilId !== currentKanwilId;
      return {
        ...u,
        isAssignedToOther,
        assignedToKanwilName: u.kanwil?.name || null,
        isAssignedToCurrent: u.kanwilId === currentKanwilId,
      };
    });
  } catch (err) {
    console.error('[KanwilService] Error fetching branches from API:', err);
    return [];
  }
};

/**
 * Menyimpan (tambah atau edit) Kanwil oleh Superadmin
 * Mendukung pembuatan/pembaruan akun Administrator Kanwil secara terintegrasi (1 Kanwil 1 Admin)
 */
export const saveKanwilFromSuperadmin = async (kanwilPayload) => {
  const isEditing = Boolean(kanwilPayload.id);

  if (isEditing) {
    const res = await apiFetch(`/api/kanwil/${kanwilPayload.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: kanwilPayload.kanwilName || kanwilPayload.name,
        region: kanwilPayload.wilayah || kanwilPayload.region,
        provinces: kanwilPayload.provinces || [],
        adminEmail: kanwilPayload.adminEmail || undefined,
        adminName: kanwilPayload.adminName || undefined,
        adminPassword: kanwilPayload.adminPassword || undefined,
        adminPhone: kanwilPayload.adminPhone || undefined,
      }),
    });
    return res.data;
  } else {
    // Generate code unik jika belum ada
    const code = kanwilPayload.code || `KW-${Date.now().toString().slice(-4)}`;
    const res = await apiFetch('/api/kanwil', {
      method: 'POST',
      body: JSON.stringify({
        code,
        name: kanwilPayload.kanwilName || kanwilPayload.name,
        region: kanwilPayload.wilayah || kanwilPayload.region,
        provinces: kanwilPayload.provinces || [],
        status: kanwilPayload.status || 'Aktif',
        adminEmail: kanwilPayload.adminEmail || undefined,
        adminName: kanwilPayload.adminName || undefined,
        adminPassword: kanwilPayload.adminPassword || undefined,
        adminPhone: kanwilPayload.adminPhone || undefined,
      }),
    });
    return res.data;
  }
};

/**
 * Mengubah status aktif/nonaktif Kanwil
 */
export const toggleKanwilStatus = async (kanwilId) => {
  const res = await apiFetch(`/api/kanwil/${kanwilId}/status`, {
    method: 'PATCH',
  });
  return res.data;
};

/**
 * Menghapus Kanwil (Hanya jika belum memiliki UPT)
 */
export const deleteKanwilFromSuperadmin = async (kanwilId) => {
  const res = await apiFetch(`/api/kanwil/${kanwilId}`, {
    method: 'DELETE',
  });
  return res;
};

/**
 * Mengambil ringkasan statistik Dashboard Admin Kanwil
 */
export const getKanwilDashboardSummary = async (kanwilId) => {
  try {
    const res = await apiFetch('/api/dashboard/kanwil-summary');
    const data = res.data || {};
    return {
      totalCalls: data.totalCalls || 0,
      totalRevenue: data.totalTransactions || 0,
      activeBranches: data.activeBranches || 0,
      totalUpts: data.totalBranches || (data.branches ? data.branches.length : 0),
      totalInmates: data.totalInmates || 0,
      totalWbps: data.totalInmates || 0,
      successRate: data.totalCalls > 0 ? Number(((data.answeredCalls / data.totalCalls) * 100).toFixed(1)) : (data.successRate || 98.4),
      callsGrowth: data.callsGrowth || 0,
      revenueGrowth: data.transactionsGrowth || 0,
      branchesGrowth: 0,
      successRateGrowth: 0,
      avgCallDurationSeconds: 300,
      revenueTrend: [
        { month: 'Bulan Ini', total: data.totalTransactions || 0 }
      ],
      callVolume: [
        { date: 'Total Panggilan', total: data.totalCalls || 0 }
      ],
      branches: data.branches || [],
    };
  } catch (err) {
    console.error('[KanwilService] Error fetching dashboard summary:', err);
    return {
      totalCalls: 0,
      totalRevenue: 0,
      activeBranches: 0,
      totalUpts: 0,
      totalInmates: 0,
      successRate: 0,
      callsGrowth: 0,
      revenueGrowth: 0,
      branchesGrowth: 0,
      successRateGrowth: 0,
      avgCallDurationSeconds: 0,
      revenueTrend: [],
      callVolume: [],
      branches: [],
    };
  }
};

/**
 * Mengambil daftar UPT milik Kanwil tertentu
 */
export const getKanwilBranches = async (kanwilId, params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = qs ? `/api/branches?${qs}` : '/api/branches';
    const res = await apiFetch(endpoint);

    const rawItems = res.data || [];
    const items = rawItems.map((u) => ({
      ...u,
      location: u.city || u.province || 'Indonesia',
      inmateCount: u._count?.inmates || u.inmateCount || 0,
      status: u.status === 'Aktif' || u.status === 'Active' ? 'Aktif' : 'Nonaktif',
      province: u.province || '-',
    }));

    return {
      items,
      total: res.pagination?.total || items.length,
      page: res.pagination?.page || 1,
      limit: res.pagination?.limit || items.length,
      totalPages: res.pagination?.totalPages || 1,
    };
  } catch (err) {
    console.error('[KanwilService] Error fetching kanwil branches:', err);
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }
};

/**
 * Menambahkan UPT baru oleh Admin Kanwil (otomatis di wilayah Kanwilnya)
 */
export const createKanwilBranch = async (kanwilId, branchData) => {
  const payload = {
    name: branchData.name.trim(),
    city: branchData.city?.trim() || branchData.location?.trim() || '',
    location: branchData.location?.trim() || branchData.city?.trim() || '',
    address: branchData.address?.trim() || '',
    phone: branchData.phone?.trim() || '',
    capacity: parseInt(branchData.capacity, 10) || 500,
    province: branchData.province?.trim() || undefined,
    headName: branchData.headName?.trim() || `Kepala ${branchData.name.trim()}`,
    headEmail: branchData.headEmail?.trim() || branchData.email?.trim() || undefined,
    headPhone: branchData.headPhone?.trim() || undefined,
    headPassword: branchData.headPassword || branchData.password || 'password123',
    status: branchData.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
  };

  const res = await apiFetch('/api/branches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
};

/**
 * Mengambil daftar WBP gabungan seluruh UPT milik Kanwil tertentu
 */
export const getKanwilInmates = async (kanwilId, params = {}) => {
  try {
    const res = await getInmates({
      search: params.search || '',
      branchId: params.branchId !== 'All' ? params.branchId : '',
      status: params.status !== 'All' ? params.status : '',
      page: params.page || 1,
      limit: params.limit || 20,
    });

    const rawList = res.items || (Array.isArray(res) ? res : []);
    const items = rawList.map((w) => {
      const isAktif = w.status === 'Aktif' || w.status === 'Active' || w.isActive || w.commStatus === 'Aktif';
      return {
        id: w.id,
        name: w.name,
        nip: w.identifier || w.nip,
        identifier: w.identifier || w.nip,
        branchId: w.branchId,
        branchName: w.branchName || w.branch?.name || 'UPT Lapas',
        block: w.blockRoom || w.block || '-',
        blockRoom: w.blockRoom || w.block || '-',
        balance: Number(w.balance || w.callBalance || 0),
        status: isAktif ? 'Aktif' : 'Nonaktif',
        isActive: isAktif,
        registeredAt: w.entryDate || w.createdAt || w.registeredAt,
        createdAt: w.entryDate || w.createdAt,
        families: w.families || [],
      };
    });

    return {
      items,
      total: res.total !== undefined ? res.total : items.length,
      page: res.page || 1,
      limit: res.limit || items.length,
      totalPages: res.totalPages || 1,
    };
  } catch (err) {
    console.error('[KanwilService] Error fetching kanwil inmates:', err);
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }
};

/**
 * Mengambil data laporan analitik khusus Kanwil
 */
export const getKanwilReportSummary = async (kanwilId, period = '30days') => {
  try {
    const summary = await getKanwilDashboardSummary(kanwilId);
    const branchRes = await getKanwilBranches(kanwilId, { limit: 100 });
    const upts = branchRes.items || [];

    return {
      totalRevenue: summary.totalRevenue,
      totalCalls: summary.totalCalls,
      avgCallDurationSeconds: summary.avgCallDurationSeconds,
      successRate: summary.successRate,
      activeBranches: summary.activeBranches,
      totalUpts: summary.totalUpts,
      totalWbps: summary.totalWbps,
      revenueTrend: summary.revenueTrend,
      callVolumeTrend: summary.callVolume,
      revenueGrowth: summary.revenueGrowth,
      callsGrowth: summary.callsGrowth,
      successRateGrowth: summary.successRateGrowth,
      uptBreakdown: upts.map((u) => ({
        id: u.id,
        name: u.name,
        city: u.city,
        inmateCount: u.inmateCount || 0,
        capacity: u.capacity,
        status: u.status,
      })),
    };
  } catch (err) {
    console.error('[KanwilService] Error fetching report summary:', err);
    return {
      totalRevenue: 0,
      totalCalls: 0,
      avgCallDurationSeconds: 0,
      successRate: 0,
      activeBranches: 0,
      totalUpts: 0,
      totalWbps: 0,
      revenueTrend: [],
      callVolumeTrend: [],
      revenueGrowth: 0,
      callsGrowth: 0,
      successRateGrowth: 0,
      uptBreakdown: [],
    };
  }
};

/**
 * Mengambil daftar Admin Kanwil (Superadmin only)
 */
export const getKanwilAdmins = async (kanwilId) => {
  const qs = kanwilId ? `?kanwilId=${kanwilId}` : '';
  const res = await apiFetch(`/api/kanwil/admins${qs}`);
  return res.data || [];
};

/**
 * Membuat akun Admin Kanwil baru (Superadmin only)
 */
export const createKanwilAdmin = async ({ name, email, password, kanwilId, phone }) => {
  return await apiFetch('/api/kanwil/admins', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, kanwilId, phone }),
  });
};

/**
 * Mereset password akun Admin Kanwil (Superadmin only)
 */
export const resetKanwilAdminPassword = async (adminId, newPassword) => {
  return await apiFetch(`/api/kanwil/admins/${adminId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
};

/**
 * Mengambil daftar seluruh Kepala UPT di wilayah binaan Kanwil
 * Endpoint: GET /api/branches/admins
 */
export const getKanwilBranchAdmins = async () => {
  try {
    const res = await apiFetch('/api/branches/admins');
    return res.data || [];
  } catch (err) {
    console.warn('[KanwilService] Gagal memuat daftar kepala UPT kanwil:', err?.message || err);
    return [];
  }
};

