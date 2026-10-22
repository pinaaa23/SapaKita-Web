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
 * Mencari kontrak tersimpan berdasarkan ID cabang, nama cabang, atau nama kantin
 * Sangat fleksibel agar sinkronisasi antar-halaman tetap akurat meskipun dipanggil dari sisi Kantin atau Superadmin.
 *
 * @param {string} identifier - branchId
 * @param {{ branchName?: string, canteenName?: string }} options
 * @returns {Object|null}
 */
export function findStoredContract(identifier, { branchName, canteenName } = {}) {
  const contracts = getStoredContracts();
  if (!contracts || typeof contracts !== 'object') return null;

  // 1. Pencocokan langsung dengan key branchId
  if (identifier && contracts[identifier]) {
    return contracts[identifier];
  }

  const list = Object.values(contracts);
  if (!list.length) return null;

  const targetId = identifier ? String(identifier).toLowerCase().trim() : null;
  const targetBranch = branchName ? String(branchName).toLowerCase().replace(/^(lapas|rutan|kantin|upt)\s+/gi, '').trim() : null;
  const targetCanteen = canteenName ? String(canteenName).toLowerCase().replace(/^(lapas|rutan|kantin|upt)\s+/gi, '').trim() : null;

  // 2. Pencocokan objek kontrak di dalam list
  const found = list.find((c) => {
    if (!c) return false;
    const cId = c.branchId ? String(c.branchId).toLowerCase().trim() : null;
    if (targetId && cId && (cId === targetId || targetId.includes(cId) || cId.includes(targetId))) {
      return true;
    }
    const cBranch = c.branchName ? String(c.branchName).toLowerCase().replace(/^(lapas|rutan|kantin|upt)\s+/gi, '').trim() : null;
    if (targetBranch && cBranch) {
      if (cBranch === targetBranch || cBranch.includes(targetBranch) || targetBranch.includes(cBranch)) return true;
    }
    const cCanteen = c.canteenName ? String(c.canteenName).toLowerCase().replace(/^(lapas|rutan|kantin|upt)\s+/gi, '').trim() : null;
    if (targetCanteen && cCanteen) {
      if (cCanteen === targetCanteen || cCanteen.includes(targetCanteen) || targetCanteen.includes(cCanteen)) return true;
    }
    return false;
  });

  return found || null;
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
/**
 * Helper tunggal penentu status kontrak tarif kantin:
 * Kontrak dianggap "belum diatur" jika tarif per detik atau persen negosiasi kantin itu belum diisi (kosong/null/undefined).
 * Nilai 0 yang sengaja diisi Superadmin (misal tarif Rp 0 atau bagi hasil 0%) adalah valid ("sudah diatur"), bukan "belum diatur".
 *
 * @param {Object} contract - objek kontrak atau billing kantin
 * @returns {boolean}
 */
export function isCanteenContractConfigured(contract) {
  if (!contract || typeof contract !== 'object') return false;

  // Jika input adalah objek billing dengan flag isContractSet eksplisit false
  if (contract.isContractSet === false) return false;

  const rate = contract.ratePerSecond;
  const saPercent =
    contract.superadminPercent !== undefined &&
    contract.superadminPercent !== null &&
    contract.superadminPercent !== ''
      ? contract.superadminPercent
      : (contract.negotiationPercent !== undefined &&
         contract.negotiationPercent !== null &&
         contract.negotiationPercent !== ''
          ? contract.negotiationPercent
          : null);

  // Nilai kosong/null/undefined/bukan angka = belum diatur
  if (rate === null || rate === undefined || rate === '' || isNaN(Number(rate))) {
    return false;
  }
  if (saPercent === null || saPercent === undefined || saPercent === '' || isNaN(Number(saPercent))) {
    return false;
  }

  const numRate = Number(rate);
  const numSa = Number(saPercent);

  // Nilai 0 yang sengaja diisi adalah valid, tetapi negatif atau persen > 100 tidak valid
  if (numRate < 0 || numSa < 0 || numSa > 100) {
    return false;
  }

  return true;
}

/**
 * Memeriksa apakah suatu tanggal transaksi berada pada target bulan dan tahun
 * dalam zona waktu Indonesia Barat (WIB / Asia/Jakarta, UTC+7).
 *
 * @param {string|Date} dateVal
 * @param {number} targetMonth (1 - 12)
 * @param {number} targetYear (e.g. 2026)
 * @returns {boolean}
 */
export function isDateInMonthWIB(dateVal, targetMonth, targetYear) {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return false;

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(d);
    const y = parseInt(parts.find((p) => p.type === 'year')?.value, 10);
    const m = parseInt(parts.find((p) => p.type === 'month')?.value, 10);
    return m === Number(targetMonth) && y === Number(targetYear);
  } catch {
    const wibDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return wibDate.getUTCMonth() + 1 === Number(targetMonth) && wibDate.getUTCFullYear() === Number(targetYear);
  }
}

/**
 * Fungsi perhitungan tunggal bersama untuk seluruh tampilan (Kantin, Superadmin, dan Tab Rincian):
 * Rumus:
 * - Subtotal = totalDetik * tarifPerDetik
 * - Total Tagihan (Disetor ke Superadmin) = Subtotal * (persenSuperadmin / 100)
 * - Hak Operasional Kantin = Subtotal - Total Tagihan
 */
export function calculateUnifiedBilling({ totalSeconds, ratePerSecond, superadminPercent }) {
  const isContractSet = isCanteenContractConfigured({
    ratePerSecond,
    superadminPercent,
  });

  const sec = Number(totalSeconds) || 0;

  if (!isContractSet) {
    return {
      totalSeconds: sec,
      ratePerSecond: null,
      superadminPercent: null,
      canteenPercent: null,
      negotiationPercent: null,
      subtotal: null,
      totalAmount: null,
      canteenShare: null,
      isContractSet: false,
      contractNote: 'Tarif belum diatur oleh Superadmin',
    };
  }

  const rate = Number(ratePerSecond);
  const saPercent = Number(superadminPercent);
  const ktPercent = Math.max(0, 100 - saPercent);

  const subtotal = Math.round(sec * rate);
  const totalAmount = Math.round(subtotal * (saPercent / 100)); // Porsi disetor ke Superadmin
  const canteenShare = subtotal - totalAmount; // Hak operasional Kantin

  return {
    totalSeconds: sec,
    ratePerSecond: rate,
    superadminPercent: saPercent,
    canteenPercent: ktPercent,
    negotiationPercent: saPercent,
    subtotal,
    totalAmount,
    canteenShare,
    isContractSet: true,
    contractNote: null,
  };
}

/**
 * Menghitung tagihan berdasarkan detik, tarif, dan pembagian persen Superadmin & Kantin
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

  return calculateUnifiedBilling({
    totalSeconds,
    ratePerSecond,
    superadminPercent: saPercent,
  });
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
