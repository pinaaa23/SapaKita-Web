import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  Zap,
  Printer,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatKantin';
import { 
  getMonthlyBilling, 
  getPaymentHistory, 
  determineBillingStatus 
} from '../../services/kantin/tagihanService';
import ModalPembayaranTagihan from '../../components/kantin/ModalPembayaranTagihan';

export default function TagihanPage() {
  const [billingData, setBillingData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal Pembayaran Tagihan State
  const [isModalBayarOpen, setIsModalBayarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchBillingAndPayments = useCallback(async (month, year) => {
    setIsLoading(true);
    try {
      const [billingRes, paymentsRes] = await Promise.allSettled([
        getMonthlyBilling(month, year),
        getPaymentHistory(),
      ]);

      if (billingRes.status === 'fulfilled') {
        setBillingData(billingRes.value);
      }
      if (paymentsRes.status === 'fulfilled') {
        setPaymentHistory(Array.isArray(paymentsRes.value) ? paymentsRes.value : []);
      }
    } catch (err) {
      console.error('Gagal memuat rekapitulasi tagihan bulanan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingAndPayments(selectedMonth, selectedYear);

    const handleUpdate = () => {
      fetchBillingAndPayments(selectedMonth, selectedYear);
    };

    window.addEventListener('pascall_billing_updated', handleUpdate);
    window.addEventListener('canteen_topup_changed', handleUpdate);

    return () => {
      window.removeEventListener('pascall_billing_updated', handleUpdate);
      window.removeEventListener('canteen_topup_changed', handleUpdate);
    };
  }, [fetchBillingAndPayments, selectedMonth, selectedYear]);

  const monthOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSuccess = () => {
    setToastMessage('Bukti pembayaran tagihan berhasil dikirim ke Superadmin untuk diverifikasi.');
    fetchBillingAndPayments(selectedMonth, selectedYear);
    setTimeout(() => {
      setToastMessage('');
    }, 6000);
  };

  // Evaluasi status tagihan riil dari server
  const billingStatusInfo = determineBillingStatus(billingData, paymentHistory);
  const totalAmount = Number(billingData?.summary?.totalAmount || 0);
  const canPay = billingStatusInfo.canPay && totalAmount > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 md:p-6 text-slate-800">
      {/* Toast Sukses Pembayaran */}
      {toastMessage && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Sistem Pascabayar • Tagihan Bulanan Kantin</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tagihan & Penggunaan Bulanan
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Model operasional pascabayar (unlimited) tanpa prabayar. Total penjualan menit ditagihkan di awal bulan berikutnya.
          </p>
        </div>

        {/* Filter Bulan & Print */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Tagihan</span>
          </button>
        </div>
      </div>

      {/* Model Pascabayar Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg shadow-blue-950/20 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Zap className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Model Pascabayar (Unlimited Pool)</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Kantin Bebas Menjual Voucher Tanpa Kuota Awal
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Kantin tidak perlu membeli deposit token menit terlebih dahulu ke Super Admin. Semua voucher dapat langsung dicetak untuk WBP, dan rekapitulasi tagihan dihitung otomatis pada tanggal 1 setiap bulannya.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 shrink-0 text-right min-w-[200px]">
            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Status Tagihan</div>
            <div className="text-sm font-black mt-0.5">
              {billingStatusInfo.status === 'LUNAS' && (
                <span className="text-emerald-400">🟢 Lunas</span>
              )}
              {billingStatusInfo.status === 'PENDING' && (
                <span className="text-amber-300">🟡 Menunggu Konfirmasi</span>
              )}
              {billingStatusInfo.status === 'REJECTED' && (
                <span className="text-rose-400">🔴 Ditolak</span>
              )}
              {billingStatusInfo.status === 'UNPAID' && (
                <span className="text-rose-300">🟠 Belum Dibayar</span>
              )}
              {billingStatusInfo.status === 'BERJALAN' && (
                <span className="text-blue-300">🔵 Bulan Berjalan</span>
              )}
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-1">
              {billingData?.invoiceNumber || '-'}
            </div>
          </div>
        </div>

        {/* Alert jika pembayaran ditolak */}
        {billingStatusInfo.status === 'REJECTED' && (
          <div className="relative z-10 mt-4 p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-100 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>
                <strong>Pembayaran Ditolak:</strong> {billingStatusInfo.rejectReason} Silakan unggah ulang bukti transfer yang benar.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalBayarOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-800 font-bold rounded-lg transition shrink-0 cursor-pointer shadow-xs self-end sm:self-center"
            >
              Unggah Ulang Bukti
            </button>
          </div>
        )}
      </div>

      {/* 4 Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Voucher Terjual</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : (billingData?.summary?.totalTransactions || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Transaksi pada periode {billingData?.period}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Durasi Terjual</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : `${billingData?.summary?.totalMinutes || 0} Menit`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Total kuota menit bicara aktif
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">DPP (Dasar Pengenaan)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isLoading ? '...' : formatRupiah(billingData?.summary?.totalDpp || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            PPN (11%): {isLoading ? '...' : formatRupiah(billingData?.summary?.totalPpn || 0)}
          </div>
        </div>

        {/* Kartu 4: Total Tagihan Bulan Ini (Clickable untuk bayar tagihan) */}
        <div 
          onClick={canPay ? () => setIsModalBayarOpen(true) : undefined}
          className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-blue-600 transition-all ${
            canPay ? 'cursor-pointer hover:shadow-md hover:border-blue-300 group' : ''
          }`}
          title={canPay ? 'Klik untuk melakukan pembayaran tagihan' : undefined}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Tagihan Bulan Ini</span>
            <Wallet className={`w-4 h-4 text-blue-600 ${canPay ? 'group-hover:scale-110 transition-transform' : ''}`} />
          </div>
          <div className="text-2xl font-black text-blue-700">
            {isLoading ? '...' : formatRupiah(totalAmount)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium mt-1">
            <span className="text-slate-500">Termasuk PPN 11%</span>

            {/* Status teks interaktif di kartu */}
            {billingStatusInfo.status === 'LUNAS' && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lunas
              </span>
            )}
            {billingStatusInfo.status === 'PENDING' && (
              <span className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                <Clock className="w-3 h-3 text-amber-600" /> Menunggu konfirmasi Superadmin
              </span>
            )}
            {billingStatusInfo.status === 'REJECTED' && (
              <span className="text-rose-700 font-bold group-hover:underline text-[10px]">
                Ditolak • Klik untuk bayar
              </span>
            )}
            {(billingStatusInfo.status === 'UNPAID' || billingStatusInfo.status === 'BERJALAN') && canPay && (
              <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                Klik untuk bayar →
              </span>
            )}
            {(billingStatusInfo.status === 'UNPAID' || billingStatusInfo.status === 'BERJALAN') && !canPay && (
              <span className="text-slate-400 font-semibold text-[10px]">
                Tidak ada tagihan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Rincian Transaksi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              Rincian Transaksi Penjualan Voucher Masuk Tagihan ({billingData?.period})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar voucher yang diterbitkan oleh kasir kantin untuk WBP
            </p>
          </div>
          <button
            onClick={() => fetchBillingAndPayments(selectedMonth, selectedYear)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Refresh tagihan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">Memuat data transaksi...</div>
        ) : !billingData?.transactions || billingData.transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">
            Belum ada transaksi penjualan pada bulan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">No Transaksi</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kode Voucher</th>
                  <th className="py-3 px-4">WBP (NIP)</th>
                  <th className="py-3 px-4">Paket / Durasi</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4 text-right">Nominal Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingData.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(t.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {t.kodeVoucher}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{t.inmate?.name || '-'}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        NIP: {t.inmate?.identifier || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{t.package?.name}</div>
                      <div className="text-[10px] text-slate-500">{t.package?.duration} Menit</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {t.cashier?.name || t.cashier?.identifier || 'Kasir'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(Number(t.totalAmount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop Up Pembayaran Tagihan */}
      {isModalBayarOpen && billingData && (
        <ModalPembayaranTagihan
          isOpen={isModalBayarOpen}
          onClose={() => setIsModalBayarOpen(false)}
          billingData={billingData}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
