// Satu fungsi request() dipakai semua service: menambah token JWT, mengubah body ke JSON,
// dan mengubah error dari backend (field "detail") menjadi Error biasa yang mudah ditampilkan.
const BASE = "/api/v1";

export const getToken = () => localStorage.getItem("token");
export const setToken = (token) =>
  token ? localStorage.setItem("token", token) : localStorage.removeItem("token");

async function request(path, { method = "GET", body, form, params, blob } = {}) {
  let url = BASE + path;
  if (params) {
    const bersih = Object.entries(params).filter(([, v]) => v !== "" && v != null);
    if (bersih.length) url += "?" + new URLSearchParams(bersih);
  }

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: payload });

  if (!res.ok) {
    let pesan = "Terjadi kesalahan. Coba lagi.";
    try {
      const data = await res.json();
      pesan = typeof data.detail === "string" ? data.detail : data.detail.map((e) => e.msg).join(", ");
    } catch { /* respons bukan JSON */ }
    if (res.status === 401 && token) {  // token kedaluwarsa -> paksa login ulang
      setToken(null);
      window.location.href = "/login";
    }
    const error = new Error(pesan);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return blob ? res.blob() : res.json();
}

export default request;
