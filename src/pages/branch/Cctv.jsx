import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Edit3,
  Download,
  RefreshCw,
  FastForward,
  Rewind,
  HardDrive,
  Info,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { cctvService, SAMPLE_CCTV_STREAMS } from '../../services/cctvService';
import { getAuthUser } from '../../services/api';
import { ROLES, normalizeRole } from '../../config/menuConfig';
import CctvPlayer from '../../components/cctv/CctvPlayer';

export default function BranchCctv() {
  const user = getAuthUser();
  const currentRole = normalizeRole(user?.role);
  const isKepalaUpt = currentRole === ROLES.KEPALA_UPT || currentRole === ROLES.SUPERADMIN;
  const isSupervisor = currentRole === ROLES.SUPERVISOR;

  // State
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'playback'
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridLayout, setGridLayout] = useState('2x2'); // '2x2' | 'focus'
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
      setSaveSuccessMsg('Pengaturan 4 slot CCTV berhasil disimpan!');
      await loadCctvSlots();
      setTimeout(() => {
        setShowConfigModal(false);
        setSaveSuccessMsg('');
      }, 1200);
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
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* 1. Header Halaman (Clean & Simpel) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">Monitoring CCTV</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {isKepalaUpt ? 'Kepala UPT' : 'Supervisor'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan langsung 4 kamera CCTV UPT dan pemutaran rekaman histori.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Jam Sekarang */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
          </div>

          {/* Tombol Atur URL (Hanya untuk Kepala UPT) */}
          {isKepalaUpt && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Atur 4 Slot CCTV
            </button>
          )}
        </div>
      </div>

      {/* 2. Mode Supervisor Notice (Gambar 1 Fix: Jelas & Kontras Tinggi) */}
      {isSupervisor && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 flex items-start sm:items-center gap-3 text-xs shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-amber-950 leading-relaxed font-medium">
            <strong className="font-bold text-amber-950">Mode Supervisor:</strong> Anda dapat memantau tayangan langsung 4 kamera dan memutar rekaman waktu kebelakang. Penambahan atau perubahan URL stream CCTV dikelola oleh akun Kepala UPT.
          </p>
        </div>
      )}

      {/* 3. Tab Navigasi & Toolbar Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'playback'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Pemutaran Rekaman
          </button>
        </div>

        {/* Grid layout selector (pada tab Live Feed) */}
        {activeTab === 'live' && (
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 px-2">Tata Letak:</span>
              <button
                onClick={() => setGridLayout('2x2')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  gridLayout === '2x2'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid 2x2
              </button>
              <button
                onClick={() => setGridLayout('focus')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  gridLayout === 'focus'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fokus CH #{focusedChannel}
              </button>
            </div>

            <button
              onClick={loadCctvSlots}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
              title="Segarkan feed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. TAB 1: LIVE FEED (GRID 4 KAMERA) */}
      {activeTab === 'live' && (
        <div
          className={`grid gap-4 ${
            gridLayout === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
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
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs flex flex-col group transition hover:border-slate-300"
              >
                {/* Card Header (Clean & Terang) */}
                <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      CH {String(ch).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 leading-tight">
                        {camera.name || `Kamera Slot #${ch}`}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {camera.location || 'Lokasi belum disetel'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUrl ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ONLINE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        NONAKTIF
                      </span>
                    )}

                    {isKepalaUpt && (
                      <button
                        onClick={() => {
                          setEditingSlotIndex(ch - 1);
                          setShowConfigModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Ubah URL Kamera"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Player Display */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {hasUrl ? (
                    <>
                      <CctvPlayer
                        src={camera.streamUrl}
                        muted={isMuted}
                        autoPlay={true}
                        loop={true}
                        playsInline={true}
                        onVideoRef={(el) => {
                          if (el) videoRefs.current[ch] = el;
                        }}
                      />

                      {/* Top Overlay: Live badge & Clock */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                        <div className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          LIVE
                        </div>
                        <div className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                          {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                        </div>
                      </div>

                      {/* Bottom Overlay Controls (Hover) */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                        <div className="text-[11px] text-white/95 font-semibold drop-shadow truncate max-w-[200px]">
                          {camera.name}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Mute */}
                          <button
                            onClick={() => toggleMute(ch)}
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-white/20 transition backdrop-blur-xs"
                            title={isMuted ? 'Nyalakan Audio' : 'Bisukan'}
                          >
                            {isMuted ? (
                              <VolumeX className="w-3.5 h-3.5 text-slate-300" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>

                          {/* Snapshot */}
                          <button
                            onClick={() => takeSnapshot(ch, camera.name)}
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-white/20 transition backdrop-blur-xs"
                            title="Ambil Tangkapan Layar (PNG)"
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-200" />
                          </button>

                          {/* Focus */}
                          <button
                            onClick={() => {
                              if (gridLayout === 'focus') {
                                setGridLayout('2x2');
                              } else {
                                setFocusedChannel(ch);
                                setGridLayout('focus');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-white/20 transition backdrop-blur-xs"
                            title={gridLayout === 'focus' ? 'Tampilkan Grid 2x2' : 'Fokus Layar Ini'}
                          >
                            <Layers className="w-3.5 h-3.5 text-slate-200" />
                          </button>

                          {/* Fullscreen */}
                          <button
                            onClick={() => toggleFullscreen(ch)}
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-white/20 transition backdrop-blur-xs"
                            title="Layar Penuh"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Placeholder saat belum ada URL */
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2.5">
                        <VideoOff className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300">
                        Slot #{ch} Belum Dikonfigurasi
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                        {isKepalaUpt
                          ? 'Masukkan URL stream CCTV untuk mulai memantau.'
                          : 'Kamera belum diaktifkan.'}
                      </p>
                      {isKepalaUpt && (
                        <button
                          onClick={() => {
                            setEditingSlotIndex(ch - 1);
                            setShowConfigModal(true);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Atur URL Slot Ini
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="truncate max-w-[240px]">
                    {camera.notes || (hasUrl ? 'Perekaman otomatis aktif' : 'Standby')}
                  </span>
                  <button
                    onClick={() => {
                      setPlaybackChannel(ch);
                      setActiveTab('playback');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Lihat Histori
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TAB 2: PEMUTARAN REKAMAN (HISTORI WAKTU KEBELAKANG) */}
      {activeTab === 'playback' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pilih Kamera
                </label>
                <select
                  value={playbackChannel}
                  onChange={(e) => setPlaybackChannel(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
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
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tanggal Rekaman
                </label>
                <input
                  type="date"
                  value={playbackDate}
                  onChange={(e) => setPlaybackDate(e.target.value)}
                  max={todayStr}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              {/* Hour quick selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Jam Pemutaran (WIB)
                </label>
                <div className="flex items-center gap-1">
                  {[8, 10, 12, 14, 16].map((h) => (
                    <button
                      key={h}
                      onClick={() => setPlaybackHour(h)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        playbackHour === h
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {String(h).padStart(2, '0')}:00
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Penyimpanan Rekaman:</span>
              <span className="text-xs text-slate-700 font-bold flex items-center gap-1 justify-end">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                Biznet Object Storage
              </span>
            </div>
          </div>

          {/* Main Playback Player & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Player Column */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
              <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    HISTORI
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedClip?.title || `Rekaman Kamera #${playbackChannel} - ${playbackDate}`}
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
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

                {!isPlaying && (
                  <button
                    onClick={handleTogglePlayback}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition transform hover:scale-105"
                  >
                    <Play className="w-7 h-7 ml-1" />
                  </button>
                )}
              </div>

              {/* 24-Hour Slider Bar & Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Rentang Waktu 24 Jam ({playbackDate})</span>
                  <span className="text-blue-600 font-bold font-mono">
                    {String(playbackHour).padStart(2, '0')}:00 WIB
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="23"
                    step="1"
                    value={playbackHour}
                    onChange={(e) => setPlaybackHour(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                    <span>23:59</span>
                  </div>
                </div>

                {/* Toolbar Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlayback}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-2xs"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleSeek(-10)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      title="Mundur 10 Detik"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSeek(10)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      title="Maju 10 Detik"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs text-slate-700 ml-1">
                      {[0.5, 1, 2, 4].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => handleChangeSpeed(spd)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                            playbackSpeed === spd ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <a
                    href={selectedClip?.streamUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Rekaman
                  </a>
                </div>
              </div>
            </div>

            {/* Clips List Column */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col h-full shadow-2xs">
              <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Daftar Klip Tanggal {playbackDate}
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Pilih segmen rekaman untuk diputar.
              </p>

              <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
                {recordings.length > 0 ? (
                  recordings.map((clip) => {
                    const isSelected = selectedClip?.id === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClip(clip)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {clip.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white border border-slate-200 text-slate-600">
                            1 Jam
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{clip.cctv?.name || `CH #${clip.channel}`}</span>
                          <span className="text-emerald-600 font-semibold">Tersedia</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Tidak ada rekaman untuk tanggal yang dipilih.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIGURASI 4 SLOT CCTV (Khusus Kepala UPT) */}
      {showConfigModal && isKepalaUpt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Pengaturan 4 Slot Kamera CCTV
                  </h2>
                  <p className="text-xs text-slate-500">
                    Atur URL streaming dan lokasi kamera pengawasan lapas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {saveSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
                          ? 'bg-blue-50 border-blue-500 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-extrabold text-blue-700">SLOT {ch}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasUrl ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
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
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800">
                      Rincian Kamera Slot #{editingSlotIndex + 1}
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
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
                      >
                        Gunakan Contoh Stream Demo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Nama Kamera */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Kamera <span className="text-red-500">*</span>
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
                        placeholder="Contoh: CCTV 01 - Portir & Gerbang Depan"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Lokasi Kamera */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* URL Stream */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Stream Kamera (HLS .m3u8 / RTSP Proxy / Web Stream){' '}
                      <span className="text-red-500">*</span>
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
                      placeholder="https://domain/stream.m3u8 atau http://ip-camera:8080/live"
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-mono rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mendukung format HLS (.m3u8), stream video MP4, maupun embed URL web.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      >
                        <option value="ACTIVE">Aktif (Live Feed)</option>
                        <option value="INACTIVE">Nonaktif (Standby)</option>
                        <option value="MAINTENANCE">Perbaikan / Maintenance</option>
                      </select>
                    </div>

                    {/* Catatan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Penyimpanan rekaman otomatis ke object storage.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllSlots}
                  disabled={saveLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {saveLoading ? 'Menyimpan...' : 'Simpan Semua 4 Slot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
