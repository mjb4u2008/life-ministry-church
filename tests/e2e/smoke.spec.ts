import { expect, test } from "@playwright/test";

test("the public home page renders its primary heading", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
