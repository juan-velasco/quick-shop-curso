import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENT, mockApi, page, product, renderApp, session } from "../../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

describe("CatalogPage", () => {
  it("es accesible sin sesion", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "GET /products": () => ({ body: page([product()]) }),
    });
    renderApp("/");
    expect(await screen.findByText("Wireless Mouse")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Catalogo" })).toBeInTheDocument();
  });

  it("producto con stock 0 muestra Agotado y boton deshabilitado", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /products": () => ({ body: page([product({ stock: 0 })]) }),
    });
    renderApp("/");
    expect(await screen.findByText("Agotado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
  });

  it("sin sesion, agregar al carrito redirige a /login", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "GET /products": () => ({ body: page([product()]) }),
    });
    renderApp("/");
    await userEvent.setup().click(await screen.findByRole("button", { name: "Agregar al carrito" }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });

  it("muestra estado vacio sin resultados", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/");
    expect(await screen.findByText("No se encontraron productos.")).toBeInTheDocument();
  });

  it("muestra estado de error", async () => {
    mockApi({
      "GET /auth/me": () => session(null),
      "GET /products": () => ({ status: 500, body: { detail: "Fallo del servidor" } }),
    });
    renderApp("/");
    expect(await screen.findByRole("alert")).toHaveTextContent("Fallo del servidor");
  });

  it("buscar y paginar vuelven a consultar la API", async () => {
    const { calls } = mockApi({
      "GET /auth/me": () => session(null),
      "GET /products": () => ({ body: page([product()], { total: 30, page_size: 12 }) }),
    });
    renderApp("/");
    const user = userEvent.setup();
    await screen.findByText("Wireless Mouse");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() =>
      expect(calls.some((call) => call.path === "/products" && call.query.get("page") === "2")).toBe(true),
    );
    await user.type(screen.getByLabelText("Buscar productos"), "mouse");
    await waitFor(() =>
      expect(
        calls.some((call) => call.path === "/products" && call.query.get("q") === "mouse" && call.query.get("page") === "1"),
      ).toBe(true),
    );
  });
});

describe("ProductDetailPage", () => {
  it("visitante es redirigido a /login", async () => {
    mockApi({ "GET /auth/me": () => session(null) });
    renderApp("/products/1");
    expect(await screen.findByRole("heading", { name: "Iniciar sesion" })).toBeInTheDocument();
  });

  it("la cantidad no supera el stock", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /products/1": () => ({ body: product({ stock: 5 }) }),
    });
    renderApp("/products/1");
    const quantity = await screen.findByLabelText("Cantidad");
    expect(quantity).toHaveAttribute("max", "5");
    await userEvent.setup().type(quantity, "9");
    expect(Number(quantity.value)).toBeLessThanOrEqual(5);
  });

  it("muestra error si el producto no existe", async () => {
    mockApi({
      "GET /auth/me": () => session(CLIENT),
      "GET /products/99": () => ({ status: 404, body: { detail: "Producto no encontrado" } }),
    });
    renderApp("/products/99");
    expect(await screen.findByRole("alert")).toHaveTextContent("Producto no encontrado");
  });
});
