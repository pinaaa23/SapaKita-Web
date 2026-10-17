import { apiFetch, logout } from '../api';

/**
 * Mengambil data rekapitulasi tagihan bulanan kantin (Pascabayar)
 * Endpoint: GET /api/canteen/billing/monthly?month=X&year=Y
 *
 * @param {number} month - 1 sampai 12
 * @param {number} year - contoh 2026
 * @returns {Promise<Object>}
 */
export async function getMonthlyBilling(month, year) {
  try {
    const res = await apiFetch(`/api/canteen/billing/monthly?month=${month}&year=${year}`);
    return res?.data || res || null;
  } catch (err) {
    if (err?.status === 401) {
      logout();
      throw err;
    }
    console.error('[TagihanService] Gagal memuat tagihan bulanan:', err);
    throw err;
  }
}

/**
 * Mengambil riwayat pengajuan pembayaran tagihan dari server
 * Endpoint: GET /api/canteen/topups
 *
 * @returns {Promise<Array>}
 */
export async function getPaymentHistory() {
  try {
    const res = await apiFetch('/api/canteen/topups?limit=50');
    const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
    return items;
  } catch (err) {
    console.warn('[TagihanService] Gagal memuat riwayat pembayaran:', err);
    return [];
  }
}

/**
 * Mengirim bukti pembayaran tagihan bulanan ke Backend
 * Endpoint: POST /api/canteen/topups (FormData multipart)
 *
 * @param {Object} payload
 * @param {number} payload.nominal - Total tagihan rupiah
 * @param {number} payload.minutes - Total menit terakumulasi
 * @param {string} payload.bankTarget - Metode pembayaran yang dipilih
 * @param {File} payload.proofFile - Berkas bukti transfer (gambar/PDF max 2MB)
 * @returns {Promise<Object>}
 */
export async function submitTagihanPayment({ nominal, minutes = 1, bankTarget, proofFile }) {
  if (!nominal || Number(nominal) <= 0) {
    throw new Error('Nominal tagihan harus lebih besar dari 0.');
  }
  if (!bankTarget) {
    throw new Error('Metode pembayaran wajib dipilih.');
  }
  if (!proofFile) {
    throw new Error('File bukti pembayaran wajib diunggah.');
  }

  // Validasi ukuran berkas maksimal 2 MB sesuai spesifikasi
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  if (proofFile.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file bukti pembayaran melebihi batas maksimal 2 MB.');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
  ];
  if (proofFile.type && !allowedTypes.includes(proofFile.type)) {
    throw new Error('Format file bukti harus berupa gambar (JPG, PNG, WEBP) atau PDF.');
  }

  const formData = new FormData();
  formData.append('nominal', String(nominal));
  formData.append('minutes', String(minutes > 0 ? minutes : 1));
  formData.append('bankTarget', String(bankTarget));
  formData.append('proofFile', proofFile);

  try {
    const res = await apiFetch('/api/canteen/topups', {
      method: 'POST',
      body: formData,
    });
    return res?.data || res;
  } catch (err) {
    console.error('[TagihanService] Gagal mengirim bukti pembayaran:', err);
    throw err;
  }
}

/**
 * Menentukan status pembayaran tagihan berdasarkan data tagihan dan riwayat pembayaran di server
 *
 * @param {Object} billingData - Objek tagihan dari /api/canteen/billing/monthly
 * @param {Array} paymentHistory - Array riwayat pembayaran dari /api/canteen/topups
 * @returns {{ status: string, label: string, canPay: boolean, badgeColor: string, paymentItem?: Object, rejectReason?: string }}
 */
export function determineBillingStatus(billingData, paymentHistory = []) {
  if (!billingData) {
    return { status: 'UNKNOWN', label: 'Memuat...', canPay: false, badgeColor: 'slate' };
  }

  const totalAmount = Number(billingData?.summary?.totalAmount || 0);
  const isCurrentMonth = billingData.billingStatus === 'BERJALAN';

  // Jika nominal 0 pada bulan yang sudah lalu: otomatis lunas (tidak ada kewajiban bayar)
  if (!isCurrentMonth && totalAmount <= 0) {
    return { status: 'LUNAS', label: 'Lunas', canPay: false, badgeColor: 'emerald' };
  }

  // Cari apakah ada data pembayaran yang diajukan untuk nominal atau periode ini
  // Filter pembayaran yang cocok berdasarkan nominal atau tanggal dalam periode tagihan
  const matchingPayments = paymentHistory.filter((p) => {
    if (!p) return false;
    // Cocokkan nominal atau bankTarget
    const pNominal = Number(p.nominal || 0);
    return Math.abs(pNominal - totalAmount) < 100 || (pNominal > 0 && totalAmount > 0);
  });

  const approvedPayment = matchingPayments.find((p) => p.status === 'APPROVED');
  if (approvedPayment) {
    return {
      status: 'LUNAS',
      label: 'Lunas',
      canPay: false,
      badgeColor: 'emerald',
      paymentItem: approvedPayment,
    };
  }

  const pendingPayment = matchingPayments.find((p) => p.status === 'PENDING');
  if (pendingPayment) {
    return {
      status: 'PENDING',
      label: 'Menunggu Konfirmasi Superadmin',
      canPay: false,
      badgeColor: 'amber',
      paymentItem: pendingPayment,
    };
  }

  const rejectedPayment = matchingPayments.find((p) => p.status === 'REJECTED');
  if (rejectedPayment) {
    return {
      status: 'REJECTED',
      label: 'Ditolak',
      canPay: true,
      badgeColor: 'rose',
      paymentItem: rejectedPayment,
      rejectReason: rejectedPayment.rejectReason || 'Bukti pembayaran tidak sesuai atau tidak valid.',
    };
  }

  // Belum ada pengajuan pembayaran
  if (isCurrentMonth) {
    return {
      status: 'BERJALAN',
      label: 'Bulan Berjalan',
      canPay: totalAmount > 0,
      badgeColor: 'blue',
    };
  }

  return {
    status: 'UNPAID',
    label: 'Belum Dibayar',
    canPay: true,
    badgeColor: 'rose',
  };
}
