import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Power, 
  User, 
  Building2, 
  PhoneCall, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Contact, 
  Phone,
  FileText
} from 'lucide-react';
import Modal from '../../../components/Modal';
import { getInmateById, toggleInmateCommStatus, mockCalls } from '../../../services/mockData';

const InmatesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inmate, setInmate] = useState(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadInmate = () => {
    const found = getInmateById(id);
    setInmate(found ? { ...found } : null);
  };

  useEffect(() => {
    loadInmate();
  }, [id]);

  if (!inmate) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80">
        <h2 className="text-lg font-bold text-slate-700">Data Narapidana Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1">ID WBP "{id}" tidak terdaftar di sistem.</p>
        <Link to="/branch/inmates" className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleConfirmToggleCommStatus = () => {
    const updated = toggleInmateCommStatus(inmate.id);
    loadInmate();
    const actionText = updated?.commStatus === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan';
    setToastMessage(`Akun komunikasi ${inmate.name} berhasil ${actionText}!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filter dummy family contacts related to this inmate
  const relatedContacts = [
    { id: 'cnt-1', name: 'Siti Aminah', relation: 'Istri', phone: '081234567890', status: 'Approved', date: '2026-09-20' },
    { id: 'cnt-2', name: 'Budi Santoso (Orang Tua)', relation: 'Ayah', phone: '081234567891', status: 'Approved', date: '2026-09-18' },
    { id: 'cnt-3', name: 'Dewi Lestari', relation: 'Adik Kandung', phone: '081234567892', status: 'Pending', date: '2026-09-22' }
  ];

  // Filter call history for this inmate
  const inmateCalls = mockCalls.filter(c => c.inmateName.toLowerCase().includes(inmate.name.toLowerCase().split(' ')[0]) || c.branchId === 'b1').slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-2.5 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/branch/inmates"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setToggleModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              inmate.commStatus === 'Aktif' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {inmate.commStatus === 'Aktif' ? 'Nonaktifkan Akun Komunikasi' : 'Aktifkan Akun Komunikasi'}
          </button>

          <Link
            to={`/branch/inmates/${inmate.id}/edit`}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Data
          </Link>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* Avatar Thumbnail */}
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md p-1 border-2 border-white/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {inmate.photoUrl ? (
              <img src={inmate.photoUrl} alt={inmate.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <User className="w-12 h-12 text-white/90" />
            )}
          </div>

          {/* Core Inmate Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{inmate.name}</h2>
              <span className="font-mono text-xs font-bold bg-white/20 text-white px-3 py-0.5 rounded-full border border-white/30">
                {inmate.wbpRegNumber}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                inmate.status === 'Aktif' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' :
                inmate.status === 'Dipindahkan' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' :
                'bg-slate-500/30 text-slate-200 border border-slate-400/40'
              }`}>
                {inmate.status}
              </span>
            </div>

            <p className="text-blue-100 text-xs md:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Building2 className="w-4 h-4 text-blue-200" /> {inmate.branchName} • <strong className="text-white">{inmate.blockRoom}</strong>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-blue-100 font-medium">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-blue-300" /> Masuk: {new Date(inmate.entryDate).toLocaleDateString('id-ID')}
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <Wallet className="w-3.5 h-3.5 text-amber-300" /> Saldo Panggilan: <strong className="text-amber-300 font-extrabold">{formatCurrency(inmate.callBalance)}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                <span>Status Akun Komunikasi:</span>
                <span className={`font-bold ${inmate.commStatus === 'Aktif' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {inmate.commStatus}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Identitas Lengkap Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Rincian Identitas WBP
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Nama Lengkap</span>
              <span className="font-bold text-slate-800">{inmate.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">No. Registrasi WBP</span>
              <span className="font-bold font-mono text-slate-800">{inmate.wbpRegNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">NIK KTP</span>
              <span className="font-bold font-mono text-slate-800">{inmate.nik || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tempat & Tanggal Lahir</span>
              <span className="font-semibold text-slate-800">{inmate.birthPlace || '-'}, {inmate.birthDate || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Jenis Kelamin</span>
              <span className="font-semibold text-slate-800">{inmate.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Penempatan Blok / Kamar</span>
              <span className="font-bold text-blue-700">{inmate.blockRoom}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Kontak Keluarga & Riwayat Panggilan */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Kontak Keluarga Terdaftar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Contact className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-800">Kontak Keluarga Terdaftar</h3>
              </div>
              <Link to="/branch/contacts" className="text-xs font-bold text-primary hover:underline">
                Kelola Kontak →
              </Link>
            </div>

            <div className="p-4">
              <div className="divide-y divide-slate-100 text-xs">
                {relatedContacts.map((cnt) => (
                  <div key={cnt.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800">{cnt.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{cnt.relation} • <span className="font-mono">{cnt.phone}</span></p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      cnt.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      cnt.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {cnt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Riwayat Panggilan Terakhir */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-800">Riwayat Panggilan Terakhir</h3>
              </div>
              <Link to="/branch/dashboard" className="text-xs font-bold text-primary hover:underline">
                Lihat Semua →
              </Link>
            </div>

            <div className="p-4">
              <div className="divide-y divide-slate-100 text-xs">
                {inmateCalls.map((call) => (
                  <div key={call.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800">{call.familyName}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {new Date(call.date).toLocaleDateString('id-ID')} • Durasi: {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-600 block">{formatCurrency(call.cost)}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{call.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={handleConfirmToggleCommStatus}
        title={inmate.commStatus === 'Aktif' ? 'Konfirmasi Nonaktifkan Akun' : 'Konfirmasi Aktifkan Akun'}
        message={`Apakah Anda yakin ingin ${inmate.commStatus === 'Aktif' ? 'MENONAKTIFKAN' : 'MENGAKTIFKAN'} akun komunikasi PasCall milik ${inmate.name} (${inmate.wbpRegNumber})?`}
        confirmText={inmate.commStatus === 'Aktif' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={inmate.commStatus === 'Aktif'}
      />
    </div>
  );
};

export default InmatesDetail;
