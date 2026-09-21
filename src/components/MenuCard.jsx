import { formatRupiah } from "../utils/formatRupiah.js";

function MenuCard({ item, onUbahKetersediaan }) {
  return (
    <article className={item.available ? "menu-card" : "menu-card habis"}>
      <div className="menu-atas">
        <span className="menu-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <span className={item.available ? "status tersedia" : "status kosong"}>
          {item.available ? "Tersedia" : "Habis"}
        </span>
      </div>

      <h3 className="menu-nama">{item.name}</h3>
      <p className="menu-kategori">{item.category}</p>
      <p className="menu-deskripsi">{item.description}</p>

      <div className="menu-bawah">
        <span className="menu-harga">{formatRupiah(item.price)}</span>
        <button
          className="tombol-kecil"
          onClick={() => onUbahKetersediaan(item.id)}
        >
          {item.available ? "Tandai habis" : "Tandai tersedia"}
        </button>
      </div>
    </article>
  );
}

export default MenuCard;
