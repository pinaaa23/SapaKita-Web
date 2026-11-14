import React from 'react';
import { Phone, PhoneCall, Clock, CheckCircle2 } from 'lucide-react';

export default function KartuWartel({ wartel, now = Date.now(), waktuServerOffset = 0 }) {
  const { nama, nomor, status, estimasiSelesai, detail } = wartel;
  const isDigunakan = status === 'digunakan';
  const displayNama = nama || nomor;

  // Hitung sisa ms dari estimasiSelesai dikurangi waktu efektif sekarang
  const effectiveNow = now + waktuServerOffset;
  const sisaMs = estimasiSelesai ? estimasiSelesai - effectiveNow : 0;
  const isHampirKosong = isDigunakan && sisaMs < 120000; // Kurang dari 2 menit

  // Format teks sisa waktu
  let sisaWaktuText = '';
  if (isDigunakan) {
    if (sisaMs <= 0) {
      sisaWaktuText = 'Hampir selesai';
    } else if (sisaMs < 60000) {
      sisaWaktuText = '< 1 Menit';
    } else {
      const menit = Math.ceil(sisaMs / 60000);
      sisaWaktuText = `\u00b1${menit} Menit`;
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
        isDigunakan
          ? isHampirKosong
            ? 'border-emerald-300 shadow-2xs hover:shadow-md hover:border-emerald-400 bg-emerald-50/10'
            : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-200'
          : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-200'
      }`}
    >
      <div>
        {/* Header Bar: Icon, Nama Bilik & Badge Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                isDigunakan
                  ? isHampirKosong
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-50 text-[#DC2626]'
                  : 'bg-emerald-50 text-[#16A34A]'
              }`}
            >
              {isDigunakan ? (
                <PhoneCall className={`w-5 h-5 ${isHampirKosong ? 'animate-pulse text-emerald-600' : 'animate-pulse'}`} />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 tracking-tight">
                {displayNama}
              </h4>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                Bilik Telepon
              </span>
            </div>
          </div>

          {/* Badge Status */}
          {isDigunakan ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                isHampirKosong
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-[#DC2626] border-rose-200/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-ping ${
                  isHampirKosong ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              Digunakan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200/80 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersedia
            </span>
          )}
        </div>

        {/* Info Detail Panggilan Saat Digunakan */}
        {isDigunakan && detail && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium">WBP:</span>
              <span className="font-bold text-slate-800 truncate max-w-[160px]" title={detail.inmate?.name}>
                {detail.inmate?.name || 'WBP'}
                {detail.inmate?.blockRoom ? ` (${detail.inmate.blockRoom})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Tujuan:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[160px]" title={detail.family?.name || detail.family?.phone}>
                {detail.family?.name || detail.family?.phone || 'Keluarga'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Info Sisa Waktu */}
      {isDigunakan && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock
              className={`w-3.5 h-3.5 ${
                isHampirKosong ? 'text-emerald-600 font-bold' : 'text-rose-500'
              }`}
            />
            <span className={isHampirKosong ? 'text-emerald-800 font-bold' : 'text-slate-400'}>
              Estimasi Sisa
            </span>
          </div>
          <span
            className={`font-extrabold ${
              isHampirKosong
                ? 'text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/80'
                : 'text-slate-700'
            }`}
          >
            {sisaWaktuText}
          </span>
        </div>
      )}
    </div>
  );
}
