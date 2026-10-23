import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Globe, Smartphone, PieChart as PieChartIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { normalizeChannel } from '../utils/callChannel';
import { getCallChannelSummary } from '../services/callService';

/**
 * Komponen Bersama: 3 Card Ringkasan Jalur Panggilan (Web vs GSM)
 * Digunakan pada halaman Riwayat Panggilan role Superadmin, Kanwil, dan Kepala UPT.
 * 
 * Mengonsumsi data resmi dari GET /api/calls/channel-summary:
 * - totalWebSeconds
 * - totalGsmSeconds
 * - totalWebCalls
 * - totalGsmCalls
 * - percentageWeb
 * - percentageGsm
 */
export default function CallChannelSummaryCards({
  filters = null,
  summary: externalSummary = null,
  isLoading: externalLoading = null,
  error: externalError = null,
  onRetry = null,
  calls = [],
  activeTab = 'voice',
}) {
  const [internalSummary, setInternalSummary] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Fetch summary dari endpoint GET /api/calls/channel-summary saat filter berubah
  const fetchSummary = useCallback(async () => {
    if (!filters) return;
    setInternalLoading(true);
    setInternalError(null);
    try {
      const data = await getCallChannelSummary({
        branchId: filters.branchId,
        status: filters.status,
        type: filters.type || filters.callType || activeTab,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      });
      setInternalSummary(data);
    } catch (err) {
      console.warn('[CallChannelSummaryCards] Gagal memuat ringkasan kanal:', err?.message || err);
      setInternalError(err?.message || 'Gagal memuat ringkasan jalur panggilan');
    } finally {
      setInternalLoading(false);
    }
  }, [
    filters?.branchId,
    filters?.status,
    filters?.type,
    filters?.callType,
    filters?.startDate,
    filters?.endDate,
    filters?.search,
    activeTab,
  ]);

  useEffect(() => {
    if (filters) {
      fetchSummary();
    }
  }, [fetchSummary, retryTrigger]);

  const handleRetry = () => {
    if (onRetry) onRetry();
    setRetryTrigger((k) => k + 1);
  };

  const summary = externalSummary !== null ? externalSummary : internalSummary;
  const isLoading = externalLoading !== null ? externalLoading : internalLoading;
  const error = externalError !== null ? externalError : internalError;

  // Fallback hitungan lokal jika data summary belum tersedia dari endpoint
  const localFallback = useMemo(() => {
    let webSeconds = 0;
    let gsmSeconds = 0;
    let webCount = 0;
    let gsmCount = 0;

    (calls || []).forEach((c) => {
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
    const hasData = totalSeconds > 0 || (webCount + gsmCount) > 0;
    let webPercent = 0;
    let gsmPercent = 0;
    if (hasData && totalSeconds > 0) {
      webPercent = Math.round((webSeconds / totalSeconds) * 100);
      gsmPercent = 100 - webPercent;
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

  // Resolusi metrik: Utamakan respons resmi dari endpoint GET /api/calls/channel-summary
  const metrics = useMemo(() => {
    if (summary) {
      const webSec = Number(summary.totalWebSeconds || 0);
      const gsmSec = Number(summary.totalGsmSeconds || 0);
      const webCount = Number(summary.totalWebCalls || 0);
      const gsmCount = Number(summary.totalGsmCalls || 0);
      const totalCalls = Number(summary.totalCalls ?? (webCount + gsmCount));
      const totalSeconds = Number(summary.totalSeconds ?? (webSec + gsmSec));
      const webPercent = Number(summary.percentageWeb ?? 0);
      const gsmPercent = Number(summary.percentageGsm ?? 0);
      const hasData = totalCalls > 0 || totalSeconds > 0;

      return {
        webSeconds: webSec,
        gsmSeconds: gsmSec,
        webCount,
        gsmCount,
        totalSeconds,
        totalCalls,
        hasData,
        webPercent,
        gsmPercent,
      };
    }
    return localFallback;
  }, [summary, localFallback]);

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
    <div className="space-y-3">
      {/* Keadaan Error yang rapi */}
      {error && !isLoading && (
        <div className="bg-rose-50/90 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">
              Gagal menyinkronkan ringkasan kanal dari server: {error}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200/80 transition-all cursor-pointer shadow-2xs text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* 3 Grid Card Jalur Panggilan */}
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
            {isLoading ? (
              <div className="space-y-2 py-1">
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <>
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
              </>
            )}
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
            {isLoading ? (
              <div className="space-y-2 py-1">
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <>
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
              </>
            )}
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

          {isLoading ? (
            <div className="flex items-center justify-between gap-4 pt-1 py-2">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin shrink-0 mx-auto" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ) : (
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
                    <span>
                      Total: <strong className="text-slate-600 font-semibold">{formatDurationText(metrics.totalSeconds)}</strong>
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Belum ada data durasi</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
