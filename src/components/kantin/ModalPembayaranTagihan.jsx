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
  onSuccess,
}) {
  const [metodePembayaran, setMetodePembayaran] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen || !billingData) return null;

  const summary = billingData.summary || {};
  const totalAmount = Number(summary.totalAmount || 0);
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
      await submitTagihanPayment({
        nominal: totalAmount,
        minutes: totalMinutes,
        bankTarget: metodePembayaran,
        proofFile,
      });

      // Dispatch event agar komponen lain ikut update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pascall_billing_updated'));
        window.dispatchEvent(new CustomEvent('canteen_topup_changed'));
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
  const renderPetunjukBayar = () => {
    if (!metodePembayaran) return null;

    if (metodePembayaran === 'QRIS') {
      return (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Petunjuk Pembayaran QRIS</span>
          </div>
          <p className="leading-relaxed">
            1. Pindai kode QRIS resmi kasir/bendahara PasCall Lapas menggunakan aplikasi Mobile Banking atau E-Wallet Anda.
          </p>
          <p className="leading-relaxed">
            2. Pastikan nominal pembayaran sesuai persis dengan total tagihan: <span className="font-bold font-mono text-blue-800">{formatRupiah(totalAmount)}</span>.
          </p>
          <p className="text-[11px] text-slate-500 italic mt-1">
            * Data stiker QRIS resmi perusahaan dikonfirmasi langsung oleh pihak manajemen / Superadmin.
          </p>
        </div>
      );
    }

    if (metodePembayaran.startsWith('Transfer Bank')) {
      const bankName = metodePembayaran.replace('Transfer Bank - ', '');
      return (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Petunjuk Transfer {bankName}</span>
          </div>
          <p className="leading-relaxed">
            1. Lakukan transfer sebesar <span className="font-bold font-mono text-blue-800">{formatRupiah(totalAmount)}</span> ke rekening resmi perusahaan PasCall ({bankName}).
          </p>
          <p className="leading-relaxed">
            2. Simpan resi atau tangkapan layar bukti transfer untuk diunggah pada formulir di bawah.
          </p>
          <p className="text-[11px] text-slate-500 italic mt-1">
            * Nomor rekening resmi perusahaan dikonfirmasi langsung oleh pihak manajemen / Superadmin.
          </p>
        </div>
      );
    }

    if (metodePembayaran.startsWith('E-Wallet')) {
      const ewalletName = metodePembayaran.replace('E-Wallet - ', '');
      return (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Petunjuk Pembayaran E-Wallet ({ewalletName})</span>
          </div>
          <p className="leading-relaxed">
            1. Buka aplikasi {ewalletName} Anda dan lakukan transfer sebesar <span className="font-bold font-mono text-blue-800">{formatRupiah(totalAmount)}</span> ke akun resmi PasCall.
          </p>
          <p className="leading-relaxed">
            2. Simpan struk/bukti transaksi sukses untuk diunggah pada formulir di bawah.
          </p>
          <p className="text-[11px] text-slate-500 italic mt-1">
            * Nomor akun e-wallet resmi perusahaan dikonfirmasi langsung oleh pihak manajemen / Superadmin.
          </p>
        </div>
      );
    }

    return null;
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

          {/* 1. Ringkasan Tagihan (Data Riil Server) */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-slate-700 font-bold">
              <span>Nomor Invoice</span>
              <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {billingData.invoiceNumber || '-'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Periode Penggunaan</span>
              <span className="font-bold text-slate-800">{billingData.period || '-'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Dasar Pengenaan Pajak (DPP)</span>
              <span className="font-semibold text-slate-800">{formatRupiah(totalDpp)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>PPN (11%)</span>
              <span className="font-semibold text-slate-800">{formatRupiah(totalPpn)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
              <span className="font-bold text-slate-800">Total Tagihan</span>
              <span className="font-black text-[#1565C0] text-base font-mono">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>

          {/* 2. Dropdown Metode Pembayaran Dikelompokkan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Metode Pembayaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            >
              <option value="">-- Pilih Metode Pembayaran --</option>
              <optgroup label="QRIS">
                <option value="QRIS">QRIS Standar / Dinamis</option>
              </optgroup>
              <optgroup label="Transfer Bank">
                <option value="Transfer Bank - BCA">Bank BCA</option>
                <option value="Transfer Bank - BRI">Bank BRI</option>
              </optgroup>
              <optgroup label="E-Wallet">
                <option value="E-Wallet - GoPay">GoPay</option>
                <option value="E-Wallet - ShopeePay">ShopeePay</option>
                <option value="E-Wallet - DANA">DANA</option>
              </optgroup>
            </select>
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
                  <span>Kirim Bukti Pembayaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
