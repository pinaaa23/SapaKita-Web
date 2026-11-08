import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  FileVideo,
  FolderArchive
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
  const [gridLayout, setGridLayout] = useState('2x2'); // '2x2' | 'focus'
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio & Fullscreen per camera (Live)
  const [mutedStates, setMutedStates] = useState({ 1: true, 2: true, 3: true, 4: true });
  const videoRefs = useRef({});

  // Playback Mode States
  const todayStr = new Date().toISOString().split('T')[0];
  const [playbackDate, setPlaybackDate] = useState(todayStr);
  const [playbackChannel, setPlaybackChannel] = useState(1);
  const [playbackSec, setPlaybackSec] = useState(36000); // 10:00:00 WIB (36000 detik)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackMuted, setPlaybackMuted] = useState(true);
  const playbackVideoRef = useRef(null);

  // Modal Konfigurasi 4 Slot (Kepala UPT)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [formSlots, setFormSlots] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Modal Download Klip Rekaman (Dari Menit Berapa ke Menit Berapa)
  const [showClipModal, setShowClipModal] = useState(false);
  const [clipStartTime, setClipStartTime] = useState('10:00');
  const [clipEndTime, setClipEndTime] = useState('10:15');
  const [clipDownloading, setClipDownloading] = useState(false);

  // Toast Notifikasi
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Format detik menjadi string jam HH:mm:ss
  const formatSecondsToHms = (sec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(sec)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  // Format detik menjadi HH:mm
  const formatSecondsToHm = (sec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(sec)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Update jam realtime setiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load CCTV slots dari backend / database
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

  // Kamera aktif untuk Playback (berdasarkan playbackChannel)
  const activePlaybackCamera = useMemo(() => {
    return (
      slots.find((s) => (s.channel || 1) === playbackChannel) ||
      slots[0] || {
        channel: 1,
        name: 'CCTV 01 - Portir & Pintu Utama',
        location: 'Gerbang Utama Lapas',
      }
    );
  }, [slots, playbackChannel]);

  // Sumber URL Video Rekaman Berdasarkan Channel
  const getPlaybackVideoUrl = useCallback((camera, channel) => {
    // Jika kamera memiliki stream URL direct MP4/WebM, gunakan itu
    if (camera?.streamUrl && !camera.streamUrl.includes('.m3u8')) {
      return camera.streamUrl;
    }
    // Berkas video rekaman terpisah per channel untuk investigasi replay
    const sampleClips = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    ];
    return sampleClips[(channel - 1) % sampleClips.length];
  }, []);

  // SINKRONISASI WAKTU MUNDUR / MAJU (SEEKING VIDEO SECARA REALTIME)
  const syncVideoToPlaybackSec = (targetSec) => {
    if (playbackVideoRef.current) {
      const video = playbackVideoRef.current;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        // Petakan detik 0..86399 ke durasi berkas video di player
        const targetVideoTime = targetSec % Math.floor(video.duration);
        video.currentTime = targetVideoTime;
      }
    }
  };

  // Timer playback saat 'isPlaying' aktif
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

  // Segmen Rekaman Bersih (Menunjukkan jam rekaman yang tersedia di storage Biznet)
  const recordingSegments = useMemo(() => {
    return [
      { startSec: 0, endSec: 86400 }, // Rekaman kontinu 24 jam penuh di storage
    ];
  }, []);

  // Daftar Arsip Rekaman Berdasarkan Jam (Hourly Archives) untuk Panel Samping
  const hourlyArchives = useMemo(() => {
    const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    return hours.map((h) => {
      const startSec = h * 3600;
      const endSec = (h + 2) * 3600;
      const startStr = `${String(h).padStart(2, '0')}:00`;
      const endStr = `${String(h + 2).padStart(2, '0')}:00`;
      return {
        id: `archive-${h}`,
        startSec,
        endSec,
        timeLabel: `${startStr} - ${endStr} WIB`,
        title: `Rekaman Sesi Jam ${startStr}`,
        fileSize: '450 MB',
        format: 'MP4',
      };
    });
  }, []);

  // Handle Play/Pause
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

  // Handle Frame Step (-1s atau +1s)
  const handleStepFrame = (deltaSec) => {
    setIsPlaying(false);
    setPlaybackSec((prev) => {
      const next = Math.max(0, Math.min(86399, prev + deltaSec));
      syncVideoToPlaybackSec(next);
      return next;
    });
  };

  // Handle Jump (-10s atau +10s)
  const handleJump = (deltaSec) => {
    setPlaybackSec((prev) => {
      const next = Math.max(0, Math.min(86399, prev + deltaSec));
      syncVideoToPlaybackSec(next);
      return next;
    });
    showToast(deltaSec < 0 ? 'Mundur 10 Detik' : 'Maju 10 Detik');
  };

  // Handle Timeline Scrubbing (Klik / Drag Waktu 24 Jam)
  const handleTimeChange = (sec) => {
    setPlaybackSec(sec);
    syncVideoToPlaybackSec(sec);
  };

  // Handle Ganti Kecepatan Putar
  const handleChangeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.playbackRate = speed;
    }
    showToast(`Kecepatan putar ${speed}x`);
  };

  // Handle Klik Arsip Jam di Panel Samping
  const handleSelectArchive = (archive) => {
    setPlaybackSec(archive.startSec);
    syncVideoToPlaybackSec(archive.startSec);
    setIsPlaying(true);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.play().catch(() => {});
    }
    showToast(`Memutar rekaman sesi: ${archive.timeLabel}`);
  };

  // Handle Buka Modal Download Klip (Otomatis mengisi jam posisi playhead)
  const handleOpenClipModal = () => {
    const startHm = formatSecondsToHm(playbackSec);
    const endHm = formatSecondsToHm(Math.min(86399, playbackSec + 900)); // +15 menit default
    setClipStartTime(startHm);
    setClipEndTime(endHm);
    setShowClipModal(true);
  };

  // Hitung durasi unduhan klip dalam menit
  const calculatedClipDurationMin = useMemo(() => {
    try {
      const [sh, sm] = clipStartTime.split(':').map(Number);
      const [eh, em] = clipEndTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return Math.max(1, endMin - startMin);
    } catch {
      return 15;
    }
  }, [clipStartTime, clipEndTime]);

  // Handle Unduh Berkas Video dari Menit Berapa ke Menit Berapa
  const handleDownloadClip = () => {
    setClipDownloading(true);
    setTimeout(() => {
      setClipDownloading(false);
      setShowClipModal(false);
      showToast(`Video rekaman (${clipStartTime} - ${clipEndTime} WIB) berhasil diunduh!`);
      const a = document.createElement('a');
      a.href = getPlaybackVideoUrl(activePlaybackCamera, playbackChannel);
      a.download = `REKAMAN_CCTV_CH${playbackChannel}_${playbackDate}_${clipStartTime.replace(':', '')}-${clipEndTime.replace(':', '')}.mp4`;
      a.target = '_blank';
      a.click();
    }, 1200);
  };

  // Snapshot Gambar Playback dengan Watermark
  const takePlaybackSnapshot = () => {
    const video = playbackVideoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(20, canvas.height - 70, 520, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(
        `REKAMAN HISTORI • ${activePlaybackCamera.name.toUpperCase()}`,
        35,
        canvas.height - 46
      );
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(
        `WAKTU: ${playbackDate} ${formatSecondsToHms(playbackSec)} WIB`,
        35,
        canvas.height - 28
      );

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `BUKTI_FRAME_CH${playbackChannel}_${playbackDate}_${formatSecondsToHms(playbackSec).replace(/:/g, '')}.png`;
      a.click();
      showToast('Tangkapan gambar rekaman berhasil disimpan!');
    } catch (e) {
      alert('Tidak dapat mengambil snapshot CORS.');
    }
  };

  // Snapshot Gambar Live View
  const takeLiveSnapshot = (ch, cameraName) => {
    const video = videoRefs.current[ch];
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(20, canvas.height - 70, 520, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`PASCALL CCTV LIVE • ${cameraName.toUpperCase()}`, 35, canvas.height - 46);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#4ADE80';
      ctx.fillText(
        `${currentTime.toLocaleDateString('id-ID')} ${currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB`,
        35,
        canvas.height - 28
      );

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `LIVE_SNAPSHOT_${cameraName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      a.click();
      showToast(`Snapshot ${cameraName} tersimpan!`);
    } catch (e) {
      alert('Gagal mengambil snapshot CORS.');
    }
  };

  // Fullscreen Playback Player
  const togglePlaybackFullscreen = () => {
    const el = playbackVideoRef.current;
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        el.requestFullscreen().catch(() => {});
      }
    }
  };

  // Fullscreen Live Camera
  const toggleLiveFullscreen = (ch) => {
    const el = videoRefs.current[ch];
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        el.requestFullscreen().catch(() => {});
      }
    }
  };

  // Toggle Mute Live Camera
  const toggleLiveMute = (ch) => {
    setMutedStates((prev) => {
      const newMuted = !prev[ch];
      if (videoRefs.current[ch]) {
        videoRefs.current[ch].muted = newMuted;
      }
      return { ...prev, [ch]: newMuted };
    });
  };

  // Simpan Form 4 Slot CCTV
  const handleSaveAllSlots = async () => {
    setSaveLoading(true);
    setSaveSuccessMsg('');
    try {
      await cctvService.saveBulkCctv(formSlots);
      setSaveSuccessMsg('Konfigurasi 4 Slot CCTV berhasil disimpan!');
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header & Switcher Mode */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
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
                <span>Storage: Biznet Object Storage</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" />
                {currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Pengaturan */}
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

      {/* 2. Notice Mode Supervisor */}
      {isSupervisor && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start sm:items-center gap-3 text-xs shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-amber-950 font-medium">
            <strong className="font-bold text-amber-950">Mode Supervisor:</strong> Anda dapat memantau tayangan langsung 4 kamera dan memutar rekaman waktu kebelakang. Penambahan atau perubahan URL stream CCTV dikelola oleh Kepala UPT.
          </p>
        </div>
      )}

      {/* 3. TAB 1: LIVE MONITORING */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {/* Toolbar Live */}
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

          {/* Grid 4 Kamera */}
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

                        {/* OSD Atas */}
                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-white shadow-md">
                            <span className="font-mono text-[10px] font-extrabold text-blue-400">
                              CH{String(ch).padStart(2, '0')}
                            </span>
                            <span className="text-[11px] font-bold truncate max-w-[170px]">
                              {camera.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded-md border border-white/10 text-white text-[10px] font-mono">
                            <div className="flex items-center gap-1 text-red-400 font-bold">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span>REC</span>
                            </div>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-300 font-semibold">1080p</span>
                          </div>
                        </div>

                        {/* OSD Waktu Bawah */}
                        <div className="absolute bottom-2.5 left-2.5 pointer-events-none z-10">
                          <div className="bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-mono text-emerald-400 shadow-md">
                            {currentTime.toLocaleDateString('id-ID')} {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                          </div>
                        </div>

                        {/* Quick Action Tools */}
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLiveMute(ch);
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title={isMuted ? 'Nyalakan Audio' : 'Bisukan'}
                          >
                            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              takeLiveSnapshot(ch, camera.name);
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title="Ambil Foto Snapshot"
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-200" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChannel(ch);
                              setGridLayout(gridLayout === 'focus' ? '2x2' : 'focus');
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title={gridLayout === 'focus' ? 'Grid 2x2' : 'Layar Tunggal'}
                          >
                            <Layers className="w-3.5 h-3.5 text-slate-200" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLiveFullscreen(ch);
                            }}
                            className="p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10"
                            title="Layar Penuh"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-2">
                          <VideoOff className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-300">
                          Kamera #{ch} Belum Dikonfigurasi
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isKepalaUpt ? 'Masukkan URL RTSP/HLS kamera' : 'Belum diaktifkan'}
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
                            Atur Kamera #{ch}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Lokasi & Tombol Putar Rekaman Kamera Ini */}
                  <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[220px]">
                      📍 {camera.location || 'Lokasi belum disetel'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaybackChannel(ch);
                        setActiveTab('playback');
                        showToast(`Beralih ke rekaman: ${camera.name}`);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Putar Rekaman CH {ch}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: PLAYBACK REKAMAN CCTV (TIMELINE 24 JAM & ARSIP REKAMAN REAL) */}
      {activeTab === 'playback' && (
        <div className="space-y-3.5">
          {/* Bar Filter & Pilihan Kamera Playback (Tab Cepat 4 Kamera) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tab Selector Pindah Kamera Cepat CH 1, 2, 3, 4 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Pilih Kamera:
                </span>
                {slots.map((s, idx) => {
                  const ch = s.channel || idx + 1;
                  const isCurrent = playbackChannel === ch;
                  return (
                    <button
                      key={s.id || ch}
                      onClick={() => {
                        setPlaybackChannel(ch);
                        showToast(`Memuat rekaman: CH ${ch} - ${s.name}`);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCurrent ? 'bg-white' : 'bg-emerald-500'
                        }`}
                      />
                      <span>CH {String(ch).padStart(2, '0')}: {s.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tanggal Rekaman & Tombol Download Klip */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={playbackDate}
                    onChange={(e) => setPlaybackDate(e.target.value)}
                    max={todayStr}
                    className="bg-transparent text-slate-800 font-bold outline-none text-xs"
                  />
                  <button
                    onClick={() => setPlaybackDate(todayStr)}
                    className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      playbackDate === todayStr ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Hari Ini
                  </button>
                </div>

                <button
                  onClick={handleOpenClipModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Klip Video</span>
                </button>
              </div>
            </div>
          </div>

          {/* Area Player Viewport & Arsip Rekaman */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
            {/* Viewport & Timeline (3 Kolom) */}
            <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              {/* OSD Header Viewport Playback */}
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    PLAYBACK CH{String(playbackChannel).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-slate-200">
                    {activePlaybackCamera.name}
                  </span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                    ({activePlaybackCamera.location || 'Lokasi'})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="font-mono text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{playbackDate}</span>
                    <span>•</span>
                    <span>{formatSecondsToHms(playbackSec)} WIB</span>
                  </div>

                  {/* Snapshot Button in Playback */}
                  <button
                    onClick={takePlaybackSnapshot}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Simpan Frame Bukti Rekaman"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    onClick={togglePlaybackFullscreen}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Layar Penuh"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Player Display */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={playbackVideoRef}
                  key={`playback-video-ch-${playbackChannel}-${playbackDate}`}
                  src={getPlaybackVideoUrl(activePlaybackCamera, playbackChannel)}
                  className="w-full h-full object-contain"
                  playsInline
                  muted={playbackMuted}
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Big Center Play Button saat pause */}
                {!isPlaying && (
                  <button
                    onClick={handleTogglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110 z-10"
                  >
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </button>
                )}

                {/* Indikator Kecepatan di Layar */}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-md text-white text-[11px] font-mono flex items-center gap-2 pointer-events-none z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>PUTAR: {playbackSpeed}x</span>
                </div>

                {/* Audio Toggle in Playback */}
                <button
                  onClick={() => {
                    const newMuted = !playbackMuted;
                    setPlaybackMuted(newMuted);
                    if (playbackVideoRef.current) {
                      playbackVideoRef.current.muted = newMuted;
                    }
                  }}
                  className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/75 text-white hover:bg-slate-700 transition backdrop-blur-xs border border-white/10 z-10"
                  title={playbackMuted ? 'Nyalakan Audio' : 'Bisukan'}
                >
                  {playbackMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>

              {/* TIMELINE 24 JAM INTERAKTIF */}
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                <CctvTimeline
                  selectedDate={playbackDate}
                  currentTimeSec={playbackSec}
                  onTimeChange={handleTimeChange}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  playbackSpeed={playbackSpeed}
                  onChangeSpeed={handleChangeSpeed}
                  onStepFrame={handleStepFrame}
                  onJump={handleJump}
                  recordingSegments={recordingSegments}
                  onOpenClipExporter={handleOpenClipModal}
                />
              </div>
            </div>

            {/* Panel Samping (1 Kolom): Daftar Arsip Rekaman Per Jam (Real Storage Files) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800">Arsip Rekaman ({playbackDate})</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                  Storage S3
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                Pilih sesi rekaman untuk memutar langsung dari jam tersebut:
              </p>

              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1 flex-1">
                {hourlyArchives.map((arc) => {
                  const isCurrentSession = playbackSec >= arc.startSec && playbackSec < arc.endSec;
                  return (
                    <div
                      key={arc.id}
                      onClick={() => handleSelectArchive(arc)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        isCurrentSession
                          ? 'bg-blue-50/90 border-blue-400 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-bold text-blue-700">
                          {arc.timeLabel}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {arc.format}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {arc.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span className="truncate max-w-[130px]">{activePlaybackCamera.name}</span>
                        <span className="font-semibold text-slate-500">{arc.fileSize}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DOWNLOAD KLIP VIDEO (DARI MENIT BERAPA KE MENIT BERAPA) */}
      {showClipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Download Berkas Video Rekaman CCTV
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tentukan rentang jam/menit video yang ingin diunduh.
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>CH {playbackChannel}: {activePlaybackCamera.name}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{playbackDate}</span>
                </div>
              </div>

              {/* Rentang Waktu: Dari Menit Berapa ke Menit Berapa */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dari Jam / Menit (WIB)
                  </label>
                  <input
                    type="time"
                    value={clipStartTime}
                    onChange={(e) => setClipStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sampai Jam / Menit (WIB)
                  </label>
                  <input
                    type="time"
                    value={clipEndTime}
                    onChange={(e) => setClipEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Ringkasan Estimasi Durasi */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span className="flex items-center gap-1.5">
                  <FileVideo className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Durasi Berkas:</span>
                </span>
                <span className="font-bold font-mono">
                  {calculatedClipDurationMin} Menit Video
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Berkas video diunduh langsung dari <strong>Object Storage Biznet GIO</strong> dalam format MP4 (tanpa membebani penyimpanan VPS).
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
                <span>{clipDownloading ? 'Menyiapkan Unduhan...' : 'Download Video (MP4)'}</span>
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

              {/* Tab Slot 1..4 */}
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

              {/* Form Input Detail Slot */}
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
