'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  // Section 2: Event & Kemitraan data
  const [eventData, setEventData] = useState<any[]>([]);
  const [kemitraanData, setKemitraanData] = useState<any[]>([]);
  const [loadingSection2, setLoadingSection2] = useState(true);

  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  if (loading || !dashboardData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20 font-bold text-gray-500">Memuat dashboard...</div>
        </div>
      </main>
    );
  }

  const { summary, statusBreakdown, weeklyData, campaignData, organData, campaignTableData } = dashboardData;

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
          <Link href="/" className="text-emerald-600 hover:text-emerald-800 underline text-sm font-medium">
            &larr; Kembali
          </Link>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

          {/* Card 1: Total Donasi */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-xl shadow-lg text-white">
            <div className="text-sm font-medium opacity-90">Total Jumlah Donasi</div>
            <div className="text-3xl font-bold mt-2">{formatRupiah(summary.totalDonasi)}</div>
          </div>

          {/* Card 2: Total Donatur */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl shadow-lg text-white">
            <div className="text-sm font-medium opacity-90">Total Jumlah Donatur</div>
            <div className="text-3xl font-bold mt-2">{summary.totalDonatur.toLocaleString('id-ID')}</div>
          </div>

          {/* Card 3: Total Transaksi */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl shadow-lg text-white">
            <div className="text-sm font-medium opacity-90">Total Jumlah Transaksi</div>
            <div className="text-3xl font-bold mt-2">{summary.totalTransaksi.toLocaleString('id-ID')}</div>
          </div>

          {/* Card 4: Progress Capaian */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="text-sm font-medium opacity-90">Progress Capaian</div>
            <div className="text-3xl font-bold mt-2">{summary.progressPercent}%</div>
            <div className="mt-2 bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${Math.min(summary.progressPercent, 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Status Breakdown Cards */}
        {statusBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Tervalidasi</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {statusBreakdown.tervalidasi?.toLocaleString('id-ID') || 0}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-yellow-500">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Pending</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">
                {statusBreakdown.pending?.toLocaleString('id-ID') || 0}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow border-l-4 border-red-500">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Data Ditolak</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {statusBreakdown.ditolak?.toLocaleString('id-ID') || 0}
              </div>
            </div>
          </div>
        )}

        {/* Line Chart: Capaian Pekanan */}
        <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📈 Capaian Penghimpunan Setiap Pekan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => formatRupiah(value)}
                labelStyle={{ color: '#333' }}
              />
              <Legend />
              <Line type="monotone" dataKey="capaian" stroke="#10b981" strokeWidth={2} name="Capaian Pekanan" />
              <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Target Pekanan" />
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

        </div>
        {/* End of Section 1 */}

        {/* Section 2: Event & Kemitraan */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-emerald-700 mb-6">📅 Section 2: Dashboard Event & Kemitraan</h2>

          {loadingSection2 ? (
            <div className="text-center py-10 font-bold text-gray-500">Memuat data event & kemitraan...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">

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
