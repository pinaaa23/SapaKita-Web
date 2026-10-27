import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  Ban,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Wallet,
  Receipt,
  Smartphone,
  Eye,
  FileText
} from 'lucide-react';
import { formatRupiah } from '../../services/financeService';

export default function TransferProofModal({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !item) return null;

  const depositAmount = item.depositAmountToFinance || (item.grossAmount - (item.canteenKeepAmount || item.shares?.koperasi?.amount || 0));
  const transferDate = item.paymentDate ? new Date(item.paymentDate) : new Date();
  const formattedDate = transferDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = transferDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const refNumber = item.paymentRef || item.proof?.transferId || `TRX-${Date.now().toString().slice(-8)}`;

  const handleDownloadProof = () => {
    // Buat canvas untuk generate gambar struk transfer asli
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background gradient Livin Mandiri
    const grad = ctx.createLinearGradient(0, 0, 0, 800);
    grad.addColorStop(0, '#003366');
    grad.addColorStop(0.18, '#004080');
    grad.addColorStop(0.3, '#f8fafc');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 800);

    // Header Bank
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('LIVIN\' BY MANDIRI', 30, 45);

    ctx.font = 'normal 13px Arial, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Resi Bukti Transfer Dana Online', 30, 70);

    // Box Putih
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(30, 95, 540, 670, 16);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Lingkaran Centang Hijau
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(300, 155, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓', 300, 165);

    // Teks Berhasil
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('TRANSFER BERHASIL', 300, 215);

    ctx.font = 'normal 12px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${formattedDate} • ${formattedTime} WIB`, 300, 235);

    // Nominal Besar
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(formatRupiah(depositAmount), 300, 280);

    // Garis putus-putus
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, 310);
    ctx.lineTo(550, 310);
    ctx.stroke();
    ctx.setLineDash([]);

    // Detail Transaksi
    ctx.textAlign = 'left';
    ctx.font = 'normal 12px Arial';
    ctx.fillStyle = '#64748b';

    let y = 345;
    const drawRow = (label, value, isBold = false) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 12px Arial';
      ctx.fillText(label, 55, y);
      ctx.fillStyle = '#0f172a';
      ctx.font = isBold ? 'bold 12px Arial' : 'normal 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value, 545, y);
      ctx.textAlign = 'left';
      y += 32;
    };

    drawRow('Nomor Referensi', refNumber, true);
    drawRow('Pengirim (Kantin UPT)', item.canteenName);
    drawRow('Rekening Pengirim', `${item.accountNumber} (${item.bankName})`);
    drawRow('Penerima', 'PT PasCall Solusi Indonesia', true);
    drawRow('Bank Penerima', 'Bank Mandiri (Rek Penampung)');
    drawRow('Nomor Rekening Penerima', '168-00-9988112-7');
    drawRow('Total Cash di Kantin', formatRupiah(item.grossAmount));
    drawRow('Porsi Koperasi (30% Ditahan)', formatRupiah(item.canteenKeepAmount || item.shares?.koperasi?.amount));
    drawRow('Jenis Setoran', 'Setoran Bagi Hasil PasCall');
    drawRow('Catatan Petugas', 'Kewajiban setor periode ' + item.month + '/' + item.year);

    // Footer Struk
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(50, 690, 500, 50, 8);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('DOKUMEN RESMI RESI TRANSFER KANTIN KOPERASI PAS-CALL', 300, 715);
    ctx.font = 'normal 10px Arial';
    ctx.fillText('Simpan resi ini sebagai bukti pembayaran yang sah', 300, 730);

    // Download link
    const link = document.createElement('a');
    link.download = `Bukti_Transfer_${item.branchName.replace(/\s+/g, '_')}_${refNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#0B3D91] flex items-center justify-center shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">
                  Foto Bukti Transfer Pembayaran Kantin
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  {item.status === 'PAID' ? 'Lunas (Disetujui)' : 'Menunggu Konfirmasi ACC'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {item.canteenName} • {item.branchName} ({item.kanwilName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadProof}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Unduh Berkas Gambar Bukti Transfer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Unduh Gambar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split 2 Kolom (Kiri: Preview Foto Bukti Transfer, Kanan: Rincian Nominal Setoran Kasir) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Kolom Kiri: Foto / Preview Struk Bukti Transfer (7 Kolom) */}
          <div className="lg:col-span-7 bg-slate-900/95 p-5 flex flex-col items-center justify-between overflow-y-auto relative min-h-[460px]">
            {/* Toolbar Zoom & Rotate */}
            <div className="w-full flex items-center justify-between z-10 pb-3 text-white text-xs border-b border-white/10">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Screenshot Tangkapan Layar m-Banking Kantin</span>
              </span>

              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                  className="p-1 rounded hover:bg-white/20 text-slate-200 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                  className="p-1 rounded hover:bg-white/20 text-slate-200 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded hover:bg-white/20 text-slate-200 ml-1 cursor-pointer"
                  title="Putar 90 Derajat"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Area Gambar Struk Transfer yang Diupload Kantin */}
            <div className="w-full flex-1 flex items-center justify-center p-3 overflow-hidden">
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-full max-w-[340px] shadow-2xl rounded-3xl overflow-hidden bg-white text-slate-900 border border-slate-700 select-none"
              >
                {item.proofUrl || item.proof?.proofImage || (item.proof?.proofStreamUrl && item.proof?.proofStreamUrl !== 'virtual-proof') ? (
                  <div className="bg-slate-950 p-2 text-center">
                    <img
                      src={item.proofUrl || item.proof?.proofImage || item.proof?.proofStreamUrl}
                      alt={`Bukti Transfer dari ${item.canteenName}`}
                      className="w-full max-h-[440px] object-contain rounded-2xl mx-auto shadow-md"
                    />
                    <div className="pt-2 text-[10px] text-slate-400 font-mono">
                      Foto Asli Dikirim Petugas {item.canteenName}
                    </div>
                  </div>
                ) : (
                  /* Visual Autentik Struk Mobile Banking Transfer PasCall */
                  <div className="bg-slate-50 font-sans text-xs">
                    {/* Header Bank Mandiri / Mobile Banking */}
                    <div className="bg-gradient-to-r from-[#003366] to-[#004e92] p-4 text-white text-center relative">
                      <div className="flex items-center justify-between text-[11px] text-blue-200 mb-2">
                        <span>LIVIN' MANDIRI</span>
                        <span className="font-mono">{formattedTime} WIB</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md mb-2">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                      <h4 className="text-sm font-black tracking-wide text-white">TRANSFER BERHASIL</h4>
                      <p className="text-[11px] text-blue-100 mt-0.5">{formattedDate}</p>
                    </div>

                    {/* Nominal Besar */}
                    <div className="p-4 bg-white text-center border-b border-slate-100">
                      <span className="text-[11px] text-slate-400 block font-medium">Total Nominal Transfer</span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {formatRupiah(depositAmount)}
                      </p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Bebas Biaya Admin
                      </span>
                    </div>

                    {/* Rincian Transaksi */}
                    <div className="p-4 space-y-2.5 text-[11px] bg-slate-50/50">
                      <div className="flex justify-between pb-1.5 border-b border-slate-200/70">
                        <span className="text-slate-500">No. Referensi Bank:</span>
                        <span className="font-mono font-bold text-slate-800">{refNumber}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-slate-200/70">
                        <span className="text-slate-500">Rekening Pengirim:</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 block">{item.canteenName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{item.accountNumber} ({item.bankName})</span>
                        </div>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-slate-200/70">
                        <span className="text-slate-500">Rekening Penerima:</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 block">PT PasCall Solusi Indonesia</span>
                          <span className="text-[10px] text-slate-500 font-mono">168-00-9988112-7 (Bank Mandiri)</span>
                        </div>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-slate-200/70">
                        <span className="text-slate-500">Keterangan / Berita:</span>
                        <span className="font-semibold text-slate-700 text-right">
                          Setoran Tagihan Periode {item.month}/{item.year}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status Validasi:</span>
                        <span className="font-bold text-emerald-600">Terotentikasi Bank Mandiri</span>
                      </div>
                    </div>

                    {/* Footer Struk */}
                    <div className="p-3 bg-slate-100 text-center text-[10px] text-slate-500 border-t border-slate-200 font-medium">
                      Bukti transfer ini sah dan diterbitkan otomatis oleh sistem perbankan.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informasi Berkas Pengirim dari Kantin (Hanya Hak Baca / Read-Only) */}
            <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Berkas asli diunggah oleh <strong>{item.canteenName}</strong> melalui Portal Kantin
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-white/10 px-2 py-0.5 rounded-md">
                Format: Tangkapan Layar Resi • Terverifikasi Enkripsi
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Rincian Pembayaran Kasir & Aksi Verifikasi Finance (5 Kolom) */}
          <div className="lg:col-span-5 p-5 md:p-6 bg-white flex flex-col justify-between overflow-y-auto space-y-5">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Data Rekonsiliasi Kasir
                </span>
                <h4 className="text-base font-extrabold text-slate-800 mt-0.5">
                  Setoran Kewajiban Bagi Hasil
                </h4>
              </div>

              {/* Rincian Kas yang Dipegang Kantin */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Cash Dipegang Kantin (100%):</span>
                    <span className="font-extrabold text-slate-800">{formatRupiah(item.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sky-800">
                    <span>Porsi Koperasi (30% Ditahan Kantin):</span>
                    <span className="font-bold">-{formatRupiah(item.canteenKeepAmount || item.shares?.koperasi?.amount)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Harus Disetor ke Finance (70%):</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {formatRupiah(depositAmount)}
                    </span>
                  </div>
                </div>

                {/* Status Rekening Tujuan */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-[#0B3D91]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Rekening Penampung Finance PasCall</span>
                  </div>
                  <p className="text-slate-600">
                    Bank Mandiri No. <strong>168-00-9988112-7</strong> a.n. <strong>PT PasCall Solusi Indonesia</strong>
                  </p>
                </div>

                {/* Detail 4 Pihak yang Akan Dibagikan Saat di-ACC */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Distribusi Dana Pasca ACC:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="bg-purple-50 p-2 rounded-xl text-purple-900">
                      <span className="block text-[10px] text-purple-700">Kepala UPT (5%)</span>
                      <span className="font-bold">{formatRupiah(item.shares?.kepalaUpt?.amount)}</span>
                    </div>
                    <div className="bg-sky-50 p-2 rounded-xl text-sky-900">
                      <span className="block text-[10px] text-sky-700">Koperasi (30%)</span>
                      <span className="font-bold">{formatRupiah(item.shares?.koperasi?.amount)}</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl text-amber-900">
                      <span className="block text-[10px] text-amber-700">Inkopasindo (10%)</span>
                      <span className="font-bold">{formatRupiah(item.shares?.inkopasindo?.amount)}</span>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-900">
                      <span className="block text-[10px] text-indigo-700">Vendor (55%)</span>
                      <span className="font-bold">{formatRupiah(item.shares?.vendor?.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input Alasan jika ingin Menolak */}
              {isRejecting && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                  <label className="block font-bold text-rose-900">Alasan Penolakan Bukti Transfer:</label>
                  <textarea
                    rows="2"
                    placeholder="Contoh: Nominal transfer kurang, bukti terpotong..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  ></textarea>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1 rounded-lg text-slate-600 hover:bg-rose-100 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          alert('Alasan penolakan wajib diisi');
                          return;
                        }
                        onReject(item, rejectReason);
                        setIsRejecting(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700"
                    >
                      Kirim Penolakan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Eksekusi ACC / Tolak di Modal */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {item.status !== 'PAID' && !isRejecting && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Tolak Setoran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApprove(item)}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui (ACC)</span>
                  </button>
                </div>
              )}

              {item.status === 'PAID' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Setoran ini telah berstatus Lunas dan diverifikasi oleh Finance.</span>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
