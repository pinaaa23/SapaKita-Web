import React, { useState, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatKantin';
import { submitTagihanPayment } from '../../services/kantin/tagihanService';

export default function ModalPembayaranTagihan({
  isOpen,
  onClose,
  billingData,
  remainingAmount,
  totalApproved = 0,
  onSuccess,
}) {
  const [metodePembayaran, setMetodePembayaran] = useState('QRIS');
  const [proofFile, setProofFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef(null);

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

  // Petunjuk bayar sesuai metode
  // Petunjuk bayar QRIS
  const renderPetunjukBayar = () => {
    return (
      <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200/90 rounded-2xl space-y-2 text-xs text-slate-700 animate-in fade-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <QrCode className="w-4.5 h-4.5 text-blue-600" />
            <span className="text-sm">Petunjuk Pembayaran QRIS</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-2xs">
            QRIS Only
          </span>
        </div>
        <p className="leading-relaxed text-slate-600 text-[11px]">
          1. Buka aplikasi <strong>Mobile Banking</strong> (BCA, Mandiri, BRI, BNI, dll.) atau <strong>E-Wallet</strong> (GoPay, OVO, DANA, ShopeePay).
        </p>
        <p className="leading-relaxed text-slate-600 text-[11px]">
          2. Pindai stiker / barcode QRIS resmi Sadewa Kantin dan pastikan nominal tepat: <span className="font-bold font-mono text-blue-700">{formatRupiah(payableAmount)}</span>.
        </p>
        <p className="leading-relaxed text-slate-600 text-[11px]">
          3. Simpan tangkapan layar / bukti struk pembayaran berhasil untuk diunggah di formulir bawah.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
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

          {/* 2. Metode Pembayaran QRIS Only */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Metode Pembayaran
            </label>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-bold">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">QRIS Resmi Sadewa</div>
                  <div className="text-[10px] text-slate-500 font-medium">BCA, Mandiri, BRI, GoPay, DANA, OVO, ShopeePay</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                QRIS
              </span>
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
                      {proofFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(proofFile.size / (1024 * 1024)).toFixed(2)} MB • Siap dikirim
                    </p>
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
              disabled={!metodePembayaran || !proofFile || isSubmitting || Boolean(fileError)}
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
                  <span>Kirim Bukti Pembayaran QRIS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
