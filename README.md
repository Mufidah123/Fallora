# FALLORA
## E-Commerce Platform

**Fallora** adalah aplikasi E-Commerce berbasis web yang dirancang untuk memfasilitasi aktivitas jual beli secara online melalui satu platform. Fallora menghubungkan Buyer dan Seller dalam sebuah marketplace dengan sistem pengelolaan produk, toko, keranjang belanja, pesanan, serta ulasan produk.

---

## 1. Tema Project

**E-Commerce (Online Marketplace)**

Fallora mengusung konsep marketplace dengan identitas visual bertema *Autumn*. Penggunaan elemen daun dan warna hangat menjadi identitas visual pendukung, sementara pengalaman berbelanja tetap menjadi fokus utama aplikasi.

## 2. Deskripsi Produk

Fallora merupakan platform E-Commerce yang memungkinkan pengguna untuk menjelajahi berbagai produk, melakukan pembelian, serta mengelola aktivitas jual beli secara online.

Platform ini menyediakan tiga peran pengguna utama, yaitu:

- **Admin:** Mengelola pengguna, kategori produk, serta memverifikasi pendaftaran Seller.
- **Seller:** Mengelola toko, produk, dan pesanan yang diterima.
- **Buyer:** Menjelajahi produk, mengelola keranjang belanja, melakukan checkout, serta memberikan ulasan dan rating terhadap produk yang telah dibeli.

Pengunjung yang belum memiliki akun juga dapat melihat katalog dan detail produk tanpa harus melakukan login.

## 3. Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| Next.js | Framework pengembangan aplikasi web. |
| React.js | Membangun antarmuka pengguna berbasis komponen. |
| Tailwind CSS | Styling dan pengaturan tampilan aplikasi. |
| JavaScript (JSX) | Bahasa pemrograman dan penulisan komponen. |
| PostgreSQL | Sistem manajemen basis data relasional. |
| Node.js | Lingkungan eksekusi JavaScript pada sisi server. |
| node-postgres (`pg`) | Menghubungkan aplikasi dengan PostgreSQL menggunakan SQL. |
| bcryptjs | Melakukan hashing password. |
| Resend | Layanan pengiriman email notifikasi. |
| falling-leaves | Efek animasi dekorasi daun berguguran. |

## 4. Fitur dan Fungsionalitas

### A. Guest (Pengunjung)

- Melihat halaman utama.
- Menjelajahi katalog produk.
- Melihat detail produk.
- Melihat kategori produk.
- Melakukan registrasi dan login.

### B. Buyer (Pembeli)

- Mengelola profil pengguna.
- Menjelajahi dan mencari produk.
- Menambahkan produk ke keranjang.
- Mengelola item keranjang belanja.
- Melakukan checkout.
- Melihat riwayat dan status pesanan.
- Mengelola alamat pengiriman.
- Mengelola wishlist.
- Memberikan rating dan ulasan setelah pesanan selesai.
- Mendaftar menjadi Seller.

### C. Seller (Penjual)

- Mendaftarkan toko dan menunggu verifikasi Admin.
- Mengelola informasi toko.
- Menambahkan, mengedit, dan menghapus produk.
- Mengelola kategori produk sesuai kebutuhan toko.
- Mengelola stok produk.
- Melihat dan mengelola pesanan yang masuk.
- Memperbarui status pesanan.

### D. Admin

- Melihat dashboard dan ringkasan aktivitas.
- Mengelola data pengguna.
- Memverifikasi pendaftaran Seller.
- Menyetujui atau menolak pendaftaran Seller.
- Mengelola kategori produk.
- Memantau dan mengelola produk.
- Mengelola aktivitas marketplace.

## 5. Struktur Database

Fallora menggunakan PostgreSQL sebagai sistem manajemen basis data.

Database dirancang untuk menyimpan data yang berkaitan dengan:

- Users
- Stores
- Categories
- Products
- Product Images
- Carts
- Cart Items
- Addresses
- Orders
- Sub Orders
- Order Items
- Reviews

### Membuat Database

1. Pastikan PostgreSQL sudah terinstal dan berjalan.
2. Buat database baru melalui PostgreSQL dengan cara:
```bash
CREATE DATABASE db_fallora;
```
3. Jalankan file `db_fallora.sql` untuk membuat tabel, relasi, dan struktur database.
4. Sesuaikan konfigurasi koneksi database pada file `.env.local`.

