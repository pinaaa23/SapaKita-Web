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
  let token = getAuthToken();
  const authUser = getAuthUser();

  // Jika token belum ada tapi authUser ada di session (misal mode mock development), berikan fallback token
  if (!token && authUser) {
    token = 'pascall_session_token';
    localStorage.setItem('token', token);
  }

  // Belum login sama sekali
  if (!token && !authUser) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = normalizeRole(authUser?.role);

  // Operator Kantin: izinkan masuk
  if (currentRole === ROLES.OPERATOR_KANTIN) {
    return <Outlet />;
  }

  // Role lain: redirect ke dashboard mereka masing-masing
  if (currentRole === ROLES.SUPERADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  // Kepala UPT dan Supervisor -> branch dashboard
  return <Navigate to="/branch/dashboard" replace />;
};

export default KantinProtectedRoute;