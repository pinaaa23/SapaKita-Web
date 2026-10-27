import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Sliders,
  Percent,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Edit3,
  X,
  Check,
  Calculator,
  RefreshCw,
  Landmark,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import {
  getFinanceContracts,
  saveFinanceContract,
  formatRupiah,
  DEFAULT_REVENUE_SPLIT
} from '../../services/financeService';

export default function FinanceContracts() {
  const [contracts, setContracts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalItem, setEditModalItem] = useState(null);

  // Form states in modal
  const [ratePerSecond, setRatePerSecond] = useState(50);
  const [kepalaUptPct, setKepalaUptPct] = useState(5);
  const [koperasiPct, setKoperasiPct] = useState(30);
  const [inkopasindoPct, setInkopasindoPct] = useState(10);
  const [vendorPct, setVendorPct] = useState(55);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [simulationRevenue, setSimulationRevenue] = useState(10000000); // 10 juta
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadContracts = async () => {
    try {
      const list = await getFinanceContracts();
      setContracts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('[FinanceContracts] Gagal memuat kontrak:', err);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const openEditModal = (contract) => {
    setEditModalItem(contract);
    setRatePerSecond(contract.ratePerSecond || 50);
    setKepalaUptPct(contract.split?.kepalaUpt ?? DEFAULT_REVENUE_SPLIT.kepalaUpt);
    setKoperasiPct(contract.split?.koperasi ?? DEFAULT_REVENUE_SPLIT.koperasi);
    setInkopasindoPct(contract.split?.inkopasindo ?? DEFAULT_REVENUE_SPLIT.inkopasindo);
    setVendorPct(contract.split?.vendor ?? DEFAULT_REVENUE_SPLIT.vendor);
    setBankName(contract.bankName || 'Bank Mandiri');
    setAccountNumber(contract.accountNumber || '');
    setAccountHolder(contract.accountHolder || '');
  };

  // Validasi total harus 100%
  const totalPercent = Number(kepalaUptPct || 0) + Number(koperasiPct || 0) + Number(inkopasindoPct || 0) + Number(vendorPct || 0);
  const isPercentValid = totalPercent === 100;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;

    if (!isPercentValid) {
      showToast(`Total persentase harus tepat 100% (saat ini ${totalPercent}%). Harap sesuaikan!`, 'error');
      return;
    }

    try {
      await saveFinanceContract(editModalItem.branchId, {
        ratePerSecond: Number(ratePerSecond),
        split: {
          kepalaUpt: Number(kepalaUptPct),
          koperasi: Number(koperasiPct),
          inkopasindo: Number(inkopasindoPct),
          vendor: Number(vendorPct),
        },
        bankName,
        accountNumber,
        accountHolder,
      });

      showToast(`Kontrak bagi hasil untuk ${editModalItem.branchName} berhasil disimpan.`);
      setEditModalItem(null);
      loadContracts();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan kontrak', 'error');
    }
  };

  const filteredContracts = contracts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.branchName.toLowerCase().includes(q) ||
      c.canteenName.toLowerCase().includes(q) ||
      c.kanwilName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* 1. Banner Formula Resmi 4 Pihak (Kompak, Ramping, & Seragam) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B3D91] via-[#154db3] to-[#1E5FCC] p-4 sm:p-5 text-white shadow-xs">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-8 w-48 h-48 rounded-full bg-blue-300/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Standar Pembagian Hasil Nasional</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Formula Resmi 4 Pihak (Total 100%)
            </h2>
            <p className="text-blue-100/90 text-xs leading-relaxed">
              Persentase per UPT dapat disesuaikan sewaktu-waktu sesuai adendum kontrak kerja sama. Perubahan persentase akan langsung mengkalkulasi ulang tagihan berjalan.
            </p>
          </div>

          {/* 4 Pihak Quick Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
              <span className="text-[10px] text-purple-200 block font-semibold uppercase tracking-wider">1. Kepala UPT</span>
              <span className="text-lg font-black text-white mt-0.5 block">5%</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
              <span className="text-[10px] text-sky-200 block font-semibold uppercase tracking-wider">2. Koperasi</span>
              <span className="text-lg font-black text-white mt-0.5 block">30%</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
              <span className="text-[10px] text-amber-200 block font-semibold uppercase tracking-wider">3. Inkopasindo</span>
              <span className="text-lg font-black text-white mt-0.5 block">10%</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
              <span className="text-[10px] text-indigo-200 block font-semibold uppercase tracking-wider">4. Vendor</span>
              <span className="text-lg font-black text-white mt-0.5 block">55%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabel Kontrak UPT & Pencarian */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        {/* Header Tabel & Kotak Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Kontrak &amp; Pengaturan Tarif UPT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola persentase bagi hasil, tarif per detik, dan rekening penampung masing-masing cabang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
              {contracts.length} UPT Terdaftar
            </span>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari UPT atau Kanwil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] shadow-2xs transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-3 px-4 rounded-l-xl">Nama UPT &amp; Wilayah</th>
                <th className="py-3 px-4">Pengelola &amp; Rekening</th>
                <th className="py-3 px-4 text-center">Tarif Panggilan</th>
                <th className="py-3 px-4 text-center">Kepala UPT</th>
                <th className="py-3 px-4 text-center">Koperasi</th>
                <th className="py-3 px-4 text-center">Inkopasindo</th>
                <th className="py-3 px-4 text-center">Vendor</th>
                <th className="py-3 px-4 text-center">Total</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data kontrak UPT yang sesuai</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#1565C0] font-bold hover:underline mt-1 cursor-pointer"
                      >
                        Reset pencarian
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const s = c.split || DEFAULT_REVENUE_SPLIT;
                  const total = s.kepalaUpt + s.koperasi + s.inkopasindo + s.vendor;

                  return (
                    <tr key={c.branchId} className="hover:bg-slate-50/70 transition-colors">
                      {/* UPT & Kanwil */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{c.branchName}</div>
                        <div className="text-[11px] text-slate-500">{c.kanwilName}</div>
                      </td>

                      {/* Koperasi & Rekening */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{c.canteenName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Landmark className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.bankName} - {c.accountNumber}</span>
                        </div>
                      </td>

                      {/* Tarif */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-[#1565C0]">Rp {c.ratePerSecond}/dtk</span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          (Rp {(c.ratePerSecond * 60).toLocaleString('id-ID')}/mnt)
                        </div>
                      </td>

                      {/* 1. Kepala UPT */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 font-bold text-xs whitespace-nowrap">
                          {s.kepalaUpt}%
                        </span>
                      </td>

                      {/* 2. Koperasi */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-bold text-xs whitespace-nowrap">
                          {s.koperasi}%
                        </span>
                      </td>

                      {/* 3. Inkopasindo */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-xs whitespace-nowrap">
                          {s.inkopasindo}%
                        </span>
                      </td>

                      {/* 4. Vendor */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-xs whitespace-nowrap">
                          {s.vendor}%
                        </span>
                      </td>

                      {/* Total % */}
                      <td className="py-3.5 px-4 text-center">
                        {total === 100 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-extrabold text-xs whitespace-nowrap">
                            100%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-extrabold text-xs whitespace-nowrap">
                            {total}%
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEditModal(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1565C0] text-xs font-bold transition shadow-2xs cursor-pointer"
                          title="Ubah persentase & tarif kontrak"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Ubah Persentase</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Kontrak & Persentase Bagi Hasil */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200/90 my-8">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1565C0]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    Ubah Kontrak &amp; Persentase Bagi Hasil
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editModalItem.branchName} ({editModalItem.kanwilName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="py-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* Tarif & Rekening */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tarif per Detik (Rupiah)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={ratePerSecond}
                    onChange={(e) => setRatePerSecond(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-bold text-slate-800"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Setara Rp {(ratePerSecond * 60).toLocaleString('id-ID')} / menit</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank Penampung Koperasi</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] font-mono text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Atas Nama Rekening</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* 4 Pihak Persentase Input */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Konfigurasi Persentase Bagi Hasil 4 Pihak
                  </h4>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isPercentValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    Total: {totalPercent}% / 100%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* 1. Kepala UPT */}
                  <div className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-2xs">
                    <label className="block text-purple-900 font-bold mb-1">1. Kepala UPT</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={kepalaUptPct}
                        onChange={(e) => setKepalaUptPct(Number(e.target.value))}
                        className="w-full pr-7 pl-3 py-1.5 rounded-lg border border-slate-200 font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 2. Koperasi */}
                  <div className="bg-white p-2.5 rounded-xl border border-sky-200 shadow-2xs">
                    <label className="block text-sky-900 font-bold mb-1">2. Koperasi</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={koperasiPct}
                        onChange={(e) => setKoperasiPct(Number(e.target.value))}
                        className="w-full pr-7 pl-3 py-1.5 rounded-lg border border-slate-200 font-extrabold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 3. Inkopasindo */}
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                    <label className="block text-amber-900 font-bold mb-1">3. Inkopasindo</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inkopasindoPct}
                        onChange={(e) => setInkopasindoPct(Number(e.target.value))}
                        className="w-full pr-7 pl-3 py-1.5 rounded-lg border border-slate-200 font-extrabold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 4. Vendor */}
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-2xs">
                    <label className="block text-indigo-900 font-bold mb-1">4. Vendor</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={vendorPct}
                        onChange={(e) => setVendorPct(Number(e.target.value))}
                        className="w-full pr-7 pl-3 py-1.5 rounded-lg border border-slate-200 font-extrabold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Validation Indicator */}
                {!isPercentValid ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Jumlah total persentase saat ini <strong>{totalPercent}%</strong>. Mohon sesuaikan agar tepat <strong>100%</strong> sebelum menyimpan.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Total persentase valid (100%). Skema bagi hasil siap diaplikasikan.
                    </span>
                  </div>
                )}
              </div>

              {/* Live Simulator Bagi Hasil */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#1565C0]" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Simulasi Pembagian Hasil Real-Time
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Contoh Omset:</span>
                    <input
                      type="number"
                      step="1000000"
                      value={simulationRevenue}
                      onChange={(e) => setSimulationRevenue(Number(e.target.value))}
                      className="w-32 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-purple-800 font-semibold block text-[11px]">Kepala UPT ({kepalaUptPct}%):</span>
                    <span className="font-black text-purple-950 text-sm mt-0.5 block">
                      {formatRupiah((simulationRevenue * kepalaUptPct) / 100)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-sky-800 font-semibold block text-[11px]">Koperasi ({koperasiPct}%):</span>
                    <span className="font-black text-sky-950 text-sm mt-0.5 block">
                      {formatRupiah((simulationRevenue * koperasiPct) / 100)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-amber-800 font-semibold block text-[11px]">Inkopasindo ({inkopasindoPct}%):</span>
                    <span className="font-black text-amber-950 text-sm mt-0.5 block">
                      {formatRupiah((simulationRevenue * inkopasindoPct) / 100)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-indigo-800 font-semibold block text-[11px]">Vendor ({vendorPct}%):</span>
                    <span className="font-black text-indigo-950 text-sm mt-0.5 block">
                      {formatRupiah((simulationRevenue * vendorPct) / 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isPercentValid}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Kontrak Bagi Hasil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
