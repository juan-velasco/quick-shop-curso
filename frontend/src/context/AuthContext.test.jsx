import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN, CLIENT, mockApi, page, renderApp, session } from "../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

describe("sesion", () => {
  it("hidrata la sesion con /auth/me y envia cookies", async () => {
    const { calls } = mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/");
    expect(await screen.findByRole("button", { name: "Salir" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cliente Uno" })).toBeInTheDocument();
    const meCall = calls.find((call) => call.path === "/auth/me");
    expect(meCall.options.credentials).toBe("include");
  });

  it("no guarda el token en localStorage ni sessionStorage", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "POST /auth/login": () => ({ body: { access_token: "secreto", token_type: "bearer", expires_in: 7200, user: CLIENT } }),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/login");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "cliente1@quickshop.com");
    await user.type(screen.getByLabelText("Password"), "Cliente1234!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByRole("button", { name: "Salir" });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("un 401 con sesion activa limpia la sesion y redirige a /login", async () => {
    mockApi({
      "GET /auth/me": () => session(ADMIN),
      "GET /products": () => ({ status: 401, body: { detail: "Sesion expirada" } }),
    });
    renderApp("/");
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Salir" })).not.toBeInTheDocument());
  });

  it("logout limpia la sesion y vuelve a /login", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "POST /auth/logout": () => ({ status: 204 }),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/");
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Salir" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });
});
