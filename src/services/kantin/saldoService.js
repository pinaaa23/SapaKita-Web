/**
 * Saldo Service — PasCall Kantin
 * ================================
 * Service layer untuk semua operasi saldo kantin.
 *
 * PENTING:
 * Fitur saldo SELALU memakai data dummy selama endpoint BE saldo belum ada,
 * WALAUPUN saklar VITE_USE_DUMMY dalam keadaan mati.
 * Ini berbeda dengan service lain (kantinService, wartelService) yang mengecek isDummyMode().
 *
 * CARA MIGRASI KE BACKEND NANTI:
 * 1. Ganti isi fungsi getSaldo()           → panggil GET /api/canteen/saldo
 * 2. Ganti isi fungsi getRiwayatTopUp()    → panggil GET /api/canteen/saldo/riwayat
 * 3. Ganti isi fungsi prosesTopUp()        → panggil POST /api/canteen/saldo/topup
 * 4. Ganti isi fungsi cekDanPotongSaldo()  → panggil POST /api/canteen/saldo/potong
 * 5. Hapus import dari saldoDummy.js dan localStorage usage
 */

import {
  PPN_RATE,
  SALDO_AWAL,
  SALDO_MINIMUM_WARNING,
  NOMINAL_TOPUP_OPTIONS,
  getMenitFromNominal,
} from '../../dummy/saldoDummy';
import { getAuthUser } from '../api';

// Re-export konstanta agar komponen cukup import dari service ini
export { PPN_RATE, SALDO_MINIMUM_WARNING, NOMINAL_TOPUP_OPTIONS, getMenitFromNominal };

const STORAGE_KEY_SALDO_PREFIX = 'pascall_kantin_saldo';
const STORAGE_KEY_RIWAYAT_PREFIX = 'pascall_kantin_saldo_riwayat';

// Helper mendapatkan storage key unik per akun operator kantin
function getUserScopedKey(baseKey) {
  try {
    const user = getAuthUser();
    const identifier = user?.id || user?.email || user?.name || 'default_canteen';
    const cleanId = String(identifier).toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    return `${baseKey}_${cleanId}`;
  } catch {
    return `${baseKey}_default`;
  }
}

// Simulasi delay network
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Subscribers untuk reactive update (dipakai oleh sidebar badge) ---
const subscribers = [];

function notifySubscribers(saldo) {
  subscribers.forEach((cb) => cb(saldo));
}

/**
 * Subscribe untuk menerima update saldo secara realtime.
 * Digunakan oleh SaldoBadgeSidebar.
 * @param {Function} callback - menerima saldo kuota menit (number)
 * @returns {Function} unsubscribe
 */
export function subscribeSaldoUpdate(callback) {
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx > -1) subscribers.splice(idx, 1);
  };
}

// --- Internal helpers ---

function getStoredSaldo() {
  try {
    const key = getUserScopedKey(STORAGE_KEY_SALDO_PREFIX);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      localStorage.setItem(key, JSON.stringify(SALDO_AWAL));
      return SALDO_AWAL;
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' && !isNaN(parsed) ? parsed : SALDO_AWAL;
  } catch {
    return SALDO_AWAL;
  }
}

function saveStoredSaldo(nilai) {
  try {
    const key = getUserScopedKey(STORAGE_KEY_SALDO_PREFIX);
    localStorage.setItem(key, JSON.stringify(nilai));
    notifySubscribers(nilai);
  } catch (err) {
    console.error('Error saving saldo to localStorage:', err);
  }
}

