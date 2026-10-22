import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { formatRupiah } from '../../utils/formatKantin';
import { cariWbpByIdAtauTelp, buatTransaksi } from '../../services/kantin/kantinService';
import { getSaldo } from '../../services/kantin/saldoService';
import { getAuthUser } from '../../services/api';
import KartuKonfirmasiNapi from './KartuKonfirmasiNapi';
import PilihMetodeBayar from './PilihMetodeBayar';

export default function ModalBeli({ paket, isOpen, onClose, isBlocked = false, blockedPeriod = '' }) {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [idInput, setIdInput] = useState('');
  const [wbpTerpilih, setWbpTerpilih] = useState(null);
  const [errorPencarian, setErrorPencarian] = useState('');
  const [errorSubmit, setErrorSubmit] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !paket) return null;

  const handleCariWbp = async (e) => {
    if (e) e.preventDefault();
    if (!idInput.trim()) {
      setErrorPencarian('Silakan masukkan NIP WBP terlebih dahulu.');
      return;
    }

    setIsSearching(true);
    setErrorPencarian('');
    setWbpTerpilih(null);

    try {
      const data = await cariWbpByIdAtauTelp(idInput);
      if (data) {
        setWbpTerpilih(data);
        setErrorPencarian('');
      } else {
        setErrorPencarian('WBP tidak ditemukan, periksa kembali NIP.');
      }
    } catch (err) {
      if (err.isInactive || err.message?.includes('dinonaktifkan')) {
        setErrorPencarian('Akun komunikasi WBP sedang dinonaktifkan oleh petugas lapas.');
      } else {
        setErrorPencarian(err.message || 'Terjadi kesalahan saat mencari data WBP.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleLanjutKeMetode = () => {
    if (!wbpTerpilih) return;
    setErrorSubmit('');
    setStep(2);
  };

  const handleKembaliKeStep1 = () => {
    setErrorSubmit('');
    setStep(1);
  };

  const handleKonfirmasiPembayaran = async () => {
    if (!wbpTerpilih || !paket || isSubmitting || isBlocked) return;

    const user = getAuthUser();
    const userBranchId = user?.branchId || user?.branch?.id;
    if (!paket.branchId || (userBranchId && String(paket.branchId).toLowerCase() !== String(userBranchId).toLowerCase())) {
      setErrorSubmit('Paket komunikasi ini tidak valid atau tidak tersedia untuk cabang UPT Anda.');
      return;
    }

    setIsSubmitting(true);
    setErrorSubmit('');
    try {
      // Pemotongan kuota menit dan verifikasi saldo dilakukan sepenuhnya oleh Backend
      const transaksi = await buatTransaksi({
        napi: wbpTerpilih,
        paket: paket,
        metode: metodeBayar,
      });

      /* FITUR LAMA DIKOMENTARI: Sistem pascabayar tidak lagi memotong kuota menit prabayar lokal
      try {
        await getSaldo();
      } catch (e) {
        console.warn('Gagal memuat ulang saldo setelah transaksi:', e);
      }
      */

      onClose();
      navigate(`/kantin/voucher/${transaksi.id}`);
    } catch (err) {
      if (err?.status === 403 || err?.data?.message?.includes('tidak memiliki izin')) {
        setErrorSubmit(
          'Akses ditolak: Fitur kasir pengisian paket ini khusus untuk akun Petugas Kasir Kantin (CANTEEN_STAFF). Akun yang sedang aktif saat ini bukan kasir kantin. Silakan login menggunakan akun Operator Kantin.'
        );
      } else {
        const msg = err.data?.message || err.message || 'Gagal memproses transaksi. Silakan coba lagi.';
        setErrorSubmit(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setStep(1);
    setIdInput('');
    setWbpTerpilih(null);
    setErrorPencarian('');
    setErrorSubmit('');
    setMetodeBayar('Tunai');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {step === 1 ? 'Pengisian Paket - Langkah 1' : 'Pengisian Paket - Langkah 2'}
            </h3>
            <p className="text-xs text-slate-500">
              {step === 1 ? 'Pencarian NIP / Nomor Registrasi' : 'Konfirmasi & Pembayaran Tunai'}
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer disabled:opacity-40"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indikator */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 1 ? 'bg-[#1565C0] text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </div>
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                NIP / WBP
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-3 ${step === 2 ? 'bg-[#1565C0]' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-[#1565C0] text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                Pembayaran Tunai
              </span>
            </div>
          </div>
        </div>

        {/* Konten Modal (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {/* Ringkasan Paket Terpilih */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1565C0] block">
                Paket Terpilih
              </span>
              <p className="text-sm font-bold text-slate-800">{paket.nama || paket.name}</p>
              {paket.durasi && <p className="text-xs text-slate-500">Durasi: {paket.durasi}</p>}
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-[#1565C0]">
                {formatRupiah(paket.harga || paket.price)}
              </span>
            </div>
          </div>

          {/* STEP 1: Masukkan NIP atau No. Telepon */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  NIP WBP <span className="text-red-500">*</span>
                </label>
                <form onSubmit={handleCariWbp} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={idInput}
                      onChange={(e) => {
                        setIdInput(e.target.value);
                        if (errorPencarian) setErrorPencarian('');
                      }}
                      placeholder="Contoh: NIP-8192, 8192, atau Nama WBP"
                      className="w-full pl-3.5 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-semibold text-sm rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Cari</span>
                  </button>
                </form>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Ketik NIP atau Nama WBP untuk memuat profil.
                </p>
              </div>

              {/* Error Message */}
              {errorPencarian && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-600 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorPencarian}</span>
                </div>
              )}

              {/* Hasil Konfirmasi Data */}
              {wbpTerpilih && (
                <KartuKonfirmasiNapi napi={wbpTerpilih} />
              )}
            </div>
          )}

          {/* STEP 2: Metode Pembayaran & Konfirmasi */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Ringkasan Lengkap */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Warga Binaan:</span>
                  <span className="font-bold text-slate-800">{wbpTerpilih?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIP / Kamar:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {wbpTerpilih?.identifier || wbpTerpilih?.id} {wbpTerpilih?.blok ? `(${wbpTerpilih.blok})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paket:</span>
                  <span className="font-medium text-slate-800">{paket.nama || paket.name}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-700">Total Pembayaran Tunai:</span>
                  <span className="font-extrabold text-[#1565C0]">{formatRupiah(paket.harga || paket.price)}</span>
                </div>
              </div>

              {isBlocked && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Transaksi diblokir: tagihan periode {blockedPeriod || 'bulan lalu'} belum lunas. Selesaikan pembayaran di menu Tagihan Bulanan.</span>
                </div>
              )}

              {errorSubmit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-600 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorSubmit}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Metode Pembayaran
                </label>
                <PilihMetodeBayar
                  metodeTerpilih={metodeBayar}
                  onPilihMetode={setMetodeBayar}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {step === 1 ? (
            <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer disabled:opacity-50 text-center"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleLanjutKeMetode}
                disabled={!wbpTerpilih || isBlocked}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleKembaliKeStep1}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-sm font-medium transition cursor-pointer whitespace-nowrap disabled:opacity-50 text-center"
                >
                  Batal
                </button>
              </div>

              <button
                type="button"
                onClick={handleKonfirmasiPembayaran}
                disabled={isSubmitting || isBlocked}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                )}
                <span>Konfirmasi Pembayaran</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
