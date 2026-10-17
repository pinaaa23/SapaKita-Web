import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeRole, ROLE_LABELS, ROLES, permissions } from '../config/menuConfig';
import { getAuthToken, getAuthUser, setAuthSession, clearAuthSession, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getAuthUser());

  const tokenPayload = useMemo(() => {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        return JSON.parse(atob(parts[1]));
      } catch {
        return null;
      }
    }
    return null;
  }, [token]);

  // Robust cascading normalization role dari user.role, localStorage, token payload, atau route
  const role = useMemo(() => {
    if (user?.role) {
      const n = normalizeRole(user.role);
      if (n) return n;
    }
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      const n = normalizeRole(storedRole);
      if (n) return n;
    }
    if (tokenPayload?.role || tokenPayload?.userRole) {
      const n = normalizeRole(tokenPayload.role || tokenPayload.userRole);
      if (n) return n;
    }
    // Fallback berdasarkan route aktif jika di bawah /branch/
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/branch')) {
      const hint = (user?.email || tokenPayload?.email || '').toLowerCase();
      if (hint.includes('spv') || hint.includes('supervisor')) {
        return ROLES.SUPERVISOR;
      }
      return ROLES.KEPALA_UPT;
    }
    return '';
  }, [user, tokenPayload]);

  const roleLabel = useMemo(() => {
    if (!role) return '';
    return ROLE_LABELS[role] || (role === ROLES.SUPERVISOR ? 'Supervisor' : (role === ROLES.KEPALA_UPT ? 'Kepala UPT' : (role === ROLES.OPERATOR_KANTIN ? 'Operator Kantin' : (role === ROLES.SUPERADMIN ? 'Super Administrator' : ''))));
  }, [role]);

  // Nama pengguna akun yang login (bukan label role). Fallback ke token/email jika user.name kosong.
  const userName = useMemo(() => {
    if (role === ROLES.ADMIN_KANWIL) {
      if (user?.kanwilName) return user.kanwilName;
      if (user?.email?.includes('diy') || user?.id === 'kanwil-diy') return 'Kanwil DI Yogyakarta';
      if (user?.email?.includes('jateng') || user?.id === 'kanwil-jateng') return 'Kanwil Jawa Tengah';
      return 'Kanwil Jawa Barat';
    }
    if (user?.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    if (tokenPayload?.name && tokenPayload.name.trim() !== '') {
      return tokenPayload.name.trim();
    }
    if (user?.email) {
      const cleanEmail = user.email.split('@')[0].replace(/[._]/g, ' ');
      return cleanEmail.charAt(0).toUpperCase() + cleanEmail.slice(1);
    }
    if (tokenPayload?.email) {
      const cleanEmail = tokenPayload.email.split('@')[0].replace(/[._]/g, ' ');
      return cleanEmail.charAt(0).toUpperCase() + cleanEmail.slice(1);
    }
    return roleLabel || '';
  }, [user, tokenPayload, roleLabel]);

  // Nama UPT / Cabang
  const uptName = useMemo(() => {
    const direct = user?.branch?.name || user?.branchName || (typeof user?.branch === 'string' ? user.branch : '') || user?.uptName || user?.branchLocation || '';
    if (direct && direct.trim() !== '' && direct.trim().toLowerCase() !== 'upt anda' && direct.trim().toLowerCase() !== 'cabang terdaftar' && direct.trim().toLowerCase() !== 'upt terdaftar') {
      return direct.trim();
    }
    return '';
  }, [user]);

  // Specific Permission Flags (false jika tidak ada role / belum login)
  const canViewRecordings = useMemo(() => Boolean(role && permissions.canViewRecordings(role)), [role]);
  const canManageUsers = useMemo(() => Boolean(role && permissions.canManageUsers(role)), [role]);
  const canManagePackages = useMemo(() => Boolean(role && permissions.canManagePackages(role)), [role]);

  const isAuthenticated = useMemo(() => Boolean(token && (user || role)), [token, user, role]);

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
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearAuthSession();
      setToken(null);
      setUser(null);
    }
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

  // Auto-resolve branch name & profil untuk semua role yang login (dieksekusi sekali per session/token)
  const hasFetchedProfileRef = React.useRef(false);

  useEffect(() => {
    if (!token || hasFetchedProfileRef.current || role === ROLES.ADMIN_KANWIL) return;

    const currentBranchName = user?.branch?.name || user?.branchName || (typeof user?.branch === 'string' ? user.branch : '') || user?.uptName;
    const isNeutralPlaceholder = !currentBranchName || 
      currentBranchName.trim().toLowerCase() === 'cabang terdaftar' || 
      currentBranchName.trim().toLowerCase() === 'upt terdaftar' || 
      currentBranchName.trim().toLowerCase() === 'upt anda';

    if (isNeutralPlaceholder || !user?.name) {
      hasFetchedProfileRef.current = true;
      // 1. Ambil profile pengguna dari backend (tersedia untuk semua role terautentikasi)
      import('../services/api').then(({ apiFetch }) => {
        apiFetch('/api/users/profile')
          .then((profileRes) => {
            const profileData = profileRes?.data || profileRes;
            if (profileData && typeof profileData === 'object') {
              const bName = profileData.branch?.name || profileData.branchName || '';
              const resolvedRole = normalizeRole(profileData.role) || role;
              const updated = {
                ...(user || {}),
                ...profileData,
                role: resolvedRole,
                branchName: bName || user?.branchName || '',
                branch: profileData.branch || user?.branch || null,
              };
              setUser(updated);
              setAuthSession(token, updated);
            }
          })
          .catch(() => {
            // 2. Fallback khusus SUPERADMIN jika ada branchId
            const bId = user?.branchId || user?.branch?.id;
            if (role === ROLES.SUPERADMIN && bId) {
              import('../services/branchService').then(({ getBranchById }) => {
                getBranchById(bId)
                  .then((b) => {
                    if (b?.name) {
                      const updated = { ...(user || {}), branchName: b.name, branch: b };
                      setUser(updated);
                      setAuthSession(token, updated);
                    }
                  })
                  .catch(() => {});
              }).catch(() => {});
            }
          });
      }).catch(() => {});
    }
  }, [token, role]);

  const value = useMemo(() => ({
    token,
    user,
    role,
    roleLabel,
    userName,
    uptName,
    kanwilName: user?.kanwilName || '',
    isAuthenticated,
    isAdminKanwil: Boolean(isAuthenticated && role === ROLES.ADMIN_KANWIL),
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
