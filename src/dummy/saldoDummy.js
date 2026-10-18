/**
 * Data Dummy Saldo & Top Up Kantin (Superadmin & Kantin)
 * =======================================================
 * File ini berisi data awal saldo kantin, daftar nominal saldo yang dijual oleh Superadmin,
 * dan riwayat top up lintas cabang / UPT.
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
 * Superadmin dapat menambah, mengedit, mengaktifkan/menonaktifkan, atau menghapus nominal ini.
 */
export const DEFAULT_NOMINAL_SALDO_LIST = [
  {
    id: 'nom-1',
    nominal: 500_000,
    ppn: Math.round(500_000 * PPN_RATE),
    totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'nom-2',
    nominal: 1_000_000,
    ppn: Math.round(1_000_000 * PPN_RATE),
    totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'nom-3',
    nominal: 2_000_000,
    ppn: Math.round(2_000_000 * PPN_RATE),
    totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
    status: 'Aktif',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
  },
];

/**
 * Generate riwayat top up untuk operator kantin individual
 */
export function generateRiwayatTopUpDummy() {
  const now = new Date();
  const thn = now.getFullYear();
  const bln = now.getMonth();
  const tgl = now.getDate();

  return [
    {
      id: 'TPU-001',
      tanggal: new Date(thn, bln, tgl - 1, 9, 15).toISOString(),
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-002',
      tanggal: new Date(thn, bln, tgl - 2, 14, 30).toISOString(),
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-003',
      tanggal: new Date(thn, bln, tgl - 3, 10, 0).toISOString(),
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-004',
      tanggal: new Date(thn, bln, tgl - 5, 11, 45).toISOString(),
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Menunggu',
    },
    {
      id: 'TPU-005',
      tanggal: new Date(thn, bln, tgl - 7, 8, 20).toISOString(),
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-006',
      tanggal: new Date(thn, bln, tgl - 10, 16, 5).toISOString(),
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-007',
      tanggal: new Date(thn, bln, tgl - 12, 13, 30).toISOString(),
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-008',
      tanggal: new Date(thn, bln, tgl - 14, 9, 50).toISOString(),
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Menunggu',
    },
    {
      id: 'TPU-009',
      tanggal: new Date(thn, bln - 1, 25, 10, 15).toISOString(),
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-010',
      tanggal: new Date(thn, bln - 1, 18, 14, 0).toISOString(),
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-011',
      tanggal: new Date(thn, bln - 1, 10, 11, 30).toISOString(),
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Menunggu',
    },
    {
      id: 'TPU-012',
      tanggal: new Date(thn, bln - 2, 5, 15, 45).toISOString(),
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
  ];
}

export function generateSuperadminRiwayatTopUpDummy() {
  return [];
}
