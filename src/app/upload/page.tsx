'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  // State untuk autentikasi
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  // State untuk preview CSV
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);

  // Cek autentikasi saat halaman dimuat
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check?type=upload');
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword, type: 'upload' })
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || 'Login gagal.');
      }
    } catch {
      setLoginError('Terjadi kesalahan. Coba lagi.');
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'upload' })
    });
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setStatus('');
    setPreviewHeaders([]);
    setPreviewRows([]);
    setTotalRows(0);

    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return;

      const headers = parseCSVLine(lines[0]);
      setPreviewHeaders(headers);

      const dataLines = lines.slice(1);
      setTotalRows(dataLines.length);

      const preview = dataLines.slice(0, 10).map(line => parseCSVLine(line));
      setPreviewRows(preview);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return alert('Pilih file CSV dulu ya!');

    setStatus('Sedang memproses... Tunggu sebentar');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setStatus(data.message || 'Berhasil diupload!');

      setFile(null);
      setPreviewHeaders([]);
      setPreviewRows([]);
      setTotalRows(0);
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setStatus('Waduh, ada error saat upload.');
    }
  };

  // Loading screen saat cek autentikasi
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Memuat...</p>
        </div>
      </main>
    );
  }

  // Halaman Login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Upload Data Finance</h1>
              <p className="text-emerald-100 text-sm mt-1">REF 2026 - Silakan login untuk melanjutkan</p>
            </div>

            {/* Form Login */}
            <form onSubmit={handleLogin} className="p-6 flex flex-col gap-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium text-center">
                  {loginError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  placeholder="Masukkan username..."
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  placeholder="Masukkan password..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="mt-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {/* Footer */}
            <div className="px-6 pb-6 text-center">
              <Link href="/" className="text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
                &larr; Kembali ke Menu Utama
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Halaman Upload (setelah login)
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4">
      <div className={`bg-white p-8 rounded-2xl shadow-xl w-full text-center border border-emerald-100 ${previewRows.length > 0 ? 'max-w-5xl' : 'max-w-md'}`}>
        <div className="flex justify-end mb-2">
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Logout
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-emerald-700">Upload Data Penghimpunan</h1>
        <p className="text-sm text-gray-600 mb-6">REF 2026 - Ramadan EduAction Festival</p>
        <input
          id="fileInput"
          type="file"
          accept=".csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 mb-4 cursor-pointer
            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
            file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />

        {/* Preview Tabel CSV */}
        {previewRows.length > 0 && (
          <div className="mb-4 text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700">Preview Data ({totalRows} baris total, menampilkan 10 baris pertama)</h3>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-800 border-b border-gray-200">
                    <th className="p-2 font-bold text-center border-r border-gray-200 whitespace-nowrap">#</th>
                    {previewHeaders.map((header, i) => (
                      <th key={i} className="p-2 font-bold whitespace-nowrap border-r border-gray-200 last:border-r-0">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 text-center text-gray-400 font-medium border-r border-gray-200 whitespace-nowrap">{rowIdx + 1}</td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 whitespace-nowrap border-r border-gray-200 last:border-r-0 max-w-[200px] truncate" title={cell}>{cell || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalRows > 10 && (
              <p className="text-xs text-gray-400 mt-2 text-center">... dan {totalRows - 10} baris lainnya</p>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-lg font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proses & Kirim Data Finance
        </button>
        {status && <p className="mt-4 font-medium text-gray-700">{status}</p>}

        <Link href="/" className="block mt-6 text-sm text-gray-500 hover:text-emerald-600 underline">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
