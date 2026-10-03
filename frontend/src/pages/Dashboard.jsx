import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import MenuPhoto from "../components/MenuPhoto.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { getMenus } from "../services/menuService.js";
import { getTransactions } from "../services/transactionService.js";
import { getSummary } from "../services/reportService.js";
import { formatRupiah } from "../utils/formatRupiah.js";
import { formatJam } from "../utils/formatTanggal.js";

function sapaan() {
  const jam = new Date().getHours();
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

// Dashboard menjawab: "Apa yang sedang terjadi di Warkop Kita?"
function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMenus(), getTransactions(), getSummary()])
      .then(([menus, transactions, summary]) => setData({ menus, transactions, summary }))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <p className="muted">Memuat data...</p>;

  const { menus, transactions, summary } = data;
  const menuHabis = menus.filter((m) => !m.is_available);

  // Kategori diambil dari data menu (kasir tidak punya akses ke /categories).
  const kategori = [...new Map(menus.map((m) => [m.category.id, m.category])).values()];

  return (
    <section>
      <PageHeader judul={`${sapaan()}, ${user.nama}.`} subjudul="Ini kondisi Warkop Kita hari ini." />

      <div className="overview">
        <div>
          <span className="overview-angka">{summary.jumlah_transaksi}</span>
          <span className="overview-label">Pesanan hari ini</span>
        </div>
        <div>
          <span className="overview-angka">{formatRupiah(summary.total_penjualan)}</span>
          <span className="overview-label">Penjualan selesai</span>
        </div>
        <div>
          <span className="overview-angka">{menuHabis.length}</span>
          <span className="overview-label">Menu habis</span>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <h2 className="section-title">Ketersediaan menu</h2>
          {kategori.map((k) => {
            const daftar = menus.filter((m) => m.category_id === k.id);
            const tersedia = daftar.filter((m) => m.is_available).length;
            return (
              <div className="avail-row" key={k.id}>
                <div className="row-between">
                  <span>{k.nama}</span>
                  <span className="muted">{tersedia} dari {daftar.length} tersedia</span>
                </div>
                <div className="bar"><div className="bar-isi" style={{ width: `${(tersedia / daftar.length) * 100}%` }} /></div>
              </div>
            );
          })}
          {menuHabis.length > 0 && (
            <p className="hint">
              Perlu perhatian: {menuHabis.map((m) => m.nama).join(", ")}. <Link to="/menu">Lihat menu</Link>
            </p>
          )}
        </div>

        <div>
          <div className="row-between">
            <h2 className="section-title">Pesanan terbaru</h2>
            <Link to="/orders" className="muted">Lihat semua</Link>
          </div>
          {transactions.length === 0 && <EmptyState>Belum ada pesanan.</EmptyState>}
          {transactions.slice(0, 5).map((t) => (
            <Link to={`/orders/${t.id}`} className="order-row" key={t.id}>
              <div>
                <strong>{t.nama_pelanggan}</strong>
                <span className="muted"> · {t.kode_transaksi} · {formatJam(t.created_at)}</span>
              </div>
              <div className="order-row-kanan">
                <span>{formatRupiah(t.total_harga)}</span>
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="section-title">Menu terlaris hari ini</h2>
      {summary.menu_terlaris.length === 0 ? (
        <EmptyState>Belum ada pesanan selesai hari ini.</EmptyState>
      ) : (
        <div className="best-list">
          {summary.menu_terlaris.map((m) => (
            <div className="best-item" key={m.menu_id}>
              <MenuPhoto menu={m} />
              <strong>{m.nama}</strong>
              <span className="muted">{m.qty} terjual</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Dashboard;
