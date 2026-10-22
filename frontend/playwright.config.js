import { defineConfig } from "@playwright/test";

const slowMo = Number(process.env.E2E_SLOWMO ?? 0);

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    launchOptions: { slowMo },
  },
  workers: 1,
  reporter: "list",
});
