import { useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Menu from "./pages/Menu.jsx";
import { menuData } from "./data/menuData.js";

function App() {
  const [halaman, setHalaman] = useState("dashboard");
  const [menu, setMenu] = useState(menuData);

  function ubahKetersediaan(id) {
    const menuBaru = menu.map((item) =>
      item.id === id ? { ...item, available: !item.available } : item
    );
    setMenu(menuBaru);
  }

  return (
    <div className="app">
      <Header halamanAktif={halaman} onPindahHalaman={setHalaman} />

      <main className="konten">
        {halaman === "dashboard" && (
          <Dashboard menu={menu} onPindahHalaman={setHalaman} />
        )}
        {halaman === "menu" && (
          <Menu menu={menu} onUbahKetersediaan={ubahKetersediaan} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
