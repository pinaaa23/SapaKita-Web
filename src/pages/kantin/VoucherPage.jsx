import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, Printer, ArrowRight, FileX, AlertCircle, ShoppingBag, History } from 'lucide-react';
import { getTransaksiById } from '../../services/kantin/kantinService';
import { formatTanggal } from '../../utils/formatKantin';
import { VOUCHER_CODE_LENGTH } from '../../config/voucherConfig';
import EmptyState from '../../components/kantin/EmptyState';

export default function VoucherPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaksi, setTransaksi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTransaksi = async () => {
      setIsLoading(true);
      try {
        const data = await getTransaksiById(id);
        if (isMounted) {
          setTransaksi(data);
        }
      } catch (err) {
        console.error('Gagal mengambil data transaksi voucher:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTransaksi();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const rawKodeVoucher = transaksi?.kodeVoucher;
  const kodeVoucher = rawKodeVoucher ? String(rawKodeVoucher).trim() : '';
  const isVoucherAvailable = Boolean(kodeVoucher);

  const handleSalinKode = async () => {
    if (!isVoucherAvailable) return;
    try {
      await navigator.clipboard.writeText(kodeVoucher);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Gagal menyalin kode:', err);
    }
  };

  const handleCetakVoucher = () => {
    if (!isVoucherAvailable) return;
    window.print();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 text-center bg-white rounded-2xl border border-slate-200 shadow-xs animate-pulse space-y-3">
        <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto" />
        <div className="h-5 bg-slate-200 rounded-md w-2/3 mx-auto" />
        <div className="h-3.5 bg-slate-100 rounded-md w-1/2 mx-auto" />
        <div className="h-32 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  if (!transaksi) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <EmptyState
          title="Transaksi Tidak Ditemukan"
          description={`Data transaksi dengan ID "${id}" tidak ditemukan dalam catatan kantin.`}
          icon={FileX}
          actionText="Kembali ke Paket"
          onAction={() => navigate('/kantin')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto py-0 sm:py-1 animate-in fade-in duration-300">
      {/* Header Halaman (Judul, Subjudul) */}
      <div className="text-center mb-4 sm:mb-5">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Pembayaran Berhasil
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Berikan kode ini kepada warga binaan.
        </p>
      </div>

      {/* Kartu Voucher Tengah (ID: voucher-cetak untuk cetak khusus) */}
      <div
        id="voucher-cetak"
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* TAMPILAN KHUSUS LAYAR (WEB) - warna gradien biru modern */}
        <div className="voucher-screen-view print:hidden">
          {/* Bagian Atas: Gradien Biru dengan Kode Voucher Sangat Besar (1 Baris) */}
          <div className="bg-gradient-to-br from-[#1565C0] via-[#1976D2] to-[#0D47A1] text-white p-4 sm:p-5 text-center relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <span className="inline-block text-[11px] uppercase font-bold tracking-widest text-blue-200 mb-1 px-3 py-0.5 bg-white/10 rounded-full">
              KODE VOUCHER
            </span>

            <div className="my-1.5 flex items-center justify-center">
              {isVoucherAvailable ? (
                <span
                  className={`font-black font-mono text-white whitespace-nowrap drop-shadow-xs select-all ${
                    kodeVoucher.length > VOUCHER_CODE_LENGTH
                      ? 'text-xl xs:text-2xl sm:text-3xl md:text-[38px] tracking-wider'
                      : 'text-2xl xs:text-3xl sm:text-4xl md:text-[44px] tracking-wider sm:tracking-widest'
                  }`}
                >
                  {kodeVoucher}
                </span>
              ) : (
                <div className="py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-300/40 text-amber-100 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Kode voucher tidak tersedia, hubungi admin</span>
                </div>
              )}
            </div>

            <p className="text-[10px] sm:text-[11px] text-blue-100/80">
              {isVoucherAvailable
                ? 'Gunakan kode ini pada bilik KBU Sadewa. Kode berlaku selama 1 hari selama kuota paket masih tersedia.'
                : 'Transaksi berhasil tercatat, namun kode voucher belum diterbitkan'}
            </p>
          </div>

          {/* Bagian Bawah: No. Transaksi, Nama Pelanggan, dan Nama Paket */}
          <div className="p-4 sm:p-5 space-y-2.5 bg-white text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">No. Transaksi</span>
              <span className="font-mono font-bold text-slate-800">
                {transaksi.id}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Nama Pelanggan</span>
              <span className="font-bold text-slate-800 text-sm">
                {transaksi.napi?.nama || '-'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Nama Paket</span>
              <span className="font-bold text-[#1565C0] text-sm">
                {transaksi.paket?.nama || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* TAMPILAN KHUSUS CETAK TERMAL 58mm (LEBAR AREA 48mm) - hitam pekat, tajam, tanpa buram */}
        <div className="voucher-print-view hidden print:block text-black">
          {/* 1. Header Kantin & Waktu Pembelian (Dibiarkan di Atas) */}
          <div className="text-center">
            <div className="font-bold text-[14px] tracking-wide">Sadewa</div>
            <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5">VOUCHER KOMUNIKASI</div>
            <div className="text-[10px] font-mono mt-0.5">{formatTanggal(transaksi.waktu, true)}</div>
          </div>

          {/* 2. Garis putus-putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* 3. Kotak Kode Voucher Tegas & Jelas */}
          <div className="text-center my-1">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1">KODE VOUCHER</div>
            <div className="inline-block border-2 border-black rounded px-3 py-1 font-black font-mono text-2xl tracking-widest my-0.5 select-all">
              {kodeVoucher || '-'}
            </div>
            <div className="text-[10px] leading-tight font-medium mt-1">
              Gunakan kode ini pada bilik KBU Sadewa.
            </div>
          </div>

          {/* 4. Garis putus-putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* 5. Rincian: No. Trx -> Pelanggan -> Paket */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0 font-medium">No. Trx:</span>
              <span className="font-mono font-bold text-right text-[10px] break-all">{transaksi.id}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0 font-medium">Pelanggan:</span>
              <span className="font-bold text-right break-words">{transaksi.napi?.nama || '-'}</span>
            </div>
            <div className="flex justify-between items-baseline gap-1">
              <span className="shrink-0 font-medium">Paket:</span>
              <span className="font-bold text-right break-words">{transaksi.paket?.nama || '-'}</span>
            </div>
          </div>

          {/* 6. Garis putus-putus */}
          <div className="border-b border-dashed border-black my-1.5" />

          {/* 7. Catatan Masa Berlaku & Penutup */}
          <div className="text-center space-y-1">
            <div className="text-[9.5px] leading-tight font-medium">
              Kode berlaku 1 hari selama kuota paket masih tersedia.
            </div>
            <div className="text-[10px] pt-0.5 pb-1 font-bold">
              Terima kasih
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Aksi di Layar (no-print) */}
      <div className="no-print mt-3.5 sm:mt-4 space-y-2.5">
        {/* Baris Tombol Salin Kode & Cetak Voucher */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={isVoucherAvailable ? handleSalinKode : undefined}
            disabled={!isVoucherAvailable}
            title={!isVoucherAvailable ? 'Kode voucher tidak tersedia' : 'Salin Kode Voucher'}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border text-xs font-semibold rounded-xl shadow-xs transition ${
              isVoucherAvailable
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 cursor-pointer active:scale-98'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700 font-bold">Tersalin ✓</span>
              </>
            ) : (
              <>
                <Copy className={`w-4 h-4 ${isVoucherAvailable ? 'text-slate-500' : 'text-slate-400'}`} />
                <span>Salin Kode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={isVoucherAvailable ? handleCetakVoucher : undefined}
            disabled={!isVoucherAvailable}
            title={!isVoucherAvailable ? 'Kode voucher tidak tersedia' : 'Cetak Voucher'}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border text-xs font-semibold rounded-xl shadow-xs transition ${
              isVoucherAvailable
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 cursor-pointer active:scale-98'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Printer className={`w-4 h-4 ${isVoucherAvailable ? 'text-slate-500' : 'text-slate-400'}`} />
            <span>Cetak Voucher</span>
          </button>
        </div>

        {/* Tombol Utama: Lanjut ke Struk */}
        <button
          type="button"
          onClick={() => navigate(`/kantin/struk/${transaksi.id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
        >
          <span>Lanjut ke Struk</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Tombol Navigasi Sekunder */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/kantin')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Katalog Paket</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/kantin/riwayat')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Riwayat Transaksi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
