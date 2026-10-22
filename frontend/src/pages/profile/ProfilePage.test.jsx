import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENT, mockApi, renderApp, session } from "../../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

const profile = { ...CLIENT, created_at: "2026-01-01T00:00:00Z" };

describe("ProfilePage", () => {
  it("edita el nombre y el header lo refleja", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /users/me": () => ({ body: profile }),
      "PATCH /users/me": ({ body }) => ({ body: { ...profile, full_name: body.full_name } }),
    });
    renderApp("/profile");
    const user = userEvent.setup();
    const name = await screen.findByLabelText("Nombre");
    expect(screen.getByLabelText("Email")).toBeDisabled();
    await user.clear(name);
    await user.type(name, "Nuevo Nombre");
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }));
    expect(await screen.findByText("Nombre actualizado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nuevo Nombre" })).toBeInTheDocument();
  });

  it("muestra el error inline si la password actual es incorrecta", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /users/me": () => ({ body: profile }),
      "PATCH /users/me": () => ({ status: 400, body: { detail: "Password actual incorrecta" } }),
    });
    renderApp("/profile");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Password actual"), "Mala1234!");
    await user.type(screen.getByLabelText("Nueva password"), "Nueva1234!");
    await user.click(screen.getByRole("button", { name: "Cambiar password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Password actual incorrecta");
  });

  it("muestra error de carga", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /users/me": () => ({ status: 500, body: { detail: "Fallo" } }),
    });
    renderApp("/profile");
    expect(await screen.findByRole("alert")).toHaveTextContent("Fallo");
  });
});
