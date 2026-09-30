import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Play, 
  Pause,
  FileText, 
  Download, 
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  X,
  Sparkles,
  ChevronDown,
  SearchX,
  AlertCircle
} from 'lucide-react';
import { getCallHistory } from '../../services/callService';
import { logout } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

const List = () => {
  const navigate = useNavigate();
  
  // State for filters & pagination
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  // Calls Data state
  const [callsData, setCallsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });
  
  // State for Audio Recording Player
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // State for Transcript Modal
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

  const loadCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCallHistory({
        search: debouncedSearch,
        branchId: branchFilter,
        status: statusFilter,
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
      console.log('[CallsList] Gagal memuat riwayat panggilan:', err);
      setCallsData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, branchFilter, statusFilter, page, limit, navigate]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectRecording = (call) => {
    if (!call.hasRecording) {
      showToast('Fitur rekaman audio belum tersedia untuk panggilan ini.');
      return;
    }
    if (selectedRecording?.id === call.id) {
      setIsPlaying(!isPlaying);
    } else {
      setSelectedRecording(call);
      setIsPlaying(true);
    }
  };

  const togglePlayAudio = () => {
    setIsPlaying(!isPlaying);
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

  const handleExport = () => {
    if (callsData.items.length === 0) {
      showToast('Tidak ada riwayat panggilan untuk diekspor.');
      return;
    }
    const exportData = callsData.items.map(c => ({
      'ID Panggilan': c.id,
      'Cabang': c.branchName || c.branchId,
      'Nama WBP': c.inmateName,
      'NIP': c.inmateId,
      'Keluarga': c.familyName,
      'No Telp': c.familyPhone,
      'Durasi (Detik)': c.durationSeconds,
      'Biaya': c.cost,
      'Status': c.status,
      'Waktu': new Date(c.date).toLocaleString('id-ID'),
      'Rekaman': c.hasRecording ? 'Tersedia' : 'Tidak Ada'
    }));
    exportToCSV(exportData, `Riwayat_Panggilan_PasCall_${new Date().toISOString().split('T')[0]}`);
  };

  const hasActiveFilters = searchInput !== '' || branchFilter !== 'All' || statusFilter !== 'All';

  const resetFilters = () => {
    setSearchInput('');
    setBranchFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  return (
    <div className="space-y-5 relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
        {/* Row 1: Search & Export Action */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari nama WBP, NIP, kontak keluarga, atau nomor telepon..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
            />
            {searchInput && (
              <button 
                type="button"
                onClick={() => setSearchInput('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <button 
              type="button"
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
              title="Export riwayat panggilan ke CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> 
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Toolbar & Active Counter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Status Segmented Tabs */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Answered', label: 'Answered' },
                { key: 'Missed', label: 'Missed' },
                { key: 'Busy', label: 'Busy' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => {
                    setStatusFilter(item.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === item.key 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="text-slate-400 text-[11px] font-medium ml-auto">
            Menampilkan <strong className="text-slate-700 font-bold">{callsData.items.length}</strong> dari {callsData.total || callsData.items.length} panggilan
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        
        {/* Table Card */}
        <div className="flex-1 min-w-0 w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 text-[10.5px] uppercase tracking-wider">
                  <th className="px-3 py-3 font-bold whitespace-nowrap">Waktu</th>
                  <th className="px-3 py-3 font-bold">Narapidana</th>
                  <th className="px-3 py-3 font-bold">Keluarga</th>
                  <th className="px-3 py-3 font-bold">Cabang</th>
                  <th className="px-2 py-3 font-bold text-center whitespace-nowrap">Status</th>
                  <th className="px-2 py-3 font-bold text-center whitespace-nowrap">Durasi / Biaya</th>
                  <th className="px-2 py-3 font-bold text-center whitespace-nowrap">Rekaman</th>
                  <th className="px-2.5 py-3 font-bold text-center whitespace-nowrap">Transkrip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-24 mb-1" /><div className="h-3 bg-slate-100 rounded w-16" /></td>
                      <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                      <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-24 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                      <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                      <td className="px-2 py-3 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                      <td className="px-2 py-3 text-center"><div className="h-4 bg-slate-200 rounded w-16 mx-auto" /></td>
                      <td className="px-2 py-3 text-center"><div className="h-6 bg-slate-200 rounded-lg w-6 mx-auto" /></td>
                      <td className="px-2.5 py-3 text-center"><div className="h-6 bg-slate-200 rounded-lg w-12 mx-auto" /></td>
                    </tr>
                  ))
                ) : callsData.items.length > 0 ? (
                  callsData.items.map((call) => {
                    const isCurrentPlaying = selectedRecording?.id === call.id && isPlaying;
                    const isCurrentSelected = selectedRecording?.id === call.id;

                    return (
                      <tr 
                        key={call.id} 
                        className={`transition-colors ${
                          isCurrentSelected ? 'bg-blue-50/60 border-l-4 border-l-primary' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="font-bold text-slate-800 text-[11.5px]">
                            {new Date(call.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-slate-400 text-[10.5px] font-medium">
                            {new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-800 text-[11.5px] truncate max-w-[110px]" title={call.inmateName}>
                            {call.inmateName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
                            NIP: {call.inmateId}
                          </p>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800 text-[11.5px] truncate max-w-[105px]" title={call.familyName}>
                            {call.familyName}
                          </p>
                          <p className="text-slate-400 text-[10px] font-medium mt-0.5 truncate max-w-[105px]">{call.familyPhone}</p>
                        </td>

                        <td className="px-3 py-2.5 text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11.5px] truncate max-w-[115px]">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{call.branchName || call.branchId}</span>
                          </span>
                        </td>

                        <td className="px-2 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            call.status === 'Answered' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : call.status === 'Busy' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {call.status === 'Answered' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            ) : call.status === 'Busy' ? (
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5 text-rose-600" />
                            )}
                            {call.status}
                          </span>
                        </td>

                        <td className="px-2 py-2.5 text-center whitespace-nowrap">
                          <p className="text-slate-800 font-bold text-[11px]">
                            {formatDuration(call.durationSeconds)}
                          </p>
                          <p className="text-[10px] font-bold text-amber-600">
                            {formatCurrency(call.cost)}
                          </p>
                        </td>

                        <td className="px-2 py-2.5 text-center whitespace-nowrap">
                          {call.hasRecording ? (
                            <button 
                              type="button"
                              onClick={() => handleSelectRecording(call)}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                                isCurrentSelected
                                  ? 'bg-primary text-white shadow-primary/30 ring-2 ring-primary/40 scale-105'
                                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                              }`}
                              title={isCurrentPlaying ? "Jeda Audio" : "Buka & Putar Rekaman"}
                            >
                              {isCurrentPlaying ? (
                                <Pause className="w-3 h-3 fill-current" />
                              ) : (
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                          {call.hasRecording ? (
                            <button 
                              type="button"
                              onClick={() => handleOpenTranscript(call)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-primary rounded-lg text-[11px] font-bold transition-all border border-slate-200/80 cursor-pointer shadow-2xs"
                              title="Lihat Transkrip Percakapan"
                            >
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>Lihat</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-14 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-sm">Belum ada data</p>
                        <p className="text-xs text-slate-400 mt-1">Tidak ada riwayat panggilan yang tersedia.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          {!isLoading && callsData.items.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
              <div className="text-[11px]">Menampilkan {callsData.items.length} dari total {callsData.total || callsData.items.length} data</div>
              <div className="flex gap-1.5">
                <button 
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button 
                  type="button"
                  disabled={page >= callsData.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Rekaman Card */}
        {selectedRecording && (
          <div className="w-full lg:w-72 xl:w-76 shrink-0 space-y-4 animate-in slide-in-from-right-4 duration-300 sticky top-4">
            <div className="bg-gradient-to-br from-[#0B3D91] via-[#1E5FCC] to-slate-800 text-white rounded-2xl shadow-xl shadow-blue-950/20 border border-blue-400/20 overflow-hidden flex flex-col">
              
              <div className="p-3.5 border-b border-white/15 flex justify-between items-center bg-white/10">
                <h3 className="font-extrabold text-white text-[11px] tracking-wide uppercase flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  PREVIEW REKAMAN
                </h3>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedRecording(null);
                    setIsPlaying(false);
                  }}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="p-4 flex-1 flex flex-col items-center justify-center bg-white/5 border-b border-white/15">
                <button 
                  type="button" 
                  onClick={togglePlayAudio}
                  className="w-13 h-13 bg-white text-[#0B3D91] rounded-full shadow-2xl flex items-center justify-center mb-3 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-[#0B3D91] fill-current" />
                  ) : (
                    <Play className="w-5 h-5 text-[#0B3D91] ml-0.5 fill-current" />
                  )}
                </button>

                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2 cursor-pointer relative" onClick={togglePlayAudio}>
                  <div className={`bg-amber-400 h-full rounded-full transition-all duration-300 ${isPlaying ? 'w-3/5' : 'w-1/5'}`}></div>
                </div>
                <div className="flex justify-between w-full text-[10.5px] text-blue-200 font-semibold font-mono">
                  <span>{isPlaying ? '02:15' : '00:00'}</span>
                  <span>{formatDuration(selectedRecording.durationSeconds)}</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/10 space-y-2.5">
                <div>
                  <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded text-blue-100 font-bold">
                    NIP: {selectedRecording.inmateId}
                  </span>
                  <p className="text-xs font-black text-white truncate mt-1">
                    {selectedRecording.inmateName} <span className="text-blue-200 font-normal">→</span> {selectedRecording.familyName}
                  </p>
                  <p className="text-[10.5px] text-blue-200 font-medium mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-300 shrink-0" />
                    <span className="truncate">{selectedRecording.branchName || selectedRecording.branchId}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Pop-up Modal Transkrip */}
      {showTranscriptModal && transcriptCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Transkrip Percakapan</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {transcriptCall.inmateName} (NIP: {transcriptCall.inmateId}) &amp; {transcriptCall.familyName}
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

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200">
                {transcriptCall.transcript || "Belum ada transkrip percakapan yang tercatat untuk panggilan ini."}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default List;
