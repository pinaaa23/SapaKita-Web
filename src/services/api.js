// Base API Service for PasCall Web Application
export const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'http://127.0.0.1:5000';
})();

export const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('pascall_token');
};

export const getAuthUser = () => {
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('pascall_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Error parsing stored user data:', err);
    return null;
  }
};

export const setAuthSession = (token, user) => {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('pascall_token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('pascall_user', JSON.stringify(user));
    if (user.role) {
      localStorage.setItem('role', user.role);
    }
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('pascall_token');
  localStorage.removeItem('user');
  localStorage.removeItem('pascall_user');
  localStorage.removeItem('role');
  localStorage.removeItem('pascall_active_branch_id');
  localStorage.removeItem('pascall_active_branch_name');
  localStorage.removeItem('pascall_latest_branch_packages');
  localStorage.removeItem('pascall_upt_packages_v7');
  try {
    sessionStorage.clear();
  } catch (e) {
    // ignore
  }
  // Dispatch custom/storage event to sync any listeners
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // ignore
  }
};

export const logout = async () => {
  try {
    const token = getAuthToken();
    if (token) {
      await apiFetch('/api/auth/logout', {
        method: 'POST'
      });
    }
  } catch (err) {
    console.log('[Auth] Server logout request ignored:', err?.message || err);
  } finally {
    clearAuthSession();
  }
};

/**
 * Reusable HTTP fetcher with automated Authorization Bearer header injection
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const timeoutMs = options.timeout || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = (data && typeof data === 'object' && (data.message || data.error)) || 
        `Request failed with status ${response.status}`;

      // Ekstrak pesan validasi terperinci jika ada (misal ZodError: errors: [{ field, message }])
      if (data && typeof data === 'object' && Array.isArray(data.errors) && data.errors.length > 0) {
        const errorList = data.errors
          .map((e) => (typeof e === 'object' && e ? (e.message || e.field) : String(e)))
          .filter(Boolean);
        if (errorList.length > 0) {
          errorMessage = errorList.join(', ');
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network error / connection refused / timeout
    const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted');
    const networkError = new Error(
      isTimeout 
        ? 'Koneksi ke server timeout, coba lagi nanti' 
        : 'Server tidak dapat dihubungi, coba lagi nanti'
    );
    networkError.status = 0;
    networkError.isNetworkError = true;
    networkError.originalError = err;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * API Auth Endpoints
 */
export const CHANGE_PASSWORD_ENDPOINT = '/api/auth/change-password';
export const UPDATE_PROFILE_ENDPOINT = '/api/users/profile';
export const FORGOT_PASSWORD_ENDPOINT = '/api/auth/forgot-password';

export const login = async (identifier, password) => {
  return await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: identifier.trim(),
      password
    })
  });
};

export const forgotPasswordApi = async ({ email, newPassword, confirmPassword }) => {
  const cleanEmail = (email || '').trim();
  return await apiFetch(FORGOT_PASSWORD_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      email: cleanEmail,
      identifier: cleanEmail,
      newPassword,
      confirmPassword: confirmPassword || newPassword
    })
  });
};

export const register = async ({ name, phone, email, password, confirmPassword }) => {
  return await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      confirmPassword: confirmPassword || password
    })
  });
};

export const changePasswordApi = async ({ oldPassword, currentPassword, newPassword, confirmPassword }) => {
  return await apiFetch(CHANGE_PASSWORD_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      oldPassword: oldPassword || currentPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword
    })
  });
};

export const updateProfileApi = async (profileData) => {
  const payload = {
    ...(profileData.name ? { name: profileData.name.trim() } : {}),
    ...(profileData.phone !== undefined ? { phone: profileData.phone.trim() } : {})
  };

  const res = await apiFetch(UPDATE_PROFILE_ENDPOINT, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  // Perbarui data user di localStorage / session jika berhasil
  const currentUser = getAuthUser();
  if (currentUser) {
    const updatedUser = {
      ...currentUser,
      ...(res?.data || {}),
      ...(profileData.name ? { name: profileData.name.trim() } : {}),
      ...(profileData.phone ? { phone: profileData.phone.trim() } : {})
    };
    const token = getAuthToken();
    setAuthSession(token, updatedUser);
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      // ignore
    }
  }

  return res;
};

/**
 * API Health Check
 */
