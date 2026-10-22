import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN, CLIENT, mockApi, page, renderApp, session } from "../../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

const loginOk = (user) => () => ({
  body: { access_token: "t", token_type: "bearer", expires_in: 7200, user },
});

async function fillLogin(user, email, password) {
  await user.type(await screen.findByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("login", () => {
  it("cliente va a / tras login", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "POST /auth/login": loginOk(CLIENT),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/login");
    await fillLogin(userEvent.setup(), "cliente1@quickshop.com", "Cliente1234!");
    expect(await screen.findByRole("heading", { name: "Catalogo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salir" })).toBeInTheDocument();
  });

  it("admin va a /admin/products tras login", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "POST /auth/login": loginOk(ADMIN),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/login");
    await fillLogin(userEvent.setup(), "admin@quickshop.com", "Admin1234!");
    expect(await screen.findByRole("heading", { name: "Productos" })).toBeInTheDocument();
  });

  it("muestra el error inline si el login falla con 401 y no redirige", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "POST /auth/login": () => ({ status: 401, body: { detail: "Credenciales invalidas" } }),
    });
    renderApp("/login");
    await fillLogin(userEvent.setup(), "a@b.com", "mala");
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales invalidas");
    expect(screen.getByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });
});

describe("registro", () => {
  it("muestra la politica, valida y redirige a /login tras registrar", async () => {
    const { calls } = mockApi({
      "GET /auth/me": () => session(null),
      "POST /auth/register": () => ({ status: 201, body: { id: 9, email: "n@x.com", full_name: "Nuevo", role: "cliente" } }),
    });
    renderApp("/register");
    const user = userEvent.setup();
    expect(await screen.findByText(/Minimo 8 caracteres/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "n@x.com");
    await user.type(screen.getByLabelText("Nombre"), "Nuevo");
    await user.type(screen.getByLabelText("Password"), "debil");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(calls.some((call) => call.path === "/auth/register")).toBe(false);

    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "Fuerte1234!");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });

  it("muestra 409 inline", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "POST /auth/register": () => ({ status: 409, body: { detail: "El email ya esta registrado" } }),
    });
    renderApp("/register");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "n@x.com");
    await user.type(screen.getByLabelText("Nombre"), "Nuevo");
    await user.type(screen.getByLabelText("Password"), "Fuerte1234!");
    await user.click(screen.getByRole("button", { name: "Registrarse" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El email ya esta registrado");
  });
});

describe("rutas protegidas", () => {
  it("visitante en ruta protegida va a /login", async () => {
    mockApi({ "GET /auth/me": () => session(null) });
    renderApp("/profile");
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });

  it("visitante en ruta de admin va a /login", async () => {
    mockApi({ "GET /auth/me": () => session(null) });
    renderApp("/admin/products");
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });

  it("cliente en ruta de admin ve la pantalla 403", async () => {
    mockApi({ "GET /auth/me": () => session(CLIENT) });
    renderApp("/admin/products");
    expect(await screen.findByRole("heading", { name: "403" })).toBeInTheDocument();
  });

  it("header sin sesion muestra login y registro", async () => {
    mockApi({ "GET /auth/me": () => session(null), "GET /products": () => ({ body: page([]) }) });
    renderApp("/");
    expect(await screen.findByRole("link", { name: "Iniciar sesion" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Registrarse" })).toBeInTheDocument();
  });
});
