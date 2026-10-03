import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ModalKonfirmasi from "../components/ModalKonfirmasi.jsx";
import { useToast } from "../components/Toast.jsx";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/categoryService.js";
import { getMenus } from "../services/menuService.js";

// Khusus admin. Hapus kategori yang masih dipakai ditolak backend (409) -> pesan tampil di toast.
function Categories() {
  const toast = useToast();
  const [kategori, setKategori] = useState(null);
  const [menus, setMenus] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null = tertutup, {id?, nama, deskripsi}
  const [errorForm, setErrorForm] = useState("");
  const [hapus, setHapus] = useState(null);

  function muat() {
    Promise.all([getCategories(), getMenus()])
      .then(([k, m]) => { setKategori(k); setMenus(m); })
      .catch((e) => setError(e.message));
  }
  useEffect(muat, []);

  async function simpan(e) {
    e.preventDefault();
    if (!form.nama.trim()) return setErrorForm("Nama kategori wajib diisi.");
    const data = { nama: form.nama.trim(), deskripsi: form.deskripsi.trim() || null };
    try {
      if (form.id) await updateCategory(form.id, data);
      else await createCategory(data);
      toast(form.id ? "Kategori diperbarui." : "Kategori ditambahkan.");
      setForm(null);
      muat();
    } catch (e2) {
      setErrorForm(e2.message);
    }
  }

  async function konfirmasiHapus() {
    try {
      await deleteCategory(hapus.id);
      toast(`Kategori ${hapus.nama} dihapus.`);
      muat();
    } catch (e) {
      toast(e.message, "error"); // contoh: "Kategori Coffee masih digunakan oleh 5 menu."
    }
    setHapus(null);
  }

  if (error) return <EmptyState>{error}</EmptyState>;
  if (!kategori) return <p className="muted">Memuat kategori...</p>;

  return (
    <section>
      <PageHeader judul="Kategori" subjudul="Kelompok menu di katalog.">
        <button className="btn btn-primary" onClick={() => { setForm({ nama: "", deskripsi: "" }); setErrorForm(""); }}>+ Tambah kategori</button>
      </PageHeader>

      {form && (
        <form className="form-inline" onSubmit={simpan} noValidate>
          <div className="field">
            <label htmlFor="nama">Nama</label>
            <input id="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="deskripsi">Deskripsi</label>
            <input id="deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          </div>
          <div className="form-inline-aksi">
            <button type="button" className="btn" onClick={() => setForm(null)}>Batal</button>
            <button type="submit" className="btn btn-primary">{form.id ? "Simpan" : "Tambah"}</button>
          </div>
          {errorForm && <p className="field-error">{errorForm}</p>}
        </form>
      )}

      {kategori.length === 0 ? (
        <EmptyState>Belum ada kategori.</EmptyState>
      ) : (
        <div className="tabel">
          {kategori.map((k) => (
            <div className="tabel-baris" key={k.id}>
              <div className="tabel-utama">
                <strong>{k.nama}</strong>
                <span className="muted">{k.deskripsi || "-"}</span>
              </div>
              <span className="muted">{menus.filter((m) => m.category_id === k.id).length} menu</span>
              <div className="tabel-aksi">
                <button className="btn btn-small" onClick={() => { setForm({ id: k.id, nama: k.nama, deskripsi: k.deskripsi || "" }); setErrorForm(""); }}>Edit</button>
                <button className="btn btn-small btn-danger" onClick={() => setHapus(k)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hapus && (
        <ModalKonfirmasi judul="Hapus kategori ini?" labelYa="Ya, hapus" onYakin={konfirmasiHapus} onBatal={() => setHapus(null)}>
          Kategori {hapus.nama} akan dihapus. Kategori yang masih dipakai menu tidak bisa dihapus.
        </ModalKonfirmasi>
      )}
    </section>
  );
}

export default Categories;
