# Warkop Kita — Coffee Shop Management System

Final Project Web Development. Frontend React (Vite) + Backend FastAPI + Database (SQLite / PostgreSQL).

```
React  ->  fetch /api/v1  ->  FastAPI  ->  SQLAlchemy  ->  Database
```

## Menjalankan (2 terminal)

**1. Backend** (butuh Python 3.10+)
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   |  source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API jalan di http://localhost:8000 (dokumentasi interaktif: http://localhost:8000/docs).
Saat pertama dijalankan, database `warkop.db` dibuat otomatis beserta data contoh.

**2. Frontend** (butuh Node 18+)
```bash
cd frontend
npm install
npm run dev
```
Buka http://localhost:5173

**Akun demo:** `admin / admin123` dan `kasir / kasir123`.

Reset data: hentikan backend, hapus `backend/warkop.db`, jalankan ulang.

## Hak akses
| Fitur | admin | kasir |
|---|---|---|
| Dashboard, lihat menu, tandai tersedia/habis | ✓ | ✓ |
| Pesanan (buat, ubah item, ubah status) | ✓ | ✓ |
| Tambah/edit/hapus menu + foto | ✓ | – |
| Kategori | ✓ | – |
| Laporan + export | ✓ | – |

## Struktur
```
backend/
  app/  main.py  database.py  models.py  schemas.py  security.py  seed.py
        routers/  auth  categories  menus  transactions  reports
  tests/test_api.py      -> jalankan: python -m pytest
  uploads/               -> foto menu yang diunggah
frontend/
  src/  pages/  components/  services/  utils/  App.jsx  index.css
  public/images/         -> placeholder foto menu
```
`frontend/src/services/*` adalah satu-satunya tempat yang memanggil API. Halaman tidak pernah memanggil `fetch` langsung.

## Aturan bisnis
- Total transaksi dihitung server: `subtotal = qty x harga_satuan`, `total = jumlah subtotal`.
- `harga_satuan` disalin dari menu saat dipesan (harga menu berubah, transaksi lama tetap).
- Alur status: `pending -> diproses -> selesai`; `pending/diproses -> dibatalkan`. `selesai` dan `dibatalkan` terkunci.
- Stok berkurang saat item dipesan, kembali saat item dihapus atau pesanan dibatalkan. Stok 0 otomatis menandai menu habis.
- Menu yang tidak tersedia atau stoknya kurang ditolak saat dipesan.
- Kategori yang masih dipakai menu tidak bisa dihapus (409). Menu yang sudah pernah dipesan tidak bisa dihapus (409).
- Laporan hanya menghitung transaksi `selesai`.

## Catatan: perbedaan dengan dokumen API/ERD (harap diketahui saat presentasi)
1. **Tabel `users` ditambahkan.** ERD hanya punya 4 tabel, tetapi login admin/kasir butuh penyimpanan user.
2. **Endpoint `/reports/sales-by-category`** memakai tanda hubung (PDF menulis `sales-bycategory`, kemungkinan salah ketik).
3. **Logout** (`POST /auth/logout`) mencabut token di memori server; daftar token tercabut hilang jika server restart.
4. **`GET /reports/summary`** boleh diakses kasir (dipakai Dashboard); endpoint laporan lain khusus admin.
5. **Kasir** boleh mengubah ketersediaan menu (`PATCH .../availability`), namun tidak boleh menambah/mengubah/menghapus menu.
6. Response menu menyertakan objek `category` dan item transaksi menyertakan objek `menu` ringkas agar frontend tidak perlu join.
7. Endpoint tambah/ubah/hapus item mengembalikan transaksi terbaru. Kolom laporan `sales` dan `best-sellers` menerima filter tanggal opsional.

## PostgreSQL (opsional)
```bash
pip install psycopg2-binary
set DATABASE_URL=postgresql+psycopg2://user:password@localhost/warkop     # Windows (Mac/Linux: export)
```
Tabel dibuat otomatis. Ganti juga `SECRET_KEY` untuk penggunaan sungguhan.
