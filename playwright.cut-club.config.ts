import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/cut-club-responsive.spec.ts",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://127.0.0.1:3100/cut-club",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NODE_ENV: "production" },
  },
});
