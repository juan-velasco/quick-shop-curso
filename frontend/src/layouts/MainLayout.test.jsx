import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENT, ADMIN, mockApi, page, renderApp, session } from "../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

const products = { "GET /products": () => ({ body: page([]) }) };

describe("cabecera", () => {
  it("sin sesion muestra pills de iniciar sesion y registrarse", async () => {
    mockApi({ "GET /auth/me": () => session(null), ...products });
    renderApp("/");
    const login = await screen.findByRole("link", { name: "Iniciar sesion" });
    const register = screen.getByRole("link", { name: "Registrarse" });
    expect(login).toHaveClass("rounded-pill", "border-ink");
    expect(register).toHaveClass("rounded-pill", "bg-ink");
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
  });

  it("con sesion muestra el nombre y Salir; el admin ve Administracion", async () => {
    mockApi({ "GET /auth/me": () => session(ADMIN), ...products });
    renderApp("/");
    expect(await screen.findByRole("link", { name: ADMIN.full_name })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: "Salir" })).toHaveClass("rounded-pill");
    expect(screen.getByRole("link", { name: "Administracion" })).toBeInTheDocument();
  });

  it("el cliente no ve Administracion", async () => {
    mockApi({ "GET /auth/me": () => session(CLIENT), ...products });
    renderApp("/");
    await screen.findByRole("button", { name: "Salir" });
    expect(screen.queryByRole("link", { name: "Administracion" })).not.toBeInTheDocument();
  });

  it("el menu movil se despliega y repliega con teclado", async () => {
    mockApi({ "GET /auth/me": () => session(null), ...products });
    renderApp("/");
    const user = userEvent.setup();
    const toggle = await screen.findByRole("button", { name: "Abrir menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveClass("md:hidden");
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
