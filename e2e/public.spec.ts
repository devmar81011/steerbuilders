import { test, expect } from "@playwright/test";

test.describe("Public site — client presentation quality", () => {
  test("homepage loads brand, hero CTA, and contact section", async ({
    page,
  }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "Steer Builders Corporation" })
    ).toBeVisible();
    await expect(
      main.getByText("We help build your vision.", { exact: true })
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: "Request a Proposal" })
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: "View Portfolio" })
    ).toBeVisible();

    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Project Details")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Inquiry" })
    ).toBeVisible();
  });

  test("about page shows story, vision, mission, and leadership", async ({
    page,
  }) => {
    await page.goto("/about");

    await expect(
      page.getByRole("heading", { name: "Steer Builders Corporation" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Our Story" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Our Vision" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Our Mission" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Leadership Team" })
    ).toBeVisible();
    await expect(
      page.getByText("Engineering excellence with sound financial governance.")
    ).toBeVisible();
    await expect(
      page.getByText("President & CEO", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Chief Financial Officer", { exact: true })
    ).toBeVisible();
  });

  test("projects portfolio page loads with filters", async ({ page }) => {
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", { name: /project portfolio/i })
    ).toBeVisible();
    await expect(page.getByRole("main").getByText(/all/i).first()).toBeVisible();
  });

  test("public About and Portfolio routes are reachable from the site", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/about"]').first()).toBeAttached();
    await expect(page.locator('a[href="/projects"]').first()).toBeAttached();

    await page.goto("/about");
    await expect(page).toHaveURL(/\/about/);
    await expect(
      page.getByRole("heading", { name: "Leadership Team" })
    ).toBeVisible();

    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/);
    await expect(
      page.getByRole("heading", { name: /project portfolio/i })
    ).toBeVisible();
  });

  test("contact form validates required fields", async ({ page }) => {
    await page.goto("/#contact");
    await page.locator("#contact").scrollIntoViewIfNeeded();

    await page.getByRole("button", { name: "Send Inquiry" }).click();

    const name = page.getByLabel("Full Name");
    const email = page.getByLabel("Email");
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("required", "");
    await expect(email).toHaveAttribute("required", "");
  });
});
