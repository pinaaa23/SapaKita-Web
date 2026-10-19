import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Maximize, 
  Clock, 
  FileText, 
  User, 
  Users, 
  SkipBack, 
  SkipForward, 
  Info, 
  Mic, 
  Activity,
  AlertCircle,
  Phone
} from 'lucide-react';
import { getCallById } from '../../services/callService';
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';
import { logout } from '../../services/api';
import { downloadAudioFile, downloadTranscriptPDF } from '../../utils/exportUtils';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [call, setCall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  
  // State for simulated video player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Tab state (read from URL or default to 'video')
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'transcript' ? 'transcript' : 'video';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchCallDetail = async () => {
      setIsLoading(true);
      try {
        const data = await getCallById(id);
        setCall(data);
      } catch (err) {
        console.log('[CallDetail] Gagal memuat detail panggilan:', err);
        if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setCall(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCallDetail();
  }, [id, navigate]);

  const durationSeconds = call?.durationSeconds || 0;

  // Media playback simulation if recording exists
  useEffect(() => {
    let interval;
    if (call && isPlaying && currentTime < durationSeconds) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return durationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, durationSeconds, call]);

  const handleDownloadAudio = () => {
    const name = (call?.inmateName || 'Panggilan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Rekaman_${name}_${call?.id || Date.now()}.mp3`;
    downloadAudioFile(call?.recordingUrl || 'https://cdn.freesound.org/previews/612/612042_5674468-lq.mp3', filename);
  };

  const handleDownloadTranscript = () => {
    if (!call?.transcript) {
      setToastMsg('Transkrip belum tersedia untuk diunduh.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    const name = (call?.inmateName || 'Panggilan').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Transkrip_${name}_${call?.id || Date.now()}.pdf`;
    downloadTranscriptPDF({
      transcriptText: call.transcript,
      callInfo: call,
      inmateInfo: { name: call.inmateName, wbpRegNumber: call.inmateId },
      uptName: call.branchName || 'Lapas Pusat',
      printedBy: 'Super Administrator',
      filename
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="space-y-5 max-w-lg mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Data tidak tersedia</h2>
          <p className="text-xs text-slate-500 mt-1">Informasi detail rekaman panggilan dengan ID {id} tidak ditemukan.</p>
          <Link 
            to="/calls" 
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Riwayat Panggilan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-amber-600 hover:text-amber-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Link 
            to="/calls"
            className="p-2 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-2xs"
            title="Kembali ke Riwayat Panggilan"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Panggilan #{call.id}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
              call.status === 'Answered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
              call.status === 'No Answer' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {call.status}
            </span>
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> 
              {call.date ? new Date(call.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'} WIB
            </span>
          </div>
        </div>
        
        {call.hasRecording && (
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={handleDownloadAudio}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
              title="Unduh Rekaman Suara"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> 
              <span>Unduh Rekaman</span>
            </button>
            <button 
              type="button"
              onClick={handleDownloadTranscript}
              className="px-3.5 py-2 bg-primary text-white hover:bg-primary-dark rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
              title="Unduh Transkrip Percakapan Resmi (PDF)"
            >
              <FileText className="w-3.5 h-3.5" /> 
              <span>Unduh Transkrip</span>
            </button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">WBP (Pemanggil)</p>
            <p className="text-slate-800 font-bold">{call.inmateName}</p>
            <p className="text-xs text-slate-500">{call.inmateId} &bull; {call.branchName || 'Cabang Lapas'}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Nomor Tujuan</p>
            {/* <p className="text-slate-800 font-bold">{call.familyName || '-'}</p>
            <p className="text-xs text-slate-500">{call.familyPhone || '-'}</p> */}
            <p className="text-slate-800 font-bold">{call.familyPhone || '-'}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Durasi & Biaya</p>
            <p className="text-slate-800 font-bold">{formatTime(call.durationSeconds)} Menit</p>
            <p className="text-xs text-slate-500">Rp {new Intl.NumberFormat('id-ID').format(call.cost || 0)}</p>
          </div>
        </div>
      </div>

      {!call.hasRecording ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tidak Ada Rekaman</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Panggilan ini tidak memiliki rekaman audio/video dari server.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4">
            <button 
              onClick={() => setActiveTab('video')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'video' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Rekaman {call.callType === 'Video' ? 'Video' : 'Suara'}
            </button>
            <button 
              onClick={() => setActiveTab('transcript')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'transcript' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Transkrip Percakapan
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden relative aspect-video shadow-inner flex items-center justify-center">
                  {call.callType === 'Video' ? (
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center justify-center relative">
                        <User className="w-20 h-20 text-slate-700 mb-4" />
                        <span className="absolute bottom-4 left-4 bg-black/60 text-white/90 px-2 py-1 rounded text-xs">WBP: {call.inmateName}</span>
                      </div>
                      <div className="w-1/2 h-full bg-slate-800 flex flex-col items-center justify-center relative">
                        <Users className="w-20 h-20 text-slate-600 mb-4" />
                        {/* <span className="absolute bottom-4 right-4 bg-black/60 text-white/90 px-2 py-1 rounded text-xs">Keluarga: {call.familyName}</span> */}
                        <span className="absolute bottom-4 right-4 bg-black/60 text-white/90 px-2 py-1 rounded text-xs">Tujuan: {call.familyPhone || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center relative">
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl z-10 relative mb-8">
                        <Mic className={`w-10 h-10 ${isPlaying ? 'text-green-400' : 'text-slate-500'}`} />
                      </div>
                      {/* <span className="absolute bottom-4 bg-black/60 text-white/90 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-green-400" />
                        Panggilan Suara: {call.inmateName} & {call.familyName}
                      </span> */}
                      <span className="absolute bottom-4 bg-black/60 text-white/90 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-green-400" />
                        Tujuan: {call.familyPhone || '-'}
                      </span>
                    </div>
                  )}
                  
                  {!isPlaying && currentTime === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="w-16 h-16 bg-primary/90 text-white rounded-full flex items-center justify-center hover:bg-primary transition-transform hover:scale-110 shadow-lg cursor-pointer"
                      >
                        <Play className="w-8 h-8 ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Player Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col gap-2 z-30">
                    <div 
                      className="w-full h-1.5 bg-slate-600/50 rounded-full cursor-pointer overflow-hidden"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        setCurrentTime(Math.floor(pos * call.durationSeconds));
                      }}
                    >
                      <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-primary transition-colors cursor-pointer">
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                          className="hover:text-primary transition-colors cursor-pointer"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setCurrentTime(Math.min(call.durationSeconds, currentTime + 10))}
                          className="hover:text-primary transition-colors cursor-pointer"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-mono ml-2">
                          {formatTime(currentTime)} / {formatTime(call.durationSeconds)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button className="hover:text-primary transition-colors cursor-pointer">
                          <Volume2 className="w-4 h-4" />
                        </button>
                        {call.callType === 'Video' && (
                          <button className="hover:text-primary transition-colors cursor-pointer">
                            <Maximize className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="min-h-[250px] border border-slate-200 rounded-lg p-6 bg-slate-50 flex items-center justify-center text-center">
                {call.transcript ? (
                  <div className="text-left w-full text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {call.transcript}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs">
                    Belum ada transkrip teks untuk rekaman panggilan ini.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Log Akses Audit</h3>
          <p className="text-xs text-slate-500">Daftar admin/petugas yang mengakses rekaman ini.</p>
        </div>
        <div className="p-6 text-center text-xs text-slate-400">
          Belum ada riwayat akses untuk rekaman panggilan ini.
        </div>
      </div>

    </div>
  );
};

export default Detail;
