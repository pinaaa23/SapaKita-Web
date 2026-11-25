import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../services/api';
import { normalizeRole, ROLES } from '../config/menuConfig';

/**
 * KopontrenProtectedRoute - Proteksi route khusus untuk halaman Kopontren (/kopontren/*).
 * Mengizinkan role OPERATOR_KANTIN (Operator Kopontren), SUPERVISOR, KEPALA_UPT, dan SUPERADMIN.
 */
const KopontrenProtectedRoute = () => {
  const token = getAuthToken();
  const authUser = getAuthUser();

  // Belum login sama sekali -> langsung ke login
  if (!token || !authUser) {
    return <Navigate to="/login" replace />;
  }

  let currentRole = normalizeRole(authUser?.role) || normalizeRole(localStorage.getItem('role'));
  if (!currentRole && token && typeof token === 'string' && token.split('.').length === 3) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      currentRole = normalizeRole(decoded.role || decoded.userRole);
    } catch {
      // ignore
    }
  }

  // Role tidak valid -> arahkan ke login
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  if (
    currentRole === ROLES.OPERATOR_KANTIN ||
    currentRole === ROLES.SUPERVISOR ||
    currentRole === ROLES.KEPALA_UPT ||
    currentRole === ROLES.SUPERADMIN
  ) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

export default KopontrenProtectedRoute;
