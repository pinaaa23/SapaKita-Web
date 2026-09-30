import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta agar mudah disesuaikan
export const CONTACTS_ENDPOINT = '/api/contacts';

/**
 * Mapper fleksibel untuk menstandarisasi data item kontak dari berbagai format respons backend
 */
export const mapContactItem = (item) => {
  if (!item) return null;

  const rawStatus = (item.status || 'PENDING').toUpperCase();
  const normalizedStatus = rawStatus === 'APPROVED' ? 'Approved' : rawStatus === 'REJECTED' ? 'Rejected' : 'Pending';

  const inmateIdentifier = item.inmate?.identifier || item.inmateIdentifier || item.wbpRegNumber || item.inmateId || '-';
  const inmateName = item.inmate?.name || item.inmateName || item.napiName || 'Narapidana';
  const inmateRoom = item.inmate?.blockRoom || item.inmate?.room || '';

  const contactName = item.family?.name || item.family?.fullName || item.contactName || item.name || 'Keluarga';
  const phone = item.family?.phone || item.family?.phoneNumber || item.phone || item.phoneNumber || item.family?.email || '-';
  const email = item.family?.email || item.email || '';
  const relationship = item.relationship || item.relation || 'Keluarga';

  let formattedDate = '-';
  if (item.createdAt || item.date || item.created_at) {
    try {
      const d = new Date(item.createdAt || item.date || item.created_at);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      formattedDate = '-';
    }
  }

  return {
    id: item.id || item._id || item.contactId,
    inmateId: item.inmateId || item.inmate?.id,
    wbpRegNumber: inmateIdentifier,
    napiName: inmateRoom ? `${inmateName} (${inmateIdentifier}) - ${inmateRoom}` : `${inmateName} (${inmateIdentifier})`,
    inmateObj: item.inmate || { identifier: inmateIdentifier, name: inmateName },
    contactName,
    relation: relationship,
    phone,
    email,
    ktpUrl: item.ktpUrl || item.ktpImage || item.ktp || '',
    status: normalizedStatus,
    rawStatus,
    rejectReason: item.rejectReason || item.reason || '',
    date: formattedDate,
    rawDate: item.createdAt || item.created_at || null,
  };
};

/**
 * Mengambil daftar kontak dari backend dengan parameter status opsional (PENDING, APPROVED, REJECTED)
 */
export const getContacts = async ({ status } = {}) => {
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status.toUpperCase())}` : '';
  const url = `${CONTACTS_ENDPOINT}${query}`;

  try {
    const res = await apiFetch(url);
    console.log('[ContactService] Response lengkap GET /api/contacts:', res);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.contacts)
            ? res.contacts
            : [];

    return rawList.map(mapContactItem).filter(Boolean);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[ContactService] Gagal memuat data kontak:', error?.message || error);
    throw error;
  }
};

/**
 * Mengubah status kontak (APPROVED atau REJECTED)
 * Catatan: Backend hanya menerima { status: "APPROVED" | "REJECTED" }, kolom alasan penolakan tidak didukung di API.
 */
export const updateContactStatus = async (id, status) => {
  if (!id) throw new Error('ID kontak tidak valid');
  const normalizedStatus = status.toUpperCase();

  try {
    const res = await apiFetch(`${CONTACTS_ENDPOINT}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: normalizedStatus,
      }),
    });
    console.log(`[ContactService] Response PATCH /api/contacts/${id}/status:`, res);
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log(`[ContactService] Gagal update status kontak ${id}:`, error?.message || error);
    throw error;
  }
};

export default {
  CONTACTS_ENDPOINT,
  mapContactItem,
  getContacts,
  updateContactStatus,
};
