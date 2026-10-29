import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import BranchesList from './pages/Branches/List';
import BranchCreate from './pages/Branches/Create';
import BranchDetail from './pages/Branches/Detail';
import BranchEdit from './pages/Branches/Edit';

import InmatesList from './pages/Inmates/List';

import CallsList from './pages/Calls/List';
import CallDetail from './pages/Calls/Detail';

import TransactionsList from './pages/Transactions/List';
import TransactionDetail from './pages/Transactions/Detail';

import Reports from './pages/Reports';
import Profile from './pages/Profile';
import PackagesList from './pages/Packages/List';
import CanteenTopup from './pages/CanteenTopup';

// Branch Admin Pages
import BranchDashboard from './pages/branch/Dashboard';
import BranchRecordings from './pages/branch/Recordings';
import BranchUsers from './pages/branch/Users';
import BranchUsersCreate from './pages/branch/users/Create';
import BranchContacts from './pages/branch/Contacts';
import BranchTransactions from './pages/branch/Transactions';
import BranchProfile from './pages/branch/Profile';
import BranchReports from './pages/branch/Reports';
import BranchPackages from './pages/branch/Packages';
// Kanwil Pages (Demo Role: ADMIN_KANWIL)
import KanwilDashboard from './pages/kanwil/Dashboard';
import KanwilBranches from './pages/kanwil/Branches';
import KanwilBranchCreate from './pages/kanwil/branches/Create';
import KanwilInmates from './pages/kanwil/Inmates';
import KanwilReports from './pages/kanwil/Reports';
import KanwilCalls from './pages/kanwil/Calls';
import KanwilProfile from './pages/kanwil/Profile';
import KanwilManagement from './pages/kanwil/KanwilManagement';
import KanwilCreate from './pages/kanwil/Create';
import KanwilAdmins from './pages/kanwil/KanwilAdmins';

// Finance Pages (Role: FINANCE)
import FinanceDashboard from './pages/finance/Dashboard';
import FinanceBilling from './pages/finance/Billing';
import FinanceContracts from './pages/finance/Contracts';
import FinanceReports from './pages/finance/Reports';
import FinanceProfile from './pages/finance/Profile';

import { ROLES } from './config/menuConfig';
import { AuthProvider } from './context/AuthContext';

import RoleGuard from './components/RoleGuard';

// Branch Inmates Pages
import BranchInmatesList from './pages/branch/inmates/List';
import BranchInmatesCreate from './pages/branch/inmates/Create';
import BranchInmatesDetail from './pages/branch/inmates/Detail';
import BranchInmatesEdit from './pages/branch/inmates/Edit';

