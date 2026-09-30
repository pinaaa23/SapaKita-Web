import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneCall, 
  PhoneMissed,
  PhoneForwarded,
  Users,
  Search,
  Filter,
  Play,
  Pause,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  SearchX,
  Volume2,
  Video,
  Mic,
  X,
  Sparkles,
  Check,
  Info
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { getBranchSummary } from '../../services/branchDashboardService';
import { getInmates } from '../../services/inmateService';
import { getCallHistory } from '../../services/callService';
import { logout } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'video'
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Loading states
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isCallsLoading, setIsCallsLoading] = useState(true);
  
  // Data states
  const [summaryStats, setSummaryStats] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    missedCalls: 0,
    totalInmates: null,
    callsGrowth: null,
    answeredGrowth: null,
    missedGrowth: null,
    inmatesGrowth: null,
  });
  const [callsData, setCallsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });
  
  // Audio playback & transcript state
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptCall, setTranscriptCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Load branch summary stats & total inmates count
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setIsStatsLoading(true);
      try {
        const [summaryRes, inmatesRes] = await Promise.allSettled([
          getBranchSummary(),
          getInmates({ page: 1, limit: 1 })
        ]);

        if (isMounted) {
          const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
          const inmatesData = inmatesRes.status === 'fulfilled' ? inmatesRes.value : null;

          // Ambil angka Total WBP dari pagination/meta getInmates atau getBranchSummary
          let totalInmates = null;
          if (typeof inmatesData?.total === 'number') {
            totalInmates = inmatesData.total;
          } else if (typeof inmatesData?.pagination?.total === 'number') {
            totalInmates = inmatesData.pagination.total;
          } else if (typeof inmatesData?.meta?.total === 'number') {
            totalInmates = inmatesData.meta.total;
          } else if (typeof inmatesData?.totalItems === 'number') {
            totalInmates = inmatesData.totalItems;
          } else if (typeof summary?.totalInmates === 'number' && summary.totalInmates > 0) {
            totalInmates = summary.totalInmates;
          }

          setSummaryStats({
            totalCalls: summary?.totalCalls || 0,
            answeredCalls: summary?.answeredCalls || 0,
            missedCalls: summary?.missedCalls || 0,
            totalInmates,
            callsGrowth: summary?.callsGrowth ?? null,
            answeredGrowth: summary?.answeredGrowth ?? null,
            missedGrowth: summary?.missedGrowth ?? null,
            inmatesGrowth: summary?.inmatesGrowth ?? null,
          });
        }
      } catch (err) {
        if (err?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        console.log('[BranchDashboard] Gagal memuat ringkasan:', err);
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [navigate]);

  // Load calls list
  const loadCalls = useCallback(async () => {
    setIsCallsLoading(true);
    try {
      const res = await getCallHistory({
        search: debouncedSearch,
        status: statusFilter,
        callType: activeTab,
        page,
        limit,
      });
      setCallsData(res);
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      console.log('[BranchDashboard] Gagal memuat riwayat panggilan:', err);
      setCallsData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsCallsLoading(false);
    }
  }, [debouncedSearch, statusFilter, activeTab, page, limit, navigate]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);
  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

  const formatSeconds = (seconds) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTrendProps = (growth) => {
    if (typeof growth !== 'number' || isNaN(growth)) {
      return { trend: null, trendValue: null };
    }
    return {
      trend: growth >= 0 ? 'up' : 'down',
      trendValue: Math.abs(growth).toString(),
    };
  };

  const handleSelectRecording = (call) => {
    if (!call.hasRecording) {
      showToast('Fitur rekaman audio belum tersedia untuk panggilan ini.');
      return;
    }
    setSelectedRecording(call);
    setIsPlaying(true);
  };

  const handleOpenTranscript = (call) => {
    if (!call.hasRecording && !call.transcript) {
      showToast('Fitur transkrip belum tersedia untuk panggilan ini.');
      return;
    }
    setTranscriptCall(call);
    setShowTranscriptModal(true);
  };

  const handleCloseTranscriptModal = () => {
    setShowTranscriptModal(false);
    setTranscriptCall(null);
  };

  const togglePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownloadAudio = () => {
    if (!selectedRecording) return;
    showToast('Fitur unduh berkas audio asli belum didukung server backend.');
  };

  const handleDownloadTranscript = (targetCall) => {
    if (!targetCall) return;
    showToast('Fitur ekspor transkrip belum didukung server backend.');
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Grid - 4 Uniform StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {isStatsLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100/80 animate-pulse h-32 flex flex-col justify-between"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-6 w-32 bg-slate-200 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard 
              title="Total Panggilan" 
              value={formatNumber(summaryStats.totalCalls)} 
              icon={PhoneCall} 
              color="blue"
              {...getTrendProps(summaryStats.callsGrowth)}
            />
            <StatCard 
              title="Panggilan Terjawab" 
              value={formatNumber(summaryStats.answeredCalls)} 
              icon={PhoneForwarded} 
              color="teal"
              {...getTrendProps(summaryStats.answeredGrowth)}
            />
            <StatCard 
              title="Tidak Terjawab" 
              value={formatNumber(summaryStats.missedCalls)} 
              icon={PhoneMissed} 
              color="pink"
              {...getTrendProps(summaryStats.missedGrowth)}
            />
            <StatCard 
              title="Total Narapidana" 
              value={summaryStats.totalInmates !== null && summaryStats.totalInmates !== undefined ? formatNumber(summaryStats.totalInmates) : '-'} 
              icon={Users} 
              color="purple"
              {...getTrendProps(summaryStats.inmatesGrowth)}
            />
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side - Main Table Card */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden transition-all">
            
            {/* Card Header with Title, Search & Filters */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rekaman Panggilan</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Log aktivitas panggilan suara dan video warga binaan (WBP)
                  </p>
                </div>
                
                {/* Search & Status Filter */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Cari NIP / nama WBP..." 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/60"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select 
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="All">Semua Status</option>
                      <option value="Answered">Terjawab</option>
                      <option value="Missed">Tidak Terjawab</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service Tabs: Voice Call vs Video Call */}
              <div className="flex items-center justify-between border-b border-slate-100 pt-1">
                <div className="flex items-center gap-6">
                  {/* Tab 1: Voice Call */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('voice');
                      setSelectedRecording(null);
                      setPage(1);
                    }}
                    className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeTab === 'voice' 
                        ? 'text-primary' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 ${activeTab === 'voice' ? 'text-primary' : 'text-slate-400'}`} />
                    <span>Voice Call</span>
                    {activeTab === 'voice' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
                    )}
                  </button>

                  {/* Tab 2: Video Call */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('video');
                      setSelectedRecording(null);
                      setPage(1);
                    }}
                    className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeTab === 'video' 
                        ? 'text-primary' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Video className={`w-4 h-4 ${activeTab === 'video' ? 'text-primary' : 'text-slate-400'}`} />
                    <span>Video Call</span>
                    {activeTab === 'video' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
                    )}
                  </button>
                </div>

                {/* Audio-only badge reminder when Video Call tab is open */}
                {activeTab === 'video' && (
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/90 border border-amber-200/60 px-2.5 py-1 rounded-full mb-2 animate-in fade-in duration-200 font-medium">
                    <Mic className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Hanya audio yang direkam</span>
                  </div>
                )}
              </div>

              {/* Informative notice specifically on Video Call */}
              {activeTab === 'video' && (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in duration-200">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Pemberitahuan Sistem:</strong> Pada layanan Video Call, sistem <strong>hanya merekam berkas audio</strong> percakapan untuk kepatuhan privasi dan enkripsi data Lapas.
                  </p>
                </div>
              )}
            </div>

            {/* Calls Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="text-left py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tanggal / Waktu</th>
                    <th className="text-left py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dari &amp; Tujuan</th>
                    <th className="text-left py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Durasi</th>
                    <th className="text-center py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="text-center py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Transkrip</th>
                    <th className="text-center py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90 text-xs">
                  {isCallsLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-36 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                        <td className="py-4 px-5 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                        <td className="py-4 px-5 text-center"><div className="h-6 bg-slate-200 rounded-lg w-16 mx-auto" /></td>
                        <td className="py-4 px-5 text-center"><div className="h-7 bg-slate-200 rounded-lg w-8 mx-auto" /></td>
                      </tr>
                    ))
                  ) : callsData.items.length > 0 ? (
                    callsData.items.map((call) => {
                      const isSelected = selectedRecording?.id === call.id;
                      return (
                        <tr 
                          key={call.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/70 border-l-4 border-l-primary' 
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{new Date(call.date).toLocaleDateString('id-ID')}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} WIB</div>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-800">{call.inmateName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                              <span>→</span>
                              {call.familyName}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</div>
                            <div className="text-[11px] font-bold text-amber-600 mt-0.5">{formatCurrency(call.cost)}</div>
                          </td>
                          <td className="py-3.5 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                call.status === 'Answered' 
                                  ? 'bg-emerald-100/70 text-emerald-700 border border-emerald-200/50' 
                                  : 'bg-rose-100/70 text-rose-700 border border-rose-200/50'
                              }`}>
                                {call.status === 'Answered' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {call.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-center whitespace-nowrap">
                            {call.hasRecording ? (
                              <button 
                                type="button"
                                onClick={() => handleOpenTranscript(call)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 text-slate-700 hover:bg-blue-50 hover:text-primary rounded-xl text-xs font-semibold transition-all border border-slate-200/60 cursor-pointer shadow-2xs"
                                title="Lihat Transkrip Percakapan Audio"
                              >
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span>Transkrip</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <button 
                                type="button" 
                                onClick={() => handleSelectRecording(call)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-primary text-white shadow-md shadow-blue-500/20 scale-105' 
                                    : 'bg-blue-50 text-primary hover:bg-blue-100'
                                }`} 
                                title="Putar Audio Rekaman"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-600">Belum ada data</p>
                          <p className="text-[11px] mt-0.5">Tidak ada riwayat panggilan yang tersedia saat ini.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            {!isCallsLoading && callsData.items.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 bg-slate-50/40">
                <span>Menampilkan {callsData.items.length} dari total {callsData.total || callsData.items.length} panggilan</span>
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button type="button" className="px-3 py-1 border border-primary bg-primary text-white rounded-lg font-bold shadow-xs">
                    {page}
                  </button>
                  <button 
                    type="button" 
                    disabled={page >= callsData.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Audio Player Preview Card */}
        {selectedRecording && (
          <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 animate-in slide-in-from-right-4 duration-300 sticky top-6">
            <div className="bg-gradient-to-br from-[#0B3D91] to-[#1E5FCC] text-white rounded-2xl shadow-lg shadow-blue-900/15 border border-blue-400/20 overflow-hidden flex flex-col">
              
              {/* Preview Header */}
              <div className="p-4 border-b border-white/15 flex justify-between items-center bg-white/10">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  <h3 className="font-extrabold text-white text-xs tracking-wide uppercase">
                    PREVIEW REKAMAN
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedRecording(null)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Tutup Preview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Player Body */}
              <div className="p-5 flex-1 flex flex-col items-center justify-center bg-white/5 border-b border-white/15">
                <button 
                  type="button" 
                  onClick={togglePlayAudio}
                  className="w-14 h-14 bg-white text-[#0B3D91] rounded-full shadow-xl flex items-center justify-center mb-3 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                  title={isPlaying ? "Jeda Audio" : "Putar Audio"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-[#0B3D91] fill-current" />
                  ) : (
                    <Play className="w-6 h-6 text-[#0B3D91] ml-0.5 fill-current" />
                  )}
                </button>

                {/* Scrubber indicator */}
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2 cursor-pointer relative">
                  <div 
                    className={`bg-amber-400 h-full rounded-full transition-all duration-300 ${isPlaying ? 'w-2/5' : 'w-1/5'}`}
                  ></div>
                </div>
                <div className="flex justify-between w-full text-[11px] text-blue-200 font-semibold">
                  <span>{isPlaying ? '01:45' : '00:00'}</span>
                  <span>{formatSeconds(selectedRecording.durationSeconds)}</span>
                </div>
              </div>

              {/* Call Details & Action Buttons */}
              <div className="p-4 bg-white/10">
                <div className="mb-4">
                  <p className="text-xs font-extrabold text-white truncate">
                    {selectedRecording.inmateName} → {selectedRecording.familyName}
                  </p>
                  <p className="text-[11px] text-blue-200 font-medium mt-0.5">
                    {new Date(selectedRecording.date).toLocaleDateString('id-ID')}, {new Date(selectedRecording.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={handleDownloadAudio}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-white text-[#0B3D91] py-2 px-3 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Audio
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleOpenTranscript(selectedRecording)}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white py-2 px-3 rounded-xl text-xs font-bold border border-white/25 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-white" /> Transkrip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {showTranscriptModal && transcriptCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Transkrip {transcriptCall.callType === 'Video' ? 'Video Call' : 'Voice Call'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {transcriptCall.inmateName} &amp; {transcriptCall.familyName}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseTranscriptModal}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Subheader */}
            <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Tanggal:</span> {new Date(transcriptCall.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Durasi Audio:</span> {formatSeconds(transcriptCall.durationSeconds)}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200">
                {transcriptCall.transcript || "Belum ada transkrip audio yang tersedia untuk panggilan ini."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Transkripsi PasCall
              </span>
              <button 
                type="button" 
                onClick={() => handleDownloadTranscript(transcriptCall)}
                className="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Transkrip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
