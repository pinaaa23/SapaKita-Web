import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../services/api';
import { normalizeRole, ROLES } from '../config/menuConfig';

/**
 * KantinProtectedRoute - Proteksi route khusus untuk halaman Kantin (/kantin/*).
 * Hanya mengizinkan role OPERATOR_KANTIN.
 * - Belum login -> redirect ke /login
 * - Role lain -> redirect ke dashboard role mereka
 * - Operator Kantin -> izinkan masuk
 * Menggunakan mekanisme auth PasCall yang sudah ada.
 */
const KantinProtectedRoute = () => {
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

  // Operator Kantin, Supervisor, Kepala UPT, dan Superadmin: izinkan masuk ke menu kantin
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

export default KantinProtectedRoute;