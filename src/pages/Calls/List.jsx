import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Play, 
  Pause,
  FileText, 
  Loader2, 
  Download,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { mockCalls, mockBranches } from '../../services/mockData';
import { exportToCSV } from '../../utils/exportUtils';

const List = () => {
  const navigate = useNavigate();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State for Audio Recording Player
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // State for Transcript Modal
  const [transcriptCall, setTranscriptCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Derived data
  const branchesMap = mockBranches.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});

  // Filtering Logic
  const filteredCalls = mockCalls.filter(call => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                          call.inmateName.toLowerCase().includes(searchLower) || 
                          call.inmateId.toLowerCase().includes(searchLower) ||
                          call.familyName.toLowerCase().includes(searchLower) ||
                          (call.familyPhone && call.familyPhone.includes(searchLower));
    
    const matchesBranch = branchFilter === 'All' || call.branchId === branchFilter;
    const matchesStatus = statusFilter === 'All' || call.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const formatDuration = (seconds) => {
    if (seconds === 0) return '-';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatCurrency = (value) => {
    if (value === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Audio Player handlers
  const handleSelectRecording = (call) => {
    if (!call.hasRecording) return;
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

  // Audio generator for realistic WAV download
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const createAudioBlob = () => {
    const sampleRate = 44100;
    const duration = 3;
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin((Math.PI * i) / numSamples);
      const sample = Math.sin(2 * Math.PI * 523.25 * t) * 0.3 * envelope;
      const intSample = Math.max(-1, Math.min(1, sample)) * 32767;
      view.setInt16(44 + i * 2, intSample, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const handleDownloadAudio = () => {
    if (!selectedRecording) return;
    const blob = createAudioBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = selectedRecording.inmateName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date(selectedRecording.date).toISOString().split('T')[0];
    const filename = `Rekaman_${safeName}_${dateStr}.wav`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`File audio rekaman (${filename}) berhasil diunduh!`);
  };

  // Transcript Modal handlers
  const handleOpenTranscript = (call) => {
    setTranscriptCall(call);
    setShowTranscriptModal(true);
  };

  const handleCloseTranscriptModal = () => {
    setShowTranscriptModal(false);
    setTranscriptCall(null);
  };

  const handleDownloadTranscript = (callTarget) => {
    const target = callTarget || transcriptCall || selectedRecording;
    if (!target) return;
    const safeName = target.inmateName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Transkrip_${safeName}_${target.date.split('T')[0]}.txt`;
    
    const textContent = `==================================================
PAS CALL - TRANSKRIP REKAMAN PANGGILAN SUARA
==================================================
ID Panggilan : ${target.id}
Cabang       : ${branchesMap[target.branchId] || target.branchId}
Narapidana   : ${target.inmateName} (${target.inmateId})
Keluarga     : ${target.familyName} (${target.familyPhone})
Tanggal      : ${new Date(target.date).toLocaleString('id-ID')}
Durasi       : ${formatDuration(target.durationSeconds)}
Status       : ${target.status}
Biaya        : ${formatCurrency(target.cost)}
==================================================

[00:04] ${target.inmateName}:
"Halo, Assalamu'alaikum Ibu, sehat kan di rumah sama anak-anak?"

[00:12] ${target.familyName}:
"Wa'alaikumsalam. Alhamdulillah sehat Pak. Bapak gimana kondisinya di sana? Sehat kan?"

[00:26] ${target.inmateName}:
"Alhamdulillah Bapak sehat Bu. Makanan di sini teratur, petugas juga ramah. Anak-anak gimana sekolahnya?"

[00:45] ${target.familyName}:
"Alhamdulillah lancar Pak, si adik kemarin dapet nilai 90 ulangan Matematika. Tadi sebelum sekolah pamit nitip salam buat Bapak."

[01:05] ${target.inmateName}:
"Pintar anak Bapak. Titip salam balik ya Ibu, bilang Bapak selalu doakan anak-anak dari sini. Jaga kesehatan ya Bu."

==================================================
Transkrip ini diverifikasi oleh Sistem AI PasCall
==================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Transkrip (${filename}) berhasil diunduh!`);
  };

  const handleExport = () => {
    const exportData = filteredCalls.map(c => ({
      'ID Panggilan': c.id,
      'Cabang': branchesMap[c.branchId] || c.branchId,
      'Nama WBP': c.inmateName,
      'ID WBP': c.inmateId,
      'Keluarga': c.familyName,
      'No Telp': c.familyPhone,
      'Durasi (Detik)': c.durationSeconds,
      'Biaya': c.cost,
      'Status': c.status,
      'Waktu': new Date(c.date).toLocaleString('id-ID'),
      'Rekaman': c.hasRecording ? 'Tersedia' : 'Tidak Ada',
      'Transkrip': c.transcriptStatus || '-'
    }));
    exportToCSV(exportData, `Riwayat_Panggilan_PasCall_${new Date().toISOString().split('T')[0]}`);
  };

  const hasActiveFilters = searchTerm !== '' || branchFilter !== 'All' || statusFilter !== 'All';

  const resetFilters = () => {
    setSearchTerm('');
    setBranchFilter('All');
    setStatusFilter('All');
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
          {/* Robust Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari nama WBP, ID Napi, kontak keluarga, atau nomor telepon..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Action */}
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

            {/* Cabang Filter Dropdown */}
            <div className="relative">
              <select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold appearance-none cursor-pointer transition-all ${
                  branchFilter !== 'All' 
                    ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs' 
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <option value="All">Semua Cabang</option>
                {mockBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Segmented Tabs */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Answered', label: 'Answered' },
                { key: 'No Answer', label: 'No Answer' },
                { key: 'Busy', label: 'Busy' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setStatusFilter(item.key)}
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

            {/* Reset Filters */}
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

          {/* Result Count Info */}
          <div className="text-slate-400 text-[11px] font-medium ml-auto">
            Menampilkan <strong className="text-slate-700 font-bold">{filteredCalls.length}</strong> dari {mockCalls.length} panggilan
          </div>
        </div>
      </div>

      {/* Main Content Area: Flex layout with Table on the Left and Preview Card on the RIGHT */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        
        {/* Table Card (Left Side, flexible width, smoothly shifts when preview is open) */}
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
                {filteredCalls.length > 0 ? (
                  filteredCalls.map((call) => {
                    const isCurrentPlaying = selectedRecording?.id === call.id && isPlaying;
                    const isCurrentSelected = selectedRecording?.id === call.id;

                    return (
                      <tr 
                        key={call.id} 
                        className={`transition-colors ${
                          isCurrentSelected ? 'bg-blue-50/60 border-l-4 border-l-primary' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Waktu */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="font-bold text-slate-800 text-[11.5px]">
                            {new Date(call.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-slate-400 text-[10.5px] font-medium">
                            {new Date(call.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </td>

                        {/* Narapidana (Nama + Clean Inmate ID) */}
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-800 text-[11.5px] truncate max-w-[110px]" title={call.inmateName}>
                            {call.inmateName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
                            {call.inmateId}
                          </p>
                        </td>

                        {/* Keluarga */}
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800 text-[11.5px] truncate max-w-[105px]" title={call.familyName}>
                            {call.familyName}
                          </p>
                          <p className="text-slate-400 text-[10px] font-medium mt-0.5 truncate max-w-[105px]">{call.familyPhone}</p>
                        </td>

                        {/* Cabang */}
                        <td className="px-3 py-2.5 text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11.5px] truncate max-w-[115px]" title={branchesMap[call.branchId] || call.branchId}>
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{branchesMap[call.branchId] || call.branchId}</span>
                          </span>
                        </td>

                        {/* Status */}
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

                        {/* Durasi & Biaya */}
                        <td className="px-2 py-2.5 text-center whitespace-nowrap">
                          <p className="text-slate-800 font-bold text-[11px]">
                            {formatDuration(call.durationSeconds)}
                          </p>
                          <p className="text-[10px] font-bold text-amber-600">
                            {formatCurrency(call.cost)}
                          </p>
                        </td>

                        {/* Rekaman (Tombol Play/Pause untuk trigger preview di kanan) */}
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

                        {/* Transkrip (Modal Pop-up) */}
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
                          ) : call.transcriptStatus === 'Processing' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold border border-blue-100">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Process
                            </span>
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
                      <p className="font-semibold text-slate-700 text-sm">Tidak ada riwayat panggilan yang sesuai</p>
                      <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter cabang & status.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
            <div className="text-[11px]">Menampilkan <strong className="text-slate-800 font-bold">{filteredCalls.length}</strong> dari {mockCalls.length} data</div>
            <div className="flex gap-1.5">
              <button className="px-3 py-1 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold text-[11px] transition-colors shadow-2xs" disabled>
                Prev
              </button>
              <button className="px-3 py-1 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold text-[11px] transition-colors shadow-2xs" disabled>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Preview Rekaman Card (Ditempatkan di sebelah KANAN tabel, persis dashboard admin cabang) */}
        {selectedRecording && (
          <div className="w-full lg:w-72 xl:w-76 shrink-0 space-y-4 animate-in slide-in-from-right-4 duration-300 sticky top-4">
            <div className="bg-gradient-to-br from-[#0B3D91] via-[#1E5FCC] to-slate-800 text-white rounded-2xl shadow-xl shadow-blue-950/20 border border-blue-400/20 overflow-hidden flex flex-col">
              
              {/* Card Header */}
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
                  title="Tutup Preview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Audio Player Controller UI */}
              <div className="p-4 flex-1 flex flex-col items-center justify-center bg-white/5 border-b border-white/15">
                <button 
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-13 h-13 bg-white text-[#0B3D91] rounded-full shadow-2xl flex items-center justify-center mb-3 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                  title={isPlaying ? "Jeda Audio" : "Putar Audio"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-[#0B3D91] fill-current" />
                  ) : (
                    <Play className="w-5 h-5 text-[#0B3D91] ml-0.5 fill-current" />
                  )}
                </button>

                {/* Waveform / Progress bar */}
                <div 
                  className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2 cursor-pointer relative"
                  onClick={togglePlayAudio}
                >
                  <div 
                    className={`bg-amber-400 h-full rounded-full transition-all duration-300 ${isPlaying ? 'w-3/5' : 'w-1/5'}`}
                  ></div>
                </div>
                <div className="flex justify-between w-full text-[10.5px] text-blue-200 font-semibold font-mono">
                  <span>{isPlaying ? '02:15' : '00:00'}</span>
                  <span>{formatDuration(selectedRecording.durationSeconds)}</span>
                </div>
              </div>

              {/* Call Details Info */}
              <div className="p-3.5 bg-white/10 space-y-2.5">
                <div>
                  <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded text-blue-100 font-bold">
                    {selectedRecording.inmateId}
                  </span>
                  <p className="text-xs font-black text-white truncate mt-1">
                    {selectedRecording.inmateName} <span className="text-blue-200 font-normal">→</span> {selectedRecording.familyName}
                  </p>
                  <p className="text-[10.5px] text-blue-200 font-medium mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-300 shrink-0" />
                    <span className="truncate">{branchesMap[selectedRecording.branchId] || selectedRecording.branchId}</span>
                  </p>
                  <p className="text-[10px] text-blue-300/80 font-medium mt-0.5">
                    {new Date(selectedRecording.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(selectedRecording.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={handleDownloadAudio}
                    className="flex-1 flex justify-center items-center gap-1 bg-white text-[#0B3D91] py-1.5 px-2.5 rounded-xl text-[11px] font-bold hover:bg-blue-50 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Unduh
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleOpenTranscript(selectedRecording)}
                    className="flex-1 flex justify-center items-center gap-1 bg-white/15 hover:bg-white/25 text-white py-1.5 px-2.5 rounded-xl text-[11px] font-bold border border-white/25 transition-all cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-white" /> Transkrip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Pop-up Modal Transkrip Percakapan */}
      {showTranscriptModal && transcriptCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Transkrip Percakapan Voice</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {transcriptCall.inmateName} ({transcriptCall.inmateId}) &amp; {transcriptCall.familyName}
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

            {/* Modal Subheader Info */}
            <div className="px-5 py-3 bg-blue-50/60 border-b border-blue-100/60 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold text-slate-800">{branchesMap[transcriptCall.branchId] || transcriptCall.branchId}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Durasi:</span> {formatDuration(transcriptCall.durationSeconds)}
              </div>
            </div>

            {/* Modal Body: Dialogue Chat Bubbles */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Speaker 1: WBP */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  WBP
                </div>
                <div className="flex-1 bg-slate-100/90 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tl-none border border-slate-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{transcriptCall.inmateName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">00:04</span>
                  </div>
                  <p className="leading-relaxed">"Halo, Assalamu'alaikum Ibu, sehat kan di rumah sama anak-anak?"</p>
                </div>
              </div>

              {/* Speaker 2: Keluarga */}
              <div className="flex gap-3 items-start flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  KLG
                </div>
                <div className="flex-1 bg-amber-50/80 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tr-none border border-amber-200/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-700">{transcriptCall.familyName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">00:12</span>
                  </div>
                  <p className="leading-relaxed">"Wa'alaikumsalam. Alhamdulillah sehat Pak. Bapak gimana kondisinya di sana? Sehat kan?"</p>
                </div>
              </div>

              {/* Speaker 1: WBP */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  WBP
                </div>
                <div className="flex-1 bg-slate-100/90 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tl-none border border-slate-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{transcriptCall.inmateName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">00:26</span>
                  </div>
                  <p className="leading-relaxed">"Alhamdulillah Bapak sehat Bu. Makanan di sini teratur, petugas juga ramah. Anak-anak gimana sekolahnya?"</p>
                </div>
              </div>

              {/* Speaker 2: Keluarga */}
              <div className="flex gap-3 items-start flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  KLG
                </div>
                <div className="flex-1 bg-amber-50/80 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tr-none border border-amber-200/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-700">{transcriptCall.familyName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">00:45</span>
                  </div>
                  <p className="leading-relaxed">"Alhamdulillah lancar Pak, si adik kemarin dapet nilai 90 ulangan Matematika. Tadi sebelum sekolah pamit nitip salam buat Bapak."</p>
                </div>
              </div>

              {/* Speaker 1: WBP */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  WBP
                </div>
                <div className="flex-1 bg-slate-100/90 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tl-none border border-slate-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{transcriptCall.inmateName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">01:05</span>
                  </div>
                  <p className="leading-relaxed">"Pintar anak Bapak. Titip salam balik ya Ibu, bilang Bapak selalu doakan anak-anak dari sini. Jaga kesehatan ya Bu."</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Transkripsi AI PasCall
              </span>
              <button 
                type="button" 
                onClick={() => {
                  handleDownloadTranscript(transcriptCall);
                  handleCloseTranscriptModal();
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
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

export default List;
