import { apiFetch } from "./client.js";

export const getProfile = () => apiFetch("/users/me");

export const updateProfile = (payload) => apiFetch("/users/me", { method: "PATCH", body: payload });
