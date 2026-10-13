import React from 'react';
import { Link } from 'react-router-dom';
import { Printer, ArrowLeft, User, ShoppingBag } from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatKantin';
import { VOUCHER_CODE_LENGTH } from '../../config/voucherConfig';

export default function StrukTransaksi({ transaksi }) {
  if (!transaksi) return null;

  const handleCetak = () => {
    window.print();
  };

  const hargaTotal = transaksi.paket?.total ?? transaksi.paket?.harga ?? 0;
  const dpp = transaksi.paket?.dpp ?? Math.round(hargaTotal / 1.11);
  const ppn = transaksi.paket?.ppn ?? (hargaTotal - dpp);
  const total = hargaTotal;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Tombol Aksi di Luar Print */}
      <div className="no-print flex items-center justify-between mb-4">
        <Link
          to="/kantin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1565C0] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Paket</span>
        </Link>
        <Link
          to="/kantin/riwayat"
          className="text-xs font-semibold text-[#1565C0] hover:underline"
        >
          Lihat Riwayat Transaksi &rarr;
        </Link>
      </div>

      {/* Kartu Struk (ID: struk untuk print CSS termal 58mm) */}
      <div
        id="struk"
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8"
      >
        {/* TAMPILAN KHUSUS LAYAR (WEB) - 100% identik dengan aslinya */}
        <div className="struk-screen-view print:hidden">
          {/* Header Struk */}
          <div className="text-center pb-6 border-b border-dashed border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Pembayaran Berhasil
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Paket komunikasi telah berhasil diaktifkan.
            </p>

            {/* Blok Kode Voucher */}
            {transaksi.kodeVoucher && (
              <div className="struk-voucher-box w-full mt-4 p-4 sm:p-5 rounded-2xl border-[3px] border-[#0D47A1] bg-[#EAF2FF] text-center shadow-xs">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#0D47A1]">
                  KODE VOUCHER ANDA
                </p>
                <div
                  className={`struk-voucher-code my-3.5 sm:my-4 font-black font-mono leading-none text-[#0F172A] select-all whitespace-nowrap overflow-hidden ${
                    String(transaksi.kodeVoucher).length > VOUCHER_CODE_LENGTH
                      ? 'text-[36px] sm:text-[40px] tracking-wider'
                      : 'text-[40px] sm:text-[44px] md:text-[48px] tracking-wider sm:tracking-widest'
                  }`}
                >
                  {String(transaksi.kodeVoucher)}
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Masukkan kode ini pada bilik KBU PasCall. Kode berlaku selama 1 hari selama kuota paket masih tersedia.
                </p>
              </div>
            )}

            {/* Nomor Transaksi */}
            <div className="mt-4">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                No. Transaksi
              </span>
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-full">
                <span className="text-xs font-mono font-bold text-slate-600">
                  {transaksi.id}
                </span>
              </div>
            </div>
          </div>

          {/* Brand Kantin PasCall Info */}
          <div className="py-4 border-b border-dashed border-slate-200 text-xs flex justify-between items-center text-slate-500">
            <div>
              <span className="font-bold text-slate-700">PasCall</span>
              <p className="text-[11px]">Layanan Komunikasi Terpadu</p>
            </div>
            <div className="text-right">
              <span className="font-medium text-slate-600">
                {formatTanggal(transaksi.waktu, true)}
              </span>
            </div>
          </div>

          {/* Rincian Transaksi */}
          <div className="py-5 space-y-3.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Pelanggan
              </span>
              <span className="font-bold text-slate-800">{transaksi.napi?.nama}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-500 text-xs flex items-center gap-1.5 shrink-0 mt-0.5">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                Paket Dibeli
              </span>
              <div className="text-right">
                <p className="font-bold text-slate-800">{transaksi.paket?.nama}</p>
                {transaksi.paket?.keterangan && (
                  <p className="text-[11px] text-slate-500">
                    {transaksi.paket.keterangan}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Petugas Kasir
              </span>
              <span className="font-semibold text-slate-700 text-xs">
                {transaksi.petugas || transaksi.cashier?.name || 'Petugas Kantin'}
              </span>
            </div>
          </div>

          {/* Rincian Subtotal, PPN 11%, dan Total Pembayaran */}
          <div className="pt-4 border-t border-dashed border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal (DPP)</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatRupiah(dpp)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>PPN 11%</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatRupiah(ppn)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-blue-50/70 p-4 rounded-2xl border border-blue-100 mt-2">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500">Total Pembayaran</span>
                <p className="text-[11px] text-slate-400">Termasuk PPN 11%</p>
              </div>
              <span className="text-2xl font-black text-[#1565C0]">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          {/* Footer Catatan Struk */}
          <div className="mt-6 text-center text-[11px] text-slate-400 space-y-1">
            <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
            <p>Terima kasih telah menggunakan layanan PasCall.</p>
          </div>
        </div>

        {/* TAMPILAN KHUSUS CETAK TERMAL 58mm (LEBAR AREA 48mm) - Rapi, Tajam, Terstruktur */}
        <div className="struk-print-view hidden print:block text-black">
          {/* 1. Header Kantin & Tanggal */}
          <div className="text-center">
            <div className="font-bold text-[14px] tracking-wide">PasCall</div>
            <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5">STRUK PEMBELIAN</div>
            <div className="text-[10px] font-mono mt-0.5">{formatTanggal(transaksi.waktu, true)}</div>
          </div>

          {/* 2. Garis putus-putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* 3. Kotak Kode Voucher Tegas & Rapi (Sama seperti Voucher) */}
          {transaksi.kodeVoucher && (
            <div className="text-center my-1">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1">KODE VOUCHER</div>
              <div className="inline-block border-2 border-black rounded px-3 py-1 font-black font-mono text-2xl tracking-widest my-0.5 select-all">
                {String(transaksi.kodeVoucher)}
              </div>
              <div className="text-[10px] leading-tight font-medium mt-1">
                Gunakan kode ini pada bilik KBU PasCall.
              </div>
              <div className="text-[9px] leading-tight font-medium mt-0.5">
                Kode berlaku 1 hari selama kuota paket masih tersedia.
              </div>
            </div>
          )}

          {/* 4. Paket Dibeli */}
          <div className="text-center my-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider">PAKET DIBELI</div>
            <div className="text-[12px] font-black mt-0.5">
              {transaksi.paket?.nama || '-'}
            </div>
          </div>

          {/* 5. Garis putus-putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* 6. No. Trx & Pelanggan (Label ringkas agar ID tidak terpotong 2 baris) */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0 font-medium">No. Trx:</span>
              <span className="font-mono font-bold text-right text-[10.5px] break-all">{transaksi.id}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0 font-medium">Pelanggan:</span>
              <span className="font-bold text-right break-words">{transaksi.napi?.nama || '-'}</span>
            </div>
          </div>

          {/* 7. Garis putus-putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* 8. Rincian Keuangan: Subtotal, PPN 11%, dan TOTAL */}
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between items-baseline gap-1">
              <span>Subtotal:</span>
              <span className="font-mono text-right">{formatRupiah(dpp)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span>PPN 11%:</span>
              <span className="font-mono text-right">{formatRupiah(ppn)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1 font-black text-[12px] pt-1">
              <span>TOTAL:</span>
              <span className="font-mono text-right">{formatRupiah(total)}</span>
            </div>
          </div>

          {/* 9. Garis putus-putus & Penutup */}
          <div className="border-b border-dashed border-black my-1.5" />
          <div className="text-center text-[10px] pt-0.5 pb-1 font-medium">
            Terima kasih
          </div>
        </div>
      </div>

      {/* Tombol Aksi di Layar (no-print) */}
      <div className="no-print mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCetak}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Struk</span>
        </button>

        <Link
          to="/kantin"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-xs transition text-center"
        >
          <span>Kembali ke Paket</span>
        </Link>
      </div>
    </div>
  );
}
