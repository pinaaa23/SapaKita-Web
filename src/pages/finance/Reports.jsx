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
    let isSubscribed = true;

    const fetchAndProcessData = async () => {
      try {
        const rawBillings = await getAllFinanceBillings();
        if (!isSubscribed) return;

        const all = (Array.isArray(rawBillings) ? rawBillings : []).filter(
          (b) => b.year === Number(selectedYear)
        );

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
      } catch (err) {
        console.warn('[FinanceReports] Error processing reports data:', err);
      }
    };

    fetchAndProcessData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedYear]);

  const handleExportCSV = () => {
    const headers = [
      'Bulan',
      'Total Pondok Pesantren',
      'Omset Kotor (Rp)',
      'Lunas (Rp)',
      'Menunggu (Rp)',
      'Belum Bayar (Rp)',
      'Hak Pimpinan Pondok (Rp)',
      'Hak Kopontren (Rp)',
      'Hak Yayasan Pesantren (Rp)',
      'Hak Vendor SapaKita (Rp)',
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
    link.download = `Laporan_Keuangan_SapaKita_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 -mt-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E6F4F1] text-[#0D7A73] border border-teal-200 text-xs font-bold whitespace-nowrap">
            Akumulasi Tahunan
          </span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Rekapitulasi omset kotor nasional &amp; pembagian hasil 4 pihak
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
            >
              <option value="2026">Tahun Buku 2026</option>
              <option value="2025">Tahun Buku 2025</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* 2. Kartu Ringkasan (Stat Cards Rapi dengan Ikon & Whitespace-Nowrap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Akumulasi Omset */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Omset Kotor
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#0D7A73] border border-teal-100 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
              {formatRupiah(grandTotals.omset)}
            </p>
            <span className="text-[11px] text-[#0D7A73] font-semibold mt-1 block">
              Tahun Buku {selectedYear}
            </span>
          </div>
        </div>

        {/* Total Dana Terealisasi (Lunas) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sudah Terealisasi
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl lg:text-2xl font-black text-emerald-700 tracking-tight whitespace-nowrap">
              {formatRupiah(grandTotals.paid)}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Telah disetor &amp; diverifikasi
            </span>
          </div>
        </div>

        {/* Menunggu Konfirmasi Transfer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Menunggu Verifikasi
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl lg:text-2xl font-black text-amber-600 tracking-tight whitespace-nowrap">
              {formatRupiah(grandTotals.pending)}
            </p>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
              Proses konfirmasi admin finance
            </span>
          </div>
        </div>

        {/* Piutang Belum Tertagih */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Belum Tertagih
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl lg:text-2xl font-black text-rose-600 tracking-tight whitespace-nowrap">
              {formatRupiah(grandTotals.unpaid)}
            </p>
            <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
              Sisa tagihan berjalan Pondok Pesantren
            </span>
          </div>
        </div>
      </div>

      {/* 3. Rekapitulasi Hak Stakeholder 4 Pihak (Tanpa Teks Terpotong) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Rekapitulasi Hak Finansial 4 Stakeholder ({selectedYear})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Akumulasi pembagian hasil kotor nasional berdasarkan skema kontrak resmi 4 pihak.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Pimpinan Pondok */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/70 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-900">1. Pimpinan Pondok</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-bold">5%</span>
              </div>
              <p className="text-lg font-black text-purple-950 mt-1 whitespace-nowrap">
                {formatRupiah(stakeholderTotals.kepalaUpt.total)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-purple-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Terealisasi:</span>
                <span className="font-bold text-emerald-700 block whitespace-nowrap">{formatRupiah(stakeholderTotals.kepalaUpt.paid)}</span>
              </div>
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Tertunda:</span>
                <span className="font-bold text-rose-600 block whitespace-nowrap">{formatRupiah(stakeholderTotals.kepalaUpt.unpaid)}</span>
              </div>
            </div>
          </div>

          {/* 2. Kopontren */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/70 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-900">2. Kopontren</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 text-[10px] font-bold">30%</span>
              </div>
              <p className="text-lg font-black text-sky-950 mt-1 whitespace-nowrap">
                {formatRupiah(stakeholderTotals.koperasi.total)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-sky-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Terealisasi:</span>
                <span className="font-bold text-emerald-700 block whitespace-nowrap">{formatRupiah(stakeholderTotals.koperasi.paid)}</span>
              </div>
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Tertunda:</span>
                <span className="font-bold text-rose-600 block whitespace-nowrap">{formatRupiah(stakeholderTotals.koperasi.unpaid)}</span>
              </div>
            </div>
          </div>

          {/* 3. Yayasan Pesantren */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-900">3. Yayasan Pesantren</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">10%</span>
              </div>
              <p className="text-lg font-black text-amber-950 mt-1 whitespace-nowrap">
                {formatRupiah(stakeholderTotals.inkopasindo.total)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Terealisasi:</span>
                <span className="font-bold text-emerald-700 block whitespace-nowrap">{formatRupiah(stakeholderTotals.inkopasindo.paid)}</span>
              </div>
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Tertunda:</span>
                <span className="font-bold text-rose-600 block whitespace-nowrap">{formatRupiah(stakeholderTotals.inkopasindo.unpaid)}</span>
              </div>
            </div>
          </div>

          {/* 4. Vendor */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/70 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0D7A73]">4. Vendor (SapaKita)</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">55%</span>
              </div>
              <p className="text-lg font-black text-teal-950 mt-1 whitespace-nowrap">
                {formatRupiah(stakeholderTotals.vendor.total)}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-teal-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Terealisasi:</span>
                <span className="font-bold text-emerald-700 block whitespace-nowrap">{formatRupiah(stakeholderTotals.vendor.paid)}</span>
              </div>
              <div className="bg-white/80 rounded-lg p-2">
                <span className="text-slate-500 block text-[10px]">Tertunda:</span>
                <span className="font-bold text-rose-600 block whitespace-nowrap">{formatRupiah(stakeholderTotals.vendor.unpaid)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabel Rincian Bulanan (Tabel Lega, Tanpa Angka Terpotong, Lengkap dengan Total) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Rincian Omset &amp; Realisasi Pembagian Hasil Bulanan ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian performa keuangan, realisasi setoran, dan hak bagi hasil per bulan buku.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 self-start sm:self-center">
            {monthlyData.length} Bulan Terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-4 rounded-l-xl">Bulan</th>
                <th className="py-3 px-4 text-center">Jumlah Pondok</th>
                <th className="py-3 px-4 text-right">Omset Kotor</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Belum Dibayar</th>
                <th className="py-3 px-4 text-right">Pimpinan Pondok (5%)</th>
                <th className="py-3 px-4 text-right">Kopontren (30%)</th>
                <th className="py-3 px-4 text-right">Yayasan (10%)</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Vendor SapaKita (55%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {m.monthName} {selectedYear}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-xs whitespace-nowrap">
                      {m.totalUpt} Pondok
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatRupiah(m.gross)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                    {formatRupiah(m.paid)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                    {formatRupiah(m.unpaid + m.pending)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-purple-900 whitespace-nowrap">
                    {formatRupiah(m.shares.kepalaUpt)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-sky-900 whitespace-nowrap">
                    {formatRupiah(m.shares.koperasi)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-900 whitespace-nowrap">
                    {formatRupiah(m.shares.inkopasindo)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-teal-900 whitespace-nowrap">
                    {formatRupiah(m.shares.vendor)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Summary Footer */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/90 font-extrabold text-slate-900">
                <td className="py-3 px-4 rounded-l-xl">Total Akumulasi</td>
                <td className="py-3 px-4 text-center">-</td>
                <td className="py-3 px-4 text-right text-slate-900 whitespace-nowrap">{formatRupiah(grandTotals.omset)}</td>
                <td className="py-3 px-4 text-right text-emerald-700 whitespace-nowrap">{formatRupiah(grandTotals.paid)}</td>
                <td className="py-3 px-4 text-right text-rose-600 whitespace-nowrap">{formatRupiah(grandTotals.unpaid + grandTotals.pending)}</td>
                <td className="py-3 px-4 text-right text-purple-900 whitespace-nowrap">{formatRupiah(stakeholderTotals.kepalaUpt.total)}</td>
                <td className="py-3 px-4 text-right text-sky-900 whitespace-nowrap">{formatRupiah(stakeholderTotals.koperasi.total)}</td>
                <td className="py-3 px-4 text-right text-amber-900 whitespace-nowrap">{formatRupiah(stakeholderTotals.inkopasindo.total)}</td>
                <td className="py-3 px-4 text-right rounded-r-xl text-teal-900 whitespace-nowrap">{formatRupiah(stakeholderTotals.vendor.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
