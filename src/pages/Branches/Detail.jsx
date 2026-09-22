import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, AlertTriangle, PhoneCall, Wallet, Users, MapPin, Building2, Phone } from 'lucide-react';
import { mockBranches, mockUsers, mockCalls, mockTransactions } from '../../services/mockData';
import StatCard from '../../components/StatCard';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const branch = mockBranches.find(b => b.id === id);
  const branchUsers = mockUsers.filter(u => u.branchId === id);
  const branchCalls = mockCalls.filter(c => c.branchId === id);
  const branchTransactions = mockTransactions.filter(t => t.branchId === id && t.status === 'Success');

  if (!branch) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700">Cabang tidak ditemukan</h2>
        <button onClick={() => navigate('/branches')} className="mt-4 text-primary hover:underline">Kembali ke daftar cabang</button>
      </div>
    );
  }

  const totalCalls = branchCalls.length;
  const totalRevenue = branchTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/branches"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{branch.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                branch.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {branch.status === 'Active' ? 'Aktif' : 'Nonaktif'}
              </span>
              <span className="text-slate-500 text-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {branch.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to={`/branches/${id}/edit`}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Edit className="w-4 h-4" /> Edit Cabang
          </Link>
          <button className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium flex items-center gap-2 transition-all">
            <AlertTriangle className="w-4 h-4" /> Nonaktifkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard 
              title="Total Panggilan (Cabang)" 
              value={totalCalls} 
              icon={PhoneCall} 
              color="blue"
            />
            <StatCard 
              title="Total Revenue (Cabang)" 
              value={formatCurrency(totalRevenue)} 
              icon={Wallet} 
              color="green"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Informasi Operasional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Alamat Lengkap</p>
                <p className="text-slate-800 font-medium">{branch.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Phone className="w-4 h-4" /> Kontak Cabang</p>
                <p className="text-slate-800 font-medium">{branch.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Users className="w-4 h-4" /> Jumlah Narapidana (WBP)</p>
                <p className="text-slate-800 font-medium">{new Intl.NumberFormat('id-ID').format(branch.inmateCount)} Orang</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Users className="w-4 h-4" /> Kapasitas Maksimal</p>
                <p className="text-slate-800 font-medium">{new Intl.NumberFormat('id-ID').format(branch.capacity)} Orang</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-800">Petugas Cabang</h3>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">{branchUsers.length}</span>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {branchUsers.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {branchUsers.map(user => (
                  <li key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{user.role}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada petugas terdaftar di cabang ini.
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <button className="w-full py-2 text-sm text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors">
              + Tambah Petugas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
