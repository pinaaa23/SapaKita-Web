import React from 'react';
import { CheckCircle2, PhoneOff, PhoneMissed } from 'lucide-react';

/**
 * Normalisasi status panggilan ke format standar ('Answered' | 'Rejected' | 'Missed' | 'Busy')
 */
export const normalizeCallStatus = (status, rawStatus) => {
  const combined = `${status || ''} ${rawStatus || ''}`.toUpperCase();

  // Prioritaskan Ditolak/Rejected terlebih dahulu
  if (
    combined.includes('REJECT') ||
    combined.includes('TOLAK') ||
    combined.includes('DECLINE')
  ) {
    return 'Rejected';
  }

  // Panggilan Terjawab (Answered / Connected / Ended dengan durasi)
  if (
    combined.includes('ANSWER') ||
    combined.includes('TERJAWAB') ||
    combined.includes('CONNECTED') ||
    combined.includes('COMPLETED') ||
    combined.includes('ENDED')
  ) {
    return 'Answered';
  }

  // Sibuk
  if (combined.includes('BUSY') || combined.includes('SIBUK')) {
    return 'Busy';
  }

  // Default: Tidak Terjawab
  return 'Missed';
};

/**
 * Label bahasa Indonesia untuk status panggilan
 */
export const getCallStatusLabel = (status, rawStatus) => {
  const norm = normalizeCallStatus(status, rawStatus);
  switch (norm) {
    case 'Answered':
      return 'Terjawab';
    case 'Rejected':
      return 'Ditolak';
    case 'Busy':
      return 'Sibuk';
    case 'Missed':
    default:
      return 'Tidak Terjawab';
  }
};

/**
 * Komponen Badge Status Panggilan
 * - Terjawab: Hijau cerah (CheckCircle2)
 * - Ditolak: Merah cerah (PhoneOff)
 * - Tidak Terjawab: Amber / Oranye cerah (PhoneMissed)
 */
export const CallStatusBadge = ({ status, rawStatus, className = '' }) => {
  const norm = normalizeCallStatus(status, rawStatus);

  if (norm === 'Answered') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs ${className}`}
        title="Status: Terjawab"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Terjawab</span>
      </span>
    );
  }

  if (norm === 'Rejected') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs ${className}`}
        title="Status: Panggilan Ditolak"
      >
        <PhoneOff className="w-3 h-3 text-rose-600 shrink-0" />
        <span>Ditolak</span>
      </span>
    );
  }

  // Missed / Busy (Tidak Terjawab)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs ${className}`}
      title={norm === 'Busy' ? 'Status: Sibuk' : 'Status: Tidak Terjawab'}
    >
      <PhoneMissed className="w-3 h-3 text-amber-600 shrink-0" />
      <span>{norm === 'Busy' ? 'Sibuk' : 'Tidak Terjawab'}</span>
    </span>
  );
};

export default {
  normalizeCallStatus,
  getCallStatusLabel,
  CallStatusBadge,
};
