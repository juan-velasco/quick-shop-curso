import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN, mockApi, page, product, renderApp, session } from "../../test/utils.jsx";

afterEach(() => vi.unstubAllGlobals());

describe("ProductFormPage", () => {
  it("valida precio y stock sin enviar la peticion", async () => {
    const { calls } = mockApi({ "GET /auth/me": () => session(ADMIN) });
    renderApp("/admin/products/new");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Nombre"), "Lampara");
    await user.type(screen.getByLabelText("Descripcion"), "Una lampara");
    await user.type(screen.getByLabelText("Precio"), "0");
    await user.type(screen.getByLabelText("Stock"), "-1");
    await user.type(screen.getByLabelText("URL de la imagen"), "no-es-url");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByText(/El precio debe ser mayor que 0/)).toBeInTheDocument();
    expect(screen.getByText(/El stock debe ser un entero/)).toBeInTheDocument();
    expect(screen.getByText(/URL de imagen valida/)).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("crea el producto y vuelve a la tabla", async () => {
    const { calls } = mockApi({
      "GET /auth/me": () => session(ADMIN),
      "POST /products": ({ body }) => ({ status: 201, body: product({ ...body, id: 7 }) }),
      "GET /products": () => ({ body: page([product({ id: 7, name: "Lampara" })]) }),
    });
    renderApp("/admin/products/new");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Nombre"), "Lampara");
    await user.type(screen.getByLabelText("Descripcion"), "Una lampara");
    await user.type(screen.getByLabelText("Precio"), "19.90");
    await user.type(screen.getByLabelText("Stock"), "3");
    await user.type(screen.getByLabelText("URL de la imagen"), "https://example.com/l.jpg");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("heading", { name: "Productos" })).toBeInTheDocument();
    const post = calls.find((call) => call.method === "POST");
    expect(post.body).toMatchObject({ name: "Lampara", price: "19.90", stock: 3 });
    expect(await screen.findByText("Lampara")).toBeInTheDocument();
  });

  it("muestra el 409 de nombre duplicado en el formulario", async () => {
    mockApi({
      "GET /auth/me": () => session(ADMIN),
      "POST /products": () => ({ status: 409, body: { detail: "Ya existe un producto con ese nombre" } }),
    });
    renderApp("/admin/products/new");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Nombre"), "Lampara");
    await user.type(screen.getByLabelText("Descripcion"), "Una lampara");
    await user.type(screen.getByLabelText("Precio"), "19.90");
    await user.type(screen.getByLabelText("Stock"), "3");
    await user.type(screen.getByLabelText("URL de la imagen"), "https://example.com/l.jpg");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un producto");
  });

  it("edita con PUT precargando los datos", async () => {
    const { calls } = mockApi({
      "GET /auth/me": () => session(ADMIN),
      "GET /products/1": () => ({ body: product() }),
      "PUT /products/1": ({ body }) => ({ body: product(body) }),
      "GET /products": () => ({ body: page([product()]) }),
    });
    renderApp("/admin/products/1/edit");
    const user = userEvent.setup();
    const name = await screen.findByDisplayValue("Wireless Mouse");
    await user.clear(name);
    await user.type(name, "Mouse 2");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("heading", { name: "Productos" });
    expect(calls.find((call) => call.method === "PUT").body.name).toBe("Mouse 2");
  });
});

describe("AdminProductsPage", () => {
  it("lista incluyendo inactivos y desactiva un producto", async () => {
    let active = true;
    const { calls } = mockApi({
      "GET /auth/me": () => session(ADMIN),
      "GET /products": () => ({ body: page([product({ is_active: active })]) }),
      "DELETE /products/1": () => {
        active = false;
        return { status: 204 };
      },
    });
    renderApp("/admin/products");
    const user = userEvent.setup();
    expect(await screen.findByText("Activo")).toBeInTheDocument();
    expect(calls.find((call) => call.path === "/products").query.get("include_inactive")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Desactivar Wireless Mouse" }));
    expect(await screen.findByText("Inactivo")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Desactivar Wireless Mouse" })).toBeDisabled());
  });

  it("muestra estado vacio y enlace a nuevo producto", async () => {
    mockApi({
      "GET /auth/me": () => session(ADMIN),
      "GET /products": () => ({ body: page([]) }),
    });
    renderApp("/admin/products");
    expect(await screen.findByText("No hay productos.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nuevo producto" })).toBeInTheDocument();
  });
});
