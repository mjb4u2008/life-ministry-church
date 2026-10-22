import { expect, test } from "@playwright/test";
import { futureAdminToken } from "./helpers";

const TOKEN = futureAdminToken("responsive");
const UPDATED_AT = "2030-08-09T12:00:00.000Z";
const videoContent = {
  socialLinks: { tiktok: "https://www.tiktok.com/@l.i.f.e.ministry" },
  tiktokVideos: [
    { id: "7683384185838374174", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7683384185838374174", title: "Jesus, the head of our life" },
    { id: "7636588562930044190", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7636588562930044190", title: "A relationship with Jesus" },
    { id: "7621790450873093406", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7621790450873093406", title: "The perfect love letter" },
  ],
};

const adminStore = {
  schemaVersion: 1,
  revision: 1,
  series: [
    { id: "wednesday", slug: "wednesday", kind: "wednesday", name: "Wednesday Word", enabled: true, themeKey: "wednesday", schedule: { dayOfWeek: 3, localTime: "18:00", timezone: "America/Los_Angeles", durationMinutes: 60 }, defaultMeetUrl: "https://meet.google.com/abc-defg-hij", joinWindowMinutes: 30, updatedAt: UPDATED_AT },
    { id: "sunday", slug: "sunday", kind: "sunday", name: "Sunday Worship", enabled: true, themeKey: "sunday", schedule: { dayOfWeek: 0, localTime: "08:30", timezone: "America/Los_Angeles", durationMinutes: 90 }, defaultMeetUrl: "https://meet.google.com/abc-defg-hij", joinWindowMinutes: 30, updatedAt: UPDATED_AT },
  ],
  occurrences: [],
  reminderDeliveries: [],
  updatedAt: UPDATED_AT,
};

test("responsive: public and admin foundations hold at every required width", async ({ page }) => {
  await page.addInitScript(({ token }) => localStorage.setItem("admin_token", token), { token: TOKEN });
  await page.route("**/api/auth", (route) => route.fulfill({ contentType: "application/json", json: { authenticated: true } }));
  await page.route("**/api/gatherings**", (route) => {
    const admin = new URL(route.request().url()).searchParams.get("admin") === "1";
    return route.fulfill({ contentType: "application/json", json: admin ? adminStore : { series: [], featured: null, upcoming: [], recent: [], generatedAt: UPDATED_AT } });
  });
  await page.route("**/api/prayers", (route) => route.fulfill({ contentType: "application/json", json: { prayers: [] } }));
  await page.route("**/api/testimonies", (route) => route.fulfill({ contentType: "application/json", json: { testimonies: [] } }));
  await page.route("**/api/daily-scripture", (route) => route.fulfill({ contentType: "application/json", json: {} }));
  await page.route("**/api/content", (route) => route.fulfill({ contentType: "application/json", json: videoContent }));
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [320, 360, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const rail = page.getByRole("region", { name: "Pastor Mike’s videos" });
    await expect(rail.getByRole("article")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `document width at ${width}px`).toBeLessThanOrEqual(width);
    const publicOverflow = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.right <= window.innerWidth + 1 && rect.left >= -1) return [];
      // A bounded horizontal scroller clips its offscreen cards. Start with
      // the parent so the rail itself must still fit the document viewport.
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.body) {
        const bounds = ancestor.getBoundingClientRect();
        if (getComputedStyle(ancestor).overflowX === "auto" && ancestor.scrollWidth > ancestor.clientWidth + 1 && bounds.width > 0 && bounds.left >= -1 && bounds.right <= window.innerWidth + 1) return [];
        ancestor = ancestor.parentElement;
      }
      return [{ tag: element.tagName, className: element.getAttribute("class"), left: rect.left, right: rect.right }];
    }).slice(0, 5));
    expect(publicOverflow, `homepage overflow at ${width}px`).toEqual([]);
    const railDimensions = await rail.evaluate((element) => ({ width: element.clientWidth, contentWidth: element.scrollWidth, overflowX: getComputedStyle(element).overflowX }));
    expect(railDimensions.overflowX).toBe("auto");
    if (width <= 430) expect(railDimensions.contentWidth, `video rail overflows within its own viewport at ${width}px`).toBeGreaterThan(railDimensions.width);
    if (railDimensions.contentWidth > railDimensions.width + 1) {
      await rail.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
      await expect.poll(() => rail.evaluate((element) => element.scrollLeft), { message: `video rail scrolls at ${width}px` }).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `scrolling the rail does not widen the document at ${width}px`).toBeLessThanOrEqual(width);
      await rail.evaluate((element) => { element.scrollLeft = 0; });
    }
    if (width < 768) {
      const menu = page.getByRole("button", { name: "Open menu" });
      const box = await menu.boundingBox();
      expect(box?.width, `menu width at ${width}px`).toBeGreaterThanOrEqual(44);
      expect(box?.height, `menu height at ${width}px`).toBeGreaterThanOrEqual(44);
    }
    const reducedDuration = await page.evaluate(() => {
      const sample = document.createElement("div");
      sample.className = "animate-spin";
      document.body.append(sample);
      const duration = getComputedStyle(sample).animationDuration;
      sample.remove();
      return duration;
    });
    const reducedSeconds = reducedDuration.endsWith("ms")
      ? Number.parseFloat(reducedDuration) / 1_000
      : Number.parseFloat(reducedDuration);
    expect(reducedSeconds).toBeLessThanOrEqual(0.001);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "This Week" })).toBeVisible();
    const adminOverflow = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > window.innerWidth + 1 || rect.left < -1 ? [{ tag: element.tagName, className: element.getAttribute("class"), left: rect.left, right: rect.right }] : [];
    }).slice(0, 5));
    expect(adminOverflow, `admin overflow at ${width}px`).toEqual([]);
    const prepare = page
      .getByRole("link", { name: /set up gathering|view or update/i })
      .first();
    const prepareBox = await prepare.boundingBox();
    expect(prepareBox?.height, `admin primary target at ${width}px`).toBeGreaterThanOrEqual(44);
  }
});
