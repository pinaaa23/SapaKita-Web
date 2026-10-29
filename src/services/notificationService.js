/**
 * Notification Service — PasCall Web Application
 * ===============================================
 * Mengelola notifikasi pengguna langsung dari Backend REST API:
 * - GET   /api/notifications               (Daftar notifikasi & unreadCount)
 * - PATCH /api/notifications/:id/read      (Tandai 1 notifikasi terbaca)
 * - POST  /api/notifications/mark-all-read (Tandai seluruh notifikasi terbaca)
 */

import { apiFetch, logout, getAuthToken } from './api';

export const NOTIFICATIONS_ENDPOINT = '/api/notifications';

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Baru saja';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Baru saja';
  }
}

/**
 * Menentukan link navigasi ketika notifikasi diklik sesuai tipenya
 */
function resolveNotificationLink(type, data) {
  const normType = (type || '').toUpperCase();
  if (normType.includes('TOPUP_REQUESTED') || normType === 'CANTEEN_TOPUP_REQUESTED') {
    return '/finance/billing';
  }
  if (normType.includes('TOPUP_APPROVED') || normType.includes('TOPUP_REJECTED')) {
    return '/kantin/top-up-saldo';
  }
  if (normType.includes('TRANSACTION')) {
    return '/kantin/riwayat';
  }
  if (normType.includes('RECORDING')) {
    return '/recordings';
  }
  return data?.link || '#';
}

/**
 * Mapper untuk menstandarisasi setiap item notifikasi dari Backend
 */
export const mapNotificationItem = (item) => {
  if (!item) return null;

  const isRead = Boolean(item.isRead ?? item.read ?? false);
  const type = item.type || 'SYSTEM';

  return {
    id: item.id || item._id,
    title: item.title || 'Notifikasi Sistem',
    desc: item.message || item.desc || item.description || '',
    time: formatRelativeTime(item.createdAt || item.time),
    read: isRead,
    isRead,
    type,
    link: item.link || resolveNotificationLink(type, item.data),
    createdAt: item.createdAt || new Date().toISOString(),
    data: item.data || null,
  };
};

/**
 * Mengambil daftar notifikasi dari Backend.
 * Endpoint: GET /api/notifications
 *
 * @param {Object} [params] - { page, limit }
 * @returns {Promise<Array>} List notifikasi yang sudah distandardisasi
 */
export const getNotifications = async (params = {}) => {
  const token = getAuthToken();
  if (!token) return [];
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = qs ? `${NOTIFICATIONS_ENDPOINT}?${qs}` : NOTIFICATIONS_ENDPOINT;

  try {
    const res = await apiFetch(endpoint);
    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : [];

    return rawList.map(mapNotificationItem).filter(Boolean);
  } catch (error) {
    if (error?.status === 401) {
      return [];
    }
    console.error('[NotificationService] Gagal memuat notifikasi dari BE:', error?.message || error);
    return [];
  }
};

/**
 * Mengambil unread count langsung dari BE
 * Endpoint: GET /api/notifications?limit=1
 */
export const getUnreadNotificationCount = async () => {
  const token = getAuthToken();
  if (!token) return 0;
  try {
    const res = await apiFetch(`${NOTIFICATIONS_ENDPOINT}?limit=1`);
    if (typeof res?.unreadCount === 'number') {
      return res.unreadCount;
    }
    const list = await getNotifications();
    return list.filter((n) => !n.read).length;
  } catch {
    return 0;
  }
};

/**
 * Menandai satu notifikasi sebagai sudah dibaca di Backend.
 * Endpoint: PATCH /api/notifications/:id/read
 *
 * @param {string} id
 */
export const markNotificationAsRead = async (id) => {
  if (!id) return;
  try {
    await apiFetch(`${NOTIFICATIONS_ENDPOINT}/${id}/read`, {
      method: 'PATCH',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pascall_notification_updated'));
    }
  } catch (err) {
    console.error(`[NotificationService] Gagal menandai notifikasi ${id} dibaca:`, err?.message || err);
  }
};

/**
 * Menandai semua notifikasi sebagai sudah dibaca di Backend.
 * Endpoint: POST /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    await apiFetch(`${NOTIFICATIONS_ENDPOINT}/mark-all-read`, {
      method: 'POST',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pascall_notification_updated'));
    }
  } catch (err) {
    // Fallback jika backend hanya mendukung PATCH /read-all
    try {
      await apiFetch(`${NOTIFICATIONS_ENDPOINT}/read-all`, {
        method: 'PATCH',
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pascall_notification_updated'));
      }
    } catch (e) {
      console.error('[NotificationService] Gagal menandai semua notifikasi dibaca:', e?.message || e);
    }
  }
};

export default {
  NOTIFICATIONS_ENDPOINT,
  mapNotificationItem,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
