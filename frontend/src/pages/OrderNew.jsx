import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import MenuPhoto from "../components/MenuPhoto.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useToast } from "../components/Toast.jsx";
import { getMenus } from "../services/menuService.js";
import { createTransaction } from "../services/transactionService.js";
import { formatRupiah } from "../utils/formatRupiah.js";

// POS sederhana: kiri = katalog menu, kanan = pesanan saat ini.
function OrderNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const [menus, setMenus] = useState(null);
  const [error, setError] = useState("");
  const [kategoriId, setKategoriId] = useState(0);
  const [cari, setCari] = useState("");
  const [keranjang, setKeranjang] = useState([]); // [{ menu, qty, catatan }]
  const [nama, setNama] = useState("");
  const [kirim, setKirim] = useState(false);

  useEffect(() => {
    getMenus().then(setMenus).catch((e) => setError(e.message));
  }, []);

  const bisaDipesan = (m) => m.is_available && m.stok > 0; // menu habis tidak boleh dipilih

  function tambah(menu) {
    const ada = keranjang.find((i) => i.menu.id === menu.id);
    if (ada && ada.qty >= menu.stok) return toast(`Stok ${menu.nama} hanya ${menu.stok}.`, "error");
    if (ada) setKeranjang(keranjang.map((i) => (i.menu.id === menu.id ? { ...i, qty: i.qty + 1 } : i)));
    else setKeranjang([...keranjang, { menu, qty: 1, catatan: "" }]);
  }

  function ubahQty(id, selisih) {
    setKeranjang(keranjang.map((i) =>
      i.menu.id === id ? { ...i, qty: Math.min(Math.max(i.qty + selisih, 1), i.menu.stok) } : i));
  }

  function ubahCatatan(id, catatan) {
    setKeranjang(keranjang.map((i) => (i.menu.id === id ? { ...i, catatan } : i)));
  }

  const total = keranjang.reduce((jumlah, i) => jumlah + i.qty * i.menu.harga, 0);

  async function simpan() {
    if (!nama.trim()) return toast("Isi nama pelanggan dulu.", "error");
    if (keranjang.length === 0) return toast("Pilih minimal satu menu.", "error");
    setKirim(true);
    try {
      const trx = await createTransaction({
        nama_pelanggan: nama.trim(),
        items: keranjang.map((i) => ({ menu_id: i.menu.id, qty: i.qty, catatan: i.catatan.trim() || null })),
      });
      toast(`Pesanan ${trx.kode_transaksi} dibuat.`);
      navigate(`/orders/${trx.id}`);
    } catch (e) {
      toast(e.message, "error");
      setKirim(false);
    }
  }

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!menus) return <p className="muted">Memuat menu...</p>;

  const kategori = [...new Map(menus.map((m) => [m.category.id, m.category])).values()];
  const tampil = menus
    .filter((m) => kategoriId === 0 || m.category_id === kategoriId)
    .filter((m) => m.nama.toLowerCase().includes(cari.trim().toLowerCase()));

  return (
    <section>
      <PageHeader judul="Pesanan baru" subjudul="Pilih menu, atur jumlah, lalu simpan." />

      <div className="pos">
        <div>
          <div className="toolbar">
            <input className="input-cari" placeholder="Cari menu..." value={cari} onChange={(e) => setCari(e.target.value)} />
            <div className="chips">
              <button className={kategoriId === 0 ? "chip aktif" : "chip"} onClick={() => setKategoriId(0)}>Semua</button>
              {kategori.map((k) => (
                <button key={k.id} className={kategoriId === k.id ? "chip aktif" : "chip"} onClick={() => setKategoriId(k.id)}>{k.nama}</button>
              ))}
            </div>
          </div>

          {tampil.length === 0 && <EmptyState>Menu tidak ditemukan.</EmptyState>}
          <div className="pos-grid">
            {tampil.map((m) => (
              <button key={m.id} className="pos-item" disabled={!bisaDipesan(m)} onClick={() => tambah(m)}>
                <MenuPhoto menu={m} />
                <strong>{m.nama}</strong>
                <span className="muted">{bisaDipesan(m) ? formatRupiah(m.harga) : "Habis"}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="pos-order">
          <h2 className="section-title">Pesanan saat ini</h2>
          <div className="field">
            <label htmlFor="pelanggan">Nama pelanggan</label>
            <input id="pelanggan" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="contoh: Rina" />
          </div>

          {keranjang.length === 0 && <p className="muted">Belum ada item. Klik menu di sebelah kiri.</p>}
          {keranjang.map((i) => (
            <div className="cart-item" key={i.menu.id}>
              <div className="row-between">
                <strong>{i.menu.nama}</strong>
                <span>{formatRupiah(i.qty * i.menu.harga)}</span>
              </div>
              <div className="row-between">
                <div className="qty">
                  <button className="btn btn-small" onClick={() => ubahQty(i.menu.id, -1)} aria-label="Kurangi">−</button>
                  <span>{i.qty}</span>
                  <button className="btn btn-small" onClick={() => ubahQty(i.menu.id, 1)} aria-label="Tambah">+</button>
                </div>
                <button className="link-hapus" onClick={() => setKeranjang(keranjang.filter((x) => x.menu.id !== i.menu.id))}>Hapus</button>
              </div>
              <input className="input-catatan" placeholder="Catatan (opsional)" value={i.catatan} onChange={(e) => ubahCatatan(i.menu.id, e.target.value)} />
            </div>
          ))}

          <div className="total-baris"><span>Total</span><strong>{formatRupiah(total)}</strong></div>
          <button className="btn btn-primary btn-lebar" onClick={simpan} disabled={kirim}>
            {kirim ? "Menyimpan..." : "Buat pesanan"}
          </button>
        </aside>
      </div>
    </section>
  );
}

export default OrderNew;
