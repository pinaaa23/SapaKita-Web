import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PromoBanner from '../../components/kantin/PromoBanner';
import KategoriTabs from '../../components/kantin/KategoriTabs';
import KartuPaket from '../../components/kantin/KartuPaket';
import ModalBeli from '../../components/kantin/ModalBeli';
import EmptyState from '../../components/kantin/EmptyState';
import { getPaketKantin } from '../../services/packageService';
import { Package, Wallet, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { ENABLE_COMBO_PACKAGES } from '../../data/kantin/paket';
import { formatRupiah } from '../../utils/formatKantin';
import { useBlokirTagihan } from '../../hooks/useBlokirTagihan';
/* FITUR LAMA DIKOMENTARI: Penggunaan saldo menit prabayar
import {
  SALDO_MINIMUM_WARNING,
  getSaldo,
  getSaldoSync,
  subscribeSaldoUpdate,
} from '../../services/kantin/saldoService';
*/

export { ENABLE_COMBO_PACKAGES };

export default function PaketPage() {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState('telepon');
  const [allPaket, setAllPaket] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paketTerpilih, setPaketTerpilih] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook penentu blokir transaksi pascabayar (dari data tagihan bulan lalu yang belum lunas)
  const { isBlocked, isDueSoon, daysLeft, blockedPeriod } = useBlokirTagihan();

  /* FITUR LAMA DIKOMENTARI: Saldo menit kasir prabayar
  const [saldo, setSaldo] = useState(() => getSaldoSync());
  const [saldoError, setSaldoError] = useState('');

  useEffect(() => {
    getSaldo().then((s) => setSaldo(s)).catch((e) => console.warn('Gagal memuat saldo:', e));
    const unsubscribe = subscribeSaldoUpdate((newSaldo) => {
      setSaldo(newSaldo);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  */

  useEffect(() => {
    let isMounted = true;
    const loadPaket = async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      try {
        const data = await getPaketKantin({ kategori: 'semua' });
        if (isMounted) {
          setAllPaket(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Gagal mengambil data paket:', err);
      } finally {
        if (isMounted && !isSilent) {
          setIsLoading(false);
        }
      }
    };

    loadPaket(false);

    const handleUpdate = () => {
      loadPaket(true);
    };
    window.addEventListener('pascall_packages_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('pascall_packages_updated', handleUpdate);
    };
  }, []);

  // Filter paket secara instan dan sinkron agar transisi antar tab mulus tanpa flicker
  const paketList = useMemo(() => {
    const activeKategori = (!ENABLE_COMBO_PACKAGES && kategori === 'combo') ? 'telepon' : kategori;
    return allPaket.filter((p) => {
      const kat = (p.kategori || '').toLowerCase();
      if (activeKategori === 'video') return kat.includes('vid');
      if (activeKategori === 'telepon') return !kat.includes('vid') && kat !== 'combo';
      if (activeKategori === 'combo') return kat.includes('combo');
      return true;
    });
  }, [allPaket, kategori]);

  const handleBeliPaket = (paket) => {
    if (isBlocked) {
      return;
    }

    /* FITUR LAMA DIKOMENTARI: Pengecekan kuota menit kasir sebelum membuka modal pembelian
    const durasiMenit = Number(paket.menit || parseInt(paket.durasi) || 5);
    if (saldo < durasiMenit) {
      setSaldoError(
        `Kuota menit kasir tidak mencukupi untuk memproses "${paket.nama}" (${durasiMenit} Menit). Sisa kuota saat ini: ${saldo} Menit. Silakan lakukan top up saldo menit terlebih dahulu.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaldoError('');
    */

    setPaketTerpilih(paket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPaketTerpilih(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner Pemblokiran Transaksi Jika Tagihan Bulan Lalu Belum Lunas & Melewati Jatuh Tempo */}
      {isBlocked && (
        <div className="p-4 sm:p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-rose-900">
                Akses Penjualan Ditangguhkan
              </h4>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5 leading-relaxed">
                Transaksi diblokir: tagihan periode <span className="font-bold underline">{blockedPeriod || 'bulan lalu'}</span> belum lunas dan telah melewati batas jatuh tempo (maksimal 2 hari). Selesaikan pembayaran di menu Tagihan Bulanan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/kantin/tagihan')}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap self-stretch sm:self-center shrink-0"
          >
            <span>Buka Tagihan Bulanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner Peringatan Jatuh Tempo (Masa Tenggang 2 Hari) */}
      {!isBlocked && isDueSoon && (
        <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <span>Peringatan Jatuh Tempo Tagihan</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-full font-bold">
                  Sisa {daysLeft} Hari
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5 leading-relaxed">
                Tagihan periode <span className="font-bold underline">{blockedPeriod}</span> belum lunas. Jatuh tempo pembayaran maksimal 2 hari. Segera transfer dan upload bukti agar penjualan tidak diblokir.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/kantin/tagihan')}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap self-stretch sm:self-center shrink-0"
          >
            <span>Bayar Tagihan Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FITUR LAMA DIKOMENTARI: Bar saldo menit peringatan lama
      {saldoError && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Kuota Menit Tidak Mencukupi
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">{saldoError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => navigate('/kantin/top-up-saldo')}
              className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Top Up Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSaldoError('')}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      */}

      {/* 1. Promo Banner */}
      <PromoBanner />

      {/* 3. Filter Kategori Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Pilihan Paket Komunikasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih paket yang diinginkan oleh warga binaan pemasyarakatan.
          </p>
        </div>

        <KategoriTabs
          kategoriAktif={kategori}
          onPilihKategori={(kat) => setKategori(kat)}
        />
      </div>

      {/* 4. Grid Kartu Paket */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4"
            >
              <div className="h-5 bg-slate-200 rounded-md w-3/5" />
              <div className="h-4 bg-slate-100 rounded-md w-4/5" />
              <div className="h-8 bg-slate-200 rounded-lg w-1/2 mt-6" />
              <div className="h-11 bg-slate-200 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : paketList.length === 0 ? (
        <EmptyState
          title={allPaket.length === 0 ? "Belum Ada Paket Komunikasi" : "Paket Tidak Ditemukan"}
          description={allPaket.length === 0 ? "Paket komunikasi belum dibuat atau diterapkan oleh Supervisor UPT." : "Saat ini belum ada daftar paket untuk kategori yang dipilih."}
          icon={Package}
        />
      ) : (
        <div
          key={kategori}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in duration-200"
        >
          {paketList.map((paket) => (
            <KartuPaket
              key={paket.id}
              paket={paket}
              onBeli={handleBeliPaket}
              disabled={isBlocked}
            />
          ))}
        </div>
      )}

      {/* 5. Modal Alur Beli */}
      {isModalOpen && paketTerpilih && (
        <ModalBeli
          paket={paketTerpilih}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          isBlocked={isBlocked}
          blockedPeriod={blockedPeriod}
        />
      )}
    </div>
  );
}

