import { useState, useEffect, useCallback } from 'react';
import {
  getStatusWartel,
  refreshWartelStatus,
  hitungRingkasanWartel,
  getStoredWartel,
} from '../services/kantin/wartelService';

export const POLL_INTERVAL_MS = 10000;

/**
 * Shared state di tingkat modul agar Halaman Status Wartel dan Badge Sidebar
 * selalu memakai data yang SAMA PERSIS tanpa panggilan ganda.
 */
let initialData = getStoredWartel();
let sharedState = {
  daftar: initialData,
  summary: hitungRingkasanWartel(initialData),
  isLoading: true,
  isRefreshing: false,
  error: false,
  lastUpdatedTime: null,
  waktuServerOffset: 0,
  toasts: [],
  newlyAvailableIds: new Set(),
  isInitialLoad: true,
  prevStatusMap: {},
};

const listeners = new Set();
let pollTimer = null;

function notifyListeners() {
  const stateCopy = {
    ...sharedState,
    daftar: [...sharedState.daftar],
    summary: { ...sharedState.summary },
    toasts: [...sharedState.toasts],
    newlyAvailableIds: new Set(sharedState.newlyAvailableIds),
  };
  listeners.forEach((listener) => listener(stateCopy));
}

async function fetchAndUpdate(isManualRefresh = false) {
  if (isManualRefresh) {
    sharedState.isRefreshing = true;
  }
  notifyListeners();

  try {
    const res = isManualRefresh ? await refreshWartelStatus() : await getStatusWartel();
    const nowLocal = Date.now();
    const offset = res.waktuServer ? res.waktuServer - nowLocal : 0;

    const newNewlyAvailable = new Set();
    const newToasts = [...sharedState.toasts];

    // Deteksi perubahan status dari 'digunakan' -> 'tersedia'
    if (!sharedState.isInitialLoad) {
      res.daftar.forEach((item) => {
        const prevStatus = sharedState.prevStatusMap[item.id];
        if (prevStatus === 'digunakan' && item.status === 'tersedia') {
          newNewlyAvailable.add(item.id);
          newToasts.push({
            id: `toast-${item.id}-${Date.now()}-${Math.random()}`,
            text: `${item.nama} sekarang tersedia`,
            wartelId: item.id,
          });
        }
      });
    }

    // Perbarui peta status sebelumnya
    const statusMap = {};
    res.daftar.forEach((item) => {
      statusMap[item.id] = item.status;
    });

    const nowObj = new Date();
    const formattedTime = nowObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    sharedState = {
      ...sharedState,
      daftar: res.daftar,
      summary: hitungRingkasanWartel(res.daftar, res.cabang),
      isLoading: false,
      isRefreshing: false,
      error: false, // hapus error banner jika berhasil
      lastUpdatedTime: formattedTime,
      waktuServerOffset: offset,
      toasts: newToasts,
      newlyAvailableIds: newNewlyAvailable,
      isInitialLoad: false,
      prevStatusMap: statusMap,
    };

    // Bersihkan highlight animasi chip berkedip setelah 2.5 detik
    if (newNewlyAvailable.size > 0) {
      setTimeout(() => {
        sharedState.newlyAvailableIds = new Set();
        notifyListeners();
      }, 2500);
    }
  } catch (err) {
    console.error('Gagal memperbarui status wartel:', err);
    sharedState = {
      ...sharedState,
      isLoading: false,
      isRefreshing: false,
      error: true, // Tampilkan banner error tetapi tetap pertahankan data terakhir
    };
  } finally {
    notifyListeners();
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    if (typeof document !== 'undefined' && !document.hidden) {
      fetchAndUpdate();
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function handleVisibilityChange() {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    stopPolling();
  } else {
    // Panggil langsung saat tab terlihat lagi, lalu restart interval 10 detik
    fetchAndUpdate();
    startPolling();
  }
}

/**
 * Custom Hook useStatusWartel
 * Digunakan oleh Halaman Status Wartel dan WartelBadgeSidebar
 */
export function useStatusWartel() {
  const [state, setState] = useState(() => ({
    ...sharedState,
    daftar: [...sharedState.daftar],
    summary: { ...sharedState.summary },
    toasts: [...sharedState.toasts],
    newlyAvailableIds: new Set(sharedState.newlyAvailableIds),
  }));

  // State untuk timer detik real-time hitung mundur di layar
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handleStateChange = (newState) => {
      setState(newState);
    };

    listeners.add(handleStateChange);

    // Ketika listener pertama terdaftar, jalankan fetching awal & polling
    if (listeners.size === 1) {
      fetchAndUpdate();
      startPolling();
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    } else {
      // Jika sudah ada listener aktif, berikan state terbaru langsung
      handleStateChange({
        ...sharedState,
        daftar: [...sharedState.daftar],
        summary: { ...sharedState.summary },
        toasts: [...sharedState.toasts],
        newlyAvailableIds: new Set(sharedState.newlyAvailableIds),
      });
    }

    // Timer 1 detik untuk menghitung mundur di UI
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      listeners.delete(handleStateChange);
      clearInterval(ticker);

      // Jika tidak ada listener yang mendengarkan lagi, hentikan polling & event listener
      if (listeners.size === 0) {
        stopPolling();
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      }
    };
  }, []);

  const refetch = useCallback(() => {
    return fetchAndUpdate(true);
  }, []);

  const dismissToast = useCallback((toastId) => {
    sharedState = {
      ...sharedState,
      toasts: sharedState.toasts.filter((t) => t.id !== toastId),
    };
    notifyListeners();
  }, []);

  return {
    ...state,
    now,
    refetch,
    dismissToast,
  };
}

export default useStatusWartel;
