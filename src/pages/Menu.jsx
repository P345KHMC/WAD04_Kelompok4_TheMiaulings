import { useState } from "react";
import MenuCard from "../components/MenuCard.jsx";
import { kategoriMenu } from "../data/menuData.js";

function Menu({ menu, onUbahKetersediaan }) {
  const [kategoriAktif, setKategoriAktif] = useState("Semua");

  const menuTampil =
    kategoriAktif === "Semua"
      ? menu
      : menu.filter((item) => item.category === kategoriAktif);

  return (
    <section>
      <div className="judul-halaman">
        <h1>Daftar menu</h1>
        <p>
          Menampilkan {menuTampil.length} dari {menu.length} menu.
        </p>
      </div>

      <div className="filter" role="group" aria-label="Filter kategori">
        {kategoriMenu.map((kategori) => (
          <button
            key={kategori}
            className={kategori === kategoriAktif ? "chip aktif" : "chip"}
            onClick={() => setKategoriAktif(kategori)}
          >
            {kategori}
          </button>
        ))}
      </div>

      {menuTampil.length === 0 ? (
        <p className="kosong">Belum ada menu di kategori ini.</p>
      ) : (
        <div className="menu-grid">
          {menuTampil.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onUbahKetersediaan={onUbahKetersediaan}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Menu;
