import React from 'react';
import { formatRupiah } from '../../utils/formatKantin';
import { TrendingUp, Receipt, ArrowUpRight } from 'lucide-react';

export default function KartuRingkasan({ rekap, isLoading = false }) {
  const { totalPemasukan = 0, jumlahTransaksi = 0 } = rekap || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Total Pemasukan (Tunai) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan (Tunai)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isLoading && !rekap ? '...' : formatRupiah(totalPemasukan)}
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Total omzet tunai kantin pada rentang periode ini</span>
        </div>
      </div>

      {/* 2. Jumlah Transaksi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Jumlah Transaksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isLoading && !rekap ? '...' : jumlahTransaksi}
            </span>
            <span className="text-xs font-bold text-slate-400">Transaksi</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Penjualan voucher berhasil dicatat</span>
        </div>
      </div>
    </div>
  );
}
