import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Smartphone,
  Download,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { appReleaseService } from '../../services/appReleaseService';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '35.4 MB';
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

export default function MobileDownloadPage() {
  const { token } = useParams();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await appReleaseService.getPublicTokenInfo(token);
        if (isMounted) {
          setTokenInfo(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memverifikasi barcode unduhan');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (token) {
      checkToken();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const directDownloadUrl = appReleaseService.getDirectDownloadUrl(token);

  const handleDownloadClick = () => {
    setDownloadStarted(true);
    // Buka link unduh langsung
    window.location.href = directDownloadUrl;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 relative selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-blue-600/15 blur-3xl pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto relative z-10 my-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Memverifikasi Tautan Unduhan...</h2>
            <p className="text-xs text-slate-400">Mohon tunggu sebentar, sistem sedang memeriksa keaslian dan masa berlaku barcode.</p>
          </div>
        )}

        {/* Error / Expired / Revoked State */}
        {!isLoading && (!tokenInfo || !tokenInfo.valid || error) && (
          <div className="bg-slate-800/95 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-md shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold uppercase tracking-wider border border-red-500/20">
                Akses Tidak Tersedia
              </div>
              <h2 className="text-xl font-bold text-white">
                {tokenInfo?.status === 'EXPIRED' ? 'Barcode Telah Kedaluwarsa' : 'Tautan Tidak Valid'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {tokenInfo?.message || error || 'Tautan atau barcode unduhan ini telah melewati batas waktu yang ditentukan.'}
              </p>
            </div>

            {tokenInfo?.expiresAt && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs text-slate-400 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Batas waktu berakhir: {formatDate(tokenInfo.expiresAt)}</span>
              </div>
            )}

            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Mengapa ada batas waktu?</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Untuk menjaga keamanan Lapas/Rutan serta menjamin warga binaan selalu memakai versi aplikasi resmi terbaru, barcode unduhan dibatasi berlaku selama 7 hari.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-all shadow"
              >
                <RefreshCw className="w-4 h-4" /> Segarkan Halaman
              </button>
            </div>
          </div>
        )}

        {/* Success / Valid State */}
        {!isLoading && tokenInfo && tokenInfo.valid && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Top Brand Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 p-6 text-center text-white relative">
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider mb-2 border border-white/30">
                Aplikasi Resmi Wartel Sadewa
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Sadewa Mobile</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto opacity-90 leading-relaxed">
                Platform Komunikasi Khusus Warga Binaan Pemasyarakatan (WBP) Unit Pelaksana Teknis (UPT)
              </p>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* App Summary Card */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-base flex items-center gap-2">
                      <span>Versi {tokenInfo.release?.versionName || '1.0'}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Android
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Ukuran: {formatBytes(tokenInfo.release?.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Resmi
                  </span>
                </div>
              </div>

              {/* Expiry Notice */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Masa Aktif Barcode:</span>
                </div>
                <span className="font-bold text-emerald-400">
                  Hingga {formatDate(tokenInfo.expiresAt)}
                </span>
              </div>

              {/* Release Notes (if any) */}
              {tokenInfo.release?.releaseNotes && (
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
                  "{tokenInfo.release.releaseNotes}"
                </div>
              )}

              {/* Main Download CTA */}
              <div className="space-y-2">
                <button
                  onClick={handleDownloadClick}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 transition-all transform active:scale-[0.98]"
                >
                  <Download className="w-5 h-5 animate-bounce-subtle" />
                  <span>Unduh Aplikasi Sadewa (APK)</span>
                </button>

                {downloadStarted && (
                  <p className="text-center text-xs text-emerald-400 font-medium animate-in fade-in">
                    ✓ Pengunduhan berkas sedang berjalan di browser Anda...
                  </p>
                )}
              </div>

              {/* Step by Step Installation Guide */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-blue-500 rounded-full" />
                  <span>Langkah Pemasangan di Android</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      1
                    </div>
                    <div className="text-slate-300 leading-relaxed">
                      <strong className="text-white">Unduh Berkas APK:</strong> Tekan tombol tombol biru di atas dan tunggu proses unduh selesai.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      2
                    </div>
                    <div className="text-slate-300 leading-relaxed">
                      <strong className="text-white">Izinkan Pemasangan:</strong> Jika muncul peringatan keamanan browser, pilih <em>"Tetap Download / Download Anyway"</em>. Buka file lalu aktifkan <em>"Izinkan dari sumber ini"</em>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      3
                    </div>
                    <div className="text-slate-300 leading-relaxed">
                      <strong className="text-white">Masuk Akun:</strong> Gunakan NIP dan Kata Sandi yang telah didaftarkan oleh petugas UPT.
                    </div>
                  </div>
                </div>
              </div>

              {/* Forgot Password Tip Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-amber-300 flex items-center gap-1.5 mb-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Lupa Kata Sandi?
                </strong>
                Gunakan menu <em>"Lupa Kata Sandi"</em> di aplikasi. Masukkan Nomor Induk Narapidana (NIP) dan Tanggal Lahir yang terdaftar untuk mereset kata sandi secara instan.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center mt-6 text-[11px] text-slate-500 relative z-10">
        © 2026 Sadewa Mobile. Hak Cipta Dilindungi Undang-Undang.
      </div>
    </div>
  );
}

