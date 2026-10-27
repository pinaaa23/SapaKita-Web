import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sliders,
  Eye,
  ArrowRight,
} from 'lucide-react';
import {
  getFinanceSummary,
  getFinanceBillings,
  formatRupiah,
  MONTH_NAMES,
} from '../../services/financeService';

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState('2026');
  const [summary, setSummary] = useState(null);
  const [recentBillings, setRecentBillings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('semua');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, b] = await Promise.all([
        getFinanceSummary(selectedMonth, selectedYear),
        getFinanceBillings({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter,
        }),
      ]);
      setSummary(s);
      setRecentBillings(Array.isArray(b) ? b.slice(0, 5) : []);
    } catch (err) {
      console.warn('[FinanceDashboard] Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('finance_billing_updated', loadData);
    return () => {
      window.removeEventListener('finance_billing_updated', loadData);
    };
  }, [selectedMonth, selectedYear, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner (Kompak, Ramping, & Sejajar) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B3D91] via-[#154db3] to-[#1E5FCC] p-4 sm:p-5 text-white shadow-xs">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-8 w-48 h-48 rounded-full bg-blue-300/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 max-w-xl">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Wallet className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Rekapitulasi Pascabayar
                </span>
                <span className="text-xs font-semibold text-white/90 hidden sm:inline">
                  • 4 Pihak (Kepala UPT, Koperasi, Inkopasindo, Vendor)
                </span>
              </div>
              <p className="text-blue-100/90 text-xs leading-relaxed mt-0.5">
                Monitoring perputaran omset kotor nasional dan status setoran UPT berdasarkan periode buku.
              </p>
            </div>
          </div>

          {/* Quick Filter Bulan & Tahun (Sejajar Satu Baris) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl text-xs font-semibold text-white shadow-2xs shrink-0 self-start sm:self-center">
            <Calendar className="w-3.5 h-3.5 text-blue-200 shrink-0" />
            <span className="text-blue-200 font-medium">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="semua" className="text-slate-800">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)} className="text-slate-800">
                  {m}
                </option>
              ))}
            </select>
            <span className="text-white/40">|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="2026" className="text-slate-800">2026</option>
              <option value="2025" className="text-slate-800">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Ringkasan (Sama Tinggi, Angka Sejajar, Badge Whitespace-Nowrap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omset Kotor</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1565C0] shrink-0 border border-blue-100/60">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-3">
              {formatRupiah(summary?.totalOmsetKotor || 0)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 whitespace-nowrap">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shrink-0">
              {summary?.totalRecords || 0} Invoice
            </span>
            <span className="text-[11px] text-slate-500 truncate">Total tercatat</span>
          </div>
        </div>

        {/* Sudah Dibayar */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sudah Dibayar</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-700 tracking-tight mt-3">
              {formatRupiah(summary?.totalPaid || 0)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 whitespace-nowrap">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 shrink-0">
              {summary?.counts?.paid || 0} UPT
            </span>
            <span className="text-[11px] text-slate-500 truncate">Terverifikasi</span>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Menunggu Verifikasi</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/60">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-600 tracking-tight mt-3">
              {formatRupiah(summary?.totalPending || 0)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 whitespace-nowrap">
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200/60 shrink-0">
              {summary?.counts?.pending || 0} UPT
            </span>
            <span className="text-[11px] text-slate-500 truncate">Menunggu ACC</span>
          </div>
        </div>

        {/* Belum Dibayar */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Belum Dibayar</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100/60">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-rose-600 tracking-tight mt-3">
              {formatRupiah(summary?.totalUnpaid || 0)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 whitespace-nowrap">
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200/60 shrink-0">
              {summary?.counts?.unpaid || 0} UPT
            </span>
            <span className="text-[11px] text-slate-500 truncate">Jatuh tempo</span>
          </div>
        </div>
      </div>

      {/* 3. Section Skema Pembagian Hasil 4 Pihak */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              Alokasi Pembagian Hasil 4 Pihak
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi omset dari panggilan wartel berdasarkan formula kontrak kerja sama resmi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/finance/contracts')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1565C0] text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sesuaikan Persentase Kontrak</span>
          </button>
        </div>

        {/* 4 Cards Alokasi Stakeholders (Seragam) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* 1. Kepala UPT (5%) */}
          <div className="rounded-2xl p-4 bg-purple-50/60 border border-purple-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">1. Kepala UPT</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[11px]">5%</span>
              </div>
              <p className="text-lg font-black text-purple-950 mt-2.5">
                {formatRupiah(summary?.shares?.kepalaUpt || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-purple-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '5%' }}></div>
              </div>
              <p className="text-[11px] text-purple-700/80 mt-2 font-medium truncate">
                Pimpinan satuan kerja UPT Lapas/Rutan
              </p>
            </div>
          </div>

          {/* 2. Koperasi (30%) */}
          <div className="rounded-2xl p-4 bg-sky-50/60 border border-sky-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">2. Koperasi Lapas</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white font-black text-[11px]">30%</span>
              </div>
              <p className="text-lg font-black text-sky-950 mt-2.5">
                {formatRupiah(summary?.shares?.koperasi || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-sky-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <p className="text-[11px] text-sky-700/80 mt-2 font-medium truncate">
                Koperasi Pengayoman &amp; pengelola kantin
              </p>
            </div>
          </div>

          {/* 3. Inkopasindo (10%) */}
          <div className="rounded-2xl p-4 bg-amber-50/60 border border-amber-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">3. Inkopasindo</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-black text-[11px]">10%</span>
              </div>
              <p className="text-lg font-black text-amber-950 mt-2.5">
                {formatRupiah(summary?.shares?.inkopasindo || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '10%' }}></div>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-2 font-medium truncate">
                Induk Koperasi Pemasyarakatan
              </p>
            </div>
          </div>

          {/* 4. Vendor (55%) */}
          <div className="rounded-2xl p-4 bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">4. Vendor (Sadewa)</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-black text-[11px]">55%</span>
              </div>
              <p className="text-lg font-black text-indigo-950 mt-2.5">
                {formatRupiah(summary?.shares?.vendor || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-indigo-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '55%' }}></div>
              </div>
              <p className="text-[11px] text-indigo-700/80 mt-2 font-medium truncate">
                Penyedia infrastruktur teknologi &amp; sistem
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Rekap Transaksi & Status Penagihan UPT (Maksimal 5 Baris Terbaru) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                Rekap Status Tagihan UPT
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                {selectedMonth === 'semua' ? 'Semua Bulan' : MONTH_NAMES[Number(selectedMonth) - 1]} {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ringkasan status penagihan dan pelunasan setoran UPT pada periode terpilih.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Status Button Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { key: 'semua', label: 'Semua' },
                { key: 'PAID', label: 'Lunas' },
                { key: 'PENDING_CONFIRMATION', label: 'Menunggu' },
                { key: 'UNPAID', label: 'Belum Bayar' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === item.key
                      ? 'bg-white text-[#1565C0] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Tombol Lihat Semua */}
            <Link
              to="/finance/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Tabel Data Rekap Tagihan (5 Kolom Sesuai Permintaan) */}
        <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 font-bold bg-slate-50/80">
                <th className="py-3 px-4">No. Tagihan &amp; Periode</th>
                <th className="py-3 px-4">Nama UPT</th>
                <th className="py-3 px-4 text-right">Omset Kotor</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBillings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/80 flex items-center justify-center mx-auto mb-2">
                      <Receipt className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs sm:text-sm">Tidak ada data tagihan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tidak ditemukan tagihan UPT untuk filter atau periode yang dipilih.
                    </p>
                  </td>
                </tr>
              ) : (
                recentBillings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* No. Tagihan & Periode */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1565C0]">{b.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{MONTH_NAMES[b.month - 1]} {b.year}</span>
                      </div>
                    </td>

                    {/* Nama UPT */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{b.branchName}</div>
                      <div className="text-[11px] text-slate-500">{b.canteenName}</div>
                    </td>

                    {/* Omset Kotor */}
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatRupiah(b.grossAmount)}
                    </td>

                    {/* Status Pembayaran */}
                    <td className="py-3 px-4 text-center">
                      {b.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah Dibayar</span>
                        </span>
                      ) : b.status === 'PENDING_CONFIRMATION' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Menunggu Verifikasi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Belum Dibayar</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi (Cukup Satu Tombol Detail yang Menuju Tagihan & Setoran) */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/finance/billing?id=${b.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1565C0] text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Buka rincian tagihan & setoran"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

