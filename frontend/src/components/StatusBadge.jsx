// Satu tempat untuk semua label status: ketersediaan menu & status transaksi.
const daftarStatus = {
  tersedia: { label: "Tersedia", warna: "badge-ok" },
  habis: { label: "Habis", warna: "badge-bad" },
  pending: { label: "Pending", warna: "badge-warn" },
  diproses: { label: "Diproses", warna: "badge-warn" },
  selesai: { label: "Selesai", warna: "badge-ok" },
  dibatalkan: { label: "Dibatalkan", warna: "badge-bad" },
};

function StatusBadge({ status }) {
  const { label, warna } = daftarStatus[status];
  return <span className={`badge ${warna}`}>{label}</span>;
}

export default StatusBadge;
