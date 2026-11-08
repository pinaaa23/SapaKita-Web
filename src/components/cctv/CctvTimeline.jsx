import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward, Clock, ZoomIn, ZoomOut, Film } from 'lucide-react';

/**
 * CctvTimeline:
 * Komponen Timeline 24 Jam interaktif ala VMS NVR CCTV profesional (Hikvision / Dahua / UniFi Protect).
 * Mendukung scrubbing drag, pita rekaman (continuous & motion event), zoom waktu (24h, 4h, 1h),
 * kontrol kecepatan (0.5x - 8x), dan step-frame per detik.
 */
export default function CctvTimeline({
  selectedDate,
  currentTimeSec = 36000, // detik sejak 00:00:00 (default 10:00:00 = 36000s)
  onTimeChange,
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
  onStepFrame, // -1 or +1
  onJump, // -10 or +10
  recordingSegments = [], // Array<{ startSec, endSec, type: 'continuous' | 'motion' }>
  onOpenClipExporter,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('24h'); // '24h' | '4h' | '1h'

  // Format detik menjadi HH:mm:ss
  const formatSecondsToHms = (totalSec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(totalSec)));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Rentang waktu yang ditampilkan berdasarkan zoom
  let viewDuration = 86400; // 24 jam dalam detik
  let viewStartSec = 0;

  if (zoomLevel === '4h') {
    viewDuration = 14400; // 4 jam
    viewStartSec = Math.max(0, Math.min(86400 - viewDuration, currentTimeSec - 7200));
  } else if (zoomLevel === '1h') {
    viewDuration = 3600; // 1 jam
    viewStartSec = Math.max(0, Math.min(86400 - viewDuration, currentTimeSec - 1800));
  }

  // Hitung posisi horizontal playhead (persentase 0-100%)
  const playheadPercent = Math.max(
    0,
    Math.min(100, ((currentTimeSec - viewStartSec) / viewDuration) * 100)
  );

  // Menangani klik atau drag pada timeline
  const handleTimelineInteraction = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = Math.round(viewStartSec + ratio * viewDuration);
    if (onTimeChange) {
      onTimeChange(targetSec);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineInteraction(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleTimelineInteraction(e);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, viewStartSec, viewDuration]);

  // Marker jam berdasarkan zoom
  const renderTimeMarkers = () => {
    const markers = [];
    const stepHours = zoomLevel === '24h' ? 2 : zoomLevel === '4h' ? 0.5 : 0.1666; // 2h, 30m, 10m
    const stepSec = stepHours * 3600;
    const firstMarkerSec = Math.ceil(viewStartSec / stepSec) * stepSec;

    for (let sec = firstMarkerSec; sec <= viewStartSec + viewDuration; sec += stepSec) {
      const posPercent = ((sec - viewStartSec) / viewDuration) * 100;
      if (posPercent >= 0 && posPercent <= 100) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        markers.push(
          <div
            key={sec}
            className="absolute top-0 bottom-0 flex flex-col justify-between items-center pointer-events-none -translate-x-1/2"
            style={{ left: `${posPercent}%` }}
          >
            <span className="text-[10px] font-mono text-slate-400 select-none">
              {label}
            </span>
            <div className="w-[1px] h-2 bg-slate-600/60" />
          </div>
        );
      }
    }
    return markers;
  };

  // Render segmen rekaman pada timeline
  const renderRecordingSegments = () => {
    return recordingSegments.map((seg, idx) => {
      // Potong ke rentang view yang terlihat
      const segStart = Math.max(viewStartSec, seg.startSec);
      const segEnd = Math.min(viewStartSec + viewDuration, seg.endSec);
      if (segEnd <= segStart) return null;

      const left = ((segStart - viewStartSec) / viewDuration) * 100;
      const width = ((segEnd - segStart) / viewDuration) * 100;
      const isMotion = seg.type === 'motion';

      return (
        <div
          key={idx}
          className={`absolute top-0 bottom-0 rounded-[1px] ${
            isMotion
              ? 'bg-amber-400 border-x border-amber-500 z-10'
              : 'bg-emerald-500/80 border-x border-emerald-600/90 z-0'
          }`}
          style={{ left: `${left}%`, width: `${width}%` }}
          title={`${isMotion ? 'Gerakan Terdeteksi' : 'Rekaman Kontinu'}: ${formatSecondsToHms(seg.startSec)} - ${formatSecondsToHms(seg.endSec)}`}
        />
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white select-none shadow-xl">
      {/* 1. Bar Atas: Digital Clock, Legenda Warna, Zoom Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800 text-xs">
        {/* Playhead Digital Clock */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Waktu Rekaman Terpilih</div>
            <div className="text-sm font-mono font-bold text-white tracking-wider">
              {selectedDate} <span className="text-emerald-400">{formatSecondsToHms(currentTimeSec)}</span> <span className="text-[10px] text-slate-400 font-sans">WIB</span>
            </div>
          </div>
        </div>

        {/* Legenda Warna Rekaman */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>Rekaman Rutin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-400" />
            <span>Event / Gerakan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-800 border border-slate-700" />
            <span>Kosong</span>
          </div>
        </div>

        {/* Zoom Level & Ekspor Klip */}
        <div className="flex items-center gap-2">
          {onOpenClipExporter && (
            <button
              onClick={onOpenClipExporter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Gunting Klip Bukti</span>
            </button>
          )}

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] font-semibold text-slate-500 px-1.5">Skala:</span>
            {['24h', '4h', '1h'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoomLevel(lvl)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  zoomLevel === lvl ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Scrubber Timeline Canvas */}
      <div className="relative pt-4 pb-2">
        {/* Scale labels container */}
        <div className="relative h-4 mb-1">
          {renderTimeMarkers()}
        </div>

        {/* Scrubber Track Bar */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          className="relative h-11 bg-slate-950/90 rounded-xl border border-slate-800 cursor-pointer overflow-hidden shadow-inner group"
        >
          {/* Background grid lines */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-slate-600" />
            ))}
          </div>

          {/* Pita Rekaman (Continuous & Motion Segments) */}
          {renderRecordingSegments()}

          {/* Jarum Playhead (Red Needle with Cursor Top Pin) */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Top Pin Tag */}
            <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 border-2 border-white -mt-1" />
            {/* Vertical Line */}
            <div className="w-[2px] h-full bg-red-500 shadow-md shadow-red-500/80" />
          </div>
        </div>
      </div>

      {/* 3. Bar Kontrol Pemutaran CCTV (Deck Controller) */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Deck Play / Seek Controls */}
        <div className="flex items-center gap-1.5">
          {/* Step Back (Per 1 Detik) */}
          <button
            onClick={() => onStepFrame && onStepFrame(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Mundur 1 Frame / 1 Detik"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Jump -10s */}
          <button
            onClick={() => onJump && onJump(-10)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Mundur 10 Detik"
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Play / Pause Utama */}
          <button
            onClick={onTogglePlay}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
          </button>

          {/* Jump +10s */}
          <button
            onClick={() => onJump && onJump(10)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Maju 10 Detik"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Step Forward (Per 1 Detik) */}
          <button
            onClick={() => onStepFrame && onStepFrame(1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Maju 1 Frame / 1 Detik"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector (0.5x, 1x, 2x, 4x, 8x ala NVR) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] font-semibold text-slate-500 px-1">Kecepatan:</span>
          {[0.5, 1, 2, 4, 8].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed && onChangeSpeed(spd)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                playbackSpeed === spd
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
