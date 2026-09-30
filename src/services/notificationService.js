import { apiFetch, logout } from './api';

// Endpoint path disimpan dalam konstanta di atas file agar mudah disesuaikan
export const NOTIFICATIONS_ENDPOINT = '/api/notifications';

/**
 * Mapper fleksibel untuk menstandarisasi setiap item notifikasi
 */
export const mapNotificationItem = (item) => {
  if (!item) return null;

  return {
    id: item.id || item._id,
    title: item.title || 'Notifikasi Sistem',
    desc: item.desc || item.description || item.message || '',
    time: item.time || item.createdAt ? new Date(item.createdAt || item.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja',
    read: Boolean(item.read ?? item.isRead ?? false),
    type: item.type || 'system',
    link: item.link || item.url || '#',
  };
};

/**
 * Mengambil daftar notifikasi dari backend
 */
export const getNotifications = async () => {
  try {
    const res = await apiFetch(NOTIFICATIONS_ENDPOINT);
    console.log('[NotificationService] Response GET /api/notifications:', res);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.notifications)
            ? res.notifications
            : [];

    return rawList.map(mapNotificationItem).filter(Boolean);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    console.log('[NotificationService] Fallback notifikasi kosong:', error?.message || error);
    return [];
  }
};

export default {
  NOTIFICATIONS_ENDPOINT,
  mapNotificationItem,
  getNotifications,
};
