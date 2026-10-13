import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  PhoneCall, 
  CreditCard, 
  BarChart3, 
  Package, 
  UserCog,
  Wallet
} from 'lucide-react';

/**
 * Definisi Role Resmi Sistem PasCall
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  KEPALA_UPT: 'kepala_upt',
  SUPERVISOR: 'supervisor',
  OPERATOR_KANTIN: 'operator_kantin',
};

/**
 * Label Tampilan Role dalam Bahasa Indonesia
 */
export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: 'Super Administrator',
  [ROLES.KEPALA_UPT]: 'Kepala UPT',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.OPERATOR_KANTIN]: 'Operator Kantin',
};

/**
 * Normalisasi role dari berbagai format string backend / localStorage
 */
export const normalizeRole = (rawRole) => {
  if (!rawRole) return '';
  const str = String(rawRole).trim().toLowerCase().replace(/[\s\-_]+/g, '_');

  if (str === 'superadmin' || str === 'super_admin' || str === 'admin_pusat' || str === 'pusat') return ROLES.SUPERADMIN;
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

  return '';
};

/**
 * Pengecekan Hak Akses (Permissions)
 */
export const permissions = {
  // Kepala UPT & Supervisor boleh memutar rekaman & transkrip panggilan
  canViewRecordings: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN || norm === ROLES.SUPERVISOR;
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
};

/**
 * Konfigurasi Menu Sidebar Berdasarkan Role
 */
export const getMenuItemsByRole = (role) => {
  const normRole = normalizeRole(role);

  if (normRole === ROLES.SUPERADMIN) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'UPT', icon: Building2, path: '/branches' },
      { name: 'Data Narapidana', icon: Users, path: '/inmates' },
      { name: 'Panggilan', icon: PhoneCall, path: '/calls' },
      { name: 'Transaksi', icon: CreditCard, path: '/transactions' },
      { name: 'Kelola Paket', icon: Package, path: '/packages' },
      { name: 'Top Up Saldo Kantin', icon: Wallet, path: '/canteen-topup' },
      { name: 'Laporan', icon: BarChart3, path: '/reports' },
    ];
  }

  // Menu untuk Kepala UPT (Dashboard, Data Napi, Rekaman Panggilan, Kelola Pengguna, Transaksi, Laporan)
  if (normRole === ROLES.KEPALA_UPT) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data Narapidana', icon: Users, path: '/branch/inmates' },
      { name: 'Rekaman Panggilan', icon: PhoneCall, path: '/branch/recordings' },
      { name: 'Kelola Pengguna', icon: UserCog, path: '/branch/users' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
    ];
  }

  // Menu untuk Supervisor (Dashboard, Data Narapidana, Rekaman Panggilan, Kelola Paket, Transaksi, Laporan)
  if (normRole === ROLES.SUPERVISOR) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data Narapidana', icon: Users, path: '/branch/inmates' },
      { name: 'Rekaman Panggilan', icon: PhoneCall, path: '/branch/recordings' },
      { name: 'Kelola Paket', icon: Package, path: '/branch/packages' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
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
