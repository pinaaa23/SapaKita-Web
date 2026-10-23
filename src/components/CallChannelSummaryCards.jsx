import React, { useMemo } from 'react';
import { Globe, Smartphone, PieChart as PieChartIcon } from 'lucide-react';
import { normalizeChannel } from '../utils/callChannel';

/**
 * Komponen Bersama: 3 Card Ringkasan Jalur Panggilan (Web vs GSM)
 * Digunakan pada halaman Riwayat Panggilan role Superadmin, Kanwil, dan Kepala UPT.
 * 
 * Card 1: Via Web (Total detik + jumlah panggilan)
 * Card 2: Via GSM (Total detik + jumlah panggilan)
 * Card 3: Donut Chart Proporsi Persentase Web vs GSM
 */
export default function CallChannelSummaryCards({ calls = [], activeTab = 'voice' }) {
  // 1 Sumber hitungan yang sama untuk Card 1, Card 2, dan Card 3
  const metrics = useMemo(() => {
    let webSeconds = 0;
    let gsmSeconds = 0;
    let webCount = 0;
    let gsmCount = 0;

    (calls || []).forEach((c) => {
      // Jika tab Video Call atau tipe panggilan Video, jalur otomatis Web
      const isVideo = (c.callType || '').toLowerCase() === 'video' || activeTab === 'video';
      const channel = isVideo ? 'web' : normalizeChannel(c.channel);
      const sec = typeof c.durationSeconds === 'number'
        ? c.durationSeconds
        : (Number(c.duration) || 0);

      if (channel === 'gsm') {
        gsmSeconds += sec;
        gsmCount += 1;
      } else {
        webSeconds += sec;
        webCount += 1;
      }
    });

    const totalSeconds = webSeconds + gsmSeconds;
    const hasData = totalSeconds > 0;

    let webPercent = 0;
    let gsmPercent = 0;
    if (hasData) {
      webPercent = Math.round((webSeconds / totalSeconds) * 100);
      gsmPercent = 100 - webPercent; // Total selalu genap 100%
    }

    return {
      webSeconds,
      gsmSeconds,
      webCount,
      gsmCount,
      totalSeconds,
      hasData,
      webPercent,
      gsmPercent,
    };
  }, [calls, activeTab]);

  const formatSeconds = (sec) => {
    return `${new Intl.NumberFormat('id-ID').format(sec || 0)} detik`;
  };

  const formatDurationText = (sec) => {
    if (!sec) return '0 dtk';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} dtk`;
    return `${m}m ${s}s`;
  };

  // Parameter geometri SVG Donut Chart
  const r = 38;
  const perimeter = 2 * Math.PI * r;
  const webStroke = metrics.hasData ? (metrics.webPercent / 100) * perimeter : 0;
  const gsmStroke = metrics.hasData ? (metrics.gsmPercent / 100) * perimeter : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* CARD 1: VIA WEB */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-slate-200/80 flex flex-col justify-between transition-all duration-200">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                Jalur Panggilan
              </span>
              <h3 className="text-sm font-extrabold text-slate-800">
                Via Web
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            VoIP / Internet
          </span>
        </div>

        <div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatSeconds(metrics.webSeconds)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">
              {new Intl.NumberFormat('id-ID').format(metrics.webCount)} panggilan
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">
              {formatDurationText(metrics.webSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: VIA GSM */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-slate-200/80 flex flex-col justify-between transition-all duration-200">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Smartphone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                Jalur Panggilan
              </span>
              <h3 className="text-sm font-extrabold text-slate-800">
                Via GSM
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
            Seluler / PSTN
          </span>
        </div>

        <div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatSeconds(metrics.gsmSeconds)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">
              {new Intl.NumberFormat('id-ID').format(metrics.gsmCount)} panggilan
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">
              {formatDurationText(metrics.gsmSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: DIAGRAM LINGKARAN (DONUT) PERSENTASE WEB VS GSM */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-slate-200/80 flex flex-col justify-between transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Proporsi Jalur
              </h3>
              <p className="text-[10px] text-slate-400">Rasio durasi Web vs GSM</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
            100%
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          {/* Donut SVG Chart */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke={metrics.hasData ? '#F1F5F9' : '#E2E8F0'}
                strokeWidth="10"
                strokeDasharray={metrics.hasData ? undefined : '4 4'}
              />

              {/* Data Segments */}
              {metrics.hasData ? (
                <>
                  {/* Web Segment (Blue) */}
                  {metrics.webPercent > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={r}
                      fill="transparent"
                      stroke="#2563EB"
                      strokeWidth="10"
                      strokeDasharray={`${webStroke} ${perimeter}`}
                      strokeDashoffset="0"
                      className="transition-all duration-500 ease-out"
                    />
                  )}
                  {/* GSM Segment (Orange) */}
                  {metrics.gsmPercent > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={r}
                      fill="transparent"
                      stroke="#EA580C"
                      strokeWidth="10"
                      strokeDasharray={`${gsmStroke} ${perimeter}`}
                      strokeDashoffset={-webStroke}
                      className="transition-all duration-500 ease-out"
                    />
                  )}
                </>
              ) : null}
            </svg>

            {/* Center Label inside donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              {metrics.hasData ? (
                <>
                  <span className="text-xs font-black text-slate-800 leading-none">
                    {metrics.webPercent >= metrics.gsmPercent ? `${metrics.webPercent}%` : `${metrics.gsmPercent}%`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                    {metrics.webPercent >= metrics.gsmPercent ? 'Web' : 'GSM'}
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">
                  0%
                </span>
              )}
            </div>
          </div>

          {/* Legenda & Persentase Jelas */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Legenda Web */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-bold text-slate-700 truncate">Web</span>
              </div>
              <span className="font-extrabold text-blue-700 font-mono text-xs ml-2">
                {metrics.hasData ? `${metrics.webPercent}%` : '0%'}
              </span>
            </div>

            {/* Legenda GSM */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
                <span className="font-bold text-slate-700 truncate">GSM</span>
              </div>
              <span className="font-extrabold text-orange-700 font-mono text-xs ml-2">
                {metrics.hasData ? `${metrics.gsmPercent}%` : '0%'}
              </span>
            </div>

            {/* Status Footer */}
            <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-400 truncate">
              {metrics.hasData ? (
                <span>Total: <strong className="text-slate-600 font-semibold">{formatDurationText(metrics.totalSeconds)}</strong></span>
              ) : (
                <span className="italic text-slate-400">Belum ada data durasi</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
