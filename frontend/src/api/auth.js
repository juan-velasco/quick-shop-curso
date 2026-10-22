import { apiFetch } from "./client.js";

export const register = (payload) => apiFetch("/auth/register", { method: "POST", body: payload });

export const login = (payload) =>
  apiFetch("/auth/login", { method: "POST", body: payload, skipUnauthorized: true });

export const logout = () => apiFetch("/auth/logout", { method: "POST", skipUnauthorized: true });

export const fetchSession = () => apiFetch("/auth/me", { skipUnauthorized: true });

export const forgotPassword = (email) =>
  apiFetch("/auth/forgot-password", { method: "POST", body: { email }, skipUnauthorized: true });

export const resetPassword = (token, password) =>
  apiFetch("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    skipUnauthorized: true,
  });
