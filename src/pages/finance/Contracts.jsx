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
  Landmark,
  ShieldCheck,
  Globe,
  Wallet,
  QrCode,
  CreditCard,
  Upload,
  Info,
  Lock,
  Eye,
  FileText,
  Sparkles,
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
  DEFAULT_REVENUE_SPLIT,
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

  // Global Billing Settings states
  const [globalSettings, setGlobalSettings] = useState({
    id: 'default',
    defaultRatePerSecond: 15,
    shareKepalaUptPercent: 0,
    shareKoperasiPercent: 30,
    shareInkopasindoPercent: 10,
    shareVendorPercent: 60,
    totalBranches: 0,
    matchingBranches: 0,
  });
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalFormRate, setGlobalFormRate] = useState(15);
  const [applyToAllBranches, setApplyToAllBranches] = useState(true);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

  // Form states in single contract modal
  const [ratePerSecond, setRatePerSecond] = useState(50);
  const [kepalaUptPct, setKepalaUptPct] = useState(5);
  const [koperasiPct, setKoperasiPct] = useState(30);
  const [inkopasindoPct, setInkopasindoPct] = useState(10);
  const [vendorPct, setVendorPct] = useState(60);
  const [hasKepalaUpt, setHasKepalaUpt] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [simulationRevenue, setSimulationRevenue] = useState(10000000); // 10 juta
  const [toast, setToast] = useState(null);

  // Payment Settings States (Rekening & QRIS)
  const [paymentSettings, setPaymentSettings] = useState({
    id: 'default',
    bankName: 'Bank Mandiri',
    accountNumber: '168-00-9988112-7',
    accountHolder: 'PT Station Technology',
    qrisImageUrl: null,
    qrisContent: null,
    instructions: 'Transfer tepat sesuai nominal tagihan dan unggah bukti transfer yang sah.',
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
      setIsLoadingGlobal(true);
      const res = await getGlobalBillingSettings();
      if (res && typeof res.defaultRatePerSecond !== 'undefined') {
        setGlobalSettings(res);
        setGlobalFormRate(res.defaultRatePerSecond);
      }
    } catch (err) {
      console.warn('[FinanceContracts] Gagal memuat pengaturan global:', err);
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const res = await getFinancePaymentSettings();
      if (res) {
        setPaymentSettings({
          ...res,
          isBankActive: res.isBankActive !== false,
          isQrisActive: res.isQrisActive !== false,
        });
        if (res.qrisImageUrl) setQrisPreview(res.qrisImageUrl);
      }
    } catch (err) {
      console.warn('[FinanceContracts] Gagal memuat payment settings:', err);
    }
  };

  useEffect(() => {
    loadContracts();
    loadGlobalSettings();
    loadPaymentSettings();

    const handleGlobalUpdate = (e) => {
      if (e?.detail) setGlobalSettings((prev) => ({ ...prev, ...e.detail }));
    };
    const handlePaymentUpdate = (e) => {
      if (e?.detail) {
        setPaymentSettings(e.detail);
        if (e.detail.qrisImageUrl) setQrisPreview(e.detail.qrisImageUrl);
      }
    };
    window.addEventListener('finance_global_settings_updated', handleGlobalUpdate);
    window.addEventListener('finance_payment_settings_updated', handlePaymentUpdate);
    return () => {
      window.removeEventListener('finance_global_settings_updated', handleGlobalUpdate);
      window.removeEventListener('finance_payment_settings_updated', handlePaymentUpdate);
    };
  }, []);

  const openGlobalModal = () => {
    if (!isSuperadmin) return;
    setGlobalFormRate(globalSettings?.defaultRatePerSecond || 15);
    setApplyToAllBranches(true);
    setShowGlobalModal(true);
  };

  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    if (!isSuperadmin) {
      showToast('Hanya Superadmin yang berwenang mengubah tarif global!', 'error');
      return;
    }
    const rate = Number(globalFormRate);
    if (!globalFormRate || isNaN(rate) || rate <= 0) {
      showToast('Tarif per detik harus berupa angka lebih besar dari 0!', 'error');
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
          ? `Tarif global berhasil diubah ke Rp ${rate}/detik dan diterapkan ke seluruh Lapas!`
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
    const kuVal = Number(contract.split?.kepalaUpt ?? 0);
    const isKu = kuVal > 0;
    setHasKepalaUpt(isKu);
    setKepalaUptPct(kuVal);
    setKoperasiPct(contract.split?.koperasi ?? 30);
    setInkopasindoPct(contract.split?.inkopasindo ?? 10);
    setVendorPct(contract.split?.vendor ?? (isKu ? 55 : 60));
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

    if (!isSuperadmin) {
      showToast('Hanya Superadmin yang berwenang mengubah kontrak bagi hasil UPT!', 'error');
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
      await loadContracts();
      await loadGlobalSettings();
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan kontrak', 'error');
    }
  };

  // Handle Save Payment Settings (Rekening & QRIS)
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
          instructions: paymentSettings.instructions?.trim() || null,
          isActive: paymentSettings.isActive !== false,
          isBankActive,
          isQrisActive,
          removeQris: isRemove,
        });
        if (isRemove) {
          setQrisPreview(null);
          setPaymentSettings(prev => ({ ...prev, qrisImageUrl: null }));
        } else if (saved?.qrisImageUrl) {
          setPaymentSettings(prev => ({ ...prev, qrisImageUrl: saved.qrisImageUrl, isBankActive, isQrisActive }));
          setQrisPreview(saved.qrisImageUrl);
        }
      }
      setPaymentSuccess(true);
      showToast('Pengaturan rekening & QRIS berhasil disimpan dan tersinkronisasi ke kasir kantin!');
      setTimeout(() => setPaymentSuccess(false), 3500);
    } catch (err) {
      console.error('[FinanceContracts] Gagal menyimpan payment settings:', err);
      setPaymentError(err?.message || 'Gagal menyimpan pengaturan pembayaran');
      showToast(err?.message || 'Gagal menyimpan pengaturan pembayaran', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPaymentError('File harus berupa gambar (PNG, JPG, JPEG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPaymentError('Ukuran file maksimal 5MB');
        return;
      }
      setQrisFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setQrisPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
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
          <span>Tarif &amp; Kontrak Bagi Hasil UPT</span>
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
          <span>Rekening Penampung &amp; QRIS Kantin</span>
          {isSuperadmin ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black">
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
          TAB 1: TARIF & KONTRAK BAGI HASIL UPT
          ========================================================================= */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          {/* 1. Banner Formula Resmi 4 Pihak */}
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
                  Formula Resmi 3 Bagian (Inkopasindo 10%, UPT 30%, Vendor 60%)
                </h2>
                <p className="text-blue-100/90 text-xs leading-relaxed">
                  Skema pembagian resmi: Inkopasindo 10%, UPT 30%, dan Vendor 60%. Jika UPT tertentu menyertakan porsi Kepala UPT (5%), maka porsi tersebut dialokasikan dari hak 60% Vendor (Vendor 55% + Kepala UPT 5%).
                </p>
              </div>

              {/* Quick Cards 3 Pihak + Opsional Kepala UPT */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
                  <span className="text-[10px] text-amber-200 block font-semibold uppercase tracking-wider">1. Inkopasindo</span>
                  <span className="text-lg font-black text-white mt-0.5 block">{globalSettings?.shareInkopasindoPercent ?? 10}%</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
                  <span className="text-[10px] text-sky-200 block font-semibold uppercase tracking-wider">2. UPT</span>
                  <span className="text-lg font-black text-white mt-0.5 block">{globalSettings?.shareKoperasiPercent ?? 30}%</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
                  <span className="text-[10px] text-indigo-200 block font-semibold uppercase tracking-wider">3. Vendor</span>
                  <span className="text-lg font-black text-white mt-0.5 block">{globalSettings?.shareVendorPercent ?? 60}%</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/20 text-center min-w-[90px]">
                  <span className="text-[10px] text-purple-200 block font-semibold uppercase tracking-wider">Kepala UPT</span>
                  <span className="text-lg font-black text-white mt-0.5 block">5% <span className="text-[9px] block font-normal text-purple-200">(Opsional Vendor)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Pengaturan Tarif Global Nasional Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <Globe className="w-3.5 h-3.5" />
                  Tarif Acuan Global Sadewa
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isSuperadmin ? '(Superadmin Akses Penuh)' : '(Mode Pantau Finance)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Pengaturan Tarif Panggilan Global Nasional
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Tarif dasar sistem yang menjadi rujukan kalkulasi panggilan baru di seluruh Lapas/UPT secara nasional. {isSuperadmin ? 'Anda dapat mengubah tarif acuan ini dan menerapkannya serentak ke seluruh Lapas.' : 'Role Finance berwenang memantau tarif dasar ini secara real-time.'}
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
                    {globalSettings.matchingBranches} dari {globalSettings.totalBranches} UPT bersesuaian
                  </span>
                )}
              </div>

              {isSuperadmin ? (
                <button
                  type="button"
                  onClick={openGlobalModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Sliders className="w-4 h-4 text-slate-950" />
                  <span>Ubah Tarif Global</span>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white/10 border border-white/15 text-slate-300 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dikelola Superadmin</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Tabel Kontrak UPT & Pencarian */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Kontrak &amp; Pengaturan Tarif UPT
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSuperadmin
                    ? 'Kelola persentase bagi hasil, tarif per detik, dan rekening penampung masing-masing cabang.'
                    : 'Pantau persentase bagi hasil, tarif per detik, dan rekening penampung masing-masing cabang.'}
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
              <table className="w-full text-left text-xs md:text-sm min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/90">
                    <th className="py-3.5 px-4 rounded-l-xl">Nama UPT &amp; Wilayah</th>
                    <th className="py-3.5 px-4">Pengelola &amp; Rekening</th>
                    <th className="py-3.5 px-4 text-center">Tarif Panggilan</th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-amber-900">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        Inkopasindo
                      </span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-sky-900">
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                        UPT
                      </span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-indigo-900">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                        Vendor
                      </span>
                    </th>
                    <th className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-purple-900">
                        <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                        Kepala UPT
                      </span>
                    </th>
                    <th className="py-3.5 px-3 text-center">Total</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Aksi</th>
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
                            className="text-xs text-primary font-bold hover:underline mt-1 cursor-pointer"
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
                      const isMatchingGlobal = Number(c.ratePerSecond) === Number(globalSettings?.defaultRatePerSecond);

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
                              <span>{c.bankName || '-'} - {c.accountNumber || '-'}</span>
                            </div>
                          </td>

                          {/* Tarif Panggilan */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  Rp {Number(c.ratePerSecond || 0).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">/dtk</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                    isMatchingGlobal
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                  title={isMatchingGlobal ? 'Menggunakan tarif acuan global' : 'Tarif khusus cabang ini'}
                                >
                                  {isMatchingGlobal ? 'Global' : 'Kustom'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium mt-1">
                                (Rp {((Number(c.ratePerSecond) || 0) * 60).toLocaleString('id-ID')} / mnt)
                              </span>
                            </div>
                          </td>

                          {/* 1. Inkopasindo */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-xs shadow-2xs">
                                {s.inkopasindo}%
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 mt-1">
                                Pusat
                              </span>
                            </div>
                          </td>

                          {/* 2. UPT */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-extrabold text-xs shadow-2xs">
                                {s.koperasi}%
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 mt-1">
                                Koperasi
                              </span>
                            </div>
                          </td>

                          {/* 3. Vendor */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-xs shadow-2xs">
                                {s.vendor}%
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 mt-1">
                                {s.kepalaUpt > 0 ? 'Bersih (60%-5%)' : 'Utuh 60%'}
                              </span>
                            </div>
                          </td>

                          {/* 4. Kepala UPT */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {s.kepalaUpt > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-xs shadow-2xs"
                                  title="Alokasi 5% Kepala UPT diambil dari bagian 60% Vendor"
                                >
                                  {s.kepalaUpt}%
                                </span>
                                <span className="text-[10px] font-semibold text-purple-600 mt-1 whitespace-nowrap">
                                  dari Vendor
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-200/80 font-semibold text-xs"
                                  title="Tidak ada alokasi Kepala UPT (Standar 3 Pihak)"
                                >
                                  0%
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 mt-1">
                                  Nonaktif
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Total % */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-flex items-center justify-center min-w-[54px] px-2.5 py-1 rounded-lg font-black text-xs shadow-2xs ${
                                total === 100
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {total}%
                              </span>
                              <span className={`text-[10px] font-medium mt-1 ${
                                total === 100 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'
                              }`}>
                                {total === 100 ? 'Valid' : 'Periksa'}
                              </span>
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isSuperadmin ? (
                              <button
                                onClick={() => openEditModal(c)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary text-xs font-bold transition shadow-2xs cursor-pointer border border-blue-200/60 hover:border-blue-300"
                                title="Ubah persentase & tarif kontrak UPT ini"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Ubah Persentase</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openEditModal(c)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer border border-slate-200"
                                title="Lihat rincian persentase & tarif kontrak UPT ini"
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
          TAB 2: REKENING PENAMPUNG & QRIS KANTIN
          ========================================================================= */}
      {activeTab === 'payment-settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header Tab 2 */}
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan Rekening Penampung &amp; QRIS Kantin
                  </h3>
                  {isSuperadmin ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                      Otomatis Sinkron ke Kasir
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                      Mode Pantau (Hanya Lihat)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekening penampung dan barcode QRIS resmi yang digunakan oleh petugas kantin saat setor tagihan atau top up saldo.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Banner Penjelasan Role */}
            {isSuperadmin ? (
              <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Pengaturan Terpusat oleh Super Administrator</p>
                  <p className="text-[11px] text-blue-800/90 leading-relaxed">
                    Setiap perubahan nomor rekening atau unggahan gambar QRIS di bawah ini akan langsung tersinkronisasi otomatis ke aplikasi kasir kantin di seluruh Lapas/Rutan secara nasional.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Mode Pantau: Pengaturan Dikelola Terpusat oleh Superadmin</p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Sebagai Admin Finance, Anda memiliki hak akses melihat konfigurasi rekening dan barcode QRIS aktif untuk keperluan rekonsiliasi setoran. Pengubahan data rekening hanya dapat dilakukan oleh Superadmin.
                  </p>
                </div>
              </div>
            )}

            {paymentSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Pengaturan Rekening Berhasil Disimpan &amp; Tersinkronisasi!</p>
                  <p className="text-[11px] text-emerald-700">Aplikasi kasir kantin kini akan otomatis memuat nomor rekening dan barcode QRIS terbaru ini.</p>
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
                  {/* Nama Bank */}
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
                        placeholder="Contoh: Bank Mandiri / BCA / BNI"
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-xs font-semibold shadow-2xs ${
                          isSuperadmin
                            ? 'border-slate-200 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Nomor Rekening */}
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
                      placeholder="Contoh: 168-00-9988112-7"
                      className={`w-full px-3 py-2.5 border rounded-xl text-xs font-mono font-bold shadow-2xs ${
                        isSuperadmin
                          ? 'border-slate-200 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                      }`}
                      required
                    />
                  </div>

                  {/* Atas Nama Rekening */}
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
                      placeholder="Contoh: PT Station Technology"
                      className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold shadow-2xs ${
                        isSuperadmin
                          ? 'border-slate-200 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                      }`}
                      required
                    />
                  </div>

                  {/* Checkbox Status Aktif Rekening Bank */}
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isBankActive !== false}
                        onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, isBankActive: e.target.checked }))}
                        disabled={!isSuperadmin}
                        className={`w-4 h-4 mt-0.5 rounded border-slate-300 ${
                          isSuperadmin ? 'text-blue-600 focus:ring-blue-500 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                        }`}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Aktifkan Metode Pembayaran Transfer Rekening Bank
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Kasir kantin dapat memilih transfer rekening bank penampung resmi ini saat menyetor tagihan.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Kolom Kanan: Upload QRIS & Instruksi */}
                <div className="space-y-4">
                  {/* Upload QRIS */}
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
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                              Format PNG / JPG, maksimal 5MB. Barcode akan otomatis muncul saat kasir kantin memilih metode bayar QRIS.
                            </p>
                          </>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-slate-700 block">Barcode QRIS Aktif</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {qrisPreview ? 'Barcode aktif tersinkronisasi di seluruh kasir kantin.' : 'Belum ada barcode QRIS diunggah.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checkbox Status Aktif QRIS */}
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentSettings.isQrisActive !== false}
                        onChange={(e) => isSuperadmin && setPaymentSettings(p => ({ ...p, isQrisActive: e.target.checked }))}
                        disabled={!isSuperadmin}
                        className={`w-4 h-4 mt-0.5 rounded border-slate-300 ${
                          isSuperadmin ? 'text-indigo-600 focus:ring-indigo-500 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                        }`}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Aktifkan Metode Pembayaran Scan QRIS Resmi
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Kasir kantin dapat memilih dan memindai barcode QRIS resmi ini saat menyetor tagihan.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Instruksi Transfer */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Petunjuk Pembayaran untuk Petugas Kantin
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
                          ? 'border-slate-200 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW KASIR KANTIN */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pratinjau Langsung Pilihan Metode Pembayaran di Kasir Kantin</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {paymentSettings.isBankActive !== false && paymentSettings.isQrisActive !== false
                      ? 'Kasir dapat memilih: Transfer Rekening Bank ATAU Scan QRIS'
                      : paymentSettings.isBankActive !== false
                      ? 'Metode aktif: Transfer Rekening Bank Saja'
                      : 'Metode aktif: Scan QRIS Resmi Saja'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                  {/* Pratinjau Opsi 1: Rekening Bank */}
                  <div className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                    paymentSettings.isBankActive !== false
                      ? 'bg-gradient-to-br from-slate-900 to-blue-950 text-white border-blue-800 shadow-md'
                      : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-xs">
                            <CreditCard className="w-4 h-4 text-blue-300" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-none">{paymentSettings.bankName || 'Nama Bank'}</p>
                            <p className="text-[10px] text-blue-300">Pilihan 1: Transfer Bank</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          paymentSettings.isBankActive !== false
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {paymentSettings.isBankActive !== false ? 'Aktif di Kasir' : 'Dinonaktifkan'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nomor Rekening Tujuan:</p>
                        <p className="text-base font-black font-mono tracking-wider text-amber-300">
                          {paymentSettings.accountNumber || '-'}
                        </p>
                        <p className="text-[11px] text-slate-200">
                          a.n. <span className="font-bold">{paymentSettings.accountHolder || '-'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pratinjau Opsi 2: Scan QRIS */}
                  <div className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                    paymentSettings.isQrisActive !== false
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 text-white border-indigo-800 shadow-md'
                      : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                            <QrCode className="w-4 h-4 text-indigo-300" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-none">QRIS Resmi Sadewa</p>
                            <p className="text-[10px] text-indigo-300">Pilihan 2: Scan Barcode QRIS</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          paymentSettings.isQrisActive !== false
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {paymentSettings.isQrisActive !== false ? 'Aktif di Kasir' : 'Dinonaktifkan'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {qrisPreview ? (
                          <div className="p-1 bg-white rounded-xl shadow-md shrink-0">
                            <img src={resolveImageUrl(qrisPreview)} alt="QRIS" className="w-14 h-14 object-contain" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-white/10 border border-dashed border-white/20 rounded-xl flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                            Belum Ada
                          </div>
                        )}
                        <div className="text-[11px] text-slate-300 leading-snug">
                          <p className="font-semibold text-white">Scan Barcode Instan</p>
                          <p className="text-[10px] text-slate-400">Kasir memindai QRIS via m-Banking atau E-Wallet.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Simpan (Hanya Superadmin) */}
              {isSuperadmin && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingPayment ? 'Menyimpan Pengaturan...' : 'Simpan & Terapkan ke Kantin'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL UBAH TARIF GLOBAL NASIONAL (Hanya Superadmin)
          ========================================================================= */}
      {showGlobalModal && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200/90 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    Ubah Tarif Panggilan Global Nasional
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi fleksibel terpusat Super Administrator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGlobal} className="py-4 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">
                  Tarif Acuan Baru (Rupiah per Detik)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={globalFormRate}
                    onChange={(e) => setGlobalFormRate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-black text-slate-800 text-base"
                    placeholder="15"
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-2 px-3 py-2 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs">
                  <span className="text-amber-900 font-medium">Estimasi Biaya per Menit:</span>
                  <span className="text-amber-950 font-black text-sm">
                    Rp {((Number(globalFormRate) || 0) * 60).toLocaleString('id-ID')} / menit
                  </span>
                </div>
              </div>

              {/* Checkbox: Terapkan ke Seluruh Lapas */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAllBranches}
                    onChange={(e) => setApplyToAllBranches(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      Terapkan juga tarif ini ke seluruh Lapas/UPT aktif saat ini
                      {globalSettings?.totalBranches ? ` (${globalSettings.totalBranches} Lapas)` : ''}
                    </span>
                    <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                      {applyToAllBranches
                        ? 'Seluruh data cabang dan kontrak aktif akan otomatis diperbarui ke tarif ini. Tagihan berjalan bulan ini (status UNPAID) akan dikalkulasi ulang secara otomatis.'
                        : 'Tarif hanya akan disimpan sebagai default acuan global baru untuk pendaftaran cabang baru dan fallback panggilan.'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Panggilan baru setelah pembaruan ini akan langsung menggunakan tarif baru. Riwayat panggilan lampau tetap mempertahankan biaya aslinya untuk integritas pencatatan CDR.
                </span>
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          MODAL DETAIL / EDIT KONTRAK & PERSENTASE BAGI HASIL PER UPT
          ========================================================================= */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative border border-slate-200/90 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      {isSuperadmin ? 'Ubah Kontrak & Persentase Bagi Hasil' : 'Rincian Kontrak Bagi Hasil UPT'}
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
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Setara Rp {((Number(ratePerSecond) || 0) * 60).toLocaleString('id-ID')} / menit
                  </span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank Penampung Koperasi</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => isSuperadmin && setBankName(e.target.value)}
                    disabled={!isSuperadmin}
                    className={`w-full px-3 py-2 rounded-xl border text-slate-800 ${
                      isSuperadmin
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => isSuperadmin && setAccountNumber(e.target.value)}
                    disabled={!isSuperadmin}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-slate-800 ${
                      isSuperadmin
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] bg-white'
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
                        ? 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1565C0] bg-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Pembagian Hasil Utama & Klausul Opsional Kepala UPT */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-4">
                {/* Modern Interactive Toggle Card untuk Kepala UPT */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  hasKepalaUpt 
                    ? 'bg-gradient-to-r from-purple-50/90 via-purple-50/50 to-indigo-50/40 border-purple-200 shadow-xs' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        hasKepalaUpt ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">
                            Porsi Tambahan Kepala UPT (5%)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            hasKepalaUpt 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {hasKepalaUpt ? 'Aktif (5% dari Vendor)' : 'Nonaktif (0%)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                          {hasKepalaUpt ? (
                            <span className="text-purple-900 font-medium">
                              Lapas ini meminta bagian Kepala UPT. Porsi <strong>5%</strong> dialokasikan dari hak Vendor (Vendor menjadi <strong>55%</strong>, Kepala UPT <strong>5%</strong>). Total setoran UPT tetap <strong>60%</strong>.
                            </span>
                          ) : (
                            <span>
                              Skema standar aktif: Inkopasindo 10%, UPT 30%, dan Vendor 60% utuh. Aktifkan toggle di sebelah kanan jika UPT ini meminta alokasi 5% untuk Kepala UPT.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* iOS-Style Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasKepalaUpt}
                      onClick={() => {
                        if (!isSuperadmin) return;
                        const next = !hasKepalaUpt;
                        setHasKepalaUpt(next);
                        if (next) {
                          setKepalaUptPct(5);
                          setVendorPct(55);
                        } else {
                          setKepalaUptPct(0);
                          setVendorPct(60);
                        }
                      }}
                      disabled={!isSuperadmin}
                      title={hasKepalaUpt ? 'Nonaktifkan porsi Kepala UPT' : 'Aktifkan porsi Kepala UPT (5% dari Vendor)'}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        hasKepalaUpt ? 'bg-purple-600' : 'bg-slate-300'
                      } ${!isSuperadmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          hasKepalaUpt ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Header Rincian & Visual Segmented Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Rincian Alokasi Bagi Hasil
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {hasKepalaUpt ? 'Skema 4 Pihak (dengan klausul Kepala UPT)' : 'Skema Standar 3 Pihak Resmi'}
                      </span>
                    </div>
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      isPercentValid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      Total: {totalPercent}% / 100%
                    </div>
                  </div>

                  {/* Segmented Visual Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                    <div 
                      style={{ width: `${inkopasindoPct}%` }} 
                      className="bg-amber-500 h-full transition-all duration-300" 
                      title={`Inkopasindo: ${inkopasindoPct}%`} 
                    />
                    <div 
                      style={{ width: `${koperasiPct}%` }} 
                      className="bg-sky-500 h-full transition-all duration-300" 
                      title={`UPT: ${koperasiPct}%`} 
                    />
                    <div 
                      style={{ width: `${vendorPct}%` }} 
                      className="bg-indigo-600 h-full transition-all duration-300" 
                      title={`Vendor: ${vendorPct}%`} 
                    />
                    {Number(kepalaUptPct) > 0 && (
                      <div 
                        style={{ width: `${kepalaUptPct}%` }} 
                        className="bg-purple-600 h-full transition-all duration-300" 
                        title={`Kepala UPT: ${kepalaUptPct}%`} 
                      />
                    )}
                  </div>
                </div>

                {/* 4 Cards Alokasi */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* 1. Inkopasindo */}
                  <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-amber-900 font-bold text-[11px]">1. Inkopasindo</label>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Hak 10%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inkopasindoPct}
                        onChange={(e) => isSuperadmin && setInkopasindoPct(e.target.value)}
                        disabled={!isSuperadmin}
                        className="w-full pr-7 pl-3 py-1.5 rounded-xl border border-slate-200 font-extrabold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 2. UPT */}
                  <div className="bg-white p-3 rounded-2xl border border-sky-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sky-900 font-bold text-[11px]">2. UPT (Koperasi)</label>
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">Hak 30%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={koperasiPct}
                        onChange={(e) => isSuperadmin && setKoperasiPct(e.target.value)}
                        disabled={!isSuperadmin}
                        className="w-full pr-7 pl-3 py-1.5 rounded-xl border border-slate-200 font-extrabold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 3. Vendor */}
                  <div className={`p-3 rounded-2xl border shadow-2xs transition-all ${
                    hasKepalaUpt ? 'bg-indigo-50/40 border-indigo-300' : 'bg-white border-indigo-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-indigo-900 font-bold text-[11px]">3. Vendor</label>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                        {hasKepalaUpt ? '55% Bersih' : '60% Utuh'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={vendorPct}
                        onChange={(e) => isSuperadmin && setVendorPct(e.target.value)}
                        disabled={!isSuperadmin}
                        className="w-full pr-7 pl-3 py-1.5 rounded-xl border border-slate-200 font-extrabold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* 4. Kepala UPT */}
                  <div className={`p-3 rounded-2xl border shadow-2xs transition-all ${
                    hasKepalaUpt ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20' : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-purple-900 font-bold text-[11px]">Kepala UPT</label>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        hasKepalaUpt ? 'text-purple-700 bg-purple-100 font-bold' : 'text-slate-400'
                      }`}>
                        {hasKepalaUpt ? 'Dari Vendor' : 'Opsional'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={kepalaUptPct}
                        onChange={(e) => {
                          if (!isSuperadmin) return;
                          const val = Number(e.target.value);
                          setKepalaUptPct(e.target.value);
                          setHasKepalaUpt(val > 0);
                        }}
                        disabled={!isSuperadmin}
                        className="w-full pr-7 pl-3 py-1.5 rounded-xl border border-slate-200 font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
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
                        Jumlah total persentase saat ini <strong>{totalPercent}%</strong>. Mohon sesuaikan agar tepat <strong>100%</strong> sebelum menyimpan.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Total persentase valid (100%). {hasKepalaUpt ? 'Skema menyertakan 5% Kepala UPT dari vendor.' : 'Skema standar 3 pihak siap diterapkan.'}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Live Simulator Bagi Hasil */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
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
                      className="w-32 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-amber-800 font-semibold block text-[11px]">1. Inkopasindo ({inkopasindoPct}%):</span>
                    <span className="font-black text-amber-950 text-sm mt-0.5 block">
                      {formatRupiah(((Number(simulationRevenue) || 0) * (Number(inkopasindoPct) || 0)) / 100)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-sky-800 font-semibold block text-[11px]">2. UPT ({koperasiPct}%):</span>
                    <span className="font-black text-sky-950 text-sm mt-0.5 block">
                      {formatRupiah(((Number(simulationRevenue) || 0) * (Number(koperasiPct) || 0)) / 100)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-indigo-800 font-semibold block text-[11px]">3. Vendor ({vendorPct}%):</span>
                    <span className="font-black text-indigo-950 text-sm mt-0.5 block">
                      {formatRupiah(((Number(simulationRevenue) || 0) * (Number(vendorPct) || 0)) / 100)}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${
                    Number(kepalaUptPct) > 0 ? 'bg-purple-50/60 border-purple-200' : 'bg-white border-slate-100'
                  }`}>
                    <span className="text-purple-800 font-semibold block text-[11px]">Kepala UPT ({kepalaUptPct}%):</span>
                    <span className="font-black text-purple-950 text-sm mt-0.5 block">
                      {formatRupiah(((Number(simulationRevenue) || 0) * (Number(kepalaUptPct) || 0)) / 100)}
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
