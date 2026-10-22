import { expect, test } from "@playwright/test";

const reflection = {
  scripture: { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  story: "You can bring your uncertainty to God, one day at a time.",
  exploreMore: [{ reference: "Matthew 6:34", description: "Take today as it comes." }],
};

test("reflection: question survives failure, a valid reply is readable, and sharing reports errors", async ({ page }, testInfo) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let requestCount = 0;
  await page.route("**/api/ask", (route) => {
    requestCount += 1;
    return route.fulfill({ status: requestCount === 1 ? 503 : 200, contentType: "application/json", json: requestCount === 1 ? { error: "fixture unavailable" } : reflection });
  });
  await page.route("**/api/ask/share", (route) => route.fulfill({ status: 500, contentType: "application/json", json: { error: "fixture failed" } }));
  await page.goto("/ask");
  await expect(page).toHaveTitle(/L.I.F.E. Ministry/);
  await expect(page.getByRole("heading", { level: 1, name: "Ask the Word." })).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  const input = page.getByRole("textbox", { name: "What’s on your heart?" });
  await input.fill("I am worried about tomorrow.");
  await page.getByRole("button", { name: "Seek Scripture" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Your question is still here" })).toBeVisible();
  await expect(input).toHaveValue("I am worried about tomorrow.");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Scripture for you" })).toBeFocused();
  await expect(page.getByText("Psalm 46:10")).toBeVisible();
  await expect(page.getByText(reflection.story)).toBeVisible();
  expect(await page.locator("blockquote span[aria-hidden] > span").first().evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  await page.screenshot({ path: `/tmp/life-ask-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Share this topic with Pastor Mike" }).click();
  await page.getByRole("button", { name: "Share anonymously", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Your topic wasn’t shared" })).toBeVisible();
  await expect(page.getByText(/Thank you for sharing/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(failures).toEqual([]);
});

test("media: reduced motion requires Play, a provider fixture can pause, and real permalinks remain", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/content", (route) => route.fulfill({ contentType: "application/json", json: {
    socialLinks: { tiktok: "https://www.tiktok.com/@scout2015" },
    tiktokVideos: [{ id: "official-docs-fixture", url: "https://www.tiktok.com/@scout2015/video/6718335390845095173", title: "Configured test video" }],
  } }));
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: { series: [], featured: null, upcoming: [], recent: [], generatedAt: new Date().toISOString() } }));
  await page.route("**/api/daily-scripture", (route) => route.fulfill({ contentType: "application/json", json: {} }));
  await page.route("https://www.tiktok.com/player/v1/**", (route) => route.fulfill({ contentType: "text/html", body: `<!doctype html><html><body style="background:#102b30;color:#f3f6ef;font:20px sans-serif">Provider fixture<script>const emit=(type,value)=>parent.postMessage({'x-tiktok-player':true,type,value},'*');window.addEventListener('message',event=>{if(event.data.type==='play'){document.body.firstChild.textContent='Fixture playing';emit('onStateChange',1);}if(event.data.type==='pause'){document.body.firstChild.textContent='Fixture paused';emit('onStateChange',2);}});emit('onPlayerReady');</script></body></html>` }));
  await page.goto("/");
  await expect(page.locator('iframe[src*="tiktok.com/player"]')).toHaveCount(0);
  const rail = page.getByRole("region", { name: "Pastor Mike’s videos" });
  await rail.scrollIntoViewIfNeeded();
  await expect(page.locator('iframe[src*="tiktok.com/player"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Play video: Configured test video" }).click();
  const frame = page.locator('iframe[title="Configured test video"]');
  await expect(frame).toHaveAttribute("src", /player\/v1\/6718335390845095173\?autoplay=0&muted=1&loop=1/);
  await expect(page.frameLocator('iframe[title="Configured test video"]').locator("body")).toContainText("Fixture playing");
  await page.getByRole("button", { name: "Pause video: Configured test video" }).click();
  await expect(page.frameLocator('iframe[title="Configured test video"]').locator("body")).toContainText("Fixture paused");
  await expect(page.getByRole("link", { name: "Open this video on TikTok" })).toHaveAttribute("href", "https://www.tiktok.com/@scout2015/video/6718335390845095173");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
