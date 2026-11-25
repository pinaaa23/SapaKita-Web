import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  X,
  Check,
  Calculator,
  RefreshCw,
  ShieldCheck,
  Globe,
  Wallet,
  QrCode,
  CreditCard,
  Upload,
  Info,
  Lock,
  Eye,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, normalizeRole } from '../../config/menuConfig';
import { API_BASE_URL } from '../../services/api';
import {
  getFinanceContracts,
  saveFinanceContract,
  getGlobalBillingSettings,
  updateGlobalBillingSettings,
  getFinancePaymentSettings,
  updateFinancePaymentSettings,
  formatRupiah,
} from '../../services/financeService';

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.includes(':9000') || url.includes('finance-settings') || url.includes('/payment-settings/qris-image')) {
    const queryString = url.includes('?') ? url.substring(url.indexOf('?')) : '';
    return `${API_BASE_URL}/api/finance/payment-settings/qris-image${queryString}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export default function FinanceContracts() {
  const { user } = useAuth();
  const userRole = normalizeRole(user?.role);
  const isSuperadmin = userRole === ROLES.SUPERADMIN;

  // Active Tab: 'contracts' | 'payment-settings'
  const [activeTab, setActiveTab] = useState('contracts');

  const [contracts, setContracts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalItem, setEditModalItem] = useState(null);

  // Global Billing Settings states (2-Way Split)
  const [globalSettings, setGlobalSettings] = useState({
    id: 'default',
    defaultRatePerSecond: 15,
    sharePlatformPercent: 50,
    sharePesantrenPercent: 50,
    totalBranches: 0,
    matchingBranches: 0,
  });
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalFormRate, setGlobalFormRate] = useState(15);
  const [applyToAllBranches, setApplyToAllBranches] = useState(true);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // Form states in single contract modal (2-Way Split)
  const [ratePerSecond, setRatePerSecond] = useState(15);
  const [platformPct, setPlatformPct] = useState(50);
  const [pesantrenPct, setPesantrenPct] = useState(50);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [simulationRevenue, setSimulationRevenue] = useState(10000000); // 10 juta
  const [toast, setToast] = useState(null);

  // Payment Settings States (Rekening & QRIS Platform)
  const [paymentSettings, setPaymentSettings] = useState({
    id: 'default',
    bankName: 'Bank Syariah Indonesia (BSI)',
    accountNumber: '711-22-3344556-0',
    accountHolder: 'PT SapaKita Solusi Pesantren',
    qrisImageUrl: null,
    qrisContent: null,
    instructions: 'Transfer tepat sesuai nominal tagihan bagi hasil dan unggah bukti transfer yang sah.',
    isActive: true,
    isBankActive: true,
    isQrisActive: true,
  });
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const fileInputRef = useRef(null);

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

  const loadGlobalSettings = async () => {
    try {
      const res = await getGlobalBillingSettings();
      if (res && typeof res.defaultRatePerSecond !== 'undefined') {
        setGlobalSettings({
          ...res,
          sharePlatformPercent: res.sharePlatformPercent ?? (res.shareVendorPercent ?? 50),
          sharePesantrenPercent: res.sharePesantrenPercent ?? (res.shareKoperasiPercent ?? 50),
        });
        setGlobalFormRate(res.defaultRatePerSecond);
      }
    } catch (err) {
      console.warn('[FinanceContracts] Gagal memuat pengaturan global:', err);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const res = await getFinancePaymentSettings();
      if (res) {
        setPaymentSettings({
          id: res.id || 'default',
          bankName: res.bankName || 'Bank Syariah Indonesia (BSI)',
          accountNumber: res.accountNumber || '711-22-3344556-0',
          accountHolder: res.accountHolder || 'PT SapaKita Solusi Pesantren',
          qrisImageUrl: res.qrisImageUrl || null,
          qrisContent: res.qrisContent || null,
          instructions: res.instructions || 'Transfer tepat sesuai nominal tagihan bagi hasil dan unggah bukti transfer yang sah.',
          isActive: res.isActive !== false,
          isBankActive: res.isBankActive !== false,
          isQrisActive: res.isQrisActive !== false,
        });
        setQrisPreview(res.qrisImageUrl || null);
      }
    } catch (err) {
      console.warn('[FinanceContracts] Gagal memuat payment settings:', err);
    }
  };

  useEffect(() => {
    loadContracts();
    loadGlobalSettings();
    loadPaymentSettings();
  }, []);

  const handleGlobalRateSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperadmin) {
      showToast('Hanya Superadmin yang berwenang mengubah tarif global!', 'error');
      return;
    }

    const rate = Number(globalFormRate);
    if (!globalFormRate || isNaN(rate) || rate <= 0) {
      showToast('Tarif harus berupa angka lebih besar dari 0!', 'error');
      return;
    }

    try {
      setIsSavingGlobal(true);
      const res = await updateGlobalBillingSettings({
        defaultRatePerSecond: rate,
        applyToAllBranches: applyToAllBranches,
      });

      showToast(
        applyToAllBranches
          ? `Tarif global berhasil diubah ke Rp ${rate}/detik dan diterapkan ke seluruh kampus pesantren!`
          : `Tarif acuan global berhasil diubah ke Rp ${rate}/detik.`
      );

      setGlobalSettings((prev) => ({ ...prev, ...(res || {}), defaultRatePerSecond: rate }));
      setShowGlobalModal(false);
      await loadContracts();
      await loadGlobalSettings();
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan perubahan tarif global', 'error');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const openEditModal = (contract) => {
    setEditModalItem(contract);
    setRatePerSecond(contract.ratePerSecond || 15);
    const split = contract.split || {};
    const plat = Number(split.platform ?? (split.vendor ?? 50));
    const pes = Number(split.pesantren ?? (split.koperasi ?? (100 - plat)));
    setPlatformPct(plat);
    setPesantrenPct(pes);
    setBankName(contract.bankName || 'Bank Syariah Indonesia (BSI)');
    setAccountNumber(contract.accountNumber || '');
    setAccountHolder(contract.accountHolder || '');
  };

  // Validasi total harus 100%
  const totalPercent = Number(platformPct || 0) + Number(pesantrenPct || 0);
  const isPercentValid = totalPercent === 100;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;

    if (!isSuperadmin) {
      showToast('Hanya Superadmin yang berwenang mengubah kontrak bagi hasil kampus pesantren!', 'error');
      return;
    }

    const parsedRate = Number(ratePerSecond);
    if (!ratePerSecond || isNaN(parsedRate) || parsedRate <= 0) {
      showToast('Tarif per detik harus berupa angka lebih besar dari 0!', 'error');
      return;
    }

    if (!isPercentValid) {
      showToast(`Total persentase harus tepat 100% (saat ini ${totalPercent}%). Harap sesuaikan!`, 'error');
      return;
    }

    try {
      await saveFinanceContract(editModalItem.branchId, {
        ratePerSecond: Number(ratePerSecond),
        split: {
          platform: Number(platformPct),
          pesantren: Number(pesantrenPct),
          vendor: Number(platformPct),
          koperasi: Number(pesantrenPct),
          kepalaUpt: 0,
          inkopasindo: 0,
        },
        bankName,
        accountNumber,
        accountHolder,
      });

      showToast(`Kontrak bagi hasil untuk ${editModalItem.branchName} berhasil disimpan.`);
      setEditModalItem(null);
      await loadContracts();
      await loadGlobalSettings();
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan kontrak', 'error');
    }
  };

  // Handle Save Payment Settings (Rekening & QRIS Platform)
  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    if (!isSuperadmin) {
      showToast('Hanya Superadmin yang berwenang mengubah rekening & QRIS!', 'error');
      return;
    }
    setPaymentError('');
    setPaymentSuccess(false);

    const isBankActive = paymentSettings.isBankActive !== false;
    const isQrisActive = paymentSettings.isQrisActive !== false;

    if (!isBankActive && !isQrisActive) {
      setPaymentError('Minimal satu metode pembayaran (Transfer Bank atau Scan QRIS) harus diaktifkan!');
      return;
    }

    if (isBankActive) {
      if (!paymentSettings.bankName?.trim()) {
        setPaymentError('Nama bank penerima wajib diisi');
        return;
      }
      if (!paymentSettings.accountNumber?.trim()) {
        setPaymentError('Nomor rekening penampung wajib diisi');
        return;
      }
      if (!paymentSettings.accountHolder?.trim()) {
        setPaymentError('Nama pemilik rekening wajib diisi');
        return;
      }
    }

    setIsSavingPayment(true);
    try {
      if (qrisFile) {
        const formData = new FormData();
        formData.append('bankName', (paymentSettings.bankName || '').trim());
        formData.append('accountNumber', (paymentSettings.accountNumber || '').trim());
        formData.append('accountHolder', (paymentSettings.accountHolder || '').trim());
        if (paymentSettings.instructions) formData.append('instructions', paymentSettings.instructions.trim());
        formData.append('isActive', String(paymentSettings.isActive !== false));
        formData.append('isBankActive', String(isBankActive));
        formData.append('isQrisActive', String(isQrisActive));
        formData.append('qrisFile', qrisFile);

        const saved = await updateFinancePaymentSettings(formData);
        const cacheBuster = Date.now();
        const updatedQrisUrl = saved?.qrisImageUrl || `/api/finance/payment-settings/qris-image?v=${cacheBuster}`;
        setPaymentSettings(prev => ({ ...prev, qrisImageUrl: updatedQrisUrl, isBankActive, isQrisActive }));
        setQrisPreview(updatedQrisUrl);
        setQrisFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const isRemove = !paymentSettings.qrisImageUrl;
        const saved = await updateFinancePaymentSettings({
          bankName: (paymentSettings.bankName || '').trim(),
          accountNumber: (paymentSettings.accountNumber || '').trim(),
          accountHolder: (paymentSettings.accountHolder || '').trim(),
          qrisImageUrl: isRemove ? null : paymentSettings.qrisImageUrl,
          instructions: (paymentSettings.instructions || '').trim(),
          isActive: paymentSettings.isActive !== false,
          isBankActive,
          isQrisActive,
        });

        setPaymentSettings(prev => ({
          ...prev,
          bankName: saved?.bankName || paymentSettings.bankName,
          accountNumber: saved?.accountNumber || paymentSettings.accountNumber,
          accountHolder: saved?.accountHolder || paymentSettings.accountHolder,
          instructions: saved?.instructions ?? paymentSettings.instructions,
          qrisImageUrl: isRemove ? null : (saved?.qrisImageUrl || paymentSettings.qrisImageUrl),
          isBankActive,
          isQrisActive,
        }));
        if (isRemove) setQrisPreview(null);
      }

      setPaymentSuccess(true);
      showToast('Pengaturan rekening penampung & QRIS berhasil disimpan.');
      setTimeout(() => setPaymentSuccess(false), 5000);
    } catch (err) {
      setPaymentError(err?.message || 'Gagal menyimpan pengaturan rekening');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPaymentError('Format berkas harus berupa gambar (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPaymentError('Ukuran gambar maksimal 5MB');
      return;
    }

    setPaymentError('');
    setQrisFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setQrisPreview(localPreviewUrl);
  };

  const handleRemoveQris = () => {
    setQrisFile(null);
    setQrisPreview(null);
    setPaymentSettings((prev) => ({ ...prev, qrisImageUrl: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredContracts = contracts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.branchName || '').toLowerCase().includes(q) ||
      (c.canteenName || '').toLowerCase().includes(q) ||
      (c.kanwilName || '').toLowerCase().includes(q)
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

      {/* Tab Switcher Utama */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'contracts'
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Tarif &amp; Kontrak Bagi Hasil Pesantren</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment-settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payment-settings'
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Rekening Penampung &amp; QRIS Platform</span>
          {isSuperadmin ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-400 text-slate-950 font-black">
              Kelola
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-bold border border-slate-200">
              Pantau
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: TARIF & KONTRAK BAGI HASIL KAMPUS PESANTREN
          ========================================================================= */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          {/* 1. Banner Formula Resmi 2 Pihak */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D7A73] via-[#14968C] to-[#1E5D88] p-4 sm:p-5 text-white shadow-xs">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/3 bottom-0 -mb-8 w-48 h-48 rounded-full bg-teal-300/10 blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Model Bisnis SapaKita Terpadu</span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Formula Resmi Bagi Hasil 2 Pihak (Platform SapaKita 50%, Pesantren 50%)
                </h2>
                <p className="text-teal-50 text-xs leading-relaxed">
                  Sistem bagi hasil transparan langsung antara penyedia Platform SapaKita dan Pondok Pesantren/Kopontren. Bebas potongan pihak ketiga, perhitungan otomatis berbasis detik panggilan riil.
                </p>
              </div>

              {/* Quick Cards 2 Pihak */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center min-w-[120px]">
                  <span className="text-[10px] text-teal-100 block font-semibold uppercase tracking-wider">1. Platform SapaKita</span>
                  <span className="text-2xl font-black text-white mt-0.5 block">{globalSettings?.sharePlatformPercent ?? 50}%</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center min-w-[120px]">
                  <span className="text-[10px] text-amber-200 block font-semibold uppercase tracking-wider">2. Pesantren / Kopontren</span>
                  <span className="text-2xl font-black text-white mt-0.5 block">{globalSettings?.sharePesantrenPercent ?? 50}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Pengaturan Tarif Global Nasional Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <Globe className="w-3.5 h-3.5" />
                  Tarif Acuan Global SapaKita
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isSuperadmin ? '(Superadmin Akses Penuh)' : '(Mode Pantau Finance)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Pengaturan Tarif Panggilan Global Nasional
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Tarif dasar sistem yang menjadi rujukan kalkulasi panggilan baru di seluruh kampus pondok pesantren secara nasional. {isSuperadmin ? 'Anda dapat mengubah tarif acuan ini dan menerapkannya serentak ke seluruh kampus.' : 'Role Finance berwenang memantau tarif dasar ini secara real-time.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[170px]">
                <span className="text-[11px] text-slate-300 block font-semibold uppercase tracking-wider">
                  Tarif Acuan Saat Ini
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-amber-400">
                    Rp {globalSettings?.defaultRatePerSecond ?? 15}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">/ detik</span>
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-300 font-bold">
                  Rp {((globalSettings?.defaultRatePerSecond ?? 15) * 60).toLocaleString('id-ID')} / menit
                </div>
                {globalSettings?.totalBranches > 0 && (
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {globalSettings.matchingBranches} dari {globalSettings.totalBranches} Kampus bersesuaian
                  </span>
                )}
              </div>

              {isSuperadmin && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalFormRate(globalSettings?.defaultRatePerSecond ?? 15);
                    setApplyToAllBranches(true);
                    setShowGlobalModal(true);
                  }}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Ubah Tarif Global</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Tabel Kontrak per Kampus Pesantren */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Kontrak &amp; Pembagian Hasil per Kampus
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap kampus pesantren memiliki konfigurasi tarif dan rekening kopontren resmi untuk pelunasan tagihan.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari kampus, kopontren, yayasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Kampus Pesantren</th>
                    <th className="py-3 px-3">Kopontren</th>
                    <th className="py-3 px-3">Tarif / Detik</th>
                    <th className="py-3 px-3 text-center">Platform SapaKita</th>
                    <th className="py-3 px-3 text-center">Pesantren / Kopontren</th>
                    <th className="py-3 px-3 text-center">Total</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        Tidak ada data kontrak kampus pesantren yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => {
                      const s = c.split || {};
                      const plat = Number(s.platform ?? (s.vendor ?? 50));
                      const pes = Number(s.pesantren ?? (s.koperasi ?? (100 - plat)));
                      const total = plat + pes;
                      const isMatchingGlobal = Number(c.ratePerSecond) === Number(globalSettings?.defaultRatePerSecond);

                      return (
                        <tr key={c.branchId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{c.branchName}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{c.kanwilName || 'Yayasan'}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-700">{c.canteenName || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {c.bankName ? `${c.bankName} - ${c.accountNumber || ''}` : '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <span>Rp {c.ratePerSecond ?? 15}</span>
                              <span className="text-[10px] font-semibold text-slate-400">/ dtk</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  isMatchingGlobal
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {isMatchingGlobal ? 'Global' : 'Kustom'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                              (Rp {((Number(c.ratePerSecond) || 15) * 60).toLocaleString('id-ID')} / mnt)
                            </span>
                          </td>

                          {/* 1. Platform SapaKita */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-extrabold text-xs shadow-2xs">
                              {plat}%
                            </span>
                          </td>

                          {/* 2. Pesantren / Kopontren */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs shadow-2xs">
                              {pes}%
                            </span>
                          </td>

                          {/* Total % */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg font-black text-xs shadow-2xs ${
                              total === 100
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {total}%
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isSuperadmin ? (
                              <button
                                onClick={() => openEditModal(c)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-primary text-xs font-bold transition shadow-2xs cursor-pointer border border-teal-200/60"
                                title="Ubah persentase & tarif kontrak kampus ini"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Ubah Persentase</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openEditModal(c)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer border border-slate-200"
                                title="Lihat rincian persentase & tarif kontrak"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Lihat Rincian</span>
                              </button>
                            )}
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
      )}

      {/* =========================================================================
          TAB 2: REKENING PENAMPUNG & QRIS PLATFORM
          ========================================================================= */}
      {activeTab === 'payment-settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 via-cyan-50/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan Rekening Penampung &amp; QRIS Platform SapaKita
                  </h3>
                  {isSuperadmin ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                      Otomatis Sinkron ke Kasir Kopontren
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                      Mode Pantau (Hanya Lihat)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekening penampung dan barcode QRIS resmi yang digunakan oleh kopontren saat menyetor porsi bagi hasil platform.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {isSuperadmin ? (
              <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Pengaturan Terpusat oleh Super Administrator</p>
                  <p className="text-[11px] text-teal-800/90 leading-relaxed">
                    Setiap perubahan nomor rekening atau barcode QRIS di bawah ini akan langsung tersinkronisasi otomatis ke aplikasi kopontren di seluruh kampus pesantren.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Mode Pantau: Pengaturan Dikelola Terpusat oleh Superadmin</p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Sebagai Admin Keuangan Platform, Anda memiliki hak akses memantau konfigurasi rekening penampung dan barcode QRIS aktif untuk rekonsiliasi setoran.
                  </p>
                </div>
              </div>
            )}

            {paymentSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Pengaturan Rekening Berhasil Disimpan &amp; Tersinkronisasi!</p>
                  <p className="text-[11px] text-emerald-700">Aplikasi kopontren kini akan otomatis memuat nomor rekening dan barcode QRIS terbaru ini.</p>
                </div>
              </div>
            )}

            {paymentError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Kolom Kiri: Input Data Rekening */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nama Bank Penampung <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={paymentSettings.bankName}
                        onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, bankName: e.target.value }))}
                        disabled={!isSuperadmin}
                        readOnly={!isSuperadmin}
                        placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-xs font-semibold shadow-2xs ${
                          isSuperadmin
                            ? 'border-slate-200 text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nomor Rekening Penampung <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.accountNumber}
                      onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, accountNumber: e.target.value }))}
                      disabled={!isSuperadmin}
                      readOnly={!isSuperadmin}
                      placeholder="Contoh: 711-22-3344556-0"
                      className={`w-full px-3 py-2.5 border rounded-xl text-xs font-mono font-bold shadow-2xs ${
                        isSuperadmin
                          ? 'border-slate-200 text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                      }`}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Atas Nama Rekening <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.accountHolder}
                      onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, accountHolder: e.target.value }))}
                      disabled={!isSuperadmin}
                      readOnly={!isSuperadmin}
                      placeholder="Contoh: PT SapaKita Solusi Pesantren"
                      className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold shadow-2xs ${
                        isSuperadmin
                          ? 'border-slate-200 text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                      }`}
                      required
                    />
                  </div>

                  <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/80">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isBankActive !== false}
                        onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, isBankActive: e.target.checked }))}
                        disabled={!isSuperadmin}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Aktifkan Metode Pembayaran Transfer Rekening Bank
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Kopontren dapat memilih transfer rekening bank penampung resmi ini saat menyetor bagi hasil.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Kolom Kanan: Upload QRIS & Instruksi */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Barcode Gambar QRIS Penampung
                    </label>
                    
                    {isSuperadmin && (
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-4">
                      {qrisPreview ? (
                        <div className="relative group shrink-0">
                          <img
                            src={resolveImageUrl(qrisPreview)}
                            alt="QRIS Barcode"
                            className="w-20 h-20 object-contain bg-white p-1 rounded-xl border border-slate-200 shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <QrCode className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[9px] font-semibold">Belum Ada</span>
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        {isSuperadmin ? (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-primary border border-teal-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{qrisPreview ? 'Ganti Barcode QRIS...' : 'Unggah Barcode QRIS...'}</span>
                              </button>

                              {qrisPreview && (
                                <button
                                  type="button"
                                  onClick={handleRemoveQris}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Hapus gambar barcode QRIS"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Barcode</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Format PNG / JPG, maksimal 5MB. Barcode akan otomatis muncul saat kopontren memilih metode bayar QRIS.
                            </p>
                          </>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Barcode QRIS Aktif</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {qrisPreview ? 'Barcode aktif tersinkronisasi di seluruh kopontren.' : 'Belum ada barcode QRIS diunggah.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200/80">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isQrisActive !== false}
                        onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, isQrisActive: e.target.checked }))}
                        disabled={!isSuperadmin}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Aktifkan Metode Pembayaran Scan QRIS Resmi
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Kopontren dapat memilih dan memindai barcode QRIS resmi ini saat menyetor bagi hasil platform.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Petunjuk Pembayaran untuk Petugas Kopontren
                    </label>
                    <textarea
                      rows="3"
                      value={paymentSettings.instructions || ''}
                      onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, instructions: e.target.value }))}
                      disabled={!isSuperadmin}
                      readOnly={!isSuperadmin}
                      placeholder="Instruksi transfer dan konfirmasi..."
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium shadow-2xs resize-none ${
                        isSuperadmin
                          ? 'border-slate-200 text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isSuperadmin && (
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Simpan Pengaturan Pembayaran</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL UBAH TARIF GLOBAL NASIONAL
          ========================================================================= */}
      {showGlobalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Ubah Tarif Panggilan Global</h3>
                  <p className="text-[11px] text-slate-400">Atur tarif acuan default sistem SapaKita secara nasional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGlobalRateSubmit} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tarif Baru per Detik (Rupiah) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={globalFormRate}
                    onChange={(e) => setGlobalFormRate(e.target.value)}
                    className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="15"
                    required
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    / detik
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Setara dengan <strong>Rp {((Number(globalFormRate) || 0) * 60).toLocaleString('id-ID')} / menit</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAllBranches}
                    onChange={(e) => setApplyToAllBranches(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      Terapkan juga tarif ini ke seluruh Kampus Pesantren aktif saat ini
                    </span>
                    <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                      {applyToAllBranches
                        ? 'Seluruh data kampus dan kontrak aktif akan otomatis diperbarui ke tarif ini.'
                        : 'Tarif hanya akan disimpan sebagai default acuan global baru untuk pendaftaran kampus baru.'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGlobalModal(false)}
                  disabled={isSavingGlobal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingGlobal}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingGlobal ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan Tarif</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETAIL / EDIT KONTRAK & PERSENTASE BAGI HASIL 2 PIHAK
          ========================================================================= */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200/90 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-primary">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      {isSuperadmin ? 'Ubah Kontrak & Bagi Hasil Kampus' : 'Rincian Kontrak Bagi Hasil Kampus'}
                    </h3>
                    {!isSuperadmin && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Mode Pantau
                      </span>
                    )}
                  </div>
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

            <form onSubmit={handleSave} className="py-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              {/* Tarif & Rekening */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tarif per Detik (Rupiah)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={ratePerSecond}
                    onChange={(e) => isSuperadmin && setRatePerSecond(e.target.value)}
                    disabled={!isSuperadmin}
                    className={`w-full px-3 py-2 rounded-xl border font-bold text-slate-800 ${
                      isSuperadmin
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Setara Rp {((Number(ratePerSecond) || 0) * 60).toLocaleString('id-ID')} / menit
                  </span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank Penampung Kopontren</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => isSuperadmin && setBankName(e.target.value)}
                    disabled={!isSuperadmin}
                    className={`w-full px-3 py-2 rounded-xl border text-slate-800 ${
                      isSuperadmin
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nomor Rekening Kopontren</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => isSuperadmin && setAccountNumber(e.target.value)}
                    disabled={!isSuperadmin}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-slate-800 ${
                      isSuperadmin
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Atas Nama Rekening</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => isSuperadmin && setAccountHolder(e.target.value)}
                    disabled={!isSuperadmin}
                    className={`w-full px-3 py-2 rounded-xl border text-slate-800 ${
                      isSuperadmin
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Pembagian Hasil 2 Pihak */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Rincian Alokasi Bagi Hasil (2 Pihak)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Skema kemitraan Platform SapaKita dan Pesantren
                    </span>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    isPercentValid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    Total: {totalPercent}% / 100%
                  </div>
                </div>

                {/* Segmented Visual Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div 
                    style={{ width: `${platformPct}%` }} 
                    className="bg-primary h-full transition-all duration-300" 
                    title={`Platform SapaKita: ${platformPct}%`} 
                  />
                  <div 
                    style={{ width: `${pesantrenPct}%` }} 
                    className="bg-amber-500 h-full transition-all duration-300" 
                    title={`Pesantren: ${pesantrenPct}%`} 
                  />
                </div>

                {/* 2 Cards Alokasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* 1. Platform SapaKita */}
                  <div className="bg-white p-3.5 rounded-2xl border border-teal-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-teal-900 font-bold text-[11px]">1. Platform SapaKita</label>
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">Penyedia Sistem</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={platformPct}
                        onChange={(e) => {
                          if (!isSuperadmin) return;
                          const val = Math.min(100, Math.max(0, Number(e.target.value)));
                          setPlatformPct(val);
                          setPesantrenPct(100 - val);
                        }}
                        disabled={!isSuperadmin}
                        className="w-full pr-7 pl-3 py-2 rounded-xl border border-slate-200 font-extrabold text-teal-950 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-50 disabled:cursor-not-allowed"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 2. Pesantren / Kopontren */}
                  <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-amber-900 font-bold text-[11px]">2. Pesantren / Kopontren</label>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Pengelola Kampus</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pesantrenPct}
                        onChange={(e) => {
                          if (!isSuperadmin) return;
                          const val = Math.min(100, Math.max(0, Number(e.target.value)));
                          setPesantrenPct(val);
                          setPlatformPct(100 - val);
                        }}
                        disabled={!isSuperadmin}
                        className="w-full pr-7 pl-3 py-2 rounded-xl border border-slate-200 font-extrabold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {isSuperadmin && (
                  !isPercentValid ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Jumlah total persentase saat ini <strong>{totalPercent}%</strong>. Mohon sesuaikan agar tepat <strong>100%</strong>.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Total persentase valid (100%). Skema 2 pihak siap diterapkan.</span>
                    </div>
                  )
                )}
              </div>

              {/* Live Simulator Bagi Hasil 2 Pihak */}
              <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
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
                      onChange={(e) => setSimulationRevenue(e.target.value)}
                      className="w-32 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-teal-100">
                    <span className="text-teal-800 font-semibold block text-[11px]">1. Platform SapaKita ({platformPct}%):</span>
                    <span className="font-black text-teal-950 text-base mt-0.5 block">
                      {formatRupiah(((Number(simulationRevenue) || 0) * (Number(platformPct) || 0)) / 100)}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-100">
                    <span className="text-amber-800 font-semibold block text-[11px]">2. Pesantren / Kopontren ({pesantrenPct}%):</span>
                    <span className="font-black text-amber-950 text-base mt-0.5 block">
                      {formatRupiah(((Number(simulationRevenue) || 0) * (Number(pesantrenPct) || 0)) / 100)}
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
                  {isSuperadmin ? 'Batal' : 'Tutup'}
                </button>
                {isSuperadmin && (
                  <button
                    type="submit"
                    disabled={!isPercentValid}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Kontrak Bagi Hasil</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}