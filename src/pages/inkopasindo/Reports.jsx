import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Printer,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  getInkopasindoReportsData,
  exportInkopasindoReportExcel,
  generateInkopasindoReportPDF,
  formatRupiah
} from '../../services/inkopasindoService';

export default function InkopasindoReports() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isLoading, setIsLoading] = useState(true);

  const [grandTotals, setGrandTotals] = useState({
    totalOmsetKotor: 0,
    totalRealized: 0,
    totalPending: 0,
    totalUnpaid: 0,
  });

  const [stakeholderTotals, setStakeholderTotals] = useState({
    vendor: { total: 0, realized: 0, pending: 0, percent: 60 },
    upt: { total: 0, realized: 0, pending: 0, percent: 30 },
    inkopasindo: { total: 0, realized: 0, pending: 0, percent: 10 },
  });

  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const data = await getInkopasindoReportsData(selectedYear);
      setGrandTotals(data.grandTotals);
      setStakeholderTotals(data.stakeholderTotals);
      setMonthlyBreakdown(data.monthlyBreakdown);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        console.error(`[InkopasindoReports] Request laporan ditolak (${err.status}): Akses ditolak oleh server.`, err);
      } else {
        console.error('[InkopasindoReports] Failed to load reports data:', err);
      }
      // TODO: Tampilkan keadaan kosong yang rapi jika terjadi penolakan atau data belum tersedia di BE
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedYear]);

  const handleExportExcel = () => {
    exportInkopasindoReportExcel({
      year: selectedYear,
      monthlyBreakdown,
      grandTotals,
      stakeholderTotals,
    });
  };

  const handlePrint = () => {
    generateInkopasindoReportPDF({
      year: selectedYear,
      monthlyBreakdown,
      grandTotals,
      stakeholderTotals,
      openPreview: true,
    });
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4 print:bg-white text-slate-800">
      {/* CSS Khusus Print Browser (Mencegah Blank Page saat Ctrl+P) */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, [class*="fixed"], button {
            display: none !important;
          }
          html, body, #root, [class*="min-h-screen"], main {
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .shadow-xs, .shadow-2xs, .shadow-md {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* 1. Top Action Bar: Badge Periode, Ekspor Excel (.xlsx), Cetak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 -mt-1 print:hidden">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200/80 text-xs font-bold whitespace-nowrap">
            Akumulasi Tahun {selectedYear}
          </span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Rekapitulasi tahunan omset kotor &amp; hak finansial 3 pihak
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tahun */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-medium">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Tombol Ekspor Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcel}
            title="Unduh berkas Excel (.xlsx) rapi dengan multi-kolom terstruktur"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {/* Tombol Cetak Dokumen PDF */}
          <button
            type="button"
            onClick={handlePrint}
            title="Cetak & Unduh Dokumen PDF Resmi Laporan Finansial"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. Akumulasi Tahunan (4 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset Kotor */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omset Kotor</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary shrink-0 border border-blue-100/60">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-3">
              {formatRupiah(grandTotals.totalOmsetKotor)}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 font-medium">
            Akumulasi 12 bulan berjalan
          </p>
        </div>

        {/* Sudah Terealisasi (Lunas) */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sudah Terealisasi</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-700 tracking-tight mt-3">
              {formatRupiah(grandTotals.totalRealized)}
            </p>
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-2.5 font-medium">
            Setoran terverifikasi lunas
          </p>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Menunggu Verifikasi</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/60">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-600 tracking-tight mt-3">
              {formatRupiah(grandTotals.totalPending)}
            </p>
          </div>
          <p className="text-[11px] text-amber-600/80 mt-2.5 font-medium">
            Menunggu konfirmasi admin
          </p>
        </div>

        {/* Belum Tertagih / Belum Bayar */}
        <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Belum Tertagih</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100/60">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-rose-600 tracking-tight mt-3">
              {formatRupiah(grandTotals.totalUnpaid)}
            </p>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-2.5 font-medium">
            Kantin belum melakukan setoran
          </p>
        </div>
      </div>

      {/* 3. Kartu Hak Finansial 3 Pihak (Vendor, UPT, Inkopasindo) dengan Terealisasi & Tertunda */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              Hak Finansial 3 Pihak
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian nominal hak bagi hasil per entitas: total akumulasi, porsi terealisasi, dan porsi tertunda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* 1. Vendor (60%) */}
          <div className="rounded-2xl p-4.5 bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">1. Vendor (Sadewa)</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-xs">
                  {stakeholderTotals.vendor.percent}%
                </span>
              </div>
              <p className="text-2xl font-black text-indigo-950 mt-3">
                {formatRupiah(stakeholderTotals.vendor.total)}
              </p>
              <p className="text-[11px] text-indigo-600/80 font-medium mt-0.5">Total Hak Finansial</p>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-100/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-indigo-800 font-medium">Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.vendor.realized)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-800 font-medium">Tertunda:</span>
                <span className="font-bold text-amber-700">{formatRupiah(stakeholderTotals.vendor.pending)}</span>
              </div>
            </div>
          </div>

          {/* 2. UPT (30%) */}
          <div className="rounded-2xl p-4.5 bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">2. UPT Pemasyarakatan</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-black text-xs">
                  {stakeholderTotals.upt.percent}%
                </span>
              </div>
              <p className="text-2xl font-black text-sky-950 mt-3">
                {formatRupiah(stakeholderTotals.upt.total)}
              </p>
              <p className="text-[11px] text-sky-600/80 font-medium mt-0.5">Total Hak Finansial</p>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-100/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-sky-800 font-medium">Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.upt.realized)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sky-800 font-medium">Tertunda:</span>
                <span className="font-bold text-amber-700">{formatRupiah(stakeholderTotals.upt.pending)}</span>
              </div>
            </div>
          </div>

          {/* 3. Inkopasindo (10%) - Warna Kuning Amber */}
          <div className="rounded-2xl p-4.5 bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">3. Koperasi Inkopasindo</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-black text-xs">
                  {stakeholderTotals.inkopasindo.percent}%
                </span>
              </div>
              <p className="text-2xl font-black text-amber-950 mt-3">
                {formatRupiah(stakeholderTotals.inkopasindo.total)}
              </p>
              <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">Total Hak Finansial</p>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-900 font-medium">Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.inkopasindo.realized)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-900 font-medium">Tertunda:</span>
                <span className="font-bold text-amber-700">{formatRupiah(stakeholderTotals.inkopasindo.pending)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabel Rincian Bulanan */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              Rincian Omset &amp; Hak Bulanan ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi perputaran omset kotor dan pembagian hak 3 pihak per bulan dalam tahun buku.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 font-bold bg-slate-50/80">
                <th className="py-3 px-4">Bulan</th>
                <th className="py-3 px-4 text-center">Total UPT</th>
                <th className="py-3 px-4 text-right">Omset Kotor</th>
                <th className="py-3 px-4 text-right">Vendor ({stakeholderTotals.vendor.percent}%)</th>
                <th className="py-3 px-4 text-right">UPT ({stakeholderTotals.upt.percent}%)</th>
                <th className="py-3 px-4 text-right text-amber-800 bg-amber-50/40">
                  Inkopasindo ({stakeholderTotals.inkopasindo.percent}%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    Memuat data bulanan...
                  </td>
                </tr>
              ) : monthlyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    Tidak ada data bulanan untuk tahun {selectedYear}.
                  </td>
                </tr>
              ) : (
                monthlyBreakdown.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50/70 transition-colors">
                    {/* Bulan */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {m.monthName}
                    </td>

                    {/* Total UPT */}
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {m.totalUpt > 0 ? `${m.totalUpt} UPT` : '-'}
                    </td>

                    {/* Omset Kotor */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-800">
                      {formatRupiah(m.gross)}
                    </td>

                    {/* Vendor */}
                    <td className="py-3.5 px-4 text-right text-indigo-900 font-semibold">
                      {formatRupiah(m.shares.vendor)}
                    </td>

                    {/* UPT */}
                    <td className="py-3.5 px-4 text-right text-sky-900 font-semibold">
                      {formatRupiah(m.shares.upt)}
                    </td>

                    {/* Inkopasindo */}
                    <td className="py-3.5 px-4 text-right font-black text-amber-950 bg-amber-50/40">
                      {formatRupiah(m.shares.inkopasindo)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-100/80 font-black text-xs text-slate-800 border-t border-slate-200">
                <td className="py-3.5 px-4">TOTAL TAHUNAN</td>
                <td className="py-3.5 px-4 text-center">
                  {monthlyBreakdown.reduce((acc, m) => acc + (m.totalUpt || 0), 0)} Record
                </td>
                <td className="py-3.5 px-4 text-right">
                  {formatRupiah(grandTotals.totalOmsetKotor)}
                </td>
                <td className="py-3.5 px-4 text-right text-indigo-900">
                  {formatRupiah(stakeholderTotals.vendor.total)}
                </td>
                <td className="py-3.5 px-4 text-right text-sky-900">
                  {formatRupiah(stakeholderTotals.upt.total)}
                </td>
                <td className="py-3.5 px-4 text-right text-amber-950 bg-amber-100/50">
                  {formatRupiah(stakeholderTotals.inkopasindo.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
