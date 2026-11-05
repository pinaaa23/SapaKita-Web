import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Landmark,
  X,
  Eye,
  Lock
} from 'lucide-react';
import {
  getInkopasindoBillings,
  getInkopasindoFilterOptions,
  generateInkopasindoInvoicePDF,
  formatRupiah,
  MONTH_NAMES
} from '../../services/inkopasindoService';

export default function InkopasindoBilling() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [selectedMonth, setSelectedMonth] = useState('semua');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedKanwil, setSelectedKanwil] = useState('semua');
  const [selectedBranch, setSelectedBranch] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [billings, setBillings] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ kanwils: [], branches: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Modal Detail State
  const [detailModalItem, setDetailModalItem] = useState(null);

  // Download & Toast State
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDownloadInvoice = async (item) => {
    if (!item) return;
    setDownloadingId(item.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const ok = await generateInkopasindoInvoicePDF(item);
      if (ok) {
        showToast(`Invoice ${item.id} berhasil diunduh.`, 'success');
      } else {
        showToast(`Gagal membuat invoice ${item.id}. Coba lagi.`, 'error');
      }
    } catch (err) {
      console.error('[InkopasindoBilling] Error downloading invoice:', err);
      showToast('Terjadi kesalahan saat memproses invoice.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Load filter options
  useEffect(() => {
    getInkopasindoFilterOptions().then((opts) => setFilterOptions(opts));
  }, []);

  // Load billings
  const loadBillings = async () => {
    setIsLoading(true);
    try {
      const data = await getInkopasindoBillings({
        month: selectedMonth,
        year: selectedYear,
        kanwil: selectedKanwil,
        branchId: selectedBranch,
        status: selectedStatus,
        search: searchQuery,
      });
      setBillings(data);

      // Auto-open modal jika ada id di URL
      if (initialId && !detailModalItem) {
        const found = data.find((b) => String(b.id) === String(initialId));
        if (found) setDetailModalItem(found);
      }
    } catch (err) {
      console.warn('[InkopasindoBilling] Failed to load billings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillings();
  }, [selectedMonth, selectedYear, selectedKanwil, selectedBranch, selectedStatus, searchQuery]);

  // Filter UPT dropdown options berdasarkan kanwil yang dipilih
  const filteredBranches = selectedKanwil === 'semua'
    ? filterOptions.branches
    : filterOptions.branches.filter(
        (b) =>
          (b.kanwilName && b.kanwilName.toLowerCase().includes(selectedKanwil.toLowerCase())) ||
          (b.kanwilId && String(b.kanwilId) === String(selectedKanwil))
      );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Filter Section (Kanwil, UPT, Periode, Status, Search) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary text-xs font-bold border border-blue-200/60">
              Filter Data Tagihan
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Filter berdasarkan Kanwil, UPT, periode, dan status tagihan
            </span>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {billings.length} Tagihan Terdaftar
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mt-4">
          {/* Pencarian */}
          <div className="relative sm:col-span-2 lg:col-span-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari ID, UPT, Kanwil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter Kanwil */}
          <div className="lg:col-span-2">
            <select
              value={selectedKanwil}
              onChange={(e) => {
                setSelectedKanwil(e.target.value);
                setSelectedBranch('semua');
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-700"
            >
              <option value="semua">Semua Kanwil</option>
              {filterOptions.kanwils.map((k) => (
                <option key={k.id || k.name} value={k.name || k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter UPT */}
          <div className="lg:col-span-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-700"
            >
              <option value="semua">Semua UPT</option>
              {filteredBranches.map((b) => (
                <option key={b.id || b.branchId} value={b.id || b.branchId}>
                  {b.name || b.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Periode (Bulan & Tahun) - Ruang proporsional agar "Semua Bulan" tidak terpotong */}
          <div className="lg:col-span-3 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 min-w-[105px] bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="semua">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-slate-300 font-light">|</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-auto bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-700 shrink-0"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-700"
            >
              <option value="semua">Semua Status</option>
              <option value="PAID">Lunas (Sudah Dibayar)</option>
              <option value="PENDING_CONFIRMATION">Menunggu Verifikasi</option>
              <option value="UNPAID">Belum Dibayar</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Tabel Tagihan Semua UPT */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 font-bold bg-slate-50/80">
                <th className="py-3 px-4 w-[17%] min-w-[130px] whitespace-nowrap">No. Tagihan</th>
                <th className="py-3 px-4 w-[23%] min-w-[160px]">UPT</th>
                <th className="py-3 px-4 w-[18%] min-w-[140px]">Kanwil</th>
                <th className="py-3 px-4 w-[16%] min-w-[130px] text-right whitespace-nowrap">Omset Kotor</th>
                <th className="py-3 px-4 w-[10%] min-w-[85px] text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 w-[16%] min-w-[195px] text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-xs">Memuat daftar tagihan...</p>
                  </td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/80 flex items-center justify-center mx-auto mb-2">
                      <Receipt className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs sm:text-sm">Tidak ada tagihan yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba ubah kata kunci pencarian atau sesuaikan pilihan filter.
                    </p>
                  </td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. No. Tagihan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-primary">{b.id}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{MONTH_NAMES[b.month - 1]} {b.year}</span>
                      </div>
                    </td>

                    {/* 2. UPT */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 leading-snug">{b.branchName}</div>
                      {b.canteenName && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{b.canteenName}</div>
                      )}
                    </td>

                    {/* 3. Kanwil */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{b.kanwilName}</span>
                      </div>
                    </td>

                    {/* 4. Omset Kotor */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-black text-slate-800 text-xs sm:text-sm">
                        {formatRupiah(b.grossAmount)}
                      </div>
                      <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        Inkopasindo ({b.split3Way.inkopasindo}%): {formatRupiah(b.shares3Way.inkopasindo.amount)}
                      </div>
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {b.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Lunas
                        </span>
                      )}
                      {b.status === 'PENDING_CONFIRMATION' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Menunggu
                        </span>
                      )}
                      {b.status === 'UNPAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Belum Bayar
                        </span>
                      )}
                    </td>

                    {/* 6. Aksi: Detail & Unduh Invoice */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailModalItem(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail</span>
                        </button>

                        <button
                          type="button"
                          disabled={downloadingId === b.id}
                          onClick={() => handleDownloadInvoice(b)}
                          title="Unduh Invoice PDF"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary text-xs font-bold transition-all cursor-pointer border border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingId === b.id ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span>Mengunduh...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh Invoice</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Modal Detail Tagihan (Menampilkan 60:30:10 & Label "Hanya Superadmin yang dapat mengubah") */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Detail Tagihan UPT
                  </h3>
                  <p className="text-xs text-slate-500">
                    No. {detailModalItem.id} • {MONTH_NAMES[detailModalItem.month - 1]} {detailModalItem.year}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Ringkasan UPT & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Nama UPT</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{detailModalItem.branchName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{detailModalItem.kanwilName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Status Pembayaran</span>
                  <div className="mt-1">
                    {detailModalItem.status === 'PAID' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Lunas / Sudah Dibayar
                      </span>
                    )}
                    {detailModalItem.status === 'PENDING_CONFIRMATION' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Menunggu Verifikasi Setoran
                      </span>
                    )}
                    {detailModalItem.status === 'UNPAID' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Belum Dibayar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Omset Kotor */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Total Omset Kotor</span>
                  <p className="text-2xl font-black text-blue-950 mt-1">
                    {formatRupiah(detailModalItem.grossAmount)}
                  </p>
                </div>
                <div className="text-right text-xs text-blue-800">
                  <span className="font-bold">Dasar Perhitungan</span>
                  <p className="text-[11px] text-blue-600">Panggilan Wartel WBP</p>
                </div>
              </div>

              {/* Section Pembagian Bagi Hasil 3 Pihak */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Pembagian Bagi Hasil 3 Pihak
                    </h4>
                    <p className="text-xs text-slate-500">
                      Vendor {detailModalItem.split3Way.vendor}% : UPT {detailModalItem.split3Way.upt}% : Inkopasindo {detailModalItem.split3Way.inkopasindo}%
                    </p>
                  </div>

                  {/* Label Kecil: Hanya Superadmin yang dapat mengubah */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Hanya Superadmin yang dapat mengubah
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* 1. Vendor 60% */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-900">1. Vendor (Sadewa)</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                          {detailModalItem.split3Way.vendor}%
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700/80 mt-0.5">Penyedia infrastruktur teknologi &amp; sistem</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-indigo-950">
                        {formatRupiah(detailModalItem.shares3Way.vendor.amount)}
                      </span>
                    </div>
                  </div>

                  {/* 2. UPT 30% */}
                  <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-900">2. UPT Pemasyarakatan</span>
                        <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white font-bold text-[10px]">
                          {detailModalItem.split3Way.upt}%
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-700/80 mt-0.5">Satuan kerja Lapas / Rutan daerah</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-sky-950">
                        {formatRupiah(detailModalItem.shares3Way.upt.amount)}
                      </span>
                    </div>
                  </div>

                  {/* 3. Inkopasindo 10% (Kuning Amber) */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-900">3. Koperasi Inkopasindo</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px]">
                          {detailModalItem.split3Way.inkopasindo}%
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">Induk Koperasi Pemasyarakatan Indonesia</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-950">
                        {formatRupiah(detailModalItem.shares3Way.inkopasindo.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                disabled={downloadingId === detailModalItem.id}
                onClick={() => handleDownloadInvoice(detailModalItem)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingId === detailModalItem.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh Invoice PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
