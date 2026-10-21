/**
 * MOCK - menunggu endpoint BE
 * ============================================================================
 * Modul ini menyediakan fallback data dan penyimpanan kontrak tarif per detik
 * serta perhitungan tagihan berbasis detik panggilan kantin WBP.
 *
 * RUMUS TAGIHAN:
 * Tagihan = Total Detik x Tarif per Detik x Persen Negosiasi
 * Contoh: 200.000 detik x Rp 10 = Rp 2.000.000, lalu x 50% = Rp 1.000.000
 *
 * ATURAN:
 * 1. Default kontrak adalah KOSONG. Tarif dan persen negosiasi belum muncul
 *    karena belum dibuat/ditetapkan oleh Superadmin.
 * 2. Total detik dihitung dari data real panggilan/pembelian transaksi.
 *    Jika belum melakukan pembelian/panggilan, otomatis datanya KOSONG (0 detik).
 * ============================================================================
 */

const STORAGE_KEY_CONTRACTS = 'pascall_canteen_contracts_v1';

// Awalnya KOSONG: tarif dan persen negosiasi belum dibuat/ditetapkan oleh Superadmin
const DEFAULT_CONTRACTS = {};

/**
 * Mengambil seluruh kontrak dari localStorage
 * // MOCK - menunggu endpoint BE
 */
export function getStoredContracts() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CONTRACTS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[canteenContractMock] Gagal membaca storage kontrak:', err);
  }
  return { ...DEFAULT_CONTRACTS };
}

/**
 * Menyimpan kontrak tarif & persen negosiasi untuk sebuah kantin/cabang UPT
 * Hanya dapat dilakukan oleh Superadmin.
 * // MOCK - menunggu endpoint BE
 *
 * @param {string} branchId
 * @param {{ ratePerSecond: number, negotiationPercent: number, branchName?: string, canteenName?: string }} payload
 * @returns {Object}
 */
export function saveStoredContract(branchId, payload) {
  if (!branchId) throw new Error('ID Cabang / Kantin wajib diisi');

  const rate = Number(payload.ratePerSecond);
  const saPercent = payload.superadminPercent !== undefined && payload.superadminPercent !== null && payload.superadminPercent !== ''
    ? Number(payload.superadminPercent)
    : Number(payload.negotiationPercent);
  const kantinPercent = payload.canteenPercent !== undefined && payload.canteenPercent !== null && payload.canteenPercent !== ''
    ? Number(payload.canteenPercent)
    : (100 - saPercent);

  if (isNaN(rate) || rate < 0) {
    throw new Error('Tarif per detik tidak boleh bernilai negatif');
  }
  if (isNaN(saPercent) || saPercent < 0 || saPercent > 100) {
    throw new Error('Persentase Superadmin harus berada di antara 0% hingga 100%');
  }
  if (isNaN(kantinPercent) || kantinPercent < 0 || kantinPercent > 100) {
    throw new Error('Persentase Kantin harus berada di antara 0% hingga 100%');
  }

  const contracts = getStoredContracts();
  const existing = contracts[branchId] || {};

  const updated = {
    ...existing,
    branchId,
    branchName: payload.branchName || existing.branchName || `UPT ${branchId}`,
    canteenName: payload.canteenName || existing.canteenName || `Kantin UPT ${branchId}`,
    ratePerSecond: rate,
    superadminPercent: saPercent,
    canteenPercent: kantinPercent,
    negotiationPercent: saPercent, // Porsi yang ditagihkan ke kantin
    updatedAt: new Date().toISOString(),
    updatedBy: 'Superadmin',
  };

  contracts[branchId] = updated;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
      window.dispatchEvent(new CustomEvent('pascall_contract_changed', { detail: updated }));
      window.dispatchEvent(new CustomEvent('storage'));
    }
  } catch (err) {
    console.error('[canteenContractMock] Gagal menyimpan kontrak:', err);
  }

  return updated;
}

/**
 * Menghitung total detik dari transaksi/panggilan riil.
 * Jika belum melakukan pembelian/panggilan, otomatis KOSONG (0 detik).
 * // MOCK - menunggu endpoint BE
 */
