/**
 * Data Dummy Saldo & Top Up Kantin (Superadmin & Kantin)
 * =======================================================
 * File ini berisi data awal saldo kantin, daftar nominal saldo yang dijual oleh Superadmin,
 * dan riwayat top up lintas cabang / UPT.
 */

// Tarif PPN sebagai SATU konstanta
export const PPN_RATE = 0.11;

// Saldo awal kantin operator (Rp 1.500.000)
export const SALDO_AWAL = 1_500_000;

// Batas minimum saldo untuk peringatan "Saldo menipis"
export const SALDO_MINIMUM_WARNING = 50_000;

// Pilihan nominal top up sederhana (array angka)
export const NOMINAL_TOPUP_OPTIONS = [500_000, 1_000_000, 2_000_000];

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

/**
 * Generate riwayat top up kantin nasional untuk Superadmin (lintas UPT)
 */
export function generateSuperadminRiwayatTopUpDummy() {
  const now = new Date();
  const thn = now.getFullYear();
  const bln = now.getMonth();
  const tgl = now.getDate();

  return [
    {
      id: 'TPU-NAT-001',
      tanggal: new Date(thn, bln, tgl, 14, 20).toISOString(),
      branchId: 'b1',
      branchName: 'Lapas Kelas I Cipinang',
      staffName: 'Dewi Lestari (Kasir Kantin)',
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-002',
      tanggal: new Date(thn, bln, tgl - 1, 10, 15).toISOString(),
      branchId: 'b2',
      branchName: 'Lapas Pemuda Kelas IIA Tangerang',
      staffName: 'Bambang Irawan',
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-003',
      tanggal: new Date(thn, bln, tgl - 1, 16, 45).toISOString(),
      branchId: 'b3',
      branchName: 'Lapas Narkotika Kelas IIA Jakarta',
      staffName: 'Rian Hidayat',
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Menunggu',
    },
    {
      id: 'TPU-NAT-004',
      tanggal: new Date(thn, bln, tgl - 2, 11, 30).toISOString(),
      branchId: 'b4',
      branchName: 'Lapas Kelas I Sukamiskin',
      staffName: 'Andi Saputra',
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-005',
      tanggal: new Date(thn, bln, tgl - 3, 9, 0).toISOString(),
      branchId: 'b1',
      branchName: 'Lapas Kelas I Cipinang',
      staffName: 'Dewi Lestari (Kasir Kantin)',
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-006',
      tanggal: new Date(thn, bln, tgl - 4, 15, 10).toISOString(),
      branchId: 'b2',
      branchName: 'Lapas Pemuda Kelas IIA Tangerang',
      staffName: 'Bambang Irawan',
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-007',
      tanggal: new Date(thn, bln, tgl - 5, 8, 40).toISOString(),
      branchId: 'b5',
      branchName: 'Rutan Kelas I Salemba',
      staffName: 'Siti Rahmawati',
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Menunggu',
    },
    {
      id: 'TPU-NAT-008',
      tanggal: new Date(thn, bln, tgl - 6, 13, 25).toISOString(),
      branchId: 'b3',
      branchName: 'Lapas Narkotika Kelas IIA Jakarta',
      staffName: 'Rian Hidayat',
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-009',
      tanggal: new Date(thn, bln, tgl - 8, 10, 50).toISOString(),
      branchId: 'b4',
      branchName: 'Lapas Kelas I Sukamiskin',
      staffName: 'Andi Saputra',
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-010',
      tanggal: new Date(thn, bln, tgl - 10, 14, 0).toISOString(),
      branchId: 'b1',
      branchName: 'Lapas Kelas I Cipinang',
      staffName: 'Dewi Lestari (Kasir Kantin)',
      nominal: 500_000,
      ppn: Math.round(500_000 * PPN_RATE),
      totalBayar: 500_000 + Math.round(500_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-011',
      tanggal: new Date(thn, bln, tgl - 12, 11, 15).toISOString(),
      branchId: 'b2',
      branchName: 'Lapas Pemuda Kelas IIA Tangerang',
      staffName: 'Bambang Irawan',
      nominal: 2_000_000,
      ppn: Math.round(2_000_000 * PPN_RATE),
      totalBayar: 2_000_000 + Math.round(2_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
    {
      id: 'TPU-NAT-012',
      tanggal: new Date(thn, bln, tgl - 15, 9, 30).toISOString(),
      branchId: 'b5',
      branchName: 'Rutan Kelas I Salemba',
      staffName: 'Siti Rahmawati',
      nominal: 1_000_000,
      ppn: Math.round(1_000_000 * PPN_RATE),
      totalBayar: 1_000_000 + Math.round(1_000_000 * PPN_RATE),
      status: 'Berhasil',
    },
  ];
}
