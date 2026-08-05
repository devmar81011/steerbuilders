import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

/** Local Playwright-only secret; never set on Vercel production. */
const e2eBypassSecret =
  process.env.E2E_ADMIN_BYPASS_SECRET || "playwright-local-e2e-bypass";

if (!process.env.E2E_ADMIN_BYPASS_SECRET) {
  process.env.E2E_ADMIN_BYPASS_SECRET = e2eBypassSecret;
}

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "unit",
      testMatch: /payroll-periods\.spec\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /payroll-periods\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      testIgnore: /payroll-periods\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          E2E_ADMIN_BYPASS_SECRET: e2eBypassSecret,
        },
      },
});