// Kantin Pages (Operator Kantin only -- route /kantin/*)
import KantinLayout from './layouts/KantinLayout';
import KantinProtectedRoute from './components/KantinProtectedRoute';
import KantinPaket from './pages/kantin/PaketPage';
import KantinStatusWartel from './pages/kantin/StatusWartelPage';
import KantinRiwayat from './pages/kantin/RiwayatPage';
import KantinTopUpSaldo from './pages/kantin/TopUpSaldoPage';
import KantinVoucher from './pages/kantin/VoucherPage';
import KantinStruk from './pages/kantin/StrukPage';
import KantinKontak from './pages/kantin/KontakPage';
import KantinTagihan from './pages/kantin/TagihanPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Langsung redirect root ke halaman login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Dashboard Routes wrapped in ProtectedRoute & Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Superadmin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Branches Routes */}
                <Route path="branches">
                  <Route index element={<BranchesList />} />
                  <Route path="create" element={<BranchCreate />} />
                  <Route path=":id" element={<BranchDetail />} />
                  <Route path=":id/edit" element={<BranchEdit />} />
                </Route>

                {/* Superadmin Inmates Routes (Read-Only) */}
                <Route path="inmates">
                  <Route index element={<InmatesList />} />
                  <Route path=":id" element={<BranchInmatesDetail />} />
                </Route>

                {/* Calls Routes */}
                <Route path="calls">
                  <Route index element={<CallsList />} />
                  <Route path=":id" element={<CallDetail />} />
                </Route>

                {/* Transactions Routes */}
                <Route path="transactions">
                  <Route index element={<TransactionsList />} />
                  <Route path=":id" element={<TransactionDetail />} />
                </Route>

                {/* Superadmin Packages, Kanwil Management Routes (canteen-topup dialihkan ke dashboard) */}
                <Route path="packages" element={<PackagesList />} />
                <Route path="canteen-topup" element={<CanteenTopup />} />
                <Route path="billing" element={<CanteenTopup />} />
                <Route path="kanwil-management" element={<KanwilManagement />} />
                <Route path="kanwil-management/create" element={<KanwilCreate />} />
                <Route path="kanwil-management/:id/edit" element={<KanwilCreate />} />
                <Route path="kanwil-admins" element={<KanwilAdmins />} />

                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Branch Admin Routes (Kepala UPT & Supervisor) */}
              <Route path="branch" element={<ProtectedRoute allowedRoles={[ROLES.KEPALA_UPT, ROLES.SUPERVISOR]} />}>
                <Route index element={<Navigate to="/branch/dashboard" replace />} />
                <Route path="dashboard" element={<BranchDashboard />} />
                <Route path="inmates">
                  <Route index element={<BranchInmatesList />} />
                  <Route 
                    path="create" 
                    element={
                      <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                        <BranchInmatesCreate />
                      </RoleGuard>
                    } 
                  />
                  <Route path=":id" element={<BranchInmatesDetail />} />
                  <Route 
                    path=":id/edit" 
                    element={
                      <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                        <BranchInmatesEdit />
                      </RoleGuard>
                    } 
                  />
                </Route>

                {/* Rekaman Panggilan - Hanya Kepala UPT */}
                <Route
                  path="recordings"
                  element={
                    <RoleGuard allowedRoles={[ROLES.KEPALA_UPT]}>
                      <BranchRecordings />
                    </RoleGuard>
                  }
                />

                {/* Kelola Pengguna - Hanya Kepala UPT */}
                <Route
                  path="users"
                  element={
                    <RoleGuard allowedRoles={[ROLES.KEPALA_UPT]}>
                      <BranchUsers />
                    </RoleGuard>
                  }
                />
                <Route
                  path="users/create"
                  element={
                    <RoleGuard allowedRoles={[ROLES.KEPALA_UPT]}>
                      <BranchUsersCreate />
                    </RoleGuard>
                  }
                />

                {/* Kelola Paket - Khusus Supervisor UPT (pembuatan paket per UPT) */}
                <Route
                  path="packages"
                  element={
                    <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                      <BranchPackages />
                    </RoleGuard>
                  }
                />

                {/* Persetujuan Kontak - Nonaktifkan (dialihkan ke Dashboard Cabang) */}
                {/* <Route
                  path="contacts"
                  element={
                    <RoleGuard allowedRoles={[ROLES.KEPALA_UPT, ROLES.SUPERVISOR]}>
                      <BranchContacts />
                    </RoleGuard>
                  }
                /> */}
                <Route path="contacts" element={<Navigate to="/branch/dashboard" replace />} />
                <Route path="transactions" element={<BranchTransactions />} />
                <Route path="reports" element={<BranchReports />} />
                <Route path="profile" element={<BranchProfile />} />
              </Route>

              {/* Kanwil Admin Routes (Admin Kanwil Demo) */}
              <Route path="kanwil" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN_KANWIL]} />}>
                <Route index element={<Navigate to="/kanwil/dashboard" replace />} />
                <Route path="dashboard" element={<KanwilDashboard />} />
                <Route path="branches" element={<KanwilBranches />} />
                {/* Proteksi route: Kanwil bersifat read-only, dialihkan kembali ke daftar UPT */}
                <Route path="branches/create" element={<Navigate to="/kanwil/branches" replace />} />
                <Route path="inmates" element={<KanwilInmates />} />
                <Route path="calls" element={<KanwilCalls />} />
                <Route path="canteen-topup" element={<CanteenTopup />} />
                <Route path="reports" element={<KanwilReports />} />
                <Route path="profile" element={<KanwilProfile />} />
              </Route>

              {/* Finance Admin Routes (Role: FINANCE) */}
              <Route path="finance" element={<ProtectedRoute allowedRoles={[ROLES.FINANCE]} />}>
                <Route index element={<Navigate to="/finance/dashboard" replace />} />
                <Route path="dashboard" element={<FinanceDashboard />} />
                <Route path="billing" element={<FinanceBilling />} />
                <Route path="contracts" element={<FinanceContracts />} />
                <Route path="reports" element={<FinanceReports />} />
                <Route path="profile" element={<FinanceProfile />} />
              </Route>
            </Route>
          </Route>

          {/* ============================================================
              KANTIN ROUTES -- /kantin/* (Operator Kantin only)
              Menggunakan KantinProtectedRoute + KantinLayout tersendiri.
              Tidak menyentuh Layout dashboard role lain.
              ============================================================ */}
          <Route element={<KantinProtectedRoute />}>
            <Route element={<KantinLayout />}>
              <Route path="/kantin" element={<KantinPaket />} />
              <Route path="/kantin/kontak" element={<KantinKontak />} />
              <Route path="/kantin/status-wartel" element={<KantinStatusWartel />} />
              <Route path="/kantin/riwayat" element={<KantinRiwayat />} />
              <Route path="/kantin/tagihan" element={<KantinTagihan />} />
              <Route path="/kantin/top-up-saldo" element={<KantinTagihan />} />
              <Route path="/kantin/voucher/:id" element={<KantinVoucher />} />
              <Route path="/kantin/struk/:id" element={<KantinStruk />} />
              {/* Fallback di dalam kantin -> kembali ke paket */}
              <Route path="/kantin/*" element={<Navigate to="/kantin" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;