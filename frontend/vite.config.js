import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Semua request /api dan /uploads diteruskan ke FastAPI (port 8000),
// jadi frontend cukup memanggil alamat relatif seperti fetch("/api/v1/menus").
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000", "/uploads": "http://localhost:8000" } },
});
