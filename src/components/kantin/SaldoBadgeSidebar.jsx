import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  SALDO_MINIMUM_WARNING,
  getSaldo,
  getSaldoSync,
  subscribeSaldoUpdate,
} from '../../services/kantin/saldoService';

/**
 * Kartu kecil "Saldo Kantin" untuk sidebar.
 * Menampilkan sisa kuota menit dan tombol menuju halaman Top Up Saldo.
 * Jika kuota di bawah SALDO_MINIMUM_WARNING (30 Menit),
 * kartu berubah warna jadi peringatan (kuning/merah) dengan tulisan "Kuota menipis".
 */
export default function SaldoBadgeSidebar() {
  const [saldo, setSaldo] = useState(() => getSaldoSync());

  useEffect(() => {
    // Muat saldo awal dari BE
    getSaldo().then((s) => setSaldo(s)).catch(() => {});

    // Subscribe untuk menerima update saldo menit realtime
    const unsubscribe = subscribeSaldoUpdate((newSaldo) => {
      setSaldo(newSaldo);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const saldoRendah = saldo < SALDO_MINIMUM_WARNING;

  return (
    <NavLink
      to="/kantin/top-up-saldo"
      className={({ isActive }) =>
        `block p-2.5 rounded-xl border transition-all duration-150 group ${
          isActive
            ? 'bg-[#E3F2FD] border-blue-200 shadow-2xs'
            : saldoRendah
            ? 'bg-amber-50/70 hover:bg-amber-50 border-amber-200/80 hover:border-amber-300'
            : 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/80 hover:border-emerald-300'
        }`
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              saldoRendah
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span
              className={`text-xs font-bold leading-tight block truncate ${
                saldoRendah ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              {saldo.toLocaleString('id-ID')} Menit
            </span>
            <span className="text-[10px] font-medium block leading-none mt-0.5">
              {saldoRendah ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 inline" />
                  Kuota menipis
                </span>
              ) : (
                <span className="text-slate-500">Klik untuk top up</span>
              )}
            </span>
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
      </div>
    </NavLink>
  );
}
