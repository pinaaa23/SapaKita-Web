import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock, Image as ImageIcon, SearchX, Download } from 'lucide-react';
import Modal from '../../components/Modal';

const mockContacts = Array.from({ length: 20 }).map((_, i) => {
  const statuses = ['Pending', 'Approved', 'Rejected'];
  let status = 'Pending';
  let rejectReason = '';
  if (i % 3 === 1) status = 'Approved';
  if (i % 3 === 2) {
    status = 'Rejected';
    rejectReason = 'Foto KTP tidak terbaca / buram';
  }
  
  return {
    id: `CNT${1000 + i}`,
    napiName: `WBP-00${(i % 5) + 1} (${['Budi', 'Joko', 'Andi', 'Rudi', 'Tono'][i % 5]})`,
    contactName: ['Siti', 'Ani', 'Dewi', 'Rini', 'Lestari'][i % 5] + ` (Keluarga)`,
    relation: ['Istri', 'Ibu', 'Adik', 'Anak', 'Kakak'][i % 5],
    phone: `0812345678${i}`,
    status: status,
    rejectReason: rejectReason,
    date: new Date(Date.now() - i * 86400000).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  };
});

const Contacts = () => {
  const [contacts, setContacts] = useState(mockContacts);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const filteredContacts = contacts.filter(c => {
    const matchesStatus = filterStatus === 'All' ? true : c.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
                          c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.napiName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (contact) => {
    setSelectedContact(contact);
    setIsApproveModalOpen(true);
  };

  const handleReject = (contact) => {
    setSelectedContact(contact);
    setRejectReason('');
    setRejectError('');
    setIsRejectModalOpen(true);
  };

  const handleViewKTP = (contact) => {
    setSelectedContact(contact);
    setIsImageModalOpen(true);
  };

  const confirmApprove = () => {
    setContacts(contacts.map(c => 
      c.id === selectedContact.id ? { ...c, status: 'Approved' } : c
    ));
    // Close modal is handled by Modal component since we return implicitly (undefined)
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Alasan penolakan tidak boleh kosong.');
      return false; // Prevent Modal from closing
    }
    setContacts(contacts.map(c => 
      c.id === selectedContact.id ? { ...c, status: 'Rejected', rejectReason: rejectReason } : c
    ));
    return true; // Modal can close
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama/nomor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    filterStatus === status 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {status === 'All' ? 'Semua' : status}
                </button>
              ))}
            </div>
            
            <button className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-xs cursor-pointer ml-auto md:ml-2">
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tgl Diajukan</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Narapidana</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontak & Hubungan</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">KTP</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-600">{contact.date}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-slate-800">{contact.napiName.split(' (')[0]}</div>
                      <div className="text-xs text-slate-500">{contact.napiName.split(' (')[1].replace(')', '')}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-slate-800">{contact.contactName}</div>
                      <div className="text-xs text-slate-500">{contact.relation} • {contact.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        type="button"
                        onClick={() => handleViewKTP(contact)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200 transition-colors border border-slate-200"
                      >
                        <ImageIcon className="w-3 h-3" /> Foto KTP
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        contact.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        contact.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {contact.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {contact.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {contact.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {contact.status}
                      </span>
                      {contact.status === 'Rejected' && contact.rejectReason && (
                        <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={contact.rejectReason}>
                          Alasan: {contact.rejectReason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {contact.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={() => handleApprove(contact)}
                            className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-medium transition-colors border border-green-200"
                          >
                            Setujui
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleReject(contact)}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors border border-red-200"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-medium text-slate-600">Tidak ada kontak ditemukan</p>
                      <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Safety */}
        {filteredContacts.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600 bg-slate-50/50">
            <div>Menampilkan 1-{filteredContacts.length} dari {filteredContacts.length} kontak</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 disabled:opacity-50 transition-colors">Sebelumnya</button>
              <button type="button" className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-medium shadow-sm">1</button>
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 disabled:opacity-50 transition-colors">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <Modal 
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={confirmApprove}
        title="Setujui Kontak"
        message={`Apakah Anda yakin ingin menyetujui kontak ${selectedContact?.contactName} untuk narapidana ${selectedContact?.napiName}?`}
        confirmText="Setujui"
      />

      {/* Reject Modal */}
      <Modal 
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={confirmReject}
        title="Tolak Kontak"
        confirmText="Tolak Kontak"
        isDanger={true}
      >
        <div className="mb-4">
          <p className="text-slate-600 text-sm mb-4">
            Berikan alasan penolakan untuk kontak <strong>{selectedContact?.contactName}</strong>:
          </p>
          <textarea 
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (e.target.value.trim()) setRejectError('');
            }}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 min-h-[100px] transition-colors ${
              rejectError 
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
            }`}
            placeholder="Contoh: Foto KTP tidak jelas / bukan keluarga inti..."
            required
          ></textarea>
          {rejectError && <p className="text-red-500 text-xs mt-1 font-medium">{rejectError}</p>}
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`Foto KTP - ${selectedContact?.contactName}`}
        // We only want a close button, so we don't pass onConfirm, 
        // or we just pass a dummy confirm text if Modal requires it, but Modal handles missing onConfirm.
        confirmText="Tutup"
        onConfirm={() => setIsImageModalOpen(false)} // Just closes it
      >
        <div className="flex justify-center items-center p-4 bg-slate-100 rounded-lg mb-2">
          {/* Dummy image representation */}
          <div className="w-full max-w-sm aspect-[1.6/1] bg-slate-300 rounded-lg border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500">
            <ImageIcon className="w-12 h-12 mb-2 text-slate-400" />
            <p className="font-semibold">Simulasi Foto KTP</p>
            <p className="text-xs">Identitas: {selectedContact?.contactName}</p>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Contacts;
