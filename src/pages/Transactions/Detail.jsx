import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  ShieldAlert, 
  User, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  BadgeDollarSign, 
  Wallet, 
  Calendar, 
  Fingerprint,
  PhoneCall,
  ShoppingBag,
  Cpu,
  AlertCircle,
  Ticket,
  Copy,
  Check
} from 'lucide-react';
import { getTransactionById } from '../../services/balanceService';
import { logout } from '../../services/api';
import { USE_MOCK_SUPERADMIN } from '../../services/mockStorage';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trx, setTrx] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true);
      try {
        const data = await getTransactionById(id);
        setTrx(data);
      } catch (err) {
        console.log('[TransactionDetail] Gagal memuat detail transaksi:', err);
        if (err?.status === 401 && !USE_MOCK_SUPERADMIN) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setTrx(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransaction();
  }, [id, navigate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadStruk = () => {
    if (!trx) {
      setToastMsg('Data transaksi tidak tersedia untuk diunduh');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    const textContent = `
==================================================
           SADEWA AUDIT CANTEEN RECEIPT
==================================================
ID Transaksi     : ${trx.id}
Status           : ${trx.status}
Waktu            : ${trx.date ? new Date(trx.date).toLocaleString('id-ID') : '-'} WIB
Petugas Kasir    : ${trx.officerName || 'Petugas Kasir'}

--------------------------------------------------
DATA WARGA BINAAN PEMASYARAKATAN (WBP)
--------------------------------------------------
Nama WBP         : ${trx.inmateName}
Nomor Registrasi : ${trx.inmateId}
Kamar / Blok     : ${trx.inmateBlock || '-'}

--------------------------------------------------
DETAIL VOUCHER KOMUNIKASI
--------------------------------------------------
KODE VOUCHER     : [ ${trx.kodeVoucher} ]
Paket            : ${trx.packageName}
Durasi Panggilan : ${trx.durationMinutes || 0} Menit
Status Voucher   : ${trx.isVoucherUsed ? 'SUDAH DIGUNAKAN' : 'AKTIF / BELUM DIGUNAKAN'}
${trx.voucherUsedAt ? `Digunakan Pada   : ${new Date(trx.voucherUsedAt).toLocaleString('id-ID')} WIB` : ''}

--------------------------------------------------
RINCIAN KEUANGAN & PEMBAYARAN
--------------------------------------------------
Harga DPP        : ${formatCurrency(trx.dpp || 0)}
PPN 11%          : ${formatCurrency(trx.ppn || 0)}
TOTAL PEMBAYARAN : ${formatCurrency(trx.amount)}
Metode Bayar     : ${trx.method || 'Tunai'}
--------------------------------------------------
Catatan: Dokumen transaksi terenkripsi & sah (Immutable Ledger)
Sadewa Management System
==================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk_Audit_${trx.kodeVoucher || trx.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!trx) {
    return (
      <div className="space-y-5 max-w-lg mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Data tidak tersedia</h2>
          <p className="text-xs text-slate-500 mt-1">Informasi detail transaksi dengan ID {id} tidak ditemukan.</p>
          <Link 
            to="/transactions" 
            className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Kembali ke Riwayat Transaksi
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = trx.status === 'Berhasil';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-amber-600 hover:text-amber-800 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <Link to="/transactions" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Riwayat</span>
        </Link>
        <button 
          onClick={handleDownloadStruk}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-xs cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Download Struk Audit
        </button>
      </div>

      {/* Immutable Warning Badge */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-800">Immutable Ledger Record</h4>
          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
            Data ini merupakan catatan transaksi pembelian paket voucher kantin permanen yang sah. Data tidak dapat diubah maupun dimanipulasi untuk menjamin keaslian jejak audit sistem Sadewa.
          </p>
        </div>
      </div>

      {/* Receipt View Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Receipt Header */}
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="relative z-10">
            {isSuccess ? (
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <XCircle className="w-8 h-8" />
              </div>
            )}
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">{formatCurrency(trx.amount)}</h2>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                PEMBELIAN PAKET {trx.status ? trx.status.toUpperCase() : 'BERHASIL'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-primary border border-blue-200">
                <ShoppingBag className="w-3.5 h-3.5" />
                Paket Kantin
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center text-slate-600 text-sm font-medium">
              <span className="flex items-center gap-1.5 justify-center font-mono"><Fingerprint className="w-4 h-4 text-slate-400" /> {trx.id}</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5 justify-center"><Calendar className="w-4 h-4 text-slate-400" /> {trx.date ? new Date(trx.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'} WIB</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5 justify-center"><BadgeDollarSign className="w-4 h-4 text-slate-400" /> {trx.method || 'Tunai'}</span>
            </div>
          </div>
        </div>

        {/* Voucher Code Box */}
        <div className="p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Kode Voucher Panggilan WBP</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black font-mono text-amber-950 tracking-widest">{trx.kodeVoucher}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(trx.kodeVoucher)}
                  className="p-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors cursor-pointer"
                  title="Salin Kode Voucher"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold ${
              trx.isVoucherUsed
                ? 'bg-slate-200 text-slate-700'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
            }`}>
              {trx.isVoucherUsed ? 'Voucher Telah Digunakan' : 'Voucher Aktif (Belum Digunakan)'}
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left Col: Narapidana & Paket */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Warga Binaan (WBP)</h3>
                <div className="flex gap-4 items-start bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{trx.inmateName}</h4>
                    <p className="text-slate-500 font-mono text-xs mt-0.5">NIP: {trx.inmateId}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Kamar: {trx.inmateBlock || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Paket yang Dibeli</h3>
                <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Nama Paket</span>
                    <span className="text-slate-800 font-bold">{trx.packageName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Durasi Bicara</span>
                    <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {trx.durationMinutes || 0} Menit
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                    <span className="text-slate-800 font-semibold">{trx.method || 'Tunai'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Rincian Pembayaran & Kasir */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Petugas Kasir</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{trx.officerName || 'Petugas Kasir'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Kasir Kantin Lapas</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rincian Finansial</h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Harga DPP</span>
                    <span className="text-slate-700 font-semibold">{formatCurrency(trx.dpp || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">PPN 11%</span>
                    <span className="text-slate-700 font-semibold">{formatCurrency(trx.ppn || 0)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-900 font-bold text-xs uppercase tracking-wider">Total Pembayaran</span>
                    <span className="text-xl font-black text-emerald-700">{formatCurrency(trx.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Receipt Footer */}
        <div className="bg-slate-800 text-slate-400 p-4 text-center text-xs font-mono">
          SADEWA SECURE CANTEEN AUDIT SYSTEM • VERIFIED RECORD
        </div>
      </div>
    </div>
  );
};

export default Detail;