### Menambahkan Data Pengguna

Tersedia dua cara untuk menambahkan data pengguna awal.

**Menggunakan SQL**

Jalankan query atau data awal yang tersedia pada file `db_fallora.sql` jika memang sudah disertakan di dalamnya.

**Menggunakan Script JavaScript**

Project menyediakan file `users-data.js` untuk memasukkan data pengguna awal ke database.

Jalankan perintah berikut dari terminal pada direktori utama project:

```bash
node --env-file=.env.local users-data.js
```

Pastikan konfigurasi database pada `.env.local` sudah sesuai sebelum menjalankan script.

## 6. Instalasi dan Menjalankan Project

### Persyaratan

Pastikan perangkat telah memiliki:

- Node.js.
- npm.
- PostgreSQL.
- Git (opsional, jika menggunakan Git).

### Langkah Instalasi

**1. Clone repository**

```bash
git clone <URL_REPOSITORY>
```

**2. Masuk ke direktori project**

```bash
cd fallora
```

**3. Instal seluruh dependency**

```bash
npm install
```

**4. Konfigurasi Environment Variables**

Buat file `.env.local` pada direktori utama project.

Isi konfigurasi sesuai kebutuhan aplikasi, termasuk koneksi PostgreSQL.

Contoh konfigurasi Resend:

```env
RESEND_API_KEY=
EMAIL_FROM="Fallora <onboarding@resend.dev>"
```

Sesuaikan juga variabel koneksi database dengan konfigurasi yang digunakan pada source code.

**5. Siapkan Database**

Buat database PostgreSQL dan jalankan file `db_fallora.sql` untuk membuat struktur tabel.

Jika diperlukan, jalankan script `users-data.js` untuk memasukkan data pengguna awal.

**6. Jalankan aplikasi**

```bash
npm run dev
```

**7. Buka aplikasi**

Akses alamat berikut melalui browser:

```text
http://localhost:3000
```

## 7. Konfigurasi Email (Resend)

Fallora menggunakan Resend sebagai layanan pengiriman email notifikasi, khususnya untuk pemberitahuan persetujuan pendaftaran Seller.

Penggunaan Resend bersifat opsional untuk menjalankan aplikasi.

### Jika Ingin Mengaktifkan Pengiriman Email

