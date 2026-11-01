import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Wallet, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  QrCode, 
  Building2, 
  CreditCard, 
  Smartphone,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatKantin';
import { submitTagihanPayment } from '../../services/kantin/tagihanService';
import { getFinancePaymentSettings } from '../../services/financeService';
import { API_BASE_URL } from '../../services/api';

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.includes(':9000') || url.includes('finance-settings') || url.includes('/payment-settings/qris-image')) {
    const queryString = url.includes('?') ? url.substring(url.indexOf('?')) : '';
    return `${API_BASE_URL}/api/finance/payment-settings/qris-image${queryString}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export default function ModalPembayaranTagihan({
  isOpen,
  onClose,
  billingData,
  remainingAmount,
  totalApproved = 0,
  onSuccess,
}) {
  const [metodePembayaran, setMetodePembayaran] = useState('QRIS');
  const [financeSetting, setFinanceSetting] = useState(null);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef(null);

  const [previewQrisModal, setPreviewQrisModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getFinancePaymentSettings().then((s) => {
      if (isMounted && s) {
        setFinanceSetting(s);
        const bankOk = s.isBankActive !== false;
        const qrisOk = s.isQrisActive !== false && !!s.qrisImageUrl;
        if (!qrisOk && bankOk) {
          setMetodePembayaran('BANK_TRANSFER');
        } else {
          setMetodePembayaran('QRIS');
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  if (!isOpen || !billingData) return null;

  const summary = billingData.summary || {};
  const totalAmount = Number(summary.totalAmount || 0);
  const payableAmount = (remainingAmount !== undefined && remainingAmount > 0) ? remainingAmount : totalAmount;
  const totalDpp = Number(summary.totalDpp || 0);
  const totalPpn = Number(summary.totalPpn || 0);
  const totalMinutes = Number(summary.totalMinutes || 0);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    setSubmitError('');

    if (!file) {
      setProofFile(null);
      setFilePreview(null);
      return;
    }

    // Validasi ukuran berkas maksimal 2 MB sesuai aturan
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`Ukuran file bukti pembayaran maksimal ${MAX_SIZE_MB} MB. File Anda: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      setProofFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validasi tipe berkas
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Format berkas harus berupa JPG, PNG, WEBP, atau PDF.');
      setProofFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setProofFile(file);

    // Buat preview jika format gambar
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
  };

  const handleHapusFile = () => {
    setProofFile(null);
    setFilePreview(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!metodePembayaran) {
      setSubmitError('Silakan pilih metode pembayaran terlebih dahulu.');
      return;
    }
    if (!proofFile) {
      setSubmitError('Silakan unggah berkas bukti pembayaran terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const now = new Date();
      const targetMonth = billingData?.month || (billingData?.period?.month) || (now.getMonth() + 1);
      const targetYear = billingData?.year || (billingData?.period?.year) || now.getFullYear();

      // Mengirim bukti bayar ke backend (saat ini via submitTagihanPayment)
      // TODO: sambungkan ke endpoint finance saat BE siap (misal POST /api/finance/canteen-topups)
      await submitTagihanPayment({
        nominal: payableAmount,
        minutes: totalMinutes,
        bankTarget: metodePembayaran,
        proofFile,
        billingMonth: targetMonth,
        billingYear: targetYear,
      });

      // Sinkronkan bukti transfer yang diunggah kantin ke data Finance lokal
      if (proofFile && proofFile.type?.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (dataUrl) {
              const rawBillings = localStorage.getItem('pascall_finance_billings_v1');
              if (rawBillings) {
                const list = JSON.parse(rawBillings);
                const matchIdx = list.findIndex((b) => b.month === Number(targetMonth) && b.year === Number(targetYear));
                if (matchIdx !== -1) {
                  list[matchIdx].status = 'PENDING_CONFIRMATION';
                  list[matchIdx].paymentDate = new Date().toISOString();
                  list[matchIdx].paymentMethod = metodePembayaran;
                  list[matchIdx].proofUrl = dataUrl;
                  if (!list[matchIdx].proof) list[matchIdx].proof = {};
                  list[matchIdx].proof.proofImage = dataUrl;
                  localStorage.setItem('pascall_finance_billings_v1', JSON.stringify(list));
                  window.dispatchEvent(new Event('finance_billing_updated'));
                }
              }
            }
          };
          reader.readAsDataURL(proofFile);
        } catch (syncErr) {
          console.warn('[ModalPembayaranTagihan] Gagal sinkronisasi proof ke finance:', syncErr);
        }
      }

      // Dispatch event agar komponen lain ikut update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
        window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
        window.dispatchEvent(new Event('finance_billing_updated'));
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('[ModalPembayaranTagihan] Gagal mengirim bukti pembayaran:', err);
      setSubmitError(err.message || 'Gagal mengirim bukti pembayaran. Pastikan koneksi server tersedia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBankAvailable = financeSetting?.isBankActive !== false;
  const isQrisAvailable = financeSetting?.isQrisActive !== false && !!financeSetting?.qrisImageUrl;

  const renderPetunjukBayar = () => {
    const bankName = financeSetting?.bankName || 'Bank Mandiri';
    const accNum = financeSetting?.accountNumber || '168-00-9988112-7';
    const accHolder = financeSetting?.accountHolder || 'PT Sadewa Solusi Indonesia';
    const qrisUrl = financeSetting?.qrisImageUrl;

    // JIKA METODE DIPILIH: QRIS
    if (metodePembayaran === 'QRIS') {
      return (
        <div className="p-4 bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-200 rounded-2xl space-y-3 text-xs text-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <QrCode className="w-4.5 h-4.5 text-indigo-600" />
              <span className="text-sm">Scan Barcode QRIS Resmi</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">
              Metode QRIS
            </span>
          </div>

          {qrisUrl ? (
            <div className="p-3.5 bg-white rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div 
                onClick={() => setPreviewQrisModal(true)}
                className="relative group shrink-0 cursor-pointer"
                title="Klik untuk memperbesar barcode QRIS"
              >
                <img 
                  src={resolveImageUrl(qrisUrl)} 
                  alt="Barcode QRIS" 
                  className="w-24 h-24 object-contain rounded-xl border border-slate-200 shadow-sm p-1 group-hover:scale-105 transition-transform bg-white" 
                />
                <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                  Perbesar
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-slate-800">Pindai Kode QRIS Menggunakan m-Banking / E-Wallet</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mendukung BCA, Mandiri Livin, BRImo, BNI, GoPay, OVO, DANA, ShopeePay, dan seluruh aplikasi berlogo QRIS.
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewQrisModal(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer inline-flex items-center gap-1 pt-0.5"
                >
                  <span>Buka Gambar Barcode Ukuran Penuh</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-dashed border-indigo-200 text-center text-slate-400 text-xs">
              Gambar barcode QRIS belum diunggah oleh Superadmin. Silakan pilih metode Transfer Bank.
            </div>
          )}

          <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-indigo-100">
            <p className="leading-relaxed">
              1. Nominal bayar: <span className="font-bold font-mono text-indigo-700">{formatRupiah(payableAmount)}</span>.
            </p>
            <p className="leading-relaxed">
              2. {financeSetting?.instructions || 'Simpan struk transaksi dan unggah bukti transfer pada form di bawah.'}
            </p>
          </div>
        </div>
      );
    }

    // JIKA METODE DIPILIH: TRANSFER BANK
    return (
      <div className="p-4 bg-gradient-to-br from-blue-50/90 to-slate-50/70 border border-blue-200 rounded-2xl space-y-3 text-xs text-slate-700 animate-in fade-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <CreditCard className="w-4.5 h-4.5 text-blue-600" />
            <span className="text-sm">Transfer Rekening Penampung Bank</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-2xs">
            Metode Transfer Bank
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {bankName}
              </span>
              <span className="text-[11px] text-slate-500">Rekening Resmi Finance</span>
            </div>
            <p className="text-base font-mono font-black text-blue-950 mt-1.5 tracking-wider select-all">
              {accNum}
            </p>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Atas Nama: <strong className="text-slate-800">{accHolder}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(accNum);
              setCopiedRekening(true);
              setTimeout(() => setCopiedRekening(false), 2000);
            }}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copiedRekening ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRekening ? 'Tersalin' : 'Salin Rekening'}</span>
          </button>
        </div>

        <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-blue-100">
          <p className="leading-relaxed">
            1. Transfer tepat sesuai nominal tagihan: <span className="font-bold font-mono text-blue-700">{formatRupiah(payableAmount)}</span>.
          </p>
          <p className="leading-relaxed">
            2. {financeSetting?.instructions || 'Simpan struk transfer ATM / Mobile Banking lalu unggah pada form di bawah.'}
          </p>
        </div>
      </div>
    );
  };

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[99999] w-screen h-screen bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto transition-opacity animate-in fade-in duration-200"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0 }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center shadow-2xs">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Pembayaran Tagihan Bulanan</h4>
              <p className="text-[11px] text-slate-500">Konfirmasi pembayaran tagihan periode {billingData.period}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}


          {/* 1. Ringkasan Tagihan (Data Riil Detik) */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-slate-700 font-bold">
              <span>Nomor Faktur</span>
              <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {billingData.invoiceNumber || '-'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Periode Tagihan</span>
              <span className="font-bold text-slate-800">{billingData.period || '-'}</span>
            </div>
            {billingData.totalSeconds !== undefined && (
              <div className="flex justify-between text-slate-600">
                <span>Total Detik Panggilan</span>
                <span className="font-semibold text-slate-800">
                  {Number(billingData.totalSeconds || 0).toLocaleString('id-ID')} Detik
                </span>
              </div>
            )}
            {billingData.ratePerSecond !== undefined && (
              <div className="flex justify-between text-slate-600">
                <span>Tarif Kontrak</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(Number(billingData.ratePerSecond || 0))} / detik
                </span>
              </div>
            )}
            {billingData.superadminPercent !== undefined && (
              <div className="flex justify-between text-slate-600">
                <span>Porsi Setoran ke Finance</span>
                <span className="font-semibold text-blue-700">{billingData.superadminPercent}%</span>
              </div>
            )}
            {totalApproved > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200/50">
                <span>Telah Di-ACC Sebelumnya</span>
                <span>{formatRupiah(totalApproved)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
              <span className="font-bold text-slate-800">
                {totalApproved > 0 ? 'Sisa Tagihan yang Harus Dibayar' : 'Total Tagihan'}
              </span>
              <span className="font-black text-[#1565C0] text-base font-mono">
                {formatRupiah(payableAmount)}
              </span>
            </div>
          </div>

          {/* 2. Pemilihan Metode Pembayaran: Transfer Bank ATAU Scan QRIS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Metode Pembayaran
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {isBankAvailable && isQrisAvailable
                  ? 'Pilih salah satu metode di bawah ini:'
                  : 'Metode pembayaran yang tersedia:'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opsi 1: Scan QRIS */}
              {isQrisAvailable && (
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('QRIS')}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    metodePembayaran === 'QRIS'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    metodePembayaran === 'QRIS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Scan Barcode QRIS</span>
                      {metodePembayaran === 'QRIS' && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">m-Banking &amp; E-Wallet</div>
                  </div>
                </button>
              )}

              {/* Opsi 2: Transfer Bank */}
              {isBankAvailable && (
                <button
                  type="button"
                  onClick={() => setMetodePembayaran('BANK_TRANSFER')}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    metodePembayaran === 'BANK_TRANSFER'
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    metodePembayaran === 'BANK_TRANSFER' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Transfer Bank</span>
                      {metodePembayaran === 'BANK_TRANSFER' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{financeSetting?.bankName || 'Bank Mandiri'}</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* 3. Petunjuk Bayar */}
          {renderPetunjukBayar()}

          {/* 4. Upload Bukti Pembayaran */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Upload Bukti Pembayaran <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Gambar / PDF maks. 2 MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="hidden"
              id="tagihan-proof-file"
            />

            {!proofFile ? (
              <label
                htmlFor="tagihan-proof-file"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center transition bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer"
              >
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Pilih berkas bukti pembayaran</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Format file: JPG, PNG, WEBP, atau PDF (maks 2 MB)</span>
              </label>
            ) : (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Pratinjau Bukti"
                      className="w-12 h-12 object-cover rounded-lg border border-emerald-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-bold text-slate-800 truncate" title={proofFile.name}>
                      {proofFile.name}</p>
      
                    <p className="text-[10px] text-slate-500">
                      {(proofFile.size / (1024 * 1024)).toFixed(2)} MB • Siap dikirim</p>
      
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleHapusFile}
                  disabled={isSubmitting}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus berkas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileError && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">{fileError}</p>
            )}
          </div>

          {/* Footer Tombol Aksi */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!metodePembayaran || !proofFile || isSubmitting || Boolean(fileError) || payableAmount <= 0}
              className="px-5 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Bukti...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{payableAmount <= 0 ? 'Tidak Perlu Bayar (Rp 0)' : 'Kirim Bukti Pembayaran QRIS'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Perbesar QRIS */}
      {previewQrisModal && financeSetting?.qrisImageUrl && (
        <div 
          className="fixed inset-0 z-[100000] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewQrisModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-left">
                <h5 className="text-sm font-bold text-slate-900">QRIS Resmi Sadewa</h5>
                <p className="text-[11px] text-slate-500">Pindai barcode untuk melakukan pembayaran</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQrisModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-inner flex items-center justify-center">
              <img 
                src={resolveImageUrl(financeSetting.qrisImageUrl)} 
                alt="Barcode QRIS Full" 
                className="w-64 h-64 object-contain rounded-xl"
              />
            </div>

            <p className="text-xs font-semibold text-slate-700">
              {financeSetting.bankName || 'Bank Mandiri'} • a.n. {financeSetting.accountHolder || 'PT Sadewa Solusi Indonesia'}
            </p>

            <button
              type="button"
              onClick={() => setPreviewQrisModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  ) : null;
}
