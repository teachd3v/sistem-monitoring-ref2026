'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { OrganOptions } from '@/lib/reference-data';

function parseItemDate(dateStr: string): number {
  try {
    let clean = dateStr;
    if (clean.includes(', ')) clean = clean.split(', ')[1];
    const [datePart, timePart = '00:00:00'] = clean.split(' ');
    const [d, m, y] = datePart.split('/').map(Number);
    const [h = 0, mn = 0, s = 0] = (timePart || '').split(':').map(Number);
    return new Date(y, m - 1, d, h, mn, s).getTime();
  } catch { return 0; }
}

function parseAmountNum(amount: string): number {
  return parseInt((amount || '').replace(/[^0-9]/g, ''), 10) || 0;
}

export default function ValidasiPage() {
  // State untuk autentikasi
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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

  // State untuk filter
  const [filterOrgan, setFilterOrgan] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKodeUnik, setFilterKodeUnik] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;

  // Filtered + sorted data
  const filteredList = useMemo(() => {
    let list = dataList.filter((item) => {
      if (filterOrgan && item.organ !== filterOrgan) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterKodeUnik && String(item.validation?.kode_unik || '') !== filterKodeUnik) return false;

      if (filterDateStart) {
        const [y, m, d] = filterDateStart.split('-').map(Number);
        if (parseItemDate(item.date) < new Date(y, m - 1, d, 0, 0, 0).getTime()) return false;
      }
      if (filterDateEnd) {
        const [y, m, d] = filterDateEnd.split('-').map(Number);
        if (parseItemDate(item.date) > new Date(y, m - 1, d, 23, 59, 59).getTime()) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !(item.keterangan || '').toLowerCase().includes(q) &&
          !(item.nama_donatur || '').toLowerCase().includes(q) &&
          !(item.ft_number || '').toLowerCase().includes(q) &&
          !(item.amount || '').toLowerCase().includes(q)
        ) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sortField === 'date') { va = parseItemDate(a.date); vb = parseItemDate(b.date); }
      else if (sortField === 'amount') { va = parseAmountNum(a.amount); vb = parseAmountNum(b.amount); }
      else { va = (a[sortField] || '').toString().toLowerCase(); vb = (b[sortField] || '').toString().toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [dataList, filterOrgan, filterDateStart, filterDateEnd, filterStatus, filterKodeUnik, searchQuery, sortField, sortDir]);

  // Get unique organ values for filter dropdown
  const organOptions = useMemo(() => {
    const organs = new Set(dataList.map(item => item.organ).filter(Boolean));
    return Array.from(organs).sort();
  }, [dataList]);

  // Get unique kode unik values for filter dropdown
  const kodeUnikOptions = useMemo(() => {
    const vals = new Set(dataList.map(item => String(item.validation?.kode_unik || '')).filter(v => v));
    return Array.from(vals).sort((a, b) => Number(a) - Number(b));
  }, [dataList]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, currentPage, PAGE_SIZE]);

  // Reset to page 1 when filters/sort change
  useEffect(() => { setCurrentPage(1); }, [filterOrgan, filterDateStart, filterDateEnd, filterStatus, filterKodeUnik, searchQuery, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 opacity-60">{sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  );

  // Cek autentikasi saat halaman dimuat
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check?type=validasi');
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
        body: JSON.stringify({ username: loginUsername, password: loginPassword, type: 'validasi' })
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
      body: JSON.stringify({ type: 'validasi' })
    });
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
  };

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
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

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
      // Untuk data Pending/Ditolak: kosongkan field validator,
      // tapi tetap pre-fill hasil auto-tag (campaign, kode_unik, pelaksana_program, kategori, tipe_donatur, dll)
      setFormData({
        nama_validator: '',
        kode_unik: String(item.validation?.kode_unik ?? ''),
        campaign: (item.validation?.campaign || '').trim(),
        tipe_donatur: (item.validation?.tipe_donatur || '').trim(),
        jenis_donasi: (item.validation?.jenis_donasi || '').trim(),
        kategori: (item.validation?.kategori || '').trim(),
        pelaksana_program: (item.validation?.pelaksana_program || '').trim(),
        metode: (item.validation?.metode || '').trim()
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
    setSubmitStatus('Menyimpan Data...');

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
      setSubmitStatus('Gagal menyimpan.');
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
    setEditStatus('Mengupdate Data...');

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
        setEditStatus('Gagal mengupdate.');
      }
    } catch (error) {
      setEditStatus('Gagal mengupdate.');
    }
  };

  // Handler untuk REJECT
  const handleReject = async (item: any) => {
    const message = item.status === 'Tervalidasi'
      ? 'Transaksi ini sudah divalidasi. Yakin ingin menolak? Status akan berubah ke Ditolak, data prefill tetap tersimpan.'
      : 'Apakah Anda yakin ingin menolak transaksi ini? Status akan berubah ke Ditolak, data prefill tetap tersimpan.';

    if (!window.confirm(message)) return;

    try {
      const res = await fetch('/api/reject-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error('Gagal menolak transaksi', error);
    }
  };

  const handleUndoReject = async (item: any) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan penolakan? Status akan kembali ke Pending.')) return;

    try {
      const res = await fetch('/api/reject-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, undo: true }),
      });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error('Gagal membatalkan penolakan', error);
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
              <h1 className="text-xl font-bold text-white">Validasi Data Finance</h1>
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

  // Halaman Validasi (setelah login)
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl border border-emerald-100">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Validasi Data Penghimpunan</h1>
            <p className="text-sm text-gray-600 mt-1">REF 2026 - Ramadan EduAction Festival</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Logout
            </button>
            <Link href="/" className="text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
              &larr; Kembali
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        {!loading && (
          <div className="flex flex-wrap items-end gap-3 mb-4">
            {/* Filter Organ */}
            <div className="flex-shrink-0">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Organ</label>
              <select
                value={filterOrgan}
                onChange={(e) => setFilterOrgan(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500 min-w-[140px]"
              >
                <option value="">Semua Organ</option>
                {organOptions.map((org, i) => (
                  <option key={i} value={org}>{org}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex-shrink-0">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500 min-w-[140px]"
              >
                <option value="">Semua Status</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Tervalidasi">🟢 Tervalidasi</option>
                <option value="Ditolak">🔴 Ditolak</option>
              </select>
            </div>

            {/* Filter Kode Unik */}
            <div className="flex-shrink-0">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Kode Unik</label>
              <select
                value={filterKodeUnik}
                onChange={(e) => setFilterKodeUnik(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500 min-w-[120px]"
              >
                <option value="">Semua</option>
                {kodeUnikOptions.map((k, i) => (
                  <option key={i} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal Awal */}
            <div className="flex-shrink-0">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tanggal Akhir */}
            <div className="flex-shrink-0">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Search Box */}
            <div className="flex-grow min-w-[200px]">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Cari</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari donatur, keterangan, FT Number, atau nominal..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Reset Filter */}
            {(filterOrgan || filterStatus || filterKodeUnik || filterDateStart || filterDateEnd || searchQuery) && (
              <button
                onClick={() => { setFilterOrgan(''); setFilterStatus(''); setFilterKodeUnik(''); setFilterDateStart(''); setFilterDateEnd(''); setSearchQuery(''); }}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                title="Reset semua filter"
              >
                Reset
              </button>
            )}

            {/* Info jumlah data */}
            <div className="flex-shrink-0 text-xs text-gray-400 self-end pb-2">
              {filteredList.length} dari {dataList.length} data
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500">Memuat data tabel...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b-2 border-gray-200 select-none">
                  <th className="px-2 py-2.5 rounded-tl-lg cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('ft_number')}>FT Number<SortIcon field="ft_number" /></th>
                  <th className="px-2 py-2.5 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('organ')}>Organ<SortIcon field="organ" /></th>
                  <th className="px-2 py-2.5 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('date')}>Tanggal<SortIcon field="date" /></th>
                  <th className="px-2 py-2.5 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('nama_donatur')}>Donatur<SortIcon field="nama_donatur" /></th>
                  <th className="px-2 py-2.5 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('keterangan')}>Keterangan<SortIcon field="keterangan" /></th>
                  <th className="px-2 py-2.5 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('amount')}>Nominal<SortIcon field="amount" /></th>
                  <th className="px-2 py-2.5 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort('status')}>Status<SortIcon field="status" /></th>
                  <th className="px-2 py-2.5 rounded-tr-lg text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {pagedList.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 font-mono text-gray-500 whitespace-nowrap">{item.ft_number || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{item.organ || '-'}</td>
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{item.date}</td>
                    <td className="px-2 py-2 max-w-[120px] truncate" title={item.nama_donatur}>{item.nama_donatur || '-'}</td>
                    <td className="px-2 py-2 max-w-[180px] truncate" title={item.keterangan}>{item.keterangan}</td>
                    <td className="px-2 py-2 font-bold text-gray-700 whitespace-nowrap">{item.amount}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {item.status === 'Ditolak' ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">Ditolak</span>
                      ) : item.status === 'Tervalidasi' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">Tervalidasi</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Pending</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEditModal(item)} title="Edit Data" className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-full transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => openModal(item)} title="Lihat & Validasi" className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        {item.status === 'Ditolak' ? (
                          <button onClick={() => handleUndoReject(item)} title="Batalkan Penolakan" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                            </svg>
                          </button>
                        ) : (
                          <button onClick={() => handleReject(item)} title="Tolak Transaksi" className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredList.length)} dari {filteredList.length} data
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 font-medium">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL POP-UP VALIDASI ================= */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">

            {/* Header Modal */}
            <div className="sticky top-0 bg-white border-b px-5 py-3 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold text-gray-800">Form Validasi</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {/* Info Transaksi */}
            <div className="px-5 py-3 bg-emerald-50 border-b text-sm" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem 1rem' }}>
              {selectedItem.ft_number && <p><span className="text-gray-500">FT Number:</span> <span className="font-mono font-semibold text-gray-800">{selectedItem.ft_number}</span></p>}
              {selectedItem.organ && <p><span className="text-gray-500">Organ:</span> <span className="font-semibold text-gray-800">{selectedItem.organ}</span></p>}
              <p><span className="text-gray-500">Tanggal:</span> <span className="font-semibold text-gray-800">{selectedItem.date}</span></p>
              <p><span className="text-gray-500">Nominal:</span> <span className="font-bold text-emerald-600">{selectedItem.amount}</span></p>
              <p><span className="text-gray-500">Donatur:</span> <span className="font-semibold text-gray-800">{selectedItem.nama_donatur || '-'}</span></p>
              <p style={{ gridColumn: 'span 3' }}><span className="text-gray-500">Keterangan:</span> <span className="font-semibold text-gray-800">{selectedItem.keterangan}</span></p>
            </div>

            {/* Form Input - Grid 5 kolom */}
            <form onSubmit={handleSubmit} className="p-5">
              {/* Peringatan */}
              {selectedItem.status === 'Tervalidasi' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2.5 rounded-lg text-xs mb-3">
                  Data ini sudah divalidasi sebelumnya. Anda dapat mengubah dan menyimpan ulang.
                </div>
              )}
              {selectedItem.status === 'Ditolak' && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg text-xs mb-3">
                  Transaksi ini sebelumnya ditolak. Validasi akan mengubah status menjadi Tervalidasi.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }} className="mb-3">
                {/* Baris 1: 5 item */}
                <div>
                  <label className="text-xs font-bold text-gray-600">Nama Validator</label>
                  <select name="nama_validator" value={formData.nama_validator} onChange={handleInputChange} required className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {dropdowns['Nama Validator']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Kode Unik</label>
                  <input type="text" name="kode_unik" value={formData.kode_unik} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500" placeholder="Opsional..." />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Campaign</label>
                  <select name="campaign" value={formData.campaign} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {dropdowns['Campaign']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Tipe Donatur</label>
                  <select name="tipe_donatur" value={formData.tipe_donatur} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {dropdowns['Tipe Donatur']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Jenis Donasi</label>
                  <select name="jenis_donasi" value={formData.jenis_donasi} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {dropdowns['Jenis Donasi']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Baris 2: 4 item + tombol */}
                <div>
                  <label className="text-xs font-bold text-gray-600">Kategori</label>
                  <select name="kategori" value={formData.kategori} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {dropdowns['Kategori']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Pelaksana Program</label>
                  <select name="pelaksana_program" value={formData.pelaksana_program} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {/* Menggabungkan opsi OrganOptions dengan nilai prefill saat ini (jika tidak ada di OrganOptions) agar nilai auto-tagging tidak hilang */}
                    {Array.from(new Set([...OrganOptions, formData.pelaksana_program].filter(Boolean))).map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Metode</label>
                  <select name="metode" value={formData.metode} onChange={handleInputChange} className="w-full p-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih --</option>
                    {dropdowns['Metode']?.map((opt:string, i:number) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }} className="flex items-end">
                  <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-1.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md">
                    Simpan Data
                  </button>
                </div>
              </div>

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
                Anda sedang mengedit data transaksi. Pastikan data yang dimasukkan sudah benar.
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
