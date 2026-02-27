'use client';
import { useState } from 'react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

export default function KemitraanPage() {
  const [formData, setFormData] = useState({
    nama_mitra: '',
    tanggal_kerjasama: '',
    pelaksana_event: '',
    pic_report: ''
  });

  const [dokumenPKS, setDokumenPKS] = useState<File[]>([]);
  const [dokumentasiKegiatan, setDokumentasiKegiatan] = useState<File[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePKSChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDokumenPKS(Array.from(e.target.files));
    }
  };

  const handleDokumentasiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDokumentasiKegiatan(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('⏳ Menyimpan data kemitraan...');

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      setStatus('⏳ Mengkompresi gambar...');

      // Compress and append PKS files
      const compressedPksPromises = dokumenPKS.map(async (file, index) => {
        if (file.type.startsWith('image/')) {
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          try {
            const compressedFile = await imageCompression(file, options);
            return { file: compressedFile, index };
          } catch (_) {
            return { file, index };
          }
        }
        return { file, index };
      });

      const processedPKS = await Promise.all(compressedPksPromises);
      processedPKS.forEach(({ file, index }) => {
        formDataToSend.append(`pks_${index}`, file);
      });
      formDataToSend.append('jumlah_pks', dokumenPKS.length.toString());

      // Compress and append dokumentasi files
      const compressedDokPromises = dokumentasiKegiatan.map(async (file, index) => {
        if (file.type.startsWith('image/')) {
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          try {
            const compressedFile = await imageCompression(file, options);
            return { file: compressedFile, index };
          } catch (_) {
            return { file, index };
          }
        }
        return { file, index };
      });

      const processedDokumentasi = await Promise.all(compressedDokPromises);
      processedDokumentasi.forEach(({ file, index }) => {
        formDataToSend.append(`dokumentasi_${index}`, file);
      });
      formDataToSend.append('jumlah_dokumentasi', dokumentasiKegiatan.length.toString());

      setStatus('⏳ Mengupload data ke server...');

      const res = await fetch('/api/submit-kemitraan', {
        method: 'POST',
        body: formDataToSend
      });

      if (res.ok) {
        setStatus('✅ Data kemitraan berhasil disimpan!');
        // Reset form
        setFormData({
          nama_mitra: '',
          tanggal_kerjasama: '',
          pelaksana_event: '',
          pic_report: ''
        });
        setDokumenPKS([]);
        setDokumentasiKegiatan([]);
        const pksInput = document.getElementById('dokumenPKS') as HTMLInputElement;
        const dokInput = document.getElementById('dokumentasi') as HTMLInputElement;
        if (pksInput) pksInput.value = '';
        if (dokInput) dokInput.value = '';
      } else {
        setStatus('❌ Gagal menyimpan data kemitraan.');
      }
    } catch (error) {
      console.error('Error submitting kemitraan:', error);
      setStatus('❌ Terjadi kesalahan saat menyimpan.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-emerald-100">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-3xl mb-2">🤝</div>
            <h1 className="text-2xl font-bold text-emerald-700">Form Input Kemitraan Ramadan</h1>
            <p className="text-sm text-gray-600 mt-1">REF 2026 - Ramadan EduAction Festival</p>
          </div>
          <Link href="/" className="text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
            &larr; Kembali
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Nama Mitra */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Nama Mitra <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="nama_mitra"
              value={formData.nama_mitra}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              placeholder="Contoh: PT. Bangun Sejahtera Indonesia"
            />
          </div>

          {/* Tanggal Kerjasama */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Tanggal Kerjasama <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="tanggal_kerjasama"
              value={formData.tanggal_kerjasama}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Upload Dokumen PKS */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Upload Dokumen PKS (Jika Ada)</label>
            <input
              id="dokumenPKS"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              multiple
              onChange={handlePKSChange}
              className="block w-full text-sm text-gray-500 cursor-pointer
                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload dokumen perjanjian kerjasama (PDF, Word, atau gambar)</p>
            {dokumenPKS.length > 0 && (
              <div className="mt-2 text-sm text-purple-600">
                {dokumenPKS.length} file PKS dipilih
              </div>
            )}
          </div>

          {/* Upload Dokumentasi Kegiatan */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Upload Dokumentasi Kegiatan (Jika Ada)</label>
            <input
              id="dokumentasi"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleDokumentasiChange}
              className="block w-full text-sm text-gray-500 cursor-pointer
                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload foto atau dokumen kegiatan kemitraan</p>
            {dokumentasiKegiatan.length > 0 && (
              <div className="mt-2 text-sm text-emerald-600">
                {dokumentasiKegiatan.length} file dokumentasi dipilih
              </div>
            )}
          </div>

          {/* Pelaksana Event */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Pelaksana Event <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="pelaksana_event"
              value={formData.pelaksana_event}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              placeholder="Contoh: Tim Kemitraan Jakarta"
            />
          </div>

          {/* PIC Report */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">PIC Report <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="pic_report"
              value={formData.pic_report}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              placeholder="Contoh: Siti Nurhaliza"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Data Kemitraan'}
          </button>

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-lg text-center font-medium ${
              status.includes('✅') ? 'bg-emerald-50 text-emerald-700' :
              status.includes('❌') ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {status}
            </div>
          )}

        </form>

      </div>
    </main>
  );
}
