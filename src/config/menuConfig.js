import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  PhoneCall, 
  CreditCard, 
  BarChart3, 
  Package, 
  UserCog,
  UserCheck 
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
  if (!rawRole) return ROLES.KEPALA_UPT; // Default fallback aman untuk dashboard UPT
  const str = String(rawRole).trim().toLowerCase();

  if (str === 'superadmin' || str === 'admin_pusat') return ROLES.SUPERADMIN;
  if (str === 'kepala_upt' || str === 'branch_admin' || str === 'admin_cabang' || str === 'kepala') return ROLES.KEPALA_UPT;
  if (str === 'supervisor' || str === 'spv') return ROLES.SUPERVISOR;
  if (str === 'operator_kantin' || str === 'canteen_staff' || str === 'kantin') return ROLES.OPERATOR_KANTIN;

  return ROLES.KEPALA_UPT;
};

/**
 * Pengecekan Hak Akses (Permissions)
 */
export const permissions = {
  // Hanya Kepala UPT yang boleh memutar rekaman & transkrip panggilan
  canViewRecordings: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN;
  },

  // Hanya Kepala UPT yang boleh mengelola akun pengguna UPT (Supervisor & Operator Kantin)
  canManageUsers: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERADMIN;
  },

  // Kepala UPT dan Supervisor dapat mengelola paket
  canManagePackages: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.KEPALA_UPT || norm === ROLES.SUPERVISOR || norm === ROLES.SUPERADMIN;
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
      { name: 'Laporan', icon: BarChart3, path: '/reports' },
    ];
  }

  // Menu untuk Kepala UPT (Dashboard, Data Napi, Rekaman Panggilan, Kelola Pengguna, Kelola Paket, Transaksi, Laporan)
  if (normRole === ROLES.KEPALA_UPT) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data Narapidana', icon: Users, path: '/branch/inmates' },
      { name: 'Rekaman Panggilan', icon: PhoneCall, path: '/branch/recordings' },
      { name: 'Kelola Pengguna', icon: UserCog, path: '/branch/users' },
      { name: 'Kelola Paket', icon: Package, path: '/branch/packages' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
    ];
  }

  // Menu untuk Supervisor (Dashboard, Data Narapidana, Transaksi, Kelola Paket, Laporan)
  if (normRole === ROLES.SUPERVISOR) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data Narapidana', icon: Users, path: '/branch/inmates' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Kelola Paket', icon: Package, path: '/branch/packages' },
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
