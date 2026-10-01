import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, ROLES } from '../config/menuConfig';

/**
 * RoleGuard component untuk memproteksi halaman spesifik berdasarkan role pengguna.
 * Jika role tidak diizinkan, otomatis dialihkan ke Dashboard UPT (tanpa logout).
 */
const RoleGuard = ({ allowedRoles, children }) => {
  const { role: currentRole } = useAuth();

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => normalizeRole(r) === currentRole);

    if (!isAllowed) {
      if (currentRole === ROLES.SUPERADMIN) {
        return <Navigate to="/dashboard" replace />;
      }
      return (
        <Navigate 
          to="/branch/dashboard" 
          state={{ unauthorizedAccess: true, message: 'Anda tidak memiliki akses ke halaman ini.' }} 
          replace 
        />
      );
    }
  }

  return children;
};

export default RoleGuard;
