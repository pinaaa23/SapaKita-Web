import React, { useState } from 'react';
import { 
  PhoneCall, 
  PhoneMissed,
  PhoneForwarded,
  ShieldCheck,
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
import { mockCalls, mockVideoCalls } from '../../services/mockData';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'video'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State khusus untuk audio preview playback (hanya diset saat tombol Play diklik)
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // State khusus untuk Modal Transkrip (independen dari selectedRecording)
  const [transcriptCall, setTranscriptCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  
  const [toastMessage, setToastMessage] = useState(null);

  // Filter calls for Branch 1 (Cipinang)
  const branchVoiceCalls = mockCalls.filter(c => c.branchId === 'b1');
  const branchVideoCalls = mockVideoCalls.filter(c => c.branchId === 'b1');

  // Combined for stats or tab-specific
  const currentTabCalls = activeTab === 'voice' ? branchVoiceCalls : branchVideoCalls;

  // Calculate statistics (4 StatCards: Total Panggilan, Panggilan Terjawab, Tidak Terjawab, WBP Terverifikasi)
  const totalBranchCallsCount = branchVoiceCalls.length + branchVideoCalls.length;
  const answeredCount = branchVoiceCalls.filter(c => c.status === 'Answered').length + branchVideoCalls.filter(c => c.status === 'Answered').length;
  const missedCount = branchVoiceCalls.filter(c => c.status !== 'Answered').length + branchVideoCalls.filter(c => c.status !== 'Answered').length;

  const stats = {
    totalCalls: totalBranchCallsCount,
    answered: answeredCount,
    missed: missedCount,
    verifiedInmates: 88 // 88% WBP kontak keluarga terverifikasi KTP
  };

  const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value);
  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

  const filteredCalls = currentTabCalls.filter(call => {
    const isSearchMatch = searchTerm === '' || 
                          call.inmateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          call.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          call.inmateId.toLowerCase().includes(searchTerm.toLowerCase());
    const isStatusMatch = statusFilter === 'All' || 
                          (statusFilter === 'Answered' && call.status === 'Answered') ||
                          (statusFilter === 'Missed' && call.status !== 'Answered');
    return isSearchMatch && isStatusMatch;
  });

  const handleSelectRecording = (call) => {
    if (!call.hasRecording) return;
    setSelectedRecording(call);
    setIsPlaying(true); // Auto play audio preview when selected
  };

  // Membuka modal transkrip langsung tanpa mempengaruhi selectedRecording
  const handleOpenTranscript = (call) => {
    if (!call.hasRecording) return;
    setTranscriptCall(call);
    setShowTranscriptModal(true);
  };

  const handleOpenTranscriptFromPreview = () => {
    if (!selectedRecording) return;
    setTranscriptCall(selectedRecording);
    setShowTranscriptModal(true);
  };

  const handleCloseTranscriptModal = () => {
    setShowTranscriptModal(false);
    setTranscriptCall(null);
  };

  const togglePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

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
    const prefix = selectedRecording.callType === 'Video' ? 'Rekaman_Audio_VideoCall' : 'Rekaman_VoiceCall';
    const filename = `${prefix}_${safeName}_${dateStr}.wav`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`File audio rekaman (${filename}) berhasil diunduh!`);
  };

  const handleDownloadTranscript = (targetCall) => {
    const callTarget = targetCall || transcriptCall || selectedRecording;
    if (!callTarget) return;
    const safeName = callTarget.inmateName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date(callTarget.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const durationStr = formatSeconds(callTarget.durationSeconds);
    const callTypeName = callTarget.callType === 'Video' ? 'VIDEO CALL (AUDIO ONLY)' : 'SUARA (VOICE CALL)';
    const filename = `Transkrip_${callTarget.callType || 'Voice'}_${safeName}_${callTarget.date.split('T')[0]}.txt`;
    
    const textContent = `==================================================
PAS CALL - TRANSKRIP REKAMAN PANGGILAN ${callTypeName}
==================================================
ID Panggilan : ${callTarget.id}
Tipe Layanan : ${callTarget.callType === 'Video' ? 'Video Call (Perekaman Audio Sah)' : 'Voice Call'}
Narapidana   : ${callTarget.inmateName} (${callTarget.inmateId})
Keluarga     : ${callTarget.familyName} (${callTarget.familyPhone})
Tanggal      : ${dateStr}
Durasi       : ${durationStr}
Cabang       : Lapas Kelas I Cipinang
Status       : Verified / Transkripsi AI Automatic
Catatan      : Perekaman hanya menyimpan berkas audio demi privasi & kepatuhan.
==================================================

[00:04] WBP - ${callTarget.inmateName}:
"Halo, Assalamu'alaikum Ibu, sehat kan di rumah sama anak-anak?"

[00:12] KLG - ${callTarget.familyName}:
"Wa'alaikumsalam. Alhamdulillah sehat Pak. Bapak gimana kondisinya di sana? Sehat kan?"

[00:26] WBP - ${callTarget.inmateName}:
"Alhamdulillah Bapak sehat Bu. Makanan di sini teratur, petugas juga ramah. Anak-anak gimana sekolahnya?"

[00:45] KLG - ${callTarget.familyName}:
"Alhamdulillah lancar Pak, si adik kemarin dapet nilai 90 ulangan Matematika. Tadi sebelum sekolah pamit nitip salam buat Bapak."

[01:05] WBP - ${callTarget.inmateName}:
"Pintar anak Bapak. Titip salam balik ya Ibu, bilang Bapak selalu doakan anak-anak dari sini. Jaga kesehatan ya Bu."

==================================================
Dokumen resmi diproses secara otomatis oleh PasCall System.
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`File transkrip (${filename}) berhasil diunduh!`);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const formatSeconds = (seconds) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
        <StatCard 
          title="Total Panggilan" 
          value={formatNumber(stats.totalCalls)} 
          icon={PhoneCall} 
          color="blue"
          trend="up"
          trendValue="12.5"
        />
        <StatCard 
          title="Panggilan Terjawab" 
          value={formatNumber(stats.answered)} 
          icon={PhoneForwarded} 
          color="teal"
          trend="up"
          trendValue="8.2"
        />
        <StatCard 
          title="Tidak Terjawab" 
          value={formatNumber(stats.missed)} 
          icon={PhoneMissed} 
          color="pink"
          trend="down"
          trendValue="2.1"
        />
        <StatCard 
          title="WBP Terverifikasi" 
          value={`${stats.verifiedInmates}%`} 
          icon={ShieldCheck} 
          color="purple"
          trend="up"
          trendValue="6.4"
        />
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
                      placeholder="Cari nomor / nama..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/60"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
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
                <div className="flex items-center gap-6">
                  {/* Tab 1: Voice Call */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('voice');
                      setSelectedRecording(null);
                    }}
                    className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeTab === 'voice' 
                        ? 'text-primary' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 ${activeTab === 'voice' ? 'text-primary' : 'text-slate-400'}`} />
                    <span>Voice Call</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'voice' ? 'bg-blue-100 text-primary' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {branchVoiceCalls.length}
                    </span>
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
                    }}
                    className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                      activeTab === 'video' 
                        ? 'text-primary' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Video className={`w-4 h-4 ${activeTab === 'video' ? 'text-primary' : 'text-slate-400'}`} />
                    <span>Video Call</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'video' ? 'bg-blue-100 text-primary' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {branchVideoCalls.length}
                    </span>
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
                    <strong>Pemberitahuan Sistem:</strong> Pada layanan Video Call, sistem <strong>hanya merekam berkas audio</strong> percakapan untuk kepatuhan privasi dan enkripsi data Lapas. Transkrip AI dan tombol putar audio tetap aktif.
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
                  {filteredCalls.length > 0 ? (
                    filteredCalls.map((call) => {
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
                                title={`Lihat Transkrip Percakapan Audio ${call.callType === 'Video' ? 'Video Call' : 'Voice Call'}`}
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
                                disabled={!call.hasRecording}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-primary text-white shadow-md shadow-blue-500/20 scale-105' 
                                    : 'bg-blue-50 text-primary hover:bg-blue-100'
                                } disabled:opacity-40 disabled:cursor-not-allowed`} 
                                title={call.hasRecording ? `Putar Audio Rekaman (${call.callType === 'Video' ? 'Video Call' : 'Voice Call'})` : "Tidak ada rekaman"}
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
                          <p className="font-semibold text-xs text-slate-600">Data panggilan tidak ditemukan</p>
                          <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter status</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            {filteredCalls.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 bg-slate-50/40">
                <span>Menampilkan 1-{filteredCalls.length} dari {filteredCalls.length} data ({activeTab === 'voice' ? 'Voice Call' : 'Video Call'})</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-not-allowed">Prev</button>
                  <button type="button" className="px-3 py-1 border border-primary bg-primary text-white rounded-lg font-bold shadow-xs">1</button>
                  <button type="button" disabled className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-not-allowed">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Audio Player Preview Card (When a recording is selected) */}
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
                  {selectedRecording.callType === 'Video' && (
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-amber-300/30">
                      Audio
                    </span>
                  )}
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

                {/* Scrubber / Waveform indicator */}
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
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] uppercase font-bold text-amber-300">
                      {selectedRecording.callType === 'Video' ? 'Video Call (Audio)' : 'Voice Call'}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-white truncate">
                    {selectedRecording.inmateName} → {selectedRecording.familyName}
                  </p>
                  <p className="text-[11px] text-blue-200 font-medium mt-0.5">
                    {new Date(selectedRecording.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(selectedRecording.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={handleDownloadAudio}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-white text-[#0B3D91] py-2 px-3 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-md cursor-pointer"
                    title="Unduh Rekaman Audio"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Audio
                  </button>
                  <button 
                    type="button" 
                    onClick={handleOpenTranscriptFromPreview}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white py-2 px-3 rounded-xl text-xs font-bold border border-white/25 transition-all cursor-pointer"
                    title="Buka Transkrip Percakapan"
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-800">
                      Transkrip {transcriptCall.callType === 'Video' ? 'Video Call' : 'Voice Call'}
                    </h3>
                    {transcriptCall.callType === 'Video' && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                        Audio Only
                      </span>
                    )}
                  </div>
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

            {/* Modal Info Sub-header */}
            <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Tanggal:</span> {new Date(transcriptCall.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Durasi Audio:</span> {formatSeconds(transcriptCall.durationSeconds)}
              </div>
            </div>

            {/* Modal Body / Dialogue */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Speaker 1: Narapidana */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  WBP
                </div>
                <div className="flex-1 bg-slate-100/80 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tl-none border border-slate-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{transcriptCall.inmateName}</span>
                    <span className="text-[10px] text-slate-400">00:04</span>
                  </div>
                  <p className="leading-relaxed">"Halo, Assalamu'alaikum Ibu, sehat kan di rumah sama anak-anak?"</p>
                </div>
              </div>

              {/* Speaker 2: Keluarga */}
              <div className="flex gap-3 items-start flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  KLG
                </div>
                <div className="flex-1 bg-amber-50/70 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tr-none border border-amber-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-700">{transcriptCall.familyName}</span>
                    <span className="text-[10px] text-slate-400">00:12</span>
                  </div>
                  <p className="leading-relaxed">"Wa'alaikumsalam. Alhamdulillah sehat Pak. Bapak gimana kondisinya di sana? Sehat kan?"</p>
                </div>
              </div>

              {/* Speaker 1: Narapidana */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  WBP
                </div>
                <div className="flex-1 bg-slate-100/80 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tl-none border border-slate-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{transcriptCall.inmateName}</span>
                    <span className="text-[10px] text-slate-400">00:26</span>
                  </div>
                  <p className="leading-relaxed">"Alhamdulillah Bapak sehat Bu. Makanan di sini teratur, petugas juga ramah. Anak-anak gimana sekolahnya?"</p>
                </div>
              </div>

              {/* Speaker 2: Keluarga */}
              <div className="flex gap-3 items-start flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  KLG
                </div>
                <div className="flex-1 bg-amber-50/70 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tr-none border border-amber-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-700">{transcriptCall.familyName}</span>
                    <span className="text-[10px] text-slate-400">00:45</span>
                  </div>
                  <p className="leading-relaxed">"Alhamdulillah lancar Pak, si adik kemarin dapet nilai 90 ulangan Matematika. Tadi sebelum sekolah pamit nitip salam buat Bapak."</p>
                </div>
              </div>

              {/* Speaker 1: Narapidana */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  WBP
                </div>
                <div className="flex-1 bg-slate-100/80 rounded-2xl p-3.5 text-xs text-slate-800 rounded-tl-none border border-slate-200/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-primary">{transcriptCall.inmateName}</span>
                    <span className="text-[10px] text-slate-400">01:05</span>
                  </div>
                  <p className="leading-relaxed">"Pintar anak Bapak. Titip salam balik ya Ibu, bilang Bapak selalu doakan anak-anak dari sini. Jaga kesehatan ya Bu."</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Transkripsi AI Otomatis PasCall
              </span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    handleDownloadTranscript(transcriptCall);
                    handleCloseTranscriptModal();
                  }}
                  className="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Transkrip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

