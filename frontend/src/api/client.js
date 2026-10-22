const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "Error de la API");
    this.status = status;
    this.detail = detail;
  }
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

function messageFromDetail(detail) {
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg ?? String(item)).join(". ");
  }
  return detail;
}

export async function apiFetch(path, { method = "GET", body, params, skipUnauthorized = false } = {}) {
  const response = await fetch(`${API_URL}${API_PREFIX}${path}${buildQuery(params)}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorized && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiError(response.status, messageFromDetail(data?.detail) ?? "Error inesperado");
  }
  return data;
}
