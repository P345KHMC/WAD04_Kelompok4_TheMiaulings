import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { getTransactions } from "../services/transactionService.js";
import { formatRupiah } from "../utils/formatRupiah.js";
import { formatJam, formatTanggal } from "../utils/formatTanggal.js";

const daftarStatus = ["pending", "diproses", "selesai", "dibatalkan"];

function Orders() {
  const [transaksi, setTransaksi] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [mulai, setMulai] = useState("");
  const [sampai, setSampai] = useState("");

  // Filter dikirim ke backend sebagai query: ?status=&start_date=&end_date=
  useEffect(() => {
    setError("");
    getTransactions({ status, start_date: mulai, end_date: sampai })
      .then(setTransaksi)
      .catch((e) => setError(e.message));
  }, [status, mulai, sampai]);

  return (
    <section>
      <PageHeader judul="Pesanan" subjudul="Semua transaksi Warkop Kita.">
        <Link to="/orders/new" className="btn btn-primary">+ Pesanan baru</Link>
      </PageHeader>

      <div className="toolbar filter-baris">
        <div className="chips">
          <button className={status === "" ? "chip aktif" : "chip"} onClick={() => setStatus("")}>Semua</button>
          {daftarStatus.map((s) => (
            <button key={s} className={status === s ? "chip aktif" : "chip"} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
        <div className="filter-tanggal">
          <label>Dari <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} /></label>
          <label>Sampai <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} /></label>
        </div>
      </div>

      {error && <EmptyState>{error}</EmptyState>}
      {!error && !transaksi && <p className="muted">Memuat pesanan...</p>}
      {transaksi && transaksi.length === 0 && <EmptyState>Tidak ada pesanan untuk filter ini.</EmptyState>}
      {transaksi && transaksi.length > 0 && (
        <div className="tabel">
          {transaksi.map((t) => (
            <Link to={`/orders/${t.id}`} className="tabel-baris tabel-link" key={t.id}>
              <div className="tabel-utama">
                <strong>{t.nama_pelanggan}</strong>
                <span className="muted">{t.kode_transaksi} · {formatTanggal(t.created_at)} {formatJam(t.created_at)}</span>
              </div>
              <span className="muted">{t.items.length} item</span>
              <strong>{formatRupiah(t.total_harga)}</strong>
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default Orders;
