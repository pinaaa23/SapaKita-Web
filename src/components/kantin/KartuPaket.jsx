import React from 'react';
import { formatRupiah } from '../../utils/formatKantin';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function KartuPaket({ paket, onBeli, disabled = false }) {
  const { nama, subNama, durasi, keterangan, harga } = paket;

  return (
    <div className={`group relative flex flex-col justify-between bg-white rounded-2xl border p-6 shadow-sm transition-all duration-200 ${
      disabled ? 'border-slate-200 opacity-80' : 'border-slate-200/80 hover:shadow-md hover:border-blue-200'
    }`}>
      {/* Header Kartu: Nama Paket */}
      <div>
        <div className="mb-2">
          <h3 className={`text-lg font-bold transition-colors ${
            disabled ? 'text-slate-600' : 'text-slate-800 group-hover:text-[#1565C0]'
          }`}>
            {nama}
          </h3>
          {subNama && (
            <p className="text-xs font-medium text-slate-500 mt-0.5">{subNama}</p>
          )}
        </div>

        {/* Durasi & Keterangan */}
        <div className="space-y-1.5 mt-3 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{durasi}</span>
          </div>
          {keterangan && (
            <p className="text-xs text-slate-500 font-normal">
              {keterangan}
            </p>
          )}
        </div>
      </div>

      {/* Footer Kartu: Harga & Tombol Beli */}
      <div className="pt-4 border-t border-slate-100 mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Harga
            </span>
            <span className={`text-2xl font-extrabold ${disabled ? 'text-slate-500' : 'text-[#1565C0]'}`}>
              {formatRupiah(harga)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Termasuk PPN 11%
          </span>
        </div>

        <button
          onClick={() => !disabled && onBeli(paket)}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            disabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
              : 'bg-[#1565C0] hover:bg-[#0D47A1] active:scale-[0.98] text-white shadow-blue-500/20 cursor-pointer'
          }`}
          title={disabled ? 'Transaksi diblokir: tagihan belum lunas' : 'Beli Paket'}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{disabled ? 'Transaksi Diblokir' : 'Beli Paket'}</span>
        </button>
      </div>
    </div>
  );
}
