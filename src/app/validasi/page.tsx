'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ValidasiPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Validasi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitStatus, setSubmitStatus] = useState('');

  const [formData, setFormData] = useState({
    nama_validator: '', kode_unik: '', campaign: '',
    tipe_donatur: '', jenis_donasi: '', kategori: '',
    pelaksana_program: '', metode: ''
  });

  // State untuk Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    date: '', nama_donatur: '', keterangan: '', amount: ''
  });
  const [editStatus, setEditStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, resDrops] = await Promise.all([
        fetch('/api/all-finance-data'),
        fetch('/api/dropdown-options')
      ]);
      const data = await resData.json();
      const drops = await resDrops.json();
      
      setDataList(data);
      setDropdowns(drops);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (item: any) => {
    setSelectedItem(item);

    // Jika data sudah tervalidasi, pre-fill form dengan data yang ada
    if (item.status === 'Tervalidasi' && item.validation) {
      setFormData({
        nama_validator: item.validation.nama_validator || '',
        kode_unik: item.validation.kode_unik || '',
        campaign: item.validation.campaign || '',
        tipe_donatur: item.validation.tipe_donatur || '',
        jenis_donasi: item.validation.jenis_donasi || '',
        kategori: item.validation.kategori || '',
        pelaksana_program: item.validation.pelaksana_program || '',
        metode: item.validation.metode || ''
      });
    } else {
      // Kosongkan form untuk data baru
      setFormData({
        nama_validator: '', kode_unik: '', campaign: '',
        tipe_donatur: '', jenis_donasi: '', kategori: '',
        pelaksana_program: '', metode: ''
      });
    }

    setSubmitStatus('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitStatus('⏳ Menyimpan Data...');

    const payload = { ...formData, id: selectedItem.id, row_index: selectedItem.row_index };

    try {
      const res = await fetch('/api/submit-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if(res.ok) {
        setIsModalOpen(false); // Tutup modal otomatis
        await fetchData(); // Refresh tabel agar status berubah jadi Hijau
      }
    } catch (error) {
      setSubmitStatus('❌ Gagal menyimpan.');
    }
  };

  // Handler untuk modal EDIT
  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setEditFormData({
      date: item.date,
      nama_donatur: item.nama_donatur || '',
      keterangan: item.keterangan || '',
      amount: item.amount || ''
    });
    setEditStatus('');
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e: any) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    setEditStatus('⏳ Mengupdate Data...');

    const payload = { ...editFormData, id: selectedItem.id, row_index: selectedItem.row_index };

    try {
      const res = await fetch('/api/edit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if(res.ok) {
        setIsEditModalOpen(false);
        await fetchData(); // Refresh tabel
        setEditStatus('');
      } else {
        setEditStatus('❌ Gagal mengupdate.');
      }
    } catch (error) {
      setEditStatus('❌ Gagal mengupdate.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl border border-emerald-100">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Validasi Data Penghimpunan</h1>
            <p className="text-sm text-gray-600 mt-1">REF 2026 - Ramadan Ekstra Fundtastic</p>
          </div>
          <Link href="/" className="text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
            &larr; Kembali
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500">Memuat data tabel...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm border-b-2 border-gray-200">
                  <th className="p-4 rounded-tl-lg">Tanggal</th>
                  <th className="p-4">Nama Donatur</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-tr-lg text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {dataList.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium whitespace-nowrap">{item.date}</td>
                    <td className="p-4">{item.nama_donatur || '-'}</td>
                    <td className="p-4 max-w-xs truncate" title={item.keterangan}>{item.keterangan}</td>
                    <td className="p-4 font-bold text-gray-700 whitespace-nowrap">{item.amount}</td>
                    <td className="p-4 whitespace-nowrap">
                      {item.status === 'Pending' ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                          🕒 Pending
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                          ✅ Tervalidasi
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {/* Tombol Edit */}
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Data"
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>

                        {/* Tombol Validasi */}
                        <button
                          onClick={() => openModal(item)}
                          title="Lihat & Validasi"
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL POP-UP VALIDASI ================= */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            
            {/* Header Modal */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold text-gray-800">Form Validasi</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {/* Info Transaksi */}
            <div className="p-6 bg-emerald-50 border-b">
              <p className="text-sm mb-1"><span className="text-gray-500">Tanggal:</span> <span className="font-semibold text-gray-800">{selectedItem.date}</span></p>
              <p className="text-sm mb-1"><span className="text-gray-500">Nominal:</span> <span className="font-bold text-emerald-600">{selectedItem.amount}</span></p>
              <p className="text-sm mb-1"><span className="text-gray-500">Keterangan:</span> <span className="font-semibold text-gray-800">{selectedItem.keterangan}</span></p>
              <p className="text-sm"><span className="text-gray-500">Nama Donatur:</span> <span className="font-semibold text-gray-800">{selectedItem.nama_donatur || '-'}</span></p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Jika sudah tervalidasi, tampilkan peringatan */}
              {selectedItem.status === 'Tervalidasi' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm mb-2">
                  ⚠️ Data ini sudah divalidasi sebelumnya. Form telah diisi dengan data terakhir yang tersimpan. Anda dapat mengubah dan menyimpan ulang untuk memperbarui data validasi.
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-600">Nama Validator</label>
                <select name="nama_validator" value={formData.nama_validator} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500">
                  <option value="">-- Pilih Validator --</option>
                  {dropdowns['Nama Validator']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Kode Unik</label>
                <input type="text" name="kode_unik" value={formData.kode_unik} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500" placeholder="Opsional..." />
              </div>

              {['Campaign', 'Tipe Donatur', 'Jenis Donasi', 'Kategori', 'Pelaksana Program', 'Metode'].map((field) => (
                <div key={field}>
                  <label className="text-xs font-bold text-gray-600">{field}</label>
                  <select name={field.toLowerCase().replace(' ', '_')} value={(formData as any)[field.toLowerCase().replace(' ', '_')]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih {field} --</option>
                    {dropdowns[field]?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}

              <button type="submit" className="mt-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md">
                Simpan Data
              </button>
              {submitStatus && <p className="text-center text-sm font-medium mt-1 text-emerald-600">{submitStatus}</p>}
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL EDIT DATA ================= */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">

            {/* Header Modal */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold text-gray-800">Edit Data Transaksi</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {/* Form Edit */}
            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm mb-2">
                ⚠️ Anda sedang mengedit data transaksi. Pastikan data yang dimasukkan sudah benar.
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Tanggal</label>
                <input
                  type="text"
                  name="date"
                  value={editFormData.date}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-orange-500"
                  placeholder="Contoh: Senin, 25/02/2026 10:30:00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: Hari, DD/MM/YYYY HH:MM:SS</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Nama Donatur</label>
                <input
                  type="text"
                  name="nama_donatur"
                  value={editFormData.nama_donatur}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-orange-500"
                  placeholder="Nama donatur..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Keterangan</label>
                <textarea
                  name="keterangan"
                  value={editFormData.keterangan}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-orange-500"
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Nominal</label>
                <input
                  type="text"
                  name="amount"
                  value={editFormData.amount}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-orange-500"
                  placeholder="Contoh: Rp 1.000.000"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: Rp X.XXX.XXX</p>
              </div>

              <button type="submit" className="mt-2 bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-md">
                Update Data
              </button>
              {editStatus && <p className="text-center text-sm font-medium mt-1 text-orange-600">{editStatus}</p>}
            </form>

          </div>
        </div>
      )}
    </main>
  );
}