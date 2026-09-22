import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, Map, Phone, Users } from 'lucide-react';

const Create = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    capacity: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate save and redirect
    alert('Cabang berhasil ditambahkan!');
    navigate('/branches');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/branches"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tambah Cabang Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Daftarkan rutan atau lapas baru ke dalam sistem PasCall.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Cabang */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nama Cabang (Lapas/Rutan)</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Lapas Kelas I Cipinang"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Kota/Lokasi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kota / Wilayah</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Jakarta Timur"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nomor Telepon Kontak</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 021-8190001"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Kapasitas Napi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Kapasitas Maksimal (WBP)</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="number" 
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Contoh: 2500"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Alamat Lengkap</label>
              <div className="relative">
                <Map className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Alamat lengkap lapas/rutan..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link 
              to="/branches"
              className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-accent-DEFAULT hover:bg-accent-hover text-white rounded-lg font-medium shadow-sm shadow-accent-DEFAULT/20 transition-all"
            >
              Simpan Cabang
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Create;
