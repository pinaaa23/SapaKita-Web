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

import SantriList from './pages/Santri/List';

import CallsList from './pages/Calls/List';
import CallDetail from './pages/Calls/Detail';

import TransactionsList from './pages/Transactions/List';
import TransactionDetail from './pages/Transactions/Detail';

import Reports from './pages/Reports';
import Profile from './pages/Profile';
import PackagesList from './pages/Packages/List';
import CanteenTopup from './pages/CanteenTopup';
import AppReleasesPage from './pages/AppReleases/AppReleasesPage';
import MobileDownloadPage from './pages/MobileDownload/MobileDownloadPage';

// Branch / Kampus Admin Pages
import BranchDashboard from './pages/branch/Dashboard';
import BranchRecordings from './pages/branch/Recordings';
import BranchUsers from './pages/branch/Users';
import BranchUsersCreate from './pages/branch/users/Create';
import BranchTransactions from './pages/branch/Transactions';
import BranchProfile from './pages/branch/Profile';
import BranchReports from './pages/branch/Reports';
import BranchPackages from './pages/branch/Packages';
import BranchCctv from './pages/branch/Cctv';

// Kanwil / Yayasan Pages
import KanwilDashboard from './pages/kanwil/Dashboard';
import KanwilBranches from './pages/kanwil/Branches';
import KanwilInmates from './pages/kanwil/Inmates';
import KanwilReports from './pages/kanwil/Reports';
import KanwilCalls from './pages/kanwil/Calls';
import KanwilProfile from './pages/kanwil/Profile';
import KanwilManagement from './pages/kanwil/KanwilManagement';
import KanwilCreate from './pages/kanwil/Create';
import KanwilAdmins from './pages/kanwil/KanwilAdmins';

// Finance Pages (Role: FINANCE & SUPERADMIN)
import FinanceDashboard from './pages/finance/Dashboard';
import FinanceBilling from './pages/finance/Billing';
import FinanceContracts from './pages/finance/Contracts';
import FinanceReports from './pages/finance/Reports';
import FinanceAccounts from './pages/finance/FinanceAccounts';

import { ROLES } from './config/menuConfig';
import { AuthProvider } from './context/AuthContext';

import RoleGuard from './components/RoleGuard';

// Branch Santri Pages
import BranchSantriList from './pages/branch/santri/List';
import BranchSantriCreate from './pages/branch/santri/Create';
import BranchSantriDetail from './pages/branch/santri/Detail';
import BranchSantriEdit from './pages/branch/santri/Edit';

