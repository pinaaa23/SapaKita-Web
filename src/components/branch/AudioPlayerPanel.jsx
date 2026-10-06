import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  FileText, 
  X, 
  CheckCircle2, 
  XCircle,
  Video,
  PhoneCall,
  Sparkles,
  Info,
  FileDown
} from 'lucide-react';
import { downloadTextFile, downloadAudioFile, downloadTranscriptPDF } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { getAudioStreamUrl } from '../../services/callService';

const AudioPlayerPanel = ({ call, onClose }) => {
  const { isSupervisor, uptName, userName, roleLabel } = useAuth();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(call?.durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [audioSrc, setAudioSrc] = useState(call?.recordingUrl || null);

  // Keyboard Escape listener to close panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Audio lifecycle & cleanup on unmount
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        try {
          audioEl.pause();
          audioEl.currentTime = 0;
          audioEl.src = '';
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Reset & load new audio whenever call changes
  useEffect(() => {
    if (!call) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(call.durationSeconds || 0);
    setPlaybackSpeed(1);

    let isMounted = true;

    const setupAudio = async () => {
      let resolvedSrc = call.recordingUrl || null;

      // Jika ID rekaman dari backend, coba ambil presigned stream URL
      if (call.id && !call.id.startsWith('c')) {
        try {
          const streamUrl = await getAudioStreamUrl(call.id);
          if (streamUrl && isMounted) {
            resolvedSrc = streamUrl;
          }
        } catch (err) {
          console.log('[AudioPlayerPanel] Stream URL fallback:', err?.message || err);
        }
      }

      if (!isMounted) return;
      setAudioSrc(resolvedSrc);

      if (audioRef.current) {
        if (resolvedSrc) {
          audioRef.current.src = resolvedSrc;
          audioRef.current.playbackRate = 1;
          audioRef.current.currentTime = 0;
          // Auto play on select if valid URL exists
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => { if (isMounted) setIsPlaying(true); })
              .catch(() => { if (isMounted) setIsPlaying(false); });
          }
        } else {
          audioRef.current.src = '';
          setIsPlaying(false);
        }
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
    };
  }, [call?.id]);

  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Audio playback error:', e));
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }
    setIsPlaying(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleTimeUpdate = () => {
    if (!isSeeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleSeekChange = (e) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    setIsSeeking(false);
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Unduh rekaman audio dalam format .mp3
  const handleDownloadAudio = () => {
    if (!audioSrc && !call?.recordingUrl) {
      alert('File rekaman belum tersedia untuk diunduh.');
      return;
    }
    const name = (call?.inmateName || 'Panggilan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Rekaman_${name}_${call?.id || Date.now()}.mp3`;
    downloadAudioFile(audioSrc || call?.recordingUrl, filename);
  };

  // Unduh transkrip ke format PDF resmi
  const handleDownloadTranscript = () => {
    if (!call?.transcript) {
      alert('Transkrip belum tersedia untuk diunduh.');
      return;
    }
    const name = (call?.inmateName || 'Panggilan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Transkrip_${name}_${call?.id || Date.now()}.pdf`;
    downloadTranscriptPDF({
      transcriptText: call.transcript,
      transcriptData: call.transcriptData,
      callInfo: call,
      inmateInfo: { name: call.inmateName, wbpRegNumber: call.inmateId },
      uptName: uptName || 'UPT Pemasyarakatan',
      printedBy: `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
      filename
    });
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!call) return null;

  const isVideo = call.callType === 'Video' || call.backendType === 'VIDEO';
  const isAnswered = call.status === 'Answered' || call.status === 'Terjawab';
  const statusLabel = isAnswered ? 'Terjawab' : 'Tidak Terjawab';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100/90 overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
      {/* Hidden native audio element */}
      {audioSrc && (
        <audio 
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Header Panel */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Sedang Diputar
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              ID: {call.id}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup Pemutar Audio (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Call Info Summary */}
      <div className="p-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isVideo ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isVideo ? <Video className="w-2.5 h-2.5" /> : <PhoneCall className="w-2.5 h-2.5" />}
                {isVideo ? 'Video Call' : 'Voice Call'}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAnswered 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {isAnswered ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                {statusLabel}
              </span>
            </div>
            
            <h4 className="text-sm font-bold text-slate-900 mt-2 truncate" title={call.inmateName}>
              {call.inmateName}
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5" title={`${call.familyName} (${call.familyPhone})`}>
              Tujuan: <span className="font-semibold text-slate-700">{call.familyName}</span> ({call.familyPhone})
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {new Date(call.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </p>
          </div>
        </div>

        {isVideo && (
          <div className="mt-3 p-2 bg-amber-50/80 border border-amber-200/50 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Rekaman video call hanya memuat audio percakapan.</span>
          </div>
        )}
      </div>

      {/* Audio Player Controls */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col items-center shrink-0">
        {audioSrc ? (
          <>
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-13 h-13 rounded-full bg-primary hover:bg-primary-dark text-white shadow-md shadow-blue-500/20 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 mb-3"
              title={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              )}
            </button>

            {/* Progress Bar (Scrubber) */}
            <div className="w-full px-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.5"
                value={currentTime}
                onChange={handleSeekChange}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={handleSeekMouseUp}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold mt-1">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Speed Controls & Download Audio Button (.mp3) */}
            <div className="flex items-center justify-between w-full mt-3 pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Kecepatan:</span>
                {[1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/70'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDownloadAudio}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark transition-colors px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer"
                title="Unduh Rekaman Suara"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekaman</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-5 text-slate-400">
            <Volume2 className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
            <p className="font-bold text-xs text-slate-700">Rekaman belum tersedia</p>
            <p className="text-[11px] text-slate-400 mt-0.5">File rekaman audio belum diunggah atau tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* Transcript Section with Download (.txt) button */}
      <div className="p-4 flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            <h5 className="text-xs font-bold text-slate-800">
              Transkrip Percakapan
            </h5>
          </div>

          {call.transcript && (
            <button
              type="button"
              onClick={handleDownloadTranscript}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-primary hover:bg-blue-50 px-2 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="Unduh Transkrip Percakapan"
            >
              <FileDown className="w-3 h-3 text-primary" />
              <span>Unduh Transkrip</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-700 whitespace-pre-line space-y-2 max-h-52">
          {call.transcript ? (
            call.transcript
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-slate-300" />
              <p className="font-medium">Transkrip belum tersedia</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sistem sedang memproses transkrip otomatis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerPanel;
