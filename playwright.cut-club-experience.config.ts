import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/cut-club-experience-preview.spec.ts",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3102",
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3102",
    url: "http://127.0.0.1:3102/dev/cut-club-preview",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      CUT_CLUB_PREVIEW_ENABLED: "true",
    },
  },
});
