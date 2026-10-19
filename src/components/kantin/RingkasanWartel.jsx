import React from 'react';
import { Phone, CheckCircle2, PhoneCall, Wrench } from 'lucide-react';

export default function RingkasanWartel({ summary }) {
  const { total = 10, tersedia = 0, digunakan = 0, perbaikan = 0 } = summary || {};
  const hasPerbaikan = perbaikan > 0;

  return (
    <div className={`grid grid-cols-1 ${hasPerbaikan ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
      {/* 1. Total Wartel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Wartel
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {total}
            </span>
            <span className="text-xs font-bold text-slate-400">Unit</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Kapasitas bilik komunikasi aktif</span>
        </div>
      </div>

      {/* 2. Tersedia */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tersedia
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {tersedia}
            </span>
            <span className="text-xs font-bold text-slate-400">Unit</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Bilik siap digunakan WBP</span>
        </div>
      </div>

      {/* 3. Sedang Digunakan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sedang Digunakan
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
              {digunakan}
            </span>
            <span className="text-xs font-bold text-slate-400">Unit</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Panggilan aktif saat ini</span>
        </div>
      </div>

      {/* 4. Perbaikan / Maintenance (Hanya tampil jika ada unit perbaikan) */}
      {hasPerbaikan && (
        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Dalam Perbaikan
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                {perbaikan}
              </span>
              <span className="text-xs font-bold text-slate-400">Unit</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pemeliharaan / handset rusak</span>
          </div>
        </div>
      )}
    </div>
  );
}
