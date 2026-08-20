import { test, expect, type Page } from "@playwright/test";

const adminEmail =
  process.env.TEST_ADMIN_EMAIL ?? "info@steerbuilderscorporation.com";
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
const e2eBypassSecret = process.env.E2E_ADMIN_BYPASS_SECRET;

const canAuthenticate = Boolean(adminPassword || e2eBypassSecret);

async function signInAsAdmin(page: Page) {
  if (adminPassword) {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20_000 });
    return;
  }

  if (!e2eBypassSecret) {
    throw new Error("Missing TEST_ADMIN_PASSWORD or E2E_ADMIN_BYPASS_SECRET");
  }

  const response = await page.request.post("/api/e2e/session", {
    data: { secret: e2eBypassSecret },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20_000 });
}

test.describe("Admin auth gate", () => {
  test("unauthenticated /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: "Admin Sign In" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("login shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("not-an-admin@example.com");
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Admin authenticated flows", () => {
  test.skip(
    !canAuthenticate,
    "Set TEST_ADMIN_PASSWORD or E2E_ADMIN_BYPASS_SECRET for authenticated admin E2E."
  );

  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test("ops home shows Construction, Admin, and Projects actions", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Construction payroll" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Admin payroll" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Upload Construction →" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Upload Admin →" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Manage Projects →" })
    ).toBeVisible();
  });

  test("Construction payroll page is upload-first and read-only empty", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Upload Construction →" }).click();
    await expect(page).toHaveURL(/\/admin\/payroll/);
    await expect(page.getByRole("heading", { name: "Payroll" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Upload payroll/i })
    ).toBeVisible();
    await expect(
      page.getByText(/sheet tabs .* entry dates/i)
    ).toBeVisible();
    await expect(
      page.getByText(/No payable construction payroll/i)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export CSV" })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Print Slips" })
    ).toBeDisabled();
  });

  test("Admin payroll tab opens from home deep link", async ({ page }) => {
    await page.getByRole("link", { name: "Upload Admin →" }).click();
    await expect(page).toHaveURL(/tab=admin/);
    await expect(page.getByText(/^Admin · /)).toBeVisible();
    await expect(
      page.getByText(/No payable admin payroll/i)
    ).toBeVisible();
  });

  test("Projects admin page loads", async ({ page }) => {
    await page.getByRole("link", { name: "Manage Projects →" }).click();
    await expect(page).toHaveURL(/\/admin\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });
});
