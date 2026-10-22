import { expect, test } from "@playwright/test";
import { login, register, uniqueEmail } from "./helpers.js";

const MAILHOG_URL = process.env.MAILHOG_URL ?? "http://localhost:8025";

async function resetLinkFor(request, email) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await request.get(`${MAILHOG_URL}/api/v2/search`, {
      params: { kind: "to", query: email },
    });
    const { items } = await response.json();
    if (items.length > 0) {
      const body = items[0].Content.Body.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
      const match = body.match(/https?:\/\/\S+\/reset-password\?token=[\w-]+/);
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No llego el email de recuperacion para ${email}`);
}

test("recuperar password por email, y el enlace solo sirve una vez", async ({ page, request }) => {
  const email = uniqueEmail("reset");
  const password = "Inicial1234!";
  const newPassword = "Recuperada1234!";
  await register(page, { email, password, name: "Reset E2E" });

  await page.goto("/login");
  await page.getByRole("link", { name: "Has olvidado tu password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("status")).toContainText("Si el email existe");

  const link = await resetLinkFor(request, email);
  const path = new URL(link).pathname + new URL(link).search;
  await page.goto(path);
  await page.getByLabel("Nueva password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirmar password").fill(newPassword);
  await page.getByRole("button", { name: "Cambiar password" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toContainText("Password actualizada");

  await login(page, { email, password: newPassword });
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();

  await page.goto(path);
  await page.getByLabel("Nueva password", { exact: true }).fill("Otra1234!xx");
  await page.getByLabel("Confirmar password").fill("Otra1234!xx");
  await page.getByRole("button", { name: "Cambiar password" }).click();
  await expect(page.getByRole("alert")).toContainText("caducado");
  await expect(page.getByRole("link", { name: "Solicitar un nuevo enlace" })).toBeVisible();
});

test("un email inexistente muestra el mismo mensaje generico", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("nadie-existe@example.com");
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("status")).toContainText("Si el email existe");
});
