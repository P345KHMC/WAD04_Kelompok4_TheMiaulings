import request from "./api.js";

export const getTransactions = (params) => request("/transactions", { params });
export const getTransaction = (id) => request(`/transactions/${id}`);
export const createTransaction = (data) => request("/transactions", { method: "POST", body: data });
export const addItem = (id, item) => request(`/transactions/${id}/items`, { method: "POST", body: item });
export const updateItem = (id, itemId, data) =>
  request(`/transactions/${id}/items/${itemId}`, { method: "PUT", body: data });
export const deleteItem = (id, itemId) => request(`/transactions/${id}/items/${itemId}`, { method: "DELETE" });
export const updateStatus = (id, status) =>
  request(`/transactions/${id}/status`, { method: "PATCH", body: { status } });
