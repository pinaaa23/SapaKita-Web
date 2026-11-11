import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  VideoOff,
  Maximize2,
  Volume2,
  VolumeX,
  Camera,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Calendar,
  Download,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  X,
  FileVideo,
  Sparkles,
  RefreshCw,
  Edit2,
  Eye,
  Grid2X2,
  Square,
  ShieldCheck,
  Building2,
  Radio,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cctvService, SAMPLE_CCTV_STREAMS } from '../../services/cctvService';
import { getAuthUser } from '../../services/api';
import { ROLES, normalizeRole } from '../../config/menuConfig';
import CctvPlayer from '../../components/cctv/CctvPlayer';
import CctvTimeline from '../../components/cctv/CctvTimeline';

export default function BranchCctv() {
  const user = getAuthUser();
  const normRole = normalizeRole(user?.role);
  const isKepalaUpt = normRole === ROLES.KEPALA_UPT;
  const isSupervisor = normRole === ROLES.SUPERVISOR;
  // Hanya Kepala UPT (atau Superadmin) yang boleh menambah, mengatur, dan mengubah URL CCTV
  const canManageCctv = isKepalaUpt || normRole === ROLES.SUPERADMIN;

  // Tab: 'live' (Tayangan Langsung 4 Kamera) atau 'playback' (Pemutaran Rekaman Waktu Kebelakang)
  const [activeTab, setActiveTab] = useState('live');

  // Layout Grid: '2x2' (Semua 4 Kamera) atau 'focus' (1 Kamera Terpilih)
  const [gridLayout, setGridLayout] = useState('2x2');
  const [selectedChannel, setSelectedChannel] = useState(1);

  // Daftar 4 Slot Kamera CCTV
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Jam Realtime
  const [currentTime, setCurrentTime] = useState(new Date());

  // Status Audio per Kamera
  const [mutedStates, setMutedStates] = useState({ 1: true, 2: true, 3: true, 4: true });

  // Referensi DOM Video Kamera
  const videoRefs = useRef({});

  // Modal Konfigurasi Slot Kamera CCTV
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [formSlots, setFormSlots] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Toast Notifikasi
  const [toastMsg, setToastMsg] = useState('');

  // -------------------------------------------------------------
  // STATE KHUSUS PEMUTARAN REKAMAN (PLAYBACK / WAKTU KEBELAKANG)
  // -------------------------------------------------------------
  const [playbackChannel, setPlaybackChannel] = useState(1);
  const [playbackDate, setPlaybackDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timelineMode, setTimelineMode] = useState('session'); // 'session' (fokus 2 jam) atau '24h' (penuh 24 jam)
  const [selectedArchiveId, setSelectedArchiveId] = useState(() => {
    const now = new Date();
    const h = now.getHours();
    const startHour = Math.floor(h / 2) * 2;
    return `archive-${startHour}`;
  });
  const [playbackSec, setPlaybackSec] = useState(() => {
    const now = new Date();
    const h = now.getHours();
    const startHour = Math.floor(h / 2) * 2;
    return startHour * 3600; // Mulai dari awal sesi jam aktif
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackVideoRef = useRef(null);

  // Modal Ekspor Klip Rekaman Kustom
  const [showClipModal, setShowClipModal] = useState(false);
  const [clipStartTime, setClipStartTime] = useState('08:00');
  const [clipEndTime, setClipEndTime] = useState('08:15');
  const [clipDownloading, setClipDownloading] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const formatSecondsToHms = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const formatSecondsToHm = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Jam lokal berjalan
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Muat daftar kamera CCTV dari API / database
  const loadCctvSlots = async () => {
    setLoading(true);
    try {
      const data = await cctvService.getCctvList(user?.branchId);
      setSlots(data);
      setFormSlots(
        data.map((s, idx) => ({
          channel: s.channel || idx + 1,
          name: s.name || `CCTV Slot ${idx + 1}`,
          location: s.location || (idx === 0 ? 'Pintu Portir / Depan' : idx === 1 ? 'Ruang Kunjungan' : idx === 2 ? 'Koridor Blok Hunian' : 'Area Wartel & Kantin'),
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

  // Kamera aktif untuk pemutaran rekaman
  const activePlaybackCamera = useMemo(() => {
    return (
      slots.find((s) => (s.channel || 1) === playbackChannel) ||
      slots[0] || {
        channel: 1,
        name: 'Kamera 01',
        location: 'Pos Pengawasan',
      }
    );
  }, [slots, playbackChannel]);

  // URL Video Rekaman
  const getPlaybackVideoUrl = useMemo(() => (camera, channel) => {
    if (camera?.streamUrl && !camera.streamUrl.includes('.m3u8')) {
      return camera.streamUrl;
    }
    const sampleClips = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    ];
    return sampleClips[(channel - 1) % sampleClips.length];
  }, []);

  // Daftar berkas rekaman per sesi jam (12 sesi @ 2 jam)
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
        title: `Rekaman Jam ${startStr}`,
        fileSize: '420 MB',
      };
    });
  }, []);

  // Sesi rekaman aktif yang sedang dipilih
  const selectedArchive = useMemo(() => {
    return hourlyArchives.find((a) => a.id === selectedArchiveId) || hourlyArchives[5] || hourlyArchives[0];
  }, [hourlyArchives, selectedArchiveId]);

  // Sinkronisasi pemutar video saat waktu digeser
  const syncVideoToPlaybackSec = (targetSec) => {
    if (playbackVideoRef.current) {
      const video = playbackVideoRef.current;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        // Offset relatif terhadap awal berkas rekaman sesi 2 jam (0 s/d 7200 detik)
        const baseSec = (timelineMode === 'session' && selectedArchive) ? selectedArchive.startSec : 0;
        const offsetSec = Math.max(0, targetSec - baseSec);
        const targetVideoTime = offsetSec % Math.floor(video.duration);
        if (typeof video.fastSeek === 'function') {
          video.fastSeek(targetVideoTime);
        } else {
          video.currentTime = targetVideoTime;
        }
      }
    }
  };

  // Timer playback saat tombol play ditekan
  useEffect(() => {
    let interval = null;
    if (activeTab === 'playback' && isPlaying) {
      interval = setInterval(() => {
        setPlaybackSec((prev) => {
          const maxSec = (timelineMode === 'session' && selectedArchive) ? selectedArchive.endSec : 86399;
          if (prev >= maxSec) {
            setIsPlaying(false);
            return maxSec;
          }
          return Math.min(maxSec, prev + playbackSpeed);
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, isPlaying, playbackSpeed, timelineMode, selectedArchive]);

  // Segmen ketersediaan rekaman
  const recordingSegments = useMemo(() => {
    return [{ startSec: 0, endSec: 86400 }];
  }, []);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (playbackVideoRef.current) {
        if (next) {
          playbackVideoRef.current.play().catch(() => {});
        } else {
          playbackVideoRef.current.pause();
        }
      }
      return next;
    });
  };

  const handleStepFrame = (deltaSec) => {
    setIsPlaying(false);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause();
    }
    setPlaybackSec((prev) => {
      const minSec = (timelineMode === 'session' && selectedArchive) ? selectedArchive.startSec : 0;
      const maxSec = (timelineMode === 'session' && selectedArchive) ? selectedArchive.endSec : 86399;
      const next = Math.max(minSec, Math.min(maxSec, prev + deltaSec));
      syncVideoToPlaybackSec(next);
      return next;
    });
  };

  const handleJump = (deltaSec) => {
    setPlaybackSec((prev) => {
      const minSec = (timelineMode === 'session' && selectedArchive) ? selectedArchive.startSec : 0;
      const maxSec = (timelineMode === 'session' && selectedArchive) ? selectedArchive.endSec : 86399;
      const next = Math.max(minSec, Math.min(maxSec, prev + deltaSec));
      syncVideoToPlaybackSec(next);
      return next;
    });
    showToast(deltaSec < 0 ? 'Mundur 10 detik' : 'Maju 10 detik');
  };

  const handleTimeChange = (sec) => {
    setPlaybackSec(sec);
    syncVideoToPlaybackSec(sec);
  };

  const handleChangeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.playbackRate = speed;
    }
    showToast(`Kecepatan putar ${speed}x`);
  };

  const handleSelectArchive = (archive) => {
    setSelectedArchiveId(archive.id);
    setTimelineMode('session'); // Selalu fokus geser pada rentang 2 jam sesi yang dipilih
    setPlaybackSec(archive.startSec);
    syncVideoToPlaybackSec(archive.startSec);
    setIsPlaying(true);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.play().catch(() => {});
    }
    showToast(`Fokus Sesi: ${archive.timeLabel}`);
  };

  const handleOpenClipModal = () => {
    const startHm = formatSecondsToHm(playbackSec);
    const endHm = formatSecondsToHm(Math.min(86399, playbackSec + 900));
    setClipStartTime(startHm);
    setClipEndTime(endHm);
    setShowClipModal(true);
  };

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

  const handleDownloadClip = () => {
    setClipDownloading(true);
    setTimeout(() => {
      setClipDownloading(false);
      setShowClipModal(false);
      showToast(`Rekaman (${clipStartTime} - ${clipEndTime} WIB) berhasil diunduh.`);
      const a = document.createElement('a');
      a.href = getPlaybackVideoUrl(activePlaybackCamera, playbackChannel);
      a.download = `REKAMAN_CCTV_CH${playbackChannel}_${playbackDate}_${clipStartTime.replace(':', '')}-${clipEndTime.replace(':', '')}.mp4`;
      a.target = '_blank';
      a.click();
    }, 1000);
  };

  const takePlaybackSnapshot = () => {
    const video = playbackVideoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, canvas.height - 60, 480, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${activePlaybackCamera.name.toUpperCase()} • ${playbackDate} ${formatSecondsToHms(playbackSec)} WIB`, 30, canvas.height - 35);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `SNAPSHOT_CH${playbackChannel}_${playbackDate}_${formatSecondsToHms(playbackSec).replace(/:/g, '')}.png`;
      a.click();
      showToast('Gambar snapshot berhasil disimpan.');
    } catch (e) {
      alert('Gagal mengambil snapshot gambar.');
    }
  };

  const takeLiveSnapshot = (ch, cameraName) => {
    const video = videoRefs.current[ch];
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, canvas.height - 60, 480, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${cameraName.toUpperCase()} • ${currentTime.toLocaleDateString('id-ID')} ${currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB`, 30, canvas.height - 35);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `LIVE_SNAPSHOT_${cameraName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      a.click();
      showToast('Gambar snapshot berhasil disimpan.');
    } catch (e) {
      alert('Gagal mengambil snapshot gambar.');
    }
  };

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

  const toggleLiveMute = (ch) => {
    setMutedStates((prev) => {
      const newMuted = !prev[ch];
      if (videoRefs.current[ch]) {
        videoRefs.current[ch].muted = newMuted;
      }
      return { ...prev, [ch]: newMuted };
    });
  };

  // Simpan semua slot CCTV ke database backend & state
  const handleSaveAllSlots = async () => {
    setSaveLoading(true);
    setSaveSuccessMsg('');
    try {
      await cctvService.saveBulkCctv(formSlots);
      setSaveSuccessMsg('Konfigurasi 4 slot kamera CCTV berhasil disimpan.');
      await loadCctvSlots();
      setTimeout(() => {
        setShowConfigModal(false);
        setSaveSuccessMsg('');
        showToast('Kamera CCTV berhasil diperbarui dan tertaut.');
      }, 700);
    } catch (e) {
      alert('Gagal menyimpan: ' + (e.message || 'Terjadi kesalahan'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Tombol 1-klik untuk mengisi 4 stream sample aktif
  const handleFillAllSampleStreams = async () => {
    setSaveLoading(true);
    try {
      const sampleData = [
        {
          channel: 1,
          name: 'CCTV 01 - Pintu Portir / Depan',
          location: 'Gerbang Depan Lapas',
          streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          status: 'ACTIVE',
          isRecording: true,
        },
        {
          channel: 2,
          name: 'CCTV 02 - Ruang Kunjungan',
          location: 'Aula Kunjungan WBP',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          status: 'ACTIVE',
          isRecording: true,
        },
        {
          channel: 3,
          name: 'CCTV 03 - Koridor Blok Hunian A',
          location: 'Blok A Koridor Utama',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          status: 'ACTIVE',
          isRecording: true,
        },
        {
          channel: 4,
          name: 'CCTV 04 - Area Wartel & Kantin',
          location: 'Bilik Wartel & Ruang Kasir',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          status: 'ACTIVE',
          isRecording: true,
        },
      ];

      await cctvService.saveBulkCctv(sampleData);
      await loadCctvSlots();
      showToast('4 Stream CCTV sampel aktif berhasil dimuat.');
    } catch (e) {
      showToast('Gagal memuat stream sampel: ' + e.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Control Bar: Mode Toggle, Layout Switcher & Action Buttons */}
      <div className="p-3 sm:p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Mode Switcher (Live vs Playback) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span>Live Monitor (4 Kamera)</span>
          </button>

          <button
            onClick={() => setActiveTab('playback')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'playback'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
            <span>Pemutaran Rekaman</span>
          </button>
        </div>

        {/* Right: Layout Switcher, Realtime Clock & Config Modal Button */}
        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Realtime Digital Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
          </div>

          {/* Grid Layout & Focus Switcher (Pilihan Grid 2x2 atau Fokus ke CH 1, 2, 3, 4) */}
          {activeTab === 'live' && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setGridLayout('2x2')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 px-3 ${
                  gridLayout === '2x2' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilkan semua 4 kamera dalam grid 2x2"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid 2x2</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

              <span className="text-[10px] font-bold text-slate-400 px-1 hidden md:inline">Fokus:</span>

              {[1, 2, 3, 4].map((ch) => {
                const isFocused = gridLayout === 'focus' && selectedChannel === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(ch);
                      setGridLayout('focus');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title={`Fokus Layar Penuh Kamera CH ${ch}`}
                  >
                    CH {ch}
                  </button>
                );
              })}
            </div>
          )}

          {/* Atur Kamera Button (Hanya Tersedia untuk Kepala UPT) */}
          {canManageCctv && (
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Atur Kamera</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* KONTEN UTAMA: TAB 1 (LIVE MONITORING MATRIX)                   */}
      {/* ============================================================== */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Matriks 4 Kamera (16:9 Aspect Ratio) */}
          <div className={gridLayout === '2x2' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
            {[1, 2, 3, 4].map((ch) => {
              if (gridLayout === 'focus' && ch !== selectedChannel) return null;

              const camera = slots.find((s) => (s.channel || 1) === ch) || {
                channel: ch,
                name: `CCTV Slot ${ch}`,
                location: ch === 1 ? 'Pintu Portir / Depan' : ch === 2 ? 'Ruang Kunjungan' : ch === 3 ? 'Koridor Blok Hunian' : 'Area Wartel & Kantin',
                streamUrl: '',
                status: 'INACTIVE',
              };

              const hasUrl = Boolean(camera.streamUrl && camera.streamUrl.trim() !== '');
              const isSelected = selectedChannel === ch;
              const isMuted = mutedStates[ch] ?? true;

              return (
                <div
                  key={camera.id || `cctv-${ch}`}
                  onClick={() => setSelectedChannel(ch)}
                  onDoubleClick={() => {
                    setSelectedChannel(ch);
                    setGridLayout((prev) => (prev === 'focus' ? '2x2' : 'focus'));
                  }}
                  className={`group relative aspect-video rounded-2xl bg-slate-950 border overflow-hidden shadow-sm transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Tombol Panah Navigasi Kiri & Kanan (Muncul saat mode Fokus) */}
                  {gridLayout === 'focus' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChannel((prev) => (prev === 1 ? 4 : prev - 1));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 shadow-xl transition backdrop-blur-xs cursor-pointer opacity-80 hover:opacity-100"
                        title="Pindah ke Kamera Sebelumnya"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChannel((prev) => (prev === 4 ? 1 : prev + 1));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 shadow-xl transition backdrop-blur-xs cursor-pointer opacity-80 hover:opacity-100"
                        title="Pindah ke Kamera Berikutnya"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Layer 1: Pemutar Video atau Standby Placeholder */}
                  <div className="absolute inset-0 w-full h-full">
                    {hasUrl ? (
                      <CctvPlayer
                        src={camera.streamUrl}
                        muted={isMuted}
                        autoPlay={true}
                        loop={true}
                        playsInline={true}
                        onVideoRef={(el) => {
                          videoRefs.current[ch] = el;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-radial from-slate-900 to-slate-950">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-2.5 text-slate-400 shadow-inner">
                          <VideoOff className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-300">
                          Kamera Belum Terhubung
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {camera.location || `Slot Kamera ${ch}`}
                        </p>

                        {canManageCctv ? (
                          <div className="flex items-center gap-2 mt-3.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSlotIndex(ch - 1);
                                setShowConfigModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Atur URL Kamera</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-2 italic">
                            Menunggu tautan stream dari Kepala UPT
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Layer 2: TOP HUD OVERLAY (Channel Tag, Nama, Status LIVE/REC) */}
                  <div className="relative z-10 p-3 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-blue-600 text-white shadow-xs">
                        CH {String(ch).padStart(2, '0')}
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-white drop-shadow-md flex items-center gap-1.5">
                          <span>{camera.name || `Kamera ${ch}`}</span>
                        </p>
                        <p className="text-[10px] text-slate-300 drop-shadow-xs font-medium">
                          {camera.location || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasUrl ? (
                        <>
                          {/* LIVE badge */}
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-bold backdrop-blur-xs shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE</span>
                          </div>
                          {/* REC badge */}
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-slate-200 text-[10px] font-mono border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>REC</span>
                          </div>
                        </>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-400 text-[10px] font-bold border border-slate-700">
                          <span>OFFLINE</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layer 3: BOTTOM HUD OVERLAY (Kontrol hover cepat: Mute, Snapshot, Playback, Fullscreen) */}
                  <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-95 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5">
                      {/* Audio Mute/Unmute */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLiveMute(ch);
                        }}
                        disabled={!hasUrl}
                        className={`p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition cursor-pointer disabled:opacity-30 ${
                          !isMuted ? 'text-emerald-400 bg-white/10' : ''
                        }`}
                        title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      </button>

                      {/* Snapshot Screenshot */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          takeLiveSnapshot(ch, camera.name || `CH_${ch}`);
                        }}
                        disabled={!hasUrl}
                        className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition cursor-pointer disabled:opacity-30"
                        title="Ambil Snapshot Gambar"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Tombol Toggle Fokus / Grid 2x2 per kamera */}
                      {gridLayout === '2x2' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChannel(ch);
                            setGridLayout('focus');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition cursor-pointer"
                          title={`Fokus Layar Besar CH ${ch}`}
                        >
                          <Square className="w-3 h-3" />
                          <span className="hidden sm:inline">Fokus</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGridLayout('2x2');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition cursor-pointer"
                          title="Kembali ke tampilan Grid 2x2"
                        >
                          <Grid2X2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Grid 2x2</span>
                        </button>
                      )}

                      {/* Edit Slot URL Button (Hanya Tersedia untuk Kepala UPT) */}
                      {canManageCctv && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSlotIndex(ch - 1);
                            setShowConfigModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition cursor-pointer"
                          title="Edit URL Kamera"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit URL</span>
                        </button>
                      )}

                      {/* Shortcut ke Tab Pemutaran Rekaman */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaybackChannel(ch);
                          setActiveTab('playback');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                        title="Buka Pemutaran Rekaman Kamera Ini"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rekaman</span>
                      </button>

                      {/* Fullscreen Video */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLiveFullscreen(ch);
                        }}
                        disabled={!hasUrl}
                        className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition cursor-pointer disabled:opacity-30"
                        title="Layar Penuh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Switcher Strip di bawah saat mode Fokus aktif */}
          {gridLayout === 'focus' && (
            <div className="flex flex-wrap items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Pilih Kamera Fokus:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[1, 2, 3, 4].map((ch) => {
                    const cam = slots.find((s) => (s.channel || 1) === ch);
                    const isSelected = selectedChannel === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setSelectedChannel(ch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>CH {ch}</span>
                        <span className="opacity-80 font-normal hidden sm:inline">• {cam?.name || `Kamera ${ch}`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGridLayout('2x2')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                title="Kembali ke tampilan matriks 4 kamera"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                <span>Kembali ke Grid 2x2</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN UTAMA: TAB 2 (PEMUTARAN REKAMAN 24 JAM / PLAYBACK)      */}
      {/* ============================================================== */}
      {activeTab === 'playback' && (
        <div className="space-y-4">
          {/* Sub-Header: Pemilihan Kamera & Tanggal Rekaman */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Pilihan Kamera Tab CH 1 .. CH 4 */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
              {[1, 2, 3, 4].map((ch) => {
                const cam = slots.find((s) => (s.channel || 1) === ch);
                return (
                  <button
                    key={ch}
                    onClick={() => setPlaybackChannel(ch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      playbackChannel === ch
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CH {ch} • {cam?.name || `Kamera ${ch}`}
                  </button>
                );
              })}
            </div>

            {/* Pemilihan Tanggal Rekaman */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={playbackDate}
                  onChange={(e) => setPlaybackDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenClipModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Klip MP4</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Video Player Utama + Panel Samping Rekaman per Sesi */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Kolom 1-3: Pemutar Video Rekaman & Timeline Scrubber */}
            <div className="lg:col-span-3 space-y-3">
              <div
                onClick={handleTogglePlay}
                className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer group"
              >
                <video
                  ref={playbackVideoRef}
                  src={getPlaybackVideoUrl(activePlaybackCamera, playbackChannel)}
                  loop={true}
                  playsInline={true}
                  onLoadedMetadata={() => {
                    syncVideoToPlaybackSec(playbackSec);
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Center Play Button Overlay Saat Video Sedang Di-Jeda */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePlay();
                    }}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-900/70 hover:bg-blue-600/90 text-white flex items-center justify-center backdrop-blur-xs transition transform hover:scale-110 shadow-xl cursor-pointer border border-white/20"
                    title="Putar Rekaman"
                  >
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </button>
                )}

                {/* Overlay Header Video Rekaman */}
                <div className="absolute top-0 left-0 right-0 p-3.5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-blue-600 text-white">
                      CH {playbackChannel}
                    </span>
                    <span className="text-xs font-bold text-white drop-shadow">
                      {activePlaybackCamera.name} • {playbackDate}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 border border-white/10 text-emerald-400 text-xs font-mono font-bold">
                    <span>{formatSecondsToHms(playbackSec)} WIB</span>
                  </div>
                </div>

                {/* Kontrol Hover Video (Snapshot & Fullscreen) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      takePlaybackSnapshot();
                    }}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs border border-white/20 transition cursor-pointer"
                    title="Ambil Snapshot Frame"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlaybackFullscreen();
                    }}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs border border-white/20 transition cursor-pointer"
                    title="Layar Penuh"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Komponen Timeline Interaktif Presisi */}
              <CctvTimeline
                selectedDate={playbackDate}
                currentTimeSec={playbackSec}
                playbackSec={playbackSec}
                onTimeChange={handleTimeChange}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={handleChangeSpeed}
                onStepFrame={handleStepFrame}
                onJump={handleJump}
                recordingSegments={recordingSegments}
                onOpenClipExporter={handleOpenClipModal}
                activeArchive={selectedArchive}
                timelineMode={timelineMode}
                onChangeTimelineMode={setTimelineMode}
              />
            </div>

            {/* Kolom 4: Panel Samping Arsip Rekaman Berkas Per Jam */}
            <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col h-full min-h-[460px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-slate-800">Sesi Rekaman 2 Jam</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">12 Berkas</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                {hourlyArchives.map((archive) => {
                  const isCurrent = selectedArchive.id === archive.id;
                  return (
                    <div
                      key={archive.id}
                      onClick={() => handleSelectArchive(archive)}
                      className={`p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className={`font-bold text-xs ${isCurrent ? 'text-primary' : 'text-slate-800'}`}>
                          {archive.timeLabel}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format MP4 • {archive.fileSize}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectArchive(archive);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            isCurrent ? 'bg-primary text-white shadow-2xs' : 'bg-white text-slate-600 hover:text-primary shadow-2xs'
                          }`}
                          title="Putar sesi ini"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-snug">
                Rekaman disimpan otomatis ke Biznet NOS S3 Object Storage setiap interval 2 jam.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ATUR KONFIGURASI KAMERA CCTV (HANYA KEPALA UPT)      */}
      {/* ============================================================== */}
      {showConfigModal && canManageCctv && formSlots.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Pengaturan Kamera CCTV Lapas</h2>
                  <p className="text-[11px] text-slate-500">Konfigurasi nama, titik lokasi, dan tautan stream video</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Tab Selector CH 1 .. CH 4 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Saluran Kamera (Slot 1 - 4)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {formSlots.map((s, idx) => {
                    const hasStream = Boolean(s.streamUrl && s.streamUrl.trim());
                    const isEditing = editingSlotIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingSlotIndex(idx)}
                        className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isEditing
                            ? 'bg-blue-50 border-blue-400 text-primary ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${hasStream ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span>CH {idx + 1}</span>
                        </div>
                        <span className="text-[10px] font-normal text-slate-400 truncate w-full text-center">
                          {hasStream ? 'Terhubung' : 'Kosong'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Detail Kamera Terpilih */}
              {formSlots[editingSlotIndex] && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                  {/* Nama Kamera */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Nama Kamera <span className="text-rose-500">*</span>
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
                      placeholder="Contoh: CCTV 01 - Pintu Portir / Depan"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>

                  {/* Lokasi Kamera */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Titik Lokasi Pengawasan
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
                      placeholder="Contoh: Gerbang Depan Lapas"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>

                  {/* URL Stream Kamera */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">
                        URL Stream Video (HLS / MP4 / Proxy Stream) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFormSlots((prev) => {
                              const u = [...prev];
                              u[editingSlotIndex].streamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
                              return u;
                            });
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          + HLS Mux
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormSlots((prev) => {
                              const u = [...prev];
                              u[editingSlotIndex].streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                              return u;
                            });
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          + MP4
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormSlots((prev) => {
                              const u = [...prev];
                              u[editingSlotIndex].streamUrl = '';
                              return u;
                            });
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

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
                      placeholder="https://.../stream.m3u8 atau http://.../video.mp4"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      💡 Format yang didukung langsung di browser: <strong>HLS (.m3u8)</strong>, <strong>HTTP MP4/WebM</strong>, atau <strong>WebRTC</strong>. Jika kamera menggunakan protokol <code>rtsp://</code>, gunakan konverter RTSP-to-HLS proxy (seperti MediaMTX / go2rtc).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveAllSlots}
                disabled={saveLoading}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? 'Menyimpan...' : 'Simpan Semua Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: UNDUH KLIP REKAMAN CCTV (MP4 RANGE MENIT)               */}
      {/* ============================================================== */}
      {showClipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Unduh Klip Rekaman CCTV</h3>
                  <p className="text-[11px] text-slate-500">CH {playbackChannel} • {activePlaybackCamera.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClipModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                Tentukan rentang menit rekaman yang ingin Anda ekspor dalam berkas MP4.
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tanggal Rekaman</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold">
                  {playbackDate}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Waktu Mulai (WIB)</label>
                  <input
                    type="time"
                    value={clipStartTime}
                    onChange={(e) => setClipStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Waktu Selesai (WIB)</label>
                  <input
                    type="time"
                    value={clipEndTime}
                    onChange={(e) => setClipEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-slate-600">
                <span>Estimasi Durasi Klip:</span>
                <span className="font-bold text-slate-900 font-mono">{calculatedClipDurationMin} Menit</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClipModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownloadClip}
                disabled={clipDownloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{clipDownloading ? 'Mengunduh...' : 'Unduh Klip MP4'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