1. Buat akun pada [Resend](https://resend.com/).
2. Buat API Key melalui dashboard Resend.
3. Masukkan API Key ke dalam file `.env.local`.
4. Atur `EMAIL_FROM` sesuai alamat pengirim yang telah dikonfigurasi.
5. Restart aplikasi.

Contoh:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM="Fallora <onboarding@resend.dev>"
```

**Catatan:**

- API Key merupakan informasi rahasia dan tidak disertakan dalam repository.
- Alamat `onboarding@resend.dev` digunakan untuk pengujian dan memiliki batasan penerima.
- Untuk mengirim email ke penerima lain, diperlukan domain yang telah diverifikasi melalui Resend.
- Jika Resend tidak dikonfigurasi, fitur utama aplikasi tetap dapat digunakan. Proses persetujuan Seller tetap berjalan, tetapi notifikasi email tidak dikirim.

Dokumentasi resmi: https://resend.com/docs

## 8. Catatan Penggunaan

- Pastikan PostgreSQL sudah aktif sebelum menjalankan aplikasi.
- Pastikan konfigurasi database pada `.env.local` sesuai.
- Jalankan `npm install` sebelum menjalankan aplikasi untuk pertama kali.
- Jangan membagikan file `.env.local` karena dapat berisi informasi sensitif.
- Jangan mengunggah API Key ke repository publik.
- Untuk menjalankan fitur email, diperlukan konfigurasi Resend tersendiri.
- Pastikan folder penyimpanan gambar produk tersedia dan dapat diakses oleh aplikasi.

## 9. Credits dan Acknowledgements

Fallora menggunakan beberapa library dan layanan pihak ketiga dalam proses pengembangannya.

- **Next.js:** Framework aplikasi web.
- **React:** Library antarmuka pengguna.
- **Tailwind CSS:** Framework CSS.
- **PostgreSQL:** Sistem manajemen database.
- **Resend:** Layanan pengiriman email.
- **falling-leaves:** Package animasi daun berguguran oleh Erin (@erin# FALLORA — E-Commerce Platform

**Fallora** adalah aplikasi E-Commerce berbasis web yang dirancang untuk memfasilitasi aktivitas jual beli secara online melalui satu platform. Fallora menghubungkan Buyer dan Seller dalam sebuah marketplace dengan sistem pengelolaan produk, toko, keranjang belanja, pesanan, serta ulasan produk.

---

## 1. Tema Project

**E-Commerce — Online Marketplace**

Fallora mengusung konsep marketplace dengan identitas visual bertema *Autumn*. Penggunaan elemen daun dan warna hangat menjadi identitas visual pendukung, sementara pengalaman berbelanja tetap menjadi fokus utama aplikasi.

## 2. Deskripsi Produk

Fallora merupakan platform E-Commerce yang memungkinkan pengguna untuk menjelajahi berbagai produk, melakukan pembelian, serta mengelola aktivitas jual beli secara online.

Platform ini menyediakan tiga peran pengguna utama, yaitu:

- **Admin:** Mengelola pengguna, kategori produk, serta memverifikasi pendaftaran Seller.
- **Seller:** Mengelola toko, produk, dan pesanan yang diterima.
- **Buyer:** Menjelajahi produk, mengelola keranjang belanja, melakukan checkout, serta memberikan ulasan dan rating terhadap produk yang telah dibeli.

Pengunjung yang belum memiliki akun juga dapat melihat katalog dan detail produk tanpa harus melakukan login.

## 3. Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| Next.js | Framework pengembangan aplikasi web. |
| React.js | Membangun antarmuka pengguna berbasis komponen. |
| Tailwind CSS | Styling dan pengaturan tampilan aplikasi. |
| JavaScript (JSX) | Bahasa pemrograman dan penulisan komponen. |
| PostgreSQL | Sistem manajemen basis data relasional. |
| Node.js | Lingkungan eksekusi JavaScript pada sisi server. |
| node-postgres (`pg`) | Menghubungkan aplikasi dengan PostgreSQL menggunakan SQL. |
| bcryptjs | Melakukan hashing password. |
| Resend | Layanan pengiriman email notifikasi. |
| falling-leaves | Efek animasi dekorasi daun berguguran. |

## 4. Fitur dan Fungsionalitas

### A. Guest (Pengunjung)

- Melihat halaman utama.
- Menjelajahi katalog produk.
- Melihat detail produk.
- Melihat kategori produk.
- Melakukan registrasi dan login.

### B. Buyer (Pembeli)

- Mengelola profil pengguna.
- Menjelajahi dan mencari produk.
- Menambahkan produk ke keranjang.
- Mengelola item keranjang belanja.
- Melakukan checkout.
- Melihat riwayat dan status pesanan.
- Mengelola alamat pengiriman.
- Mengelola wishlist.
- Memberikan rating dan ulasan setelah pesanan selesai.
- Mendaftar menjadi Seller.

### C. Seller (Penjual)

- Mendaftarkan toko dan menunggu verifikasi Admin.
- Mengelola informasi toko.
- Menambahkan, mengedit, dan menghapus produk.
- Mengelola kategori produk sesuai kebutuhan toko.
- Mengelola stok produk.
- Melihat dan mengelola pesanan yang masuk.
- Memperbarui status pesanan.

### D. Admin

- Melihat dashboard dan ringkasan aktivitas.
- Mengelola data pengguna.
- Memverifikasi pendaftaran Seller.
- Menyetujui atau menolak pendaftaran Seller.
- Mengelola kategori produk.
- Memantau dan mengelola produk.
- Mengelola aktivitas marketplace.

## 5. Struktur Database

Fallora menggunakan PostgreSQL sebagai sistem manajemen basis data.

Database dirancang untuk menyimpan data yang berkaitan dengan:

- Users
- Stores
- Categories
- Products
- Product Images
- Carts
- Cart Items
- Addresses
- Orders
- Sub Orders
- Order Items
- Reviews

### Membuat Database

1. Pastikan PostgreSQL sudah terinstal dan berjalan.
2. Buat database baru melalui PostgreSQL.
3. Jalankan file `db_fallora.sql` untuk membuat tabel, relasi, dan struktur database.
4. Sesuaikan konfigurasi koneksi database pada file `.env.local`.

### Menambahkan Data Pengguna

Tersedia dua cara untuk menambahkan data pengguna awal.

**Menggunakan SQL**

Jalankan query atau data awal yang tersedia pada file `db_fallora.sql` jika memang sudah disertakan di dalamnya.

**Menggunakan Script JavaScript**

Project menyediakan file `users-data.js` untuk memasukkan data pengguna awal ke database.

Jalankan perintah berikut dari terminal pada direktori utama project:

```bash
node --env-file=.env.local users-data.js
```

Pastikan konfigurasi database pada `.env.local` sudah sesuai sebelum menjalankan script.

## 6. Instalasi dan Menjalankan Project

### Persyaratan

Pastikan perangkat telah memiliki:

- Node.js.
- npm.
- PostgreSQL.
- Git (opsional, jika menggunakan Git).

### Langkah Instalasi

**1. Clone repository**

```bash
git clone <URL_REPOSITORY>
```

**2. Masuk ke direktori project**

```bash
cd fallora
```

**3. Instal seluruh dependency**

```bash
npm install
```

**4. Konfigurasi Environment Variables**

Buat file `.env.local` pada direktori utama project.

Isi konfigurasi sesuai kebutuhan aplikasi, termasuk koneksi PostgreSQL.

Contoh konfigurasi Resend:

```env
RESEND_API_KEY=
EMAIL_FROM="Fallora <onboarding@resend.dev>"
```

Sesuaikan juga variabel koneksi database dengan konfigurasi yang digunakan pada source code.

**5. Siapkan Database**

Buat database PostgreSQL dan jalankan file `db_fallora.sql` untuk membuat struktur tabel.

Jika diperlukan, jalankan script `users-data.js` untuk memasukkan data pengguna awal.

**6. Jalankan aplikasi**

```bash
npm run dev
```

**7. Buka aplikasi**

Akses alamat berikut melalui browser:

```text
http://localhost:3000
```

## 7. Konfigurasi Email (Resend)

Fallora menggunakan Resend sebagai layanan pengiriman email notifikasi, khususnya untuk pemberitahuan persetujuan pendaftaran Seller.

Penggunaan Resend bersifat opsional untuk menjalankan aplikasi.

### Jika Ingin Mengaktifkan Pengiriman Email

1. Buat akun pada [Resend](https://resend.com/).
2. Buat API Key melalui dashboard Resend.
3. Masukkan API Key ke dalam file `.env.local`.
4. Atur `EMAIL_FROM` sesuai alamat pengirim yang telah dikonfigurasi.
5. Restart aplikasi.

Contoh:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM="Fallora <onboarding@resend.dev>"
```

**Catatan:**

- API Key merupakan informasi rahasia dan tidak disertakan dalam repository.
- Alamat `onboarding@resend.dev` digunakan untuk pengujian dan memiliki batasan penerima.
- Untuk mengirim email ke penerima lain, diperlukan domain yang telah diverifikasi melalui Resend.
- Jika Resend tidak dikonfigurasi, fitur utama aplikasi tetap dapat digunakan. Proses persetujuan Seller tetap berjalan, tetapi notifikasi email tidak dikirim.

Dokumentasi resmi: https://resend.com/docs

## 8. Catatan Penggunaan

- Pastikan PostgreSQL sudah aktif sebelum menjalankan aplikasi.
- Pastikan konfigurasi database pada `.env.local` sesuai.
- Jalankan `npm install` sebelum menjalankan aplikasi untuk pertama kali.
- Jangan membagikan file `.env.local` karena dapat berisi informasi sensitif.
- Jangan mengunggah API Key ke repository publik.
- Untuk menjalankan fitur email, diperlukan konfigurasi Resend tersendiri.
- Pastikan folder penyimpanan gambar produk tersedia dan dapat diakses oleh aplikasi.

## 9. Credits dan Acknowledgements

Fallora menggunakan beberapa library dan layanan pihak ketiga dalam proses pengembangannya.

- **Next.js:** Framework aplikasi web.
- **React:** Library antarmuka pengguna.
- **Tailwind CSS:** Framework CSS.
- **PostgreSQL:** Sistem manajemen database.
- **Resend:** Layanan pengiriman email.
- **falling-leaves:** Package animasi daun berguguran oleh Erin (@erin.codes, ernkerr).

Seluruh library dan package pihak ketiga tetap mengikuti lisensi masing-masing.

---

**Fallora — Bring the Warmth of Autumn to Your Shopping Experience.**).

Seluruh library dan package pihak ketiga tetap mengikuti lisensi masing-masing.
---