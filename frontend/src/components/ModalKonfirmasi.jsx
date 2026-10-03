import { useEffect } from "react";

// Modal konfirmasi umum (hapus menu, hapus kategori, batalkan pesanan).
function ModalKonfirmasi({ judul, children, labelYa = "Ya", onYakin, onBatal }) {
  useEffect(() => {
    const tutup = (e) => e.key === "Escape" && onBatal();
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [onBatal]);

  return (
    <div className="modal-latar" onClick={onBatal}>
      <div className="modal-kotak" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{judul}</h2>
        <p>{children}</p>
        <div className="modal-aksi">
          <button className="btn" onClick={onBatal}>Batal</button>
          <button className="btn btn-danger" onClick={onYakin}>{labelYa}</button>
        </div>
      </div>
    </div>
  );
}

export default ModalKonfirmasi;
