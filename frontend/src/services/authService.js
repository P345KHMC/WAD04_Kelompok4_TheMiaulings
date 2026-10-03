import request, { setToken } from "./api.js";

export async function login(username, password) {
  const data = await request("/auth/login", { method: "POST", body: { username, password } });
  setToken(data.access_token);
  return data.user;
}
export async function logout() {
  try { await request("/auth/logout", { method: "POST" }); } finally { setToken(null); }
}
export const getMe = () => request("/auth/me");
