import React, { useState, useEffect, useCallback, useRef } from 'react';
import { History, RefreshCw } from 'lucide-react';
import FilterPeriode from '../../components/kantin/FilterPeriode';
import KartuRingkasan from '../../components/kantin/KartuRingkasan';
import BarChartSederhana from '../../components/kantin/BarChartSederhana';
import TabelTransaksi from '../../components/kantin/TabelTransaksi';
import { getRekap, getRiwayat } from '../../services/kantin/kantinService';

export default function RiwayatPage() {
  const [periode, setPeriode] = useState('bulanan');
  const [tanggal, setTanggal] = useState(() => new Date());

  const [metodeFilter, setMetodeFilter] = useState('Semua');
  const [pencarian, setPencarian] = useState('');
  const [debouncedPencarian, setDebouncedPencarian] = useState('');

  const [rekapData, setRekapData] = useState({
    totalPemasukan: 0,
    jumlahTransaksi: 0,
    chartData: [],
  });
  const [transaksiList, setTransaksiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Request ID ref untuk mencegah race condition (respons lama menimpa respons baru)
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);

  // Debounce search query 350ms agar tidak spam API setiap ketikan huruf
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPencarian(pencarian.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [pencarian]);

  const fetchData = useCallback(
    async (currentPeriode, currentTanggal, currentMetode, currentPencarian) => {
      const currentRequestId = ++requestIdRef.current;
      setIsLoading(true);

      try {
        const [rekapRes, riwayatRes] = await Promise.allSettled([
          getRekap({ periode: currentPeriode, tanggal: currentTanggal }),
          getRiwayat({
            cari: currentPencarian,
            metode: currentMetode,
            periode: currentPeriode,
            tanggal: currentTanggal,
          }),
        ]);

        // Cek apakah ada request yang lebih baru yang sudah berjalan
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (rekapRes.status === 'fulfilled' && rekapRes.value) {
          setRekapData(rekapRes.value);
        } else {
          setRekapData((prev) => ({
            ...prev,
            totalPemasukan: 0,
            jumlahTransaksi: 0,
            chartData: [],
          }));
        }

        if (riwayatRes.status === 'fulfilled' && Array.isArray(riwayatRes.value)) {
          setTransaksiList(riwayatRes.value);
        } else {
          setTransaksiList([]);
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          console.error('Gagal mengambil data riwayat & rekap:', err);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Ambil data saat filter periode, tanggal, metode, atau debounced search berubah
  useEffect(() => {
    fetchData(periode, tanggal, metodeFilter, debouncedPencarian);
  }, [fetchData, periode, tanggal, metodeFilter, debouncedPencarian]);

  // Listener untuk transaksi kantin baru tersimpan atau storage update (dengan debounce & filter key)
  useEffect(() => {
    const handleCanteenEvent = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchData(periode, tanggal, metodeFilter, debouncedPencarian);
      }, 500);
    };

    const handleStorageEvent = (e) => {
      // Hanya refetch jika key storage berkaitan dengan kantin
      if (
        e &&
        e.key &&
        (e.key.includes('canteen') || e.key.includes('pascall_canteen'))
      ) {
        handleCanteenEvent();
      }
    };

    window.addEventListener('canteen_transaction_saved', handleCanteenEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      window.removeEventListener('canteen_transaction_saved', handleCanteenEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fetchData, periode, tanggal, metodeFilter, debouncedPencarian]);

  const handleUbahPeriode = (newPeriode) => {
    setPeriode(newPeriode);
  };

  const handleUbahTanggal = (newTanggal) => {
    setTanggal(newTanggal);
  };

  const handleManualRefresh = () => {
    fetchData(periode, tanggal, metodeFilter, debouncedPencarian);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Unified Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <History className="w-3.5 h-3.5 text-blue-600" />
              Rekap Transaksi
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Kantin Lapas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Rekap & Riwayat Penjualan
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Laporan rekapitulasi pemasukan omzet penjualan voucher dan daftar riwayat transaksi kasir kantin.
          </p>
        </div>

        {/* Toolbar Filter Periode & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <FilterPeriode
            periode={periode}
            onUbahPeriode={handleUbahPeriode}
            tanggal={tanggal}
            onUbahTanggal={handleUbahTanggal}
          />

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
            title="Segarkan data riwayat"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Bagian Rekap Ringkasan (Selalu menampilkan kartu metrik tanpa kotak abu-abu mentah) */}
      <KartuRingkasan rekap={rekapData} isLoading={isLoading} />

      {/* 3. Bar Chart Sederhana (div + Tailwind) */}
      {rekapData && Array.isArray(rekapData.chartData) && rekapData.chartData.length > 0 && (
        <BarChartSederhana
          data={rekapData.chartData}
          periode={periode}
        />
      )}

      {/* 4. Tabel Riwayat Transaksi */}
      <TabelTransaksi
        transaksiList={transaksiList}
        metodeFilter={metodeFilter}
        onMetodeFilterChange={setMetodeFilter}
        pencarian={pencarian}
        onPencarianChange={setPencarian}
        periode={periode}
        tanggal={tanggal}
        isLoading={isLoading}
      />
    </div>
  );
}
