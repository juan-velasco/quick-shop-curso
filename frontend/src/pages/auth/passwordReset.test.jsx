import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi, renderApp, session } from "../../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

const anon = { "GET /auth/me": () => session(null) };

describe("forgot password", () => {
  it("login enlaza a la recuperacion y muestra mensaje generico tras enviar", async () => {
    const { calls } = mockApi({
      ...anon,
      "POST /auth/forgot-password": () => ({ status: 202, body: { detail: "ok" } }),
    });
    const user = userEvent.setup();
    renderApp("/login");
    await user.click(await screen.findByRole("link", { name: "Has olvidado tu password?" }));
    await user.type(await screen.findByLabelText("Email"), "nadie@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Si el email existe");
    expect(calls.find((c) => c.path === "/auth/forgot-password").body).toEqual({
      email: "nadie@example.com",
    });
  });
});

describe("reset password", () => {
  async function fill(user, password, confirm) {
    await user.type(await screen.findByLabelText("Nueva password"), password);
    await user.type(screen.getByLabelText("Confirmar password"), confirm);
    await user.click(screen.getByRole("button", { name: "Cambiar password" }));
  }

  it("restablece y redirige a /login con aviso", async () => {
    const { calls } = mockApi({
      ...anon,
      "POST /auth/reset-password": () => ({ status: 204 }),
    });
    renderApp("/reset-password?token=abc123");
    await fill(userEvent.setup(), "Nueva1234!x", "Nueva1234!x");
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Password actualizada");
    expect(calls.find((c) => c.path === "/auth/reset-password").body).toEqual({
      token: "abc123",
      password: "Nueva1234!x",
    });
  });

  it("no envia si las passwords no coinciden", async () => {
    const { calls } = mockApi(anon);
    renderApp("/reset-password?token=abc123");
    await fill(userEvent.setup(), "Nueva1234!x", "Distinta1234!");
    expect(await screen.findByText("Las passwords no coinciden.")).toBeInTheDocument();
    expect(calls.some((c) => c.path === "/auth/reset-password")).toBe(false);
  });

  it("enlace caducado muestra error y enlace para pedir otro", async () => {
    mockApi({
      ...anon,
      "POST /auth/reset-password": () => ({
        status: 400,
        body: { detail: "El enlace no es valido o ha caducado" },
      }),
    });
    renderApp("/reset-password?token=viejo");
    await fill(userEvent.setup(), "Nueva1234!x", "Nueva1234!x");
    expect(await screen.findByRole("alert")).toHaveTextContent("ha caducado");
    expect(screen.getByRole("link", { name: "Solicitar un nuevo enlace" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("sin token indica enlace no valido", async () => {
    mockApi(anon);
    renderApp("/reset-password");
    expect(await screen.findByRole("alert")).toHaveTextContent("no es valido");
    expect(screen.getByRole("link", { name: "Solicitar un nuevo enlace" })).toBeInTheDocument();
  });
});
