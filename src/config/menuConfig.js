import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  PhoneCall, 
  CreditCard, 
  BarChart3, 
  Package, 
  UserCog,
  QrCode,
  Wallet,
  Landmark,
  Receipt,
  CircleDollarSign,
  Video
} from 'lucide-react';

/**
 * Definisi Role Resmi Sistem PasCall
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN_KANWIL: 'admin_kanwil',
  KEPALA_UPT: 'kepala_upt',
  SUPERVISOR: 'supervisor',
  OPERATOR_KANTIN: 'operator_kantin',
  FINANCE: 'finance',
  INKOPASINDO: 'inkopasindo',
};

/**
 * Label Tampilan Role dalam Bahasa Indonesia
 */
export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: 'Super Administrator',
  [ROLES.ADMIN_KANWIL]: 'Admin Kanwil',
  [ROLES.KEPALA_UPT]: 'Kepala UPT',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.OPERATOR_KANTIN]: 'Operator Kantin',
  [ROLES.FINANCE]: 'Admin Finance',
  [ROLES.INKOPASINDO]: 'Inkopasindo',
};

/**
 * Normalisasi role dari berbagai format string backend / localStorage
 */
export const normalizeRole = (rawRole) => {
  if (!rawRole) return '';
  const str = String(rawRole).trim().toLowerCase().replace(/[\s\-_]+/g, '_');

  if (str === 'superadmin' || str === 'super_admin' || str === 'admin_pusat' || str === 'pusat') return ROLES.SUPERADMIN;
  if (str === 'admin_kanwil' || str === 'kanwil_admin' || str === 'kanwil' || str === 'admin-kanwil') return ROLES.ADMIN_KANWIL;
  if (
    str === 'kepala_upt' || 
    str === 'branch_admin' || 
    str === 'admin_cabang' || 
    str === 'kepala' || 
    str === 'admin' || 
    str === 'admin_lapas' || 
    str === 'kepala_lapas' ||
    str === 'upt_admin' ||
    str === 'branch'
  ) return ROLES.KEPALA_UPT;
  if (
    str === 'supervisor' || 
    str === 'spv' || 
    str === 'supervisor_lapas' || 
    str === 'spv_lapas' || 
    str === 'supervisor_upt' ||
    str === 'spv_upt'
  ) return ROLES.SUPERVISOR;
  if (
    str === 'operator_kantin' || 
    str === 'canteen_staff' || 
    str === 'kantin' || 
    str === 'kasir' || 
    str === 'kasir_kantin' || 
    str === 'kasir_lapas' ||
    str === 'canteen'
  ) return ROLES.OPERATOR_KANTIN;
  if (
    str === 'finance' ||
    str === 'admin_finance' ||
    str === 'finance_admin' ||
    str === 'keuangan' ||
    str === 'admin_keuangan' ||
    str === 'fin'
  ) return ROLES.FINANCE;
  if (
    str === 'inkopasindo' ||
    str === 'inkop' ||
    str === 'koperasi_inkopasindo' ||
    str === 'admin_inkopasindo'
  ) return ROLES.INKOPASINDO;

  return '';
};

/**
 * Pengecekan Hak Akses (Permissions)
 */
export const permissions = {
  // Hanya Kepala UPT dan Superadmin yang boleh memutar rekaman & transkrip panggilan
  canViewRecordings: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN;
  },

  // Hanya Kepala UPT yang boleh mengelola akun pengguna UPT (Supervisor & Operator Kantin)
  canManageUsers: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN;
  },

  // Hanya Supervisor UPT yang dapat mengelola (tambah, edit, nonaktifkan, hapus) paket; Superadmin hanya melihat
  canManagePackages: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.SUPERVISOR;
  },

  // Role Kanwil, Finance, dan Inkopasindo bersifat statis (read-only): tidak dapat menambah, mengedit, atau menghapus data
  isReadOnlyRole: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.ADMIN_KANWIL || norm === ROLES.FINANCE || norm === ROLES.INKOPASINDO;
  },

  // Seluruh pembayaran & verifikasi setoran dikembalikan ke Superadmin
  canManagePayments: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.SUPERADMIN;
  },
};

