import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeRole, ROLE_LABELS, ROLES, permissions } from '../config/menuConfig';
import { getAuthToken, getAuthUser, setAuthSession, clearAuthSession } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getAuthUser());

  // Normalize role from current user object
  const role = useMemo(() => {
    return user?.role ? normalizeRole(user.role) : '';
  }, [user]);

  const roleLabel = useMemo(() => {
    if (!role) return '';
    return ROLE_LABELS[role] || (role === ROLES.SUPERVISOR ? 'Supervisor' : (role === ROLES.KEPALA_UPT ? 'Kepala UPT' : (role === ROLES.OPERATOR_KANTIN ? 'Operator Kantin' : (role === ROLES.SUPERADMIN ? 'Super Administrator' : ''))));
  }, [role]);

  // Nama pengguna akun yang login (bukan label role). Fallback ke roleLabel jika user.name kosong.
  const userName = useMemo(() => {
    if (user?.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    return roleLabel || '';
  }, [user, roleLabel]);

  // Nama UPT / Cabang
  const uptName = useMemo(() => {
    return user?.branch?.name || user?.branchName || (typeof user?.branch === 'string' ? user.branch : '');
  }, [user]);

  // Specific Permission Flags (false jika tidak ada role / belum login)
  const canViewRecordings = useMemo(() => Boolean(role && permissions.canViewRecordings(role)), [role]);
  const canManageUsers = useMemo(() => Boolean(role && permissions.canManageUsers(role)), [role]);
  const canManagePackages = useMemo(() => Boolean(role && permissions.canManagePackages(role)), [role]);

  const isAuthenticated = useMemo(() => Boolean(token && user && role), [token, user, role]);

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
    isAuthenticated,
    isSupervisor: Boolean(isAuthenticated && role === ROLES.SUPERVISOR),
    isKepalaUpt: Boolean(isAuthenticated && role === ROLES.KEPALA_UPT),
    isSuperadmin: Boolean(isAuthenticated && role === ROLES.SUPERADMIN),
    isOperatorKantin: Boolean(isAuthenticated && role === ROLES.OPERATOR_KANTIN),
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
    isAuthenticated,
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
