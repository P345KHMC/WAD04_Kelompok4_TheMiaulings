import StatCard from "../components/StatCard.jsx";
import { formatRupiah } from "../utils/formatRupiah.js";
import { kategoriMenu } from "../data/menuData.js";

function Dashboard({ menu, onPindahHalaman }) {
  const menuTersedia = menu.filter((item) => item.available);
  const menuHabis = menu.filter((item) => !item.available);

  const daftarKategori = kategoriMenu.filter((k) => k !== "Semua");

  return (
    <section>
      <div className="judul-halaman">
        <h1>Ringkasan warkop hari ini</h1>
        <p>
          Cek menu yang siap dijual dan yang perlu dibelanjakan lagi sebelum
          warkop ramai.
        </p>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Total menu"
          nilai={menu.length}
          catatan="Semua menu di daftar"
        />
        <StatCard
          label="Siap dijual"
          nilai={menuTersedia.length}
          catatan="Status tersedia"
        />
        <StatCard
          label="Habis"
          nilai={menuHabis.length}
          catatan="Perlu stok ulang"
        />
        <StatCard
          label="Kategori"
          nilai={daftarKategori.length}
          catatan={daftarKategori.join(", ")}
        />
      </div>

      <div className="dashboard-dua-kolom">
        {/* Papan tulis: daftar menu yang habis, seperti papan di warkop asli */}
        <div className="papan-tulis">
          <h2>Menu habis hari ini</h2>

          {menuHabis.length === 0 ? (
            <p className="papan-kosong">Semua menu tersedia. Aman!</p>
          ) : (
            <ul className="papan-daftar">
              {menuHabis.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="papan-garis"></span>
                  <span>{formatRupiah(item.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <button className="tombol-kapur" onClick={() => onPindahHalaman("menu")}>
            Ubah status di Daftar Menu
          </button>
        </div>

        <div className="ringkas-kategori">
          <h2>Menu per kategori</h2>
          <ul>
            {daftarKategori.map((kategori) => {
              const total = menu.filter((m) => m.category === kategori).length;
              const siap = menu.filter(
                (m) => m.category === kategori && m.available
              ).length;
              return (
                <li key={kategori}>
                  <span>{kategori}</span>
                  <span>
                    {siap} dari {total} tersedia
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
