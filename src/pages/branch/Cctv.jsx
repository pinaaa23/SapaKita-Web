import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  X,
  Film,
  Activity,
  AlertTriangle,
  ZoomIn,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cctvService, SAMPLE_CCTV_STREAMS } from '../../services/cctvService';
import { getAuthUser } from '../../services/api';
import { ROLES, normalizeRole } from '../../config/menuConfig';
import CctvPlayer from '../../components/cctv/CctvPlayer';
import CctvTimeline from '../../components/cctv/CctvTimeline';

export default function BranchCctv() {
  const user = getAuthUser();
  const currentRole = normalizeRole(user?.role);
  const isKepalaUpt = currentRole === ROLES.KEPALA_UPT || currentRole === ROLES.SUPERADMIN;
  const isSupervisor = currentRole === ROLES.SUPERVISOR;

  // Mode Tampilan Utama: 'live' | 'playback'
  const [activeTab, setActiveTab] = useState('live');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Mode States
  const [gridLayout, setGridLayout] = useState('2x2'); // '2x2' | '1x1' | 'focus'
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio & Fullscreen per camera
  const [mutedStates, setMutedStates] = useState({ 1: true, 2: true, 3: true, 4: true });
  const videoRefs = useRef({});

  // Playback Mode States
  const todayStr = new Date().toISOString().split('T')[0];
  const [playbackDate, setPlaybackDate] = useState(todayStr);
  const [playbackChannel, setPlaybackChannel] = useState(1);
  const [playbackSec, setPlaybackSec] = useState(36000); // 10:00:00 WIB (36000s)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackVideoRef = useRef(null);

  // Modal Konfigurasi (Kepala UPT)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [formSlots, setFormSlots] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Modal Gunting Klip Bukti (Footage Exporter)
  const [showClipModal, setShowClipModal] = useState(false);
  const [clipStartHms, setClipStartHms] = useState('10:00:00');
  const [clipEndHms, setClipEndHms] = useState('10:15:00');
  const [clipNotes, setClipNotes] = useState('Bukti Rekaman Pengawasan Lapas');
  const [clipDownloading, setClipDownloading] = useState(false);

  // Toast Notifikasi
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Update realtime clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer playback saat 'isPlaying' bernilai true
  useEffect(() => {
    let interval = null;
    if (activeTab === 'playback' && isPlaying) {
      interval = setInterval(() => {
        setPlaybackSec((prev) => {
          if (prev >= 86399) {
            setIsPlaying(false);
            return 86399;
          }
          return Math.min(86399, prev + playbackSpeed);
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, isPlaying, playbackSpeed]);

  // Load CCTV slots dari backend / cache
  const loadCctvSlots = async () => {
    setLoading(true);
    try {
      const data = await cctvService.getCctvList(user?.branchId);
      setSlots(data);
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

  // Segmen Rekaman Realistis untuk Timeline (Continuous & Motion Event)
  const recordingSegments = useMemo(() => {
    return [
      { startSec: 0, endSec: 18000, type: 'continuous' }, // 00:00 - 05:00
      { startSec: 21600, endSec: 43200, type: 'continuous' }, // 06:00 - 12:00
      { startSec: 28800, endSec: 32400, type: 'motion' }, // 08:00 - 09:00 (Aktivitas Apel Pagi)
      { startSec: 36600, endSec: 39600, type: 'motion' }, // 10:10 - 11:00 (Kunjungan WBP)
      { startSec: 46800, endSec: 64800, type: 'continuous' }, // 13:00 - 18:00
      { startSec: 50400, endSec: 52200, type: 'motion' }, // 14:00 - 14:30 (Gerakan Koridor)
      { startSec: 68400, endSec: 86400, type: 'continuous' }, // 19:00 - 24:00
    ];
  }, []);

  // Daftar Event Log Kejadian untuk Panel Samping Playback
  const eventLogs = useMemo(() => {
    return [
      {
        id: 'ev-1',
        timeSec: 28800,
        timeLabel: '08:00:00 WIB',
        title: 'Apel Pagi & Pergantian Shift Regu',
        type: 'motion',
        duration: '60 Menit',
        camera: 'CH 01 - Portir & Pintu Utama',
      },
      {
        id: 'ev-2',
        timeSec: 36600,
        timeLabel: '10:10:00 WIB',
        title: 'Aktivitas Kunjungan Keluarga & WBP',
        type: 'motion',
        duration: '50 Menit',
        camera: 'CH 02 - Ruang Kunjungan',
      },
      {
        id: 'ev-3',
        timeSec: 43200,
        timeLabel: '12:00:00 WIB',
        title: 'Distribusi Makanan & Kebutuhan Kamar',
        type: 'continuous',
        duration: '45 Menit',
        camera: 'CH 03 - Koridor Blok Hunian A',
      },
      {
        id: 'ev-4',
        timeSec: 50400,
        timeLabel: '14:00:00 WIB',
        title: 'Gerakan Terdeteksi di Koridor Tengah',
        type: 'motion',
        duration: '30 Menit',
        camera: 'CH 03 - Koridor Blok Hunian A',
      },
      {
        id: 'ev-5',
        timeSec: 57600,
        timeLabel: '16:00:00 WIB',
        title: 'Penutupan Pintu & Kunci Kamar Sel',
        type: 'continuous',
        duration: '40 Menit',
        camera: 'CH 01 - Portir & Gerbang',
      },
    ];
  }, []);

  // Format detik ke format jam string HH:mm:ss
  const formatSecondsToHms = (sec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(sec)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  // Mute / Unmute kartu kamera
  const toggleMute = (ch) => {
    setMutedStates((prev) => {
      const newMuted = !prev[ch];
      if (videoRefs.current[ch]) {
        videoRefs.current[ch].muted = newMuted;
      }
      return { ...prev, [ch]: newMuted };
    });
  };

  // Fullscreen kamera spesifik
  const toggleFullscreen = (ch) => {
    const el = videoRefs.current[ch];
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        el.requestFullscreen().catch(() => {});
      }
    }
  };

  // Snapshot gambar beresolusi tinggi dengan Watermark Bukti Resmi
  const takeSnapshot = (ch, cameraName) => {
    const video = videoRefs.current[ch];
    if (!video) {
      showToast('Kamera belum siap untuk snapshot');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Watermark Resmi Berkas Pengawasan Lapas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, canvas.height - 65, 520, 45);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(
        `PASCALL CCTV • ${cameraName.toUpperCase()}`,
        35,
        canvas.height - 43
      );
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#A3E635'; // Lime green
      ctx.fillText(
        `${currentTime.toLocaleDateString('id-ID')} ${currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB`,
        35,
        canvas.height - 26
      );

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `CCTV_SNAPSHOT_${cameraName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      a.click();
      showToast(`Snapshot ${cameraName} berhasil disimpan!`);
    } catch (e) {
      alert('Tidak dapat mengambil snapshot CORS. Pastikan URL stream mengizinkan snapshot.');
    }
  };

  // Handle Playback Controls
  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    if (playbackVideoRef.current) {
      if (isPlaying) {
        playbackVideoRef.current.pause();
      } else {
        playbackVideoRef.current.play().catch(() => {});
      }
    }
  };

  const handleStepFrame = (deltaSec) => {
    setIsPlaying(false);
    setPlaybackSec((prev) => Math.max(0, Math.min(86399, prev + deltaSec)));
  };

  const handleJump = (deltaSec) => {
    setPlaybackSec((prev) => Math.max(0, Math.min(86399, prev + deltaSec)));
  };

  const handleChangeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.playbackRate = speed;
    }
    showToast(`Kecepatan diputar ${speed}x`);
  };

  // Lompat ke event yang dipilih di panel
  const handleSelectEvent = (eventItem) => {
    setPlaybackSec(eventItem.timeSec);
    setIsPlaying(true);
    showToast(`Melompat ke kejadian: ${eventItem.title}`);
  };

  // Handle Simpan Form Konfigurasi (Kepala UPT)
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
      }, 1200);
    } catch (e) {
      alert('Gagal menyimpan slot CCTV: ' + (e.message || 'Terjadi kesalahan'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Ekspor Klip Bukti
  const handleDownloadClip = () => {
    setClipDownloading(true);
    setTimeout(() => {
      setClipDownloading(false);
      setShowClipModal(false);
      showToast('Klip rekaman MP4 berhasil diunduh dari Object Storage Biznet!');
      // Trigger unduhan file sample video
      const a = document.createElement('a');
      a.href = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      a.download = `BUKTI_CCTV_CH${playbackChannel}_${playbackDate}_${clipStartHms.replace(/:/g, '')}.mp4`;
      a.target = '_blank';
      a.click();
    }, 1200);
  };

  // Current active camera object
  const activeCameraObj = slots.find((s) => (s.channel || 1) === selectedChannel) || slots[0] || {};

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header Navigasi & Mode Switcher VMS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Judul & Status Sistem */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Video className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800">Sistem Pengawasan CCTV Lapas</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {isKepalaUpt ? 'Kepala UPT' : 'Supervisor (View Only)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-600" />
                <span>Penyimpanan: Biznet Object Storage</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" />
                {currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher: LIVE MONITORING vs PLAYBACK REKAMAN */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'live'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>Live Monitor</span>
            </button>

            <button
              onClick={() => setActiveTab('playback')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'playback'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Playback Rekaman</span>
            </button>
          </div>

          {/* Tombol Pengaturan 4 Slot (Khusus Kepala UPT) */}
          {isKepalaUpt && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Atur URL Kamera</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner Informasi Mode Supervisor (Jelas & Kontras Tinggi) */}
      {isSupervisor && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start sm:items-center gap-3 text-xs shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-amber-950 font-medium">
            <strong className="font-bold text-amber-950">Mode Supervisor:</strong> Anda memiliki hak akses untuk memantau tayangan langsung 4 kamera dan memutar rekaman waktu kebelakang. Penambahan atau perubahan URL stream CCTV dikelola oleh Kepala UPT.
          </p>
        </div>
      )}

      {/* 3. KONTEN TAB 1: LIVE MONITORING (KONSOL CCTV 4 KAMERA) */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {/* Toolbar Live: Grid Layout Switcher & Refresh */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-400 text-[11px]">Tampilan Layar:</span>
              <button
                onClick={() => setGridLayout('2x2')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  gridLayout === '2x2' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Grid 2x2 (4 Kamera)
              </button>
              <button
                onClick={() => setGridLayout('focus')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  gridLayout === 'focus' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Layar Tunggal (CH #{selectedChannel})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4 Kamera Terhubung
              </span>
              <button
                onClick={loadCctvSlots}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Segarkan feed kamera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid Viewports Kamera CCTV */}
          <div
            className={`grid gap-3.5 ${
              gridLayout === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {slots.map((camera, index) => {
              const ch = camera.channel || index + 1;
              if (gridLayout === 'focus' && ch !== selectedChannel) return null;

              const isMuted = mutedStates[ch] ?? true;
              const hasUrl = Boolean(camera.streamUrl && camera.streamUrl.trim() !== '');
              const isSelected = selectedChannel === ch;

              return (
                <div
                  key={camera.id || `cam-${ch}`}
                  onClick={() => setSelectedChannel(ch)}
                  className={`bg-slate-950 rounded-2xl overflow-hidden shadow-lg border-2 transition group relative flex flex-col ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Aspect-Video Viewport Display */}
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

                        {/* OSD (On-Screen Display) Header Atas */}
                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                          {/* Nama Kamera & Channel Tag */}
                          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-white shadow-md">
                            <span className="font-mono text-[10px] font-extrabold text-blue-400">
                              CH{String(ch).padStart(2, '0')}
                            </span>
                            <span className="text-[11px] font-bold truncate max-w-[170px]">
                              {camera.name}
                            </span>
                          </div>

                          {/* Indikator REC Merah & Kualitas */}
                          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded-md border border-white/10 text-white text-[10px] font-mono">
                            <div className="flex items-center gap-1 text-red-400 font-bold">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span>REC</span>
                            </div>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-300 font-semibold">1080p</span>
                          </div>
                        </div>

                        {/* OSD Bawah: Realtime CCTV Timestamp font digital */}
                        <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10">
                          <div className="bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-mono text-emerald-400 shadow-md">
                            {currentTime.toLocaleDateString('id-ID')} {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                          </div>
                        </div>

                        {/* Quick Action Overlay (Muncul saat hover di kanan bawah) */}
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition z-20">
                          {/* Toggle Audio */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute(ch);
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title={isMuted ? 'Nyalakan Audio' : 'Bisukan'}
                          >
                            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>

                          {/* Snapshot PNG */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              takeSnapshot(ch, camera.name);
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title="Ambil Foto Snapshot (Watermark)"
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-200" />
                          </button>

                          {/* Focus */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChannel(ch);
                              setGridLayout(gridLayout === 'focus' ? '2x2' : 'focus');
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title={gridLayout === 'focus' ? 'Kembali ke Grid' : 'Layar Tunggal'}
                          >
                            <Layers className="w-3.5 h-3.5 text-slate-200" />
                          </button>

                          {/* Fullscreen */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFullscreen(ch);
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title="Layar Penuh"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Placeholder saat belum ada URL */
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-2">
                          <VideoOff className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-300">
                          Kamera #{ch} Belum Dikonfigurasi
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isKepalaUpt ? 'Masukkan URL RTSP/HLS kamera untuk mulai memantau' : 'Belum diaktifkan oleh Kepala UPT'}
                        </p>
                        {isKepalaUpt && (
                          <button
                            onClick={() => {
                              setEditingSlotIndex(ch - 1);
                              setShowConfigModal(true);
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Atur URL Kamera #{ch}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Strip Info */}
                  <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[220px]">
                      📍 {camera.location || 'Lokasi belum disetel'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaybackChannel(ch);
                        setActiveTab('playback');
                      }}
                      className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Putar Rekaman
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. KONTEN TAB 2: PLAYBACK REKAMAN (TIMELINE 24 JAM & EVENT INVESTIGASI) */}
      {activeTab === 'playback' && (
        <div className="space-y-4">
          {/* Filter Bar Playback */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Kamera Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Kamera CCTV
                </label>
                <select
                  value={playbackChannel}
                  onChange={(e) => setPlaybackChannel(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
                >
                  {slots.map((s, idx) => (
                    <option key={s.id || idx} value={s.channel || idx + 1}>
                      CH {s.channel || idx + 1}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Rekaman */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tanggal Rekaman
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={playbackDate}
                    onChange={(e) => setPlaybackDate(e.target.value)}
                    max={todayStr}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setPlaybackDate(todayStr)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      playbackDate === todayStr
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hari Ini
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Status Object Storage */}
            <div className="text-right flex items-center gap-2">
              <button
                onClick={() => setShowClipModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Gunting Klip Bukti</span>
              </button>
            </div>
          </div>

          {/* Area Player Utama & Panel Samping Investigasi */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Player Viewport (3 Kolom) */}
            <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              {/* OSD Header Viewport Playback */}
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    PLAYBACK CH{String(playbackChannel).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-slate-200">
                    {activeCameraObj.name || `Kamera Slot #${playbackChannel}`}
                  </span>
                </div>
                <div className="font-mono text-emerald-400 font-bold text-xs">
                  {playbackDate} • {formatSecondsToHms(playbackSec)} WIB
                </div>
              </div>

              {/* Layar Video Playback */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  ref={playbackVideoRef}
                  src={
                    activeCameraObj.streamUrl ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                  }
                  className="w-full h-full object-contain"
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Big Center Play Button if paused */}
                {!isPlaying && (
                  <button
                    onClick={handleTogglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110"
                  >
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </button>
                )}

                {/* Indikator Status Pemutaran di Layar */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded text-white text-[11px] font-mono flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>SPEED: {playbackSpeed}x</span>
                </div>
              </div>

              {/* Timeline 24 Jam Interaktif NVR Profesional */}
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                <CctvTimeline
                  selectedDate={playbackDate}
                  currentTimeSec={playbackSec}
                  onTimeChange={(sec) => setPlaybackSec(sec)}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  playbackSpeed={playbackSpeed}
                  onChangeSpeed={handleChangeSpeed}
                  onStepFrame={handleStepFrame}
                  onJump={handleJump}
                  recordingSegments={recordingSegments}
                  onOpenClipExporter={() => setShowClipModal(true)}
                />
              </div>
            </div>

            {/* Panel Samping (1 Kolom): Event & Log Rekaman */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800">Daftar Kejadian</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                  {eventLogs.length} Event
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                Klik peristiwa di bawah ini untuk melompat langsung ke waktu kejadian pada video.
              </p>

              {/* Event List Items */}
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1 flex-1">
                {eventLogs.map((ev) => {
                  const isNearCurrent = Math.abs(playbackSec - ev.timeSec) < 1800; // dalam rentang 30 menit
                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleSelectEvent(ev)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        isNearCurrent
                          ? 'bg-blue-50/90 border-blue-400 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-bold text-blue-700">
                          {ev.timeLabel}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            ev.type === 'motion'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {ev.type === 'motion' ? 'GERAKAN' : 'RUTIN'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {ev.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span className="truncate max-w-[130px]">{ev.camera}</span>
                        <span className="font-semibold text-slate-500">{ev.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL GUNTING KLIP BUKTI REKAMAN (FOOTAGE EXPORTER) */}
      {showClipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Ekspor Klip Bukti Rekaman CCTV
                  </h2>
                  <p className="text-xs text-slate-500">
                    Potong cuplikan rekaman untuk keperluan berkas investigasi lapas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClipModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Kamera Terpilih */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kamera CCTV
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  CH {playbackChannel}: {activeCameraObj.name} ({activeCameraObj.location})
                </div>
              </div>

              {/* Tanggal & Waktu Klip */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu Mulai (WIB)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={clipStartHms}
                    onChange={(e) => setClipStartHms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu Selesai (WIB)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={clipEndHms}
                    onChange={(e) => setClipEndHms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Catatan Investigasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perihal / Catatan Kejadian
                </label>
                <input
                  type="text"
                  value={clipNotes}
                  onChange={(e) => setClipNotes(e.target.value)}
                  placeholder="Contoh: Bukti pemeriksaan barang bawaan di portir"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Berkas video dipotong langsung dari <strong>Object Storage Biznet GIO</strong> dalam format MP4 resmi siap lampir.
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowClipModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownloadClip}
                disabled={clipDownloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{clipDownloading ? 'Memproses Klip...' : 'Unduh Klip MP4'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIGURASI 4 SLOT CCTV (Khusus Kepala UPT) */}
      {showConfigModal && isKepalaUpt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Pengaturan 4 Slot Kamera CCTV UPT
                  </h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasi URL streaming dan lokasi kamera pengawasan lapas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
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

              {/* Form Input Selected Slot */}
              {formSlots[editingSlotIndex] && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800">
                      Rincian Slot Kamera #{editingSlotIndex + 1}
                    </h3>
                    {SAMPLE_CCTV_STREAMS[editingSlotIndex] && (
                      <button
                        type="button"
                        onClick={() => {
                          const s = SAMPLE_CCTV_STREAMS[editingSlotIndex];
                          setFormSlots((prev) => {
                            const u = [...prev];
                            u[editingSlotIndex] = {
                              ...u[editingSlotIndex],
                              name: s.name,
                              location: s.location,
                              streamUrl: s.url,
                              status: 'ACTIVE',
                              isRecording: true,
                            };
                            return u;
                          });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold underline"
                      >
                        Gunakan Contoh Stream Demo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Penyimpanan rekaman otomatis diarahkan ke Object Storage Biznet.
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
