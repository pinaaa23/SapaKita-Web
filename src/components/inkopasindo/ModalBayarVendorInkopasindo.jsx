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
  Copy,
  Check,
  Eye,
  ArrowRight,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { formatRupiah, submitInkopasindoVendorPayment, MONTH_NAMES } from '../../services/inkopasindoService';
import { getFinancePaymentSettings } from '../../services/financeService';
import { API_BASE_URL } from '../../services/api';

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.includes(':9000') || url.includes('finance-settings') || url.includes('/payment-settings/qris-image')) {
    const queryString = url.includes('?') ? url.substring(url.indexOf('?')) : '';
    return `${(API_BASE_URL || '').replace(/\/+$/, '')}/api/finance/payment-settings/qris-image${queryString}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${(API_BASE_URL || '').replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

export default function ModalBayarVendorInkopasindo({
  isOpen,
  onClose,
  billingItem,
  onSuccess,
}) {
  const [metodePembayaran, setMetodePembayaran] = useState('TRANSFER_BANK');
  const [financeSetting, setFinanceSetting] = useState(null);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewQrisModal, setPreviewQrisModal] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    getFinancePaymentSettings().then((s) => {
      if (isMounted && s) {
        setFinanceSetting(s);
        if (s.isBankActive !== false) {
          setMetodePembayaran('TRANSFER_BANK');
        } else if (s.isQrisActive !== false && s.qrisImageUrl) {
          setMetodePembayaran('QRIS');
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Reset form when opened with new billing item
  useEffect(() => {
    if (isOpen) {
      setProofFile(null);
      setFilePreview(null);
      setFileError('');
      setSubmitError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, billingItem?.id]);

  if (!isOpen || !billingItem) return null;

  const vendorAmount = billingItem.shares3Way?.vendor?.amount || 0;
  const vendorPercent = billingItem.split3Way?.vendor || 60;
  const periodLabel = `${MONTH_NAMES[(billingItem.month || 1) - 1]} ${billingItem.year}`;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    setSubmitError('');

    if (!file) {
      setProofFile(null);
      setFilePreview(null);
      return;
    }

    // Validasi ukuran berkas maksimal 2 MB
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

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!proofFile) {
      setFileError('Bukti transfer pembayaran wajib diunggah.');
      return;
    }

    if (vendorAmount <= 0) {
      setSubmitError('Nominal tagihan 60% vendor adalah Rp 0. Tidak ada kewajiban setoran yang perlu dibayarkan.');
      return;
    }

    const branchId = billingItem.branchId || billingItem.id;
    if (!branchId) {
      setSubmitError('ID cabang UPT tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bankTargetStr = metodePembayaran === 'QRIS'
        ? 'QRIS Resmi PassCall'
        : `${financeSetting?.bankName || 'Bank Mandiri'} (${financeSetting?.accountNumber || '168-00-9988112-7'})`;

      await submitInkopasindoVendorPayment({
        branchId,
        nominal: vendorAmount,
        minutes: billingItem.totalMinutes || 1,
        paymentMethod: metodePembayaran,
        bankTarget: bankTargetStr,
        proofFile,
        billingMonth: billingItem.month,
        billingYear: billingItem.year,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('finance_billing_updated'));
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('[ModalBayarVendorInkopasindo] Gagal mengirim pembayaran:', err);
      setSubmitError(err.message || 'Gagal mengirim bukti pembayaran setoran vendor. Periksa koneksi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bankName = financeSetting?.bankName || 'Bank Mandiri';
  const accNum = financeSetting?.accountNumber || '168-00-9988112-7';
  const accHolder = financeSetting?.accountHolder || 'PT PasCall Solusi Indonesia';
  const qrisUrl = financeSetting?.qrisImageUrl;

  const isBankAvailable = financeSetting?.isBankActive !== false;
  const isQrisAvailable = financeSetting?.isQrisActive !== false && !!qrisUrl;

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto transition-opacity animate-in fade-in duration-200"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0 }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] my-auto flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Bayar Setoran Tagihan Vendor (60%)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Penyetoran Hak Vendor Sadewa oleh Koperasi Inkopasindo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {/* Card Rincian UPT & Nominal Tagihan */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                {billingItem.branchName || 'UPT Pemasyarakatan'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-[10px] font-bold border border-blue-400/30">
                {periodLabel}
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              {billingItem.kanwilName || 'Kanwil Jawa Tengah'} • Omset Kotor: {formatRupiah(billingItem.grossAmount)}
            </p>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Tagihan Wajib Bayar ke Vendor ({vendorPercent}%):
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {formatRupiah(vendorAmount)}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium">
                Hak UPT: {formatRupiah(billingItem.shares3Way?.upt?.amount || 0)}
              </span>
            </div>
          </div>

          {/* Pemilihan Metode Pembayaran */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Metode Transfer ke Rekening Resmi Vendor:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMetodePembayaran('TRANSFER_BANK')}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  metodePembayaran === 'TRANSFER_BANK'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfer Mandiri</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodePembayaran('QRIS')}
                disabled={!isQrisAvailable}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  metodePembayaran === 'QRIS'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QRIS</span>
              </button>
            </div>
          </div>

          {/* Petunjuk Rekening Penampung Vendor */}
          {metodePembayaran === 'TRANSFER_BANK' ? (
            <div className="p-4 bg-gradient-to-br from-blue-50/90 to-slate-50/70 border border-blue-200 rounded-2xl space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Rekening Resmi Vendor Sadewa</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {bankName}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Nomor Rekening
                  </span>
                  <p className="text-lg font-mono font-black text-blue-950 tracking-wider select-all">
                    {accNum}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    a.n. <strong className="text-slate-800">{accHolder}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(accNum);
                    setCopiedRekening(true);
                    setTimeout(() => setCopiedRekening(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedRekening ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRekening ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Catatan: Cantumkan <strong>{billingItem.id || billingItem.branchName}</strong> pada berita transfer.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-blue-50/70 border border-emerald-200 rounded-2xl space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Barcode QRIS Resmi Sadewa</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  QRIS Nasional
                </span>
              </div>

              {qrisUrl && (
                <div className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center gap-4">
                  <img
                    src={resolveImageUrl(qrisUrl)}
                    alt="QRIS Barcode"
                    onClick={() => setPreviewQrisModal(true)}
                    className="w-20 h-20 object-contain rounded-lg border border-slate-200 p-1 bg-white cursor-pointer hover:scale-105 transition-transform"
                    title="Klik untuk memperbesar QRIS"
                  />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-slate-800">Pindai menggunakan aplikasi m-Banking atau e-Wallet</p>
                    <p className="text-[11px] text-slate-500">BCA, Mandiri Livin, BRImo, BNI, GoPay, OVO, DANA.</p>
                    <button
                      type="button"
                      onClick={() => setPreviewQrisModal(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 underline cursor-pointer"
                    >
                      Perbesar Barcode
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Upload Bukti Transfer */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Unggah Bukti Transfer / Pembayaran: <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                proofFile
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : fileError
                  ? 'border-rose-300 bg-rose-50/40'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {proofFile ? (
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview Bukti"
                      className="w-14 h-14 object-cover rounded-xl border border-emerald-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                      {proofFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(proofFile.size / 1024).toFixed(0)} KB • Klik untuk mengganti berkas
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      Klik untuk memilih berkas struk pembayaran
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Mendukung format JPG, PNG, WEBP, atau PDF (maksimal 2 MB)
                    </span>
                  </div>
                </>
              )}
            </div>

            {fileError && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{fileError}</span>
              </p>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Footer Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !proofFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirimkan Pembayaran...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kirim Pembayaran ({formatRupiah(vendorAmount)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Zoom QRIS */}
      {previewQrisModal && qrisUrl && createPortal(
        <div
          className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewQrisModal(false)}
        >
          <div
            className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-3 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-slate-800">Barcode QRIS Resmi</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <img
                src={resolveImageUrl(qrisUrl)}
                alt="QRIS Full"
                className="w-full aspect-square object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setPreviewQrisModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  ) : null;
}

