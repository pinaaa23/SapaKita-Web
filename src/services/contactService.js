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
    hasWhatsapp: item.hasWhatsapp,
    whatsappCheckedAt: item.whatsappCheckedAt,
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
 * Mengambil daftar kontak dari backend dengan parameter status, inmateId, & search
 */
export const getContacts = async ({ status, inmateId, search } = {}) => {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status.toUpperCase());
  if (inmateId) params.append('inmateId', inmateId);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';
  const url = `${CONTACTS_ENDPOINT}${query}`;

  try {
    const res = await apiFetch(url);
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
 * Mendaftarkan kontak keluarga baru (Maksimal 10 kontak per WBP)
 */
export const createContact = async ({ inmateId, name, relationship, phone }) => {
  try {
    return await apiFetch(CONTACTS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ inmateId, name, relationship, phone }),
    });
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    throw error;
  }
};

/**
 * Menghapus kontak keluarga dari akun WBP
 */
export const deleteContact = async (id) => {
  if (!id) throw new Error('ID kontak tidak valid');
  try {
    return await apiFetch(`${CONTACTS_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    throw error;
  }
};

/**
 * Mengubah status kontak (APPROVED atau REJECTED)
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
    return res;
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    throw error;
  }
};

export default {
  CONTACTS_ENDPOINT,
  mapContactItem,
  getContacts,
  createContact,
  deleteContact,
  updateContactStatus,
};
