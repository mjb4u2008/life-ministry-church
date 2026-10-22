import { expect, type Page, test } from "@playwright/test";

async function mockPublicContent(page: Page, withUpcomingGathering = false) {
  await page.route("**/api/content", (route) => route.fulfill({ contentType: "application/json", json: { socialLinks: { tiktok: "" }, tiktokVideos: [] } }));
  const occurrence = { id: "refinement-upcoming", seriesId: "sunday-worship", localDate: "2050-10-23", title: "Living in hope", scripture: "John 10:10", description: "A local browser fixture", startsAt: "2050-10-23T15:30:00.000Z", endsAt: "2050-10-23T17:00:00.000Z", status: "published" };
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: { featured: withUpcomingGathering ? occurrence : null, upcoming: [], recent: [], series: withUpcomingGathering ? [{ id: "sunday-worship", name: "Sunday Worship", themeKey: "sunday" }] : [] } }));
  await page.route("**/api/daily-scripture", (route) => route.fulfill({ contentType: "application/json", json: { verse: "I am come that they might have life, and that they might have it more abundantly.", reference: "John 10:10", reflection: "Life in Jesus shapes the way we love our neighbors." } }));
}

test("refinement: reminder disclosure works by keyboard and preserves explicit consent after closing", async ({ page }) => {
  await mockPublicContent(page);
  let submissions = 0;
  await page.route("**/api/subscribers", (route) => {
    submissions++;
    return route.fulfill({ status: 201, contentType: "application/json", json: { id: "refinement-local" } });
  });
  await page.goto("/");
  const panel = page.getByRole("region", { name: "Gathering reminders", exact: true });
  const details = panel.locator("details");
  const summary = panel.locator("summary");
  await expect(details).not.toHaveAttribute("open");
  await expect(panel.getByLabel("Name", { exact: true })).toBeHidden();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("button", { name: "Email", exact: true })).toBeFocused();
  await panel.getByLabel("Name", { exact: true }).fill("Alex");
  await panel.getByLabel("Email", { exact: true }).fill("alex@example.com");
  const consent = panel.getByRole("checkbox", { name: /agree to receive gathering reminders/i });
  await expect(consent).not.toBeChecked();
  await panel.getByRole("button", { name: "Remind me", exact: true }).click();
  expect(submissions).toBe(0);
  await consent.check();
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
  await page.keyboard.press("Enter");
  await expect(panel.getByLabel("Name", { exact: true })).toHaveValue("Alex");
  await expect(panel.getByLabel("Email", { exact: true })).toHaveValue("alex@example.com");
  await expect(consent).toBeChecked();
  await panel.getByRole("button", { name: "Remind me", exact: true }).click();
  await expect(panel.getByText("You’re on the list.", { exact: true })).toBeVisible();
  expect(submissions).toBe(1);
});

test("refinement: direct reminder fragments reveal the form and hash navigation restores it", async ({ page }) => {
  await mockPublicContent(page);
  await page.goto("/#reminded");
  const panel = page.getByRole("region", { name: "Gathering reminders", exact: true });
  const details = panel.locator("details");
  await expect(details).toHaveAttribute("open", "");
  await expect(panel.getByLabel("Name", { exact: true })).toBeVisible();
  await expect.poll(async () => (await panel.boundingBox())!.y).toBeLessThan(await page.evaluate(() => innerHeight));
  await panel.locator("summary").click();
  await expect(details).not.toHaveAttribute("open");
  await page.evaluate(() => { location.hash = "heart"; });
  await page.evaluate(() => { location.hash = "reminded"; });
  await expect(details).toHaveAttribute("open", "");
  await expect(panel.getByLabel("Name", { exact: true })).toBeVisible();
});

test("refinement: the actual hero reminder link reopens a closed form when the fragment is unchanged", async ({ page }) => {
  await mockPublicContent(page, true);
  await page.goto("/#reminded");
  const panel = page.getByRole("region", { name: "Gathering reminders", exact: true });
  const details = panel.locator("details");
  await expect(details).toHaveAttribute("open", "");
  await panel.locator("summary").click();
  await expect(details).not.toHaveAttribute("open");
  await page.evaluate(() => { document.documentElement.dataset.refinementMarker = "same-page"; });
  const reminderLink = page.locator(".renewal-hero").getByRole("link", { name: "Get a reminder", exact: true });
  await expect(reminderLink).toHaveAttribute("href", "#reminded");
  await reminderLink.click();
  await expect(page).toHaveURL(/\/#reminded$/);
  await expect(page.locator("html")).toHaveAttribute("data-refinement-marker", "same-page");
  await expect(details).toHaveAttribute("open", "");
  await expect(panel.getByLabel("Name", { exact: true })).toBeVisible();
});

test("refinement: editorial sections and the open reminder form stay inside narrow and wide viewports", async ({ page }, testInfo) => {
  await mockPublicContent(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const widths = testInfo.project.name === "mobile-chrome" ? [320, 390] : [768, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto("/#reminded");
    await expect(page.getByRole("heading", { name: "Welcome to LIFE.", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Because He lives.", exact: true })).toBeVisible();
    const panel = page.getByRole("region", { name: "Gathering reminders", exact: true });
    await expect(panel.getByLabel("Name", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const outOfBounds = await page.locator(".renewal-heart dt,.renewal-heart dd,.renewal-heart-copy,.renewal-faith h2,.renewal-faith-copy,.renewal-scripture blockquote,.renewal-scripture-reflection,.renewal-connection,.renewal-reminder-reveal input,.renewal-reminder-reveal button,.renewal-footer-directory,.renewal-footer-wordmark").evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim().slice(0, 50), left: rect.left, right: rect.right };
    }).filter((rect) => rect.left < -1 || rect.right > innerWidth + 1));
    expect(outOfBounds, `Elements outside the ${width}px viewport`).toEqual([]);
  }
});
