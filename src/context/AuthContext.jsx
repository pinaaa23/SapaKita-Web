import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeRole, ROLE_LABELS, ROLES, permissions } from '../config/menuConfig';
import { getAuthToken, getAuthUser, setAuthSession, clearAuthSession } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getAuthUser());

  // Normalize role from current user object
  const role = useMemo(() => {
    return normalizeRole(user?.role);
  }, [user]);

  const roleLabel = useMemo(() => {
    return ROLE_LABELS[role] || (role === ROLES.SUPERVISOR ? 'Supervisor' : (role === ROLES.KEPALA_UPT ? 'Kepala UPT' : (role === ROLES.OPERATOR_KANTIN ? 'Operator Kantin' : 'Super Administrator')));
  }, [role]);

  // Nama pengguna akun yang login (bukan label role). Fallback ke roleLabel jika user.name kosong.
  const userName = useMemo(() => {
    if (user?.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    return roleLabel;
  }, [user, roleLabel]);

  // Nama UPT / Cabang
  const uptName = useMemo(() => {
    return user?.branch?.name || user?.branchName || (typeof user?.branch === 'string' ? user.branch : 'Lapas Cipinang');
  }, [user]);

  // Specific Permission Flags
  const canViewRecordings = useMemo(() => permissions.canViewRecordings(role), [role]);
  const canManageUsers = useMemo(() => permissions.canManageUsers(role), [role]);
  const canManagePackages = useMemo(() => permissions.canManagePackages(role), [role]);

  // Login handler
  const login = useCallback((newToken, newUser) => {
    // Clear old data first
    clearAuthSession();
    
    // Save to storage
    setAuthSession(newToken, newUser);
    
    // Update state
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  }, []);

  // Listen for storage events across tabs or local changes
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(getAuthToken());
      setUser(getAuthUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    role,
    roleLabel,
    userName,
    uptName,
    isAuthenticated: Boolean(token && user),
    isSupervisor: role === ROLES.SUPERVISOR,
    isKepalaUpt: role === ROLES.KEPALA_UPT,
    isSuperadmin: role === ROLES.SUPERADMIN,
    isOperatorKantin: role === ROLES.OPERATOR_KANTIN,
    canViewRecordings,
    canManageUsers,
    canManagePackages,
    login,
    logout,
  }), [
    token,
    user,
    role,
    roleLabel,
    userName,
    uptName,
    canViewRecordings,
    canManageUsers,
    canManagePackages,
    login,
    logout,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
