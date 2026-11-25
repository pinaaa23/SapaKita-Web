import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  SALDO_MINIMUM_WARNING,
  getSaldo,
  getSaldoSync,
  subscribeSaldoUpdate,
} from '../../services/kopontren/saldoService';

/**
 * Kartu kecil "Saldo Kantin" untuk sidebar.
 * Menampilkan sisa kuota menit dan tombol menuju halaman Top Up Saldo.
 * Jika kuota di bawah SALDO_MINIMUM_WARNING (30 Menit),
 * kartu berubah warna jadi peringatan (kuning/merah) dengan tulisan "Kuota menipis".
 */
export default function SaldoBadgeSidebar({ isDarkTheme = false }) {
  const [saldo, setSaldo] = useState(() => getSaldoSync());

  useEffect(() => {
    getSaldo().then((s) => setSaldo(s)).catch(() => {});
    const unsubscribe = subscribeSaldoUpdate((newSaldo) => {
      setSaldo(newSaldo);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const saldoRendah = saldo < SALDO_MINIMUM_WARNING;

  if (isDarkTheme) {
    return (
      <NavLink
        to="/kopontren/tagihan"
        className={({ isActive }) =>
          `block p-2.5 rounded-2xl border transition-all duration-150 group ${
            isActive
              ? 'bg-white/20 border-white/30 text-white shadow-sm'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
          }`
        }
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-white/20 text-white shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <span className="text-xs font-bold leading-tight block truncate text-white">
                Pascabayar (Unlimited)
              </span>
              <span className="text-[10px] text-blue-200 font-medium block truncate">
                Tagihan di awal bulan
              </span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-blue-200 group-hover:text-white transition-colors shrink-0" />
        </div>
      </NavLink>
    );
  }

  return (
    <NavLink
      to="/kopontren/tagihan"
      className={({ isActive }) =>
        `block p-2.5 rounded-xl border transition-all duration-150 group ${
          isActive
            ? 'bg-[#E3F2FD] border-blue-200 shadow-2xs'
            : 'bg-blue-50/70 hover:bg-blue-50 border-blue-200/80 hover:border-blue-300'
        }`
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold leading-tight block truncate text-blue-900">
              Pascabayar (Unlimited)
            </span>
            <span className="text-[10px] font-medium block leading-none mt-0.5 text-slate-500">
              Tagihan di awal bulan
            </span>
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
      </div>
    </NavLink>
  );
}

