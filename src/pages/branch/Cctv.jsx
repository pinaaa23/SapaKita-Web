import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  Download,
  RefreshCw,
  FastForward,
  Rewind,
  HardDrive,
  Eye,
  Info,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { cctvService, SAMPLE_CCTV_STREAMS } from '../../services/cctvService';
import { getAuthUser } from '../../services/api';
import { ROLES, normalizeRole } from '../../config/menuConfig';

export default function BranchCctv() {
  const user = getAuthUser();
  const currentRole = normalizeRole(user?.role);
  const isKepalaUpt = currentRole === ROLES.KEPALA_UPT || currentRole === ROLES.SUPERADMIN;
  const isSupervisor = currentRole === ROLES.SUPERVISOR;

  // State
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'playback'
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridLayout, setGridLayout] = useState('2x2'); // '2x2' | '1x1' | 'focus'
  const [focusedChannel, setFocusedChannel] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Configuration Modal State (Kepala UPT only)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [formSlots, setFormSlots] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Audio / Player Controls
  const [mutedStates, setMutedStates] = useState({ 1: true, 2: true, 3: true, 4: true });
  const videoRefs = useRef({});

  // Playback / Waktu Kebelakang State
  const todayStr = new Date().toISOString().split('T')[0];
  const [playbackDate, setPlaybackDate] = useState(todayStr);
  const [playbackChannel, setPlaybackChannel] = useState(1);
  const [playbackHour, setPlaybackHour] = useState(10);
  const [recordings, setRecordings] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackVideoRef = useRef(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load CCTV slots
  const loadCctvSlots = async () => {
    setLoading(true);
    try {
      const data = await cctvService.getCctvList(user?.branchId);
      setSlots(data);
      // Init form slots
      setFormSlots(
        data.map((s, idx) => ({
          channel: s.channel || idx + 1,
          name: s.name || `CCTV Slot ${idx + 1}`,
          location: s.location || '',
          streamUrl: s.streamUrl || '',
          status: s.status || 'ACTIVE',
          isRecording: s.isRecording ?? true,
          notes: s.notes || '',
        }))
      );
    } catch (e) {
      console.error('Failed to load CCTV slots:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCctvSlots();
  }, [user?.branchId]);

  // Load recordings when tab or date changes
  useEffect(() => {
    if (activeTab === 'playback') {
      loadRecordings();
    }
  }, [activeTab, playbackDate, playbackChannel]);

  const loadRecordings = async () => {
    try {
      const res = await cctvService.getCctvRecordings({
        channel: playbackChannel,
        date: playbackDate,
      });
      if (res && res.data) {
        setRecordings(res.data);
        if (res.data.length > 0 && !selectedClip) {
          setSelectedClip(res.data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load recordings:', e);
    }
  };

  // Toggle Mute for specific card
  const toggleMute = (channel) => {
    setMutedStates((prev) => {
      const newMuted = !prev[channel];
      if (videoRefs.current[channel]) {
        videoRefs.current[channel].muted = newMuted;
      }
      return { ...prev, [channel]: newMuted };
    });
  };

  // Fullscreen specific camera
  const toggleFullscreen = (channel) => {
    const el = videoRefs.current[channel];
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        el.requestFullscreen().catch(() => {});
      }
    }
  };

  // Snapshot / Screenshot capture
  const takeSnapshot = (channel, cameraName) => {
    const video = videoRefs.current[channel];
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add timestamp watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(20, canvas.height - 60, 480, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px sans-serif';
      ctx.fillText(`${cameraName} • ${new Date().toLocaleString('id-ID')}`, 30, canvas.height - 35);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `snapshot-${cameraName.replace(/\s+/g, '_')}-${Date.now()}.png`;
      a.click();
    } catch (e) {
      alert('Tidak dapat mengambil snapshot stream lintas-domain (CORS). Pastikan URL stream mengizinkan snapshot.');
    }
  };

  // Handle Save Form Slots (Kepala UPT)
  const handleSaveAllSlots = async () => {
    setSaveLoading(true);
    setSaveSuccessMsg('');
    try {
      await cctvService.saveBulkCctv(formSlots);
      setSaveSuccessMsg('Konfigurasi 4 Slot CCTV berhasil disimpan dan diaktifkan!');
      await loadCctvSlots();
      setTimeout(() => {
        setShowConfigModal(false);
        setSaveSuccessMsg('');
      }, 1500);
    } catch (e) {
      alert('Gagal menyimpan slot CCTV: ' + (e.message || 'Terjadi kesalahan'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Quick fill sample stream for testing
  const handleUseSampleStream = (index, sample) => {
    setFormSlots((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: sample.name,
        location: sample.location,
        streamUrl: sample.url,
        status: 'ACTIVE',
        isRecording: true,
      };
      return updated;
    });
  };

  // Playback video controls
  const handleTogglePlayback = () => {
    if (!playbackVideoRef.current) return;
    if (isPlaying) {
      playbackVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      playbackVideoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleChangeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (deltaSec) => {
    if (!playbackVideoRef.current) return;
    playbackVideoRef.current.currentTime = Math.max(
      0,
      playbackVideoRef.current.currentTime + deltaSec
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Video className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Monitoring & Pengawasan CCTV Lapas
              </h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Pemantauan visual 4 titik CCTV secara real-time dan akses rekaman histori waktu kebelakang.
              Penyimpanan rekaman otomatis diarahkan ke <span className="text-blue-400 font-medium">Object Storage S3/MinIO Recording</span> (bebas beban VPS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium">
                {isKepalaUpt ? 'Kepala UPT (Akses Penuh & Konfigurasi)' : 'Supervisor (Akses Pemantauan & Histori)'}
              </span>
            </div>

            {/* Tombol Konfigurasi (Khusus Kepala UPT) */}
            {isKepalaUpt && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Konfigurasi 4 Slot CCTV
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher & Status Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'live'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Feed (4 Kamera)
            </button>
            <button
              onClick={() => setActiveTab('playback')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'playback'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Pemutaran Rekaman (Waktu Kebelakang)
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Storage: S3 Recording</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice jika login sebagai Supervisor */}
      {isSupervisor && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3 text-amber-200 text-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Mode Supervisor (Read-Only):</strong> Anda memiliki hak akses untuk memantau tayangan langsung ke-4 kamera dan memutar rekaman waktu kebelakang. Penambahan atau perubahan URL stream hanya dapat dilakukan oleh akun Kepala UPT.
          </span>
        </div>
      )}

      {/* 2. TAB 1: LIVE FEED VIEW */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">Tata Letak Grid:</span>
              <button
                onClick={() => setGridLayout('2x2')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  gridLayout === '2x2' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Grid 2x2 (4 Kamera)
              </button>
              <button
                onClick={() => setGridLayout('focus')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  gridLayout === 'focus' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Fokus Kamera #{focusedChannel}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadCctvSlots}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Segarkan
              </button>
            </div>
          </div>

          {/* Video Grid Cards */}
          <div
            className={`grid gap-4 ${
              gridLayout === '2x2'
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {slots.map((camera, index) => {
              const ch = camera.channel || index + 1;
              if (gridLayout === 'focus' && ch !== focusedChannel) return null;

              const isMuted = mutedStates[ch] ?? true;
              const hasUrl = Boolean(camera.streamUrl && camera.streamUrl.trim() !== '');

              return (
                <div
                  key={camera.id || `cam-${ch}`}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col group transition hover:border-slate-700"
                >
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        CH {String(ch).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {camera.name || `CCTV Slot #${ch}`}
                        </h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{camera.location || 'Lokasi belum disetel'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasUrl ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                          NONAKTIF
                        </span>
                      )}

                      {isKepalaUpt && (
                        <button
                          onClick={() => {
                            setEditingSlotIndex(ch - 1);
                            setShowConfigModal(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Ubah URL Kamera"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Video Player Display Container */}
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {hasUrl ? (
                      <>
                        <video
                          ref={(el) => (videoRefs.current[ch] = el)}
                          src={camera.streamUrl}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          playsInline
                          muted={isMuted}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.warn(`Video load error on CH ${ch}:`, camera.streamUrl);
                          }}
                        />

                        {/* Top Overlay: Live badge & Clock */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                          <div className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            LIVE
                          </div>
                          <div className="bg-black/60 backdrop-blur-sm text-slate-200 text-[11px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                            {currentTime.toLocaleDateString('id-ID')} {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                          </div>
                        </div>

                        {/* Bottom Overlay Controls (Appears on Hover) */}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                          <div className="text-[11px] text-white/90 font-medium drop-shadow">
                            {camera.name}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Mute button */}
                            <button
                              onClick={() => toggleMute(ch)}
                              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition backdrop-blur-sm"
                              title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
                            >
                              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                            </button>

                            {/* Snapshot capture */}
                            <button
                              onClick={() => takeSnapshot(ch, camera.name)}
                              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition backdrop-blur-sm"
                              title="Ambil Tangkapan Layar (Snapshot)"
                            >
                              <Camera className="w-4 h-4 text-slate-300" />
                            </button>

                            {/* Focus toggle */}
                            <button
                              onClick={() => {
                                if (gridLayout === 'focus') {
                                  setGridLayout('2x2');
                                } else {
                                  setFocusedChannel(ch);
                                  setGridLayout('focus');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition backdrop-blur-sm"
                              title={gridLayout === 'focus' ? 'Kembali ke Grid 2x2' : 'Fokus Layar Ini'}
                            >
                              <Layers className="w-4 h-4 text-slate-300" />
                            </button>

                            {/* Fullscreen */}
                            <button
                              onClick={() => toggleFullscreen(ch)}
                              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition backdrop-blur-sm"
                              title="Layar Penuh"
                            >
                              <Maximize2 className="w-4 h-4 text-slate-300" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Placeholder saat URL belum diisi */
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                          <VideoOff className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-300">
                          Slot CCTV #{ch} Belum Dikonfigurasi
                        </h4>
                        <p className="text-xs text-slate-500 max-w-xs mt-1">
                          {isKepalaUpt
                            ? 'Masukkan URL stream CCTV untuk mulai menampilkan feed langsung.'
                            : 'Kamera ini belum diaktifkan oleh Kepala UPT.'}
                        </p>
                        {isKepalaUpt && (
                          <button
                            onClick={() => {
                              setEditingSlotIndex(ch - 1);
                              setShowConfigModal(true);
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Atur URL Slot Ini
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Info */}
                  <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="truncate max-w-[240px]">
                      {camera.notes || (hasUrl ? 'Perekaman otomatis aktif ke storage' : 'Standby')}
                    </span>
                    <button
                      onClick={() => {
                        setPlaybackChannel(ch);
                        setActiveTab('playback');
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Lihat Histori
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB 2: PLAYBACK / HISTORI WAKTU KEBELAKANG */}
      {activeTab === 'playback' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Kamera CCTV
                </label>
                <select
                  value={playbackChannel}
                  onChange={(e) => setPlaybackChannel(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                >
                  {slots.map((s, idx) => (
                    <option key={s.id || idx} value={s.channel || idx + 1}>
                      CH {s.channel || idx + 1}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tanggal Rekaman
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={playbackDate}
                    onChange={(e) => setPlaybackDate(e.target.value)}
                    max={todayStr}
                    className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Hour quick selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Jam Pemutaran (WIB)
                </label>
                <div className="flex items-center gap-1">
                  {[8, 10, 12, 14, 16].map((h) => (
                    <button
                      key={h}
                      onClick={() => setPlaybackHour(h)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        playbackHour === h
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {String(h).padStart(2, '0')}:00
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Penyimpanan Rekaman:</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <HardDrive className="w-3.5 h-3.5" />
                Object Storage S3/MinIO
              </span>
            </div>
          </div>

          {/* Playback Main Player & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Column (2 Cols) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    HISTORI REKAMAN
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {selectedClip?.title || `Rekaman Kamera #${playbackChannel} - ${playbackDate}`}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {playbackDate} {String(playbackHour).padStart(2, '0')}:00 WIB
                </span>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  ref={playbackVideoRef}
                  src={
                    selectedClip?.streamUrl ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                  }
                  className="w-full h-full object-contain"
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Center Big Play Button if paused */}
                {!isPlaying && (
                  <button
                    onClick={handleTogglePlayback}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                )}
              </div>

              {/* Playback Timeline Scrubber (00:00 - 23:59) */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Rentang Waktu 24 Jam (Hari: {playbackDate})</span>
                  <span className="text-blue-400 font-semibold font-mono">
                    {String(playbackHour).padStart(2, '0')}:00 WIB
                  </span>
                </div>

                {/* 24-Hour Slider Bar */}
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="23"
                    step="1"
                    value={playbackHour}
                    onChange={(e) => setPlaybackHour(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  {/* Hours Markers */}
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                    <span>23:59</span>
                  </div>
                </div>

                {/* Player Toolbar Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-850">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlayback}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleSeek(-10)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Mundur 10 Detik"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSeek(10)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Maju 10 Detik"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-lg border border-slate-700 text-xs text-slate-300 ml-2">
                      {[0.5, 1, 2, 4].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => handleChangeSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                            playbackSpeed === spd ? 'bg-blue-600 text-white' : 'hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedClip?.streamUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Klip MP4
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Clips List Column (1 Col) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Segmen Arsip Tanggal {playbackDate}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Daftar arsip rekaman video yang tersimpan di bucket storage S3.
              </p>

              <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
                {recordings.length > 0 ? (
                  recordings.map((clip) => {
                    const isSelected = selectedClip?.id === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClip(clip)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500/50 shadow-md'
                            : 'bg-slate-850 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white truncate">
                            {clip.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                            1 Jam
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{clip.cctv?.name || `CH #${clip.channel}`}</span>
                          <span className="text-emerald-400 font-medium">Tersimpan di S3</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Tidak ada rekaman untuk tanggal dan kamera yang dipilih.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL KONFIGURASI 4 SLOT CCTV (Khusus Kepala UPT) */}
      {showConfigModal && isKepalaUpt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Konfigurasi 4 Slot Kamera CCTV UPT
                  </h2>
                  <p className="text-xs text-slate-400">
                    Masukkan URL stream CCTV untuk ke-4 titik pengawasan lapas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {saveSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Slot Selector Tabs (1..4) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((ch, idx) => {
                  const currentForm = formSlots[idx] || {};
                  const isCurrent = editingSlotIndex === idx;
                  const hasUrl = Boolean(currentForm.streamUrl && currentForm.streamUrl.trim());

                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setEditingSlotIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                          : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-400">SLOT {ch}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasUrl ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="text-xs font-semibold text-white truncate">
                        {currentForm.name || `Kamera ${ch}`}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentForm.location || 'Lokasi belum disetel'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Form Input for Selected Slot */}
              {formSlots[editingSlotIndex] && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Pengaturan Slot CCTV #{editingSlotIndex + 1}</span>
                    </h3>
                    {SAMPLE_CCTV_STREAMS[editingSlotIndex] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUseSampleStream(
                            editingSlotIndex,
                            SAMPLE_CCTV_STREAMS[editingSlotIndex]
                          )
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                      >
                        Gunakan Contoh Stream Demo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Kamera */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Kamera CCTV <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formSlots[editingSlotIndex].name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSlots((prev) => {
                            const u = [...prev];
                            u[editingSlotIndex].name = val;
                            return u;
                          });
                        }}
                        placeholder="Contoh: CCTV 01 - Portir & Pintu Utama"
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Lokasi Kamera */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Lokasi / Titik Penempatan
                      </label>
                      <input
                        type="text"
                        value={formSlots[editingSlotIndex].location}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSlots((prev) => {
                            const u = [...prev];
                            u[editingSlotIndex].location = val;
                            return u;
                          });
                        }}
                        placeholder="Contoh: Pintu Utama Gerbang Depan"
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* URL Stream */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      URL Stream CCTV (RTSP Web Proxy / HLS .m3u8 / HTTP / MP4){' '}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formSlots[editingSlotIndex].streamUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSlots((prev) => {
                          const u = [...prev];
                          u[editingSlotIndex].streamUrl = val;
                          return u;
                        });
                      }}
                      placeholder="https://.../stream.m3u8 atau http://ip-camera:8080/live"
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mendukung format streaming standar HLS (.m3u8), stream video MP4/WebM, atau web proxy RTSP.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Status Kamera
                      </label>
                      <select
                        value={formSlots[editingSlotIndex].status}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSlots((prev) => {
                            const u = [...prev];
                            u[editingSlotIndex].status = val;
                            return u;
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      >
                        <option value="ACTIVE">Aktif (Live & Ditampilkan)</option>
                        <option value="INACTIVE">Nonaktif (Standby)</option>
                        <option value="MAINTENANCE">Pemeliharaan / Perbaikan</option>
                      </select>
                    </div>

                    {/* Catatan */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Catatan Pengawasan
                      </label>
                      <input
                        type="text"
                        value={formSlots[editingSlotIndex].notes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSlots((prev) => {
                            const u = [...prev];
                            u[editingSlotIndex].notes = val;
                            return u;
                          });
                        }}
                        placeholder="Keterangan opsional"
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Penyimpanan rekaman otomatis diarahkan ke storage recording (S3/MinIO).
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllSlots}
                  disabled={saveLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                >
                  {saveLoading ? 'Menyimpan...' : 'Simpan Semua 4 Slot CCTV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