// Kopontren Pages (Operator Kopontren only -- route /kopontren/*)
import KopontrenLayout from './layouts/KopontrenLayout';
import KopontrenProtectedRoute from './components/KopontrenProtectedRoute';
import KopontrenPaket from './pages/kopontren/PaketPage';
import KopontrenStatusWartel from './pages/kopontren/StatusWartelPage';
import KopontrenRiwayat from './pages/kopontren/RiwayatPage';
import KopontrenVoucher from './pages/kopontren/VoucherPage';
import KopontrenStruk from './pages/kopontren/StrukPage';
import KopontrenKontak from './pages/kopontren/KontakPage';
import KopontrenTagihan from './pages/kopontren/TagihanPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root ke halaman login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          {/* Public Mobile Download Gateway (Scan Barcode / Download Link) */}
          <Route path="/download/:token" element={<MobileDownloadPage />} />

          {/* Admin Dashboard Routes wrapped in ProtectedRoute & Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Superadmin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Kampus / Branches Routes */}
                <Route path="branches">
                  <Route index element={<BranchesList />} />
                  <Route path="create" element={<BranchCreate />} />
                  <Route path=":id" element={<BranchDetail />} />
                  <Route path=":id/edit" element={<BranchEdit />} />
                </Route>

                {/* Superadmin Santri Routes */}
                <Route path="santri">
                  <Route index element={<SantriList />} />
                  <Route path=":id" element={<BranchSantriDetail />} />
                </Route>
                <Route path="inmates" element={<Navigate to="/santri" replace />} />
                <Route path="inmates/:id" element={<Navigate to="/santri" replace />} />

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

                {/* Superadmin Packages, Yayasan Management, Finance */}
                <Route path="packages" element={<PackagesList />} />
                <Route path="canteen-topup" element={<CanteenTopup />} />
                <Route path="kanwil-management" element={<KanwilManagement />} />
                <Route path="kanwil-management/create" element={<KanwilCreate />} />
                <Route path="kanwil-management/:id/edit" element={<KanwilCreate />} />
                <Route path="kanwil-admins" element={<KanwilAdmins />} />
                <Route path="finance-accounts" element={<FinanceAccounts />} />
                <Route path="billing" element={<FinanceBilling />} />
                <Route path="contracts" element={<FinanceContracts />} />

                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />
                <Route path="app-releases" element={<AppReleasesPage />} />
              </Route>

              {/* Branch Admin Routes (Pimpinan Kampus & Supervisor) */}
              <Route path="branch" element={<ProtectedRoute allowedRoles={[ROLES.KEPALA_UPT, ROLES.SUPERVISOR]} />}>
                <Route index element={<Navigate to="/branch/dashboard" replace />} />
                <Route path="dashboard" element={<BranchDashboard />} />
                <Route path="cctv" element={<BranchCctv />} />
                
                {/* Santri CRUD */}
                <Route path="santri">
                  <Route index element={<BranchSantriList />} />
                  <Route 
                    path="create" 
                    element={
                      <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                        <BranchSantriCreate />
                      </RoleGuard>
                    } 
                  />
                  <Route path=":id" element={<BranchSantriDetail />} />
                  <Route 
                    path=":id/edit" 
                    element={
                      <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                        <BranchSantriEdit />
                      </RoleGuard>
                    } 
                  />
                </Route>
                {/* Backward compatibility redirects */}
                <Route path="inmates/*" element={<Navigate to="/branch/santri" replace />} />

                {/* Rekaman Panggilan - Pimpinan Kampus */}
                <Route
                  path="recordings"
                  element={
                    <RoleGuard allowedRoles={[ROLES.KEPALA_UPT]}>
                      <BranchRecordings />
                    </RoleGuard>
                  }
                />

                {/* Kelola Pengguna - Pimpinan Kampus */}
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

                {/* Kelola Paket - Supervisor Kampus */}
                <Route
                  path="packages"
                  element={
                    <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                      <BranchPackages />
                    </RoleGuard>
                  }
                />

                <Route path="contacts" element={<Navigate to="/branch/dashboard" replace />} />
                <Route path="transactions" element={<BranchTransactions />} />
                <Route
                  path="billing"
                  element={
                    <RoleGuard allowedRoles={[ROLES.SUPERVISOR]}>
                      <KopontrenTagihan />
                    </RoleGuard>
                  }
                />
                <Route path="reports" element={<BranchReports />} />
                <Route path="profile" element={<BranchProfile />} />
              </Route>

              {/* Yayasan Admin Routes (Admin Yayasan / KANWIL_ADMIN) */}
              <Route path="kanwil" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN_KANWIL]} />}>
                <Route index element={<Navigate to="/kanwil/dashboard" replace />} />
                <Route path="dashboard" element={<KanwilDashboard />} />
                <Route path="branches" element={<KanwilBranches />} />
                <Route path="branches/create" element={<Navigate to="/kanwil/branches" replace />} />
                <Route path="santri" element={<KanwilInmates />} />
                <Route path="inmates" element={<Navigate to="/kanwil/santri" replace />} />
                <Route path="calls" element={<KanwilCalls />} />
                <Route path="canteen-topup" element={<CanteenTopup />} />
                <Route path="reports" element={<KanwilReports />} />
                <Route path="profile" element={<KanwilProfile />} />
              </Route>

              {/* Finance Admin Routes (Role: FINANCE & SUPERADMIN) */}
              <Route path="finance" element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.SUPERADMIN]} />}>
                <Route index element={<Navigate to="/finance/dashboard" replace />} />
                <Route path="dashboard" element={<FinanceDashboard />} />
                <Route path="billing" element={<FinanceBilling />} />
                <Route path="contracts" element={<FinanceContracts />} />
                <Route path="reports" element={<FinanceReports />} />
              </Route>
            </Route>
          </Route>

          {/* ============================================================
              KOPONTREN ROUTES -- /kopontren/* (Operator Kopontren)
              ============================================================ */}
          <Route element={<KopontrenProtectedRoute />}>
            <Route element={<KopontrenLayout />}>
              <Route path="/kopontren" element={<KopontrenPaket />} />
              <Route path="/kopontren/kontak" element={<KopontrenKontak />} />
              <Route path="/kopontren/status-wartel" element={<KopontrenStatusWartel />} />
              <Route path="/kopontren/riwayat" element={<KopontrenRiwayat />} />
              <Route path="/kopontren/tagihan" element={<Navigate to="/kopontren" replace />} />
              <Route path="/kopontren/voucher/:id" element={<KopontrenVoucher />} />
              <Route path="/kopontren/struk/:id" element={<KopontrenStruk />} />
              <Route path="/kopontren/*" element={<Navigate to="/kopontren" replace />} />
            </Route>
          </Route>

          {/* Backward compatibility route for /kantin */}
          <Route path="/kantin/*" element={<Navigate to="/kopontren" replace />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
