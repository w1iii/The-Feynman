import { test, expect } from "@playwright/test";

test.describe("Feynman App", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test("unauthenticated user sees landing page", async ({ page }) => {
    await page.goto("/feynman");
    // Should redirect to landing
    await expect(page).toHaveURL(/\//, { timeout: 10000 });
  });

  test("authenticated user sees concept input", async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
    );

    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/feynman/, { timeout: 15000 });

    // Should see concept input
    await expect(page.getByPlaceholder("Enter a concept…")).toBeVisible();
    await expect(page.getByText("START MASTERY")).toBeVisible();
  });
});
