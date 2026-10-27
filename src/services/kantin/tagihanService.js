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
    let items = [];
    if (Array.isArray(res?.data?.items)) items = res.data.items;
    else if (Array.isArray(res?.data?.data)) items = res.data.data;
    else if (Array.isArray(res?.data)) items = res.data;
    else if (Array.isArray(res?.items)) items = res.items;
    else if (Array.isArray(res)) items = res;

    // Sinkronisasi dengan status terbaru dari Admin Finance (jika disetujui/ditolak di storage)
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
 * // TODO: sambungkan ke endpoint finance saat BE siap (misal POST /api/finance/canteen-topups)
 * Endpoint saat ini: POST /api/canteen/topups (FormData multipart)
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
    const resultData = res?.data || res;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
      window.dispatchEvent(new CustomEvent('finance_billing_updated'));
    }
    return resultData;
  } catch (err) {
    console.warn('[TagihanService] Gagal POST ke API, beralih ke penyimpanan lokal:', err?.message || err);
    // Fallback penyimpanan lokal
    try {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user') || localStorage.getItem('pascall_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const fakeId = `TOPUP-${Date.now()}`;
        const newLocalPayment = {
          id: fakeId,
          nominal: Number(nominal),
          minutes: Number(minutes) || 1,
          bankTarget: String(bankTarget),
          proofUrl: proofFile ? URL.createObjectURL(proofFile) : null,
          billingMonth: Number(billingMonth) || new Date().getMonth() + 1,
          billingYear: Number(billingYear) || new Date().getFullYear(),
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          branchId: user?.branchId || user?.branch?.id || 'b1',
          branchName: user?.branchName || user?.branch?.name || 'Cabang Lapas',
          staffName: user?.name || 'Operator Kantin',
          canteenName: user?.canteenName || user?.name || 'Kantin Lapas',
        };

        const existingRaw = localStorage.getItem('pascall_superadmin_canteen_history_v1');
        const list = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [newLocalPayment, ...(Array.isArray(list) ? list : [])];
        localStorage.setItem('pascall_superadmin_canteen_history_v1', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
        window.dispatchEvent(new CustomEvent('finance_billing_updated'));
        return newLocalPayment;
      }
    } catch (storeErr) {
      console.error('[TagihanService] Fallback storage error:', storeErr);
    }
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

  // Cek apakah ada pembayaran yang sedang PENDING menunggu ACC Admin Finance
  const pendingPayment = paymentHistory.find((p) => p && p.status === 'PENDING');

  // Cek apakah ada penolakan pembayaran yang belum diselesaikan
  const rejectedPayment = paymentHistory.find((p) => p && p.status === 'REJECTED');

  // Sisa tagihan yang belum terbayar (selisih total transaksi dikurangi yang telah di-ACC)
  const remainingAmount = Math.max(0, totalAmount - totalApproved);

  // 1. Jika ada pembayaran yang sedang PENDING menunggu ACC
  if (pendingPayment) {
    return {
      status: 'PENDING',
      label: 'Menunggu Konfirmasi Admin Finance',
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
