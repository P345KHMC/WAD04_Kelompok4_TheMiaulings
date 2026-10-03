import request from "./api.js";

export const getCategories = () => request("/categories");
export const createCategory = (data) => request("/categories", { method: "POST", body: data });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: "PUT", body: data });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: "DELETE" });
