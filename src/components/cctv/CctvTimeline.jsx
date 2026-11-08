import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward, Clock, Download } from 'lucide-react';

export default function CctvTimeline({
  selectedDate,
  currentTimeSec = 36000,
  onTimeChange,
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
  onStepFrame,
  onJump,
  recordingSegments = [],
  onOpenClipExporter,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('24h');

  const formatSecondsToHms = (totalSec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(totalSec)));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  let viewDuration = 86400;
  let viewStartSec = 0;

  if (zoomLevel === '4h') {
    viewDuration = 14400;
    viewStartSec = Math.max(0, Math.min(86400 - viewDuration, currentTimeSec - 7200));
  } else if (zoomLevel === '1h') {
    viewDuration = 3600;
    viewStartSec = Math.max(0, Math.min(86400 - viewDuration, currentTimeSec - 1800));
  }

  const playheadPercent = Math.max(
    0,
    Math.min(100, ((currentTimeSec - viewStartSec) / viewDuration) * 100)
  );

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
            <div className="w-[1px] h-1.5 bg-slate-300" />
          </div>
        );
      }
    }
    return markers;
  };

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
          className="absolute top-0 bottom-0 bg-blue-500/90 border-x border-blue-600 rounded-[1px]"
          style={{ left: `${left}%`, width: `${width}%` }}
          title={`Rekaman: ${formatSecondsToHms(seg.startSec)} - ${formatSecondsToHms(seg.endSec)}`}
        />
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-slate-800 shadow-2xs select-none">
      {/* 1. Bar Info Waktu & Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-slate-500 text-xs">Waktu Replay:</span>
          <span className="font-mono font-bold text-slate-800 text-sm">
            {formatSecondsToHms(currentTimeSec)} WIB
          </span>
          <span className="text-[11px] text-slate-400">({selectedDate})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Skala */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {['24h', '4h', '1h'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoomLevel(lvl)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase transition ${
                  zoomLevel === lvl ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {onOpenClipExporter && (
            <button
              onClick={onOpenClipExporter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Video</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Scrubber Timeline */}
      <div className="relative pt-3 pb-1">
        <div className="relative h-4 mb-1">
          {renderTimeMarkers()}
        </div>

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          className="relative h-9 bg-slate-900 rounded-xl cursor-pointer overflow-hidden shadow-inner group border border-slate-800"
        >
          {/* Grid lines */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-slate-400" />
            ))}
          </div>

          {/* Pita Rekaman */}
          {renderRecordingSegments()}

          {/* Jarum Playhead Merah */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-md border-2 border-white -mt-0.5" />
            <div className="w-[2px] h-full bg-red-500" />
          </div>
        </div>
      </div>

      {/* 3. Bar Kontrol Tombol Pemutaran */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onStepFrame && onStepFrame(-1)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            title="Mundur 1 Detik"
          >
            <SkipBack className="w-3.5 h-3.5 inline mr-1" />
            -1s
          </button>

          <button
            onClick={() => onJump && onJump(-10)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            title="Mundur 10 Detik"
          >
            <Rewind className="w-3.5 h-3.5 inline mr-1" />
            -10s
          </button>

          <button
            onClick={onTogglePlay}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
          </button>

          <button
            onClick={() => onJump && onJump(10)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            title="Maju 10 Detik"
          >
            +10s
            <FastForward className="w-3.5 h-3.5 inline ml-1" />
          </button>

          <button
            onClick={() => onStepFrame && onStepFrame(1)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            title="Maju 1 Detik"
          >
            +1s
            <SkipForward className="w-3.5 h-3.5 inline ml-1" />
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] font-semibold text-slate-400 px-1.5">Speed:</span>
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed && onChangeSpeed(spd)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                playbackSpeed === spd
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
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
