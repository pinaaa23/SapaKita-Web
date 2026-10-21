import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  PhoneCall, 
  CreditCard, 
  BarChart3, 
  Package, 
  UserCog,
  Wallet,
  Landmark,
  Receipt
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

  // Role Kanwil bersifat statis (read-only): tidak dapat menambah, mengedit, atau menghapus data
  isReadOnlyRole: (role) => {
    const norm = normalizeRole(role);
    return norm === ROLES.ADMIN_KANWIL;
  },
};

/**
 * Konfigurasi Menu Sidebar Berdasarkan Role
 */
export const getMenuItemsByRole = (role) => {
  const normRole = normalizeRole(role);
  const isKanwilDemo =
    import.meta.env.VITE_KANWIL_DEMO !== 'false' &&
    (import.meta.env.VITE_KANWIL_DEMO === 'true' ||
      import.meta.env.DEV ||
      localStorage.getItem('pascall_kanwil_demo') === 'true');

  if (normRole === ROLES.SUPERADMIN) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Kanwil', icon: Landmark, path: '/kanwil-management' },
      { name: 'UPT', icon: Building2, path: '/branches' },
      { name: 'Data WBP', icon: Users, path: '/inmates' },
      { name: 'Panggilan', icon: PhoneCall, path: '/calls' },
      { name: 'Transaksi', icon: CreditCard, path: '/transactions' },
      { name: 'Katalog Paket', icon: Package, path: '/packages' },
      { name: 'Tagihan Kantin', icon: Receipt, path: '/canteen-topup' },
      { name: 'Laporan', icon: BarChart3, path: '/reports' },
    ];
  }

  // Menu untuk Admin Kanwil (Dashboard, UPT, Data WBP, Panggilan, Laporan - Read Only)
  if (normRole === ROLES.ADMIN_KANWIL) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/kanwil/dashboard' },
      { name: 'UPT', icon: Building2, path: '/kanwil/branches' },
      { name: 'Data WBP', icon: Users, path: '/kanwil/inmates' },
      { name: 'Panggilan', icon: PhoneCall, path: '/kanwil/calls' },
      { name: 'Laporan', icon: BarChart3, path: '/kanwil/reports' },
    ];
  }

  // Menu untuk Kepala UPT (Dashboard, Data WBP, Rekaman Panggilan, Kelola Pengguna, Transaksi, Laporan)
  if (normRole === ROLES.KEPALA_UPT) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data WBP', icon: Users, path: '/branch/inmates' },
      { name: 'Rekaman Panggilan', icon: PhoneCall, path: '/branch/recordings' },
      { name: 'Kelola Pengguna', icon: UserCog, path: '/branch/users' },
      { name: 'Transaksi', icon: CreditCard, path: '/branch/transactions' },
      { name: 'Laporan', icon: BarChart3, path: '/branch/reports' },
    ];
  }

  // Menu untuk Supervisor (Dashboard, Data WBP, Kelola Paket, Transaksi, Laporan)
  if (normRole === ROLES.SUPERVISOR) {
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/branch/dashboard' },
      { name: 'Data WBP', icon: Users, path: '/branch/inmates' },
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
