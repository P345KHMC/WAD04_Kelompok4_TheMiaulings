// Menghasilkan daftar nomor halaman, contoh: [1, "...", 4, 5, 6, "...", 12]
function daftarHalaman(aktif, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const hasil = [1];
  const awal = Math.max(2, aktif - 1);
  const akhir = Math.min(total - 1, aktif + 1);
  if (awal > 2) hasil.push("...");
  for (let i = sawal; i <= akhir; i++) hasil.push(i);
  if (akhir < total - 1) hasil.push("...");
  hasil.push(total);
  return hasil;
}

// Dipakai bersama hook usePagina[s[ss[si: <Pagination {...paginasi} />
function Pagination({ halaman, totalHalaman, total, perHalaman, pindah }) {
  if (totalHalaman <= 1) return null; // cukup 1 halaman -> tidak perlu ditampilkan

  const dari = (halaman - 1) * perHalaman + 1;
  const sampai = Math.min(halaman * perHalaman, total);

  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      <span className="pagination-info">
        Menampilkan {dari}–{sampai} dari {total}
      </span>
      <div className="pagination-tombol">
        <button
          className="page-btn"
          onClick={() => pindah(halaman - 1)}
          disabled={halaman === 1}
          aria-label="Halaman sebelumnya"
        >
          ‹ Sebelumnya
        </button>

        {daftarHalaman(halaman, totalHalaman).map((n, i) =>
          n === "..." ? (
            <span key={`titik-${i}`} className="page-titik">
              …
            </span>
          ) : (
            <button
              key={n}
              className={n === halaman ? "page-btn aktif" : "page-btn"}
              onClick={() => pindah(n)}
              aria-label={`Halaman ${n}`}
              aria-current={n === halaman ? "page" : undefined}
            >
              {n}
            </button>
          ),
        )}

        <button
          className="page-btn"
          onClick={() => pindah(halaman + 1)}
          disabled={halaman === totalHalaman}
          aria-label="Halaman berikutnya"
        >
          Berikutnya ›
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