/**
 * Konfigurasi Menu Sidebar Berdasarkan Role
 */
export const getMenuItemsByRole = (role) => {
  const normRole = normalizeRole(role);

  if (normRole === ROLES.SUPERADMIN) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Kanwil', icon: Landmark, path: '/kanwil-management' },
      { name: 'UPT', icon: Building2, path: '/branches' },
      { name: 'Akun Finance', icon: CircleDollarSign, path: '/finance-accounts' },
      { name: 'Data WBP', icon: Users, path: '/inmates' },
      { name: 'Panggilan', icon: PhoneCall, path: '/calls' },
      { name: 'Transaksi', icon: CreditCard, path: '/transactions' },
      { name: 'Tagihan & Setoran', icon: Receipt, path: '/billing' },
      { name: 'Kontrak & Bagi Hasil', icon: Wallet, path: '/contracts' },
      { name: 'Katalog Paket', icon: Package, path: '/packages' },
      { name: 'Tagihan Kantin', icon: Receipt, path: '/canteen-topup' },
      { name: 'Laporan', icon: BarChart3, path: '/reports' },
      { name: 'Aplikasi Mobile', icon: QrCode, path: '/app-releases' },
    ];
  }

  // Menu untuk Admin Kanwil (Dashboard, UPT, Data WBP, Panggilan, Tagihan Kantin, Laporan - Read Only)
  if (normRole === ROLES.ADMIN_KANWIL) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/kanwil/dashboard' },
      { name: 'UPT', icon: Building2, path: '/kanwil/branches' },
      { name: 'Data WBP', icon: Users, path: '/kanwil/inmates' },
      { name: 'Panggilan', icon: PhoneCall, path: '/kanwil/calls' },
      { name: 'Tagihan Kantin', icon: Receipt, path: '/kanwil/canteen-topup' },
      { name: 'Laporan', icon: BarChart3, path: '/kanwil/reports' },
    ];
  }

  // Menu untuk Kepala UPT (Dashboard, Data WBP, Monitoring CCTV, Rekaman Panggilan, Kelola Pengguna, Transaksi, Laporan)
  if (normRole === ROLES.KEPALA_UPT) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data WBP', icon: Users, path: '/branch/inmates' },
      { name: 'Monitoring CCTV', icon: Video, path: '/branch/cctv' },
      { name: 'Rekaman Panggilan', icon: PhoneCall, path: '/branch/recordings' },
      { name: 'Kelola Pengguna', icon: UserCog, path: '/branch/users' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
    ];
  }

  // Menu untuk Supervisor (Dashboard, Data WBP, Monitoring CCTV, Kelola Paket, Transaksi, Laporan)
  if (normRole === ROLES.SUPERVISOR) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data WBP', icon: Users, path: '/branch/inmates' },
      { name: 'Monitoring CCTV', icon: Video, path: '/branch/cctv' },
      { name: 'Kelola Paket', icon: Package, path: '/branch/packages' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Tagihan Bulanan', icon: Receipt, path: '/branch/billing' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
    ];
  }

  // Menu untuk Admin Finance (Dashboard Keuangan, Tagihan & Setoran, Kontrak Bagi Hasil, Laporan Keuangan)
  if (normRole === ROLES.FINANCE) {
    return [
      { name: 'Dashboard Keuangan', icon: LayoutDashboard, path: '/finance/dashboard' },
      { name: 'Tagihan & Setoran', icon: Receipt, path: '/finance/billing' },
      { name: 'Kontrak Bagi Hasil', icon: Wallet, path: '/finance/contracts' },
      { name: 'Laporan Keuangan', icon: BarChart3, path: '/finance/reports' },
    ];
  }

  // Menu untuk Inkopasindo (3 menu: Dashboard, Tagihan, Laporan)
  if (normRole === ROLES.INKOPASINDO) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/inkopasindo/dashboard' },
      { name: 'Tagihan', icon: Receipt, path: '/inkopasindo/billing' },
      { name: 'Laporan', icon: BarChart3, path: '/inkopasindo/reports' },
    ];
  }

  return [];
};

export default {
  ROLES,
  ROLE_LABELS,
  normalizeRole,
  permissions,
  getMenuItemsByRole,
};
