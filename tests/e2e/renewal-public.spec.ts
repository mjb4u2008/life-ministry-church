import { expect, type Page, test } from "@playwright/test";

const MEET_URL = "https://meet.google.com/abc-defg-hij";
const SUNDAY_END = Date.parse("2026-10-25T17:00:00.000Z");
const WEDNESDAY_END = Date.parse("2026-10-29T01:30:00.000Z");
const START_TIME = SUNDAY_END - 1000;

function occurrence(id: string, seriesId: string, title: string, startsAt: string, endsAt: string, joinUrl?: string) {
  return { id, seriesId, title, localDate: startsAt.slice(0, 10), startsAt, endsAt, status: "published", scripture: "John 10:10", description: "A message for everyday faith.", ...(joinUrl ? { joinUrl } : {}) };
}

function publicPayload() {
  const sunday = occurrence("sunday-current", "sunday-worship", "Sunday Hope", "2026-10-25T15:30:00.000Z", "2026-10-25T17:00:00.000Z", MEET_URL);
  const wednesday = occurrence("wednesday-next", "wednesday-word", "Wednesday Word", "2026-10-28T23:30:00.000Z", "2026-10-29T01:30:00.000Z");
  const nextSunday = occurrence("sunday-next", "sunday-worship", "Sunday Worship", "2026-11-01T16:30:00.000Z", "2026-11-01T18:00:00.000Z");
  return {
    series: [
      { id: "sunday-worship", slug: "sunday-worship", kind: "sunday", name: "Sunday Worship", themeKey: "sunday", schedule: { dayOfWeek: 0, localTime: "11:30", timezone: "America/New_York", durationMinutes: 90 } },
      { id: "wednesday-word", slug: "wednesday-word", kind: "wednesday", name: "Wednesday Word", themeKey: "wednesday", schedule: { dayOfWeek: 3, localTime: "19:30", timezone: "America/New_York", durationMinutes: 120 } },
    ],
    featured: sunday,
    upcoming: [wednesday, nextSunday],
    recent: [],
    generatedAt: new Date(START_TIME).toISOString(),
  };
}

async function mockSecondaryContent(page: Page) {
  await page.route("**/api/content", (route) => route.fulfill({ contentType: "application/json", json: { socialLinks: { tiktok: "" }, tiktokVideos: [] } }));
  await page.route("**/api/daily-scripture", (route) => route.fulfill({ contentType: "application/json", json: {} }));
}

test("renewal: Sunday and Wednesday hand off automatically in the same document across DST", async ({ page }) => {
  await page.clock.install({ time: new Date(START_TIME) });
  await mockSecondaryContent(page);
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: publicPayload() }));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Sunday Hope" })).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.renewalTestMarker = "same-document"; });
  await page.clock.runFor(1500);
  await expect(page.getByRole("heading", { level: 1, name: "Wednesday Word" })).toBeVisible();
  await expect(page.getByRole("link", { name: /join on google meet/i })).toHaveCount(0);
  await page.clock.fastForward(WEDNESDAY_END - SUNDAY_END + 1500);
  await expect(page.getByRole("heading", { level: 1, name: "Sunday Worship" })).toBeVisible();
  await expect(page.locator(".renewal-hero-date")).toContainText("11:30 AM EST");
  await expect(page.locator("html")).toHaveAttribute("data-renewal-test-marker", "same-document");
});

test("renewal: room-open and live controls stay distinct and inside the image hero", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date(START_TIME) });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockSecondaryContent(page);
  let state: "joining" | "live" = "joining";
  await page.route("**/api/gatherings", (route) => {
    const payload = publicPayload();
    payload.upcoming = [];
    payload.featured = {
      ...payload.featured,
      title: "A word of hope",
      startsAt: new Date(state === "joining" ? START_TIME + 20 * 60000 : START_TIME - 10 * 60000).toISOString(),
      endsAt: new Date(START_TIME + 60 * 60000).toISOString(),
    };
    return route.fulfill({ contentType: "application/json", json: payload });
  });
  const widths = testInfo.project.name === "mobile-chrome" ? [320, 390] : [1280];
  for (const width of widths) {
    const height = width < 768 ? 700 : 900;
    await page.setViewportSize({ width, height });
    for (const phase of ["joining", "live"] as const) {
      state = phase;
      await page.goto("/");
      const hero = page.locator(".renewal-hero");
      await expect(hero).toHaveAttribute("data-gathering-phase", phase);
      await expect(hero.getByText(phase === "joining" ? "The room is open" : "Live now", { exact: true })).toBeVisible();
      await expect(hero.getByText(/this gathering has ended/i)).toHaveCount(0);
      const action = hero.getByRole("link", { name: phase === "joining" ? /join on google meet.*room is open/i : /join on google meet.*join us live/i });
      await expect(action).toHaveAttribute("href", MEET_URL);
      await expect(action).toHaveAttribute("target", "_blank");
      const actionBox = await action.boundingBox();
      const headerBox = await page.locator(".renewal-header").boundingBox();
      expect(actionBox!.height).toBeGreaterThanOrEqual(52);
      expect(actionBox!.y).toBeGreaterThanOrEqual(headerBox!.height);
      expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(height);
      await expect.poll(() => hero.locator("img").evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    }
  }
});

test("renewal: malformed schedules are recoverable and refresh errors remain visible below navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date(START_TIME) });
  await mockSecondaryContent(page);
  let mode: "malformed" | "good" | "failed" = "malformed";
  await page.route("**/api/gatherings", (route) => {
    const payload = publicPayload();
    return route.fulfill({ status: mode === "failed" ? 503 : 200, contentType: "application/json", json: mode === "malformed" ? { ...payload, series: [null], featured: { ...payload.featured, title: { invalid: true } } } : mode === "good" ? payload : { error: "fixture unavailable" } });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Schedule temporarily unavailable" })).toBeVisible();
  mode = "good";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sunday Hope" })).toBeVisible();
  mode = "failed";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const notice = page.locator(".renewal-stale-notice");
  await expect(notice).toBeVisible();
  const noticeBox = await notice.boundingBox();
  const headerBox = await page.locator(".renewal-header").boundingBox();
  expect(noticeBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  await expect(notice.getByRole("button", { name: "Refresh schedule" })).toBeVisible();
  mode = "good";
  await notice.getByRole("button", { name: "Refresh schedule" }).click();
  await expect(notice).toHaveCount(0);
});

test("renewal: mobile menu closes for top Join, returns focus on Escape, and hides on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date(START_TIME) });
  await mockSecondaryContent(page);
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: publicPayload() }));
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.locator(".renewal-header-join").click();
  await expect(page).toHaveURL(/\/watch$/);
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator("#mobile-navigation")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
});

test("renewal: a valid long sermon title stays below navigation on narrow screens", async ({ page }) => {
  const title = "WALKING WITH OUR WONDERFUL GOD: HOW HIS MIGHTY MERCY RENEWS MINDS WHILE WE WORSHIP THROUGH EVERY STORM AND EVERY WORRY";
  expect(title.length).toBeLessThanOrEqual(120);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.clock.install({ time: new Date(START_TIME) });
  await mockSecondaryContent(page);
  await page.route("**/api/gatherings", (route) => {
    const payload = publicPayload();
    payload.featured.title = title;
    return route.fulfill({ contentType: "application/json", json: payload });
  });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1, name: title });
  await expect(heading).toBeVisible();
  const titleBox = await heading.boundingBox();
  const headerBox = await page.locator(".renewal-header").boundingBox();
  expect(titleBox!.y).toBeGreaterThanOrEqual(headerBox!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
