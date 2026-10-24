import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Wallet,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight
} from 'lucide-react';
import {
  getAllFinanceBillings,
  formatRupiah,
  MONTH_NAMES
} from '../../services/financeService';

export default function FinanceReports() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [monthlyData, setMonthlyData] = useState([]);
  const [stakeholderTotals, setStakeholderTotals] = useState({
    kepalaUpt: { total: 0, paid: 0, unpaid: 0 },
    koperasi: { total: 0, paid: 0, unpaid: 0 },
    inkopasindo: { total: 0, paid: 0, unpaid: 0 },
    vendor: { total: 0, paid: 0, unpaid: 0 },
  });
  const [grandTotals, setGrandTotals] = useState({
    omset: 0,
    paid: 0,
    pending: 0,
    unpaid: 0,
  });

  useEffect(() => {
    const all = getAllFinanceBillings().filter((b) => b.year === Number(selectedYear));

    // Rekap per bulan (1-10)
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const grouped = months.map((m) => {
      const monthItems = all.filter((b) => b.month === m);
      const gross = monthItems.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
      const paid = monthItems.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
      const pending = monthItems.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
      const unpaid = monthItems.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

      const ku = monthItems.reduce((acc, b) => acc + (b.shares?.kepalaUpt?.amount || 0), 0);
      const kop = monthItems.reduce((acc, b) => acc + (b.shares?.koperasi?.amount || 0), 0);
      const ink = monthItems.reduce((acc, b) => acc + (b.shares?.inkopasindo?.amount || 0), 0);
      const ven = monthItems.reduce((acc, b) => acc + (b.shares?.vendor?.amount || 0), 0);

      return {
        month: m,
        monthName: MONTH_NAMES[m - 1],
        totalUpt: monthItems.length,
        gross,
        paid,
        pending,
        unpaid,
        shares: { kepalaUpt: ku, koperasi: kop, inkopasindo: ink, vendor: ven },
      };
    });

    setMonthlyData(grouped);

    // Stakeholder totals
    const st = {
      kepalaUpt: { total: 0, paid: 0, unpaid: 0 },
      koperasi: { total: 0, paid: 0, unpaid: 0 },
      inkopasindo: { total: 0, paid: 0, unpaid: 0 },
      vendor: { total: 0, paid: 0, unpaid: 0 },
    };

    all.forEach((b) => {
      const isPaid = b.status === 'PAID';
      const ku = b.shares?.kepalaUpt?.amount || 0;
      const kop = b.shares?.koperasi?.amount || 0;
      const ink = b.shares?.inkopasindo?.amount || 0;
      const ven = b.shares?.vendor?.amount || 0;

      st.kepalaUpt.total += ku;
      if (isPaid) st.kepalaUpt.paid += ku;
      else st.kepalaUpt.unpaid += ku;

      st.koperasi.total += kop;
      if (isPaid) st.koperasi.paid += kop;
      else st.koperasi.unpaid += kop;

      st.inkopasindo.total += ink;
      if (isPaid) st.inkopasindo.paid += ink;
      else st.inkopasindo.unpaid += ink;

      st.vendor.total += ven;
      if (isPaid) st.vendor.paid += ven;
      else st.vendor.unpaid += ven;
    });

    setStakeholderTotals(st);

    const omset = all.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const paid = all.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const pending = all.filter((b) => b.status === 'PENDING_CONFIRMATION').reduce((acc, b) => acc + (b.grossAmount || 0), 0);
    const unpaid = all.filter((b) => b.status === 'UNPAID').reduce((acc, b) => acc + (b.grossAmount || 0), 0);

    setGrandTotals({ omset, paid, pending, unpaid });
  }, [selectedYear]);

  const handleExportCSV = () => {
    const headers = [
      'Bulan',
      'Total UPT',
      'Omset Kotor (Rp)',
      'Lunas (Rp)',
      'Menunggu (Rp)',
      'Belum Bayar (Rp)',
      'Hak Kepala UPT (Rp)',
      'Hak Koperasi (Rp)',
      'Hak Inkopasindo (Rp)',
      'Hak Vendor (Rp)',
    ];

    const rows = monthlyData.map((m) => [
      `"${m.monthName} ${selectedYear}"`,
      m.totalUpt,
      m.gross,
      m.paid,
      m.pending,
      m.unpaid,
      m.shares.kepalaUpt,
      m.shares.koperasi,
      m.shares.inkopasindo,
      m.shares.vendor,
    ]);

    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `Laporan_Keuangan_PasCall_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-[#0B3D91]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800">
              Laporan Keuangan & Bagi Hasil Tahunan
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Akumulasi performa pendapatan nasional, status realisasi pembayaran, dan rekapitulasi porsi 4 pihak.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B3D91] cursor-pointer"
          >
            <option value="2026">Tahun Buku 2026</option>
            <option value="2025">Tahun Buku 2025</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Laporan</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Grand Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Akumulasi Omset</span>
          <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2">
            {formatRupiah(grandTotals.omset)}
          </p>
          <span className="text-[11px] text-blue-700 font-medium mt-1 block">Tahun Buku {selectedYear}</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Dana Terealisasi (Lunas)</span>
          <p className="text-xl md:text-2xl font-extrabold text-emerald-700 mt-2">
            {formatRupiah(grandTotals.paid)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Telah ditransfer ke stakeholder</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Menunggu Konfirmasi Transfer</span>
          <p className="text-xl md:text-2xl font-extrabold text-amber-600 mt-2">
            {formatRupiah(grandTotals.pending)}
          </p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Proses verifikasi admin</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Piutang Belum Tertagih</span>
          <p className="text-xl md:text-2xl font-extrabold text-rose-600 mt-2">
            {formatRupiah(grandTotals.unpaid)}
          </p>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block">Belum dibayar oleh kantin</span>
        </div>
      </div>

      {/* Rekapitulasi Hak Stakeholder 4 Pihak */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">
          Rekapitulasi Hak Finansial 4 Stakeholder ({selectedYear})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kepala UPT */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">1. Kepala UPT (5%)</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-bold">5%</span>
            </div>
            <p className="text-lg font-extrabold text-purple-950">
              {formatRupiah(stakeholderTotals.kepalaUpt.total)}
            </p>
            <div className="text-[11px] space-y-0.5 pt-2 border-t border-purple-200/60 text-purple-900">
              <div className="flex justify-between">
                <span>Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.kepalaUpt.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tertunda / Berjalan:</span>
                <span className="font-bold text-rose-700">{formatRupiah(stakeholderTotals.kepalaUpt.unpaid)}</span>
              </div>
            </div>
          </div>

          {/* Koperasi */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">2. Koperasi Lapas (30%)</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 text-[10px] font-bold">30%</span>
            </div>
            <p className="text-lg font-extrabold text-sky-950">
              {formatRupiah(stakeholderTotals.koperasi.total)}
            </p>
            <div className="text-[11px] space-y-0.5 pt-2 border-t border-sky-200/60 text-sky-900">
              <div className="flex justify-between">
                <span>Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.koperasi.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tertunda / Berjalan:</span>
                <span className="font-bold text-rose-700">{formatRupiah(stakeholderTotals.koperasi.unpaid)}</span>
              </div>
            </div>
          </div>

          {/* Inkopasindo */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">3. Inkopasindo (10%)</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">10%</span>
            </div>
            <p className="text-lg font-extrabold text-amber-950">
              {formatRupiah(stakeholderTotals.inkopasindo.total)}
            </p>
            <div className="text-[11px] space-y-0.5 pt-2 border-t border-amber-200/60 text-amber-900">
              <div className="flex justify-between">
                <span>Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.inkopasindo.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tertunda / Berjalan:</span>
                <span className="font-bold text-rose-700">{formatRupiah(stakeholderTotals.inkopasindo.unpaid)}</span>
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">4. Vendor Sadewa (55%)</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-bold">55%</span>
            </div>
            <p className="text-lg font-extrabold text-indigo-950">
              {formatRupiah(stakeholderTotals.vendor.total)}
            </p>
            <div className="text-[11px] space-y-0.5 pt-2 border-t border-indigo-200/60 text-indigo-900">
              <div className="flex justify-between">
                <span>Terealisasi:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(stakeholderTotals.vendor.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tertunda / Berjalan:</span>
                <span className="font-bold text-rose-700">{formatRupiah(stakeholderTotals.vendor.unpaid)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Rincian Per Bulan */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm overflow-hidden">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          Rincian Omset & Realisasi Pembagian Hasil Bulanan ({selectedYear})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/80">
                <th className="py-3 px-4 rounded-l-xl">Bulan</th>
                <th className="py-3 px-4 text-center">Jumlah UPT</th>
                <th className="py-3 px-4 text-right">Omset Kotor</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Belum Dibayar</th>
                <th className="py-3 px-4 text-right">Kepala UPT (5%)</th>
                <th className="py-3 px-4 text-right">Koperasi (30%)</th>
                <th className="py-3 px-4 text-right">Inkopasindo (10%)</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Vendor (55%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {m.monthName} {selectedYear}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                    {m.totalUpt} UPT
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    {formatRupiah(m.gross)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    {formatRupiah(m.paid)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                    {formatRupiah(m.unpaid + m.pending)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-purple-900">
                    {formatRupiah(m.shares.kepalaUpt)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-sky-900">
                    {formatRupiah(m.shares.koperasi)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-amber-900">
                    {formatRupiah(m.shares.inkopasindo)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-indigo-900">
                    {formatRupiah(m.shares.vendor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
