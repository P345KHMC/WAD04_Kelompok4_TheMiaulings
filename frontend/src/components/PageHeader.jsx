// Judul + subjudul di atas setiap halaman. Tombol aksi (opsional) lewat children.
function PageHeader({ judul, subjudul, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{judul}</h1>
        {subjudul && <p>{subjudul}</p>}
      </div>
      {children}
    </div>
  );
}

export default PageHeader;
