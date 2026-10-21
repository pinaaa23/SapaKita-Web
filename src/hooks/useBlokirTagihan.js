import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { isCanteenContractConfigured, getStoredContracts } from '../dummy/canteenContractMock';

/**
 * ATURAN TUNGGAL PENENTU BLOKIR TRANSAKSI:
 * Diblokir jika ada tagihan dari bulan yang SUDAH BERLALU yang belum lunas
 * (termasuk status: belum dibayar, menunggu konfirmasi, dan ditolak).
 * Tagihan bulan berjalan TIDAK memblokir.
 * JANGAN terapkan status Telat/blokir otomatis untuk kantin yang kontraknya belum diatur.
 *
 * @param {Object} prevMonthBilling - Data tagihan dari BE untuk bulan sebelumnya
 * @param {Array} paymentHistory - Riwayat pembayaran dari BE (/api/canteen/topups)
 * @returns {{ isBlocked: boolean, blockedPeriod: string, reason: string }}
 */
export function cekStatusBlokirTagihan(prevMonthBilling, paymentHistory = [], checkDate = new Date()) {
  if (!prevMonthBilling) {
    return { isBlocked: false, isDueSoon: false, daysLeft: 0, blockedPeriod: '', reason: '' };
  }

  // Kantin dengan kontrak belum diatur tidak boleh diblokir
  if (prevMonthBilling.isContractSet === false || !isCanteenContractConfigured(prevMonthBilling)) {
    return { isBlocked: false, isDueSoon: false, daysLeft: 0, blockedPeriod: '', reason: '' };
  }

  const totalAmount = Number(prevMonthBilling?.summary?.totalAmount ?? prevMonthBilling?.totalAmount ?? 0);
  // Jika tagihan bulan lalu 0 (tidak ada penjualan / sudah beres), maka tidak diblokir
  if (totalAmount <= 0) {
    return { isBlocked: false, isDueSoon: false, daysLeft: 0, blockedPeriod: '', reason: '' };
  }

  // Cek apakah ada pembayaran yang sudah disetujui (APPROVED / LUNAS)
  const isLunas = paymentHistory.some((p) => p.status === 'APPROVED');
  if (isLunas) {
    return { isBlocked: false, isDueSoon: false, daysLeft: 0, blockedPeriod: '', reason: '' };
  }

  const hasPending = paymentHistory.some((p) => p.status === 'PENDING');
  const hasRejected = paymentHistory.some((p) => p.status === 'REJECTED');

  const periodName = prevMonthBilling.period || 'Bulan Lalu';
  const dayOfMonth = checkDate.getDate();

  // Jika pembayaran ditolak oleh Superadmin, langsung blokir
  if (hasRejected) {
    return {
      isBlocked: true,
      isDueSoon: false,
      daysLeft: 0,
      blockedPeriod: periodName,
      reason: `Transaksi diblokir: bukti pembayaran tagihan periode ${periodName} ditolak oleh Superadmin. Segera unggah ulang bukti transfer yang valid di menu Tagihan.`,
    };
  }

  // Aturan Jatuh Tempo Maksimal 2 Hari:
  // Tanggal 1 & 2: masa tenggang (jatuh tempo max 2 hari), kasir diberi peringatan jatuh tempo.
  // Mulai tanggal 3 dan seterusnya (lewat 2 hari): jika belum bayar / belum disetujui, akses penjualan diblokir.
  if (dayOfMonth > 2) {
    const statusMsg = hasPending 
      ? 'sedang menunggu konfirmasi Superadmin' 
      : 'belum dibayar dan telah melewati batas jatuh tempo (maksimal 2 hari)';
    return {
      isBlocked: true,
      isDueSoon: false,
      daysLeft: 0,
      blockedPeriod: periodName,
      reason: `Transaksi diblokir: tagihan periode ${periodName} ${statusMsg}. Selesaikan pembayaran di menu Tagihan Bulanan.`,
    };
  } else {
    const remainingDays = 3 - dayOfMonth; // Tanggal 1 sisa 2 hari, tanggal 2 sisa 1 hari
    return {
      isBlocked: false,
      isDueSoon: true,
      daysLeft: remainingDays,
      blockedPeriod: periodName,
      reason: `Peringatan Jatuh Tempo: Tagihan periode ${periodName} belum lunas (jatuh tempo maksimal 2 hari, tersisa ${remainingDays} hari). Segera selesaikan transfer agar penjualan paket tidak ditangguhkan.`,
    };
  }
}

/**
 * Hook useBlokirTagihan
 * Mengecek status tagihan bulan lalu dari server secara riil untuk memblokir penjualan voucher.
 */
export function useBlokirTagihan() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDueSoon, setIsDueSoon] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [blockedPeriod, setBlockedPeriod] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [overdueInvoiceCount, setOverdueInvoiceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const checkBlokir = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Panggil endpoint resmi Backend: GET /api/canteen/billing/status-block
      const res = await apiFetch('/api/canteen/billing/status-block');
      const data = res?.data || res || {};

      const blocked = Boolean(data.isBlocked);
      const reason = data.reason || '';
      const count = Number(data.overdueInvoiceCount || 0);

      setIsBlocked(blocked);
      setBlockReason(reason);
      setOverdueInvoiceCount(count);

      // Hitung peringatan tanggal 1-10 jika belum diblokir
      const now = new Date();
      const currentDay = now.getDate();
      if (!blocked && currentDay < 10) {
        const remaining = 10 - currentDay;
        setDaysLeft(remaining);
        setIsDueSoon(currentDay >= 8);
      } else {
        setIsDueSoon(false);
        setDaysLeft(0);
      }
    } catch (err) {
      console.warn('[useBlokirTagihan] Gagal memeriksa /api/canteen/billing/status-block:', err?.message || err);
      // Fallback lokal jika backend offline
      try {
        const now = new Date();
        let prevMonth = now.getMonth();
        let prevYear = now.getFullYear();
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear -= 1;
        }

        const [billingRes, topupsRes] = await Promise.allSettled([
          apiFetch(`/api/canteen/billing/monthly?month=${prevMonth}&year=${prevYear}`),
          apiFetch('/api/canteen/topups?limit=50'),
        ]);

        const billingData = billingRes.status === 'fulfilled' ? billingRes.value?.data || billingRes.value : null;
        const paymentHistory = topupsRes.status === 'fulfilled' 
          ? (topupsRes.value?.items || topupsRes.value?.data || (Array.isArray(topupsRes.value) ? topupsRes.value : [])) 
          : [];

        const result = cekStatusBlokirTagihan(billingData, paymentHistory, now);
        setIsBlocked(result.isBlocked);
        setIsDueSoon(result.isDueSoon);
        setDaysLeft(result.daysLeft);
        setBlockedPeriod(result.blockedPeriod);
        setBlockReason(result.reason);
      } catch (_fallbackErr) {
        setIsBlocked(false);
        setIsDueSoon(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBlokir();

    const handleUpdate = () => checkBlokir();
    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('pascall_billing_updated', handleUpdate);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('pascall_billing_updated', handleUpdate);
    };
  }, [checkBlokir]);

  return {
    isBlocked,
    isDueSoon,
    daysLeft,
    blockedPeriod,
    blockReason,
    overdueInvoiceCount,
    isLoading,
    refreshBlokir: checkBlokir,
  };
}

export default useBlokirTagihan;