function getStoredRiwayat() {
  try {
    const key = getUserScopedKey(STORAGE_KEY_RIWAYAT_PREFIX);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredRiwayat(data) {
  try {
    const key = getUserScopedKey(STORAGE_KEY_RIWAYAT_PREFIX);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving riwayat to localStorage:', err);
  }
}

// =============================================================================
// PUBLIC API — Ganti isi fungsi-fungsi di bawah ini saat migrasi ke backend
// =============================================================================

/**
 * Mengambil sisa kuota saldo menit kantin saat ini.
 * TODO BE: Ganti dengan GET /api/canteen/saldo
 * @returns {Promise<number>}
 */
export async function getSaldo() {
  await delay(150);
  return getStoredSaldo();
}

/**
 * Mengambil saldo kuota menit secara sinkron (untuk pengecekan cepat di komponen).
 * TODO BE: Hapus fungsi ini, gunakan getSaldo() async saja.
 * @returns {number}
 */
export function getSaldoSync() {
  return getStoredSaldo();
}

/**
 * Mengambil daftar riwayat top up, diurutkan terbaru di atas.
 * TODO BE: Ganti dengan GET /api/canteen/saldo/riwayat
 * @returns {Promise<Array>}
 */
export async function getRiwayatTopUp() {
  await delay(200);
  const list = getStoredRiwayat();

  // Sinkronisasi status dari riwayat Superadmin nasional jika sudah dikonfirmasi/ditolak
  try {
    const NAT_KEY = 'pascall_superadmin_canteen_history_v1';
    const rawNat = localStorage.getItem(NAT_KEY);
    if (rawNat) {
      const natList = JSON.parse(rawNat);
      if (Array.isArray(natList)) {
        let changed = false;
        list.forEach((item) => {
          const matchingNat = natList.find((n) => n.id === item.id);
          if (matchingNat && matchingNat.status !== item.status) {
            item.status = matchingNat.status;
            if (matchingNat.status === 'Berhasil') {
              item.isUnreadApproval = true;
              item.approvedAt = matchingNat.approvedAt || new Date().toISOString();
            }
            changed = true;
          }
          if (matchingNat && !item.menit && matchingNat.menit) {
            item.menit = matchingNat.menit;
            changed = true;
          }
        });
        if (changed) {
          saveStoredRiwayat(list);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
          }
        }
      }
    }
  } catch (e) {
    console.error('Error syncing canteen top up history with superadmin:', e);
  }

  list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  return list;
}

/**
 * Mendapatkan jumlah dana top up yang baru disetujui (belum dibaca/diakui kasir).
 * Digunakan untuk badge menu kantin & notifikasi.
 * @returns {number}
 */
export function getUnreadApprovedTopupCountSync() {
  try {
    const key = getUserScopedKey(STORAGE_KEY_RIWAYAT_PREFIX);
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return 0;

    return list.filter((item) => item.status === 'Berhasil' && item.isUnreadApproval === true).length;
  } catch {
    return 0;
  }
}

/**
 * Menandai semua notifikasi dana masuk yang telah disetujui sebagai sudah dibaca.
 */
export function markApprovedTopupsAsRead() {
  try {
    const key = getUserScopedKey(STORAGE_KEY_RIWAYAT_PREFIX);
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;

    let modified = false;
    list.forEach((item) => {
      if (item.isUnreadApproval) {
        item.isUnreadApproval = false;
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem(key, JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
      }
    }
  } catch (err) {
    console.error('Error marking approved topups as read:', err);
  }
}

/**
 * Memproses pengajuan top up kuota saldo menit kantin.
 * Kuota menit TIDAK langsung bertambah saat pengajuan; menunggu persetujuan (approval) Superadmin.
 * TODO BE: Ganti dengan POST /api/canteen/saldo/topup
 *
 * @param {number} nominal - Nominal saldo rupiah yang dipilih (misal 500000, 1000000, 2000000)
 * @param {number} [customMenit] - Jumlah menit yang didapatkan
 * @returns {Promise<{ success: boolean, pending: boolean, saldoBaru: number, topup: object }>}
 */
export async function prosesTopUp(nominal, customMenit) {
  await delay(400);

  const ppn = Math.round(nominal * PPN_RATE);
  const totalBayar = nominal + ppn;
  const menit = customMenit || getMenitFromNominal(nominal);

  const user = getAuthUser();
  const userKey = getUserScopedKey('').replace(/^_/, '');
  const saldoSaatIni = getStoredSaldo();

  // Buat entri riwayat baru
  const riwayat = getStoredRiwayat();
  const txId = `TPU-${Date.now().toString().slice(-6)}`;

  const branchName =
    user?.branch?.name ||
    user?.branchName ||
    (typeof user?.branch === 'string' ? user.branch : '') ||
    user?.uptName ||
    'Lapas Kelas II Yogyakarta';
  const staffName = user?.name || 'Operator Kantin';
  const staffEmail = user?.email || '-';

  const entriBaru = {
    id: txId,
    tanggal: new Date().toISOString(),
    nominal,
    ppn,
    totalBayar,
    menit,
    status: 'Menunggu', // Menunggu persetujuan Super Administrator
    branchId: user?.branchId || user?.branch?.id || 'b1',
    branchName,
    staffName,
    staffEmail,
  };

  const updatedRiwayat = [entriBaru, ...riwayat];
  saveStoredRiwayat(updatedRiwayat);

  // Masukkan pengajuan ke riwayat Superadmin nasional
  try {
    const NAT_KEY = 'pascall_superadmin_canteen_history_v1';
    const rawNat = localStorage.getItem(NAT_KEY);
    let natList = rawNat ? JSON.parse(rawNat) : [];
    if (!Array.isArray(natList)) natList = [];

    const natEntry = {
      id: txId,
      tanggal: new Date().toISOString(),
      branchId: user?.branchId || user?.branch?.id || 'b1',
      branchName,
      staffName,
      staffEmail,
      userKey,
      nominal,
      ppn,
      totalBayar,
      menit,
      status: 'Menunggu',
    };

    natList = [natEntry, ...natList.filter((item) => item.id !== txId)];
    localStorage.setItem(NAT_KEY, JSON.stringify(natList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
    }
  } catch (err) {
    console.error('Error recording national top up history:', err);
  }

  return {
    success: true,
    pending: true,
    saldoBaru: saldoSaatIni,
    topup: entriBaru,
  };
}

/**
 * Cek apakah kuota menit kasir cukup untuk menjual paket komunikasi ke WBP, dan potong durasi menitnya.
 *
 * @param {number} durasiMenit - Durasi menit dari paket yang dibeli WBP (misal 5 menit, 6 menit, 12 menit)
 * @returns {{ cukup: boolean, saldoSekarang: number, saldoSetelah: number }}
 */
export function cekDanPotongSaldo(durasiMenit) {
  const durasi = Math.max(1, Number(durasiMenit) || 5);
  const saldoSekarang = getStoredSaldo();

  if (saldoSekarang < durasi) {
    return {
      cukup: false,
      saldoSekarang,
      saldoSetelah: saldoSekarang,
    };
  }

  const saldoSetelah = saldoSekarang - durasi;
  saveStoredSaldo(saldoSetelah);

  return {
    cukup: true,
    saldoSekarang,
    saldoSetelah,
  };
}
