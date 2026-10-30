import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Smartphone,
  Upload,
  QrCode,
  Download,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Plus,
  ExternalLink,
  Layers,
  X,
  History,
  TimerReset,
  Ban,
  HelpCircle
} from 'lucide-react';
import { appReleaseService } from '../../services/appReleaseService';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const getEffectiveDownloadUrl = (url, token) => {
  if (!url) return `${window.location.origin}/download/${token}`;
  if (typeof window !== 'undefined' && window.location.port === '5173' && url.includes(':5000')) {
    return url.replace(':5000', ':5173');
  }
  return url;
};

export default function AppReleasesPage() {
  const [releases, setReleases] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('releases'); // 'releases' | 'tokens'
  const [toast, setToast] = useState(null);

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Custom UI Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'danger', // 'danger' | 'warning'
    title: '',
    message: '',
    detail: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null,
    isProcessing: false,
  });

  // Selected Data for Modals
  const [activeQrData, setActiveQrData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form Upload APK State
  const [uploadForm, setUploadForm] = useState({
    file: null,
    versionName: '',
    versionCode: '',
    releaseNotes: '',
    isActive: true,
  });
  const [isUploading, setIsUploading] = useState(false);

  // Form Generate Token State
  const [tokenForm, setTokenForm] = useState({
    releaseId: '',
    label: '',
    durationDays: 7,
  });
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Muat data rilis dan token
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [releaseList, tokenList] = await Promise.all([
        appReleaseService.getReleases(),
        appReleaseService.getTokens(),
      ]);
      setReleases(releaseList);
      setTokens(tokenList);

      // Default selected release for barcode generator
      const active = releaseList.find((r) => r.isActive) || releaseList[0];
      if (active) {
        setTokenForm((prev) => ({ ...prev, releaseId: active.id }));
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat data rilis aplikasi', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeRelease = useMemo(() => {
    return releases.find((r) => r.isActive) || null;
  }, [releases]);

  // Handle Upload APK
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.apk')) {
        showToast('Hanya berkas berformat .apk yang diizinkan', 'error');
        return;
      }
      setUploadForm((prev) => ({
        ...prev,
        file,
        // Auto-suggest version if filename contains version
        versionName: prev.versionName || (file.name.match(/v?(\d+\.\d+(\.\d+)?)/i)?.[1] || ''),
      }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      showToast('Silakan pilih berkas APK terlebih dahulu', 'error');
      return;
    }
    if (!uploadForm.versionName || !uploadForm.versionCode) {
      showToast('Nomor versi dan kode versi wajib diisi', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('apk', uploadForm.file);
      formData.append('versionName', uploadForm.versionName);
      formData.append('versionCode', uploadForm.versionCode);
      formData.append('releaseNotes', uploadForm.releaseNotes);
      formData.append('isActive', uploadForm.isActive);

      await appReleaseService.uploadRelease(formData);
      showToast('Berkas APK berhasil diunggah dan rilis telah didaftarkan!', 'success');
      setShowUploadModal(false);
      setUploadForm({
        file: null,
        versionName: '',
        versionCode: '',
        releaseNotes: '',
        isActive: true,
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah berkas APK', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Set Active
  const handleSetActive = async (id) => {
    try {
      await appReleaseService.activateRelease(id);
      showToast('Versi aplikasi aktif berhasil diperbarui', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah versi aktif', 'error');
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false, onConfirm: null, isProcessing: false }));
  };

  // Handle Delete Release
  const handleDeleteRelease = (id, versionName) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Rilis Aplikasi?',
      message: `Apakah Anda yakin ingin menghapus rilis Sadewa Mobile v${versionName}?`,
      detail: 'Berkas fisik APK di server dan seluruh barcode unduhan yang terhubung dengan versi ini akan dihapus permanen.',
      confirmText: 'Ya, Hapus Rilis',
      onConfirm: async () => {
        try {
          await appReleaseService.deleteRelease(id);
          showToast(`Rilis v${versionName} berhasil dihapus`, 'success');
          loadData();
        } catch (err) {
          showToast(err.message || 'Gagal menghapus rilis', 'error');
        }
      },
    });
  };

  // Handle Generate Token
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!tokenForm.releaseId) {
      showToast('Pilih versi aplikasi terlebih dahulu', 'error');
      return;
    }

    setIsGeneratingToken(true);
    try {
      const result = await appReleaseService.createToken(tokenForm.releaseId, {
        label: tokenForm.label,
        durationDays: tokenForm.durationDays,
      });

      showToast('Barcode unduhan berhasil dibuat!', 'success');
      setShowTokenModal(false);
      setTokenForm((prev) => ({
        ...prev,
        label: '',
        durationDays: 7,
      }));

      // Buka modal tampilan QR code langsung & alihkan tab ke Riwayat Barcode
      setActiveQrData(result);
      setShowQrModal(true);
      setActiveTab('tokens');
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal membuat barcode unduhan', 'error');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Handle Lihat QR
  const handleViewQr = async (tokenId) => {
    try {
      const qrData = await appReleaseService.getTokenQr(tokenId);
      setActiveQrData(qrData);
      setShowQrModal(true);
    } catch (err) {
      showToast(err.message || 'Gagal mengambil gambar QR Code', 'error');
    }
  };

  // Handle Perpanjang Masa Aktif (+7 Hari)
  const handleExtendToken = async (tokenId, currentLabel) => {
    try {
      await appReleaseService.extendToken(tokenId, 7);
      showToast(`Masa aktif barcode "${currentLabel || 'Unduhan'}" berhasil diperpanjang +7 Hari!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Gagal memperpanjang masa aktif barcode', 'error');
    }
  };

  // Handle Revoke Token
  const handleRevokeToken = (tokenId, currentLabel) => {
    setConfirmDialog({
      isOpen: true,
      type: 'warning',
      title: 'Nonaktifkan Barcode Unduhan?',
      message: `Apakah Anda yakin ingin mencabut akses barcode "${currentLabel || 'Unduhan'}"?`,
      detail: 'Barcode akan langsung dinonaktifkan dan pengguna yang memindai QR code ini tidak akan dapat mengunduh aplikasi lagi.',
      confirmText: 'Ya, Nonaktifkan',
      onConfirm: async () => {
        try {
          await appReleaseService.revokeToken(tokenId);
          showToast('Barcode unduhan berhasil dinonaktifkan', 'success');
          loadData();
        } catch (err) {
          showToast(err.message || 'Gagal menonaktifkan barcode', 'error');
        }
      },
    });
  };

  // Handle Delete Token
  const handleDeleteToken = (tokenId, currentLabel) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Barcode Unduhan?',
      message: `Apakah Anda yakin ingin menghapus barcode "${currentLabel || 'Unduhan'}" dari riwayat?`,
      detail: 'Data barcode ini akan dihapus secara permanen dari daftar riwayat sistem.',
      confirmText: 'Ya, Hapus Barcode',
      onConfirm: async () => {
        try {
          await appReleaseService.deleteToken(tokenId);
          showToast('Barcode berhasil dihapus dari riwayat', 'success');
          loadData();
        } catch (err) {
          showToast(err.message || 'Gagal menghapus barcode', 'error');
        }
      },
    });
  };

  // Handle Copy Link
  const handleCopyLink = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast('Tautan unduhan disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white font-medium text-sm transition-all transform animate-bounce-subtle ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" /> Distribusi Aplikasi Resmi
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Manajemen Rilis & Barcode APK Mobile Sadewa
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Unggah file APK Sadewa Mobile, kelola versi yang aktif, dan buat barcode unduhan eksklusif berbatas waktu (7 hari) yang siap dibagikan kepada petugas maupun warga binaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" /> Unggah APK Baru
            </button>
            <button
              onClick={() => {
                if (releases.length === 0) {
                  showToast('Silakan unggah rilis APK terlebih dahulu', 'error');
                  return;
                }
                setShowTokenModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4" /> Buat Barcode Unduhan
            </button>
          </div>
        </div>
      </div>

      {/* Active Release Card Summary */}
      {activeRelease ? (
        <div className="bg-gradient-to-br from-white to-slate-50 border border-blue-200/80 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center shrink-0">
              <Smartphone className="w-7 h-7 text-blue-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ● Versi Aktif Utama
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Dirilis pada {formatDate(activeRelease.createdAt)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Sadewa Mobile v{activeRelease.versionName} <span className="text-sm font-normal text-slate-500">(Build {activeRelease.versionCode})</span>
              </h2>
              <p className="text-sm text-slate-600 font-mono">
                {activeRelease.fileName} • {formatBytes(activeRelease.fileSize)}
              </p>
              {activeRelease.releaseNotes && (
                <p className="text-xs text-slate-600 pt-1 italic">
                  "{activeRelease.releaseNotes}"
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-t lg:border-t-0 pt-4 lg:pt-0">
            <button
              onClick={() => setActiveTab('tokens')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-all"
            >
              <History className="w-4 h-4 text-blue-600" /> Lihat Riwayat Barcode ({tokens.length})
            </button>
            <button
              onClick={() => {
                setTokenForm((prev) => ({ ...prev, releaseId: activeRelease.id }));
                setShowTokenModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-all"
            >
              <QrCode className="w-4 h-4 text-emerald-400" /> Buat Barcode Baru
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Belum Ada Versi Aplikasi yang Aktif</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Silakan unggah berkas APK pertama Anda atau aktifkan salah satu rilis dari daftar di bawah.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('releases')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'releases'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Riwayat Rilis APK
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'releases' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {releases.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'tokens'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" /> Riwayat Barcode & Unduhan
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'tokens' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {tokens.length}
            </span>
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
          title="Segarkan data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB CONTENT 1: Riwayat Rilis APK */}
      {activeTab === 'releases' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Daftar Versi Rilis APK</h3>
            <span className="text-xs text-slate-500">Total {releases.length} rilis terdaftar</span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm">Memuat data rilis...</p>
            </div>
          ) : releases.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Belum ada file APK yang diunggah</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol "Unggah APK Baru" untuk menambahkan versi perdana.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">Versi & Berkas</th>
                    <th className="py-3.5 px-6">Ukuran</th>
                    <th className="py-3.5 px-6">Tanggal Unggah</th>
                    <th className="py-3.5 px-6">Catatan Rilis</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {releases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>v{item.versionName}</span>
                          <span className="text-xs text-slate-400 font-mono">({item.versionCode})</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate max-w-xs">
                          {item.fileName}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {formatBytes(item.fileSize)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs">
                        {item.releaseNotes ? (
                          <span className="line-clamp-2" title={item.releaseNotes}>
                            {item.releaseNotes}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Arsip
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!item.isActive && (
                            <button
                              onClick={() => handleSetActive(item.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-all"
                              title="Jadikan versi aktif utama"
                            >
                              Jadikan Aktif
                            </button>
                          )}
                          <button
                            onClick={() => setActiveTab('tokens')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-all"
                            title="Buka daftar riwayat barcode"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-500" />
                            <span>Riwayat Barcode</span>
                          </button>
                          <button
                            onClick={() => {
                              setTokenForm((prev) => ({ ...prev, releaseId: item.id }));
                              setShowTokenModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-all"
                            title="Buat Barcode baru untuk versi ini"
                          >
                            <Plus className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteRelease(item.id, item.versionName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all"
                            title="Hapus rilis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: Riwayat Barcode & Unduhan */}
      {activeTab === 'tokens' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Riwayat Barcode & Tautan Unduh</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola status masa aktif (7 hari), pantau jumlah unduh, atau perpanjang masa aktif tanpa cetak ulang QR.
              </p>
            </div>
            <button
              onClick={() => setShowTokenModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Barcode Baru
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm">Memuat data barcode...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Belum ada barcode unduhan yang digenerate</p>
              <p className="text-xs text-slate-400 mt-1">Tekan tombol "Barcode Baru" untuk membuat tautan unduhan berbatas waktu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">Label Barcode</th>
                    <th className="py-3.5 px-6">Versi Rilis</th>
                    <th className="py-3.5 px-6">Kedaluwarsa</th>
                    <th className="py-3.5 px-6">Status Masa Aktif</th>
                    <th className="py-3.5 px-6 text-center">Jumlah Unduh</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{token.label || 'Barcode Unduhan APK'}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                          {token.token}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800 text-xs">
                          v{token.release?.versionName || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {formatDate(token.expiresAt)}
                      </td>
                      <td className="py-4 px-6">
                        {token.isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            <Ban className="w-3 h-3 text-gray-500" /> Dinonaktifkan
                          </span>
                        ) : token.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <Clock className="w-3 h-3 text-red-500" /> Kedaluwarsa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif (Berlaku)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Download className="w-3 h-3" /> {token.downloadCount || 0}x
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Lihat QR */}
                          <button
                            onClick={() => handleViewQr(token.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 transition-all shadow-sm"
                            title="Tampilkan & Buka Gambar QR Code"
                          >
                            <QrCode className="w-4 h-4" /> Lihat Barcode
                          </button>

                          {/* Tombol Perpanjang Masa Aktif */}
                          <button
                            onClick={() => handleExtendToken(token.id, token.label)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                            title="Perpanjang masa aktif +7 Hari (QR Code tetap sama persis)"
                          >
                            <TimerReset className="w-3.5 h-3.5 text-emerald-600" /> +7 Hari
                          </button>

                          {/* Tombol Salin Link */}
                          <button
                            onClick={() => handleCopyLink(getEffectiveDownloadUrl(token.downloadUrl, token.token))}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all"
                            title="Salin Tautan"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Revoke */}
                          {!token.isRevoked && !token.isExpired && (
                            <button
                              onClick={() => handleRevokeToken(token.id, token.label)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-all"
                              title="Nonaktifkan barcode ini sekarang"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => handleDeleteToken(token.id, token.label)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all"
                            title="Hapus barcode"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: UPLOAD APK BARU
          ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Unggah Berkas APK Baru</h3>
                <p className="text-xs text-slate-500">Rilis versi aplikasi mobile Sadewa untuk Android</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Berkas APK Android (.apk) *
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="apk-upload"
                    accept=".apk,application/vnd.android.package-archive"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="apk-upload" className="cursor-pointer block">
                    <Smartphone className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    {uploadForm.file ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800 break-all">{uploadForm.file.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{formatBytes(uploadForm.file.size)}</p>
                        <span className="inline-block mt-1 text-xs text-blue-600 font-medium underline">
                          Klik untuk mengganti berkas
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-700">Pilih berkas .apk dari perangkat Anda</p>
                        <p className="text-xs text-slate-400">Maksimal ukuran berkas 200MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Version Inputs Note */}
              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-blue-950 mb-0.5">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Panduan Versi & Kode Build:</span>
                </div>
                <p className="text-slate-600 text-[11.5px] mt-0.5">
                  • <strong>Nomor Versi:</strong> Nama versi yang terbaca oleh manusia (misal: <code>1.0.0</code>).
                  <br />
                  • <strong>Kode Versi (Build):</strong> Angka bulat positif (integer) yang dipakai Android untuk mendeteksi pembaruan aplikasi. Untuk tes/rilis pertama isi <code>1</code>. Setiap kali ada update berikutnya, selalu naikkan angkanya (<code>2</code>, <code>3</code>, dst.).
                </p>
              </div>

              {/* Version Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Nomor Versi *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1.0.0"
                    value={uploadForm.versionName}
                    onChange={(e) => setUploadForm({ ...uploadForm, versionName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Contoh: 1.0.0 atau 1.0.4</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Kode Versi (Build) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 1"
                    value={uploadForm.versionCode}
                    onChange={(e) => setUploadForm({ ...uploadForm, versionCode: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Angka bulat urut: 1, 2, 3...</p>
                </div>
              </div>

              {/* Release Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Catatan Rilis (Release Notes)
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi fitur baru atau perbaikan pada pembaruan ini..."
                  value={uploadForm.releaseNotes}
                  onChange={(e) => setUploadForm({ ...uploadForm, releaseNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Checkbox Set Active */}
              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadForm.isActive}
                  onChange={(e) => setUploadForm({ ...uploadForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Jadikan rilis ini sebagai versi aktif utama langsung</span>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Unggah & Rilis
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: GENERATE BARCODE UNDUHAN
          ========================================================================= */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowTokenModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Buat Barcode Unduhan</h3>
                <p className="text-xs text-slate-500">Generate tautan dan QR code berbatas waktu</p>
              </div>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-4">
              {/* Release Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Versi Aplikasi *
                </label>
                <select
                  value={tokenForm.releaseId}
                  onChange={(e) => setTokenForm({ ...tokenForm, releaseId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {releases.map((r) => (
                    <option key={r.id} value={r.id}>
                      Sadewa Mobile v{r.versionName} {r.isActive ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Label / Keterangan Barcode
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Poster Kunjungan UPT Cipinang"
                  value={tokenForm.label}
                  onChange={(e) => setTokenForm({ ...tokenForm, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration Setting */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Masa Berlaku Barcode *
                </label>
                <select
                  value={tokenForm.durationDays}
                  onChange={(e) => setTokenForm({ ...tokenForm, durationDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>7 Hari / 1 Minggu (Rekomendasi Default)</option>
                  <option value={1}>1 Hari (24 Jam)</option>
                  <option value={3}>3 Hari</option>
                  <option value={14}>14 Hari (2 Minggu)</option>
                  <option value={30}>30 Hari (1 Bulan)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  💡 <em>Setelah masa aktif habis, Anda tetap bisa memperpanjang (+7 hari) kapan saja tanpa perlu mencetak ulang QR code.</em>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  disabled={isGeneratingToken}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingToken}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isGeneratingToken ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Men-generate...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Generate Barcode
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: TAMPILAN QR CODE & DISTRIBUSI
          ========================================================================= */}
      {showQrModal && activeQrData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              Sadewa Mobile APK
            </div>
            <h3 className="font-bold text-slate-900 text-lg">
              {activeQrData.label || 'Barcode Unduhan Aplikasi'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Versi v{activeQrData.release?.versionName || 'Terbaru'}
            </p>

            {/* QR Code Container */}
            <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
              <img
                src={activeQrData.qrCodeDataUrl}
                alt="QR Code Download Sadewa"
                className="w-56 h-56 rounded-xl block mx-auto shadow-sm bg-white p-2"
              />
            </div>

            {/* Expiry Badge */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Berlaku hingga: {formatDate(activeQrData.expiresAt)}</span>
              </div>
            </div>

            {/* Copy Link Input */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl mb-4">
              <input
                type="text"
                readOnly
                value={getEffectiveDownloadUrl(activeQrData.downloadUrl, activeQrData.token)}
                className="bg-transparent text-xs text-slate-700 px-2 flex-1 focus:outline-none font-mono truncate"
              />
              <button
                onClick={() => handleCopyLink(getEffectiveDownloadUrl(activeQrData.downloadUrl, activeQrData.token))}
                className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-sm border border-slate-200 flex items-center gap-1 transition-all"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Tersalin' : 'Salin'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <a
                href={activeQrData.qrCodeDataUrl}
                download={`Sadewa-QR-${activeQrData.label || 'Unduhan'}.png`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-[1.01]"
              >
                <Download className="w-4 h-4" /> Download Gambar QR (PNG)
              </a>

              <a
                href={getEffectiveDownloadUrl(activeQrData.downloadUrl, activeQrData.token)}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Halaman Unduhan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: KONFIRMASI AKSI KRITIS (Custom Dialog pengganti window.confirm)
          ========================================================================= */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative text-left animate-in zoom-in-95 duration-150">
            <button
              onClick={closeConfirmDialog}
              disabled={confirmDialog.isProcessing}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}
              >
                {confirmDialog.type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <Ban className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="font-bold text-slate-900 text-lg">{confirmDialog.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            {confirmDialog.detail && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 mb-5 leading-relaxed">
                <span className="font-semibold text-slate-700">Perhatian: </span>
                {confirmDialog.detail}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeConfirmDialog}
                disabled={confirmDialog.isProcessing}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                {confirmDialog.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                disabled={confirmDialog.isProcessing}
                onClick={async () => {
                  if (confirmDialog.onConfirm) {
                    setConfirmDialog((prev) => ({ ...prev, isProcessing: true }));
                    await confirmDialog.onConfirm();
                  }
                  closeConfirmDialog();
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                }`}
              >
                {confirmDialog.isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  confirmDialog.confirmText || 'Konfirmasi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

