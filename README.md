<div align="center">

<img src="public/logo.png" alt="WxCofLog Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);" />

# WxCofLog.
### *Neural Supply Chain & Intelligent Coffee Shop Inventory Assistant*

[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-3_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://aistudio.google.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

<p align="center">
  Aplikasi manajemen rantai pasok dan inventaris kedai kopi berbasis kecerdasan buatan (AI) yang dirancang khusus untuk UMKM F&B. Membantu pemilik kedai memprediksi kebutuhan stok, mencegah kehabisan bahan baku (stockouts), mengotomatisasi daftar belanja, dan memonitor kadaluwarsa bahan secara real-time.
</p>

[Fitur Utama](#-fitur-utama) • [Tech Stack](#-teknologi--stack) • [Cara Instalasi](#-panduan-instalasi--menjalankan-lokal) • [Struktur Proyek](#-struktur-direktori) • [Lisensi](#-lisensi)

---

</div>

## ✨ Fitur Utama

### 1. 🤖 Restock AI (Powered by Google Gemini 3 Flash)
- **Prediksi Kebutuhan Otomatis:** Menghitung sisa hari ketersediaan (*runout days*) untuk setiap bahan baku berdasarkan rata-rata konsumsi harian.
- **Rekomendasi Belanja Cerdas:** Menghasilkan rekomendasi restock prioritas (*Critical*, *Warning*, *Safe*) dengan mempertimbangkan konteks eksternal (misalnya: konser, akhir pekan, atau cuaca).
- **Strategi Promo Dinamis:** Memberikan rekomendasi promo bundling atau diskon menu untuk bahan baku yang mendekati tanggal kadaluwarsa (*FEFO - First Expired, First Out*).

### 2. 📦 Real-time Inventory Management
- Pelacakan stok bahan baku (biji kopi, susu, sirup, cup, dsb) secara langsung terhubung ke **Cloud Firestore**.
- Peringatan stok kritis (*minimum stock threshold*).
- Filter kategori, pencarian instan, dan penyortiran data cepat.
- Pelacakan tanggal kadaluwarsa per batch item.

### 3. 📈 Forecasting & Demand Analytics
- Grafik visual interaktif dengan **Recharts** untuk memantau fluktuasi stok dan proyeksi penggunaan harian/mingguan.
- Evaluasi pola konsumsi dan rasio perputaran barang (*inventory turnover*).

### 4. 👥 Multi-tenant Team & Role Nodes
- Sistem multi-kedai terisolasi: Buat kedai baru atau gabung kedai yang sudah ada menggunakan kode undangan (*Join Code*).
- Regenerasi kode gabung dengan masa berlaku dinamis (otomatis kedaluwarsa setelah 30 menit).
- Pembagian peran pengguna:
  - **Owner:** Akses penuh (Manajemen stok, riwayat penjualan, forecasting, pengelolaan anggota tim, hingga penghapusan kedai).
  - **Staff:** Akses terarah untuk operasional harian (Overview & input/update stok).

### 5. 💬 Interactive AI Copilot Assistant
- Asisten virtual mengambang (*floating widget*) yang dapat diajak berdiskusi tentang strategi operasional, analisis tren menu terlaris, dan solusi kendala inventaris kedai.

### 6. 📱 Native-Feel Dark UI/UX
- Menggunakan tema modern *Obsidian & Gold* dengan estetika Bento Grid.
- *Code-Splitting (Lazy Loading)* untuk performa muat awal yang sangat cepat dan hemat kuota/memori.
- Navigasi melayang (*Floating Pill Navbar*), kustom scrollbar tersembunyi (*clean full-screen aesthetic*), dan proteksi seleksi teks untuk pengalaman selayaknya aplikasi native.

---

## 🛠️ Teknologi & Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Library UI performa tinggi dengan type-safety |
| **Build Tool & Bundler** | Vite 6 | Development server instan dan bundling teroptimasi |
| **Styling & Design System** | Tailwind CSS v4 | Styling modern dengan variabel tema berbasis CSS murni |
| **Animations & Modals** | Motion (`motion/react`) | Transisi halus, modal interaktif, dan animasi mikro |
| **Icons** | Lucide React | Ikon modern, konsisten, dan ringan |
| **Visualisasi Data** | Recharts | Grafik tren inventaris & proyeksi stok |
| **Kecerdasan Buatan (AI)** | `@google/genai` (Gemini 3 Flash) | Analisis prediktif inventaris dan asisten obrolan |
| **Autentikasi & Database** | Firebase Auth & Cloud Firestore | Login Google satu klik & database NoSQL real-time |

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.0.0 atau lebih baru.
- Akun [Google AI Studio](https://aistudio.google.com/) untuk mendapatkan Gemini API Key gratis.

### Langkah-langkah:

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/username/wxcoflog.git
   cd wxcoflog
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables (`.env`):**
   Salin file template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan API Key Gemini Anda:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```

4. **Jalankan server pengembangan lokal:**
   ```bash
   npm run dev
   ```
   Buka browser dan akses alamat yang tertera (biasanya `http://localhost:3000`).

5. **Build untuk Produksi:**
   ```bash
   npm run build
   ```
   Output file produksi yang sudah dioptimasi dan di-code-split akan berada di dalam folder `dist/`.

---

## 📁 Struktur Direktori

```text
wxcoflog/
├── public/                     # Aset statis publik (logo, favicon, dsb)
│   └── logo.png
├── src/
│   ├── components/             # Komponen UI modular
│   │   ├── AIAssistant.tsx     # Widget floating asisten AI
│   │   └── Layout.tsx          # Sidebar navigasi & kerangka dashboard
│   ├── data/                   # Data mock & sampel untuk demonstrasi awal
│   │   └── mockData.ts
│   ├── lib/                    # Fungsi pembantu utilitas (clsx & tailwind-merge)
│   ├── services/               # Integrasi API pihak ketiga
│   │   ├── firebase.ts         # Inisialisasi Firebase Auth & Firestore
│   │   └── geminiService.ts    # Service inferensi Google Gemini AI
│   ├── views/                  # Halaman utama aplikasi (Lazy-Loaded)
│   │   ├── Forecasting.tsx     # Analisis tren & proyeksi stok
│   │   ├── Inventory.tsx       # Manajemen item & batch stok
│   │   ├── Landing.tsx         # Halaman muka & autentikasi pengguna
│   │   ├── Overview.tsx        # Ringkasan KPI operasional kedai
│   │   ├── RestockAI.tsx       # Halaman kalkulator restock berbasis AI
│   │   ├── SalesHistory.tsx    # Catatan riwayat transaksi penjualan
│   │   └── Team.tsx            # Manajemen peran staf & kedai
│   ├── App.tsx                 # Orkestrasi router, state global, & modal
│   ├── index.css               # Desain sistem global & aturan scrollbar
│   ├── main.tsx                # Entry point aplikasi React
│   └── types.ts                # Definisi TypeScript interface & types
├── .env.example                # Template variabel lingkungan aman
├── .gitignore                  # Berkas proteksi file sensitif & build output
├── firebase-applet-config.json # Konfigurasi client Firebase
├── firestore.rules             # Aturan keamanan database Firestore
├── package.json                # Daftar dependensi & script proyek
├── tsconfig.json               # Konfigurasi TypeScript compiler
└── vite.config.ts              # Konfigurasi Vite & Tailwind plugin
```

---

## 🔒 Keamanan & Data Sensitif

- File `.env` yang berisi kredensial dan API Key privat **sudah dimasukkan ke dalam `.gitignore`** dan tidak boleh di-push ke repositori publik.
- Aturan keamanan Firestore telah didefinisikan dalam `firestore.rules` untuk memastikan setiap pengguna hanya dapat mengakses data kedai di mana mereka terdaftar sebagai anggota tim aktif.

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **Apache 2.0**. Lihat file lisensi untuk informasi selengkapnya.
