// Foto menu dengan rasio tetap (4:5, diatur di CSS .photo).
// Jika foto_url kosong, dipakai placeholder lokal sesuai tipe (makanan/minuman).
import { API_ORIGIN } from "../services/api.js";

function MenuPhoto({ menu, className = "" }) {
  // foto_url dari server berbentuk "/uploads/..." -> tambahkan alamat backend.
  // Preview lokal (blob:/data:) dibiarkan apa adanya.
  const sumber = menu.foto_url
    ? (menu.foto_url.startsWith("/") ? API_ORIGIN + menu.foto_url : menu.foto_url)
    : `${import.meta.env.BASE_URL}images/placeholder-${menu.tipe}.svg`;
  return <img className={`photo ${className}`} src={sumber} alt={menu.nama} loading="lazy" />;
}

export default MenuPhoto;
