/**
 * Data Resmi untuk Fitur Demo Admin Kanwil (Kantor Wilayah)
 * Akun login dan struktur UPT dipertahankan; dataset WBP & Statistik dikosongkan.
 */

// Akun Demo Kanwil (DIPERTAHANKAN agar masih bisa login)
export const INITIAL_KANWIL_ACCOUNTS = [
  {
    id: 'kanwil-jabar',
    name: 'Admin Kanwil Jawa Barat',
    kanwilName: 'Kanwil Jawa Barat',
    wilayah: 'Jawa Barat',
    email: 'kanwil.jabar@sapakita.id',
    password: 'PasswordJabar2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-cipinang', 'upt-gnsindur', 'upt-tangerang'],
  },
  {
    id: 'kanwil-diy',
    name: 'Admin Kanwil DI Yogyakarta',
    kanwilName: 'Kanwil DI Yogyakarta',
    wilayah: 'DI Yogyakarta',
    email: 'kanwil.diy@sapakita.id',
    password: 'PasswordDiy2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-jogja'],
  },
  {
    id: 'kanwil-jateng',
    name: 'Admin Kanwil Jawa Tengah',
    kanwilName: 'Kanwil Jawa Tengah',
    wilayah: 'Jawa Tengah',
    email: 'kanwil.jateng@sapakita.id',
    password: 'PasswordJateng2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-semarang', 'upt-purwokerto'],
  },
  {
    id: 'kanwil-jatim',
    name: 'Admin Kanwil Jawa Timur',
    kanwilName: 'Kanwil Jawa Timur',
    wilayah: 'Jawa Timur',
    email: 'kanwil.jatim@sapakita.id',
    password: 'PasswordJatim2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-surabaya', 'upt-malang'],
  },
];

// Daftar Master Pondok Pesantren yang dinaungi Yayasan/Wilayah
export const INITIAL_UPT_LIST = [
  // Jawa Barat
  {
    id: 'upt-cipinang',
    kanwilId: 'kanwil-jabar',
    name: 'Pondok Pesantren Al-Hidayah Pusat',
    city: 'Jakarta Timur',
    address: 'Jl. Bekasi Timur Raya No.170, Cipinang',
    status: 'Active',
    capacity: 3200,
    inmateCount: 0,
    phone: '021-8190123',
  },
  {
    id: 'upt-gnsindur',
    kanwilId: 'kanwil-jabar',
    name: 'Pondok Pesantren Darussalam',
    city: 'Bogor',
    address: 'Jl. Pemuda No.1, Rawakalong, Gunung Sindur',
    status: 'Active',
    capacity: 1500,
    inmateCount: 0,
    phone: '0251-8612345',
  },
  {
    id: 'upt-tangerang',
    kanwilId: 'kanwil-jabar',
    name: 'Pondok Pesantren As-Syafi\'iyah',
    city: 'Tangerang',
    address: 'Jl. Daan Mogot No.59, Tanah Tinggi',
    status: 'Active',
    capacity: 1100,
    inmateCount: 0,
    phone: '021-5523456',
  },

  // DI Yogyakarta
  {
    id: 'upt-jogja',
    kanwilId: 'kanwil-diy',
    name: 'Pondok Pesantren Krapyak',
    city: 'Yogyakarta',
    address: 'Jl. KH. Ali Maksum, Krapyak Kulon, Bantul',
    status: 'Active',
    capacity: 850,
    inmateCount: 0,
    phone: '0274-371234',
  },

  // Jawa Tengah
  {
    id: 'upt-semarang',
    kanwilId: 'kanwil-jateng',
    name: 'Pondok Pesantren Gontor Putra',
    city: 'Semarang',
    address: 'Jl. Raya Tugurejo No.1, Kedungpane',
    status: 'Active',
    capacity: 1800,
    inmateCount: 0,
    phone: '024-7601234',
  },
  {
    id: 'upt-purwokerto',
    kanwilId: 'kanwil-jateng',
    name: 'Pondok Pesantren Putri Al-Munawwir',
    city: 'Purwokerto',
    address: 'Jl. Pondok Pesantren No.1, Kranji',
    status: 'Active',
    capacity: 900,
    inmateCount: 0,
    phone: '0281-631234',
  },

  // Jawa Timur
  {
    id: 'upt-surabaya',
    kanwilId: 'kanwil-jatim',
    name: 'Pondok Pesantren Tebuireng',
    city: 'Jombang',
    address: 'Jl. Irian Jaya No.10, Cukir, Diwek',
    status: 'Active',
    capacity: 2500,
    inmateCount: 0,
    phone: '0343-851234',
  },
  {
    id: 'upt-malang',
    kanwilId: 'kanwil-jatim',
    name: 'Pondok Pesantren Sidogiri',
    city: 'Pasuruan',
    address: 'Sidogiri, Kec. Kraton, Pasuruan',
    status: 'Active',
    capacity: 1400,
    inmateCount: 0,
    phone: '0341-491234',
  },
];

// Data WBP Dummy (DIKOSONGKAN untuk testing dari nol)
export const INITIAL_WBP_LIST = [];

// Metrik & Statistik Dummy per Kanwil (DIKOSONGKAN untuk testing dari nol)
export const KANWIL_STATISTICS = {
  'kanwil-jabar': {
    totalCalls: 0,
    totalRevenue: 0,
    activeBranches: 0,
    successRate: 0,
    callsGrowth: 0,
    revenueGrowth: 0,
    branchesGrowth: 0,
    successRateGrowth: 0,
    avgCallDurationSeconds: 0,
    revenueTrend: [],
    callVolume: [],
  },
  'kanwil-diy': {
    totalCalls: 0,
    totalRevenue: 0,
    activeBranches: 0,
    successRate: 0,
    callsGrowth: 0,
    revenueGrowth: 0,
    branchesGrowth: 0,
    successRateGrowth: 0,
    avgCallDurationSeconds: 0,
    revenueTrend: [],
    callVolume: [],
  },
  'kanwil-jateng': {
    totalCalls: 0,
    totalRevenue: 0,
    activeBranches: 0,
    successRate: 0,
    callsGrowth: 0,
    revenueGrowth: 0,
    branchesGrowth: 0,
    successRateGrowth: 0,
    avgCallDurationSeconds: 0,
    revenueTrend: [],
    callVolume: [],
  },
  'kanwil-jatim': {
    totalCalls: 0,
    totalRevenue: 0,
    activeBranches: 0,
    successRate: 0,
    callsGrowth: 0,
    revenueGrowth: 0,
    branchesGrowth: 0,
    successRateGrowth: 0,
    avgCallDurationSeconds: 0,
    revenueTrend: [],
    callVolume: [],
  },
};
