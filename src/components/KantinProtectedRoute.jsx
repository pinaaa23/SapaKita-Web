import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../services/api';
import { normalizeRole, ROLES } from '../config/menuConfig';
import { Loader2 } from 'lucide-react';

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

  const currentRole = normalizeRole(authUser?.role);

  // Role tidak valid -> arahkan ke login
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  // Operator Kantin: izinkan masuk
  if (currentRole === ROLES.OPERATOR_KANTIN) {
    return <Outlet />;
  }

  // Role lain: redirect ke dashboard mereka masing-masing
  if (currentRole === ROLES.SUPERADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  // Kepala UPT dan Supervisor -> branch dashboard
  if (currentRole === ROLES.KEPALA_UPT || currentRole === ROLES.SUPERVISOR) {
    return <Navigate to="/branch/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default KantinProtectedRoute;