'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file) return alert('Pilih file CSV dulu ya!');
    
    setStatus('Sedang memproses... Tunggu sebentar ⏳');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setStatus(data.message || 'Berhasil diupload! ✅');
      
      // === FITUR BARU: RESET FORM SETELAH SUKSES ===
      setFile(null); // Kosongkan memori file
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; // Kosongkan teks nama file di layar
      // ============================================

    } catch (error) {
      setStatus('Waduh, ada error saat upload. ❌');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-emerald-100">
        <div className="mb-2 text-3xl">📤</div>
        <h1 className="text-2xl font-bold mb-2 text-emerald-700">Upload Data Penghimpunan</h1>
        <p className="text-sm text-gray-600 mb-6">REF 2026 - Ramadan Ekstra Fundtastic</p>
        <input
          id="fileInput"
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 mb-4 cursor-pointer
            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
            file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />
        <button
          onClick={handleUpload}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-lg font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg mb-4"
        >
          Proses & Kirim ke Sheet 🚀
        </button>
        {status && <p className="mt-4 font-medium text-gray-700">{status}</p>}

        <Link href="/" className="block mt-6 text-sm text-gray-500 hover:text-emerald-600 underline">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}