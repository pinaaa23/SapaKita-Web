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
 * Definisi Role Resmi Sistem SapaKita (PRD v2.0 Pesantren)
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN_KANWIL: 'admin_kanwil',   // Admin Yayasan / Pengurus Pusat
  KEPALA_UPT: 'kepala_upt',       // Pimpinan Kampus / Kepala Pondok (BRANCH_ADMIN)
  SUPERVISOR: 'supervisor',       // Supervisor Kesantrian / Keamanan Pondok
  OPERATOR_KANTIN: 'operator_kantin', // Operator Kopontren / Kasir Koperasi
  FINANCE: 'finance',             // Admin Keuangan Platform SapaKita
};

/**
 * Label Tampilan Role dalam Bahasa Indonesia
 */
export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: 'Super Administrator',
  [ROLES.ADMIN_KANWIL]: 'Admin Yayasan',
  [ROLES.KEPALA_UPT]: 'Pimpinan Kampus',
  [ROLES.SUPERVISOR]: 'Supervisor Kesantrian',
  [ROLES.OPERATOR_KANTIN]: 'Operator Kopontren',
  [ROLES.FINANCE]: 'Admin Keuangan Platform',
};

/**
 * Normalisasi role dari berbagai format string backend / localStorage
 */
export const normalizeRole = (rawRole) => {
  if (!rawRole) return '';
  const str = String(rawRole).trim().toLowerCase().replace(/[\s\-_]+/g, '_');

  if (str === 'superadmin' || str === 'super_admin' || str === 'admin_pusat' || str === 'pusat') return ROLES.SUPERADMIN;
  if (str === 'admin_kanwil' || str === 'kanwil_admin' || str === 'kanwil' || str === 'admin-kanwil' || str === 'admin_yayasan' || str === 'yayasan') return ROLES.ADMIN_KANWIL;
  if (
    str === 'kepala_upt' || 
    str === 'branch_admin' || 
    str === 'admin_cabang' || 
    str === 'kepala' || 
    str === 'admin' || 
    str === 'admin_pesantren' || 
    str === 'kepala_pondok' ||
    str === 'pimpinan_kampus' ||
    str === 'upt_admin' ||
    str === 'branch'
  ) return ROLES.KEPALA_UPT;
  if (
    str === 'supervisor' || 
    str === 'spv' || 
    str === 'supervisor_kesantrian' || 
    str === 'spv_pondok' || 
    str === 'supervisor_upt' ||
    str === 'spv_upt'
  ) return ROLES.SUPERVISOR;
  if (
    str === 'operator_kantin' || 
    str === 'canteen_staff' || 
    str === 'kopontren' || 
    str === 'kasir' || 
    str === 'kasir_kopontren' || 
    str === 'operator_kopontren' ||
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

  return '';
};

/**
 * Pengecekan Hak Akses (Permissions)
 */
export const permissions = {
  // Hanya Pimpinan Kampus dan Superadmin yang boleh memutar rekaman & membaca transkrip AI panggilan santri
  canViewRecordings: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN;
  },

  // Hanya Pimpinan Kampus yang boleh mengelola akun staf pondok (Supervisor & Operator Kopontren)
  canManageUsers: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN;
  },

  // Hanya Supervisor Kesantrian yang dapat mengelola paket panggilan per kampus; Superadmin hanya memantau
  canManagePackages: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.SUPERVISOR;
  },

  // Role Yayasan dan Finance bersifat pemantauan/rekapitulasi (read-only): tidak dapat mengubah data master santri/paket
  isReadOnlyRole: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.ADMIN_KANWIL || norm === ROLES.FINANCE;
  },

  // Pembayaran & verifikasi setoran dikelola oleh Superadmin dan Finance
  canManagePayments: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.SUPERADMIN || norm === ROLES.FINANCE;
  },
};

/**
 * Konfigurasi Menu Sidebar Berdasarkan Role SapaKita
 */
export const getMenuItemsByRole = (role) => {
  const normRole = normalizeRole(role);

  if (normRole === ROLES.SUPERADMIN) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Yayasan Pesantren', icon: Landmark, path: '/kanwil-management' },
      { name: 'Kampus Pesantren', icon: Building2, path: '/branches' },
      { name: 'Akun Keuangan', icon: CircleDollarSign, path: '/finance-accounts' },
      { name: 'Data Santri', icon: Users, path: '/santri' },
      { name: 'Panggilan', icon: PhoneCall, path: '/calls' },
      { name: 'Transaksi', icon: CreditCard, path: '/transactions' },
      { name: 'Tagihan & Setoran', icon: Receipt, path: '/billing' },
      { name: 'Kontrak & Bagi Hasil', icon: Wallet, path: '/contracts' },
      { name: 'Katalog Paket', icon: Package, path: '/packages' },
      { name: 'Tagihan Kopontren', icon: Receipt, path: '/canteen-topup' },
      { name: 'Laporan', icon: BarChart3, path: '/reports' },
      { name: 'Aplikasi Kiosk', icon: QrCode, path: '/app-releases' },
    ];
  }

  // Menu untuk Admin Yayasan (Dashboard, Kampus, Data Santri, Panggilan, Tagihan Kopontren, Laporan - Read Only)
  if (normRole === ROLES.ADMIN_KANWIL) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/kanwil/dashboard' },
      { name: 'Kampus Pesantren', icon: Building2, path: '/kanwil/branches' },
      { name: 'Data Santri', icon: Users, path: '/kanwil/santri' },
      { name: 'Panggilan', icon: PhoneCall, path: '/kanwil/calls' },
      { name: 'Tagihan Kopontren', icon: Receipt, path: '/kanwil/canteen-topup' },
      { name: 'Laporan', icon: BarChart3, path: '/kanwil/reports' },
    ];
  }

  // Menu untuk Pimpinan Kampus (Dashboard, Data Santri, Monitoring CCTV, Rekaman Panggilan, Kelola Pengguna, Transaksi, Laporan)
  if (normRole === ROLES.KEPALA_UPT) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data Santri', icon: Users, path: '/branch/santri' },
      { name: 'Monitoring CCTV', icon: Video, path: '/branch/cctv' },
      { name: 'Rekaman Panggilan', icon: PhoneCall, path: '/branch/recordings' },
      { name: 'Kelola Pengguna', icon: UserCog, path: '/branch/users' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
    ];
  }

  // Menu untuk Supervisor (Dashboard, Data Santri, Monitoring CCTV, Kelola Paket, Transaksi, Tagihan Bulanan, Laporan)
  if (normRole === ROLES.SUPERVISOR) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data Santri', icon: Users, path: '/branch/santri' },
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

  return [];
};

export default {
  ROLES,
  ROLE_LABELS,
  normalizeRole,
  permissions,
  getMenuItemsByRole,
};
