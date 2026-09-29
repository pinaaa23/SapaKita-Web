import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Filter, 
  ShieldOff, 
  ShieldCheck, 
  Download,
  Building2,
  Users,
  ChevronDown,
  X
} from 'lucide-react';
import { mockUsers, mockBranches } from '../../services/mockData';
import { exportToCSV } from '../../utils/exportUtils';
import Modal from '../../components/Modal';

const List = () => {
  const navigate = useNavigate();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Local state initialized with live mockUsers
  const [users, setUsers] = useState(() => [...mockUsers]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sync with mockUsers whenever component is focused or mounted
  useEffect(() => {
    setUsers([...mockUsers]);
  }, []);

  // Derived data
  const branchesMap = mockBranches.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                          user.name.toLowerCase().includes(searchLower) || 
                          user.email.toLowerCase().includes(searchLower) ||
                          (user.phone && user.phone.includes(searchLower));
    const matchesBranch = branchFilter === 'All' || user.branchId === branchFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const confirmToggleStatus = () => {
    if (!selectedUser) return;
    
    const newStatus = selectedUser.status === 'Active' ? 'Suspended' : 'Active';
    
    // Mutate source mockUsers immediately
    const userIndex = mockUsers.findIndex(u => u.id === selectedUser.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        status: newStatus
      };
    }

    // Mutate local state
    setUsers(users.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, status: newStatus };
      }
      return u;
    }));

    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleExport = () => {
    const exportData = filteredUsers.map(u => ({
      'ID Pengguna': u.id,
      'Nama Lengkap': u.name,
      'Email': u.email,
      'Telepon': u.phone,
      'Role': u.role,
      'Penempatan Cabang': branchesMap[u.branchId] || u.branchId,
      'Status': u.status === 'Active' ? 'Aktif' : 'Suspended',
      'Tanggal Bergabung': u.joinDate
    }));
    exportToCSV(exportData, `Daftar_Pengguna_PasCall_${new Date().toISOString().split('T')[0]}`);
  };

  const hasActiveFilters = searchTerm !== '' || branchFilter !== 'All' || statusFilter !== 'All';

  const resetFilters = () => {
    setSearchTerm('');
    setBranchFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-5">
      {/* Modern & Clean Control Bar (Redesigned from Lampiran 2) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
        {/* Row 1: Search & Primary Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama, email, atau nomor HP pengguna..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Export & Tambah Pengguna */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <button 
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
              title="Export data pengguna ke file CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> 
              <span>Export</span>
            </button>

            <Link 
              to="/users/create" 
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all text-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Filter Toolbar & Active Counter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-0.5">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>
            {/* Cabang Filter Dropdown */}
            <div className="relative">
              <select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs font-semibold appearance-none cursor-pointer transition-all ${
                  branchFilter !== 'All' 
                    ? 'bg-blue-50/90 border-blue-200 text-primary font-bold shadow-2xs' 
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <option value="All">Semua Cabang</option>
                {mockBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Segmented Tabs */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
              {[
                { key: 'All', label: 'Semua Status' },
                { key: 'Active', label: 'Aktif' },
                { key: 'Suspended', label: 'Suspended' }
              ].map(item => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setStatusFilter(item.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === item.key 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Result Count Info */}
          <div className="text-slate-400 text-[11px] font-medium ml-auto">
            Menampilkan <strong className="text-slate-700 font-bold">{filteredUsers.length}</strong> dari {mockUsers.length} pengguna
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                <th className="px-6 py-4 font-bold">Role & Penempatan</th>
                <th className="px-6 py-4 font-bold">Kontak</th>
                <th className="px-6 py-4 font-bold">Tanggal Gabung</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{user.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {user.role}
                        </span>
                        <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {branchesMap[user.branchId] || user.branchId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-semibold">{user.phone || '-'}</p>
                      <p className="text-slate-500 text-[11px]">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(user.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        user.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {user.status === 'Active' ? 'Aktif' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Pengguna"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                          className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            user.status === 'Active' 
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50' 
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={user.status === 'Active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {user.status === 'Active' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700 text-sm">Tidak ada data pengguna yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter Anda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination & Status Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 bg-slate-50/50 gap-2">
          <div>Menampilkan <strong className="text-slate-800">{filteredUsers.length}</strong> dari {mockUsers.length} akun terdaftar</div>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors" disabled>
              Sebelumnya
            </button>
            <button className="px-3 py-1.5 border border-slate-200/80 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40 font-medium transition-colors" disabled>
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmToggleStatus}
        title={selectedUser?.status === 'Active' ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
        message={
          selectedUser?.status === 'Active'
            ? `Apakah Anda yakin ingin menonaktifkan akun ${selectedUser?.name}? Petugas ini tidak akan bisa login ke dalam sistem PasCall sampai diaktifkan kembali.`
            : `Apakah Anda yakin ingin mengaktifkan kembali akun ${selectedUser?.name}? Petugas dapat kembali login menggunakan email dan password terdaftar.`
        }
        confirmText={selectedUser?.status === 'Active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={selectedUser?.status === 'Active'}
      />
    </div>
  );
};

export default List;