export function calculateCallSecondsFromRealData(transactions = [], calls = []) {
  if ((!transactions || transactions.length === 0) && (!calls || calls.length === 0)) {
    return 0;
  }

  let totalSec = 0;

  // 1. Jika ada data log panggilan riil
  if (Array.isArray(calls) && calls.length > 0) {
    totalSec = calls.reduce((acc, c) => acc + Number(c.durationSeconds || 0), 0);
  }

  // 2. Jika ada data transaksi voucher kantin riil
  if (totalSec === 0 && Array.isArray(transactions) && transactions.length > 0) {
    totalSec = transactions.reduce((acc, t) => {
      const sec = Number(t.usedDurationSec || 0);
      if (sec > 0) return acc + sec;
      const durationMin = Number(t.package?.duration || t.durationMinutes || 0);
      return acc + (durationMin * 60);
    }, 0);
  }

  return totalSec;
}

/**
 * Menghitung tagihan berdasarkan detik, tarif, dan pembagian persen Superadmin & Kantin
 * // MOCK - menunggu endpoint BE
 *
 * Rumus:
 * Subtotal = totalDetik * tarifPerDetik
 * TotalTagihan (Disetor ke Superadmin) = Subtotal * (persenSuperadmin / 100)
 * Pendapatan Kantin = Subtotal * (persenKantin / 100)
 */
export function calculateCanteenBilling({ totalSeconds, ratePerSecond, superadminPercent, canteenPercent, negotiationPercent }) {
  const saPercent = superadminPercent !== undefined && superadminPercent !== null && superadminPercent !== ''
    ? Number(superadminPercent)
    : (negotiationPercent !== undefined && negotiationPercent !== null && negotiationPercent !== '' ? Number(negotiationPercent) : null);

  const ktPercent = canteenPercent !== undefined && canteenPercent !== null && canteenPercent !== ''
    ? Number(canteenPercent)
    : (saPercent !== null && saPercent !== undefined ? Math.max(0, 100 - saPercent) : null);

  const isContractSet =
    ratePerSecond !== null &&
    ratePerSecond !== undefined &&
    ratePerSecond !== '' &&
    Number(ratePerSecond) >= 0 &&
    saPercent !== null &&
    saPercent !== undefined &&
    saPercent >= 0;

  if (!isContractSet) {
    return {
      totalSeconds: totalSeconds || 0,
      ratePerSecond: null,
      superadminPercent: null,
      canteenPercent: null,
      negotiationPercent: null,
      subtotal: 0,
      totalAmount: 0,
      canteenShare: 0,
      isContractSet: false,
      contractNote: 'Kontrak tarif belum diatur oleh Superadmin',
    };
  }

  const sec = Number(totalSeconds) || 0;
  const rate = Number(ratePerSecond) || 0;

  const subtotal = Math.round(sec * rate);
  const totalAmount = Math.round(subtotal * (saPercent / 100)); // Tagihan yang disetorkan ke Superadmin
  const canteenShare = Math.round(subtotal * ((ktPercent ?? (100 - saPercent)) / 100)); // Hak operasional Kantin

  return {
    totalSeconds: sec,
    ratePerSecond: rate,
    superadminPercent: saPercent,
    canteenPercent: ktPercent ?? (100 - saPercent),
    negotiationPercent: saPercent,
    subtotal,
    totalAmount,
    canteenShare,
    isContractSet: true,
    contractNote: null,
  };
}

/**
 * Format detik menjadi tampilan menit dan detik yang rapi
 * Contoh: 200.000 detik (3.333 menit 20 detik)
 */
export function formatDetikKeMenit(totalSeconds) {
  const sec = Number(totalSeconds) || 0;
  if (sec === 0) return '0 detik (0 menit)';

  const menit = Math.floor(sec / 60);
  const sisaDetik = sec % 60;
  const formatDetikNumber = sec.toLocaleString('id-ID');
  const formatMenitNumber = menit.toLocaleString('id-ID');

  if (sisaDetik === 0) {
    return `${formatDetikNumber} detik (${formatMenitNumber} menit)`;
  }
  return `${formatDetikNumber} detik (${formatMenitNumber}m ${sisaDetik}d)`;
}
