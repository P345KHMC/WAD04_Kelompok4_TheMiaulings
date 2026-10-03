import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import MenuCard from "../components/MenuCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ModalKonfirmasi from "../components/ModalKonfirmasi.jsx";
import { useToast } from "../components/Toast.jsx";
import { getMenus, updateAvailability, deleteMenu } from "../services/menuService.js";

// Katalog visual: foto, nama, kategori, harga, status. Admin bisa edit/hapus.
function Menu({ user }) {
  const toast = useToast();
  const isAdmin = user.role === "admin";
  const [menus, setMenus] = useState(null);
  const [error, setError] = useState("");
  const [cari, setCari] = useState("");
  const [kategoriId, setKategoriId] = useState(0); // 0 = semua
  const [menuHapus, setMenuHapus] = useState(null);

  function muat() {
    getMenus().then(setMenus).catch((e) => setError(e.message));
  }
  useEffect(muat, []);

  async function ubahKetersediaan(menu) {
    try {
      await updateAvailability(menu.id, !menu.is_available);
      toast(`${menu.nama} ditandai ${menu.is_available ? "habis" : "tersedia"}.`);
      muat();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function konfirmasiHapus() {
    try {
      await deleteMenu(menuHapus.id);
      toast(`${menuHapus.nama} dihapus.`);
      muat();
    } catch (e) {
      toast(e.message, "error"); // contoh: menu sudah pernah dipesan (409)
    }
    setMenuHapus(null);
  }

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!menus) return <p className="muted">Memuat menu...</p>;

  const kategori = [...new Map(menus.map((m) => [m.category.id, m.category])).values()];
  const tampil = menus
    .filter((m) => kategoriId === 0 || m.category_id === kategoriId)
    .filter((m) => m.nama.toLowerCase().includes(cari.trim().toLowerCase()));

  return (
    <section>
      <PageHeader judul="Menu" subjudul={isAdmin ? "Kelola menu Warkop Kita." : "Daftar menu Warkop Kita."}>
        {isAdmin && <Link to="/menu/new" className="btn btn-primary">+ Tambah menu</Link>}
      </PageHeader>

      <div className="toolbar">
        <input className="input-cari" placeholder="Cari menu..." value={cari}
          onChange={(e) => setCari(e.target.value)} aria-label="Cari menu" />
        <div className="chips">
          <button className={kategoriId === 0 ? "chip aktif" : "chip"} onClick={() => setKategoriId(0)}>Semua</button>
          {kategori.map((k) => (
            <button key={k.id} className={kategoriId === k.id ? "chip aktif" : "chip"} onClick={() => setKategoriId(k.id)}>
              {k.nama}
            </button>
          ))}
        </div>
      </div>

      {tampil.length === 0 ? (
        <EmptyState>{cari ? `Tidak ada menu bernama "${cari}".` : "Belum ada menu di kategori ini."}</EmptyState>
      ) : (
        <div className="menu-grid">
          {tampil.map((m) => (
            <MenuCard key={m.id} menu={m} isAdmin={isAdmin} onToggle={ubahKetersediaan} onHapus={setMenuHapus} />
          ))}
        </div>
      )}

      {menuHapus && (
        <ModalKonfirmasi judul="Hapus menu ini?" labelYa="Ya, hapus" onYakin={konfirmasiHapus} onBatal={() => setMenuHapus(null)}>
          {menuHapus.nama} akan dihapus dari katalog dan tidak bisa dikembalikan.
        </ModalKonfirmasi>
      )}
    </section>
  );
}

export default Menu;
