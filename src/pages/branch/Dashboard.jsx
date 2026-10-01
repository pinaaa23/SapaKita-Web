import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  PhoneCall, 
  PhoneMissed, 
  PhoneForwarded, 
  Users, 
  Search, 
  Filter, 
  Play, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  SearchX, 
  Volume2, 
  Video, 
  Mic, 
  X, 
  Info,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { getBranchSummary } from '../../services/branchDashboardService';
import { getInmates } from '../../services/inmateService';
import { getCallHistory } from '../../services/callService';
import { getPackages } from '../../services/packageService';
import { getBalanceTransactions } from '../../services/balanceService';
import { useAuth } from '../../context/AuthContext';
import AudioPlayerPanel from '../../components/branch/AudioPlayerPanel';
import { downloadTextFile, downloadTranscriptPDF } from '../../utils/exportUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canViewRecordings, logout, isSupervisor, uptName, userName, roleLabel } = useAuth();

  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'video'
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [limit] = useState(8);
  
  // Loading states
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isCallsLoading, setIsCallsLoading] = useState(true);
  const [isSupervisorDataLoading, setIsSupervisorDataLoading] = useState(true);
  
  // Data states
  const [summaryStats, setSummaryStats] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    missedCalls: 0,
    totalInmates: 184,
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

  // Supervisor specific data states
  const [activePackages, setActivePackages] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // In-dashboard Audio Player & Transcript Modal
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [transcriptCall, setTranscriptCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Handle unauthorized route redirect toast
  useEffect(() => {
    if (location.state?.unauthorizedAccess) {
      setToastMessage(location.state?.message || 'Anda tidak memiliki akses ke halaman ini.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Handle Escape key to close player panel or modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showTranscriptModal) {
          setShowTranscriptModal(false);
          setTranscriptCall(null);
        } else if (selectedRecording) {
          setSelectedRecording(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTranscriptModal, selectedRecording]);

  // Debounce search 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
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
          let totalInmates = 184;
          if (typeof inmatesData?.total === 'number' && inmatesData.total > 0) {
            totalInmates = inmatesData.total;
          } else if (typeof inmatesData?.pagination?.total === 'number' && inmatesData.pagination.total > 0) {
            totalInmates = inmatesData.pagination.total;
          } else if (typeof inmatesData?.meta?.total === 'number' && inmatesData.meta.total > 0) {
            totalInmates = inmatesData.meta.total;
          } else if (typeof inmatesData?.totalItems === 'number' && inmatesData.totalItems > 0) {
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
  }, [navigate, logout]);

  // Load calls list for Kepala UPT
  const loadCalls = useCallback(async () => {
    if (!canViewRecordings) return;
    setIsCallsLoading(true);
    try {
      const res = await getCallHistory({
        search: debouncedSearch,
        status: statusFilter,
        callType: activeTab,
        page: 1,
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
  }, [canViewRecordings, debouncedSearch, statusFilter, activeTab, limit, navigate, logout]);

  useEffect(() => {
    if (canViewRecordings) {
      loadCalls();
    }
  }, [canViewRecordings, loadCalls]);

  // Load Supervisor data (Paket Aktif & Transaksi Terbaru)
  useEffect(() => {
    if (!canViewRecordings) {
      let isMounted = true;
      const fetchSupervisorData = async () => {
        setIsSupervisorDataLoading(true);
        try {
          const [packagesRes, transactionsRes] = await Promise.allSettled([
            getPackages(),
            getBalanceTransactions({ limit: 5 })
          ]);

          if (isMounted) {
            if (packagesRes.status === 'fulfilled') {
              const allPackages = Array.isArray(packagesRes.value) ? packagesRes.value : [];
              const active = allPackages.filter(p => (p.status === 'Aktif' || p.isActive !== false)).slice(0, 4);
              setActivePackages(active);
            }
            if (transactionsRes.status === 'fulfilled') {
              const transList = Array.isArray(transactionsRes.value?.items) ? transactionsRes.value.items.slice(0, 5) : [];
              setRecentTransactions(transList);
            }
          }
        } catch (err) {
          console.log('[BranchDashboard] Gagal memuat data supervisor:', err);
        } finally {
          if (isMounted) setIsSupervisorDataLoading(false);
        }
      };

      fetchSupervisorData();
      return () => { isMounted = false; };
    }
  }, [canViewRecordings]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);
  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0).replace(/\s+/g, '');

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

  // Putar rekaman langsung di Dashboard (tanpa pindah halaman)
  const handleSelectRecording = (call) => {
    if (!call.hasRecording) {
      showToast('Fitur rekaman audio belum tersedia untuk panggilan ini.');
      return;
    }
    setSelectedRecording(call);
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

  const isSplitView = Boolean(selectedRecording);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
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

      {/* Main Content Area - Hanya dirender jika role memiliki izin rekaman (Kepala UPT) */}
      {canViewRecordings && (
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          
          {/* Table Card (flex-1 fills available space cleanly) */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden">
              
              {/* Card Header with Title, Search & Link Lihat Semua */}
              <div className="p-5 sm:p-6 border-b border-slate-100">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 mb-4">
                  <div className="shrink-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-slate-800 whitespace-nowrap">Rekaman Panggilan</h2>
                      <Link 
                        to="/branch/recordings"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark transition-colors px-2 py-0.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/80"
                        title="Buka Halaman Lengkap Rekaman Panggilan"
                      >
                        <span>Lihat Semua</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Log aktivitas panggilan suara dan video warga binaan (WBP)
                    </p>
                  </div>
                  
                  {/* Search & Status Filter */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input 
                        type="text" 
                        placeholder="Cari NIP / nama WBP..." 
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className={`w-full ${isSplitView ? 'sm:w-44' : 'sm:w-56'} pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/60`}
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0">
                      <Filter className="w-3 h-3 text-slate-400" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                  <div className="flex items-center gap-5">
                    {/* Tab 1: Voice Call */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('voice')}
                      className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'voice' 
                          ? 'text-primary' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${activeTab === 'voice' ? 'text-primary' : 'text-slate-400'}`} />
                      <span>Voice Call</span>
                      {activeTab === 'voice' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
                      )}
                    </button>

                    {/* Tab 2: Video Call */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('video')}
                      className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'video' 
                          ? 'text-primary' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Video className={`w-3.5 h-3.5 ${activeTab === 'video' ? 'text-primary' : 'text-slate-400'}`} />
                      <span>Video Call</span>
                      {activeTab === 'video' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
                      )}
                    </button>
                  </div>

                  {/* Audio-only badge reminder when Video Call tab is open */}
                  {activeTab === 'video' && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/90 border border-amber-200/60 px-2 py-0.5 rounded-full mb-1.5 animate-in fade-in duration-200 font-medium">
                      <Mic className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Hanya audio</span>
                    </div>
                  )}
                </div>

                {/* Informative notice specifically on Video Call */}
                {activeTab === 'video' && (
                  <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/50 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 animate-in fade-in duration-200">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Pemberitahuan:</strong> Rekaman Video Call <strong>hanya memuat audio</strong> percakapan untuk enkripsi dan privasi Lapas.
                    </p>
                  </div>
                )}
              </div>

              {/* Calls Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-3 sm:px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tanggal / Waktu</th>
                      <th className="py-3 px-3 sm:px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dari &amp; Tujuan</th>
                      <th className={`py-3 px-3 sm:px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>Durasi</th>
                      <th className="py-3 px-2 sm:px-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className={`py-3 px-2 sm:px-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>Transkrip</th>
                      <th className="py-3 px-3 sm:px-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap w-14">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90 text-xs">
                    {isCallsLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-3.5 px-3 sm:px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                          <td className="py-3.5 px-3 sm:px-4"><div className="h-4 bg-slate-200 rounded w-32 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                          <td className={`py-3.5 px-3 sm:px-4 ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-4 bg-slate-200 rounded w-16" /></td>
                          <td className="py-3.5 px-2 sm:px-3 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                          <td className={`py-3.5 px-2 sm:px-3 text-center ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-6 bg-slate-200 rounded-lg w-16 mx-auto" /></td>
                          <td className="py-3.5 px-3 sm:px-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-7 mx-auto" /></td>
                        </tr>
                      ))
                    ) : callsData.items.length > 0 ? (
                      callsData.items.map((call) => {
                        const isSelected = selectedRecording?.id === call.id;
                        const isAnswered = call.status === 'Answered' || call.status === 'Terjawab';
                        const statusText = isAnswered ? 'Terjawab' : 'Tidak Terjawab';

                        return (
                          <tr 
                            key={call.id} 
                            className={`transition-colors ${
                              isSelected 
                                ? 'bg-blue-50/70 border-l-4 border-l-primary' 
                                : 'hover:bg-slate-50/60'
                            }`}
                          >
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <div className="font-bold text-slate-800">{new Date(call.date).toLocaleDateString('id-ID')}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} WIB</div>
                            </td>
                            <td className="py-3 px-3 sm:px-4 min-w-0 max-w-[180px]">
                              <div className="font-bold text-slate-800 truncate" title={call.inmateName}>{call.inmateName}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5 truncate" title={`${call.familyName} (${call.familyPhone})`}>
                                <span>→</span>
                                <span className="truncate">{call.familyName}</span>
                              </div>
                            </td>
                            <td className={`py-3 px-3 sm:px-4 whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                              <div className="font-semibold text-slate-800">{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</div>
                              <div className="text-[11px] font-bold text-amber-600 mt-0.5">{formatCurrency(call.cost)}</div>
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  isAnswered 
                                    ? 'bg-emerald-100/70 text-emerald-700 border border-emerald-200/50' 
                                    : 'bg-rose-100/70 text-rose-700 border border-rose-200/50'
                                }`}>
                                  {isAnswered ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  <span>{statusText}</span>
                                </span>
                              </div>
                            </td>
                            <td className={`py-3 px-2 sm:px-3 text-center whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                              {call.hasRecording ? (
                                <button 
                                  type="button" 
                                  onClick={() => handleOpenTranscript(call)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 text-slate-700 hover:bg-blue-50 hover:text-primary rounded-xl text-xs font-semibold transition-all border border-slate-200/60 cursor-pointer shadow-2xs"
                                  title="Lihat Transkrip Percakapan Audio"
                                >
                                  <FileText className="w-3.5 h-3.5 text-primary" />
                                  <span>Transkrip</span>
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs font-medium">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                <button 
                                  type="button" 
                                  onClick={() => handleSelectRecording(call)}
                                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-primary text-white shadow-md shadow-blue-500/20 scale-105 ring-2 ring-primary/30' 
                                      : 'bg-blue-50 text-primary hover:bg-blue-100'
                                  }`} 
                                  title={isSelected ? "Sedang Diputar" : "Putar Audio Rekaman"}
                                >
                                  {isSelected ? (
                                    <Volume2 className="w-3.5 h-3.5 animate-pulse fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
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
              
              {/* Compact Footer linking to full page */}
              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 bg-slate-50/40">
                <span>Menampilkan {callsData.items.length} panggilan terbaru</span>
                <Link 
                  to="/branch/recordings" 
                  className="font-bold text-primary hover:text-primary-dark inline-flex items-center gap-1 hover:underline"
                >
                  <span>Buka Seluruh Rekaman Panggilan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Split View Column for Dashboard (Desktop >= 1024px) */}
          {isSplitView && (
            <div className="hidden lg:block w-[360px] xl:w-[380px] shrink-0 sticky top-6 animate-in fade-in slide-in-from-right-2 duration-150 motion-reduce:animate-none">
              <AudioPlayerPanel 
                call={selectedRecording} 
                onClose={() => setSelectedRecording(null)} 
              />
            </div>
          )}

        </div>
      )}

      {/* Mobile Drawer / Overlay for Player Panel on Dashboard (< 1024px) */}
      {isSplitView && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <AudioPlayerPanel 
              call={selectedRecording} 
              onClose={() => setSelectedRecording(null)} 
            />
          </div>
        </div>
      )}

      {/* Supervisor Panels: Paket Aktif & Transaksi Terbaru (Hanya dirender untuk role Supervisor) */}
      {!canViewRecordings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Panel 1: Paket Aktif */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden transition-all flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Paket Aktif</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Daftar paket komunikasi yang sedang aktif di UPT
                </p>
              </div>
              <Link 
                to="/branch/packages"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70"
              >
                <span>Kelola Paket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List */}
            <div className="p-4 divide-y divide-slate-100/90">
              {isSupervisorDataLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="py-3 px-2 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-slate-200 rounded" />
                        <div className="h-2.5 w-20 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </div>
                ))
              ) : activePackages.length > 0 ? (
                activePackages.map((pkg) => {
                  const isVideo = (pkg.kategori || pkg.type || '').toLowerCase().includes('video');
                  const packageName = pkg.nama || pkg.name || (isVideo ? `Paket Video Call ${pkg.durasi || 30} Menit` : `Paket Telepon ${pkg.durasi || 50} Menit`);
                  const categoryLabel = isVideo ? 'Video Call' : 'Telepon';
                  const duration = pkg.durasi || pkg.duration || pkg.durationMinutes || (isVideo ? 30 : 50);
                  const priceVal = typeof pkg.harga === 'number' ? pkg.harga : (typeof pkg.price === 'number' ? pkg.price : (Number(pkg.harga || pkg.price) || 0));

                  return (
                    <div 
                      key={pkg.id} 
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/60 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isVideo ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-primary'
                        }`}>
                          {isVideo ? <Video className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {packageName}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isVideo 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200/50' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200/50'
                            }`}>
                              {categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Durasi: <span className="font-semibold text-slate-600">{duration} Menit</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <p className="text-xs font-extrabold text-slate-800">
                          {formatCurrency(priceVal)}
                        </p>
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 justify-end mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">Belum ada data</p>
                    <p className="text-[11px] mt-0.5">Belum ada paket panggilan aktif di UPT ini.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Transaksi Terbaru */}
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden transition-all flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Transaksi Terbaru</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  5 mutasi dan transaksi pemakaian saldo terakhir
                </p>
              </div>
              <Link 
                to="/branch/transactions"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List */}
            <div className="p-4 divide-y divide-slate-100/90">
              {isSupervisorDataLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="py-3 px-2 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-slate-200 rounded" />
                        <div className="h-2.5 w-20 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </div>
                ))
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map((trx) => (
                  <div 
                    key={trx.id} 
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/60 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {trx.inmateName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {trx.description} • {new Date(trx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <p className="text-xs font-extrabold text-amber-600">
                        {formatCurrency(trx.amount)}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        trx.status === 'Berhasil' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {trx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">Belum ada data</p>
                    <p className="text-[11px] mt-0.5">Tidak ada riwayat transaksi mutasi terbaru.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Transcript Modal */}
      {canViewRecordings && showTranscriptModal && transcriptCall && (
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
              <div className="p-4 bg-slate-50 rounded-xl text-slate-700 text-xs leading-relaxed whitespace-pre-line border border-slate-100">
                {transcriptCall.transcript || "Belum ada transkrip audio yang tersedia untuk panggilan ini."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseTranscriptModal();
                    handleSelectRecording(transcriptCall);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Putar Rekaman</span>
                </button>
                {transcriptCall.transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      const name = (transcriptCall.inmateName || 'Panggilan').replace(/[^a-zA-Z0-9_-]/g, '_');
                      downloadTranscriptPDF({
                        transcriptText: transcriptCall.transcript,
                        transcriptData: transcriptCall.transcriptData,
                        callInfo: transcriptCall,
                        inmateInfo: { name: transcriptCall.inmateName, wbpRegNumber: transcriptCall.inmateId },
                        uptName: uptName || 'Lapas Cipinang',
                        printedBy: `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
                        filename: `Transkrip_${name}_${transcriptCall.id}.pdf`
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Unduh Transkrip</span>
                  </button>
                )}
              </div>
              <button 
                type="button" 
                onClick={handleCloseTranscriptModal}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
