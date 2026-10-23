import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileSpreadsheet, Download, Receipt, Ticket } from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatKantin';
import { exportToPDF } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { VOUCHER_CODE_LENGTH } from '../../config/voucherConfig';
import EmptyState from './EmptyState';

export default function TabelTransaksi({
  transaksiList = [],
  metodeFilter = 'Semua',
  onMetodeFilterChange,
  pencarian = '',
  onPencarianChange,
  periode = 'harian',
  tanggal = new Date(),
  isLoading = false,
}) {
  const navigate = useNavigate();
  const { uptName, userName, roleLabel } = useAuth();

  const handleRowClick = (id) => {
    navigate(`/kantin/struk/${id}`);
  };

  const validTransaksiList = Array.isArray(transaksiList)
    ? transaksiList.filter(Boolean)
    : [];

  const totalNominal = validTransaksiList.reduce(
    (acc, curr) => acc + Number(curr?.paket?.harga || curr?.paket?.total || 0),
    0
  );

  const getMetodeBadge = (metode) => {
    if (metode === 'Tunai') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const maskVoucher = (code) => {
    if (!code) return '-';
    const str = String(code).trim();
    if (!str) return '-';
    if (str.startsWith('PAS-')) return str;
    const suffix = str.length >= 2 ? str.slice(-2) : str;
    const defaultMaskLen = Math.max(VOUCHER_CODE_LENGTH - 2, 3);
    const maskedLength = str.length > suffix.length ? str.length - suffix.length : defaultMaskLen;
    return `PAS-${'•'.repeat(Math.max(maskedLength, 1))}-${suffix}`;
  };

  const getPeriodeLabel = (per, tgl) => {
    const d = new Date(tgl || Date.now());
    if (per === 'harian') {
      return `Harian (${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`;
    }
    if (per === 'bulanan') {
      return `Bulanan (${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
    }
    if (per === 'tahunan') {
      return `Tahunan (${d.getFullYear()})`;
    }
    return 'Semua Periode';
  };

  const handleExportPDF = () => {
    if (!validTransaksiList || validTransaksiList.length === 0) {
      alert('Tidak ada data untuk diekspor ke PDF.');
      return;
    }

    const headers = [
      'ID TRANSAKSI',
      'WAKTU',
      'NAMA PELANGGAN',
      'NIP WBP',
      'KETERANGAN PAKET',
      'KODE VOUCHER',
      'METODE',
      'NOMINAL',
    ];

    const rows = validTransaksiList.map((item) => [
      item?.id || '-',
      formatTanggal(item?.waktu, true),
      item?.napi?.nama || '-',
      item?.napi?.id || '-',
      item?.paket?.nama || '-',
      maskVoucher(item?.kodeVoucher),
      item?.metode || 'Tunai',
      formatRupiah(item?.paket?.harga || item?.paket?.total || 0),
    ]);

    const summaryMetrics = [
      { label: 'JUMLAH TRANSAKSI', value: `${validTransaksiList.length} Transaksi` },
      { label: 'TOTAL PEMASUKAN', value: formatRupiah(totalNominal) },
    ];

    const branchName = uptName || 'UPT Cipinang';
    const cleanBranch = branchName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Kantin_${cleanBranch}_${periode}_${dateStr}.pdf`;

    exportToPDF({
      title: 'LAPORAN REKAP TRANSAKSI KANTIN',
      subtitle: `Rekapitulasi penjualan paket komunikasi kantin warga binaan`,
      filename,
      headers,
      rows,
      orientation: 'landscape',
      metadata: {
        'Lokasi Cabang': branchName,
        'Petugas / Operator': `${userName || 'Operator Kantin'} (${roleLabel || 'Operator Kantin'})`,
        'Periode Laporan': getPeriodeLabel(periode, tanggal),
        'Filter Metode': metodeFilter === 'Semua' ? 'Semua Metode' : metodeFilter,
        ...(pencarian ? { 'Kata Kunci Pencarian': pencarian } : {}),
        'Tanggal Cetak': new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
      summaryMetrics,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header Tabel & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Riwayat Transaksi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Jika ada kesalahan input setelah transaksi tercatat, hubungi Admin Cabang.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Total: <span className="text-[#1565C0] font-bold">{transaksiList.length}</span> transaksi
          </div>
        </div>

        {/* Input Pencarian, Filter Metode & Tombol Ekspor PDF */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Kolom Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={pencarian}
              onChange={(e) => onPencarianChange(e.target.value)}
              placeholder="Cari ID transaksi, voucher, nama, NIP WBP..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {/* Filter Metode Pill */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {['Semua', 'Tunai'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMetodeFilterChange(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    metodeFilter === m
                      ? 'bg-[#1565C0] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Tombol Ekspor PDF (Gaya seragam dengan halaman Admin) */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={!transaksiList || transaksiList.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Ekspor Laporan Transaksi ke PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#1565C0]" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Area Isi Tabel */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-[#1565C0] border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs font-medium">Memuat riwayat transaksi...</p>
        </div>
      ) : transaksiList.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="Belum Ada Transaksi"
            description="Tidak ditemukan riwayat transaksi pada periode dan kriteria pencarian ini."
            icon={FileSpreadsheet}
          />
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[980px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 min-w-[140px]">ID Transaksi</th>
                <th className="py-3.5 px-4 min-w-[130px]">Waktu</th>
                <th className="py-3.5 px-4 min-w-[140px]">Nama Pelanggan</th>
                <th className="py-3.5 px-4 min-w-[110px]">NIP WBP</th>
                <th className="py-3.5 px-4 min-w-[150px]">Keterangan Paket</th>
                <th className="py-3.5 px-4 min-w-[90px]">Metode</th>
                <th className="py-3.5 px-4 text-right min-w-[110px]">Nominal</th>
                <th className="py-3.5 px-4 text-center min-w-[150px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validTransaksiList.map((item, idx) => (
                <tr
                  key={item?.id ? `${item.id}-${idx}` : idx}
                  onClick={() => item?.id && handleRowClick(item.id)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap min-w-[140px]">
                    <div>{item?.id || '-'}</div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {maskVoucher(item?.kodeVoucher)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap min-w-[130px]">
                    {formatTanggal(item?.waktu, true)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap min-w-[140px]">
                    {item?.napi?.nama || '-'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">
                    <span className="font-mono text-slate-700 font-semibold block">
                      {item?.napi?.id || '-'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap min-w-[150px]">
                    {item?.paket?.nama || '-'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap min-w-[90px]">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${getMetodeBadge(
                        item?.metode
                      )}`}
                    >
                      {item?.metode || 'Tunai'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-[#1565C0] text-right whitespace-nowrap text-sm min-w-[110px]">
                    {formatRupiah(item?.paket?.harga || item?.paket?.total || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/kantin/struk/${item.id}`)}
                        title="Lihat Struk Pembayaran"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#1565C0] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition cursor-pointer shadow-2xs shrink-0"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Struk</span>
                      </button>
                      {item.kodeVoucher ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/kantin/voucher/${item.id}`)}
                          title="Lihat Kode Voucher KBU"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1565C0] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs shrink-0"
                        >
                          <Ticket className="w-3.5 h-3.5 text-[#1565C0]" />
                          <span>Voucher</span>
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Baris Total di Bawah Tabel */}
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <td
                  colSpan={6}
                  className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px] text-slate-500"
                >
                  Total Nominal ({transaksiList.length} Transaksi)
                </td>
                <td className="py-3.5 px-4 text-right text-[#1565C0] font-black text-sm whitespace-nowrap min-w-[110px]">
                  {formatRupiah(totalNominal)}
                </td>
                <td className="py-3.5 px-4 min-w-[150px]"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
