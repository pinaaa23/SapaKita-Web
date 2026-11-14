import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward, Clock, Download, Layers } from 'lucide-react';

/**
 * CctvTimeline:
 * Scrubber linimasa rekaman CCTV presisi dengan navigasi sesi berkas 2 jam & mode 24 jam penuh.
 * Mendukung drag mouse/touch, pembatasan rentang sesuai sesi terpilih, ruler ticks presisi, dan hover preview.
 */
export default function CctvTimeline({
  selectedDate,
  currentTimeSec,
  playbackSec,
  onTimeChange,
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
  onStepFrame,
  onJump,
  recordingSegments = [],
  onOpenClipExporter,
  activeArchive,
  timelineMode = 'session',
  onChangeTimelineMode,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null); // { sec, percent }

  // Tentukan rentang waktu aktif berdasarkan mode (Sesi 2 Jam vs 24 Jam)
  const isSessionMode = timelineMode === 'session' && Boolean(activeArchive);
  const viewStartSec = isSessionMode ? activeArchive.startSec : 0;
  const viewDuration = isSessionMode ? (activeArchive.endSec - activeArchive.startSec) : 86400;
  const viewEndSec = viewStartSec + viewDuration;

  // Nilai detik aktif (terikat ke batasan viewStartSec & viewEndSec pada mode sesi)
  const rawSec = currentTimeSec !== undefined ? currentTimeSec : (playbackSec ?? (isSessionMode ? viewStartSec : 36000));
  const effectiveSec = useMemo(() => {
    return Math.max(viewStartSec, Math.min(viewEndSec, Math.floor(rawSec)));
  }, [rawSec, viewStartSec, viewEndSec]);

  const formatSecondsToHms = (totalSec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(totalSec)));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Persentase posisi jarum playhead merah pada rentang aktif (0% s/d 100%)
  const playheadPercent = Math.max(
    0,
    Math.min(100, ((effectiveSec - viewStartSec) / viewDuration) * 100)
  );

  // Kalkulasi target detik dari posisi horizontal kursor (clientX)
  const calculateSecFromClientX = (clientX) => {
    if (!containerRef.current) return effectiveSec;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return effectiveSec;
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const target = Math.round(viewStartSec + ratio * viewDuration);
    return Math.max(viewStartSec, Math.min(viewEndSec, target));
  };

  // Handler interaksi mouse down / touch start
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // Hanya tanggapi klik kiri
    setIsDragging(true);

    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const targetSec = calculateSecFromClientX(clientX);
    if (onTimeChange) {
      onTimeChange(targetSec);
    }
  };

  // Global Pointer Event listener pada window untuk drag yang mulus tanpa putus
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      if (clientX === undefined || clientX === null) return;
      const targetSec = calculateSecFromClientX(clientX);
      if (onTimeChange) {
        onTimeChange(targetSec);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, viewStartSec, viewDuration, viewEndSec, onTimeChange]);

  // Handler Hover Kursor untuk petunjuk waktu sebelum klik
  const handleTrackMouseMove = (e) => {
    if (!containerRef.current || isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const sec = Math.max(viewStartSec, Math.min(viewEndSec, Math.round(viewStartSec + ratio * viewDuration)));
    setHoverInfo({
      sec,
      percent: ratio * 100,
    });
  };

  const handleTrackMouseLeave = () => {
    setHoverInfo(null);
  };

  // Render penggaris skala waktu (Ruler Ticks) presisi & rapi
  const renderTimeMarkers = () => {
    const markers = [];
    // Pada mode sesi 2 jam: skala setiap 15 menit (900 detik)
    // Pada mode 24 jam: skala setiap 2 jam (7200 detik)
    const stepSec = isSessionMode ? 900 : 7200;
    const totalSteps = Math.round(viewDuration / stepSec);

    // Minor ticks (garis kecil)
    const minorStepSec = isSessionMode ? 300 : 3600; // 5 menit atau 1 jam
    const totalMinorSteps = Math.round(viewDuration / minorStepSec);

    // 1. Gambar minor ticks di latar belakang
    for (let j = 0; j <= totalMinorSteps; j++) {
      const isMajor = (j * minorStepSec) % stepSec === 0;
      if (!isMajor) {
        const minorPercent = (j / totalMinorSteps) * 100;
        markers.push(
          <div
            key={`minor-${j}`}
            className="absolute bottom-0 -translate-x-1/2 pointer-events-none flex flex-col items-center"
            style={{ left: `${minorPercent}%` }}
          >
            <div className="w-[1px] h-1.5 bg-slate-300/80" />
          </div>
        );
      }
    }

    // 2. Gambar major ticks dengan teks angka jam
    for (let i = 0; i <= totalSteps; i++) {
      const sec = viewStartSec + i * stepSec;
      const posPercent = (i / totalSteps) * 100;
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Penanganan khusus agar teks tepi kiri (0%) dan tepi kanan (100%) tidak terpotong
      let alignClass = '-translate-x-1/2 text-center';
      if (i === 0) alignClass = 'translate-x-0 text-left';
      if (i === totalSteps) alignClass = '-translate-x-full text-right';

      markers.push(
        <div
          key={`major-${sec}`}
          className={`absolute bottom-0 flex flex-col pointer-events-none select-none ${alignClass}`}
          style={{ left: `${posPercent}%` }}
        >
          <span className="text-[11px] font-mono font-bold text-slate-500 mb-1 tracking-tight">
            {label}
          </span>
          <div className="w-[1.5px] h-2.5 bg-slate-400 mx-auto" />
        </div>
      );
    }
    return markers;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-slate-800 shadow-2xs select-none">
      {/* 1. Bar Info Waktu & Pengaturan Cakupan Sesi */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500 font-medium">Waktu Replay:</span>
          <span className="font-mono font-black text-slate-800 text-sm tracking-tight bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
            {formatSecondsToHms(effectiveSec)} WIB
          </span>

          {/* Badge Sesi Aktif */}
          {activeArchive && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/70 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Sesi: {activeArchive.timeLabel}</span>
            </div>
          )}

          {selectedDate && (
            <span className="text-[11px] font-semibold text-slate-400">
              ({selectedDate})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Pemilih Mode Skala (Sesi Terpilih vs 24 Jam Penuh) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onChangeTimelineMode && onChangeTimelineMode('session')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                timelineMode === 'session'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fokus geser hanya pada sesi jam yang dipilih di samping kanan"
            >
              <span>Sesi Terpilih (2 Jam)</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTimelineMode && onChangeTimelineMode('24h')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                timelineMode === '24h'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan rentang penuh 24 jam seharian"
            >
              <span>24 Jam</span>
            </button>
          </div>

          {onOpenClipExporter && (
            <button
              type="button"
              onClick={onOpenClipExporter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Video</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Precision Ruler & Interactive Track */}
      <div className="relative pt-1 pb-1 select-none">
        {/* Baris Penggaris Angka Jam & Garis Skala (Ruler) */}
        <div className="relative h-6 mb-1.5">
          {renderTimeMarkers()}
        </div>

        {/* Jalur Pita Rekaman Utama (Bisa Diklik & Ditarik) */}
        <div
          ref={containerRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onMouseMove={handleTrackMouseMove}
          onMouseLeave={handleTrackMouseLeave}
          className={`relative h-11 bg-slate-950 rounded-xl overflow-visible shadow-inner group border transition-all touch-none ${
            isDragging
              ? 'border-blue-500 ring-2 ring-blue-500/30 cursor-grabbing'
              : 'border-slate-800 hover:border-slate-700 cursor-pointer'
          }`}
        >
          {/* Garis Grid Sekat Pembatas di Dalam Jalur */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-25 rounded-xl overflow-hidden">
            {Array.from({ length: isSessionMode ? 8 : 12 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-slate-500" />
            ))}
          </div>

          {/* Blok Pita Rekaman (Pita Biru Halus) */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {isSessionMode ? (
              // Mode Sesi 2 Jam: Seluruh panjang bar adalah rekaman berkas sesi ini
              <div
                className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 opacity-90 shadow-sm"
                title={`Berkas Rekaman Sesi: ${activeArchive.timeLabel}`}
              />
            ) : (
              // Mode 24 Jam Penuh: Tampilkan highlight sesi aktif di atas pita 24 jam
              <>
                <div className="w-full h-full bg-blue-600/70 opacity-80" />
                {activeArchive && (
                  <div
                    className="absolute top-0 bottom-0 bg-blue-500 border-x-2 border-white/60 shadow-lg"
                    style={{
                      left: `${(activeArchive.startSec / 86400) * 100}%`,
                      width: `${((activeArchive.endSec - activeArchive.startSec) / 86400) * 100}%`,
                    }}
                    title={`Sesi Terpilih: ${activeArchive.timeLabel}`}
                  />
                )}
              </>
            )}
          </div>

          {/* Hover Guideline & Floating Tooltip */}
          {hoverInfo && !isDragging && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none -translate-x-1/2 z-20 flex flex-col items-center"
              style={{ left: `${hoverInfo.percent}%` }}
            >
              {/* Tooltip Waktu Mengambang Saat Mouse Diarahkan */}
              <div className="absolute -top-7 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[10px] font-bold shadow-lg whitespace-nowrap">
                {formatSecondsToHms(hoverInfo.sec)} WIB
              </div>
              <div className="w-[1.5px] h-full bg-white/80 shadow-xs" />
            </div>
          )}

          {/* Jarum Playhead Merah (Draggable Scrubber Handle) */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Draggable Circle Pin Handle */}
            <div className="relative -mt-1.5 flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-transform ${
                  isDragging
                    ? 'scale-125 bg-red-600 ring-4 ring-red-400/50'
                    : 'bg-red-500 group-hover:scale-110'
                }`}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>

            {/* Garis Merah Vertikal Melintasi Track */}
            <div className={`w-[2px] h-full shadow-sm ${isDragging ? 'bg-red-600' : 'bg-red-500'}`} />
          </div>
        </div>
      </div>

      {/* 3. Bar Kontrol Tombol Pemutaran & Kecepatan */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStepFrame && onStepFrame(-1)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            title="Mundur 1 Detik"
          >
            <SkipBack className="w-3.5 h-3.5 inline mr-1" />
            -1s
          </button>

          <button
            type="button"
            onClick={() => onJump && onJump(-10)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            title="Mundur 10 Detik"
          >
            <Rewind className="w-3.5 h-3.5 inline mr-1" />
            -10s
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
          </button>

          <button
            type="button"
            onClick={() => onJump && onJump(10)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            title="Maju 10 Detik"
          >
            +10s
            <FastForward className="w-3.5 h-3.5 inline ml-1" />
          </button>

          <button
            type="button"
            onClick={() => onStepFrame && onStepFrame(1)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            title="Maju 1 Detik"
          >
            +1s
            <SkipForward className="w-3.5 h-3.5 inline ml-1" />
          </button>
        </div>

        {/* Kontrol Kecepatan Pemutaran (Speed) */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-[10px] font-semibold text-slate-400 px-1.5">Speed:</span>
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed && onChangeSpeed(spd)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
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
