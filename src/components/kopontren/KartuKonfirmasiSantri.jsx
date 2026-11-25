import React from 'react';
import { CheckCircle2, User, Building2 } from 'lucide-react';

export default function KartuKonfirmasiSantri({ santri, napi }) {
  const data = santri || napi;
  if (!data) return null;

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 transition-all">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>Data Santri Terverifikasi</span>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-bold text-slate-800 truncate">
                {data.nama || data.name}
              </h4>
              <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {data.identifier || data.wbpRegNumber || data.id}
              </span>
            </div>
            {(data.blok || data.blockRoom) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{data.blok || data.blockRoom}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}