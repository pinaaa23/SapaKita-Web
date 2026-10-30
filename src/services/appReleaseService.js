import { apiFetch, API_BASE_URL } from './api';

export const appReleaseService = {
  /**
   * Mengambil semua daftar rilis APK
   */
  async getReleases() {
    const res = await apiFetch('/api/app-releases');
    return res?.data || [];
  },

  /**
   * Mengambil versi APK yang sedang aktif
   */
  async getActiveRelease() {
    const res = await apiFetch('/api/app-releases/active');
    return res?.data || null;
  },

  /**
   * Upload berkas APK baru (FormData: apk, versionName, versionCode, releaseNotes, isActive)
   */
  async uploadRelease(formData) {
    const res = await apiFetch('/api/app-releases/upload', {
      method: 'POST',
      body: formData,
      timeout: 120000, // Timeout 2 menit untuk file besar
    });
    return res?.data;
  },

  /**
   * Mengaktifkan rilis tertentu sebagai versi utama
   */
  async activateRelease(id) {
    const res = await apiFetch(`/api/app-releases/${id}/activate`, {
      method: 'PATCH',
    });
    return res?.data;
  },

  /**
   * Menghapus rilis APK
   */
  async deleteRelease(id) {
    const res = await apiFetch(`/api/app-releases/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  /**
   * Buat Token Barcode Unduhan Baru
   * @param {string} releaseId 
   * @param {{ label?: string, durationDays?: number }} payload 
   */
  async createToken(releaseId, payload) {
    const res = await apiFetch(`/api/app-releases/${releaseId}/tokens`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  /**
   * Mengambil riwayat token barcode
   */
  async getTokens(releaseId = null) {
    const query = releaseId ? `?releaseId=${releaseId}` : '';
    const res = await apiFetch(`/api/app-releases/tokens/all${query}`);
    return res?.data || [];
  },

  /**
   * Mengambil data QR Code untuk token tertentu
   */
  async getTokenQr(tokenId) {
    const res = await apiFetch(`/api/app-releases/tokens/${tokenId}/qr`);
    return res?.data;
  },

  /**
   * Perpanjang masa aktif barcode (+7 hari atau pilihan custom)
   */
  async extendToken(tokenId, days = 7) {
    const res = await apiFetch(`/api/app-releases/tokens/${tokenId}/extend`, {
      method: 'PATCH',
      body: JSON.stringify({ days }),
    });
    return res?.data;
  },

  /**
   * Nonaktifkan / Cabut masa aktif barcode
   */
  async revokeToken(tokenId) {
    const res = await apiFetch(`/api/app-releases/tokens/${tokenId}/revoke`, {
      method: 'PATCH',
    });
    return res?.data;
  },

  /**
   * Hapus barcode dari riwayat
   */
  async deleteToken(tokenId) {
    const res = await apiFetch(`/api/app-releases/tokens/${tokenId}`, {
      method: 'DELETE',
    });
    return res;
  },

  /**
   * Endpoint Publik: Ambil info token untuk Mobile Download Landing Page
   */
  async getPublicTokenInfo(token) {
    const res = await apiFetch(`/api/app-releases/public/token/${token}`);
    return res?.data;
  },

  /**
   * Dapatkan URL unduh file binary APK langsung
   */
  getDirectDownloadUrl(token) {
    return `${API_BASE_URL}/api/app-releases/public/download/${token}`;
  },
};

