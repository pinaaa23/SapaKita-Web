import React from 'react';
import { Clock, Sparkles, ShieldCheck, Zap, Check } from 'lucide-react';

export default function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 shadow-lg shadow-blue-950/20 border border-slate-800">
      {/* Background ambient lighting */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
        <Sparkles className="w-56 h-56 text-white" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Katalog Resmi Paket Wartel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Penerbitan Voucher Panggilan Warga Binaan
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Paket komunikasi resmi terverifikasi Lapas. Seluruh voucher langsung dicetak secara instan dan dapat digunakan pada bilik telepon atau video call yang tersedia.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Check className="w-3 h-3 text-emerald-400" /> Cetak Langsung di Kasir
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Check className="w-3 h-3 text-emerald-400" /> Terkoneksi 10 Bilik Wartel
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              <Check className="w-3 h-3 text-emerald-400" /> Tarif Resmi Tanpa Markup
            </span>
          </div>
        </div>

        <div className="flex items-center self-start lg:self-center shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Layanan Aktif 24 Jam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
