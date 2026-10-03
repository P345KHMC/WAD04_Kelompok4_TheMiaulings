import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MenuPhoto from "../components/MenuPhoto.jsx";
import ModalKonfirmasi from "../components/ModalKonfirmasi.jsx";
import { useToast } from "../components/Toast.jsx";
import { getMenus } from "../services/menuService.js";
import { getTransaction, addItem, updateItem, deleteItem, updateStatus } from "../services/transactionService.js";
import { formatRupiah } from "../utils/formatRupiah.js";
import { formatJam, formatTanggal } from "../utils/formatTanggal.js";

// Langkah status berikutnya. selesai/dibatalkan = final (terkunci).
const langkah = { pending: { ke: "diproses", label: "Proses pesanan" }, diproses: { ke: "selesai", label: "Tandai selesai" } };

function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [trx, setTrx] = useState(null);
  const [error, setError] = useState("");
  const [menuTersedia, setMenuTersedia] = useState([]);
  const [menuBaru, setMenuBaru] = useState("");
  const [qtyBaru, setQtyBaru] = useState(1);
  const [konfirmBatal, setKonfirmBatal] = useState(false);

  useEffect(() => {
    getTransaction(id).then(setTrx).catch((e) => setError(e.message));
    getMenus({ is_available: true }).then(setMenuTersedia).catch(() => {});
  }, [id]);

  // Semua aksi memakai pola sama: panggil API, backend mengembalikan transaksi terbaru.
  async function jalankan(aksi, pesanSukses) {
    try {
      setTrx(await aksi());
      if (pesanSukses) toast(pesanSukses);
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!trx) return <p className="muted">Memuat pesanan...</p>;

  const terkunci = trx.status === "selesai" || trx.status === "dibatalkan";
  const berikutnya = langkah[trx.status];

  function tambahItem() {
    if (!menuBaru) return toast("Pilih menu dulu.", "error");
    jalankan(() => addItem(trx.id, { menu_id: Number(menuBaru), qty: Number(qtyBaru) }), "Item ditambahkan.");
    setMenuBaru("");
    setQtyBaru(1);
  }

  return (
    <section>
      <PageHeader judul={trx.kode_transaksi} subjudul={`${trx.nama_pelanggan} · ${formatTanggal(trx.created_at)} ${formatJam(trx.created_at)}`}>
        <StatusBadge status={trx.status} />
      </PageHeader>

      {terkunci && <p className="notice">Pesanan ini sudah {trx.status} dan tidak bisa diubah lagi.</p>}

      <div className="tabel">
        {trx.items.map((item) => (
          <div className="tabel-baris item-baris" key={item.id}>
            <div className="thumb"><MenuPhoto menu={item.menu} /></div>
            <div className="tabel-utama">
              <strong>{item.menu.nama}</strong>
              <span className="muted">{formatRupiah(item.harga_satuan)} per item</span>
              {terkunci ? (
                item.catatan && <span className="muted">Catatan: {item.catatan}</span>
              ) : (
                <input className="input-catatan" placeholder="Catatan (opsional)" defaultValue={item.catatan || ""}
                  onBlur={(e) => e.target.value.trim() !== (item.catatan || "") &&
                    jalankan(() => updateItem(trx.id, item.id, { catatan: e.target.value }), "Catatan disimpan.")} />
              )}
            </div>
            {terkunci ? (
              <span>× {item.qty}</span>
            ) : (
              <div className="qty">
                <button className="btn btn-small" disabled={item.qty <= 1} aria-label="Kurangi"
                  onClick={() => jalankan(() => updateItem(trx.id, item.id, { qty: item.qty - 1 }))}>−</button>
                <span>{item.qty}</span>
                <button className="btn btn-small" aria-label="Tambah"
                  onClick={() => jalankan(() => updateItem(trx.id, item.id, { qty: item.qty + 1 }))}>+</button>
              </div>
            )}
            <strong>{formatRupiah(item.subtotal)}</strong>
            {!terkunci && (
              <button className="link-hapus" onClick={() => jalankan(() => deleteItem(trx.id, item.id), "Item dihapus.")}>Hapus</button>
            )}
          </div>
        ))}
      </div>

      <div className="total-baris total-besar"><span>Total</span><strong>{formatRupiah(trx.total_harga)}</strong></div>

      {!terkunci && (
        <div className="tambah-item">
          <select value={menuBaru} onChange={(e) => setMenuBaru(e.target.value)} aria-label="Pilih menu">
            <option value="">+ Tambah item...</option>
            {menuTersedia.filter((m) => m.stok > 0).map((m) => (
              <option key={m.id} value={m.id}>{m.nama} — {formatRupiah(m.harga)}</option>
            ))}
          </select>
          <input type="number" min="1" value={qtyBaru} onChange={(e) => setQtyBaru(e.target.value)} aria-label="Jumlah" />
          <button className="btn" onClick={tambahItem}>Tambah</button>
        </div>
      )}

      <div className="form-aksi">
        <Link to="/orders" className="btn">Kembali</Link>
        {!terkunci && <button className="btn btn-danger" onClick={() => setKonfirmBatal(true)}>Batalkan pesanan</button>}
        {berikutnya && (
          <button className="btn btn-primary" onClick={() => jalankan(() => updateStatus(trx.id, berikutnya.ke), `Status: ${berikutnya.ke}.`)}>
            {berikutnya.label}
          </button>
        )}
      </div>

      {konfirmBatal && (
        <ModalKonfirmasi judul="Batalkan pesanan ini?" labelYa="Ya, batalkan" onBatal={() => setKonfirmBatal(false)}
          onYakin={() => { setKonfirmBatal(false); jalankan(() => updateStatus(trx.id, "dibatalkan"), "Pesanan dibatalkan."); }}>
          Pesanan {trx.kode_transaksi} atas nama {trx.nama_pelanggan} akan dibatalkan dan stok dikembalikan.
        </ModalKonfirmasi>
      )}
    </section>
  );
}

export default OrderDetail;
