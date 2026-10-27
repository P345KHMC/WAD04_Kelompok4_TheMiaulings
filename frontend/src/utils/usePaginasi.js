import { useState, useEffect } from "react";

// Memotong daftar menjadi per halaman (pagination sisi klien).
// - items     : array yang SUDAH difilter
// - perHalaman: jumlah item per halaman
// - resetKey  : string yang berubah saat filter berubah -> otomatis kembali ke halaman 1
export function usePaginasi(items, perHalaman, resetKey = "") {
  const [halaman, setHalaman] = useState(1);

  useEffect(() => {
    setHalaman(1);
  }, [resetKey]);

  const total = items.length;
  const totalHalaman = Math.max(1, Math.ceil(total / perHalaman));
  // Dijaga agar tidak melewati halaman terakhir (mis. setelah menghapus item terakhir di halaman itu)
  const aktif = Math.min(halaman, totalHalaman);
  const data = items.slice((aktif - 1) * perHalaman, aktif * perHalaman);

  function pindah(nomor) {
    setHalaman(Math.min(Math.max(1, nomor), totalHalaman));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return { data, halaman: aktif, totalHalaman, total, perHalaman, pindah };
}
