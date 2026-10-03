import { NavLink } from "react-router-dom";

// roles = siapa yang boleh melihat link. Sesuai API: kategori & laporan khusus admin.
const daftarLink = [
  { to: "/", label: "Dashboard", roles: ["admin", "kasir"], end: true },
  { to: "/menu", label: "Menu", roles: ["admin", "kasir"] },
  { to: "/categories", label: "Kategori", roles: ["admin"] },
  { to: "/orders", label: "Pesanan", roles: ["admin", "kasir"] },
  { to: "/reports", label: "Laporan", roles: ["admin"] },
];

function NavBar({ user, onLogout }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="brand">Warkop Kita</span>

        <nav className="nav-links" aria-label="Navigasi utama">
          {daftarLink
            .filter((link) => link.roles.includes(user.role))
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {link.label}
              </NavLink>
            ))}
        </nav>

        <div className="nav-user">
          <span>
            <strong>{user.nama}</strong> · {user.role}
          </span>
          <button className="btn btn-small" onClick={onLogout}>
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
