// TODO: TARIFF nantinya diambil dari API backend (tim BE)
export const TARIFF = {
  ratesPerSecond: {
    telepon: 15,
    video: 25,
  },
  ppnRate: 0.11,
  stepMinutes: 6,
  presets: [6, 12, 18, 24, 30, 36],
};

/**
 * Konfigurasi visibilitas Paket Combo
 * Ubah menjadi `true` untuk mengaktifkan kembali kategori & paket combo.
 */
export const ENABLE_COMBO_PACKAGES = false;

/**
 * Menghitung harga paket berdasarkan jenis paket dan durasi (menit)
 * dpp   = menit × 60 × tarifPerDetik
 * ppn   = dpp × 0,11
 * total = dpp + ppn
 *
 * @param {'telepon'|'video'} type
 * @param {number} minutes
 * @returns {{ dpp: number, ppn: number, total: number }}
 */
export function calcPrice(type, minutes) {
  const typeKey = (type || 'telepon').toLowerCase();
  const rateKey = typeKey.includes('video') ? 'video' : 'telepon';
  const rate = TARIFF.ratesPerSecond[rateKey] || 0;

  const dpp = Math.round(minutes * 60 * rate);
  const ppn = Math.round(dpp * TARIFF.ppnRate);
  const total = dpp + ppn;

  return { dpp, ppn, total };
}

/**
 * Menghasilkan daftar preset paket berdasarkan TARIFF
 *
 * @param {'telepon'|'video'} type
 * @returns {Array<{ id: string, nama: string, kategori: string, menit: number, durasi: string, keterangan: string, dpp: number, ppn: number, total: number, harga: number }>}
 */
export function buildPackages(type = 'telepon') {
  const typeKey = (type || 'telepon').toLowerCase();

  if (typeKey === 'telepon') {
    return [
      {
        id: 'd51b1c3d-388b-434b-8275-8aa1614fc406',
        nama: 'Paket Suara 5 Menit',
        kategori: 'telepon',
        menit: 5,
        durasi: '5 Menit',
        keterangan: 'Semua Operator',
        dpp: 4505,
        ppn: 495,
        total: 5000,
        harga: 5000,
      },
      {
        id: '2e3855bf-5fbe-4e81-ae15-f333f1d31648',
        nama: 'Paket Suara 15 Menit',
        kategori: 'telepon',
        menit: 15,
        durasi: '15 Menit',
        keterangan: 'Semua Operator',
        dpp: 10811,
        ppn: 1189,
        total: 12000,
        harga: 12000,
      },
    ];
  }

  if (typeKey === 'video' || typeKey === 'video call') {
    return [
      {
        id: '1efccde6-af3c-4bb0-be50-3cb7326df247',
        nama: 'Paket Video Call 10 Menit',
        kategori: 'video',
        menit: 10,
        durasi: '10 Menit',
        keterangan: 'Semua Operator',
        dpp: 18018,
        ppn: 1982,
        total: 20000,
        harga: 20000,
      },
    ];
  }

  return [];
}

export const daftarPaketTelepon = buildPackages('telepon');
export const daftarPaketVideo = buildPackages('video');
export const daftarPaket = [...daftarPaketTelepon, ...daftarPaketVideo];
