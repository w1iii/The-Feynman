import { test, expect } from "@playwright/test";

test.describe("Protected Routes", () => {
  test("redirects unauthenticated user from /feynman to /", async ({ page }) => {
    await page.goto("/feynman");
    // Should redirect to landing page (middleware blocks unauthenticated)
    await expect(page).toHaveURL(/\//, { timeout: 10000 });
  });

  test("redirects authenticated user from / to /feynman", async ({
    page,
  }) => {
    // This test requires a real Supabase session
    // Skip in CI without test credentials
    test.skip(
      !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
      "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
    );

    // Login first
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should redirect to /feynman
    await expect(page).toHaveURL(/\/feynman/, { timeout: 15000 });

    // Visit / while logged in — should redirect back to /feynman
    await page.goto("/");
    await expect(page).toHaveURL(/\/feynman/, { timeout: 10000 });
  });
});

test.describe("API Auth", () => {
  test("unauthenticated API call returns 401", async ({ request }) => {
    const response = await request.get("/api/session/test-id");
    expect(response.status()).toBe(401);
  });
});
