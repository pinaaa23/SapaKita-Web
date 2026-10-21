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
    let items = res?.items || res?.data || (Array.isArray(res) ? res : []);

    // Sinkronisasi dengan status terbaru dari Superadmin (jika disetujui/ditolak di storage)
    try {
      if (typeof window !== 'undefined') {
        const rawNat = localStorage.getItem('pascall_superadmin_canteen_history_v1');
        if (rawNat) {
          const natList = JSON.parse(rawNat);
          if (Array.isArray(natList)) {
            items = items.map((item) => {
              const matched = natList.find((n) => String(n.id) === String(item.id));
              if (matched && matched.status) {
                return {
                  ...item,
                  status: matched.status,
                  rejectReason: matched.rejectReason || item.rejectReason,
                };
              }
              return item;
            });
          }
        }
      }
    } catch (_) {}

    return items;
  } catch (err) {
    console.warn('[TagihanService] Gagal memuat riwayat pembayaran:', err);
    try {
      if (typeof window !== 'undefined') {
        const rawNat = localStorage.getItem('pascall_superadmin_canteen_history_v1');
        if (rawNat) {
          const parsed = JSON.parse(rawNat);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (_) {}
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
export async function submitTagihanPayment({ nominal, minutes = 1, bankTarget, proofFile, billingMonth, billingYear }) {
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
  if (billingMonth) formData.append('billingMonth', String(billingMonth));
  if (billingYear) formData.append('billingYear', String(billingYear));

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
    return { status: 'UNKNOWN', label: 'Memuat...', canPay: false, badgeColor: 'slate', remainingAmount: 0, totalApproved: 0 };
  }

  const totalAmount = Number(billingData?.summary?.totalAmount || 0);
  const isCurrentMonth = billingData.billingStatus === 'BERJALAN';

  // Jika nominal 0 pada bulan yang sudah lalu: otomatis lunas (tidak ada kewajiban bayar)
  if (!isCurrentMonth && totalAmount <= 0) {
    return { status: 'LUNAS', label: 'Lunas', canPay: false, badgeColor: 'emerald', remainingAmount: 0, totalApproved: 0 };
  }

  // Hitung total akumulasi nominal pembayaran yang telah di-ACC (APPROVED)
  const approvedPayments = paymentHistory.filter((p) => p && p.status === 'APPROVED');
  const totalApproved = approvedPayments.reduce((sum, p) => sum + Number(p.nominal || p.totalBayar || 0), 0);

  // Cek apakah ada pembayaran yang sedang PENDING menunggu ACC Superadmin
  const pendingPayment = paymentHistory.find((p) => p && p.status === 'PENDING');

  // Cek apakah ada penolakan pembayaran yang belum diselesaikan
  const rejectedPayment = paymentHistory.find((p) => p && p.status === 'REJECTED');

  // Sisa tagihan yang belum terbayar (selisih total transaksi dikurangi yang telah di-ACC)
  const remainingAmount = Math.max(0, totalAmount - totalApproved);

  // 1. Jika ada pembayaran yang sedang PENDING menunggu ACC
  if (pendingPayment) {
    return {
      status: 'PENDING',
      label: 'Menunggu Konfirmasi Superadmin',
      canPay: false,
      badgeColor: 'amber',
      paymentItem: pendingPayment,
      remainingAmount,
      totalApproved,
    };
  }

  // 2. Jika ada sisa tagihan berjalan yang belum dibayar (termasuk penjualan baru setelah ACC sebelumnya)
  if (remainingAmount > 0) {
    return {
      status: 'BERJALAN',
      label: totalApproved > 0 ? 'Sebagian Lunas (Ada Tagihan Baru)' : (isCurrentMonth ? 'Bulan Berjalan' : 'Belum Dibayar'),
      canPay: true,
      badgeColor: totalApproved > 0 ? 'amber' : (isCurrentMonth ? 'blue' : 'rose'),
      remainingAmount,
      totalApproved,
      paymentItem: approvedPayments[0] || null,
    };
  }

  // 3. Jika sisa tagihan 0 dan ada riwayat penjualan yang telah lunas di-ACC
  if (remainingAmount === 0 && totalAmount > 0) {
    return {
      status: 'LUNAS',
      label: 'Lunas',
      canPay: false,
      badgeColor: 'emerald',
      paymentItem: approvedPayments[0] || null,
      remainingAmount: 0,
      totalApproved,
    };
  }

  // 4. Jika ada penolakan pembayaran
  if (rejectedPayment) {
    return {
      status: 'REJECTED',
      label: 'Ditolak',
      canPay: true,
      badgeColor: 'rose',
      paymentItem: rejectedPayment,
      rejectReason: rejectedPayment.rejectReason || 'Bukti pembayaran tidak sesuai atau tidak valid.',
      remainingAmount: totalAmount,
      totalApproved,
    };
  }

  return {
    status: isCurrentMonth ? 'BERJALAN' : 'UNPAID',
    label: isCurrentMonth ? 'Bulan Berjalan' : 'Belum Dibayar',
    canPay: totalAmount > 0,
    badgeColor: isCurrentMonth ? 'blue' : 'rose',
    remainingAmount: totalAmount,
    totalApproved: 0,
  };
}
