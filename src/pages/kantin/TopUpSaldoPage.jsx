import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle,
  X,
  AlertTriangle,
  ArrowUpCircle,
  Clock,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatKantin';
import {
  PPN_RATE,
  SALDO_MINIMUM_WARNING,
  NOMINAL_TOPUP_OPTIONS,
  getMenitFromNominal,
  getSaldo,
  getSaldoSync,
  getRiwayatTopUp,
  prosesTopUp,
  markApprovedTopupsAsRead,
} from '../../services/kantin/saldoService';

export default function TopUpSaldoPage() {
  // Gunakan getSaldoSync() agar state awal tidak 0 (mencegah bug kartu tiba-tiba berubah warna dari kuning ke biru)
  const [saldo, setSaldo] = useState(() => getSaldoSync());
  const [isLoadingSaldo, setIsLoadingSaldo] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(true);

  // State pilihan paket (object option)
  const [paketTerpilih, setPaketTerpilih] = useState(null);

  // State modal konfirmasi
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  // State proses
  const [isProcessing, setIsProcessing] = useState(false);
  const [pesanSukses, setPesanSukses] = useState('');

  // Load data awal & listen real-time
  useEffect(() => {
    loadSaldo();
    loadRiwayat();
    markApprovedTopupsAsRead();

    const handleUpdate = () => {
      loadSaldo();
      loadRiwayat();
    };

    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const loadSaldo = async () => {
    try {
      const s = await getSaldo();
      setSaldo(s);
    } catch (err) {
      console.error('Gagal mengambil saldo:', err);
    }
  };

  const loadRiwayat = async () => {
    setIsLoadingRiwayat(true);
    try {
      const r = await getRiwayatTopUp();
      setRiwayat(r);
    } catch (err) {
      console.error('Gagal mengambil riwayat top up:', err);
    } finally {
      setIsLoadingRiwayat(false);
    }
  };

  // Hitung PPN dan total bayar
  const nominalValue = paketTerpilih ? paketTerpilih.nominal : 0;
  const menitValue = paketTerpilih ? paketTerpilih.menit : 0;
  const ppnNominal = paketTerpilih ? Math.round(nominalValue * PPN_RATE) : 0;
  const totalBayar = paketTerpilih ? nominalValue + ppnNominal : 0;

  const handleTopUpSekarang = () => {
    if (!paketTerpilih) return;
    setShowKonfirmasi(true);
  };

  const handleBatal = () => {
    setShowKonfirmasi(false);
  };

  const handleKonfirmasi = async () => {
    if (!paketTerpilih) return;

    setIsProcessing(true);
    try {
      const result = await prosesTopUp(paketTerpilih.nominal, paketTerpilih.menit);
      if (result.success) {
        setSaldo(result.saldoBaru);
        setPesanSukses(
          `Pengajuan top up kuota ${menitValue.toLocaleString('id-ID')} Menit (${formatRupiah(
            nominalValue
          )}) berhasil dikirim! Menunggu konfirmasi persetujuan dari Super Administrator.`
        );
        setPaketTerpilih(null);
        setShowKonfirmasi(false);

        // Reload riwayat
        const updatedRiwayat = await getRiwayatTopUp();
        setRiwayat(updatedRiwayat);

        // Hapus pesan sukses setelah 6 detik
        setTimeout(() => setPesanSukses(''), 6000);
      }
    } catch (err) {
      console.error('Gagal memproses top up:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const saldoRendah = saldo < SALDO_MINIMUM_WARNING;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Toast Notifikasi Sukses */}
      {pesanSukses && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Top Up Berhasil Diajukan</p>
            <p className="text-sm font-semibold text-emerald-900 mt-0.5">{pesanSukses}</p>
          </div>
          <button
            onClick={() => setPesanSukses('')}
            className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Hero Card: Informasi Saldo Kuota Menit Kantin */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-md text-white transition-all duration-300 ${
          saldoRendah
            ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600'
            : 'bg-gradient-to-r from-[#1565C0] to-[#0D47A1]'
        }`}
      >
        {/* Background ambient lighting */}
        <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 top-0 w-32 h-32 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20">
                <Wallet className="w-3.5 h-3.5" />
                Kuota Saldo Kantin Lapas
              </span>
              {saldoRendah && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400 text-slate-900 shadow-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Kuota Menipis
                </span>
              )}
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-xs">
              {saldo.toLocaleString('id-ID')}{' '}
              <span className="text-xl sm:text-2xl font-bold opacity-90">Menit</span>
            </div>

            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Kuota menit operasional aktif untuk pemotongan otomatis setiap penjualan paket komunikasi kepada warga binaan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{saldoRendah ? 'Status: Kuota Menit Menipis' : 'Status: Siap Digunakan'}</span>
            </div>
            <div className="text-[11px] text-blue-200/90 font-medium px-1">
              Pajak PPN 11% otomatis terhitung
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pilihan Paket Kuota Top Up */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Pilih Paket Kuota Menit</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih paket kuota durasi bicara yang ingin ditambahkan ke akun kasir kantin Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NOMINAL_TOPUP_OPTIONS.map((option) => {
            const isSelected = paketTerpilih?.id === option.id;
            const ppn = Math.round(option.nominal * PPN_RATE);
            const total = option.nominal + ppn;

            return (
              <div
                key={option.id}
                onClick={() => setPaketTerpilih(isSelected ? null : option)}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#F0F7FF] border-[#1565C0] shadow-md ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      isSelected
                        ? 'bg-blue-100 text-[#1565C0]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Paket Kuota
                  </span>
                  <div className="flex items-center gap-1.5">
                    {option.bonus && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {option.bonus}
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'border-[#1565C0] bg-[#1565C0] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Kuota & Harga */}
                <div className="mb-4">
                  <span className="text-[11px] text-slate-400 font-semibold block">Kuota Didapat</span>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-2xl sm:text-3xl font-black tracking-tight ${
                        isSelected ? 'text-[#1565C0]' : 'text-slate-800'
                      }`}
                    >
                      {option.menit.toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm font-bold text-slate-500">Menit</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 mt-1 block">
                    Harga: {formatRupiah(option.nominal)}
                  </span>
                </div>

                {/* Breakdown Details */}
                <div className="pt-3 border-t border-slate-100/90 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>PPN 11%</span>
                    <span className="font-semibold text-slate-700">{formatRupiah(ppn)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-700">Total Pembayaran</span>
                    <span className={isSelected ? 'text-[#1565C0] font-black' : 'text-slate-900'}>
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action / Checkout Bar saat paket dipilih */}
        {paketTerpilih && !showKonfirmasi && (
          <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#1565C0]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rincian Pengajuan Top Up
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
                <span className="text-sm font-bold text-slate-800">
                  Kuota: {menitValue.toLocaleString('id-ID')} Menit ({formatRupiah(nominalValue)})
                </span>
                <span className="text-xs text-slate-400">+ PPN 11%: {formatRupiah(ppnNominal)}</span>
                <span className="text-sm sm:text-base font-black text-[#1565C0]">
                  Total Tagihan: {formatRupiah(totalBayar)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTopUpSekarang}
              className="px-6 py-3 bg-[#1565C0] hover:bg-[#0D47A1] active:scale-[0.98] text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer shrink-0"
            >
              <ArrowUpCircle className="w-4.5 h-4.5" />
              <span>Proses Pengajuan Top Up</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Modal Konfirmasi Top Up */}
      {showKonfirmasi && paketTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Konfirmasi Pengajuan Top Up</h4>
              </div>
              <button
                type="button"
                onClick={handleBatal}
                disabled={isProcessing}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Modal */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2.5 text-sm border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Kuota Menit Masuk</span>
                  <span className="font-black text-emerald-600 text-base">
                    {menitValue.toLocaleString('id-ID')} Menit
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Harga Paket</span>
                  <span className="font-bold text-slate-800">{formatRupiah(nominalValue)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Pajak Pertambahan Nilai (PPN 11%)</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(ppnNominal)}</span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-slate-200 text-base">
                  <span className="font-bold text-slate-800">Total Pembayaran</span>
                  <span className="font-black text-[#1565C0]">{formatRupiah(totalBayar)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Pastikan paket kuota yang diajukan sudah sesuai. Pengajuan saldo menit akan dikirim ke Super Administrator untuk diverifikasi dan disetujui sebelum masuk ke akun kasir kantin Anda.
              </p>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBatal}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleKonfirmasi}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Kirim Pengajuan Top Up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tabel Riwayat Top Up */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Riwayat Top Up</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan seluruh transaksi penambahan kuota menit kasir kantin.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Total {riwayat.length} Transaksi
          </span>
        </div>

        {isLoadingRiwayat ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-4 bg-slate-100 rounded w-36" />
                <div className="h-4 bg-slate-200 rounded w-28" />
                <div className="h-4 bg-slate-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : riwayat.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat Top Up</p>
            <p className="text-xs text-slate-400 mt-1">Pilih paket kuota menit di atas untuk melakukan pengajuan top up saldo.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">ID Top Up</th>
                    <th className="py-3.5 px-4 sm:px-6">Waktu Transaksi</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Kuota Menit</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Harga Paket</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">PPN (11%)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Total Tagihan</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {riwayat.map((item) => {
                    const kuotaMenit = item.menit || getMenitFromNominal(item.nominal);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-700">
                          {item.id}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600 whitespace-nowrap">
                          {formatTanggal(item.tanggal)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-600">
                          {kuotaMenit.toLocaleString('id-ID')} Menit
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-700">
                          {formatRupiah(item.nominal)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right text-slate-500 font-medium">
                          {formatRupiah(item.ppn)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#1565C0]">
                          {formatRupiah(item.totalBayar)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              item.status === 'Berhasil'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : item.status === 'Ditolak'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                : 'bg-amber-50 text-amber-700 border-amber-200/80'
                            }`}
                          >
                            {item.status === 'Berhasil' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : item.status === 'Ditolak' ? (
                              <X className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            {item.status === 'Menunggu' ? 'Menunggu Konfirmasi' : item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

