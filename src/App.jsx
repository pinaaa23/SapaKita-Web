import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import BranchesList from './pages/Branches/List';
import BranchCreate from './pages/Branches/Create';
import BranchDetail from './pages/Branches/Detail';
import BranchEdit from './pages/Branches/Edit';

import UsersList from './pages/Users/List';
import UserCreate from './pages/Users/Create';
import UserDetail from './pages/Users/Detail';
import UserEdit from './pages/Users/Edit';

import CallsList from './pages/Calls/List';
import CallDetail from './pages/Calls/Detail';

import TransactionsList from './pages/Transactions/List';
import TransactionDetail from './pages/Transactions/Detail';

import Reports from './pages/Reports';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Branches Routes */}
          <Route path="branches">
            <Route index element={<BranchesList />} />
            <Route path="create" element={<BranchCreate />} />
            <Route path=":id" element={<BranchDetail />} />
            <Route path=":id/edit" element={<BranchEdit />} />
          </Route>

          {/* Users Routes */}
          <Route path="users">
            <Route index element={<UsersList />} />
            <Route path="create" element={<UserCreate />} />
            <Route path=":id" element={<UserDetail />} />
            <Route path=":id/edit" element={<UserEdit />} />
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
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
