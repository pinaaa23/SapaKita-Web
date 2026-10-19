/**
 * Data Dummy Saldo & Top Up Kantin (Superadmin & Kantin)
 * =======================================================
 * Dataset dikosongkan untuk testing dari nol.
 */

// Tarif PPN sebagai SATU konstanta
export const PPN_RATE = 0.11;

// Saldo awal kantin operator baru adalah 0 Menit
export const SALDO_AWAL = 0;

// Batas minimum saldo untuk peringatan "Kuota Menit menipis" (di bawah 30 menit)
export const SALDO_MINIMUM_WARNING = 30;

// Pilihan paket top up kuota saldo menit kantin
export const NOMINAL_TOPUP_OPTIONS = [
  {
    id: 'topup-500k',
    nominal: 500_000,
    menit: 1_000,
    label: '1.000 Menit',
    bonus: null,
  },
  {
    id: 'topup-1jt',
    nominal: 1_000_000,
    menit: 2_200,
    label: '2.200 Menit',
    bonus: '+200 Menit Bonus',
  },
  {
    id: 'topup-2jt',
    nominal: 2_000_000,
    menit: 4_500,
    label: '4.500 Menit',
    bonus: '+500 Menit Bonus',
  },
];

/**
 * Mendapatkan estimasi kuota menit berdasarkan nominal top up
 */
export function getMenitFromNominal(nominal) {
  const found = NOMINAL_TOPUP_OPTIONS.find((opt) => opt.nominal === Number(nominal));
  if (found) return found.menit;
  const num = Number(nominal) || 0;
  if (num >= 2_000_000) return 4_500;
  if (num >= 1_000_000) return 2_200;
  if (num >= 500_000) return 1_000;
  return Math.max(1, Math.round(num / 500));
}

/**
 * Daftar Paket Nominal Saldo yang Dikelola oleh Superadmin
 */
export const DEFAULT_NOMINAL_SALDO_LIST = [];

/**
 * Generate riwayat top up untuk operator kantin individual
 */
export function generateRiwayatTopUpDummy() {
  return [];
}

export function generateSuperadminRiwayatTopUpDummy() {
  return [];
}
