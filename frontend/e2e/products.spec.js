import { expect, test } from "@playwright/test";
import { ADMIN, CLIENT, findInAdminTable, login } from "./helpers.js";

test("el catalogo es publico, paginado y filtrable", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Catalogo" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(12);
  await expect(page.getByText(/Pagina 1 de [2-9]/)).toBeVisible();

  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByText(/Pagina 2 de/)).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();

  await page.getByLabel("Buscar productos").fill("mouse");
  await expect(page.locator("article").first()).toContainText(/mouse/i);
  const count = await page.locator("article").count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(12);

  await page.getByLabel("Buscar productos").fill("zzzzzz-no-existe");
  await expect(page.getByText("No se encontraron productos.")).toBeVisible();
});

test("el detalle de producto exige sesion", async ({ page }) => {
  await page.goto("/products/1");
  await expect(page).toHaveURL(/\/login$/);
  await login(page, CLIENT);
  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "Laptop Pro 15" })).toBeVisible();
});

test("el admin crea, edita y desactiva un producto; el cliente deja de verlo", async ({
  page,
  browser,
}) => {
  const name = `Producto E2E ${Date.now()}`;
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin\/products$/);

  await page.getByRole("link", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Descripcion").fill("Descripcion e2e");
  await page.getByLabel("Precio").fill("-5");
  await page.getByLabel("Stock").fill("4");
  await page.getByLabel("URL de la imagen").fill("https://example.com/e2e.png");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page).toHaveURL(/\/admin\/products\/new$/);

  await page.getByLabel("Precio").fill("12.50");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  await findInAdminTable(page, name);
  await page.getByRole("link", { name: `Editar ${name}` }).click();
  await page.getByLabel("Stock").fill("9");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  const row = await findInAdminTable(page, name);
  await expect(row).toContainText("9");

  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await clientPage.goto("/");
  await clientPage.getByLabel("Buscar productos").fill(name);
  await expect(clientPage.locator("article")).toHaveCount(1);

  await page.getByRole("button", { name: `Desactivar ${name}` }).click();
  await expect(row).toContainText("Inactivo");

  await clientPage.reload();
  await clientPage.getByLabel("Buscar productos").fill(name);
  await expect(clientPage.getByText("No se encontraron productos.")).toBeVisible();
  await clientContext.close();
});

test("el cliente recibe 403 en la administracion de productos", async ({ page }) => {
  await login(page, CLIENT);
  await page.goto("/admin/products");
  await expect(page.getByText("403")).toBeVisible();
});
