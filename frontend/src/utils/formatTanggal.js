// "2026-09-30T09:15:00" -> "09.15"
export function formatJam(iso) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// "2026-09-30T09:15:00" -> "30 Sep 2026"
export function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
