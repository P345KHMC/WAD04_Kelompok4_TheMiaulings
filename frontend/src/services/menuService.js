import request from "./api.js";

export const getMenus = (params) => request("/menus", { params });
export const getMenu = (id) => request(`/menus/${id}`);
export const createMenu = (data) => request("/menus", { method: "POST", body: data });
export const updateMenu = (id, data) => request(`/menus/${id}`, { method: "PUT", body: data });
export const updateAvailability = (id, is_available) =>
  request(`/menus/${id}/availability`, { method: "PATCH", body: { is_available } });
export const deleteMenu = (id) => request(`/menus/${id}`, { method: "DELETE" });

export function uploadPhoto(id, file) {
  const form = new FormData();
  form.append("file", file);
  return request(`/menus/${id}/photo`, { method: "POST", form });
}
