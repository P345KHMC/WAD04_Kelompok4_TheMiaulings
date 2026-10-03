import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Menu from "./pages/Menu.jsx";
import MenuForm from "./pages/MenuForm.jsx";
import Categories from "./pages/Categories.jsx";
import Orders from "./pages/Orders.jsx";
import OrderNew from "./pages/OrderNew.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import Reports from "./pages/Reports.jsx";
import { getToken, setToken } from "./services/api.js";
import { getMe, logout } from "./services/authService.js";

// Kerangka setelah login: NavBar + isi halaman. Belum login -> ke /login.
function Layout({ user, onLogout }) {
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <NavBar user={user} onLogout={onLogout} />
      <main className="container"><Outlet /></main>
    </>
  );
}

// Halaman khusus admin. (Backend tetap memeriksa role; ini hanya untuk UX.)
function HanyaAdmin({ user }) {
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {
  const [user, setUser] = useState(null);
  const [siap, setSiap] = useState(false); // sudah selesai memeriksa token?
  const navigate = useNavigate();

  // Saat aplikasi dibuka: jika ada token tersimpan, minta profil ke GET /auth/me.
  useEffect(() => {
    if (!getToken()) {
      setSiap(true);
      return;
    }
    getMe().then(setUser).catch(() => setToken(null)).finally(() => setSiap(true));
  }, []);

  function masuk(dataUser) {
    setUser(dataUser);
    navigate("/");
  }

  async function keluar() {
    await logout().catch(() => {});
    setUser(null);
    navigate("/login");
  }

  if (!siap) return <p className="muted" style={{ padding: 32 }}>Memuat...</p>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={masuk} />} />

      <Route element={<Layout user={user} onLogout={keluar} />}>
        <Route index element={<Dashboard user={user} />} />
        <Route path="menu" element={<Menu user={user} />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/new" element={<OrderNew />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        <Route element={<HanyaAdmin user={user} />}>
          <Route path="menu/new" element={<MenuForm />} />
          <Route path="menu/:id/edit" element={<MenuForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
