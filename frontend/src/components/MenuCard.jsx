import { Link } from "react-router-dom";
import MenuPhoto from "./MenuPhoto.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { formatRupiah } from "../utils/formatRupiah.js";

// Satu kartu katalog menu. Tombol Edit dan Hapus hanya untuk admin.
function MenuCard({ menu, isAdmin, onToggle, onHapus }) {
  return (
    <article className={menu.is_available ? "menu-card" : "menu-card habis"}>
      <MenuPhoto menu={menu} />
      <div className="menu-info">
        <h3>{menu.nama}</h3>
        <p className="muted">{menu.category.nama} · {menu.tipe}</p>
        <p className="menu-harga">{formatRupiah(menu.harga)}</p>
        <div className="row-between">
          <StatusBadge status={menu.is_available ? "tersedia" : "habis"} />
          <span className="muted">Stok {menu.stok}</span>
        </div>
      </div>
      <div className="menu-aksi">
        {isAdmin && <Link to={`/menu/${menu.id}/edit`} className="btn btn-small">Edit</Link>}
        <button className="btn btn-small" onClick={() => onToggle(menu)}>
          {menu.is_available ? "Tandai habis" : "Tandai tersedia"}
        </button>
        {isAdmin && <button className="btn btn-small btn-danger" onClick={() => onHapus(menu)}>Hapus</button>}
      </div>
    </article>
  );
}

export default MenuCard;
