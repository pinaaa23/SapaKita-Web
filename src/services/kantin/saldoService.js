/**
 * Saldo Service — PasCall Kantin
 * ================================
 * Service layer untuk manajemen kuota menit kantin dan pengajuan top up ke Backend REST API.
 * Menghubungkan langsung ke:
 * - GET  /api/canteen/balance          (Cek sisa kuota menit kantin)
 * - GET  /api/canteen/topups           (Riwayat pengajuan top up menit)
 * - POST /api/canteen/topups           (Pengajuan top up menit dengan upload bukti transfer)
 */

import { apiFetch, getAuthUser } from '../api';
import {
  PPN_RATE,
  SALDO_MINIMUM_WARNING,
  NOMINAL_TOPUP_OPTIONS,
  getMenitFromNominal,
} from '../../dummy/saldoDummy';

// Re-export konstanta agar komponen kompatibel
export { PPN_RATE, SALDO_MINIMUM_WARNING, NOMINAL_TOPUP_OPTIONS, getMenitFromNominal };

const CANTEEN_TX_STORAGE_KEY = 'pascall_canteen_local_transactions_v1';

/**
 * Menghitung total kuota menit yang terpotong dari transaksi lokal kasir
 */
export function getLocalTransactionsTotalMinutes() {
  try {
    const raw = localStorage.getItem(CANTEEN_TX_STORAGE_KEY);
    if (!raw) return 0;
    const txs = JSON.parse(raw);
    if (!Array.isArray(txs)) return 0;
    let total = 0;
    for (const tx of txs) {
      if (tx?.isLocalFallback !== false) {
        const durasiStr = tx?.paket?.durasi || '';
        const durasiNum = parseInt(durasiStr) || Number(tx?.paket?.durationMinutes) || Number(tx?.paket?.menit) || 0;
        total += durasiNum;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

// Cache in-memory untuk sinkronisasi instan & subscribers UI
let cachedSaldoMenit = 0;
let isSaldoInitialized = false;

// Subscribers untuk update realtime (SaldoBadgeSidebar, PaketPage, dsb)
const subscribers = [];

function notifySubscribers(saldo) {
  cachedSaldoMenit = Math.max(0, Number(saldo) || 0);
  isSaldoInitialized = true;
  subscribers.forEach((cb) => {
    try {
      cb(cachedSaldoMenit);
    } catch (err) {
      console.error('[SaldoService] Subscriber error:', err);
    }
  });
}

/**
 * Mengurangi saldo menit kantin secara instan di UI dan memicu subscribers
 * @param {number} durasiMenit - jumlah menit yang dipotong
 */
export function kurangiSaldoKantin(durasiMenit) {
  const durasi = Math.max(0, Number(durasiMenit) || 0);
  if (durasi > 0) {
    const newSaldo = Math.max(0, cachedSaldoMenit - durasi);
    notifySubscribers(newSaldo);
    return newSaldo;
  }
  return cachedSaldoMenit;
}

// Listener custom event jika ada transaksi kantin tersimpan
if (typeof window !== 'undefined') {
  window.addEventListener('canteen_transaction_saved', (event) => {
    const tx = event?.detail;
    const durasi = parseInt(tx?.paket?.durasi) || Number(tx?.paket?.durationMinutes) || 0;
    if (durasi > 0) {
      kurangiSaldoKantin(durasi);
    }
  });
}

/**
 * Subscribe untuk menerima update saldo secara realtime.
 * @param {Function} callback - menerima saldo kuota menit (number)
 * @returns {Function} unsubscribe
 */
export function subscribeSaldoUpdate(callback) {
  subscribers.push(callback);
  if (isSaldoInitialized) {
    callback(cachedSaldoMenit);
  }
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx > -1) subscribers.splice(idx, 1);
  };
}

/**
 * Mengambil saldo kuota menit secara sinkron dari cache lokal.
 * Berguna saat komponen pertama kali render sebelum fetch BE selesai.
 * @returns {number}
 */
export function getSaldoSync() {
  return cachedSaldoMenit;
}

/**
 * Mengambil sisa kuota saldo menit kantin dari Backend.
 * Murni merefleksikan nilai dari GET /api/canteen/balance.
 * @returns {Promise<number>}
 */
export async function getSaldo() {
  try {
    const res = await apiFetch('/api/canteen/balance');
    const balance = res?.data?.balanceMinutes ?? res?.balanceMinutes ?? 0;
    const numBalance = Number(balance) || 0;

    notifySubscribers(numBalance);
    return numBalance;
  } catch (err) {
    console.error('[SaldoService] Gagal mengambil saldo dari BE:', err?.message || err);
    if (cachedSaldoMenit > 0) {
      return cachedSaldoMenit;
    }
    throw err;
  }
}

/**
 * Mengambil daftar riwayat top up dari Backend.
 * Endpoint: GET /api/canteen/topups
 * @param {Object} [params] - { status, page, limit }
 * @returns {Promise<Array>}
 */
export async function getRiwayatTopUp(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') {
      query.append('status', params.status.toUpperCase());
    }
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = qs ? `/api/canteen/topups?${qs}` : '/api/canteen/topups';
    const res = await apiFetch(endpoint);

    const items = res?.data || [];
    // Normalisasi format untuk konsumsi komponen
    return items.map((item) => ({
      id: item.id,
      tanggal: item.createdAt,
      nominal: Number(item.nominal) || 0,
      ppn: Math.round((Number(item.nominal) || 0) * PPN_RATE),
      totalBayar: Number(item.nominal) + Math.round((Number(item.nominal) || 0) * PPN_RATE),
      menit: Number(item.minutes) || getMenitFromNominal(item.nominal),
      bankTarget: item.bankTarget || 'Rekening Lapas',
      proofUrl: item.proofUrl || null,
      status: item.status, // 'PENDING' | 'APPROVED' | 'REJECTED'
      rejectReason: item.rejectReason || null,
      approvedAt: item.approvedAt || null,
      branchName: item.branchName || '',
      user: item.user || null,
    }));
  } catch (err) {
    console.error('[SaldoService] Gagal mengambil riwayat top up:', err?.message || err);
    throw err;
  }
}

