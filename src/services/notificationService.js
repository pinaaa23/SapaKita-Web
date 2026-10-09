import { apiFetch, logout, getAuthUser } from './api';
import { formatRupiah } from '../utils/formatKantin';

// Endpoint path disimpan dalam konstanta di atas file agar mudah disesuaikan
export const NOTIFICATIONS_ENDPOINT = '/api/notifications';
const STORAGE_READ_NOTIFS_KEY = 'pascall_read_notifications_v1';

function getReadNotifIds() {
  try {
    const raw = localStorage.getItem(STORAGE_READ_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

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
 * Mapper fleksibel untuk menstandarisasi setiap item notifikasi
 */
export const mapNotificationItem = (item) => {
  if (!item) return null;

  return {
    id: item.id || item._id,
    title: item.title || 'Notifikasi Sistem',
    desc: item.desc || item.description || item.message || '',
    time: item.time || (item.createdAt ? formatRelativeTime(item.createdAt) : 'Baru saja'),
    read: Boolean(item.read ?? item.isRead ?? false),
    type: item.type || 'system',
    link: item.link || item.url || '#',
  };
};

/**
 * Mengambil notifikasi top up saldo kantin dari data riwayat lokal (khusus superadmin)
 */
function getCanteenTopupNotifications() {
  try {
    const rawNat = localStorage.getItem('pascall_superadmin_canteen_history_v1');
    if (!rawNat) return [];
    const list = JSON.parse(rawNat);
    if (!Array.isArray(list)) return [];

    const readIds = getReadNotifIds();

    // Ambil transaksi yang statusnya 'Menunggu' atau yang terbaru
    return list
      .filter((item) => item.status === 'Menunggu')
      .map((item) => {
        const notifId = `canteen-topup-${item.id}`;
        return {
          id: notifId,
          title: `Permintaan Top Up: ${item.branchName || 'Kantin Lapas'}`,
          desc: `${item.staffName || 'Operator'} mengajukan top up saldo ${formatRupiah(item.nominal)} (Menunggu Konfirmasi)`,
          time: formatRelativeTime(item.tanggal),
          read: readIds.includes(notifId),
          type: 'canteen_topup',
          link: '/canteen-topup',
        };
      });
  } catch (err) {
    console.error('Gagal mengambil notifikasi top up kantin:', err);
    return [];
  }
}

/**
 * Mengambil notifikasi status top up saldo untuk operator kantin
 */
function getCanteenOperatorNotifications() {
  try {
    const user = getAuthUser();
    const identifier = user?.id || user?.email || user?.name || 'default_canteen';
    const cleanId = String(identifier).toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    const riwayatKey = `pascall_kantin_saldo_riwayat_${cleanId}`;
    
    const raw = localStorage.getItem(riwayatKey);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    const readIds = getReadNotifIds();

    return list
      .filter((item) => item.status === 'Berhasil' || item.status === 'Ditolak')
      .map((item) => {
        const notifId = `kantin-topup-status-${item.id}-${item.status}`;
        const isApproved = item.status === 'Berhasil';
        return {
          id: notifId,
          title: isApproved ? 'Dana Top Up Masuk!' : 'Pengajuan Top Up Ditolak',
          desc: isApproved
            ? `Top up saldo ${formatRupiah(item.nominal)} telah disetujui Superadmin dan ditambahkan ke akun kasir Anda.`
            : `Pengajuan top up saldo ${formatRupiah(item.nominal)} ditolak oleh Superadmin.`,
          time: formatRelativeTime(item.approvedAt || item.tanggal),
          read: readIds.includes(notifId) && !item.isUnreadApproval,
          type: isApproved ? 'canteen_topup_approved' : 'canteen_topup_rejected',
          link: '/kantin/top-up-saldo',
        };
      });
  } catch (err) {
    console.error('Gagal mengambil notifikasi operator kantin:', err);
    return [];
  }
}

/**
 * Mengambil daftar notifikasi dari backend & disinkronkan dengan event lokal
 */
export const getNotifications = async () => {
  let backendList = [];
  try {
    const res = await apiFetch(NOTIFICATIONS_ENDPOINT);
    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.notifications)
            ? res.notifications
            : [];

    backendList = rawList.map(mapNotificationItem).filter(Boolean);
  } catch (error) {
    if (error?.status === 401) {
      logout();
      throw error;
    }
    // console.log('[NotificationService] Fallback notifikasi lokal/kosong:', error?.message || error);
  }

  // Cek peran pengguna
  const user = getAuthUser();
  const role = user?.role?.toLowerCase() || '';

  // Jika superadmin, sertakan notifikasi permintaan topup kantin yang menunggu konfirmasi
  let combined = [...backendList];
  if (role === 'superadmin' || role.includes('super')) {
    const topupNotifs = getCanteenTopupNotifications();
    combined = [...topupNotifs, ...combined];
  } else if (role === 'kantin' || role.includes('canteen') || role.includes('operator')) {
    const kantinNotifs = getCanteenOperatorNotifications();
    combined = [...kantinNotifs, ...combined];
  }

  return combined;
};

/**
 * Simpan ID notifikasi yang sudah dibaca
 */
export const markNotificationAsRead = (id) => {
  try {
    const readIds = getReadNotifIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(readIds));
    }
  } catch (err) {
    console.error('Error marking notif as read:', err);
  }
};

/**
 * Tandai semua notifikasi sebagai dibaca
 */
export const markAllNotificationsAsRead = (allIds = []) => {
  try {
    const readIds = getReadNotifIds();
    const merged = Array.from(new Set([...readIds, ...allIds]));
    localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Error marking all notifs as read:', err);
  }
};

export default {
  NOTIFICATIONS_ENDPOINT,
  mapNotificationItem,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
