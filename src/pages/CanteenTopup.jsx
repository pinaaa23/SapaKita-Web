import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  TrendingUp,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit3,
  Power,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Check,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../utils/formatKantin';
import {
  PPN_RATE,
  getTopupSummary,
  getNominalSaldoList,
  createNominalSaldo,
  updateNominalSaldo,
  toggleNominalSaldoStatus,
  deleteNominalSaldo,
  getSuperadminTopupHistory,
} from '../services/canteenTopupService';
import { getBranches } from '../services/branchService';

export default function CanteenTopup() {
  // 1. State Summary
  const [summary, setSummary] = useState({
    totalSaldoTerjual: 0,
    totalPpn: 0,
    totalTopupCount: 0,
    totalPending: 0,
  });

  // 2. State Paket Nominal Saldo
  const [nominalList, setNominalList] = useState([]);
  const [isLoadingNominals, setIsLoadingNominals] = useState(true);

  // 3. State Riwayat Top Up
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchHistory, setSearchHistory] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [branchFilter, setBranchFilter] = useState('semua');
  const [branchOptions, setBranchOptions] = useState([]);

  // 4. Modal State untuk Nominal Saldo
  const [isNominalModalOpen, setIsNominalModalOpen] = useState(false);
  const [editingNominal, setEditingNominal] = useState(null);
  const [nominalInput, setNominalInput] = useState('');
  const [statusInput, setStatusInput] = useState('Aktif');
  const [nominalFormError, setNominalFormError] = useState('');

  // 5. Modal Konfirmasi & Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [nominalToDelete, setNominalToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Data
  useEffect(() => {
    loadSummaryData();
    loadNominalsData();
    loadBranchesList();
  }, []);

  useEffect(() => {
    loadHistoryData();
  }, [searchHistory, statusFilter, branchFilter]);

  const loadSummaryData = async () => {
    try {
      const data = await getTopupSummary();
      if (data) setSummary(data);
    } catch (err) {
      console.error('Gagal memuat ringkasan saldo:', err);
    }
  };

  const loadNominalsData = async () => {
    setIsLoadingNominals(true);
    try {
      const data = await getNominalSaldoList();
      setNominalList(data || []);
    } catch (err) {
      console.error('Gagal memuat daftar nominal:', err);
    } finally {
      setIsLoadingNominals(false);
    }
  };

  const loadBranchesList = async () => {
    try {
      const branches = await getBranches();
      if (Array.isArray(branches)) {
        setBranchOptions(branches);
      }
    } catch (err) {
      console.error('Gagal memuat cabang:', err);
    }
  };

  const loadHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getSuperadminTopupHistory({
        search: searchHistory,
        status: statusFilter,
        branchId: branchFilter,
      });
      setHistoryList(data || []);
    } catch (err) {
      console.error('Gagal memuat riwayat top up:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handlers untuk Nominal Saldo
  const handleOpenCreateNominal = () => {
    setEditingNominal(null);
    setNominalInput('');
    setStatusInput('Aktif');
    setNominalFormError('');
    setIsNominalModalOpen(true);
  };

  const handleOpenEditNominal = (item) => {
    setEditingNominal(item);
    setNominalInput(String(item.nominal));
    setStatusInput(item.status || 'Aktif');
    setNominalFormError('');
    setIsNominalModalOpen(true);
  };

  const handleSaveNominal = async (e) => {
    e.preventDefault();
    setNominalFormError('');

    const num = Number(nominalInput);
    if (!nominalInput || isNaN(num) || num <= 0) {
      setNominalFormError('Nominal saldo harus berupa angka lebih dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingNominal) {
        await updateNominalSaldo(editingNominal.id, {
          nominal: num,
          status: statusInput,
        });
        showToast(`Paket nominal ${formatRupiah(num)} berhasil diperbarui.`);
      } else {
        await createNominalSaldo({
          nominal: num,
          status: statusInput,
        });
        showToast(`Paket nominal ${formatRupiah(num)} berhasil ditambahkan.`);
      }
      setIsNominalModalOpen(false);
      loadNominalsData();
    } catch (err) {
      setNominalFormError(err.message || 'Gagal menyimpan nominal saldo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNominalStatus = async (item) => {
    setIsSubmitting(true);
    try {
      const updated = await toggleNominalSaldoStatus(item.id, item.status);
      showToast(
        `Nominal ${formatRupiah(item.nominal)} berhasil ${
          updated.status === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan'
        }.`
      );
      loadNominalsData();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteNominal = (item) => {
    setNominalToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDeleteNominal = async () => {
    if (!nominalToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteNominalSaldo(nominalToDelete.id);
      showToast(`Paket nominal ${formatRupiah(nominalToDelete.nominal)} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      loadNominalsData();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus paket nominal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TIGA KARTU RINGKASAN STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Kartu 1: Total Saldo Terjual */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Saldo Terjual
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {formatRupiah(summary.totalSaldoTerjual)}
            </div>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dari transaksi berhasil</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 2: Total PPN 11% */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total PPN ({Math.round(PPN_RATE * 100)}%)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {formatRupiah(summary.totalPpn)}
            </div>
            <span className="text-xs font-medium text-slate-400">
              Pajak pertambahan nilai kasir
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Kartu 3: Jumlah Top Up */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Jumlah Top Up
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {summary.totalTopupCount}{' '}
              <span className="text-sm font-semibold text-slate-400">Transaksi</span>
            </div>
            <span className="text-xs font-medium text-amber-600">
              {summary.totalPending} Menunggu konfirmasi
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. BAGIAN A: PAKET SALDO KANTIN (Daftar Nominal Dijual) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Paket Saldo Kantin</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar pilihan nominal saldo yang dapat dibeli oleh kasir operator kantin UPT.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateNominal}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Nominal</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Nominal Saldo</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">PPN (11%)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total Harga Bayar</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoadingNominals ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                      Memuat data nominal saldo...
                    </td>
                  </tr>
                ) : nominalList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      Belum ada paket nominal saldo yang didaftarkan.
                    </td>
                  </tr>
                ) : (
                  nominalList.map((item) => {
                    const isActive = item.status === 'Aktif' || item.isActive;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Nominal Saldo */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm block">
                                {formatRupiah(item.nominal)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Saldo Masuk ke Operator
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* PPN */}
                        <td className="py-4 px-4 sm:px-6 text-right font-medium text-slate-600">
                          {formatRupiah(item.ppn || Math.round(item.nominal * PPN_RATE))}
                        </td>

                        {/* Total Harga Bayar */}
                        <td className="py-4 px-4 sm:px-6 text-right font-black text-slate-900 text-sm">
                          {formatRupiah(
                            item.totalBayar || item.nominal + Math.round(item.nominal * PPN_RATE)
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditNominal(item)}
                              title="Edit Nominal"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Toggle Aktif / Nonaktif */}
                            <button
                              type="button"
                              onClick={() => handleToggleNominalStatus(item)}
                              title={isActive ? 'Nonaktifkan Nominal' : 'Aktifkan Nominal'}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                isActive
                                  ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                  : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Hapus */}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteNominal(item)}
                              title="Hapus Nominal"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. BAGIAN B: RIWAYAT TOP UP KANTIN NASIONAL */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Riwayat Top Up Kantin</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log seluruh transaksi pembelian saldo kantin oleh operator di berbagai cabang UPT Lapas.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID transaksi, nama cabang UPT, petugas..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchHistory && (
              <button
                onClick={() => setSearchHistory('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Cabang / UPT */}
            <div className="shrink-0">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer max-w-[200px]"
              >
                <option value="semua">Semua Cabang UPT</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
              >
                <option value="semua">Status: Semua</option>
                <option value="berhasil">Status: Berhasil</option>
                <option value="menunggu">Status: Menunggu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">ID Top Up</th>
                  <th className="py-3.5 px-4 sm:px-6">Waktu Transaksi</th>
                  <th className="py-3.5 px-4 sm:px-6">Cabang / UPT</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Nominal Saldo</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">PPN (11%)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total Bayar</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400 font-semibold">
                      Memuat riwayat transaksi...
                    </td>
                  </tr>
                ) : historyList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      <Clock className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p className="text-sm font-bold text-slate-700">Tidak ada riwayat transaksi</p>
                      <p className="text-xs text-slate-400">Coba ubah filter pencarian atau cabang UPT.</p>
                    </td>
                  </tr>
                ) : (
                  historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID Top Up */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-700">
                        {item.id}
                      </td>

                      {/* Waktu */}
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600 whitespace-nowrap">
                        {formatTanggal(item.tanggal)}
                      </td>

                      {/* Cabang */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-800">{item.branchName}</span>
                        </div>
                        {item.staffName && (
                          <span className="text-[10px] text-slate-400 block ml-5.5">
                            Oleh: {item.staffName}
                          </span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-extrabold text-slate-800">
                        {formatRupiah(item.nominal)}
                      </td>

                      {/* PPN */}
                      <td className="py-3.5 px-4 sm:px-6 text-right text-slate-500 font-medium">
                        {formatRupiah(item.ppn)}
                      </td>

                      {/* Total Bayar */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#1565C0]">
                        {formatRupiah(item.totalBayar)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            item.status === 'Berhasil'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}
                        >
                          {item.status === 'Berhasil' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT NOMINAL SALDO */}
      {isNominalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    {editingNominal ? 'Edit Nominal Saldo' : 'Tambah Nominal Baru'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pilihan paket saldo yang dapat dibeli kasir kantin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNominalModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSaveNominal} className="p-6 space-y-4">
              {nominalFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{nominalFormError}</span>
                </div>
              )}

              {/* Input Nominal Saldo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal Saldo (Rupiah) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50000"
                    step="50000"
                    placeholder="500000"
                    value={nominalInput}
                    onChange={(e) => setNominalInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                    Rp
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Jumlah saldo murni yang masuk ke akun kasir operator kantin.
                </p>
              </div>

              {/* Preview Kalkulasi PPN */}
              {Number(nominalInput) > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>PPN 11% Otomatis:</span>
                    <span className="font-semibold text-slate-700">
                      {formatRupiah(Math.round(Number(nominalInput) * PPN_RATE))}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5 border-t border-slate-200 text-sm">
                    <span className="text-slate-800">Total Harga Bayar:</span>
                    <span className="text-[#1565C0] font-black">
                      {formatRupiah(Number(nominalInput) + Math.round(Number(nominalInput) * PPN_RATE))}
                    </span>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Publikasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatusInput('Aktif')}
                    className={`py-2 px-3 rounded-xl border-2 text-center text-xs font-bold transition cursor-pointer ${
                      statusInput === 'Aktif'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Aktif (Dijual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusInput('Nonaktif')}
                    className={`py-2 px-3 rounded-xl border-2 text-center text-xs font-bold transition cursor-pointer ${
                      statusInput === 'Nonaktif'
                        ? 'border-slate-500 bg-slate-100 text-slate-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Nonaktif (Draft)
                  </button>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNominalModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingNominal ? 'Simpan Perubahan' : 'Tambah Nominal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS NOMINAL SALDO */}
      {isDeleteModalOpen && nominalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Hapus Paket Nominal?
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus paket nominal saldo{' '}
              <strong>{formatRupiah(nominalToDelete.nominal)}</strong>? Kasir kantin tidak akan dapat memilih paket ini lagi.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteNominal}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
