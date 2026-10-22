import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

export const CLIENT = { id: 2, email: "cliente1@quickshop.com", full_name: "Cliente Uno", role: "cliente" };
export const ADMIN = { id: 1, email: "admin@quickshop.com", full_name: "Admin", role: "admin" };

export function product(overrides = {}) {
  return {
    id: 1,
    name: "Wireless Mouse",
    description: "Raton inalambrico",
    price: "29.99",
    stock: 5,
    image_url: "https://example.com/mouse.jpg",
    is_active: true,
    ...overrides,
  };
}

export function page(items, extra = {}) {
  return { items, total: items.length, page: 1, page_size: 12, ...extra };
}

// Handlers keyed by "METHOD /path" (sin prefijo ni query); devuelven { status, body }.
export function mockApi(handlers) {
  const calls = [];
  const fetchMock = vi.fn(async (url, options = {}) => {
    const parsed = new URL(url);
    const path = parsed.pathname.replace("/api/v1", "");
    const method = options.method ?? "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ method, path, body, query: parsed.searchParams, options });
    const handler = handlers[`${method} ${path}`];
    const result = handler ? handler({ body, query: parsed.searchParams }) : { status: 404, body: { detail: "No encontrado" } };
    const status = result.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (status === 204) throw new Error("sin cuerpo");
        return result.body;
      },
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

export const session = (user) =>
  user ? { status: 200, body: user } : { status: 401, body: { detail: "No autenticado" } };

export function renderApp(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
