'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedOrgan, setSelectedOrgan] = useState('all');

  // Available filter options
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [organs, setOrgans] = useState<string[]>([]);

  // Chart view toggle
  const [chartView, setChartView] = useState<'weekly' | 'daily'>('weekly');

  // Sorting for top donors table
  const [donorSortConfig, setDonorSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'totalDonasi',
    direction: 'desc'
  });

  // Section 2: Event & Kemitraan data
  const [eventData, setEventData] = useState<any[]>([]);
  const [kemitraanData, setKemitraanData] = useState<any[]>([]);
  const [loadingSection2, setLoadingSection2] = useState(true);

  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Export state
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchEventAndKemitraan();
  }, [startDate, endDate, selectedCampaign, selectedOrgan]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedCampaign !== 'all') params.append('campaign', selectedCampaign);
      if (selectedOrgan !== 'all') params.append('organ', selectedOrgan);

      const res = await fetch(`/api/dashboard-data?${params.toString()}`);
      const data = await res.json();

      setDashboardData(data);

      // Extract unique campaigns and organs for filters
      if (data.campaignData) {
        const uniqueCampaigns = data.campaignData.map((item: any) => item.campaign);
        setCampaigns(uniqueCampaigns);
      }

      if (data.organData) {
        const uniqueOrgans = data.organData.map((item: any) => item.organ);
        setOrgans(uniqueOrgans);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
    setLoading(false);
  };

  const fetchEventAndKemitraan = async () => {
    setLoadingSection2(true);
    try {
      const [eventRes, kemitraanRes] = await Promise.all([
        fetch('/api/all-event-data'),
        fetch('/api/all-kemitraan-data')
      ]);

      const events = await eventRes.json();
      const kemitraan = await kemitraanRes.json();

      setEventData(events);
      setKemitraanData(kemitraan);
    } catch (error) {
      console.error('Failed to fetch event/kemitraan data', error);
    }
    setLoadingSection2(false);
  };

  const formatRupiah = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const openImageModal = (imageUrls: string) => {
    if (imageUrls && imageUrls !== '-') {
      const urls = imageUrls.split('|||').filter(Boolean);
      setSelectedImages(urls);
      setCurrentImageIndex(0);
      setIsImageModalOpen(true);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
  };

  const exportToExcel = async () => {
    setExportingExcel(true);
    try {
      // Fetch semua data dari 3 tabel sekaligus
      const [financeRes, eventRes, kemitraanRes] = await Promise.all([
        fetch('/api/all-finance-data'),
        fetch('/api/all-event-data'),
        fetch('/api/all-kemitraan-data'),
      ]);

      if (!financeRes.ok || !eventRes.ok || !kemitraanRes.ok) {
        throw new Error('Gagal mengambil data dari server');
      }

      const financeData = await financeRes.json();
      const eventData = await eventRes.json();
      const kemitraanData = await kemitraanRes.json();

      // Flatten finance data (ambil field penting)
      const financeRows = (Array.isArray(financeData) ? financeData : []).map((item: Record<string, unknown>, idx: number) => ({
        'No': idx + 1,
        'FT Number': item.ft_number || '-',
        'Tanggal Transaksi': item.date || '-',
        'Nama Donatur': item.nama_donatur || '-',
        'Keterangan': item.keterangan || '-',
        'Amount': item.amount || '-',
        'Organ': item.organ || '-',
        'Status': item.status || '-',
        'Validator': (item.validation as Record<string, unknown>)?.nama_validator || '-',
        'Campaign': (item.validation as Record<string, unknown>)?.campaign || '-',
        'Tipe Donatur': (item.validation as Record<string, unknown>)?.tipe_donatur || '-',
        'Jenis Donasi': (item.validation as Record<string, unknown>)?.jenis_donasi || '-',
        'Kategori': (item.validation as Record<string, unknown>)?.kategori || '-',
        'Pelaksana Program': (item.validation as Record<string, unknown>)?.pelaksana_program || '-',
        'Metode': (item.validation as Record<string, unknown>)?.metode || '-',
      }));

      const eventRows = (Array.isArray(eventData) ? eventData : []).map((item: Record<string, unknown>, idx: number) => ({
        'No': idx + 1,
        'Tanggal Input': item.timestamp || '-',
        'Nama Event': item.nama_event || '-',
        'Lokasi': item.lokasi || '-',
        'Tanggal Pelaksanaan': item.tanggal_pelaksanaan || '-',
        'Peserta': item.peserta || '-',
        'Pelaksana Event': item.pelaksana_event || '-',
        'PIC Report': item.pic_report || '-',
      }));

      const kemitraanRows = (Array.isArray(kemitraanData) ? kemitraanData : []).map((item: Record<string, unknown>, idx: number) => ({
        'No': idx + 1,
        'Tanggal Input': item.timestamp || '-',
        'Nama Mitra': item.nama_mitra || '-',
        'Tanggal Kerjasama': item.tanggal_kerjasama || '-',
        'Pelaksana': item.pelaksana_event || '-',
        'PIC Report': item.pic_report || '-',
      }));

      // Buat workbook dengan 3 sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(financeRows.length > 0 ? financeRows : [{ Info: 'Belum ada data' }]), 'Data Finance');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(eventRows.length > 0 ? eventRows : [{ Info: 'Belum ada data' }]), 'Data Event');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(kemitraanRows.length > 0 ? kemitraanRows : [{ Info: 'Belum ada data' }]), 'Data Kemitraan');

      XLSX.writeFile(workbook, `Export_REF2026_${Date.now()}.xlsx`);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memproses Export Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const exportToPDF = () => {
    // Gunakan browser print dialog — paling simple & reliable
    window.print();
  };

  if (loading || !dashboardData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20 font-bold text-gray-500">Memuat dashboard...</div>
        </div>
      </main>
    );
  }

  const { summary, statusBreakdown, weeklyData, dailyData, campaignData, organData, campaignTableData, topDonors } = dashboardData;

  // Sorting logic for Top Donors
  const sortedTopDonors = [...(topDonors || [])].sort((a, b) => {
    const { key, direction } = donorSortConfig;
    let valA = a[key as keyof typeof a];
    let valB = b[key as keyof typeof b];

    if (key === 'nama') {
      valA = (valA as string).toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestDonorSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (donorSortConfig.key === key && donorSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setDonorSortConfig({ key, direction });
  };

  // Guard: jika summary tidak ada (misal API error), tampilkan pesan
  if (!summary) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20 font-bold text-red-500">
            Gagal memuat data dashboard. Silakan refresh halaman.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🌙</span>
              <h1 className="text-3xl font-bold text-emerald-700">Dashboard Monitoring</h1>
            </div>
            <p className="text-lg text-amber-600 font-semibold ml-11">REF 2026 - Ramadan EduAction Festival</p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <button
              onClick={exportToExcel}
              disabled={exportingExcel}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50"
            >
              📊 {exportingExcel ? 'Mengunduh...' : 'Export Excel'}
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
            >
              📄 Export PDF
            </button>
            <Link href="/" className="ml-2 text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
              &larr; Kembali
            </Link>
          </div>
        </div>

        {/* ===================== AREA UNTUK EXPORT PDF ===================== */}
        <div id="export-pdf-content" className="p-4 bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-xl">

        {/* Section 1: Dashboard Penghimpunan */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-emerald-700 mb-6">📊 Section 1: Dashboard Penghimpunan</h2>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filter Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Filter Tanggal Mulai */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tanggal Akhir */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Tanggal Akhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Campaign */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Campaign</option>
                {campaigns.map((campaign, idx) => (
                  <option key={idx} value={campaign}>{campaign}</option>
                ))}
              </select>
            </div>

            {/* Filter Organ */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Organ</label>
              <select
                value={selectedOrgan}
                onChange={(e) => setSelectedOrgan(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Organ</option>
                {organs.map((organ, idx) => (
                  <option key={idx} value={organ}>{organ}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedCampaign('all');
              setSelectedOrgan('all');
            }}
            className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-medium"
          >
            Reset Filter
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">

          {/* Card 1: Total Donasi */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-lg text-white flex flex-col justify-center">
            <div className="text-xs font-medium opacity-90 mb-1">Total Donasi</div>
            <div className="text-lg md:text-xl font-bold truncate" title={formatRupiah(summary.totalDonasi)}>{formatRupiah(summary.totalDonasi)}</div>
          </div>

          {/* Card 2: Total Donasi Uang */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl shadow-lg text-white flex flex-col justify-center">
            <div className="text-xs font-medium opacity-90 mb-1">Total Donasi Uang</div>
            <div className="text-lg md:text-xl font-bold truncate" title={formatRupiah(summary.totalDonasiUang)}>{formatRupiah(summary.totalDonasiUang)}</div>
          </div>

          {/* Card 3: Total Donasi Barang */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg text-white flex flex-col justify-center">
            <div className="text-xs font-medium opacity-90 mb-1">Total Donasi Barang</div>
            <div className="text-lg md:text-xl font-bold truncate" title={formatRupiah(summary.totalDonasiBarang)}>{formatRupiah(summary.totalDonasiBarang)}</div>
          </div>

          {/* Card 4: Total Donatur */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl shadow-lg text-white flex flex-col justify-center">
            <div className="text-xs font-medium opacity-90 mb-1">Total Donatur</div>
            <div className="text-lg md:text-xl font-bold truncate">{summary.totalDonatur.toLocaleString('id-ID')}</div>
          </div>

          {/* Card 5: Total Transaksi */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-xl shadow-lg text-white flex flex-col justify-center">
            <div className="text-xs font-medium opacity-90 mb-1">Total Transaksi</div>
            <div className="text-lg md:text-xl font-bold truncate">{summary.totalTransaksi.toLocaleString('id-ID')}</div>
          </div>

          {/* Card 6: Progress Capaian */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg text-white flex flex-col justify-center">
            <div className="text-xs font-medium opacity-90 mb-1">Progress Capaian</div>
            <div className="flex items-end gap-2">
              <div className="text-lg md:text-xl font-bold">{summary.progressPercent}%</div>
            </div>
            <div className="mt-2 bg-white bg-opacity-30 rounded-full h-1.5 w-full">
              <div
                className="bg-white rounded-full h-1.5 transition-all"
                style={{ width: `${Math.min(summary.progressPercent, 100)}%` }}
              />
            </div>
          </div>

        </div>

        {statusBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start">
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500 flex flex-col h-full">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Tervalidasi</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {statusBreakdown.tervalidasi?.toLocaleString('id-ID') || 0}
                </div>
              </div>
              {statusBreakdown.organTervalidasi && Object.keys(statusBreakdown.organTervalidasi).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  {Object.entries(statusBreakdown.organTervalidasi)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([org, count]) => (
                      <div key={org} className="flex justify-between items-center">
                        <span className="truncate pr-2">{org}</span>
                        <span className="font-semibold bg-green-50 text-green-700 px-1.5 py-0.5 rounded min-w-[24px] text-center">{Number(count)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-500 flex flex-col h-full">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Review</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {statusBreakdown.review?.toLocaleString('id-ID') || 0}
                </div>
              </div>
              {statusBreakdown.organReview && Object.keys(statusBreakdown.organReview).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  {Object.entries(statusBreakdown.organReview)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([org, count]) => (
                      <div key={org} className="flex justify-between items-center">
                        <span className="truncate pr-2">{org}</span>
                        <span className="font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded min-w-[24px] text-center">{Number(count)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-yellow-500 flex flex-col h-full">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Pending</div>
                <div className="text-2xl font-bold text-yellow-600 mt-1">
                  {statusBreakdown.pending?.toLocaleString('id-ID') || 0}
                </div>
              </div>
              {statusBreakdown.organPending && Object.keys(statusBreakdown.organPending).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  {Object.entries(statusBreakdown.organPending)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([org, count]) => (
                      <div key={org} className="flex justify-between items-center">
                        <span className="truncate pr-2">{org}</span>
                        <span className="font-semibold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded min-w-[24px] text-center">{Number(count)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-red-500 flex flex-col h-full">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Ditolak</div>
                <div className="text-2xl font-bold text-red-600 mt-1">
                  {statusBreakdown.ditolak?.toLocaleString('id-ID') || 0}
                </div>
              </div>
              {statusBreakdown.organDitolak && Object.keys(statusBreakdown.organDitolak).length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  {Object.entries(statusBreakdown.organDitolak)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([org, count]) => (
                      <div key={org} className="flex justify-between items-center">
                        <span className="truncate pr-2">{org}</span>
                        <span className="font-semibold bg-red-50 text-red-700 px-1.5 py-0.5 rounded min-w-[24px] text-center">{Number(count)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Line Chart: Capaian Pekanan/Harian */}
        <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-gray-800">📈 Capaian Penghimpunan {chartView === 'weekly' ? 'Setiap Pekan' : 'Setiap Hari'}</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setChartView('weekly')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  chartView === 'weekly' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                Pekanan
              </button>
              <button
                onClick={() => setChartView('daily')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  chartView === 'daily' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-gray-500 hover:text-emerald-600'
                }`}
              >
                Harian
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartView === 'weekly' ? weeklyData : dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartView === 'weekly' ? 'week' : 'date'} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              {chartView === 'daily' && (
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              )}
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name.includes('Donasi') || name === 'amount' || name.includes('Capaian')) {
                    return formatRupiah(value);
                  }
                  return value;
                }}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              {chartView === 'weekly' ? (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="capaian" stroke="#10b981" strokeWidth={2} name="Capaian Pekanan" />
                  <Line yAxisId="left" type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Target Pekanan" />
                </>
              ) : (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Donasi Harian" />
                  <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#6366f1" strokeWidth={2} name="Jumlah Transaksi" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Capaian per Campaign */}
        <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Capaian Penghimpunan Berdasarkan Campaign</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaign" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => formatRupiah(value)}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              <Bar dataKey="capaian" fill="#10b981" name="Capaian" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Table 1: Organ */}
          <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🏢 Penghimpunan per Organ</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm border-b-2 border-gray-200">
                    <th className="p-3">Organ</th>
                    <th className="p-3 text-right">Jumlah Donasi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-800">
                  {organData.length > 0 ? (
                    organData.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.organ}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{formatRupiah(item.jumlah_donasi)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-3 text-center text-gray-500">Tidak ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Campaign */}
          <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🎯 Penghimpunan per Campaign</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm border-b-2 border-gray-200">
                    <th className="p-3">Campaign</th>
                    <th className="p-3 text-right">Jumlah Donasi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-800">
                  {campaignTableData.length > 0 ? (
                    campaignTableData.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.campaign}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{formatRupiah(item.jumlah_donasi)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-3 text-center text-gray-500">Tidak ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Top 10 Donatur Table */}
        <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏆 Top 10 Donatur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm border-b-2 border-gray-200">
                  <th 
                    className="p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => requestDonorSort('nama')}
                  >
                    Nama {donorSortConfig.key === 'nama' ? (donorSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => requestDonorSort('totalDonasi')}
                  >
                    Total Donasi {donorSortConfig.key === 'totalDonasi' ? (donorSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => requestDonorSort('totalTransaksi')}
                  >
                    Total Transaksi {donorSortConfig.key === 'totalTransaksi' ? (donorSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {sortedTopDonors.length > 0 ? (
                  sortedTopDonors.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 w-5">#{idx + 1}</span>
                          {item.nama}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatRupiah(item.totalDonasi)}</td>
                      <td className="p-3 text-right font-semibold text-gray-600">{item.totalTransaksi}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-gray-500">Tidak ada data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        </div>
        {/* End of Section 1 */}

        {/* Section 2: Event & Kemitraan */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-emerald-700 mb-6">📅 Section 2: Dashboard Event & Kemitraan</h2>

          {loadingSection2 ? (
            <div className="text-center py-10 font-bold text-gray-500">Memuat data event & kemitraan...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stat: Jumlah Event */}
                <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 flex items-center gap-4">
                  <div className="text-4xl">🎪</div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Jumlah Event Terlaksana</p>
                    <p className="text-4xl font-bold text-emerald-700">{eventData.length}</p>
                  </div>
                </div>

                {/* Stat: Jumlah Kemitraan */}
                <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 flex items-center gap-4">
                  <div className="text-4xl">🤝</div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Jumlah Kemitraan Terjalin</p>
                    <p className="text-4xl font-bold text-purple-700">{kemitraanData.length}</p>
                  </div>
                </div>
              </div>

              {/* Chart: Event per Pelaksana */}
              <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Jumlah Event per Pelaksana</h3>
                {eventData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(
                        eventData.reduce((acc: Record<string, number>, item) => {
                          const key = item.pelaksana_event || 'Tidak Diketahui';
                          acc[key] = (acc[key] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([pelaksana, jumlah]) => ({ pelaksana, jumlah }))}
                      margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="pelaksana" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="jumlah" name="Jumlah Event" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-10">Belum ada data event</p>
                )}
              </div>

              {/* Table Event */}
              <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🎪 Data Event Ramadan</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm border-b-2 border-gray-200">
                        <th className="p-3">Tanggal Input</th>
                        <th className="p-3">Nama Event</th>
                        <th className="p-3">Lokasi</th>
                        <th className="p-3">Tanggal Pelaksanaan</th>
                        <th className="p-3">Peserta</th>
                        <th className="p-3">Pelaksana</th>
                        <th className="p-3">PIC Report</th>
                        <th className="p-3">Dokumentasi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                      {eventData.length > 0 ? (
                        eventData.map((item, idx) => {
                          const imageUrls = item.dokumentasi && item.dokumentasi !== '-'
                            ? item.dokumentasi.split('|||').filter(Boolean)
                            : [];
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3 whitespace-nowrap">{item.timestamp}</td>
                              <td className="p-3 font-medium">{item.nama_event}</td>
                              <td className="p-3">{item.lokasi}</td>
                              <td className="p-3 whitespace-nowrap">{item.tanggal_pelaksanaan}</td>
                              <td className="p-3">{item.peserta}</td>
                              <td className="p-3">{item.pelaksana_event}</td>
                              <td className="p-3">{item.pic_report}</td>
                              <td className="p-3">
                                {imageUrls.length > 0 ? (
                                  <button
                                    onClick={() => openImageModal(item.dokumentasi)}
                                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                                  >
                                    <span>📸 {imageUrls.length} foto</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-3 text-center text-gray-500">Belum ada data event</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Kemitraan */}
              <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🤝 Data Kemitraan</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 text-sm border-b-2 border-gray-200">
                        <th className="p-3">Tanggal Input</th>
                        <th className="p-3">Nama Mitra</th>
                        <th className="p-3">Tanggal Kerjasama</th>
                        <th className="p-3">Dokumen PKS</th>
                        <th className="p-3">Dokumentasi Kegiatan</th>
                        <th className="p-3">Pelaksana</th>
                        <th className="p-3">PIC Report</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                      {kemitraanData.length > 0 ? (
                        kemitraanData.map((item, idx) => {
                          const pksUrls = item.dokumen_pks && item.dokumen_pks !== '-'
                            ? item.dokumen_pks.split('|||').filter(Boolean)
                            : [];
                          const dokumentasiUrls = item.dokumentasi_kegiatan && item.dokumentasi_kegiatan !== '-'
                            ? item.dokumentasi_kegiatan.split('|||').filter(Boolean)
                            : [];
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3 whitespace-nowrap">{item.timestamp}</td>
                              <td className="p-3 font-medium">{item.nama_mitra}</td>
                              <td className="p-3 whitespace-nowrap">{item.tanggal_kerjasama}</td>
                              <td className="p-3">
                                {pksUrls.length > 0 ? (
                                  <button
                                    onClick={() => openImageModal(item.dokumen_pks)}
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm"
                                  >
                                    <span>📄 {pksUrls.length} file</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                {dokumentasiUrls.length > 0 ? (
                                  <button
                                    onClick={() => openImageModal(item.dokumentasi_kegiatan)}
                                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                                  >
                                    <span>📸 {dokumentasiUrls.length} foto</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-3">{item.pelaksana_event}</td>
                              <td className="p-3">{item.pic_report}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-3 text-center text-gray-500">Belum ada data kemitraan</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
        {/* End of Section 2 */}
        </div>
        {/* ============================================================== */}

        {/* Image Modal Popup */}
        {isImageModalOpen && selectedImages.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col">

              {/* Close Button */}
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 z-50 bg-white text-gray-800 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Container */}
              <div className="flex items-center justify-center flex-1 mb-4">
                <img
                  src={selectedImages[currentImageIndex]}
                  alt={`Preview ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="18"%3EGambar tidak dapat dimuat%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Navigation Controls */}
              {selectedImages.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-200 text-gray-800 rounded-full p-3 shadow-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-200 text-gray-800 rounded-full p-3 shadow-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  {/* Image Counter */}
                  <div className="text-center text-white font-semibold bg-black bg-opacity-50 py-2 px-4 rounded-lg">
                    {currentImageIndex + 1} / {selectedImages.length}
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
