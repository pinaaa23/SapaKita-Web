/**
 * Service untuk Data Status Wartel (Mock / Dummy Data)
 * 
 * TODO: ganti dengan endpoint BE ketika REST API / WebSocket Backend untuk status wartel sudah siap.
 * TODO: BE sebaiknya mengirim estimasiSelesai dan waktuServer
 */

const STORAGE_KEY = 'pascall_wartel_status_v3';
const STORAGE_LAST_RANDOM_KEY = 'pascall_wartel_last_random';

// Helper simulasi delay (300-500 ms)
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Data awal 10 unit wartel (Wartel 01 - Wartel 10)
 * Beberapa dibuat selesai dalam 1-3 menit (Wartel 01: 1.5 min, Wartel 05: 2.5 min)
 * sedangkan yang lain 5-15 menit.
 */
export const seedWartelAwal = () => {
  const now = Date.now();
  return [
    { id: 1, nama: 'Wartel 01', status: 'digunakan', estimasiSelesai: now + 90 * 1000 },    // ~1.5 menit (1-3 min)
    { id: 2, nama: 'Wartel 02', status: 'tersedia', estimasiSelesai: null },
    { id: 3, nama: 'Wartel 03', status: 'digunakan', estimasiSelesai: now + 480 * 1000 },   // ~8 menit
    { id: 4, nama: 'Wartel 04', status: 'tersedia', estimasiSelesai: null },
    { id: 5, nama: 'Wartel 05', status: 'digunakan', estimasiSelesai: now + 150 * 1000 },   // ~2.5 menit (1-3 min)
    { id: 6, nama: 'Wartel 06', status: 'digunakan', estimasiSelesai: now + 720 * 1000 },   // ~12 menit
    { id: 7, nama: 'Wartel 07', status: 'tersedia', estimasiSelesai: null },
    { id: 8, nama: 'Wartel 08', status: 'digunakan', estimasiSelesai: now + 300 * 1000 },   // ~5 menit
    { id: 9, nama: 'Wartel 09', status: 'tersedia', estimasiSelesai: null },
    { id: 10, nama: 'Wartel 10', status: 'digunakan', estimasiSelesai: now + 600 * 1000 },  // ~10 menit
  ];
};

/**
 * Membaca data status wartel dari storage atau menduplikasi seed default
 */
export function getStoredWartel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const awal = seedWartelAwal();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(awal));
      return awal;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 10) {
      const awal = seedWartelAwal();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(awal));
      return awal;
    }
    return parsed;
  } catch (err) {
    console.error('Gagal membaca data status wartel:', err);
    return seedWartelAwal();
  }
}

/**
 * Menyimpan data status wartel
 */
export function saveStoredWartel(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Gagal menyimpan data status wartel:', err);
  }
}

/**
 * Mengambil data status wartel (Asynchronous, delay 300-500 ms)
 * TODO: ganti dengan endpoint BE
 * TODO: BE sebaiknya mengirim estimasiSelesai dan waktuServer
 * 
 * Mengembalikan object: { waktuServer, daftar }
 */
export async function getStatusWartel() {
  await delay(350);
  const now = Date.now();
  let currentList = getStoredWartel();
  let updated = false;

  // 1. Cek wartel yang digunakan: Jika waktu selesai terlewati, ubah ke 'tersedia'
  currentList = currentList.map((item) => {
    if (item.status === 'digunakan' && item.estimasiSelesai && now >= item.estimasiSelesai) {
      updated = true;
      return {
        ...item,
        status: 'tersedia',
        estimasiSelesai: null,
      };
    }
    return item;
  });

  // 2. Simulasi: Setiap ~60 detik, 1 wartel yang tersedia secara acak menjadi 'digunakan' (estimasi 5-15 menit)
  let lastRandomTime = Number(localStorage.getItem(STORAGE_LAST_RANDOM_KEY) || 0);
  if (!lastRandomTime) {
    lastRandomTime = now;
    localStorage.setItem(STORAGE_LAST_RANDOM_KEY, String(now));
  }

  if (now - lastRandomTime >= 60000) {
    const tersediaIndices = [];
    currentList.forEach((item, index) => {
      if (item.status === 'tersedia') {
        tersediaIndices.push(index);
      }
    });

    if (tersediaIndices.length > 0) {
      const randomIndex = tersediaIndices[Math.floor(Math.random() * tersediaIndices.length)];
      const durasiMenit = Math.floor(Math.random() * 11) + 5; // 5-15 menit
      currentList[randomIndex] = {
        ...currentList[randomIndex],
        status: 'digunakan',
        estimasiSelesai: now + durasiMenit * 60 * 1000,
      };
      updated = true;
      localStorage.setItem(STORAGE_LAST_RANDOM_KEY, String(now));
    }
  }

  if (updated) {
    saveStoredWartel(currentList);
  }

  return {
    waktuServer: now,
    daftar: currentList,
  };
}

/**
 * Menghitung ringkasan ketersediaan wartel
 */
export function hitungRingkasanWartel(list = []) {
  const validList = Array.isArray(list) && list.length > 0 ? list : seedWartelAwal();
  const total = validList.length;
  const digunakan = validList.filter((item) => item.status === 'digunakan').length;
  const tersedia = total - digunakan;
  return {
    total,
    tersedia,
    digunakan,
  };
}

/**
 * Mengacak/memperbarui status wartel secara manual (Simulasi Refresh Data Server)
 * TODO: ganti dengan endpoint BE
 */
export async function refreshWartelStatus() {
  await delay(400);
  const now = Date.now();
  const current = getStoredWartel();
  const durasiPilihan = [2, 3, 5, 8, 10, 12, 15];

  const randomized = current.map((item) => {
    const isDigunakan = Math.random() < 0.6;
    if (isDigunakan) {
      const durasi = durasiPilihan[Math.floor(Math.random() * durasiPilihan.length)];
      return {
        ...item,
        status: 'digunakan',
        estimasiSelesai: now + durasi * 60 * 1000,
      };
    } else {
      return {
        ...item,
        status: 'tersedia',
        estimasiSelesai: null,
      };
    }
  });

  saveStoredWartel(randomized);
  return {
    waktuServer: now,
    daftar: randomized,
  };
}
