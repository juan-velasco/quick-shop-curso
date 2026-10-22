import { expect, test } from "@playwright/test";
import { CLIENT, uniqueEmail } from "./helpers.js";

test("login correcto lleva al catalogo y muestra el usuario", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(CLIENT.email);
  await page.getByLabel("Password").fill(CLIENT.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/$/);
  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByRole("button", { name: "Salir" })).toBeVisible();
});

test("login incorrecto muestra error y permanece en /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(CLIENT.email);
  await page.getByLabel("Password").fill("Equivocada1!");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("registro de usuario nuevo redirige a /login", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(uniqueEmail("registro"));
  await page.getByLabel("Nombre").fill("Usuario Registro");
  await page.getByLabel("Password").fill("Nuevo1234!");
  await page.getByRole("button", { name: "Registrarse" }).click();

  await expect(page).toHaveURL(/\/login$/);
});
