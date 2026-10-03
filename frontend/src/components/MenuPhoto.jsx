// Foto menu dengan rasio tetap (4:5, diatur di CSS .photo).
// Jika foto_url kosong, dipakai placeholder lokal sesuai tipe (makanan/minuman).
function MenuPhoto({ menu, className = "" }) {
  const sumber = menu.foto_url || `/images/placeholder-${menu.tipe}.svg`;
  return <img className={`photo ${className}`} src={sumber} alt={menu.nama} loading="lazy" />;
}

export default MenuPhoto;
