import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStatusWartel } from '../../hooks/useStatusWartel';

export default function WartelBadgeSidebar({ isDarkTheme = false }) {
  const { summary, isLoading } = useStatusWartel();
  const { total = 8, digunakan = 0 } = summary;
  const isBanyakDigunakan = total > 0 && digunakan > total / 2;

  if (isDarkTheme) {
    return (
      <NavLink
        to="/kantin/status-wartel"
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
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {digunakan > 0 && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isBanyakDigunakan ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLoading
                    ? 'bg-slate-400'
                    : isBanyakDigunakan
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                }`}
              />
            </span>
            <div className="truncate">
              <span className="text-xs font-bold leading-tight block truncate text-white">
                {isLoading ? 'Memuat status...' : `${digunakan} dari ${total} Wartel Digunakan`}
              </span>
              <span className="text-[10px] text-blue-200 font-medium block truncate">
                {isLoading ? 'Menghubungkan...' : `${total - digunakan} bilik siap panggilan`}
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
      to="/kantin/status-wartel"
      className={({ isActive }) =>
        `block p-2.5 rounded-xl border transition-all duration-150 group ${
          isActive
            ? 'bg-[#E3F2FD] border-blue-200 shadow-2xs'
            : isBanyakDigunakan
            ? 'bg-rose-50/70 hover:bg-rose-50 border-rose-200/80 hover:border-rose-300'
            : 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/80 hover:border-emerald-300'
        }`
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {digunakan > 0 && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBanyakDigunakan ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isLoading
                  ? 'bg-slate-400'
                  : isBanyakDigunakan
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            />
          </span>
          <div className="truncate">
            <span
              className={`text-xs font-bold leading-tight block truncate ${
                isBanyakDigunakan ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              {isLoading ? 'Memuat status...' : `${digunakan} dari ${total} Wartel Digunakan`}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block leading-none mt-0.5">
              Klik untuk pantau bilik
            </span>
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
      </div>
    </NavLink>
  );
}
