import React from 'react';
import { RefreshCw, PhoneCall, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import RingkasanWartel from '../../components/kantin/RingkasanWartel';
import KartuWartel from '../../components/kantin/KartuWartel';
import { useStatusWartel } from '../../hooks/useStatusWartel';

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
  } = useStatusWartel();

  // Filter daftar wartel berdasarkan status
  const digunakanList = daftar.filter((item) => item.status === 'digunakan');
  const tersediaList = daftar.filter((item) => item.status === 'tersedia');

  // Requirement 4d: Urutkan SEDANG DIGUNAKAN berdasarkan sisa waktu paling sedikit di atas
  const digunakanSorted = [...digunakanList].sort((a, b) => {
    const sisaA = (a.estimasiSelesai || 0) - (now + waktuServerOffset);
    const sisaB = (b.estimasiSelesai || 0) - (now + waktuServerOffset);
    return sisaA - sisaB;
  });

  // Requirement 4d: Urutkan TERSEDIA tetap berdasarkan nomor wartel
  const tersediaSorted = [...tersediaList].sort((a, b) => a.id - b.id);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 relative">
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
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Requirement 4b: Banner Kuning ketika Pengambilan Data Gagal */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">
              Gagal memperbarui data. Data yang tampil mungkin sudah tidak terbaru.
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

      {/* 1. Header Halaman & Tombol Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shadow-2xs shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              Status Wartel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau ketersediaan wartel di cabang ini.
            </p>
          </div>
        </div>

        {/* Tombol Refresh & Teks Waktu Terakhir Diperbarui */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Requirement 4a: Teks kecil Diperbarui HH:MM:SS */}
          {lastUpdatedTime && (
            <span className="text-[11px] font-semibold text-slate-400">
              Diperbarui {lastUpdatedTime}
            </span>
          )}

          <button
            type="button"
            onClick={refetch}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs hover:shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#1565C0] transition-transform ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span>{isRefreshing ? 'Memperbarui...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. 3 Kartu Ringkasan (Total / Tersedia / Digunakan) */}
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
            {[1, 2, 3, 4, 5, 6].map((n) => (
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

      {/* 4. BAGIAN 2: Tersedia (Chip / Pil Berjejer Ringkas) */}
      <section className="space-y-4 pt-6 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tersedia ({summary.tersedia})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Bilik kosong siap pakai
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap gap-3 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="w-24 h-11 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : tersediaSorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-rose-200 p-8 text-center text-xs font-semibold text-rose-500">
            Seluruh bilik wartel sedang digunakan penuh saat ini.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {tersediaSorted.map((wartel) => {
                const displayNama = wartel.nama || wartel.nomor;
                const nomorDigit = displayNama.replace(/^[^\d]*/, '') || displayNama;
                const isNewlyAvailable = newlyAvailableIds.has(wartel.id);

                return (
                  <div
                    key={wartel.id}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-emerald-800 font-bold text-sm shadow-2xs transition-all duration-300 ${
                      isNewlyAvailable
                        ? 'bg-emerald-200 border-emerald-500 ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70'
                    }`}
                    title={`Wartel ${nomorDigit} - Tersedia`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span className="font-extrabold tracking-tight">
                      {nomorDigit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
