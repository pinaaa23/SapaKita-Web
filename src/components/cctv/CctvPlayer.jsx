import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RefreshCw, VideoOff } from 'lucide-react';

/**
 * CctvPlayer:
 * Pemutar video CCTV serbaguna yang mendukung HLS (.m3u8), MP4, WebM, serta web embed iframe.
 */
export default function CctvPlayer({
  src,
  muted = true,
  autoPlay = true,
  loop = true,
  playsInline = true,
  className = '',
  onVideoRef,
  onError,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const isIframe = src && (src.includes('/embed') || src.includes('youtube.com') || src.includes('youtu.be'));
  const isHls = src && (src.includes('.m3u8') || src.includes('m3u8'));

  // Sync muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    setHasError(false);
    setErrorMessage('');

    if (!src || src.trim() === '') return;
    if (isIframe) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (onVideoRef) {
      onVideoRef(videoEl);
    }

    // Bersihkan instance HLS sebelumnya jika ada
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            videoEl.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.warn('[CctvPlayer] HLS fatal error:', data.type);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setHasError(true);
                setErrorMessage('Stream CCTV tidak merespons (Network Error)');
                if (onError) onError(data);
                break;
            }
          }
        });
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        videoEl.src = src;
        if (autoPlay) videoEl.play().catch(() => {});
      } else {
        setHasError(true);
        setErrorMessage('Browser tidak mendukung pemutaran HLS live stream');
      }
    } else {
      // Standard MP4 / WebM / Direct video URL
      videoEl.src = src;
      if (autoPlay) {
        videoEl.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, reloadKey, isIframe, isHls]);

  const handleRetry = () => {
    setHasError(false);
    setReloadKey((prev) => prev + 1);
  };

  if (!src || src.trim() === '') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-500 text-xs">
        <VideoOff className="w-6 h-6 mb-2 text-slate-600" />
        <span>URL Stream belum diisi</span>
      </div>
    );
  }

  if (isIframe) {
    return (
      <iframe
        src={src}
        title="CCTV Web Stream"
        className={`w-full h-full border-0 ${className}`}
        allow="autoplay; fullscreen; picture-in-picture"
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        playsInline={playsInline}
        crossOrigin="anonymous"
        onError={() => {
          setHasError(true);
          setErrorMessage('Gagal memuat feed video. Format URL tidak didukung atau stream sedang offline.');
        }}
        className={`w-full h-full object-cover ${className} ${hasError ? 'opacity-20' : 'opacity-100'}`}
      />

      {/* Error / Offline Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center z-10">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-red-300 mb-1">
            Kamera Offline / Gagal Terhubung
          </span>
          <p className="text-[11px] text-slate-400 max-w-xs mb-3">
            {errorMessage || 'Periksa kembali URL stream RTSP/HLS atau status jaringan kamera CCTV.'}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Hubungkan Ulang
          </button>
        </div>
      )}
    </div>
  );
}
