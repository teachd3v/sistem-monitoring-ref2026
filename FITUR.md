# 📋 Breakdown Fitur — Sistem Monitoring REF 2026

> Ramadan EduAction Festival 2026

---

## 🏠 Halaman Utama (`/`)

- Halaman landing/menu utama sebagai navigasi ke semua halaman

---

## 📊 Halaman Dashboard (`/dashboard`)

### Section 1: Dashboard Penghimpunan

| Fitur                        | Keterangan                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| 🔢 Summary Cards (4 card)    | Total Jumlah Donasi, Total Donatur, Total Transaksi, Progress Capaian (%) |
| 📊 Status Breakdown (3 card) | Jumlah data Tervalidasi / Pending / Ditolak                               |
| 🔍 Filter Data               | Filter by Tanggal Mulai, Tanggal Akhir, Campaign, Organ                   |
| 🔄 Reset Filter              | Tombol reset semua filter sekaligus                                       |
| 📈 Line Chart                | Grafik capaian penghimpunan setiap pekan vs. target                       |
| 📊 Bar Chart                 | Grafik capaian penghimpunan per campaign                                  |
| 🏢 Tabel Organ               | Rekapitulasi jumlah donasi per organ                                      |
| 🎯 Tabel Campaign            | Rekapitulasi jumlah donasi per campaign                                   |

### Section 2: Dashboard Event & Kemitraan

| Fitur                   | Keterangan                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| 🎪 Tabel Event          | List semua event (Nama, Lokasi, Tanggal, Peserta, Pelaksana, PIC Report, Dokumentasi)     |
| 🤝 Tabel Kemitraan      | List semua mitra (Nama Mitra, Tanggal, Dokumen PKS, Dokumentasi Kegiatan, Pelaksana, PIC) |
| 📸 Modal Preview Gambar | Klik foto untuk preview + navigasi carousel (prev/next) dengan counter                    |

### Export

| Fitur           | Keterangan                                                            |
| --------------- | --------------------------------------------------------------------- |
| 📊 Export Excel | Download semua data (Finance, Event, Kemitraan) dalam 3 sheet `.xlsx` |
| 📄 Export PDF   | Print halaman via browser print dialog                                |

---

## 📤 Halaman Upload (`/upload`)

> 🔒 Halaman ini dilindungi login (autentikasi khusus)

| Fitur                         | Keterangan                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| 🔐 Login/Logout               | Form login username & password untuk akses halaman; bisa logout                             |
| 📋 Panduan Format CSV         | Info lengkap format kolom (Date, FT Number, Description, Currency, Amount, dll)             |
| 📥 Download Template CSV      | Tombol download template `.csv` rekening koran BSI                                          |
| 🏢 Pilih PIC Finance (Organ)  | Dropdown pilih organ sebelum upload                                                         |
| 📂 File Picker CSV            | Input file `.csv` yang ingin diupload                                                       |
| 👁️ Preview Tabel CSV          | Pratinjau 10 baris pertama data, dengan highlight kolom wajib                               |
| ⚠️ Validasi Header            | Peringatan otomatis jika header CSV tidak lengkap                                           |
| ✅ Proses & Kirim Data        | Tombol submit upload ke server                                                              |
| 📊 Ringkasan Hasil Upload     | 5 statistik: Total Baris, Berhasil Masuk, Auto-Generate FT, Di-skip (Duplikat), Baris Error |
| 🔵 Detail FT Auto-Generate    | List FT Number yang dibuat otomatis (untuk donasi Barang/Tunai)                             |
| 🟡 Detail Duplikat dari DB    | List FT Number yang sudah ada di database (di-skip)                                         |
| 🟠 Detail Duplikat dalam File | List FT Number duplikat dalam file yang sama (di-skip)                                      |
| 🔴 Detail Error per Baris     | Tabel error per baris: nomor baris, FT Number, keterangan kesalahan                         |
| ❌ Validasi Gate              | Jika ada format salah, upload dibatalkan total + tampil tabel pre-insertion error           |

---

## ✅ Halaman Validasi (`/validasi`)

> 🔒 Halaman ini dilindungi login (autentikasi khusus)

| Fitur                      | Keterangan                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| 🔐 Login/Logout            | Form login username & password; bisa logout                                                          |
| 🔍 Filter Organ            | Dropdown filter by organ                                                                             |
| 📅 Filter Tanggal          | Filter by tanggal transaksi                                                                          |
| 🔎 Search                  | Cari by nama donatur, keterangan, atau FT Number                                                     |
| 🔄 Reset Filter            | Tombol reset semua filter; info counter jumlah data tampil                                           |
| 📋 Tabel Transaksi         | Semua data finance (FT Number, Organ, Tanggal, Donatur, Keterangan, Nominal, Status badge)           |
| 🟢/🟡/🔴 Status Badge      | Status visual: Tervalidasi / Pending / Ditolak                                                       |
| ✏️ Edit Data Transaksi     | Modal edit: ubah Tanggal, Nama Donatur, Keterangan, Nominal                                          |
| 👁️ Lihat & Validasi        | Modal form validasi dengan pre-fill auto-tag                                                         |
| 📋 Form Validasi (8 field) | Nama Validator, Kode Unik, Campaign, Tipe Donatur, Jenis Donasi, Kategori, Pelaksana Program, Metode |
| 🤖 Auto-tag Pre-fill       | Field terisi otomatis hasil auto-tagging dari CSV upload                                             |
| ❌ Tolak Transaksi         | Tombol tolak transaksi (dengan konfirmasi dialog)                                                    |
| ↩️ Undo Penolakan          | Kembalikan status Ditolak → Pending (dengan konfirmasi dialog)                                       |
| 💾 Simpan Validasi         | Submit form validasi → status langsung berubah ke Tervalidasi                                        |

---

## 🎪 Halaman Event (`/event`)

| Fitur                  | Keterangan                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| 📝 Form Input Event    | Input data event baru                                            |
| Nama Event             | Field wajib                                                      |
| Lokasi                 | Field wajib                                                      |
| Tanggal Pelaksanaan    | Date picker, field wajib                                         |
| Peserta                | Textarea deskripsi peserta, wajib                                |
| Pelaksana Event        | Field wajib                                                      |
| PIC Report             | Field wajib                                                      |
| 📸 Upload Dokumentasi  | Multi-file upload (gambar/PDF), kompresi otomatis sebelum upload |
| 💾 Submit & Reset Form | Simpan data + reset form otomatis jika berhasil                  |
| ⏳ Status Feedback     | Pesan status real-time (loading, sukses, error)                  |

---

## 🤝 Halaman Kemitraan (`/kemitraan`)

| Fitur                          | Keterangan                                                     |
| ------------------------------ | -------------------------------------------------------------- |
| 📝 Form Input Kemitraan        | Input data mitra baru                                          |
| Nama Mitra                     | Field wajib                                                    |
| Tanggal Kerjasama              | Date picker, wajib                                             |
| Pelaksana Event                | Field wajib                                                    |
| PIC Report                     | Field wajib                                                    |
| 📄 Upload Dokumen PKS          | Multi-file upload (PDF, Word, gambar), opsional, kompresi auto |
| 📸 Upload Dokumentasi Kegiatan | Multi-file upload (gambar/PDF), opsional, kompresi auto        |
| 💾 Submit & Reset Form         | Simpan data + reset form otomatis jika berhasil                |
| ⏳ Status Feedback             | Pesan status real-time (loading, sukses, error)                |
