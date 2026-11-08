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
  CheckCircle2,
  Plus,
  Edit3,
  Download,
  RefreshCw,
  FastForward,
  Rewind,
  SlidersHorizontal,
  X,
  FileVideo,
  FolderArchive,
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

  // Mode Tampilan: 'live' | 'playback'
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
  const [playbackSec, setPlaybackSec] = useState(36000); // 10:00:00 WIB
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackMuted, setPlaybackMuted] = useState(true);
  const playbackVideoRef = useRef(null);

  // Modal Pengaturan Slot (Kepala UPT)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [formSlots, setFormSlots] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Modal Unduh Klip Rekaman
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

  const formatSecondsToHms = (sec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(sec)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  };

  const formatSecondsToHm = (sec) => {
    const s = Math.max(0, Math.min(86399, Math.floor(sec)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Jam lokal berjalan
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Muat daftar kamera CCTV
  const loadCctvSlots = async () => {
    setLoading(true);
    try {
      const data = await cctvService.getCctvList(user?.branchId);
      setSlots(data);
      setFormSlots(
        data.map((s, idx) => ({
          channel: s.channel || idx + 1,
          name: s.name || `Kamera ${idx + 1}`,
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
  const getPlaybackVideoUrl = useCallback((camera, channel) => {
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

  // Sinkronisasi pemutar video saat waktu digeser
  const syncVideoToPlaybackSec = (targetSec) => {
    if (playbackVideoRef.current) {
      const video = playbackVideoRef.current;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const targetVideoTime = targetSec % Math.floor(video.duration);
        video.currentTime = targetVideoTime;
      }
    }
  };

  // Timer playback saat tombol play ditekan
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

  // Segmen ketersediaan rekaman
  const recordingSegments = useMemo(() => {
    return [{ startSec: 0, endSec: 86400 }];
  }, []);

  // Daftar berkas rekaman per sesi jam
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
    setPlaybackSec((prev) => {
      const next = Math.max(0, Math.min(86399, prev + deltaSec));
      syncVideoToPlaybackSec(next);
      return next;
    });
  };

  const handleJump = (deltaSec) => {
    setPlaybackSec((prev) => {
      const next = Math.max(0, Math.min(86399, prev + deltaSec));
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
  };

  const handleSelectArchive = (archive) => {
    setPlaybackSec(archive.startSec);
    syncVideoToPlaybackSec(archive.startSec);
    setIsPlaying(true);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.play().catch(() => {});
    }
    showToast(`Memutar rekaman ${archive.timeLabel}`);
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

  const handleSaveAllSlots = async () => {
    setSaveLoading(true);
    setSaveSuccessMsg('');
    try {
      await cctvService.saveBulkCctv(formSlots);
      setSaveSuccessMsg('Pengaturan kamera berhasil disimpan.');
      await loadCctvSlots();
      setTimeout(() => {
        setShowConfigModal(false);
        setSaveSuccessMsg('');
      }, 1000);
    } catch (e) {
      alert('Gagal menyimpan: ' + (e.message || 'Terjadi kesalahan'));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-800">Monitoring CCTV</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {isKepalaUpt ? 'Kepala UPT' : 'Supervisor'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau tayangan 4 titik kamera lapas dan pemutaran rekaman pengawasan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Jam Realtime */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 font-medium shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
          </div>

          {/* Tombol Atur Kamera (Kepala UPT Only) */}
          {isKepalaUpt && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Atur Kamera</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tab Navigasi: Live Monitor & Pemutaran Rekaman */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'live'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span>Live Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('playback')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'playback'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Pemutaran Rekaman</span>
          </button>
        </div>

        {/* Pilihan Grid Tampilan (Tab Live) */}
        {activeTab === 'live' && (
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setGridLayout('2x2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                gridLayout === '2x2'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Grid 2x2
            </button>
            <button
              onClick={() => setGridLayout('focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                gridLayout === 'focus'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Fokus CH #{selectedChannel}
            </button>
          </div>
        )}
      </div>

      {/* 3. TAB 1: LIVE MONITOR (GRID 4 KAMERA) */}
      {activeTab === 'live' && (
        <div
          className={`grid gap-4 ${
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
                className={`bg-white border rounded-2xl overflow-hidden shadow-2xs transition flex flex-col ${
                  isSelected ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200/90'
                }`}
              >
                {/* Header Card */}
                <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      CH {ch}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 leading-tight">
                        {camera.name || `Kamera ${ch}`}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {camera.location || 'Lokasi belum disetel'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasUrl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                        Nonaktif
                      </span>
                    )}

                    {isKepalaUpt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSlotIndex(ch - 1);
                          setShowConfigModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Ubah URL Kamera"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Layar Video */}
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

                      {/* OSD Mini */}
                      <div className="absolute top-2.5 left-2.5 pointer-events-none">
                        <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          LIVE
                        </span>
                      </div>

                      {/* Tombol Aksi Cepat In-Frame */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLiveMute(ch);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition"
                          title={isMuted ? 'Nyalakan Audio' : 'Bisukan'}
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-300" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            takeLiveSnapshot(ch, camera.name);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition"
                          title="Ambil Foto Snapshot"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLiveFullscreen(ch);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition"
                          title="Layar Penuh"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                      <VideoOff className="w-6 h-6 mb-2 text-slate-600" />
                      <p className="text-xs font-semibold text-slate-400">
                        Kamera Belum Dikonfigurasi
                      </p>
                      {isKepalaUpt && (
                        <button
                          onClick={() => {
                            setEditingSlotIndex(ch - 1);
                            setShowConfigModal(true);
                          }}
                          className="mt-2.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                        >
                          Atur URL Kamera #{ch}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Card */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px]">
                    {camera.location || 'Pos Kamera'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaybackChannel(ch);
                      setActiveTab('playback');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <span>Putar Rekaman</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TAB 2: PEMUTARAN REKAMAN (PLAYBACK) */}
      {activeTab === 'playback' && (
        <div className="space-y-4">
          {/* Bar Filter Sederhana */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Pilihan Kamera (Tab Ringkas) */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Kamera:</span>
              {slots.map((s, idx) => {
                const ch = s.channel || idx + 1;
                const isCurrent = playbackChannel === ch;
                return (
                  <button
                    key={s.id || ch}
                    onClick={() => {
                      setPlaybackChannel(ch);
                      showToast(`Memuat rekaman CH ${ch}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap border ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    CH {ch}: {s.name || `Kamera ${ch}`}
                  </button>
                );
              })}
            </div>

            {/* Pilihan Tanggal & Tombol Unduh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={playbackDate}
                  onChange={(e) => setPlaybackDate(e.target.value)}
                  max={todayStr}
                  className="bg-transparent text-slate-800 font-semibold outline-none text-xs"
                />
              </div>

              <button
                onClick={handleOpenClipModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Video</span>
              </button>
            </div>
          </div>

          {/* Area Video Player & Arsip */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Player Viewport (3 Kolom) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                {/* Header Viewport */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      CH {playbackChannel}: {activePlaybackCamera.name}
                    </span>
                    <span className="text-slate-400">({activePlaybackCamera.location || 'Lokasi'})</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-mono font-medium">{playbackDate}</span>
                    <button
                      onClick={takePlaybackSnapshot}
                      className="p-1 rounded hover:bg-slate-200 transition"
                      title="Ambil Foto Snapshot"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={togglePlaybackFullscreen}
                      className="p-1 rounded hover:bg-slate-200 transition"
                      title="Layar Penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Layar Video Playback */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={playbackVideoRef}
                    key={`playback-ch-${playbackChannel}-${playbackDate}`}
                    src={getPlaybackVideoUrl(activePlaybackCamera, playbackChannel)}
                    className="w-full h-full object-contain"
                    playsInline
                    muted={playbackMuted}
                    loop
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Tombol Play Besar jika sedang jeda */}
                  {!isPlaying && (
                    <button
                      onClick={handleTogglePlay}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition transform hover:scale-105"
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </button>
                  )}

                  {/* Audio Mute */}
                  <button
                    onClick={() => {
                      const newMuted = !playbackMuted;
                      setPlaybackMuted(newMuted);
                      if (playbackVideoRef.current) {
                        playbackVideoRef.current.muted = newMuted;
                      }
                    }}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition"
                    title={playbackMuted ? 'Nyalakan Audio' : 'Bisukan'}
                  >
                    {playbackMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Timeline 24 Jam Bersih */}
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

            {/* Panel Samping: Daftar Rekaman Per Jam (1 Kolom) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col h-full">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-2.5">
                <FolderArchive className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">Daftar Rekaman Sesi</h3>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                Pilih jam di bawah untuk langsung memutar:
              </p>

              <div className="space-y-1.5 overflow-y-auto max-h-[520px] pr-1 flex-1">
                {hourlyArchives.map((arc) => {
                  const isCurrent = playbackSec >= arc.startSec && playbackSec < arc.endSec;
                  return (
                    <div
                      key={arc.id}
                      onClick={() => handleSelectArchive(arc)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition text-xs flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50/90 border-blue-300 text-blue-900 font-semibold'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-800">
                          {arc.timeLabel}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {arc.title}
                        </div>
                      </div>

                      <span className="text-[11px] text-blue-600 font-semibold">
                        Putar
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL UNDUH VIDEO (DARI MENIT BERAPA KE MENIT BERAPA) */}
      {showClipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Unduh Rekaman Video
              </h2>
              <button
                onClick={() => setShowClipModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <span className="font-semibold text-slate-700">CH {playbackChannel}: {activePlaybackCamera.name}</span>
                <span className="text-slate-500 font-mono">{playbackDate}</span>
              </div>

              {/* Input Jam Mulai dan Jam Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    value={clipStartTime}
                    onChange={(e) => setClipStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Waktu Selesai
                  </label>
                  <input
                    type="time"
                    value={clipEndTime}
                    onChange={(e) => setClipEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Durasi */}
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <span className="flex items-center gap-1.5">
                  <FileVideo className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Durasi Terpilih:</span>
                </span>
                <span className="font-bold">{calculatedClipDurationMin} Menit</span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClipModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDownloadClip}
                disabled={clipDownloading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{clipDownloading ? 'Mengunduh...' : 'Download Video (MP4)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PENGATURAN KAMERA (Khusus Kepala UPT) */}
      {showConfigModal && isKepalaUpt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Pengaturan 4 Slot Kamera CCTV
                </h2>
                <p className="text-xs text-slate-500">
                  Masukkan nama lokasi dan URL stream video kamera.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {saveSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Tab Slot 1..4 */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((ch, idx) => {
                  const currentForm = formSlots[idx] || {};
                  const isCurrent = editingSlotIndex === idx;
                  const hasUrl = Boolean(currentForm.streamUrl && currentForm.streamUrl.trim());

                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setEditingSlotIndex(idx)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-500 text-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>SLOT {ch}</span>
                        <span className={`w-2 h-2 rounded-full ${hasUrl ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {currentForm.name || `Kamera ${ch}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Form Input Slot Terpilih */}
              {formSlots[editingSlotIndex] && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
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
                        placeholder="Contoh: CCTV 01 - Portir Depan"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Lokasi Kamera
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
                        placeholder="Contoh: Gerbang Pintu Utama"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      URL Stream Kamera (RTSP Proxy / HLS / MP4) <span className="text-red-500">*</span>
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
                      placeholder="https://.../stream.m3u8 atau http://..."
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAllSlots}
                disabled={saveLoading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {saveLoading ? 'Menyimpan...' : 'Simpan Semua Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
