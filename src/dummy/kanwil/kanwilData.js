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
    email: 'kanwil.jabar@pascall.id',
    password: 'PasswordJabar2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-cipinang', 'upt-gnsindur', 'upt-tangerang'],
  },
  {
    id: 'kanwil-diy',
    name: 'Admin Kanwil DI Yogyakarta',
    kanwilName: 'Kanwil DI Yogyakarta',
    wilayah: 'DI Yogyakarta',
    email: 'kanwil.diy@pascall.id',
    password: 'PasswordDiy2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-jogja'],
  },
  {
    id: 'kanwil-jateng',
    name: 'Admin Kanwil Jawa Tengah',
    kanwilName: 'Kanwil Jawa Tengah',
    wilayah: 'Jawa Tengah',
    email: 'kanwil.jateng@pascall.id',
    password: 'PasswordJateng2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-semarang', 'upt-purwokerto'],
  },
  {
    id: 'kanwil-jatim',
    name: 'Admin Kanwil Jawa Timur',
    kanwilName: 'Kanwil Jawa Timur',
    wilayah: 'Jawa Timur',
    email: 'kanwil.jatim@pascall.id',
    password: 'PasswordJatim2026!',
    role: 'admin_kanwil',
    uptIds: ['upt-surabaya', 'upt-malang'],
  },
];

// Daftar Master UPT yang dinaungi Kanwil (DIPERTAHANKAN untuk struktur pengelompokan UPT)
export const INITIAL_UPT_LIST = [
  // Jawa Barat
  {
    id: 'upt-cipinang',
    kanwilId: 'kanwil-jabar',
    name: 'Lapas Kelas I Cipinang',
    city: 'Jakarta Timur',
    address: 'Jl. Bekasi Timur Raya No.170, Cipinang Besar Utara',
    status: 'Active',
    capacity: 3200,
    inmateCount: 0,
    phone: '021-8190123',
  },
  {
    id: 'upt-gnsindur',
    kanwilId: 'kanwil-jabar',
    name: 'Lapas Khusus Kelas IIA Gunung Sindur',
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
    name: 'Lapas Kelas IIA Tangerang',
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
    name: 'Lapas Kelas IIA Yogyakarta',
    city: 'Yogyakarta',
    address: 'Jl. Tamansiswa No.6, Wirogunan, Mergangsan',
    status: 'Active',
    capacity: 850,
    inmateCount: 0,
    phone: '0274-371234',
  },

  // Jawa Tengah
  {
    id: 'upt-semarang',
    kanwilId: 'kanwil-jateng',
    name: 'Lapas Kelas I Semarang',
    city: 'Semarang',
    address: 'Jl. Raya Tugurejo No.1, Kedungpane, Ngaliyan',
    status: 'Active',
    capacity: 1800,
    inmateCount: 0,
    phone: '024-7601234',
  },
  {
    id: 'upt-purwokerto',
    kanwilId: 'kanwil-jateng',
    name: 'Lapas Kelas IIA Purwokerto',
    city: 'Purwokerto',
    address: 'Jl. Penjara No.1, Kranji, Purwokerto Timur',
    status: 'Active',
    capacity: 900,
    inmateCount: 0,
    phone: '0281-631234',
  },

  // Jawa Timur
  {
    id: 'upt-surabaya',
    kanwilId: 'kanwil-jatim',
    name: 'Lapas Kelas I Surabaya',
    city: 'Sidoarjo',
    address: 'Jl. Raya Porong No.1, Kebonagung, Porong',
    status: 'Active',
    capacity: 2500,
    inmateCount: 0,
    phone: '0343-851234',
  },
  {
    id: 'upt-malang',
    kanwilId: 'kanwil-jatim',
    name: 'Lapas Kelas I Malang',
    city: 'Malang',
    address: 'Jl. Asahan No.7, Bunulrejo, Blimbing',
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
