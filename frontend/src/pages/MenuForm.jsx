import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import MenuPhoto from "../components/MenuPhoto.jsx";
import { useToast } from "../components/Toast.jsx";
import { getMenu, createMenu, updateMenu, uploadPhoto } from "../services/menuService.js";
import { getCategories } from "../services/categoryService.js";

const formKosong = { category_id: "", nama: "", deskripsi: "", tipe: "minuman", harga: "", stok: "0", is_available: true };

// Satu form untuk tambah (/menu/new) dan edit (/menu/:id/edit).
// Alur simpan: kirim data menu (JSON) -> jika ada foto baru, unggah lewat POST /menus/{id}/photo.
function MenuForm() {
  const { id } = useParams();
  const modeEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(formKosong);
  const [kategori, setKategori] = useState([]);
  const [menu, setMenu] = useState(null);      // menu asli (untuk foto lama)
  const [foto, setFoto] = useState(null);      // file foto baru
  const [preview, setPreview] = useState("");
  const [error, setError] = useState({});
  const [kirim, setKirim] = useState(false);

  useEffect(() => {
    getCategories().then((data) => {
      setKategori(data);
      if (!modeEdit && data.length) setForm((f) => ({ ...f, category_id: String(data[0].id) }));
    }).catch((e) => toast(e.message, "error"));

    if (modeEdit) {
      getMenu(id).then((m) => {
        setMenu(m);
        setForm({ category_id: String(m.category_id), nama: m.nama, deskripsi: m.deskripsi || "",
                  tipe: m.tipe, harga: String(m.harga), stok: String(m.stok), is_available: m.is_available });
      }).catch((e) => toast(e.message, "error"));
    }
  }, [id, modeEdit]); // eslint-disable-line

  function ubah(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function pilihFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function validasi() {
    const err = {};
    if (form.nama.trim().length < 2) err.nama = "Nama menu minimal 2 huruf.";
    if (!form.category_id) err.category_id = "Pilih kategori.";
    if (!(Number(form.harga) > 0)) err.harga = "Harga harus lebih dari 0.";
    if (form.stok === "" || Number(form.stok) < 0 || !Number.isInteger(Number(form.stok))) err.stok = "Stok harus bilangan bulat 0 atau lebih.";
    return err;
  }

  async function simpan(e) {
    e.preventDefault();
    const err = validasi();
    setError(err);
    if (Object.keys(err).length) return;

    const data = {
      category_id: Number(form.category_id), nama: form.nama.trim(), deskripsi: form.deskripsi.trim() || null,
      tipe: form.tipe, harga: Number(form.harga), stok: Number(form.stok), is_available: form.is_available,
    };
    setKirim(true);
    try {
      const tersimpan = modeEdit ? await updateMenu(id, data) : await createMenu(data);
      if (foto) await uploadPhoto(tersimpan.id, foto);
      toast(modeEdit ? "Perubahan disimpan." : "Menu baru ditambahkan.");
      navigate("/menu");
    } catch (e2) {
      toast(e2.message, "error");
    } finally {
      setKirim(false);
    }
  }

  const gambar = preview ? { foto_url: preview, nama: form.nama, tipe: form.tipe } : menu || { foto_url: null, nama: "Foto menu", tipe: form.tipe };

  return (
    <section>
      <PageHeader judul={modeEdit ? "Edit menu" : "Tambah menu"} subjudul="Foto dan detail menu yang tampil di katalog." />

      <form className="form-menu" onSubmit={simpan} noValidate>
        <div className="form-foto">
          <MenuPhoto menu={{ ...gambar, tipe: form.tipe }} />
          <label className="btn btn-small" htmlFor="foto">Pilih foto</label>
          <input id="foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={pilihFoto} hidden />
          <p className="muted">JPG, PNG, atau WEBP. Maksimal 2 MB.</p>
        </div>

        <div className="form-kolom">
          <div className="field">
            <label htmlFor="nama">Nama menu</label>
            <input id="nama" name="nama" value={form.nama} onChange={ubah} placeholder="contoh: Kopi Susu Aren" />
            {error.nama && <p className="field-error">{error.nama}</p>}
          </div>

          <div className="grid-dua">
            <div className="field">
              <label htmlFor="category_id">Kategori</label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={ubah}>
                {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
              {error.category_id && <p className="field-error">{error.category_id}</p>}
            </div>
            <div className="field">
              <label htmlFor="tipe">Tipe</label>
              <select id="tipe" name="tipe" value={form.tipe} onChange={ubah}>
                <option value="minuman">Minuman</option>
                <option value="makanan">Makanan</option>
              </select>
            </div>
          </div>

          <div className="grid-dua">
            <div className="field">
              <label htmlFor="harga">Harga (Rp)</label>
              <input id="harga" name="harga" type="number" min="0" step="500" value={form.harga} onChange={ubah} />
              {error.harga && <p className="field-error">{error.harga}</p>}
            </div>
            <div className="field">
              <label htmlFor="stok">Stok</label>
              <input id="stok" name="stok" type="number" min="0" value={form.stok} onChange={ubah} />
              {error.stok && <p className="field-error">{error.stok}</p>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="deskripsi">Deskripsi</label>
            <textarea id="deskripsi" name="deskripsi" rows={3} value={form.deskripsi} onChange={ubah} />
          </div>

          <label className="cek">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Tersedia untuk dipesan
          </label>

          <div className="form-aksi">
            <Link to="/menu" className="btn">Batal</Link>
            <button type="submit" className="btn btn-primary" disabled={kirim}>
              {kirim ? "Menyimpan..." : modeEdit ? "Simpan perubahan" : "Tambah menu"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default MenuForm;
