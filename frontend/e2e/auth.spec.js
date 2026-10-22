import { expect, test } from "@playwright/test";
import { ADMIN, CLIENT, login, register, storageSnapshot, uniqueEmail } from "./helpers.js";

test("registro, login de cliente y logout sin token en el almacenamiento del navegador", async ({
  page,
}) => {
  const email = uniqueEmail("auth");
  const password = "Nuevo1234!";
  await register(page, { email, password, name: "Usuario E2E" });
  await expect(page).toHaveURL(/\/login$/);

  await login(page, { email, password });
  await expect(page).toHaveURL(/\/$/);
  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByText("Usuario E2E")).toBeVisible();

  const storage = await storageSnapshot(page);
  expect(storage.local).not.toMatch(/eyJ|token/i);
  expect(storage.session).not.toMatch(/eyJ|token/i);
  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name === "access_token");
  expect(session?.httpOnly).toBe(true);

  await nav.getByRole("button", { name: "Salir" }).click();
  await expect(nav.getByRole("link", { name: "Iniciar sesion" })).toBeVisible();
});

test("el admin entra en /admin/products", async ({ page }) => {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/admin\/products$/);
});

test("credenciales erroneas muestran error inline", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(CLIENT.email);
  await page.getByLabel("Password").fill("Equivocada1!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toBeVisible();
});

test("ruta protegida sin sesion redirige a login y cliente ve 403 en admin", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);

  await login(page, CLIENT);
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin/products");
  await expect(page.getByText("403")).toBeVisible();
});

test("la sesion se recupera al recargar", async ({ page }) => {
  await login(page, CLIENT);
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
});
