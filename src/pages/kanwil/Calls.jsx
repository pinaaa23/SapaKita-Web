import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Volume2, 
  Video, 
  Mic, 
  Search, 
  Filter, 
  Calendar, 
  Play, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  SearchX, 
  Info, 
  X,
  RotateCcw,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { getCallHistory } from '../../services/callService';
import { getKanwilBranches } from '../../services/kanwilService';
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';
import AudioPlayerPanel from '../../components/branch/AudioPlayerPanel';
import { useAuth } from '../../context/AuthContext';
import { downloadTextFile, downloadTranscriptPDF, exportToExcel } from '../../utils/exportUtils';
import { CallChannelBadge } from '../../utils/callChannel';

export default function KanwilCalls() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const kanwilId = user?.kanwilId || user?.kanwil?.id;
  const kanwilName = user?.kanwilName || user?.kanwil?.name || 'Kantor Wilayah';

  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'video'
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 baris per halaman

  const [branches, setBranches] = useState([]);
  const [branchMap, setBranchMap] = useState({});
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callsData, setCallsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });

  const [selectedRecording, setSelectedRecording] = useState(null);
  const [transcriptModalCall, setTranscriptModalCall] = useState(null);

  // 1. Ambil daftar UPT yang berada di bawah Kanwil ini
  useEffect(() => {
    let isMounted = true;
    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const res = await getKanwilBranches(kanwilId, { limit: 200 });
        const list = res.items || [];
        if (isMounted) {
          setBranches(list);
          const map = {};
          list.forEach((b) => {
            map[b.id] = b.name;
          });
          setBranchMap(map);
        }
      } catch (err) {
        console.error('[KanwilCalls] Gagal memuat daftar UPT Kanwil:', err);
      } finally {
        if (isMounted) setIsLoadingBranches(false);
      }
    };
    fetchBranches();
    return () => { isMounted = false; };
  }, [kanwilId]);

  // Debounce Search input 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Fetch call history dari endpoint /api/recordings (sama dengan Kepala UPT)
  const fetchCalls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCallHistory({
        search: debouncedSearch,
        status: statusFilter,
        callType: activeTab,
        branchId: branchFilter !== 'All' ? branchFilter : '',
        startDate,
        endDate,
        page,
        limit: 50, // ambil lebih banyak untuk filter kanwil client-side jika BE belum filter kanwil
      });

      // Batasi hanya UPT yang berada di bawah Kanwil ini jika daftar UPT sudah tersedia
      const kanwilBranchIds = new Set(branches.map(b => b.id));
      let items = res.items || [];

      if (kanwilBranchIds.size > 0) {
        items = items.filter(item => {
          if (!item.branchId) return true; // pertahankan jika belum ada branchId agar tidak kosong pada mock
          return kanwilBranchIds.has(item.branchId) || branches.some(b => b.name === item.branchName);
        });
      }

      setCallsData({
        items,
        total: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / limit)),
      });
    } catch (err) {
      if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      console.error('[KanwilCalls] Gagal memuat daftar rekaman:', err);
      setError('Gagal memuat data panggilan');
      setCallsData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, activeTab, branchFilter, startDate, endDate, limit, branches, logout, navigate]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Handle Escape key to close modal or split panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (transcriptModalCall) setTranscriptModalCall(null);
        else if (selectedRecording) setSelectedRecording(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transcriptModalCall, selectedRecording]);

  const handleResetFilters = () => {
    setSearchInput('');
    setBranchFilter('All');
    setStatusFilter('All');
    setChannelFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Client-side filtering terhadap jalur panggilan (Web / GSM), UPT, dan pencarian nama UPT
  const filteredCalls = useMemo(() => {
    let list = callsData.items || [];

    // Filter UPT
    if (branchFilter !== 'All') {
      list = list.filter(c => c.branchId === branchFilter || (branchMap[branchFilter] && c.branchName === branchMap[branchFilter]));
    }

    // Filter status
    if (statusFilter !== 'All') {
      list = list.filter(c => {
        const isAns = c.status === 'Answered' || c.status === 'Terjawab';
        return statusFilter === 'Answered' ? isAns : !isAns;
      });
    }

    // Filter Channel
    if (activeTab === 'voice' && channelFilter !== 'All') {
      list = list.filter(c => c.channel === channelFilter);
    }

    // Pencarian juga mencakup nama UPT
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(c => {
        const inmateMatch = c.inmateName?.toLowerCase().includes(q) || c.inmateId?.toLowerCase().includes(q);
        const familyMatch = c.familyName?.toLowerCase().includes(q) || c.familyPhone?.toLowerCase().includes(q);
        const uptMatch = (c.branchName || branchMap[c.branchId] || '').toLowerCase().includes(q);
        return inmateMatch || familyMatch || uptMatch;
      });
    }

    return list;
  }, [callsData.items, branchFilter, statusFilter, channelFilter, activeTab, debouncedSearch, branchMap]);

  // Pagination slice
  const paginatedCalls = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredCalls.slice(start, start + limit);
  }, [filteredCalls, page, limit]);

  const totalPagesComputed = Math.max(1, Math.ceil(filteredCalls.length / limit));

  const isSplitView = Boolean(selectedRecording);

  // Formatter tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return { date: '-', time: '-' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: '-', time: '-' };

    const date = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const time = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    return { date, time };
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Main Content: Table & Split Audio Player */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Table Panel */}
        <div className={`transition-all duration-300 w-full ${isSplitView ? 'lg:w-[65%]' : 'lg:w-full'}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-2.5 justify-between">
                
                {/* Search Bar (Nama WBP, NIP, Keluarga, UPT) */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari WBP, keluarga, nomor, atau UPT..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  
                  {/* Filter UPT (Baru) */}
                  <div className="relative">
                    <select
                      value={branchFilter}
                      onChange={(e) => {
                        setBranchFilter(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                    >
                      <option value="All">Semua UPT</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Filter Status */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                    >
                      <option value="All">Semua Status</option>
                      <option value="Answered">Terjawab</option>
                      <option value="Missed">Tidak Terjawab</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Filter Jalur Panggilan (Web / GSM) */}
                  {activeTab === 'voice' && (
                    <div className="relative">
                      <select
                        value={channelFilter}
                        onChange={(e) => {
                          setChannelFilter(e.target.value);
                          setPage(1);
                        }}
                        className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                      >
                        <option value="All">Semua Jalur</option>
                        <option value="web">Jalur Web</option>
                        <option value="gsm">Jalur GSM</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {/* Date Range Inputs */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="bg-transparent border-none text-[11px] font-medium text-slate-700 focus:outline-none p-0 cursor-pointer"
                      title="Dari Tanggal"
                    />
                    <span className="text-slate-400 text-[10px]">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="bg-transparent border-none text-[11px] font-medium text-slate-700 focus:outline-none p-0 cursor-pointer"
                      title="Sampai Tanggal"
                    />
                  </div>

                  {/* Reset Filter Button */}
                  {(searchInput || branchFilter !== 'All' || statusFilter !== 'All' || (activeTab === 'voice' && channelFilter !== 'All') || startDate || endDate) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="p-1.5 text-slate-500 hover:text-primary hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      title="Reset Semua Filter"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Service Tabs: Voice Call vs Video Call */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('voice');
                      setPage(1);
                    }}
                    className={`pb-1 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'voice' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${activeTab === 'voice' ? 'text-primary' : 'text-slate-400'}`} />
                    <span>Voice Call</span>
                    {activeTab === 'voice' && (
                      <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('video');
                      setPage(1);
                    }}
                    className={`pb-1 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'video' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Video className={`w-3.5 h-3.5 ${activeTab === 'video' ? 'text-primary' : 'text-slate-400'}`} />
                    <span>Video Call</span>
                    {activeTab === 'video' && (
                      <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'video' && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Mic className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Audio Only (Enkripsi Lapas)</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={fetchCalls}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Segarkan Data"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Segarkan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-5 pr-3 whitespace-nowrap w-[18%]">Tanggal &amp; Waktu</th>
                    <th className="py-3.5 px-3 whitespace-nowrap w-[20%]">UPT Asal</th>
                    <th className="py-3.5 px-3 w-[22%]">WBP &amp; Tujuan</th>
                    <th className={`py-3.5 px-3 whitespace-nowrap w-[16%] ${isSplitView ? 'hidden' : 'table-cell'}`}>Durasi &amp; Biaya</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap w-[12%]">Status</th>
                    <th className={`py-3.5 px-3 text-center whitespace-nowrap w-[10%] ${isSplitView ? 'hidden' : 'table-cell'}`}>Transkrip</th>
                    <th className="py-3.5 pl-3 pr-5 text-center whitespace-nowrap w-[8%]">Audio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-3.5 pl-5 pr-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                        <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                        <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-32 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                        <td className={`py-3.5 px-3 ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-4 bg-slate-200 rounded w-16" /></td>
                        <td className="py-3.5 px-3 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                        <td className={`py-3.5 px-3 text-center ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-6 bg-slate-200 rounded-lg w-16 mx-auto" /></td>
                        <td className="py-3.5 pl-3 pr-5 text-center"><div className="h-7 bg-slate-200 rounded-lg w-7 mx-auto" /></td>
                      </tr>
                    ))
                  ) : paginatedCalls.length > 0 ? (
                    paginatedCalls.map((call) => {
                      const isSelected = selectedRecording?.id === call.id;
                      const isAnswered = call.status === 'Answered' || call.status === 'Terjawab';
                      const { date, time } = formatDate(call.date);
                      const uptDisplayName = call.branchName || branchMap[call.branchId] || 'UPT Pemasyarakatan';

                      return (
                        <tr
                          key={call.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-blue-50/70 border-l-4 border-l-primary' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Tanggal & Waktu */}
                          <td className="py-3.5 pl-5 pr-3">
                            <p className="font-bold text-slate-800">{date}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{time}</p>
                          </td>

                          {/* Kolom UPT Asal (Spesifik Kanwil) */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-bold text-slate-800 line-clamp-1" title={uptDisplayName}>
                                {uptDisplayName}
                              </span>
                            </div>
                          </td>

                          {/* WBP & Tujuan */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800 line-clamp-1">{call.inmateName}</p>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                <span>Ke:</span>
                                <span>{call.targetPhone || call.destinationPhone || call.familyPhone || '-'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Durasi & Biaya */}
                          <td className={`py-3.5 px-3 ${isSplitView ? 'hidden' : 'table-cell'}`}>
                            <div className="space-y-0.5">
                              <p className="font-mono font-bold text-slate-700">{formatDuration(call.durationSeconds)}</p>
                              <p className="text-[11px] text-slate-400">{formatCurrency(call.cost)}</p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isAnswered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {isAnswered ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                                <span>{isAnswered ? 'Terjawab' : 'Tidak Terjawab'}</span>
                              </span>
                              {activeTab === 'voice' && call.channel && (
                                <CallChannelBadge channel={call.channel} />
                              )}
                            </div>
                          </td>

                          {/* Transkrip */}
                          <td className={`py-3.5 px-3 text-center ${isSplitView ? 'hidden' : 'table-cell'}`}>
                            {call.transcript ? (
                              <button
                                type="button"
                                onClick={() => setTranscriptModalCall(call)}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                title="Lihat Transkrip Lengkap"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-300">-</span>
                            )}
                          </td>

                          {/* Audio Player Button */}
                          <td className="py-3.5 pl-3 pr-5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedRecording?.id === call.id) {
                                  setSelectedRecording(null);
                                } else {
                                  setSelectedRecording(call);
                                }
                              }}
                              className={`p-2 rounded-xl transition cursor-pointer shadow-2xs ${
                                isSelected
                                  ? 'bg-primary text-white ring-2 ring-primary/20'
                                  : 'bg-slate-100 hover:bg-primary hover:text-white text-slate-600'
                              }`}
                              title={isSelected ? 'Tutup Pemutar Audio' : 'Dengarkan Rekaman'}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <SearchX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Tidak ada rekaman panggilan yang ditemukan</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {searchInput || branchFilter !== 'All' ? 'Coba ubah kata kunci atau filter pencarian Anda' : 'Belum ada riwayat panggilan di wilayah ini'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredCalls.length > limit && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredCalls.length)} dari total {filteredCalls.length} panggilan
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-slate-700">
                    {page} / {totalPagesComputed}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPagesComputed, p + 1))}
                    disabled={page >= totalPagesComputed}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player Panel (Split View seperti Kepala UPT) */}
        {isSplitView && (
          <div className="w-full lg:w-[35%] shrink-0 sticky top-4 animate-in slide-in-from-right-4 duration-300">
            <AudioPlayerPanel
              recording={selectedRecording}
              onClose={() => setSelectedRecording(null)}
              onOpenTranscript={() => setTranscriptModalCall(selectedRecording)}
            />
          </div>
        )}
      </div>

      {/* Transcript Modal (Read-Only & Ekspor Dokumen) */}
      {transcriptModalCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Transkrip Percakapan Panggilan</h3>
                  <p className="text-[11px] text-slate-400">
                    {transcriptModalCall.inmateName} • {transcriptModalCall.branchName || branchMap[transcriptModalCall.branchId] || 'UPT Lapas'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTranscriptModalCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">WBP / NIP:</span>
                  <span className="font-bold text-slate-700">{transcriptModalCall.inmateName} ({transcriptModalCall.inmateId || '-'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Tujuan:</span>
                  <span className="font-mono text-slate-700">{transcriptModalCall.targetPhone || transcriptModalCall.destinationPhone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Panggilan:</span>
                  <span className="text-slate-700">{formatDate(transcriptModalCall.date).date} {formatDate(transcriptModalCall.date).time}</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Teks Percakapan</h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {transcriptModalCall.transcript}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadTextFile(
                    `Transkrip_${transcriptModalCall.inmateName.replace(/\s+/g, '_')}_${transcriptModalCall.id}.txt`,
                    transcriptModalCall.transcript
                  )}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh TXT</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadTranscriptPDF({
                    inmateName: transcriptModalCall.inmateName,
                    inmateId: transcriptModalCall.inmateId,
                    targetPhone: transcriptModalCall.targetPhone || transcriptModalCall.destinationPhone,
                    date: formatDate(transcriptModalCall.date).date,
                    time: formatDate(transcriptModalCall.date).time,
                    duration: formatDuration(transcriptModalCall.durationSeconds),
                    transcript: transcriptModalCall.transcript,
                    uptName: transcriptModalCall.branchName || branchMap[transcriptModalCall.branchId] || kanwilName,
                  })}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setTranscriptModalCall(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
