import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Percent,
  Sliders,
  FileSpreadsheet,
  Calendar,
  Layers,
  ShieldCheck,
  CreditCard,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import {
  getFinanceSummary,
  getFinanceBillings,
  formatRupiah,
  MONTH_NAMES,
  updateFinanceBillingStatus
} from '../../services/financeService';

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState('2026');
  const [summary, setSummary] = useState(null);
  const [recentBillings, setRecentBillings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('semua');

  const loadData = async () => {
    try {
      const [s, b] = await Promise.all([
        getFinanceSummary(selectedMonth, selectedYear),
        getFinanceBillings({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter,
        }),
      ]);
      if (s) setSummary(s);
      if (Array.isArray(b)) setRecentBillings(b.slice(0, 8));
    } catch (err) {
      console.error('[Dashboard] Gagal memuat data keuangan:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('finance_billing_updated', loadData);
    return () => {
      window.removeEventListener('finance_billing_updated', loadData);
    };
  }, [selectedMonth, selectedYear, statusFilter]);

  const handleQuickPay = async (id, branchName, month) => {
    if (window.confirm(`Konfirmasi pelunasan tagihan ${branchName} untuk ${MONTH_NAMES[month - 1]} ${selectedYear}?`)) {
      try {
        await updateFinanceBillingStatus(id, 'PAID', {
          paymentMethod: 'Bank Transfer Mandiri (Auto-verified)',
          paymentRef: `TRX-${Date.now()}`,
          notes: 'Diverifikasi langsung oleh Admin Keuangan via Dashboard',
        });
        await loadData();
      } catch (err) {
        console.error('[Dashboard] Gagal pelunasan cepat:', err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3D91] via-[#154db3] to-[#1E5FCC] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-10 w-60 h-60 rounded-full bg-blue-300/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Portal Resmi Keuangan & Bagi Hasil PasCall</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Dashboard Keuangan & Rekap Penagihan
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-2xl leading-relaxed">
              Monitoring omset transaksi nasional, verifikasi pembayaran tagihan UPT, dan skema pembagian hasil 4 pihak (Kepala UPT, Koperasi, Inkopasindo, Vendor).
            </p>
          </div>

          {/* Quick Filter Bulan & Tahun */}
          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/20">
            <div className="flex items-center gap-2 px-2 text-blue-100 text-xs font-medium">
              <Calendar className="w-4 h-4 text-blue-200" />
              <span>Periode:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 border-none shadow-sm focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option value="semua">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 border-none shadow-sm focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Omset */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Omset Kotor</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0B3D91]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-3">
            {formatRupiah(summary?.totalOmsetKotor || 0)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{summary?.totalRecords || 0} Invoice UPT tercatat</span>
          </div>
        </div>

        {/* Tagihan Lunas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sudah Dibayar (Lunas)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-emerald-700 mt-3">
            {formatRupiah(summary?.totalPaid || 0)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 font-bold">{summary?.counts?.paid || 0} UPT</span>
            <span>Pembayaran terverifikasi</span>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Menunggu Verifikasi</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-amber-600 mt-3">
            {formatRupiah(summary?.totalPending || 0)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 font-medium">
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 font-bold">{summary?.counts?.pending || 0} UPT</span>
            <span>Bukti transfer menunggu cek</span>
          </div>
        </div>

        {/* Belum Dibayar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Belum Dibayar</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-rose-600 mt-3">
            {formatRupiah(summary?.totalUnpaid || 0)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-medium">
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 font-bold">{summary?.counts?.unpaid || 0} UPT</span>
            <span>Piutang jatuh tempo</span>
          </div>
        </div>
      </div>

      {/* 3. Section Skema Pembagian Hasil 4 Pihak (Highlight Utama PM) */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B3D91] text-xs font-bold uppercase tracking-wider">
                Skema Bagi Hasil Baru
              </span>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">
                Alokasi Pembagian Hasil 4 Pihak
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Distribusi pendapatan dari panggilan wartel berdasarkan porsi persentase yang disepakati dalam kontrak kerja sama.
            </p>
          </div>

          <Link
            to="/finance/contracts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B3D91] text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sesuaikan Persentase Kontrak</span>
          </Link>
        </div>

        {/* 4 Cards Alokasi Stakeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* 1. Kepala UPT (5%) */}
          <div className="rounded-2xl p-4.5 bg-gradient-to-br from-purple-50/60 to-purple-100/30 border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">1. Kepala UPT</span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-xs">5%</span>
            </div>
            <p className="text-lg font-extrabold text-purple-950 mt-3">
              {formatRupiah(summary?.shares?.kepalaUpt || 0)}
            </p>
            <div className="w-full bg-purple-200/50 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '5%' }}></div>
            </div>
            <p className="text-[11px] text-purple-700/80 mt-2 font-medium">
              Alokasi pimpinan satuan kerja UPT Lapas/Rutan
            </p>
          </div>

          {/* 2. Koperasi (30%) */}
          <div className="rounded-2xl p-4.5 bg-gradient-to-br from-sky-50/60 to-sky-100/30 border border-sky-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">2. Koperasi Lapas</span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-extrabold text-xs">30%</span>
            </div>
            <p className="text-lg font-extrabold text-sky-950 mt-3">
              {formatRupiah(summary?.shares?.koperasi || 0)}
            </p>
            <div className="w-full bg-sky-200/50 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-sky-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <p className="text-[11px] text-sky-700/80 mt-2 font-medium">
              Koperasi Pengayoman & pengelola kantin UPT
            </p>
          </div>

          {/* 3. Inkopasindo (10%) */}
          <div className="rounded-2xl p-4.5 bg-gradient-to-br from-amber-50/60 to-amber-100/30 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">3. Inkopasindo</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-xs">10%</span>
            </div>
            <p className="text-lg font-extrabold text-amber-950 mt-3">
              {formatRupiah(summary?.shares?.inkopasindo || 0)}
            </p>
            <div className="w-full bg-amber-200/50 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-2 font-medium">
              Induk Koperasi Pemasyarakatan Indonesia
            </p>
          </div>

          {/* 4. Vendor (55%) */}
          <div className="rounded-2xl p-4.5 bg-gradient-to-br from-indigo-50/60 to-indigo-100/30 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">4. Vendor (Sadewa)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-xs">55%</span>
            </div>
            <p className="text-lg font-extrabold text-indigo-950 mt-3">
              {formatRupiah(summary?.shares?.vendor || 0)}
            </p>
            <div className="w-full bg-indigo-200/50 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '55%' }}></div>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-2 font-medium">
              Penyedia infrastruktur teknologi & operasional sistem
            </p>
          </div>
        </div>
      </div>

      {/* 4. Rekap Transaksi & Status Penagihan UPT (Tabel Interaktif Cepat) */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">
              Rekap Status Tagihan UPT ({selectedMonth === 'semua' ? 'Semua Bulan' : MONTH_NAMES[Number(selectedMonth) - 1]} {selectedYear})
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Status pelunasan bagi hasil per UPT (misal: Lapas Cipinang bulan Januari sudah dibayar).
            </p>
          </div>

          {/* Filter Status Button Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setStatusFilter('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'semua' ? 'bg-white text-[#0B3D91] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_CONFIRMATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'PENDING_CONFIRMATION' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'UNPAID' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Belum Bayar
            </button>
          </div>
        </div>

        {/* Tabel Data Rekap Tagihan */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-4 rounded-l-xl">No. Tagihan & Periode</th>
                <th className="py-3 px-4">Nama UPT & Pengelola</th>
                <th className="py-3 px-4 text-right">Durasi Panggilan</th>
                <th className="py-3 px-4 text-right">Omset Kotor</th>
                <th className="py-3 px-4 text-center">Bagi Hasil 4 Pihak</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBillings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Tidak ada data tagihan untuk filter yang dipilih
                  </td>
                </tr>
              ) : (
                recentBillings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID & Bulan */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0B3D91]">{b.id}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{MONTH_NAMES[b.month - 1]} {b.year}</span>
                      </div>
                    </td>

                    {/* UPT Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.branchName}</div>
                      <div className="text-xs text-slate-500">{b.canteenName}</div>
                    </td>

                    {/* Durasi */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      <div>{b.totalMinutes.toLocaleString('id-ID')} menit</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        ({b.totalSeconds.toLocaleString('id-ID')} detik)
                      </div>
                    </td>

                    {/* Omset */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(b.grossAmount)}
                    </td>

                    {/* Pembagian 4 Pihak mini pills */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 max-w-[200px] mx-auto text-[11px]">
                        <div className="flex justify-between items-center bg-purple-50/80 text-purple-800 px-2 py-0.5 rounded">
                          <span>Kepala UPT (5%):</span>
                          <span className="font-semibold">{formatRupiah(b.shares?.kepalaUpt?.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-sky-50/80 text-sky-800 px-2 py-0.5 rounded">
                          <span>Koperasi (30%):</span>
                          <span className="font-semibold">{formatRupiah(b.shares?.koperasi?.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-50/80 text-amber-800 px-2 py-0.5 rounded">
                          <span>Inkopasindo (10%):</span>
                          <span className="font-semibold">{formatRupiah(b.shares?.inkopasindo?.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-50/80 text-indigo-800 px-2 py-0.5 rounded">
                          <span>Vendor (55%):</span>
                          <span className="font-semibold">{formatRupiah(b.shares?.vendor?.amount)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {b.status === 'PAID' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah Dibayar</span>
                        </div>
                      ) : b.status === 'PENDING_CONFIRMATION' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>Menunggu Verifikasi</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Belum Dibayar</span>
                        </div>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status !== 'PAID' && (
                          <button
                            onClick={() => handleQuickPay(b.id, b.branchName, b.month)}
                            title="Tandai Lunas"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Set Lunas
                          </button>
                        )}
                        <Link
                          to={`/finance/billing?id=${b.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Lihat Rincian Lengkap"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Link Ke Halaman Penuh Tagihan */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Menampilkan ringkasan status penagihan per UPT.
          </span>
          <Link
            to="/finance/billing"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3D91] hover:text-blue-700 cursor-pointer"
          >
            <span>Buka Seluruh Rekap Tagihan UPT</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
