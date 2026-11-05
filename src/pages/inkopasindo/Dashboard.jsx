import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Eye,
  ArrowRight,
  Building2
} from 'lucide-react';
import {
  getInkopasindoDashboardData,
  formatRupiah,
  MONTH_NAMES
} from '../../services/inkopasindoService';

export default function InkopasindoDashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState('2026');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [summary, setSummary] = useState(null);
  const [recentBillings, setRecentBillings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getInkopasindoDashboardData({
        month: selectedMonth,
        year: selectedYear,
        status: statusFilter,
      });
      setSummary(data.summary);
      setRecentBillings(data.recentBillings.slice(0, 5));
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        console.error(`[InkopasindoDashboard] Request dashboard ditolak (${err.status}): Akses ditolak oleh server.`, err);
      } else {
        console.error('[InkopasindoDashboard] Failed to load dashboard data:', err);
      }
      // TODO: Tampilkan keadaan kosong yang rapi jika terjadi penolakan atau data belum tersedia di BE
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, statusFilter]);

  const vendorPct = summary?.shares?.vendor?.percent ?? 60;
  const uptPct = summary?.shares?.upt?.percent ?? 30;
  const inkopasindoPct = summary?.shares?.inkopasindo?.percent ?? 10;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Action Bar: Akses Read-Only & Quick Filter Periode (Rapi, Sejajar, Tanpa Duplikasi Judul) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 -mt-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200/80 text-xs font-bold whitespace-nowrap">
            Akses: Read-Only
          </span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Monitoring perputaran omset kotor nasional &amp; hak bagi hasil 3 pihak seluruh UPT
          </span>
        </div>

        {/* Quick Filter Bulan & Tahun */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-medium">Periode:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
          >
            <option value="semua">Semua Bulan</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx + 1} value={String(idx + 1)}>
                {m}
              </option>
            ))}
          </select>
          <span className="text-slate-300 font-light">|</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* 2. Stat Cards Ringkasan (4 Kartu Utama) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset Kotor */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omset Kotor</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary shrink-0 border border-blue-100/60">
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
            <span className="text-[11px] text-slate-500 truncate">Terverifikasi lunas</span>
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
            <span className="text-[11px] text-slate-500 truncate">Menunggu konfirmasi</span>
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
            <span className="text-[11px] text-slate-500 truncate">Belum setor</span>
          </div>
        </div>
      </div>

      {/* 3. Section Skema Pembagian Hasil 3 Pihak */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              Alokasi Pembagian Hasil 3 Pihak
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi omset dari panggilan wartel berdasarkan data kontrak resmi (Kantin tidak masuk pembagian).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200/60 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Formula Kontrak Terhubung</span>
          </div>
        </div>

        {/* 3 Cards Alokasi Stakeholders (Vendor, UPT, Inkopasindo) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* 1. Vendor (60%) */}
          <div className="rounded-2xl p-4.5 bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">1. Vendor (Sadewa)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-xs">
                  {vendorPct}%
                </span>
              </div>
              <p className="text-xl font-black text-indigo-950 mt-3">
                {formatRupiah(summary?.shares?.vendor?.amount || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-indigo-200/60 rounded-full h-1.5 mt-3.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${vendorPct}%` }}></div>
              </div>
              <p className="text-[11px] text-indigo-700/80 mt-2 font-medium truncate">
                Penyedia infrastruktur teknologi &amp; sistem
              </p>
            </div>
          </div>

          {/* 2. UPT (30%) */}
          <div className="rounded-2xl p-4.5 bg-sky-50/60 border border-sky-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">2. UPT Pemasyarakatan</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-black text-xs">
                  {uptPct}%
                </span>
              </div>
              <p className="text-xl font-black text-sky-950 mt-3">
                {formatRupiah(summary?.shares?.upt?.amount || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-sky-200/60 rounded-full h-1.5 mt-3.5 overflow-hidden">
                <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${uptPct}%` }}></div>
              </div>
              <p className="text-[11px] text-sky-700/80 mt-2 font-medium truncate">
                Satuan kerja Lapas / Rutan daerah
              </p>
            </div>
          </div>

          {/* 3. Inkopasindo (10%) - Warna Kuning Amber seperti di Finance */}
          <div className="rounded-2xl p-4.5 bg-amber-50/60 border border-amber-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">3. Inkopasindo</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-black text-xs">
                  {inkopasindoPct}%
                </span>
              </div>
              <p className="text-xl font-black text-amber-950 mt-3">
                {formatRupiah(summary?.shares?.inkopasindo?.amount || 0)}
              </p>
            </div>
            <div>
              <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-3.5 overflow-hidden">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${inkopasindoPct}%` }}></div>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-2 font-medium truncate">
                Induk Koperasi Pemasyarakatan Indonesia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Rekap Status Tagihan UPT */}
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
              Status penagihan UPT seluruh Kanwil pada periode terpilih (maksimal 5 baris terbaru).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tab Status Button Pills */}
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
                      ? 'bg-white text-primary shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Tombol Lihat Semua */}
            <Link
              to="/inkopasindo/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Tabel Data Rekap Tagihan UPT */}
        <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 font-bold bg-slate-50/80">
                <th className="py-3 px-4">No. Tagihan &amp; Periode</th>
                <th className="py-3 px-4">Nama UPT &amp; Kanwil</th>
                <th className="py-3 px-4 text-right">Omset Kotor</th>
                <th className="py-3 px-4 text-center">Status Tagihan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-xs">Memuat rekap tagihan...</p>
                  </td>
                </tr>
              ) : recentBillings.length === 0 ? (
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
                      <div className="font-bold text-primary">{b.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{MONTH_NAMES[b.month - 1]} {b.year}</span>
                      </div>
                    </td>

                    {/* UPT & Kanwil */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{b.branchName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{b.kanwilName}</span>
                      </div>
                    </td>

                    {/* Omset Kotor */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-slate-800 text-xs sm:text-sm">
                        {formatRupiah(b.grossAmount)}
                      </div>
                      <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        Hak Inkopasindo ({b.split3Way.inkopasindo}%): {formatRupiah(b.shares3Way.inkopasindo.amount)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {b.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Lunas
                        </span>
                      )}
                      {b.status === 'PENDING_CONFIRMATION' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Menunggu
                        </span>
                      )}
                      {b.status === 'UNPAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Belum Bayar
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/inkopasindo/billing?id=${b.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Detail</span>
                      </button>
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
