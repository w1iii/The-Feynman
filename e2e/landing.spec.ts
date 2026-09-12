import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Master difficult lessons by explaining them." })).toBeVisible();
    await expect(page.getByText("Master difficult lessons by explaining them.")).toBeVisible();
    await expect(page.getByText("For Filipino students and lifelong learners")).toBeVisible();
    await expect(page.getByText("No credit card required")).toBeVisible();
    await expect(page.getByText("24-second demo")).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");

    // Sign In link
    await page.getByRole("link", { name: "Sign In" }).first().click();
    await expect(page).toHaveURL(/\/login/);

    // Go back
    await page.goto("/");

    // Get Started link
    await page.getByRole("link", { name: "Get Started" }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("How It Works section renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "How It Works" })).toBeVisible();
    await expect(page.getByText("Choose a Concept")).toBeVisible();
    await expect(page.getByText("Explain Simply")).toBeVisible();
    await expect(page.getByText("Master It")).toBeVisible();
  });

  test("CTA section renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Ready to master your curiosity?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start for free" }).last()).toBeVisible();
    await expect(page.getByText("₱499/month")).toBeVisible();
    await expect(page.getByText("GCash, Maya, or card")).toBeVisible();
  });
});
