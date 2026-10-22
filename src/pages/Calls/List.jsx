import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Volume2, 
  Video, 
  PhoneCall, 
  Search, 
  Calendar, 
  Play, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  SearchX, 
  Info, 
  X,
  RotateCcw,
  Download,
  ChevronDown,
  Filter
} from 'lucide-react';
import { getCallHistory } from '../../services/callService';
import { getBranches } from '../../services/branchService';
import { getInmates } from '../../services/inmateService';
import { logout } from '../../services/api';
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';
import AudioPlayerPanel from '../../components/branch/AudioPlayerPanel';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, downloadTranscriptPDF } from '../../utils/exportUtils';
import { CallChannelBadge } from '../../utils/callChannel';
import { CallStatusBadge, normalizeCallStatus } from '../../utils/callStatus';

const CallsList = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();

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
  const [branchesMap, setBranchesMap] = useState({});
  const [nipBranchMap, setNipBranchMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [callsData, setCallsData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });

  const [selectedRecording, setSelectedRecording] = useState(null);
  const [transcriptModalCall, setTranscriptModalCall] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch branch & inmate list for UPT name resolution
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [bRes, iRes] = await Promise.allSettled([
          getBranches(),
          getInmates({ limit: 300 }),
        ]);

        const bList = bRes.status === 'fulfilled' ? (bRes.value.items || bRes.value || []) : [];
        setBranches(bList);

        const bMap = {};
        bList.forEach((b) => {
          bMap[b.id] = b.name;
        });
        setBranchesMap(bMap);

        const iList = iRes.status === 'fulfilled' ? (iRes.value.items || iRes.value || []) : [];
        const nMap = {};
        iList.forEach((i) => {
          const uName = bMap[i.branchId] || i.branchName || 'Lapas Kelas I';
          if (i.identifier) nMap[i.identifier] = uName;
          if (i.wbpRegNumber) nMap[i.wbpRegNumber] = uName;
          if (i.name) nMap[i.name] = uName;
        });
        setNipBranchMap(nMap);
      } catch (err) {
        console.log('[CallsList] Gagal memuat data referensi:', err);
      }
    };
    fetchReferences();
  }, []);

  // Debounce Search input 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch calls with filters & pagination
  const fetchCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCallHistory({
        search: debouncedSearch,
        branchId: branchFilter,
        status: statusFilter,
        callType: activeTab,
        startDate,
        endDate,
        page,
        limit,
      });
      setCallsData(res);
    } catch (err) {
      if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      console.log('[CallsList] Gagal memuat riwayat panggilan:', err);
      setCallsData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, branchFilter, statusFilter, activeTab, startDate, endDate, page, limit, navigate]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
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

  const handlePlayRecording = (call) => {
    if (!call.hasRecording) {
      showToast('Rekaman audio belum tersedia untuk panggilan ini.');
      return;
    }
    // Toggle player jika item yang sama diklik
    if (selectedRecording?.id === call.id) {
      setSelectedRecording(null);
    } else {
      setSelectedRecording(call);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setBranchFilter('All');
    setStatusFilter('All');
    setChannelFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = 
    searchInput !== '' || 
    branchFilter !== 'All' || 
    statusFilter !== 'All' || 
    (activeTab === 'voice' && channelFilter !== 'All') ||
    startDate !== '' || 
    endDate !== '';

  const isSplitView = Boolean(selectedRecording);

  // Client-side filtering terhadap jalur panggilan (Web / GSM) dan status
  const filteredCalls = React.useMemo(() => {
    let list = callsData.items || [];
    if (activeTab === 'voice' && channelFilter !== 'All') {
      list = list.filter((c) => (c.channel || 'web').toLowerCase() === channelFilter.toLowerCase());
    }
    if (statusFilter !== 'All') {
      list = list.filter((c) => {
        const norm = normalizeCallStatus(c.status, c.rawStatus);
        return norm.toLowerCase() === statusFilter.toLowerCase();
      });
    }
    return list;
  }, [callsData.items, activeTab, channelFilter, statusFilter]);

  const handleExport = () => {
    if (filteredCalls.length === 0) {
      showToast('Tidak ada riwayat panggilan untuk diekspor.');
      return;
    }
    const exportData = filteredCalls.map((c, idx) => ({
      'No': idx + 1,
      'ID Panggilan': c.id,
      'UPT': (c.branchName && c.branchName !== '-' && !c.branchName.startsWith('b')) ? c.branchName : (branchesMap[c.branchId] || nipBranchMap[c.inmateId] || 'Lapas Kelas I'),
      'Nama WBP': c.inmateName,
      'NIP': c.inmateId,
      'No. Telepon Tujuan': c.familyPhone || '-',
      'Durasi': `${Math.floor((c.durationSeconds || 0) / 60)}m ${(c.durationSeconds || 0) % 60}s`,
      'Biaya': `Rp ${new Intl.NumberFormat('id-ID').format(c.cost || 0)}`,
      'Jalur': c.callType === 'Video' ? 'Web' : (c.channel === 'gsm' ? 'GSM' : 'Web'),
      'Status': c.statusText || (normalizeCallStatus(c.status, c.rawStatus) === 'Answered' ? 'Terjawab' : (normalizeCallStatus(c.status, c.rawStatus) === 'Rejected' ? 'Ditolak' : 'Tidak Terjawab')),
      'Waktu Panggilan': new Date(c.date).toLocaleString('id-ID'),
      'Ketersediaan Rekaman': c.hasRecording ? 'Tersedia' : 'Tidak Ada'
    }));

    const answeredCount = filteredCalls.filter(c => normalizeCallStatus(c.status, c.rawStatus) === 'Answered').length;
    const rejectedCount = filteredCalls.filter(c => normalizeCallStatus(c.status, c.rawStatus) === 'Rejected').length;
    const totalCost = filteredCalls.reduce((sum, c) => sum + (c.cost || 0), 0);

    const filename = `Riwayat_Panggilan_Nasional_${new Date().toISOString().split('T')[0]}.xlsx`;
    const success = exportToExcel(exportData, filename, 'Riwayat Panggilan', {
      title: 'LAPORAN RIWAYAT PANGGILAN NASIONAL PASCALL',
      subtitle: 'Log Komunikasi Telepon & Video Call Warga Binaan Pemasyarakatan Nasional',
      metadata: {
        'Tingkat': 'Pusat / Nasional',
        'Dicetak Oleh': `${userName || 'Super Administrator'} (Super Administrator)`,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter,
        'Jalur Filter': activeTab === 'voice' ? (channelFilter === 'All' ? 'Semua Jalur' : channelFilter.toUpperCase()) : 'Web',
        'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics: [
        { label: 'Total Panggilan', value: `${filteredCalls.length} Data` },
        { label: 'Panggilan Terjawab', value: `${answeredCount} Panggilan` },
        { label: 'Panggilan Ditolak', value: `${rejectedCount} Panggilan` },
        { label: 'Total Biaya Pemakaian', value: `Rp ${new Intl.NumberFormat('id-ID').format(totalCost)}` },
      ]
    });

    if (success !== false) {
      showToast('Berhasil mengekspor riwayat panggilan ke format Excel!');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar (Pencarian, Tipe Panggilan, Filter & Export) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Baris 1: Pencarian & Tab Switcher (Voice Call vs Video Call) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari NIP, nama WBP, atau no. tujuan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition font-medium text-slate-800 placeholder-slate-400 shadow-2xs"
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

          {/* Tab Switcher: Voice Call & Video Call */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('voice');
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Voice Call</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setActiveTab('video');
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Call</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Filter Toolbar (Cabang, Status, Jalur, Tanggal, Reset & Export) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>

            {/* Cabang UPT Filter */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-3 pr-7 py-2 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer ${
                  branchFilter !== 'All'
                    ? 'bg-blue-50 border-blue-200 text-primary'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <option value="All">Semua Cabang UPT</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-3 pr-7 py-2 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer ${
                  statusFilter !== 'All'
                    ? 'bg-blue-50 border-blue-200 text-primary'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <option value="All">Semua Status</option>
                <option value="Answered">Terjawab</option>
                <option value="Rejected">Ditolak</option>
                <option value="Missed">Tidak Terjawab</option>
                <option value="Busy">Sibuk / Gagal</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Jalur Dropdown (Hanya di tab Voice Call) */}
            {activeTab === 'voice' && (
              <div className="relative">
                <select
                  value={channelFilter}
                  onChange={(e) => {
                    setChannelFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`pl-3 pr-7 py-2 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer ${
                    channelFilter !== 'All'
                      ? 'bg-blue-50 border-blue-200 text-primary'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  <option value="All">Semua Jalur</option>
                  <option value="web">Web</option>
                  <option value="gsm">GSM</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Date Range Filters */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                title="Tanggal Selesai"
              />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer ml-auto"
            title="Export Riwayat Panggilan (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content: Split Layout antara Tabel & Panel Pemutar */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        
        {/* Table Container Card */}
        <div className={`transition-all duration-300 w-full ${isSplitView ? 'xl:w-[calc(100%-380px)] min-w-0' : 'w-full'}`}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className={`py-3.5 px-4 whitespace-nowrap ${isSplitView ? 'w-[30%]' : 'w-[14%]'}`}>
                      Tanggal / Waktu
                    </th>
                    <th className={`py-3.5 px-4 ${isSplitView ? 'w-[36%]' : 'w-[17%]'}`}>
                      Dari &amp; Tujuan
                    </th>
                    <th className={`py-3.5 px-4 ${isSplitView ? 'hidden' : 'table-cell w-[17%]'}`}>
                      UPT
                    </th>
                    <th className={`py-3.5 px-4 whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell w-[16%]'}`}>
                      Durasi / Biaya
                    </th>
                    <th className={`py-3.5 px-3 text-center whitespace-nowrap ${isSplitView ? 'w-[18%]' : 'w-[13%]'}`}>
                      Status
                    </th>
                    <th className={`py-3.5 px-3 text-center whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell w-[13%]'}`}>
                      Transkrip
                    </th>
                    <th className={`py-3.5 px-4 text-center whitespace-nowrap ${isSplitView ? 'w-[16%]' : 'w-[10%]'}`}>
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
                        <td className={`py-4 px-3 sm:px-4 ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-4 bg-slate-200 rounded w-24" /></td>
                        <td className={`py-4 px-3 sm:px-4 ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-4 bg-slate-200 rounded w-16" /></td>
                        <td className="py-4 px-2 sm:px-3 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                        <td className={`py-4 px-2 sm:px-3 text-center ${isSplitView ? 'hidden' : 'table-cell'}`}><div className="h-6 bg-slate-200 rounded-lg w-16 mx-auto" /></td>
                        <td className="py-4 px-3 sm:px-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-7 mx-auto" /></td>
                      </tr>
                    ))
                  ) : filteredCalls.length > 0 ? (
                    filteredCalls.map((call) => {
                      const isSelected = selectedRecording?.id === call.id;
                      const isAnswered = call.status === 'Answered' || call.status === 'Terjawab';
                      const statusText = isAnswered ? 'Terjawab' : 'Tidak Terjawab';
                      const resolvedUptName = 
                        (call.branchName && call.branchName !== '-' && !call.branchName.startsWith('b')) 
                          ? call.branchName 
                          : (branchesMap[call.branchId] || nipBranchMap[call.inmateId] || nipBranchMap[call.inmateName] || (branches[0]?.name || 'Lapas Kelas I'));

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
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {new Date(call.date).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </td>

                          {/* Dari & Tujuan */}
                          <td className="py-3.5 px-4 min-w-0 max-w-[180px]">
                            <div className="font-bold text-slate-800 truncate" title={call.inmateName}>
                              {call.inmateName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5 truncate" title={call.familyPhone || '-'}>
                              <span>→</span>
                              <span className="truncate">{call.familyPhone || '-'}</span>
                            </div>
                          </td>

                          {/* UPT */}
                          <td className={`py-3.5 px-4 text-slate-700 ${isSplitView ? 'hidden' : 'table-cell'}`}>
                            <span className="font-medium text-slate-700 text-xs truncate max-w-[160px] block" title={resolvedUptName}>
                              {resolvedUptName}
                            </span>
                          </td>

                          {/* Durasi & Biaya + Badge Jalur */}
                          <td className={`py-3.5 px-4 whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
                            <div className="font-semibold text-slate-800">
                              {formatDuration(call.durationSeconds)}
                            </div>
                            <div className="text-[11px] font-bold text-amber-600 mt-0.5">
                              {formatCurrency(call.cost)}
                            </div>
                            {activeTab === 'voice' && (
                              <div className="mt-1">
                                <CallChannelBadge channel={call.channel} />
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <CallStatusBadge status={call.status} rawStatus={call.rawStatus} />
                            </div>
                          </td>

                          {/* Transkrip Button */}
                          <td className={`py-3.5 px-3 text-center whitespace-nowrap ${isSplitView ? 'hidden' : 'table-cell'}`}>
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
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
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
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <SearchX className="w-10 h-10 mb-2 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-600">Belum ada data</p>
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

        {/* Panel Pemutar Audio Standar PasCall */}
        {selectedRecording && (
          <div className="w-full xl:w-[380px] shrink-0 sticky top-4 animate-in fade-in slide-in-from-right-3 duration-300">
            <AudioPlayerPanel
              call={selectedRecording}
              onClose={() => setSelectedRecording(null)}
            />
          </div>
        )}

      </div>

      {/* MODAL TRANSKRIP PERCAKAPAN LENGKAP */}
      {transcriptModalCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Transkrip Percakapan</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {transcriptModalCall.inmateName} (NIP: {transcriptModalCall.inmateId}) → {transcriptModalCall.familyPhone || '-'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setTranscriptModalCall(null)}
                className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Percakapan */}
            <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-700 bg-slate-50/50 flex-1 whitespace-pre-line">
              {transcriptModalCall.transcript ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs font-normal">
                  {transcriptModalCall.transcript}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Info className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-600">Transkrip Belum Tersedia</p>
                  <p className="text-[11px] mt-0.5">Sistem rekaman audio sedang melakukan transkripsi otomatis.</p>
                </div>
              )}
            </div>

            {/* Footer Modal Action */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
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
                        uptName: transcriptModalCall.branchName || 'Lapas Pusat',
                        printedBy: `${userName || 'Super Administrator'} (Super Administrator)`,
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

export default CallsList;
