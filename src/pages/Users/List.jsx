import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Filter, ShieldOff, ShieldCheck } from 'lucide-react';
import { mockUsers, mockBranches } from '../../services/mockData';
import Modal from '../../components/Modal';

const List = () => {
  const navigate = useNavigate();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // State for local users to handle suspension toggles visually
  const [users, setUsers] = useState(mockUsers);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Derived data
  const branchesMap = mockBranches.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesBranch = branchFilter === 'All' || user.branchId === branchFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const confirmToggleStatus = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola akses Admin Cabang dan Petugas Kantin.</p>
        </div>
        <Link 
          to="/users/create" 
          className="bg-accent-DEFAULT hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg font-medium shadow-sm shadow-accent-DEFAULT/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pengguna</span>
        </Link>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between gap-4">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari nama atau email pengguna..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent focus:outline-none flex-1 font-medium"
            >
              <option value="All">Semua Role</option>
              <option value="Admin Cabang">Admin Cabang</option>
              <option value="Petugas Kantin">Petugas Kantin</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full sm:w-auto">
            <select 
              value={branchFilter} 
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent focus:outline-none flex-1 font-medium"
            >
              <option value="All">Semua Cabang</option>
              {mockBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full sm:w-auto">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none flex-1 font-medium"
            >
              <option value="All">Semua Status</option>
              <option value="Active">Aktif</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                <th className="px-6 py-4 font-medium">Role & Cabang</th>
                <th className="px-6 py-4 font-medium">Kontak</th>
                <th className="px-6 py-4 font-medium">Tanggal Gabung</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{user.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'Admin Cabang' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {user.role}
                        </span>
                        <span className="text-slate-500 text-xs">{branchesMap[user.branchId]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-medium">{user.phone}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(user.joinDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status === 'Active' ? 'Aktif' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Pengguna"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'Active' 
                              ? 'text-red-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                          }`}
                          title={user.status === 'Active' ? 'Suspend Akun' : 'Aktifkan Akun'}
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
                    Tidak ada data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <div>Menampilkan {filteredUsers.length} pengguna</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>Sebelumnya</button>
            <button className="px-3 py-1 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>Selanjutnya</button>
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
            ? `Apakah Anda yakin ingin menonaktifkan akun ${selectedUser?.name}? Pengguna ini tidak akan bisa login ke dalam sistem PasCall.`
            : `Apakah Anda yakin ingin mengaktifkan kembali akun ${selectedUser?.name}?`
        }
        confirmText={selectedUser?.status === 'Active' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={selectedUser?.status === 'Active'}
      />
    </div>
  );
};

export default List;
