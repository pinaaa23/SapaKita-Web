import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PromoBanner from '../../components/kantin/PromoBanner';
import KategoriTabs from '../../components/kantin/KategoriTabs';
import KartuPaket from '../../components/kantin/KartuPaket';
import ModalBeli from '../../components/kantin/ModalBeli';
import EmptyState from '../../components/kantin/EmptyState';
import { getPaket } from '../../services/kantin/kantinService';
import { Package, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';
import { ENABLE_COMBO_PACKAGES } from '../../data/kantin/paket';
import { formatRupiah } from '../../utils/formatKantin';
import {
  SALDO_MINIMUM_WARNING,
  getSaldoSync,
  subscribeSaldoUpdate,
} from '../../services/kantin/saldoService';

export { ENABLE_COMBO_PACKAGES };

export default function PaketPage() {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState('telepon');
  const [paketList, setPaketList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paketTerpilih, setPaketTerpilih] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Saldo state
  const [saldo, setSaldo] = useState(() => getSaldoSync());
  const [saldoError, setSaldoError] = useState('');

  useEffect(() => {
    // Subscribe update saldo
    const unsubscribe = subscribeSaldoUpdate((newSaldo) => {
      setSaldo(newSaldo);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPaket = async () => {
      setIsLoading(true);
      try {
        const activeKategori = (!ENABLE_COMBO_PACKAGES && kategori === 'combo') ? 'telepon' : kategori;
        const data = await getPaket(activeKategori);
        if (isMounted) {
          setPaketList(data);
        }
      } catch (err) {
        console.error('Gagal mengambil data paket:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPaket();

    const handleUpdate = () => {
      loadPaket();
    };
    window.addEventListener('pascall_packages_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('pascall_packages_updated', handleUpdate);
    };
  }, [kategori]);

  const handleBeliPaket = (paket) => {
    // Cek kuota menit kasir sebelum membuka modal pembelian
    const durasiMenit = Number(paket.menit || parseInt(paket.durasi) || 5);
    if (saldo < durasiMenit) {
      setSaldoError(
        `Kuota menit kasir tidak mencukupi untuk memproses "${paket.nama}" (${durasiMenit} Menit). Sisa kuota saat ini: ${saldo} Menit. Silakan lakukan top up saldo menit terlebih dahulu.`
      );
      // Scroll to error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaldoError('');
    setPaketTerpilih(paket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPaketTerpilih(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 0. Peringatan Kuota Menit Tidak Cukup saat Beli */}
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
          title="Paket Tidak Ditemukan"
          description="Saat ini belum ada daftar paket untuk kategori yang dipilih."
          icon={Package}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {paketList.map((paket) => (
            <KartuPaket
              key={paket.id}
              paket={paket}
              onBeli={handleBeliPaket}
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
        />
      )}
    </div>
  );
}

