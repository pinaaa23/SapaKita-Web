import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { getCallHistory } from '../../services/callService';
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';
import AudioPlayerPanel from '../../components/branch/AudioPlayerPanel';
import { useAuth } from '../../context/AuthContext';
import { downloadTextFile, downloadTranscriptPDF } from '../../utils/exportUtils';

const Recordings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, uptName, isSupervisor, userName, roleLabel } = useAuth();

  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'video'
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 baris per halaman

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callsData, setCallsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });

  const [selectedRecording, setSelectedRecording] = useState(null);
  const [transcriptModalCall, setTranscriptModalCall] = useState(null);
  const initialAutoPlayProcessed = useRef(false);

  // Debounce Search input 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch calls with filters & pagination (DO NOT depend on selectedRecording to avoid refetch loops)
  const fetchCalls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCallHistory({
        search: debouncedSearch,
        status: statusFilter,
        callType: activeTab,
        startDate,
        endDate,
        page,
        limit,
      });
      setCallsData(res);

      // Handle navigation state from Dashboard once on initial load
      if (location.state?.playRecordingId && !initialAutoPlayProcessed.current) {
        initialAutoPlayProcessed.current = true;
        const target = res.items.find(item => item.id === location.state.playRecordingId);
        if (target) {
          setSelectedRecording(target);
        }
        // Clear history state so clicking X will not re-trigger it
        window.history.replaceState({}, document.title);
      }
    } catch (err) {
      if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      console.error('[Recordings] Gagal memuat daftar rekaman:', err);
      setError('Gagal memuat data rekaman');
      setCallsData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, activeTab, startDate, endDate, page, limit, logout, navigate, location.state?.playRecordingId]);

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
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handlePlayRecording = (call) => {
    if (!call.hasRecording) {
      alert('Fitur rekaman audio belum tersedia untuk panggilan ini.');
      return;
    }
    setSelectedRecording(call);
  };

  const handleClosePlayer = () => {
    setSelectedRecording(null);
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
      .format(value || 0)
      .replace(/\s+/g, '');

  const formatDuration = (seconds) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const isSplitView = Boolean(selectedRecording);

  return (
    <div className="space-y-6">
      
      {/* Main Table & Split View Container */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        
        {/* Table Card (flex-1 fills remaining space instantly without width animation lag) */}
        <div className="flex-1 min-w-0 w-full">
          <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-slate-100/90 overflow-hidden">
            
            {/* Header with Title, Search & Filters */}
            <div className="p-5 sm:p-6 border-b border-slate-100">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 mb-4">
                <div className="shrink-0">
                  <h2 className="text-base font-bold text-slate-800 whitespace-nowrap">
                    Daftar Rekaman Panggilan
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {callsData.total} panggilan tercatat di sistem
                  </p>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-none min-w-[160px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input 
                      type="text" 
                      placeholder="Cari NIP / nama WBP..." 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={`w-full ${isSplitView ? 'sm:w-40' : 'sm:w-52'} pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/60`}
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0">
                    <Filter className="w-3 h-3 text-slate-400" />
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

                  {/* Date Range Filters (Indonesian Labels) */}
                  <div className="flex items-center gap-1 bg-slate-50/80 border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-500">Tgl:</span>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                      title="Tanggal Mulai"
                    />
                    <span className="text-slate-400 text-xs px-0.5">s/d</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                      title="Tanggal Akhir"
                    />
                  </div>

                  {/* Reset Filter Button */}
                  {(searchInput || statusFilter !== 'All' || startDate || endDate) && (
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
              <div className="flex items-center justify-between border-b border-slate-100 pt-1">
                <div className="flex items-center gap-5">
                  {/* Tab 1: Voice Call */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('voice');
                      setPage(1);
                    }}
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
                    onClick={() => {
                      setActiveTab('video');
                      setPage(1);
                    }}
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

                {/* Audio-only badge reminder on Video Call */}
                {activeTab === 'video' && (
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/90 border border-amber-200/60 px-2 py-0.5 rounded-full mb-1.5 animate-in fade-in duration-200 font-medium">
                    <Mic className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Hanya audio</span>
                  </div>
                )}
              </div>

              {/* Informative notice on Video Call */}
              {activeTab === 'video' && (
                <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/50 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 animate-in fade-in duration-200">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Pemberitahuan:</strong> Rekaman Video Call <strong>hanya memuat audio</strong> percakapan untuk enkripsi dan privasi Lapas.
                  </p>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-3 px-3 sm:px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Tanggal / Waktu
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Dari &amp; Tujuan
                    </th>
                    {/* Kolom Durasi & Transkrip disembunyikan via CSS class tanpa remounting DOM node */}
                    <th className={`py-3 px-3 sm:px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                      Durasi
                    </th>
                    <th className="py-3 px-2 sm:px-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className={`py-3 px-2 sm:px-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                      Transkrip
                    </th>
                    <th className="py-3 px-3 sm:px-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap w-14">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90 text-xs">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-3 sm:px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                        <td className="py-4 px-3 sm:px-4"><div className="h-4 bg-slate-200 rounded w-32 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                        <td className={`py-4 px-3 sm:px-4 ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-4 bg-slate-200 rounded w-16" /></td>
                        <td className="py-4 px-2 sm:px-3 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                        <td className={`py-4 px-2 sm:px-3 text-center ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-6 bg-slate-200 rounded-lg w-16 mx-auto" /></td>
                        <td className="py-4 px-3 sm:px-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-7 mx-auto" /></td>
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
                          {/* Tanggal / Waktu */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {new Date(call.date).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </td>

                          {/* Dari & Tujuan */}
                          <td className="py-3 px-3 sm:px-4 min-w-0 max-w-[180px]">
                            <div className="font-bold text-slate-800 truncate" title={call.inmateName}>
                              {call.inmateName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5 truncate" title={`${call.familyName} (${call.familyPhone})`}>
                              <span>→</span>
                              <span className="truncate">{call.familyName}</span>
                            </div>
                          </td>

                          {/* Durasi & Biaya */}
                          <td className={`py-3 px-3 sm:px-4 whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                            <div className="font-semibold text-slate-800">
                              {formatDuration(call.durationSeconds)}
                            </div>
                            <div className="text-[11px] font-bold text-amber-600 mt-0.5">
                              {formatCurrency(call.cost)}
                            </div>
                          </td>

                          {/* Status Badge (Indonesian) */}
                          <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isAnswered 
                                  ? 'bg-emerald-100/70 text-emerald-700 border border-emerald-200/50' 
                                  : 'bg-rose-100/70 text-rose-700 border border-rose-200/50'
                              }`}>
                                {isAnswered ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>{statusText}</span>
                              </span>
                            </div>
                          </td>

                          {/* Transkrip Button */}
                          <td className={`py-3 px-2 sm:px-3 text-center whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                            {call.transcript || call.hasRecording ? (
                              <button 
                                type="button"
                                onClick={() => setTranscriptModalCall(call)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 text-slate-700 hover:bg-blue-50 hover:text-primary rounded-xl text-xs font-semibold transition-all border border-slate-200/60 cursor-pointer shadow-2xs"
                                title="Lihat Transkrip Audio"
                              >
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span>Transkrip</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium">-</span>
                            )}
                          </td>

                          {/* Aksi Play/Active Button */}
                          <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <button 
                                type="button" 
                                onClick={() => handlePlayRecording(call)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-primary text-white shadow-md shadow-blue-500/20 scale-105 ring-2 ring-primary/30' 
                                    : 'bg-blue-50 text-primary hover:bg-blue-100'
                                }`} 
                                title={isSelected ? "Sedang Diputar di Pemutar" : "Putar Audio Rekaman"}
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
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-rose-500">
                          <XCircle className="w-10 h-10 mb-2 text-rose-400" />
                          <p className="font-semibold text-xs text-rose-600">{error}</p>
                          <button 
                            type="button" 
                            onClick={fetchCalls}
                            className="mt-2 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            Coba lagi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-600">Belum ada rekaman panggilan</p>
                          <p className="text-[11px] mt-0.5">Tidak ada riwayat rekaman yang sesuai dengan filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && callsData.items.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 bg-slate-50/40">
                <span>
                  Menampilkan {callsData.items.length} dari total {callsData.total} rekaman
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Sebelumnya
                  </button>
                  
                  {Array.from({ length: callsData.totalPages || 1 }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          page === pageNum
                            ? 'border border-primary bg-primary text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button 
                    type="button" 
                    disabled={page >= callsData.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Split View Column (Fixed Width 360px-380px, sticky top) */}
        {isSplitView && (
          <div className="hidden lg:block w-[360px] xl:w-[380px] shrink-0 sticky top-6 animate-in fade-in slide-in-from-right-2 duration-150 motion-reduce:animate-none">
            <AudioPlayerPanel 
              call={selectedRecording} 
              onClose={handleClosePlayer} 
            />
          </div>
        )}

      </div>

      {/* Mobile Drawer / Overlay for Player Panel (< 1024px) */}
      {isSplitView && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <AudioPlayerPanel 
              call={selectedRecording} 
              onClose={handleClosePlayer} 
            />
          </div>
        </div>
      )}

      {/* Standalone Transcript Modal */}
      {transcriptModalCall && (
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
                    Transkrip {transcriptModalCall.callType === 'Video' ? 'Video Call' : 'Voice Call'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {transcriptModalCall.inmateName} &amp; {transcriptModalCall.familyName}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setTranscriptModalCall(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Subheader */}
            <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Tanggal:</span> {new Date(transcriptModalCall.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Durasi:</span> {formatDuration(transcriptModalCall.durationSeconds)}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-slate-50 rounded-xl text-slate-700 text-xs leading-relaxed whitespace-pre-line border border-slate-100">
                {transcriptModalCall.transcript || "Belum ada transkrip percakapan yang tersedia untuk panggilan ini."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecording(transcriptModalCall);
                    setTranscriptModalCall(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Putar Rekaman</span>
                </button>
                {transcriptModalCall.transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      const name = (transcriptModalCall.inmateName || 'Panggilan').replace(/[^a-zA-Z0-9_-]/g, '_');
                      downloadTranscriptPDF({
                        transcriptText: transcriptModalCall.transcript,
                        transcriptData: transcriptModalCall.transcriptData,
                        callInfo: transcriptModalCall,
                        inmateInfo: { name: transcriptModalCall.inmateName, wbpRegNumber: transcriptModalCall.inmateId },
                        uptName: uptName || 'Lapas Cipinang',
                        printedBy: `${userName || 'Petugas'} (${roleLabel || 'Kepala UPT'})`,
                        filename: `Transkrip_${name}_${transcriptModalCall.id}.pdf`
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
                onClick={() => setTranscriptModalCall(null)}
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

export default Recordings;
