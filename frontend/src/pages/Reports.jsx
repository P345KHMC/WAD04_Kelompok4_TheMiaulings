import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useToast } from "../components/Toast.jsx";
import { getDaily, getMonthly, getSales, getBestSellers, getSalesByCategory, exportReport } from "../services/reportService.js";
import { formatRupiah } from "../utils/formatRupiah.js";

// "2026-09-05" (format yang dipakai <input type="date"> dan API)
const iso = (tanggal) => tanggal.toLocaleDateString("sv-SE");

function Reports() {
  const toast = useToast();
  const sekarang = new Date();
  const [mulai, setMulai] = useState(iso(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)));
  const [sampai, setSampai] = useState(iso(sekarang));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      getDaily(iso(new Date())),
      getMonthly(new Date().getMonth() + 1, new Date().getFullYear()),
      getSales(mulai, sampai),
      getBestSellers(5, mulai, sampai),
      getSalesByCategory(mulai, sampai),
    ])
      .then(([hariIni, bulanIni, rentang, terlaris, kategori]) => setData({ hariIni, bulanIni, rentang, terlaris, kategori }))
      .catch((e) => setError(e.message));
  }, [mulai, sampai]);

  function pilihCepat(hari) {
    const awal = new Date();
    awal.setDate(awal.getDate() - hari);
    setMulai(iso(awal));
    setSampai(iso(new Date()));
  }

  async function unduh(format) {
    try {
      await exportReport(format, mulai, sampai);
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!data) return <p className="muted">Memuat laporan...</p>;

  const { hariIni, bulanIni, rentang, terlaris, kategori } = data;
  const maksHarian = Math.max(...rentang.harian.map((h) => h.total_penjualan), 1);
  const maksKategori = Math.max(...kategori.map((k) => k.total), 1);
  const rataRata = rentang.jumlah_transaksi ? rentang.total_penjualan / rentang.jumlah_transaksi : 0;

  return (
    <section>
      <PageHeader judul="Laporan" subjudul="Penjualan dihitung dari pesanan berstatus selesai.">
        <div className="btn-grup">
          <button className="btn btn-small" onClick={() => unduh("xlsx")}>Unduh Excel</button>
          <button className="btn btn-small" onClick={() => unduh("pdf")}>Unduh PDF</button>
        </div>
      </PageHeader>

      <div className="overview">
        <div>
          <span className="overview-angka">{formatRupiah(hariIni.total_penjualan)}</span>
          <span className="overview-label">Hari ini · {hariIni.jumlah_transaksi} transaksi</span>
        </div>
        <div>
          <span className="overview-angka">{formatRupiah(bulanIni.total_penjualan)}</span>
          <span className="overview-label">Bulan ini · {bulanIni.jumlah_transaksi} transaksi</span>
        </div>
        <div>
          <span className="overview-angka">{formatRupiah(rataRata)}</span>
          <span className="overview-label">Rata-rata per transaksi (periode dipilih)</span>
        </div>
      </div>

      <div className="toolbar filter-baris">
        <div className="chips">
          <button className="chip" onClick={() => pilihCepat(0)}>Hari ini</button>
          <button className="chip" onClick={() => pilihCepat(6)}>7 hari</button>
          <button className="chip" onClick={() => pilihCepat(29)}>30 hari</button>
        </div>
        <div className="filter-tanggal">
          <label>Dari <input type="date" value={mulai} max={sampai} onChange={(e) => setMulai(e.target.value)} /></label>
          <label>Sampai <input type="date" value={sampai} min={mulai} onChange={(e) => setSampai(e.target.value)} /></label>
        </div>
      </div>

      <h2 className="section-title">Penjualan harian · {formatRupiah(rentang.total_penjualan)}</h2>
      {rentang.harian.length === 0 ? (
        <EmptyState>Belum ada penjualan selesai di periode ini.</EmptyState>
      ) : (
        <div className="chart" role="img" aria-label="Grafik penjualan harian">
          {rentang.harian.map((h) => (
            <div className="chart-kolom" key={h.tanggal} title={`${h.tanggal}: ${formatRupiah(h.total_penjualan)}`}>
              <div className="chart-batang" style={{ height: `${(h.total_penjualan / maksHarian) * 100}%` }} />
              <span>{h.tanggal.slice(8)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="dash-grid" style={{ marginTop: 48 }}>
        <div>
          <h2 className="section-title">Menu terlaris</h2>
          {terlaris.length === 0 && <EmptyState>Belum ada data.</EmptyState>}
          {terlaris.map((m, i) => (
            <div className="order-row" key={m.menu_id}>
              <span><strong>{i + 1}.</strong> {m.nama}</span>
              <span className="muted">{m.qty} terjual · {formatRupiah(m.total)}</span>
            </div>
          ))}
        </div>
        <div>
          <h2 className="section-title">Penjualan per kategori</h2>
          {kategori.length === 0 && <EmptyState>Belum ada data.</EmptyState>}
          {kategori.map((k) => (
            <div className="avail-row" key={k.category_id}>
              <div className="row-between">
                <span>{k.kategori}</span>
                <span className="muted">{k.qty} item · {formatRupiah(k.total)}</span>
              </div>
              <div className="bar"><div className="bar-isi" style={{ width: `${(k.total / maksKategori) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Reports;
