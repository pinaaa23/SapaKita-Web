import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward, Clock, Download } from 'lucide-react';

/**
 * CctvTimeline:
 * Komponen Timeline 24 Jam untuk pemutaran rekaman CCTV.
 * Memungkinkan pengguna menggeser waktu, maju-mundur detik demi detik,
 * serta memilih rentang waktu unduhan video.
 */
export default function CctvTimeline({
  selectedDate,
  currentTimeSec = 36000, // Detik dalam hari (0..86399)
  onTimeChange,
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
  onStepFrame, // Mundur/maju 1 detik
  onJump, // Mundur/maju 10 detik
  recordingSegments = [], // Rentang rekaman yang tersedia { startSec, endSec }
  onOpenClipExporter,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('24h'); // '24h' | '4h' | '1h'

  // Format detik ke HH:mm:ss
  const formatSecondsToHms = (totalSec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(totalSec)));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Rentang waktu yang tampil berdasarkan zoom
  let viewDuration = 86400; // 24 jam penuh
  let viewStartSec = 0;

  if (zoomLevel === '4h') {
    viewDuration = 14400; // 4 jam
    viewStartSec = Math.max(0, Math.min(86400 - viewDuration, currentTimeSec - 7200));
  } else if (zoomLevel === '1h') {
    viewDuration = 3600; // 1 jam
    viewStartSec = Math.max(0, Math.min(86400 - viewDuration, currentTimeSec - 1800));
  }

  // Posisi horizontal playhead (%)
  const playheadPercent = Math.max(
    0,
    Math.min(100, ((currentTimeSec - viewStartSec) / viewDuration) * 100)
  );

  // Penanganan klik / drag di timeline
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

  // Marker jam pada timeline
  const renderTimeMarkers = () => {
    const markers = [];
    const stepHours = zoomLevel === '24h' ? 2 : zoomLevel === '4h' ? 0.5 : 0.1666;
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

  // Render pita rekaman yang tersedia (Continuous / Available recordings)
  const renderRecordingSegments = () => {
    return recordingSegments.map((seg, idx) => {
      const segStart = Math.max(viewStartSec, seg.startSec);
      const segEnd = Math.min(viewStartSec + viewDuration, seg.endSec);
      if (segEnd <= segStart) return null;

      const left = ((segStart - viewStartSec) / viewDuration) * 100;
      const width = ((segEnd - segStart) / viewDuration) * 100;

      return (
        <div
          key={idx}
          className="absolute top-0 bottom-0 bg-emerald-500/80 border-x border-emerald-600/90 rounded-[1px]"
          style={{ left: `${left}%`, width: `${width}%` }}
          title={`Rekaman Tersedia: ${formatSecondsToHms(seg.startSec)} - ${formatSecondsToHms(seg.endSec)}`}
        />
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white select-none shadow-xl">
      {/* 1. Bar Atas: Digital Clock & Skala Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800 text-xs">
        {/* Playhead Digital Clock */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Waktu Replay Terpilih</div>
            <div className="text-sm font-mono font-bold text-white tracking-wider">
              {selectedDate} <span className="text-emerald-400">{formatSecondsToHms(currentTimeSec)}</span> <span className="text-[10px] text-slate-400 font-sans">WIB</span>
            </div>
          </div>
        </div>

        {/* Status Rekaman */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>Rekaman Tersedia di Storage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-800 border border-slate-700" />
            <span>Tidak Ada Rekaman</span>
          </div>
        </div>

        {/* Tombol Unduh & Zoom Level */}
        <div className="flex items-center gap-2">
          {onOpenClipExporter && (
            <button
              onClick={onOpenClipExporter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Klip Video</span>
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

      {/* 2. Interactive Scrubber Timeline */}
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

          {/* Pita Rekaman Tersedia */}
          {renderRecordingSegments()}

          {/* Jarum Playhead (Red Needle) */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 border-2 border-white -mt-1" />
            <div className="w-[2px] h-full bg-red-500 shadow-md shadow-red-500/80" />
          </div>
        </div>
      </div>

      {/* 3. Kontrol Maju-Mundur & Playback Deck */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {/* Mundur 1 Detik / Frame */}
          <button
            onClick={() => onStepFrame && onStepFrame(-1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            title="Mundur 1 Detik"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>-1s</span>
          </button>

          {/* Mundur 10 Detik */}
          <button
            onClick={() => onJump && onJump(-10)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            title="Mundur 10 Detik"
          >
            <Rewind className="w-3.5 h-3.5" />
            <span>-10s</span>
          </button>

          {/* Play / Pause Utama */}
          <button
            onClick={onTogglePlay}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
          </button>

          {/* Maju 10 Detik */}
          <button
            onClick={() => onJump && onJump(10)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            title="Maju 10 Detik"
          >
            <span>+10s</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>

          {/* Maju 1 Detik / Frame */}
          <button
            onClick={() => onStepFrame && onStepFrame(1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            title="Maju 1 Detik"
          >
            <span>+1s</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pilihan Kecepatan */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] font-semibold text-slate-500 px-1">Kecepatan:</span>
          {[0.5, 1, 2, 4].map((spd) => (
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
