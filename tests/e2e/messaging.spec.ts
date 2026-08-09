import { expect, test } from "@playwright/test";

test("messaging: homepage signup requires explicit versioned-consent input", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/gatherings**", (route) => route.fulfill({ contentType: "application/json", json: { featured: null, upcoming: [], recent: [], series: [] } }));
  await page.route("**/api/prayers", (route) => route.fulfill({ contentType: "application/json", json: { prayers: [] } }));
  await page.route("**/api/testimonies", (route) => route.fulfill({ contentType: "application/json", json: { testimonies: [] } }));
  await page.route("**/api/daily-scripture", (route) => route.fulfill({ contentType: "application/json", json: {} }));
  await page.route("**/api/subscribers", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ contentType: "application/json", status: 201, json: { id: "subscriber-1" } });
  });
  const response = await page.goto("/");
  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "We’ll let you know before church begins." }) });
  await section.getByLabel("Name").fill("Alex");
  await section.getByLabel("Email", { exact: true }).fill("alex@example.com");
  const submit = section.getByRole("button", { name: "Remind Me" });
  await expect(submit).toBeDisabled();
  expect(submitted).toBeNull();
  await section.getByRole("checkbox", { name: /agree to receive email reminders/i }).check();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(section.getByText("You're all set.")).toBeVisible();
  expect(submitted).toMatchObject({ contactType: "email", consent: true, signupContext: "reminder-form" });
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response?.headers()["permissions-policy"]).toContain("camera=()");
  expect(response?.headers()["x-powered-by"]).toBeUndefined();
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("default-src 'self'");
  expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(csp).toContain("connect-src 'self'");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("messaging: unsubscribe result is clear and mobile safe", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/unsubscribe?status=success");
  await expect(page.getByRole("heading", { name: "You’re unsubscribed" })).toBeVisible();
  await expect(page.getByText(/no longer send ministry updates/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
