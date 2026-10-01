import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../services/api';
import { normalizeRole, ROLES } from '../config/menuConfig';

const ProtectedRoute = ({ allowedRoles, children }) => {
  let token = getAuthToken();
  const authUser = getAuthUser();

  // Jika token belum ada tapi authUser ada di session (misal mode mock development), berikan fallback token aman
  if (!token && authUser) {
    token = 'pascall_session_token';
    localStorage.setItem('token', token);
  }

  // Jika tidak ada token dan tidak ada user, arahkan ke login
  if (!token && !authUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = normalizeRole(authUser?.role);
    const isAllowed = allowedRoles.some((r) => normalizeRole(r) === currentRole);

    if (!isAllowed) {
      if (currentRole === ROLES.SUPERADMIN) {
        return <Navigate to="/dashboard" replace />;
      }
      return <Navigate to="/branch/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
