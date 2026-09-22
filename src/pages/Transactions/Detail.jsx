import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ShieldAlert, User, CheckCircle2, XCircle, MapPin, BadgeDollarSign, Wallet, Calendar, Fingerprint } from 'lucide-react';
import { mockTransactions, mockBranches, mockUsers } from '../../services/mockData';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const trx = mockTransactions.find(t => t.id === id);

  if (!trx) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Transaksi Tidak Ditemukan</h2>
        <p className="text-slate-500 mb-6">ID {id} tidak terdaftar di buku besar sistem.</p>
        <button onClick={() => navigate('/transactions')} className="px-4 py-2 bg-primary text-white rounded-lg">Kembali ke Riwayat</button>
      </div>
    );
  }

  const branchName = mockBranches.find(b => b.id === trx.branchId)?.name || 'Unknown Branch';
  const isSuccess = trx.status === 'Berhasil';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <Link to="/transactions" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Riwayat</span>
        </Link>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm">
          <Download className="w-4 h-4" />
          Download Struk Audit
        </button>
      </div>

      {/* Immutable Warning Badge */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-800">Immutable Ledger Record</h4>
          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
            Data ini merupakan catatan transaksi permanen yang sudah disahkan ke buku besar sistem. Data tidak dapat diedit, diubah, maupun dihapus untuk menjamin integritas jejak audit Laporan Keuangan PasCall.
          </p>
        </div>
      </div>

      {/* Receipt View Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Receipt Header */}
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle watermark background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <ShieldAlert className="w-[300px] h-[300px]" />
          </div>
          
          <div className="relative z-10">
            {isSuccess ? (
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8" />
              </div>
            )}
            
            <h2 className="text-3xl font-black text-slate-800 mb-2">{formatCurrency(trx.amount)}</h2>
            <p className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold mb-6 ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              TRANSAKSI {trx.status.toUpperCase()}
            </p>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center text-slate-600 text-sm font-medium">
              <span className="flex items-center gap-1.5 justify-center"><Fingerprint className="w-4 h-4 text-slate-400" /> {trx.id}</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5 justify-center"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(trx.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5 justify-center"><BadgeDollarSign className="w-4 h-4 text-slate-400" /> Metode {trx.method}</span>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left Col: Narapidana & Balance */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Penerima Saldo</h3>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{trx.inmateName}</h4>
                    <p className="text-slate-500 font-mono text-sm mt-0.5">{trx.inmateId}</p>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {branchName}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Mutasi Saldo</h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Saldo Sebelum</span>
                    <span className="text-slate-700 font-semibold">{formatCurrency(trx.balanceBefore)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Nominal Top-up</span>
                    <span className={`${isSuccess ? 'text-green-600' : 'text-red-600'} font-bold`}>{isSuccess ? '+' : ''} {formatCurrency(trx.amount)}</span>
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
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{trx.officerName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Petugas Kantin</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Verifikasi Sistem</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium">Timestamp Sistem</span>
                    <span className="text-sm font-mono text-slate-800">{trx.date}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium">Kode Referensi Gateway</span>
                    <span className="text-sm font-mono text-slate-800">REF-{trx.id.replace('TRX-', '')}-{Date.parse(trx.date).toString().slice(-6)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium">Node Validasi</span>
                    <span className="text-sm font-mono text-slate-800">pascall-core-node-03</span>
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
