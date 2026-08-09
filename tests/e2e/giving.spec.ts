import { expect, type Page, test } from "@playwright/test";

const TOKEN = "giving-e2e-token";
const CAMPAIGN = "https://www.zeffy.com/en-US/donation-form/life-ministry-123";
const EMBED = "https://www.zeffy.com/en-US/embed/donation-form/life-ministry-123";

async function authenticate(page: Page) {
  await page.addInitScript(({ token }) => localStorage.setItem("admin_token", token), { token: TOKEN });
  await page.route("**/api/auth", (route) => route.fulfill({ contentType: "application/json", json: { authenticated: true } }));
}

test("giving: configured page embeds Zeffy with a permanent external fallback", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  await page.route("**/api/giving", (route) => route.fulfill({ contentType: "application/json", json: { configured: true, campaignUrl: CAMPAIGN, embedUrl: EMBED } }));
  await page.route("https://www.zeffy.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<html><body>Zeffy form</body></html>" }));
  const response = await page.goto("/give?success=true&canceled=true");

  const external = page.getByRole("link", { name: /open full zeffy form/i });
  await expect(external).toHaveAttribute("href", CAMPAIGN);
  await expect(external).toHaveAttribute("rel", "noopener noreferrer");
  const frame = page.getByTitle("Donation form powered by Zeffy");
  await expect(frame).toHaveAttribute("src", EMBED);
  await expect(frame).toHaveAttribute("allow", "payment");
  await expect(page.getByText(/payment was successful/i)).toHaveCount(0);
  await expect(page.getByText(/payment was canceled/i)).toHaveCount(0);
  expect(response?.headers()["content-security-policy"]).toContain("frame-src 'self' https://www.zeffy.com");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("giving: unconfigured state has no donation target or fake checkout", async ({ page, request }) => {
  await page.route("**/api/giving", (route) => route.fulfill({ contentType: "application/json", json: { configured: false } }));
  await page.goto("/give");
  await expect(page.getByRole("heading", { name: /online giving is being configured/i })).toBeVisible();
  await expect(page.getByTitle("Donation form powered by Zeffy")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /zeffy/i })).toHaveCount(0);

  const legacyCheckout = await request.post("/api/checkout", { data: { amount: 100, card: "should-not-be-read" } });
  expect(legacyCheckout.status()).toBe(404);
});

test("giving: admin validates and saves the Zeffy campaign link", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  await authenticate(page);
  let write: Record<string, unknown> | null = null;
  await page.route("**/api/giving**", async (route) => {
    if (route.request().method() === "PUT") {
      write = route.request().postDataJSON();
      await route.fulfill({ contentType: "application/json", json: { schemaVersion: 1, revision: 1, zeffyCampaignUrl: CAMPAIGN, updatedAt: "2030-08-09T12:00:00.000Z" } });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: { schemaVersion: 1, revision: 0, zeffyCampaignUrl: "", updatedAt: "2030-08-09T12:00:00.000Z" } });
  });
  await page.goto("/admin/giving");
  await page.getByLabel("Zeffy donation-form URL").fill(CAMPAIGN);
  await page.getByRole("button", { name: /save giving settings/i }).click();

  await expect(page.getByText(/zeffy giving is live/i)).toBeVisible();
  expect(write).toEqual({ expectedRevision: 0, zeffyCampaignUrl: CAMPAIGN });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