/**
 * Memproses pengajuan top up kuota saldo menit kantin ke Backend.
 * Endpoint: POST /api/canteen/topups (FormData)
 *
 * @param {Object} payload
 * @param {number} payload.nominal - Nominal rupiah (contoh: 500000)
 * @param {number} payload.minutes - Jumlah menit kuota
 * @param {string} payload.bankTarget - Nama bank / tujuan transfer
 * @param {File} payload.proofFile - Berkas bukti transfer (gambar/PDF max 10MB)
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function prosesTopUp({ nominal, minutes, bankTarget = 'BCA - Kasir Kantin', proofFile }) {
  if (!nominal || Number(nominal) <= 0) {
    throw new Error('Nominal top up harus lebih besar dari 0');
  }
  if (!minutes || Number(minutes) <= 0) {
    throw new Error('Jumlah kuota menit harus lebih besar dari 0');
  }
  if (!proofFile) {
    throw new Error('Bukti transfer wajib diunggah');
  }

  // Validasi ukuran file (maksimal 10MB sesuai backend Multer)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (proofFile.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file bukti transfer maksimal 10 MB');
  }

  // Validasi tipe berkas
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (proofFile.type && !allowedTypes.includes(proofFile.type)) {
    throw new Error('Format file bukti harus berupa JPG, PNG, WEBP, atau PDF');
  }

  const formData = new FormData();
  formData.append('nominal', String(nominal));
  formData.append('minutes', String(minutes));
  formData.append('bankTarget', String(bankTarget));
  formData.append('proofFile', proofFile);

  try {
    const res = await apiFetch('/api/canteen/topups', {
      method: 'POST',
      body: formData,
    });

    return {
      success: true,
      data: res?.data || res,
    };
  } catch (err) {
    console.error('[SaldoService] Gagal mengirim pengajuan top up:', err);
    throw err;
  }
}

/**
 * Cek ketersediaan kuota menit kantin (advisory di FE).
 * TIDAK memotong saldo lokal. Keputusan akhir pemotongan kuota dilakukan oleh BE.
 *
 * @param {number} durasiMenit - Durasi menit dari paket yang dibeli WBP
 * @returns {{ cukup: boolean, saldoSekarang: number }}
 */
export function cekDanPotongSaldo(durasiMenit) {
  const durasi = Math.max(1, Number(durasiMenit) || 5);
  const saldoSekarang = cachedSaldoMenit;
  return {
    cukup: saldoSekarang >= durasi,
    saldoSekarang,
    saldoSetelah: Math.max(0, saldoSekarang - durasi),
  };
}

/**
 * Helper kompatibilitas untuk unread badge
 */
export function getUnreadApprovedTopupCountSync() {
  return 0;
}

export function markApprovedTopupsAsRead() {
  // Ditangani terpusat oleh sistem notifikasi backend
}
