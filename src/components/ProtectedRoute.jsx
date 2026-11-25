import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../services/api';
import { normalizeRole, ROLES } from '../config/menuConfig';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = getAuthToken();
  const authUser = getAuthUser();

  // Jika tidak ada token atau tidak ada user, langsung arahkan ke login
  if (!token || !authUser) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = normalizeRole(authUser?.role);

  // Jika role tidak valid atau kosong, arahkan ke login
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada pembatasan role tertentu
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => normalizeRole(r) === currentRole);

    if (!isAllowed) {
      if (currentRole === ROLES.SUPERADMIN) {
        return <Navigate to="/dashboard" replace />;
      }
      if (currentRole === ROLES.FINANCE) {
        return <Navigate to="/finance/dashboard" replace />;
      }
      if (currentRole === ROLES.ADMIN_KANWIL) {
        return <Navigate to="/kanwil/dashboard" replace />;
      }
      if (currentRole === ROLES.OPERATOR_KANTIN) {
        return <Navigate to="/kopontren" replace />;
      }
      if (currentRole === ROLES.KEPALA_UPT || currentRole === ROLES.SUPERVISOR) {
        return <Navigate to="/branch/dashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // Operator Kopontren mengakses layout admin utama: arahkan ke /kopontren
  if (currentRole === ROLES.OPERATOR_KANTIN) {
    return <Navigate to="/kopontren" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
