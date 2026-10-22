import { expect, test } from "@playwright/test";
import { login, register, uniqueEmail } from "./helpers.js";

test("cambiar nombre y password y volver a entrar con la nueva", async ({ page }) => {
  const email = uniqueEmail("profile");
  const password = "Inicial1234!";
  const newPassword = "Cambiada1234!";
  await register(page, { email, password, name: "Perfil E2E" });
  await login(page, { email, password });
  await page.getByRole("link", { name: "Perfil E2E" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByLabel("Email")).toHaveValue(email);

  await page.getByLabel("Nombre").fill("Nombre Nuevo");
  await page.getByRole("button", { name: "Guardar nombre" }).click();
  await expect(page.getByRole("status").filter({ hasText: /./ }).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Principal" }).getByText("Nombre Nuevo")).toBeVisible();

  await page.getByLabel("Password actual").fill("Equivocada1!");
  await page.getByLabel("Nueva password").fill(newPassword);
  await page.getByRole("button", { name: "Cambiar password" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByLabel("Password actual").fill(password);
  await page.getByRole("button", { name: "Cambiar password" }).click();
  await expect(page.getByText("Password actualizada.")).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await login(page, { email, password: newPassword });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
});
