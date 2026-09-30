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

// Branch Admin Pages
import BranchDashboard from './pages/branch/Dashboard';
// import BranchContacts from './pages/branch/Contacts'; // Dinonaktifkan sesuai alur baru (pendaftaran mandiri keluarga)
import BranchTransactions from './pages/branch/Transactions';
import BranchProfile from './pages/branch/Profile';
import BranchReports from './pages/branch/Reports';

// Branch Inmates Pages
import BranchInmatesList from './pages/branch/inmates/List';
import BranchInmatesCreate from './pages/branch/inmates/Create';
import BranchInmatesDetail from './pages/branch/inmates/Detail';
import BranchInmatesEdit from './pages/branch/inmates/Edit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Langsung redirect root ke halaman login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Dashboard Routes wrapped in ProtectedRoute & Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
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

            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />

            {/* Branch Admin Routes */}
            <Route path="branch">
              <Route index element={<Navigate to="/branch/dashboard" replace />} />
              <Route path="dashboard" element={<BranchDashboard />} />
              <Route path="inmates">
                <Route index element={<BranchInmatesList />} />
                <Route path="create" element={<BranchInmatesCreate />} />
                <Route path=":id" element={<BranchInmatesDetail />} />
                <Route path=":id/edit" element={<BranchInmatesEdit />} />
              </Route>
              {/* <Route path="contacts" element={<BranchContacts />} /> // Rute kontak dinonaktifkan */}
              <Route path="transactions" element={<BranchTransactions />} />
              <Route path="reports" element={<BranchReports />} />
              <Route path="profile" element={<BranchProfile />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
