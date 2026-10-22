import { expect, test } from "@playwright/test";
import { futureAdminToken } from "./helpers";

test("admin videos: load effective posts, add, confirm removal, and save only videos", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 780 });
  const token = futureAdminToken("video-editor");
  await page.addInitScript(({ token }) => localStorage.setItem("admin_token", token), { token });
  await page.route("**/api/auth", (route) => route.fulfill({ contentType: "application/json", json: { authenticated: true } }));
  const original = { id: "7683384185838374174", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7683384185838374174", title: "Jesus, the head of our life" };
  const added = { id: "7636588562930044190", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7636588562930044190", title: "A relationship with Jesus" };
  let savedBody: unknown = null;
  await page.route("**/api/content?admin=1", (route) => route.fulfill({ contentType: "application/json", json: { revision: 0, tiktokVideos: [original], featuredVideosInitialized: true, contactEmail: "preserve@example.com" } }));
  await page.route("**/api/content", (route) => {
    expect(route.request().method()).toBe("PUT");
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`);
    expect(route.request().headers()["if-match"]).toBe("0");
    savedBody = route.request().postDataJSON();
    return route.fulfill({ contentType: "application/json", json: { revision: 1, tiktokVideos: [added] } });
  });
  await page.goto("/admin/videos");
  await expect(page.getByRole("heading", { level: 1, name: "Homepage videos" })).toBeVisible();
  await expect(page.getByLabel("Title (optional)", { exact: true }).first()).toHaveValue(original.title);
  await page.getByLabel("TikTok video link", { exact: true }).fill(added.url);
  await page.getByLabel("New video title (optional)", { exact: true }).fill(added.title);
  await page.getByRole("button", { name: "Add to list" }).click();
  await expect(page.getByRole("button", { name: "Remove video 2" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove video 1", exact: true }).click();
  await expect(page.getByLabel("Title (optional)", { exact: true })).toHaveValue(added.title);
  await page.getByRole("button", { name: "Save videos", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Videos saved" })).toBeVisible();
  expect(savedBody).toEqual({ tiktokVideos: [added] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({ path: `/tmp/life-video-editor-${testInfo.project.name}.png`, fullPage: true });
});

test("admin videos: a stale tab keeps its draft until a confirmed reload of the newer list", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 780 });
  const token = futureAdminToken("stale-video-editor");
  await page.addInitScript(({ token }) => localStorage.setItem("admin_token", token), { token });
  await page.route("**/api/auth", (route) => route.fulfill({ contentType: "application/json", json: { authenticated: true } }));
  const original = { id: "7683384185838374174", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7683384185838374174", title: "Original title" };
  const otherTabVideo = { id: "7636588562930044190", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7636588562930044190", title: "Added in another tab" };
  let newer = false;
  let writes = 0;
  await page.route("**/api/content?admin=1", (route) => route.fulfill({ contentType: "application/json", json: { revision: newer ? 1 : 0, tiktokVideos: newer ? [original, otherTabVideo] : [original] } }));
  await page.route("**/api/content", (route) => {
    writes += 1;
    if (writes === 1) {
      expect(route.request().headers()["if-match"]).toBe("0");
      newer = true;
      return route.fulfill({ status: 409, contentType: "application/json", json: { error: "Content changed" } });
    }
    expect(route.request().headers()["if-match"]).toBe("1");
    const updates = route.request().postDataJSON();
    expect(updates.tiktokVideos).toEqual([{ ...original, title: "Reviewed title" }, otherTabVideo]);
    return route.fulfill({ contentType: "application/json", json: { revision: 2, tiktokVideos: updates.tiktokVideos } });
  });
  await page.goto("/admin/videos");
  const firstTitle = page.getByLabel("Title (optional)", { exact: true }).first();
  await expect(firstTitle).toHaveValue(original.title);
  await firstTitle.fill("My local draft");
  await page.getByRole("button", { name: "Save videos", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "saved in another tab" })).toBeVisible();
  await expect(firstTitle).toHaveValue("My local draft");
  await expect(page.getByRole("button", { name: "Save videos", exact: true })).toBeDisabled();
  expect(writes).toBe(1);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reload saved videos" }).click();
  await expect(firstTitle).toHaveValue("My local draft");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reload saved videos" }).click();
  await expect(firstTitle).toHaveValue(original.title);
  await expect(page.getByLabel("Title (optional)", { exact: true }).nth(1)).toHaveValue(otherTabVideo.title);
  await firstTitle.fill("Reviewed title");
  await page.getByRole("button", { name: "Save videos", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Videos saved" })).toBeVisible();
  expect(writes).toBe(2);
});
