// Base API Service for PasCall Web Application
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

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
};

export const logout = () => {
  clearAuthSession();
};

/**
 * Reusable HTTP fetcher with automated Authorization Bearer header injection
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(
        (data && typeof data === 'object' && (data.message || data.error)) || 
        `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network error / connection refused
    const networkError = new Error('Server tidak dapat dihubungi, coba lagi nanti');
    networkError.status = 0;
    networkError.isNetworkError = true;
    networkError.originalError = err;
    throw networkError;
  }
};

/**
 * API Auth Endpoints
 */
export const CHANGE_PASSWORD_ENDPOINT = '/api/auth/change-password';
export const UPDATE_PROFILE_ENDPOINT = '/api/auth/me';

export const login = async (identifier, password) => {
  return await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: identifier.trim(),
      password
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

export const changePasswordApi = async ({ currentPassword, newPassword, confirmPassword }) => {
  return await apiFetch(CHANGE_PASSWORD_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword
    })
  });
};

export const updateProfileApi = async (profileData) => {
  return await apiFetch(UPDATE_PROFILE_ENDPOINT, {
    method: 'PATCH',
    body: JSON.stringify(profileData)
  });
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

export const createInmateApi = async ({ identifier, name, initialPin, branchId }) => {
  return await apiFetch('/api/inmates', {
    method: 'POST',
    body: JSON.stringify({
      identifier: identifier?.trim(),
      name: name?.trim(),
      initialPin: initialPin || '1234',
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
export const initiateCallApi = async ({ familyId, type = 'AUDIO' }) => {
  return await apiFetch('/api/call/initiate', {
    method: 'POST',
    body: JSON.stringify({
      familyId,
      type: type.toUpperCase()
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
  endCallApi
};

