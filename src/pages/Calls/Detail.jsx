import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Download, Volume2, Maximize, Clock, FileText, User, Users, SkipBack, SkipForward, Loader2, Info, Mic, Activity } from 'lucide-react';
import { mockCalls, mockBranches } from '../../services/mockData';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const call = mockCalls.find(c => c.id === id);
  const branch = call ? mockBranches.find(b => b.id === call.branchId) : null;
  
  // State for simulated video player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Tab state (read from URL or default to 'video')
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'transcript' ? 'transcript' : 'video';
  const [activeTab, setActiveTab] = useState(initialTab);

  const durationSeconds = call?.durationSeconds || 0;

  // Simulate video playback
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

  if (!call) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700">Data panggilan tidak ditemukan</h2>
        <button onClick={() => navigate('/calls')} className="mt-4 text-primary hover:underline">Kembali ke daftar</button>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = call.durationSeconds > 0 ? (currentTime / call.durationSeconds) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header Action Bar (Single Title handled by Topbar) */}
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
              {new Date(call.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
        </div>
        
        {call.hasRecording && (
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all text-sm">
              <Download className="w-4 h-4" /> Download Video
            </button>
            <button 
              className="px-4 py-2 bg-primary text-white hover:bg-primary-light rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
              disabled={call.transcriptStatus !== 'Completed'}
            >
              <FileText className="w-4 h-4" /> Download Transkrip
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
            <p className="text-xs text-slate-500">{call.inmateId} &bull; {branch?.name}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Keluarga (Penerima)</p>
            <p className="text-slate-800 font-bold">{call.familyName}</p>
            <p className="text-xs text-slate-500">{call.familyPhone}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Durasi & Biaya</p>
            <p className="text-slate-800 font-bold">{formatTime(call.durationSeconds)} Menit</p>
            <p className="text-xs text-slate-500">Rp {new Intl.NumberFormat('id-ID').format(call.cost)}</p>
          </div>
        </div>
      </div>

      {!call.hasRecording ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tidak Ada Rekaman</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Panggilan ini tidak memiliki rekaman video, kemungkinan karena status panggilan adalah <strong>{call.status}</strong> atau durasi terlalu singkat.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4">
            <button 
              onClick={() => setActiveTab('video')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'video' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Rekaman {call.callType === 'Video' ? 'Video' : 'Suara'}
            </button>
            <button 
              onClick={() => setActiveTab('transcript')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'transcript' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Transkrip Percakapan
              {call.transcriptStatus === 'Processing' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'video' && (
              <div className="space-y-4">
                {/* Simulated Media Player */}
                <div className="bg-black rounded-lg overflow-hidden relative aspect-video shadow-inner flex items-center justify-center">
                  
                  {call.callType === 'Video' ? (
                    /* Mock Video Feeds */
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center justify-center relative">
                        <User className="w-20 h-20 text-slate-700 mb-4" />
                        <span className="absolute bottom-4 left-4 bg-black/60 text-white/90 px-2 py-1 rounded text-xs">WBP: {call.inmateName}</span>
                        {isPlaying && (
                          <div className="absolute top-4 right-4 flex gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-white/80 text-[10px]">REC</span>
                          </div>
                        )}
                      </div>
                      <div className="w-1/2 h-full bg-slate-800 flex flex-col items-center justify-center relative">
                        <Users className="w-20 h-20 text-slate-600 mb-4" />
                        <span className="absolute bottom-4 right-4 bg-black/60 text-white/90 px-2 py-1 rounded text-xs">Keluarga: {call.familyName}</span>
                      </div>
                    </div>
                  ) : (
                    /* Mock Audio Feeds */
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center relative">
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl z-10 relative mb-8">
                        <Mic className={`w-10 h-10 ${isPlaying ? 'text-green-400' : 'text-slate-500'}`} />
                        {isPlaying && (
                          <div className="absolute inset-0 rounded-full border-4 border-green-400/30 animate-ping"></div>
                        )}
                      </div>
                      <div className="flex gap-1 items-end h-16 w-full max-w-sm px-4 justify-center">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 rounded-t-sm transition-all duration-150 ${isPlaying ? 'bg-primary' : 'bg-slate-700'}`}
                            style={{ 
                              height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                              opacity: isPlaying ? (i % 2 === 0 ? 0.8 : 0.6) : 0.3
                            }}
                          ></div>
                        ))}
                      </div>
                      <span className="absolute bottom-4 bg-black/60 text-white/90 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-green-400" />
                        Panggilan Suara: {call.inmateName} & {call.familyName}
                      </span>
                      {isPlaying && (
                        <div className="absolute top-4 right-4 flex gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          <span className="text-white/80 text-[10px]">REC</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!isPlaying && currentTime === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="w-16 h-16 bg-primary/90 text-white rounded-full flex items-center justify-center hover:bg-primary transition-transform hover:scale-110 shadow-lg"
                      >
                        <Play className="w-8 h-8 ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Player Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col gap-2 z-30">
                    {/* Progress Bar */}
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
                    
                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-primary transition-colors">
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                          className="hover:text-primary transition-colors"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setCurrentTime(Math.min(call.durationSeconds, currentTime + 10))}
                          className="hover:text-primary transition-colors"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-mono ml-2">
                          {formatTime(currentTime)} / {formatTime(call.durationSeconds)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button className="hover:text-primary transition-colors">
                          <Volume2 className="w-4 h-4" />
                        </button>
                        {call.callType === 'Video' && (
                          <button className="hover:text-primary transition-colors">
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
              <div className="min-h-[400px] border border-slate-200 rounded-lg p-6 bg-slate-50">
                {call.transcriptStatus === 'Processing' ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Transkrip Sedang Diproses</h3>
                    <p className="text-sm max-w-md text-center mt-2">Sistem AI kami sedang menganalisis dan membuat transkrip teks dari rekaman video ini. Harap tunggu beberapa saat.</p>
                    
                    <div className="w-full max-w-lg mt-8 space-y-4">
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="text-xs font-mono text-slate-400 mt-1 w-12 shrink-0">00:00</div>
                      <div className="bg-blue-100/50 rounded-lg p-3 text-sm text-slate-700 w-full">
                        <span className="font-bold text-blue-700 block mb-1">NAPI-001 (Ahmad bin Jono):</span>
                        Halo mah, asalamualaikum. Gimana kabarnya anak-anak?
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-xs font-mono text-slate-400 mt-1 w-12 shrink-0">00:08</div>
                      <div className="bg-purple-100/50 rounded-lg p-3 text-sm text-slate-700 w-full">
                        <span className="font-bold text-purple-700 block mb-1">Keluarga (Suryani):</span>
                        Waalaikumsalam pak. Alhamdulillah sehat semua. Tadi si adek nanyain bapak kapan pulang.
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-xs font-mono text-slate-400 mt-1 w-12 shrink-0">00:15</div>
                      <div className="bg-blue-100/50 rounded-lg p-3 text-sm text-slate-700 w-full">
                        <span className="font-bold text-blue-700 block mb-1">NAPI-001 (Ahmad bin Jono):</span>
                        Bilangin aja bapak lagi kerja, insyaallah sebentar lagi kelar urusannya. Mama sehat kan? Uang belanjanya masih cukup?
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-xs font-mono text-slate-400 mt-1 w-12 shrink-0">00:28</div>
                      <div className="bg-purple-100/50 rounded-lg p-3 text-sm text-slate-700 w-full">
                        <span className="font-bold text-purple-700 block mb-1">Keluarga (Suryani):</span>
                        Sehat pak. Masih cukup kok, kemarin dibantu sama kakaknya bapak juga sedikit.
                      </div>
                    </div>
                    
                    {/* Dummy padding to simulate long transcript */}
                    <div className="text-center text-xs text-slate-400 py-4 border-t border-dashed border-slate-300">
                      (Sisa transkrip disembunyikan untuk keperluan demo)
                    </div>
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
        <div className="p-0">
          {call.accessLogs && call.accessLogs.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Nama Admin</th>
                  <th className="px-4 py-2 font-medium">Waktu Akses</th>
                  <th className="px-4 py-2 font-medium text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {call.accessLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-slate-700">{log.name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(log.time).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Memutar Video</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              Belum ada riwayat akses untuk rekaman panggilan ini.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Detail;
