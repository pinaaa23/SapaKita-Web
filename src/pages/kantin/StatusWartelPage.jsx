import React, { useState } from 'react';
import { 
  RefreshCw, 
  PhoneCall, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Plus, 
  Wrench, 
  Edit3, 
  Trash2, 
  Check, 
  Phone, 
  Video, 
  SlidersHorizontal,
  Info,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import RingkasanWartel from '../../components/kantin/RingkasanWartel';
import KartuWartel from '../../components/kantin/KartuWartel';
import { useStatusWartel } from '../../hooks/useStatusWartel';
import { 
  addCustomBooth, 
  updateCustomBooth, 
  deleteCustomBooth, 
  resetCustomBoothsToDefault 
} from '../../services/kantin/wartelService';

export default function StatusWartelPage() {
  const {
    daftar,
    summary,
    isLoading,
    isRefreshing,
    error,
    lastUpdatedTime,
    now,
    waktuServerOffset,
    toasts,
    dismissToast,
    newlyAvailableIds,
    refetch,
  } = useStatusWartel({ enableTicker: true });

  // State Modal Tambah / Sesuaikan Bilik
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState(null); // null = Tambah Baru, object = Edit
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nomor: '',
    nama: '',
    tipe: 'telepon',
    lokasi: 'Bilik Utama Lapas',
    status: 'tersedia',
  });
  const [formError, setFormError] = useState('');

  const showFeedback = (msg, type = 'success') => {
    setFeedbackToast({ text: msg, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filter daftar wartel berdasarkan status
  const digunakanList = daftar.filter((item) => item.status === 'digunakan');
  const tersediaList = daftar.filter((item) => item.status === 'tersedia');
  const perbaikanList = daftar.filter((item) => item.status === 'perbaikan');

  // Urutkan SEDANG DIGUNAKAN berdasarkan sisa waktu paling sedikit di atas
  const digunakanSorted = [...digunakanList].sort((a, b) => {
    const sisaA = (a.estimasiSelesai || 0) - (now + waktuServerOffset);
    const sisaB = (b.estimasiSelesai || 0) - (now + waktuServerOffset);
    return sisaA - sisaB;
  });

  // Urutkan TERSEDIA tetap berdasarkan nomor wartel
  const tersediaSorted = [...tersediaList].sort((a, b) =>
    String(a.nomor || a.nama || a.id).localeCompare(String(b.nomor || b.nama || b.id), undefined, { numeric: true })
  );

  // Urutkan PERBAIKAN berdasarkan nomor wartel
  const perbaikanSorted = [...perbaikanList].sort((a, b) =>
    String(a.nomor || a.nama || a.id).localeCompare(String(b.nomor || b.nama || b.id), undefined, { numeric: true })
  );

  // Buka Modal Tambah Bilik Baru
  const handleOpenAddModal = () => {
    setEditingBooth(null);
    const nextNum = String(daftar.length + 1).padStart(2, '0');
    setFormData({
      nomor: nextNum,
      nama: `Wartel ${nextNum}`,
      tipe: 'telepon',
      lokasi: 'Bilik Utama Lapas',
      status: 'tersedia',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Buka Modal Edit / Sesuaikan Bilik yang Sudah Ada
  const handleOpenEditModal = (booth) => {
    setEditingBooth(booth);
    setFormData({
      nomor: booth.nomor || '',
      nama: booth.nama || `Wartel ${booth.nomor}`,
      tipe: booth.tipe || 'telepon',
      lokasi: booth.lokasi || 'Bilik Utama Lapas',
      status: booth.status || 'tersedia',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Simpan Form (Tambah Baru atau Update)
  const handleSaveBooth = async (e) => {
    e.preventDefault();
    if (!formData.nomor.trim()) {
      setFormError('Nomor bilik wajib diisi.');
      return;
    }

    try {
      if (editingBooth) {
        await updateCustomBooth(editingBooth.id, {
          nomor: formData.nomor,
          nama: formData.nama,
          tipe: formData.tipe,
          lokasi: formData.lokasi,
          status: formData.status,
        });
        showFeedback(`Bilik "${formData.nama}" berhasil diperbarui.`);
      } else {
        await addCustomBooth({
          nomor: formData.nomor,
          nama: formData.nama,
          tipe: formData.tipe,
          lokasi: formData.lokasi,
          status: formData.status,
        });
        showFeedback(`Bilik "${formData.nama}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan bilik wartel.');
    }
  };

  // Hapus Bilik
  const handleDeleteBooth = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus ${name}?`)) {
      return;
    }
    await deleteCustomBooth(id);
    showFeedback(`${name} berhasil dihapus.`);
    setIsModalOpen(false);
    refetch();
  };

  // Reset ke Standar 10 Bilik
  const handleResetToDefault = () => {
    resetCustomBoothsToDefault();
    setIsResetConfirmOpen(false);
    showFeedback('Konfigurasi bilik berhasil dikembalikan ke 10 bilik standar.');
    refetch();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 relative">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-top-2 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast.text}</span>
        </div>
      )}

      {/* Toast Notifications untuk Wartel yang baru tersedia */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 fade-in duration-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.text}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Banner Kuning ketika Pengambilan Data Gagal */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">
              Gagal memperbarui data dari server. Menampilkan konfigurasi bilik lokal kasir.
            </span>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isRefreshing ? 'Mencoba...' : 'Coba lagi'}
          </button>
        </div>
      )}

      {/* 1. Page Header Terpadu dengan Tombol Tambah Bilik & Segarkan */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              Monitoring Bilik
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Kantin Lapas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Status Ketersediaan Wartel
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Pantau ketersediaan bilik wartel di lapas secara real-time. Anda dapat menambah, mengedit, atau menyesuaikan jumlah bilik sesuai kondisi fisik wartel cabang.
          </p>
        </div>

        {/* Toolbar Tombol Aksi: Tambah Bilik, Refresh, Info Pembaruan */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {lastUpdatedTime && (
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 text-[11px] font-semibold text-slate-500 shadow-2xs">
              Diperbarui: <strong className="text-slate-700 font-mono">{lastUpdatedTime}</strong>
            </div>
          )}

          <button
            type="button"
            onClick={refetch}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs hover:shadow-xs rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Muat ulang status bilik real-time"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-600 transition-transform ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
          </button>

          {/* Tombol Utama: Tambah Bilik Baru */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1565C0] to-[#0D47A1] hover:from-[#0D47A1] hover:to-[#0A3880] text-white font-bold text-xs shadow-sm shadow-blue-600/20 rounded-xl transition cursor-pointer active:scale-95"
            title="Tambah bilik wartel baru untuk cabang ini"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bilik</span>
          </button>

          {/* Opsi Reset ke 10 Bilik Standar */}
          {daftar.length !== 10 && (
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl shadow-2xs transition cursor-pointer"
              title="Kembalikan ke 10 bilik standar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Kartu Ringkasan (Total / Tersedia / Digunakan / Perbaikan) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <RingkasanWartel summary={summary} />
      )}

      {/* 3. BAGIAN 1: Sedang Digunakan (Diurutkan sisa waktu tersedikit) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sedang Digunakan ({summary.digunakan})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Bilik dalam panggilan aktif (diurutkan sisa waktu tercepat selesai)
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-2xl" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-slate-100 rounded-xl w-full mt-3" />
              </div>
            ))}
          </div>
        ) : digunakanSorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400">
            Tidak ada wartel yang sedang digunakan saat ini. Semua bilik siap dipakai.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {digunakanSorted.map((wartel) => (
              <KartuWartel
                key={wartel.id}
                wartel={wartel}
                now={now}
                waktuServerOffset={waktuServerOffset}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. BAGIAN 2: Tersedia (Chip / Pil Berjejer + Tombol Tambah Bilik Cepat) */}
      <section className="space-y-4 pt-6 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tersedia ({summary.tersedia})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Klik bilik untuk menyesuaikan nama/lokasi atau set perbaikan
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap gap-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="w-24 h-11 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {tersediaSorted.map((wartel) => {
                const displayNama = wartel.nama || wartel.nomor;
                const nomorDigit = wartel.nomor || displayNama.replace(/^[^\d]*/, '') || displayNama;
                const isNewlyAvailable = newlyAvailableIds.has(wartel.id);
                const isVideo = wartel.tipe === 'video';

                return (
                  <button
                    key={wartel.id}
                    type="button"
                    onClick={() => handleOpenEditModal(wartel)}
                    className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-emerald-800 font-bold text-sm shadow-2xs transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                      isNewlyAvailable
                        ? 'bg-emerald-200 border-emerald-500 ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300'
                    }`}
                    title={`${wartel.nama || `Wartel ${nomorDigit}`} (${wartel.lokasi || 'Bilik Lapas'}) - Klik untuk sesuaikan`}
                  >
                    {isVideo ? (
                      <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    )}
                    <span className="font-extrabold tracking-tight">
                      {nomorDigit}
                    </span>
                    <Edit3 className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </button>
                );
              })}

              {/* Tombol Tambah Bilik di samping pil */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Tambah bilik wartel baru"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Tambah Bilik</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. BAGIAN 3: Sedang Diperbaiki / Maintenance (Jika Ada) */}
      {perbaikanSorted.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200/80 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Dalam Perbaikan ({perbaikanSorted.length})
              </h3>
            </div>
            <span className="text-xs text-amber-600/80 font-medium">
              Bilik sedang pemeliharaan / handset rusak (klik untuk aktifkan kembali)
            </span>
          </div>

          <div className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {perbaikanSorted.map((wartel) => {
                const displayNama = wartel.nama || wartel.nomor;
                const nomorDigit = wartel.nomor || displayNama.replace(/^[^\d]*/, '') || displayNama;

                return (
                  <button
                    key={wartel.id}
                    type="button"
                    onClick={() => handleOpenEditModal(wartel)}
                    className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-100/70 hover:bg-amber-200/80 text-amber-900 font-bold text-sm shadow-2xs transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                    title={`${displayNama} - Sedang perbaikan. Klik untuk aktifkan kembali.`}
                  >
                    <Wrench className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-extrabold tracking-tight">
                      {nomorDigit}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-md ml-1">
                      Perbaikan
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / SESUAIKAN BILIK WARTEL                                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                  {editingBooth ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingBooth ? 'Sesuaikan Bilik Wartel' : 'Tambah Bilik Wartel Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingBooth
                      ? `Atur nomor, tipe, atau status ${editingBooth.nama || editingBooth.nomor}`
                      : 'Tambahkan unit bilik komunikasi baru di cabang ini'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBooth} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Input Nomor & Nama Bilik */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor / Kode Bilik *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 11"
                    value={formData.nomor}
                    onChange={(e) => {
                      const num = e.target.value;
                      setFormData({
                        ...formData,
                        nomor: num,
                        nama: formData.nama.startsWith('Wartel ') || !formData.nama ? `Wartel ${num}` : formData.nama,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Tampilan Bilik
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Wartel 11"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Tipe Panggilan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipe Layanan Bilik
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'telepon' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      formData.tipe === 'telepon'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Telepon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'video' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      formData.tipe === 'video'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'umum' })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      formData.tipe === 'umum'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Umum</span>
                  </button>
                </div>
              </div>

              {/* Lokasi / Penempatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lokasi / Posisi Bilik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bilik Utama Kantin / Blok A Lantai 1"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Status Bilik */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Bilik
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="tersedia">Tersedia (Siap Digunakan WBP)</option>
                  <option value="perbaikan">Sedang Perbaikan (Maintenance / Handset Rusak)</option>
                </select>
              </div>

              {/* Modal Footer Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingBooth ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBooth(editingBooth.id, editingBooth.nama || editingBooth.nomor)}
                    disabled={editingBooth.status === 'digunakan'}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40"
                    title={editingBooth.status === 'digunakan' ? 'Tidak dapat menghapus bilik saat sedang dalam panggilan' : 'Hapus bilik ini'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1565C0] to-[#0D47A1] hover:from-[#0D47A1] hover:to-[#0A3880] text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingBooth ? 'Simpan Perubahan' : 'Tambahkan Bilik'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET STANDAR 10 BILIK */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Kembalikan ke 10 Bilik Standar?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Daftar bilik akan diatur ulang menjadi Wartel 01 s/d Wartel 10. Bilik kustom tambahan akan direset.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Ya, Reset ke Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
