import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error message (Supabase will reject)
    await expect(page.locator(".bg-error-container")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Google login button exists", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

  test("link to signup works", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Signup Page", () => {
  test("renders signup form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Username").fill("testuser");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password456");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator(".bg-error-container")).toContainText("Passwords do not match");
  });

  test("shows error when username is too short", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Username").fill("ab");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator(".bg-error-container")).toContainText("Username must be at least 3 characters");
  });

  test("link to login works", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
