import React from 'react';
import { Globe, Smartphone } from 'lucide-react';

/**
 * Konstanta Jalur Panggilan PasCall
 */
export const CALL_CHANNELS = {
  ALL: 'All',
  WEB: 'web',
  GSM: 'gsm',
};

export const CHANNEL_LABELS = {
  web: 'Web',
  gsm: 'GSM',
};

/**
 * Normalisasi nilai jalur panggilan ke format standar ('web' | 'gsm')
 */
export const normalizeChannel = (val) => {
  if (!val) return 'web';
  const str = String(val).toLowerCase().trim();
  if (str === 'gsm' || str.includes('cellular') || str.includes('phone') || str.includes('pstn') || str.includes('seluler')) {
    return 'gsm';
  }
  return 'web';
};

/**
 * Komponen Badge Jalur Panggilan (Web / GSM)
 * Tampilan pill kecil, font kecil, ikon kecil di kiri
 * - Web: Ikon Globe, warna biru lembut
 * - GSM: Ikon Smartphone, warna oranye lembut
 */
export const CallChannelBadge = ({ channel }) => {
  const norm = normalizeChannel(channel);
  const isWeb = norm === 'web';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border tracking-tight ${
        isWeb
          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
          : 'bg-orange-50 text-orange-700 border-orange-200/80'
      }`}
      title={`Jalur Panggilan: ${isWeb ? 'Web' : 'GSM'}`}
    >
      {isWeb ? (
        <Globe className="w-2.5 h-2.5 text-blue-600 shrink-0" />
      ) : (
        <Smartphone className="w-2.5 h-2.5 text-orange-600 shrink-0" />
      )}
      <span>{isWeb ? 'Web' : 'GSM'}</span>
    </span>
  );
};

export default {
  CALL_CHANNELS,
  CHANNEL_LABELS,
  normalizeChannel,
  CallChannelBadge,
};
