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
  AlertCircle
} from 'lucide-react';
import { getTransactionById } from '../../services/balanceService';
import { logout } from '../../services/api';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trx, setTrx] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true);
      try {
        const data = await getTransactionById(id);
        setTrx(data);
      } catch (err) {
        console.log('[TransactionDetail] Gagal memuat detail transaksi:', err);
        if (err?.status === 401) {
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

  const handleDownloadStruk = () => {
    if (!trx) {
      setToastMsg('Fitur ini belum tersedia di sistem backend');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    const textContent = `
==================================================
           PASCALL AUDIT TRANSACTION RECEIPT
==================================================
ID Transaksi     : ${trx.id}
Status           : ${trx.status}
Waktu            : ${trx.date ? new Date(trx.date).toLocaleString('id-ID') : '-'} WIB
Nama WBP         : ${trx.inmateName} (${trx.inmateId})
Kategori         : ${trx.category || 'Panggilan'}
Keterangan       : ${trx.description || '-'}
Petugas / Sistem : ${trx.officerName || 'Sistem (Otomatis)'}
Metode           : ${trx.method || 'Potong Saldo'}
--------------------------------------------------
Nominal Mutasi   : -${formatCurrency(trx.amount)}
Saldo Sebelumnya : ${formatCurrency(trx.balanceBefore)}
Saldo Sesudah    : ${formatCurrency(trx.balanceAfter)}
--------------------------------------------------
Catatan: Dokumen transaksi terenkripsi & sah (Immutable Ledger)
PasCall Management System
==================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk_Audit_${trx.id}.txt`;
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
  const categoryLabel = trx.category || 'Panggilan';

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
            Data ini merupakan catatan mutasi pemakaian saldo permanen yang sudah disahkan ke buku besar sistem. Data tidak dapat diedit, diubah, maupun dihapus untuk menjamin integritas jejak audit Laporan Keuangan PasCall.
          </p>
        </div>
      </div>

      {/* Receipt View Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Receipt Header */}
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <ShieldAlert className="w-[300px] h-[300px]" />
          </div>
          
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
            
            <h2 className="text-3xl font-black text-rose-600 mb-2">-{formatCurrency(trx.amount)}</h2>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                MUTASI {trx.status ? trx.status.toUpperCase() : 'BERHASIL'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                categoryLabel === 'Panggilan' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {categoryLabel === 'Panggilan' ? <PhoneCall className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                {categoryLabel}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center text-slate-600 text-sm font-medium">
              <span className="flex items-center gap-1.5 justify-center"><Fingerprint className="w-4 h-4 text-slate-400" /> {trx.id}</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5 justify-center"><Calendar className="w-4 h-4 text-slate-400" /> {trx.date ? new Date(trx.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'} WIB</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5 justify-center"><BadgeDollarSign className="w-4 h-4 text-slate-400" /> {trx.method || 'Potong Saldo'}</span>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left Col: Narapidana & Balance */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Warga Binaan (WBP)</h3>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{trx.inmateName}</h4>
                    <p className="text-slate-500 font-mono text-sm mt-0.5">{trx.inmateId}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Mutasi Saldo</h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Keterangan Transaksi</span>
                    <span className="text-slate-800 font-semibold text-right max-w-[200px] truncate" title={trx.description}>{trx.description || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Saldo Sebelum</span>
                    <span className="text-slate-700 font-semibold">{formatCurrency(trx.balanceBefore)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Nominal Pemakaian</span>
                    <span className="text-rose-600 font-bold">-{formatCurrency(trx.amount)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-800 font-bold">Saldo Akhir</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(trx.balanceAfter)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Officer & Audit */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Diproses Oleh</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    {trx.officerName ? <User className="w-5 h-5 text-primary" /> : <Cpu className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{trx.officerName || 'Sistem (Otomatis)'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{trx.officerName ? 'Petugas' : 'Modul Otomasi Bilik Panggilan'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Verifikasi Sistem</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium">Timestamp Sistem</span>
                    <span className="text-sm font-mono text-slate-800">{trx.date || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium">Status Ledger</span>
                    <span className="text-sm font-mono text-slate-800">Verified & Recorded</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Receipt Footer */}
        <div className="bg-slate-800 text-slate-400 p-4 text-center text-xs font-mono">
          PASCALL SECURE LEDGER SYSTEM • VERIFIED RECORD
        </div>
      </div>
    </div>
  );
};

export default Detail;
