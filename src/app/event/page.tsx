'use client';
import { useState } from 'react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

export default function EventPage() {
  const [formData, setFormData] = useState({
    nama_event: '',
    lokasi: '',
    tanggal_pelaksanaan: '',
    peserta: '',
    pelaksana_event: '',
    pic_report: ''
  });

  const [dokumentasi, setDokumentasi] = useState<File[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDokumentasi(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('⏳ Menyimpan data event...');

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      setStatus('⏳ Mengkompresi gambar...');

      // Compress and append files
      const compressedFilesPromises = dokumentasi.map(async (file, index) => {
        if (file.type.startsWith('image/')) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          try {
            const compressedFile = await imageCompression(file, options);
            return { file: compressedFile, index };
          } catch (error) {
            console.error('Error compressing image:', error);
            return { file, index }; // fallback to original on error
          }
        }
        return { file, index }; // return non-images as is (e.g. PDF)
      });

      const processedFiles = await Promise.all(compressedFilesPromises);

      setStatus('⏳ Mengupload data ke server...');

      processedFiles.forEach(({ file, index }) => {
        formDataToSend.append(`dokumentasi_${index}`, file);
      });
      formDataToSend.append('jumlah_dokumentasi', dokumentasi.length.toString());

      const res = await fetch('/api/submit-event', {
        method: 'POST',
        body: formDataToSend
      });

      if (res.ok) {
        setStatus('✅ Data event berhasil disimpan!');
        // Reset form
        setFormData({
          nama_event: '',
          lokasi: '',
          tanggal_pelaksanaan: '',
          peserta: '',
          pelaksana_event: '',
          pic_report: ''
        });
        setDokumentasi([]);
        const fileInput = document.getElementById('dokumentasi') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setStatus('❌ Gagal menyimpan data event.');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
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
            <div className="text-3xl mb-2">🎪</div>
            <h1 className="text-2xl font-bold text-emerald-700">Form Input Event Ramadan</h1>
            <p className="text-sm text-gray-600 mt-1">REF 2026 - Ramadan Ekstra Fundtastic</p>
          </div>
          <Link href="/" className="text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
            &larr; Kembali
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Nama Event */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Nama Event <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="nama_event"
              value={formData.nama_event}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              placeholder="Contoh: Sahur On The Road"
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Lokasi <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              placeholder="Contoh: Masjid Al-Ikhlas, Jakarta Selatan"
            />
          </div>

          {/* Tanggal Pelaksanaan */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Tanggal Pelaksanaan <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="tanggal_pelaksanaan"
              value={formData.tanggal_pelaksanaan}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Upload Dokumentasi */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Upload Dokumentasi</label>
            <input
              id="dokumentasi"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 cursor-pointer
                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload foto atau dokumen kegiatan (bisa lebih dari 1 file)</p>
            {dokumentasi.length > 0 && (
              <div className="mt-2 text-sm text-emerald-600">
                {dokumentasi.length} file dipilih
              </div>
            )}
          </div>

          {/* Peserta */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Peserta <span className="text-red-500">*</span></label>
            <textarea
              name="peserta"
              value={formData.peserta}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              placeholder="Contoh: 150 jamaah masjid, 20 panitia"
            />
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
              placeholder="Contoh: Tim Relawan Jakarta Selatan"
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
              placeholder="Contoh: Ahmad Zulkifli"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Data Event'}
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
