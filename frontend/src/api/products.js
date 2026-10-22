import { apiFetch } from "./client.js";

export const listProducts = (params) => apiFetch("/products", { params });

export const getProduct = (id) => apiFetch(`/products/${id}`);

export const createProduct = (payload) => apiFetch("/products", { method: "POST", body: payload });

export const updateProduct = (id, payload) =>
  apiFetch(`/products/${id}`, { method: "PUT", body: payload });

export const deactivateProduct = (id) => apiFetch(`/products/${id}`, { method: "DELETE" });
