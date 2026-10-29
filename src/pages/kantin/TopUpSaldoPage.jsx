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
  Upload,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CreditCard,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { getFinancePaymentSettings } from '../../services/financeService';
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
} from '../../services/kantin/saldoService';

const BANK_OPTIONS = [
  'BCA - 0123456789 (a.n Sadewa Finance)',
  'BRI - 9876543210 (a.n Sadewa Finance)',
  'Mandiri - 1370012345678 (a.n Sadewa Finance)',
  'BNI - 0987654321 (a.n Sadewa Finance)',
];

export default function TopUpSaldoPage() {
  const [saldo, setSaldo] = useState(() => getSaldoSync());
  const [isLoadingSaldo, setIsLoadingSaldo] = useState(true);
  const [saldoError, setSaldoError] = useState('');

  const [riwayat, setRiwayat] = useState([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // State pilihan paket (object option)
  const [paketTerpilih, setPaketTerpilih] = useState(null);

  // State modal konfirmasi & form pengajuan
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [bankTarget, setBankTarget] = useState(BANK_OPTIONS[0]);
  const [financeSetting, setFinanceSetting] = useState(null);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // State proses
  const [isProcessing, setIsProcessing] = useState(false);
  const [pesanSukses, setPesanSukses] = useState('');
  const [pesanError, setPesanError] = useState('');

  // Load data awal & listen real-time
  useEffect(() => {
    loadSaldo();
    loadRiwayat();

    // Load Pengaturan Rekening Default dari Finance
    const fetchFinanceSetting = async () => {
      try {
        const s = await getFinancePaymentSettings();
        if (s) {
          setFinanceSetting(s);
          const defaultOpt = `${s.bankName || 'Bank Mandiri'} - ${s.accountNumber || '168-00-9988112-7'} (a.n. ${s.accountHolder || 'PT PasCall Solusi Indonesia'})`;
          setBankTarget(defaultOpt);
        }
      } catch (err) {
        console.warn('Gagal memuat setting finance:', err);
      }
    };
    fetchFinanceSetting();

    const handleUpdate = () => {
      loadSaldo();
      loadRiwayat();
    };

    const handleFinanceUpdate = (e) => {
      if (e?.detail) {
        setFinanceSetting(e.detail);
        const opt = `${e.detail.bankName || 'Bank Mandiri'} - ${e.detail.accountNumber || '168-00-9988112-7'} (a.n. ${e.detail.accountHolder || 'PT PasCall Solusi Indonesia'})`;
        setBankTarget(opt);
      }
    };

    window.addEventListener('canteen_topup_changed', handleUpdate);
    window.addEventListener('finance_payment_settings_updated', handleFinanceUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('canteen_topup_changed', handleUpdate);
      window.removeEventListener('finance_payment_settings_updated', handleFinanceUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [statusFilter]);

  const loadSaldo = async () => {
    setIsLoadingSaldo(true);
    setSaldoError('');
    try {
      const s = await getSaldo();
      setSaldo(s);
    } catch (err) {
      console.error('Gagal mengambil saldo:', err);
      setSaldoError('Gagal memuat saldo dari server. Pastikan koneksi internet stabil.');
    } finally {
      setIsLoadingSaldo(false);
    }
  };

  const loadRiwayat = async () => {
    setIsLoadingRiwayat(true);
    try {
      const r = await getRiwayatTopUp({
        status: statusFilter,
        page: currentPage,
        limit: 20,
      });
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
    setProofFile(null);
    setFileError('');
    setPesanError('');
    setShowKonfirmasi(true);
  };

  const handleBatal = () => {
    if (isProcessing) return;
    setShowKonfirmasi(false);
    setProofFile(null);
    setFileError('');
    setPesanError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setProofFile(null);
      return;
    }

    // Validasi ukuran: max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('Ukuran file bukti transfer terlalu besar (maksimal 10 MB).');
      setProofFile(null);
      return;
    }

    // Validasi tipe file
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (file.type && !allowed.includes(file.type)) {
      setFileError('Format file tidak didukung. Harap upload gambar (JPG, PNG, WEBP) atau PDF.');
      setProofFile(null);
      return;
    }

    setProofFile(file);
  };

  const handleKonfirmasi = async () => {
    if (!paketTerpilih || isProcessing) return;

    if (!proofFile) {
      setFileError('Silakan unggah foto/struk bukti transfer terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setPesanError('');
    try {
      // TODO: sambungkan ke endpoint finance saat BE siap (misal POST /api/finance/canteen-topups)
      await prosesTopUp({
        nominal: paketTerpilih.nominal,
        minutes: paketTerpilih.menit,
        bankTarget,
        proofFile,
      });

      setPesanSukses(
        `Pengajuan top up kuota ${menitValue.toLocaleString('id-ID')} Menit (${formatRupiah(
          nominalValue
        )}) berhasil dikirim! Menunggu konfirmasi persetujuan dari Admin Finance.`
      );
      setPaketTerpilih(null);
      setShowKonfirmasi(false);
      setProofFile(null);

      // Reload saldo dan riwayat terbaru dari BE
      await loadSaldo();
      await loadRiwayat();

      // Hapus pesan sukses setelah 8 detik
      setTimeout(() => setPesanSukses(''), 8000);
    } catch (err) {
      console.error('Gagal memproses top up:', err);
      setPesanError(err?.message || 'Gagal mengirim pengajuan top up. Silakan coba lagi.');
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

      {/* Pesan Error Saldo */}
      {saldoError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs sm:text-sm text-rose-800 font-medium">{saldoError}</p>
          </div>
          <button
            onClick={loadSaldo}
            className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
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
        <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 top-0 w-32 h-32 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20">
                <Wallet className="w-3.5 h-3.5" />
                Kuota Saldo Kantin
              </span>
              {saldoRendah && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400 text-slate-900 shadow-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Kuota Menipis
                </span>
              )}
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-xs flex items-center gap-3">
              {isLoadingSaldo ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin opacity-80" />
                  <span className="text-2xl font-semibold opacity-80">Memuat saldo...</span>
                </div>
              ) : (
                <>
                  {saldo.toLocaleString('id-ID')}{' '}
                  <span className="text-xl sm:text-2xl font-bold opacity-90">Menit</span>
                </>
              )}
            </div>

            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Kuota menit operasional aktif dikelola langsung oleh Backend server dan terpotong otomatis saat penjualan paket komunikasi kepada warga binaan.
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
            Pilih paket kuota durasi bicara yang ingin diajukan untuk ditambahkan ke kasir cabang Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                <div className="mb-4">
                  <span className="text-[11px] text-slate-400 font-semibold block">Kuota Didapat</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-800">
                      {option.menit.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-bold text-slate-500">Menit Bicara</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Harga Paket:</span>
                    <span className="font-semibold text-slate-700">{formatRupiah(option.nominal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">PPN (11%):</span>
                    <span className="text-slate-500 font-medium">{formatRupiah(ppn)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed border-slate-200">
                    <span className="font-bold text-slate-700">Total Tagihan:</span>
                    <span className="font-black text-[#1565C0]">{formatRupiah(total)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar Sticky / Bawah */}
        {paketTerpilih && (
          <div className="p-4 sm:p-5 bg-white border border-blue-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
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
              <span>Lanjut Upload Bukti & Kirim</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Modal Form Pengajuan & Upload Bukti Transfer */}
      {showKonfirmasi && paketTerpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Form Pengajuan Top Up Saldo</h4>
                  <p className="text-[11px] text-slate-500">Unggah bukti transfer untuk diverifikasi Admin Finance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBatal}
                disabled={isProcessing}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Form */}
            <div className="p-6 overflow-y-auto space-y-4">
              {pesanError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pesanError}</span>
                </div>
              )}

              {/* Rincian Finansial */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-sm border border-slate-200/80">
                <div className="flex justify-between text-slate-600">
                  <span>Kuota Menit</span>
                  <span className="font-black text-emerald-600 text-base">
                    {menitValue.toLocaleString('id-ID')} Menit
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Harga Paket</span>
                  <span className="font-bold text-slate-800">{formatRupiah(nominalValue)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>PPN 11%</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(ppnNominal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-base">
                  <span className="font-bold text-slate-800">Total Transfer</span>
                  <span className="font-black text-[#1565C0]">{formatRupiah(totalBayar)}</span>
                </div>
              </div>

              {/* Rekening Default dari Finance (Highlight Card) */}
              {financeSetting && (
                <div className="p-3.5 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-200/90 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-blue-950">
                        {financeSetting.bankName || 'Bank Mandiri'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-600 text-white shadow-2xs">
                      Default Resmi Finance
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-blue-100">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Nomor Rekening Penampung:</p>
                      <p className="text-sm font-mono font-black text-blue-900 tracking-wider">
                        {financeSetting.accountNumber || '168-00-9988112-7'}
                      </p>
                      <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
                        a.n. {financeSetting.accountHolder || 'PT PasCall Solusi Indonesia'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (financeSetting.accountNumber) {
                          navigator.clipboard.writeText(financeSetting.accountNumber);
                          setCopiedRekening(true);
                          setTimeout(() => setCopiedRekening(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRekening ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedRekening ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  {financeSetting.qrisImageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-white/80 rounded-xl border border-blue-100">
                      <img
                        src={financeSetting.qrisImageUrl}
                        alt="QRIS"
                        className="w-12 h-12 rounded-lg object-contain border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div className="text-[11px] text-slate-600">
                        <p className="font-bold text-slate-800">Tersedia Barcode QRIS Resmi</p>
                        <p className="text-[10px] text-slate-500">Bisa langsung scan barcode saat transfer dari m-banking</p>
                      </div>
                    </div>
                  )}

                  {financeSetting.instructions && (
                    <p className="text-[10px] text-slate-600 italic">
                      Catatan: {financeSetting.instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Pilihan Bank Tujuan Transfer */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilihan Rekening Penampung Finance
                </label>
                <select
                  value={bankTarget}
                  onChange={(e) => setBankTarget(e.target.value)}
                  disabled={isProcessing}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {financeSetting && (
                    <option value={`${financeSetting.bankName || 'Bank Mandiri'} - ${financeSetting.accountNumber || '168-00-9988112-7'} (a.n. ${financeSetting.accountHolder || 'PT PasCall Solusi Indonesia'})`}>
                      ⭐ Rekening Default: {financeSetting.bankName} - {financeSetting.accountNumber} ({financeSetting.accountHolder})
                    </option>
                  )}
                  {BANK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Bukti Transfer */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Bukti Struk Transfer (JPG, PNG, PDF maks 10MB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center transition bg-slate-50/50 hover:bg-blue-50/20">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  {proofFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-xs font-bold truncate max-w-xs">{proofFile.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(proofFile.size / 1024 / 1024).toFixed(2)} MB - Siap diunggah
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">
                        Klik atau seret file bukti transfer ke sini
                      </p>
                      <p className="text-[10px] text-slate-400">Mendukung format JPG, PNG, atau PDF (Maksimal 10MB)</p>
                    </div>
                  )}
                </div>
                {fileError && <p className="text-[11px] text-rose-600 font-medium">{fileError}</p>}
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                Menit akan bertambah otomatis di akun kantin cabang setelah Admin Finance memverifikasi bukti transfer dan menyetujui pengajuan ini.
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBatal}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleKonfirmasi}
                  disabled={isProcessing || !proofFile}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Kirim Pengajuan Top Up</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tabel Riwayat Top Up */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Riwayat Pengajuan Top Up</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan seluruh transaksi penambahan kuota menit kasir kantin langsung dari server.
            </p>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu (Pending)</option>
              <option value="APPROVED">Disetujui (Approved)</option>
              <option value="REJECTED">Ditolak (Rejected)</option>
            </select>
          </div>
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
            <p className="text-sm font-bold text-slate-700">Belum Ada Pengajuan Top Up</p>
            <p className="text-xs text-slate-400 mt-1">Pilih paket kuota menit di atas untuk mengajukan penambahan kuota.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">ID & Tanggal</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Kuota Menit</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Harga Paket</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Total Tagihan</th>
                    <th className="py-3.5 px-4 sm:px-6">Bukti Transfer</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {riwayat.map((item) => {
                    const isApproved = item.status === 'APPROVED' || item.status === 'Berhasil';
                    const isRejected = item.status === 'REJECTED' || item.status === 'Ditolak';
                    const isPending = item.status === 'PENDING' || item.status === 'Menunggu';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-mono font-bold text-slate-700 block text-[11px]">
                            {item.id.slice(0, 8)}...
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {formatTanggal(item.tanggal)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-black text-emerald-600">
                          {item.menit.toLocaleString('id-ID')} Menit
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-700">
                          {formatRupiah(item.nominal)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#1565C0]">
                          {formatRupiah(item.totalBayar)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          {item.proofUrl ? (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <span>Lihat Bukti</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Tidak ada file</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                              ) : isRejected ? (
                                <X className="w-3 h-3 text-rose-500" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-500" />
                              )}
                              {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu'}
                            </span>
                            {isRejected && item.rejectReason && (
                              <span className="text-[10px] text-rose-600 italic font-medium max-w-xs text-center">
                                Alasan: {item.rejectReason}
                              </span>
                            )}
                          </div>
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
