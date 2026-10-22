export const ADMIN = { email: "admin@quickshop.com", password: "Admin1234!" };
export const CLIENT = { email: "cliente1@quickshop.com", password: "Cliente1234!" };

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function login(page, { email, password }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
}

export async function register(page, { email, password, name }) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Registrarse" }).click();
  await page.waitForURL(/\/login$/);
}

export async function findInAdminTable(page, name) {
  const row = page.getByRole("row", { name: new RegExp(name) });
  const next = page.getByRole("button", { name: "Siguiente" });
  while (!(await row.isVisible()) && (await next.isEnabled())) {
    await next.click();
    await page.waitForTimeout(300);
  }
  return row;
}

export async function storageSnapshot(page) {
  return page.evaluate(() => ({
    local: JSON.stringify({ ...localStorage }),
    session: JSON.stringify({ ...sessionStorage }),
  }));
}
