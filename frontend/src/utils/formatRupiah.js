// Fungsi kecil untuk mengubah angka 15000 menjadi teks "Rp 15.000".
// Dibuat terpisah karena dipakai di lebih dari satu component.
export function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}
