const daftarNavigasi = [
  { id: "dashboard", label: "Dashboard" },
  { id: "menu", label: "Daftar Menu" },
];

function Header({ halamanAktif, onPindahHalaman }) {
  return (
    <header className="header">
      <div className="header-isi">
        <div className="papan-nama">
          <span className="papan-judul">Warkop Kita</span>
          <span className="papan-sub">Buka tiap hari, 07.00 - 24.00</span>
        </div>

        <nav className="navigasi" aria-label="Navigasi utama">
          {daftarNavigasi.map((item) => (
            <button
              key={item.id}
              className={
                halamanAktif === item.id ? "nav-tombol aktif" : "nav-tombol"
              }
              onClick={() => onPindahHalaman(item.id)}
              aria-current={halamanAktif === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
