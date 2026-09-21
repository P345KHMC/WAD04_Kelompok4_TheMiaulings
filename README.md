# Warkop Kita - Web Management Menu

Tugas kelompok Web Development. Dibuat dengan React + Vite.

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya http://localhost:5173).

## Fitur saat ini

- Dashboard: ringkasan jumlah menu, menu tersedia/habis, dan papan tulis daftar menu habis.
- Daftar Menu: kartu menu, filter kategori, tombol tandai tersedia/habis.
- Data masih dummy (`src/data/menuData.js`). Perubahan status hilang saat halaman di-refresh.

## Struktur

```
src/
├── components/   Header, Footer, StatCard, MenuCard
├── pages/        Dashboard, Menu
├── data/         menuData.js (dummy data)
├── utils/        formatRupiah.js
├── App.jsx       menyimpan state halaman + menu
├── main.jsx      pintu masuk aplikasi
└── index.css     seluruh styling
```

Tidak ada library tambahan selain React dan Vite.