export const getHealth = async () => {
  return await apiFetch('/api/health');
};

/**
 * API Inmate (Warga Binaan) Endpoints
 */
export const getInmatesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString();
  const endpoint = queryString ? `/api/inmates?${queryString}` : '/api/inmates';
  return await apiFetch(endpoint);
};

export const createInmateApi = async ({ identifier, nip, name, initialPin, branchId, birthDate, dateOfBirth, blockRoom, entryDate }) => {
  const effectiveIdentifier = (identifier || nip)?.trim();
  const dob = birthDate || dateOfBirth;
  return await apiFetch('/api/inmates', {
    method: 'POST',
    body: JSON.stringify({
      identifier: effectiveIdentifier,
      nip: effectiveIdentifier,
      name: name?.trim(),
      initialPin: initialPin || '123456',
      ...(dob ? { birthDate: dob, dateOfBirth: dob } : {}),
      ...(blockRoom ? { blockRoom: blockRoom.trim() } : {}),
      ...(entryDate ? { entryDate } : {}),
      ...(branchId ? { branchId } : {})
    })
  });
};

/**
 * API Contact (Kontak Keluarga) Endpoints
 */
export const getContactsApi = async (status) => {
  const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
  return await apiFetch(`/api/contacts${query}`);
};

export const requestContactApi = async ({ inmateIdentifier, relationship, ktpUrl }) => {
  return await apiFetch('/api/contacts/request', {
    method: 'POST',
    body: JSON.stringify({
      inmateIdentifier: inmateIdentifier?.trim(),
      relationship: relationship?.trim(),
      ktpUrl: ktpUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop&q=80'
    })
  });
};

export const updateContactStatusApi = async (contactId, status) => {
  return await apiFetch(`/api/contacts/${contactId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: status.toUpperCase()
    })
  });
};

/**
 * API Call Endpoints
 */
export const initiateCallApi = async ({ phone, voucherCode, type = 'AUDIO', familyId, ...rest }) => {
  return await apiFetch('/api/call/initiate', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      voucherCode,
      type: (type || 'AUDIO').toUpperCase(),
      ...(familyId ? { familyId } : {}),
      ...rest,
    })
  });
};

export const acceptCallApi = async (callId) => {
  return await apiFetch('/api/call/accept', {
    method: 'POST',
    body: JSON.stringify({ callId })
  });
};

export const rejectCallApi = async (callId, reason) => {
  return await apiFetch('/api/call/reject', {
    method: 'POST',
    body: JSON.stringify({ callId, ...(reason ? { reason } : {}) })
  });
};

export const endCallApi = async (callId) => {
  return await apiFetch('/api/call/end', {
    method: 'POST',
    body: JSON.stringify({ callId })
  });
};

/**
 * API Recording & Transcript Endpoints
 */
export const getRecordingsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.status && ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(params.status.toUpperCase())) {
    query.append('status', params.status.toUpperCase());
  }
  if (params.startDate) {
    try {
      query.append('startDate', new Date(params.startDate).toISOString());
    } catch (e) {
      // ignore invalid date
    }
  }
  if (params.endDate) {
    try {
      const endD = new Date(params.endDate);
      if (!params.endDate.includes('T')) {
        endD.setHours(23, 59, 59, 999);
      }
      query.append('endDate', endD.toISOString());
    } catch (e) {
      // ignore invalid date
    }
  }
  if (params.branchId && params.branchId !== 'All') {
    query.append('branchId', params.branchId);
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/api/recordings?${queryString}` : '/api/recordings';
  return await apiFetch(endpoint);
};

export const getRecordingByIdApi = async (id) => {
  return await apiFetch(`/api/recordings/${id}`);
};

export const getRecordingStreamUrlApi = async (id) => {
  return await apiFetch(`/api/recordings/${id}/stream-url`);
};

export default {
  API_BASE_URL,
  getAuthToken,
  getAuthUser,
  setAuthSession,
  clearAuthSession,
  logout,
  apiFetch,
  login,
  register,
  getHealth,
  getInmatesApi,
  createInmateApi,
  getContactsApi,
  requestContactApi,
  updateContactStatusApi,
  initiateCallApi,
  acceptCallApi,
  rejectCallApi,
  endCallApi,
  getRecordingsApi,
  getRecordingByIdApi,
  getRecordingStreamUrlApi
};

