import { expect, type Page, test } from "@playwright/test";

const TOKEN = "care-e2e-token";
const UPDATED_AT = "2030-08-09T12:00:00.000Z";

async function authenticate(page: Page) {
  await page.addInitScript(({ token }) => localStorage.setItem("admin_token", token), { token: TOKEN });
  await page.route("**/api/auth", (route) => route.fulfill({ contentType: "application/json", json: { authenticated: true } }));
}

function careStore(revision = 4) {
  return {
    schemaVersion: 1,
    revision,
    updatedAt: UPDATED_AT,
    records: [
      {
        id: "private-prayer",
        kind: "prayer",
        name: "Jordan",
        isAnonymous: false,
        message: "Please pray for a private family need.",
        visibility: "private",
        moderationStatus: "pending",
        careStatus: "new",
        urgency: "normal",
        contactPermission: true,
        email: "jordan@example.com",
        preferredContact: "email",
        source: "prayer-form",
        prayerCount: 0,
        createdAt: UPDATED_AT,
        updatedAt: UPDATED_AT,
      },
      {
        id: "visitor",
        kind: "visitor",
        name: "Taylor",
        isAnonymous: false,
        message: "I joined for the first time.",
        visibility: "private",
        moderationStatus: "pending",
        careStatus: "new",
        urgency: "normal",
        contactPermission: true,
        phone: "+1 555 010 1000",
        preferredContact: "phone",
        source: "welcome-form",
        prayerCount: 0,
        createdAt: UPDATED_AT,
        updatedAt: UPDATED_AT,
      },
    ],
  };
}

test("care: private prayer submission requests review without appearing publicly", async ({ page }) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/prayers", async (route) => {
    if (route.request().method() === "POST") {
      submitted = route.request().postDataJSON();
      await route.fulfill({ contentType: "application/json", status: 202, json: { submitted: true, pendingReview: true } });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: { prayers: [] } });
  });
  await page.route("**/api/testimonies", (route) => route.fulfill({ contentType: "application/json", json: { testimonies: [] } }));
  await page.goto("/community");
  await page.getByRole("button", { name: /submit request/i }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Prayer Request").fill("Please keep this private.");
  await dialog.getByRole("radio", { name: /pastor only/i }).check();
  await dialog.getByRole("button", { name: /^submit$/i }).click();

  await expect(page.getByText("Prayer Received")).toBeVisible();
  expect(submitted).toMatchObject({ request: "Please keep this private.", sharePublic: false });
  await expect(page.getByText("Please keep this private.")).toHaveCount(0);
});

test("care: first-time visitor sends a private follow-up request", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/gatherings**", (route) => route.fulfill({ contentType: "application/json", json: { featured: null, secondary: [], recentReplays: [] } }));
  await page.route("**/api/care", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ contentType: "application/json", status: 202, json: { submitted: true, pendingReview: true } });
  });
  await page.goto("/welcome");
  await page.getByLabel("First name").fill("Taylor");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("taylor@example.com");
  await page.getByRole("checkbox", { name: /pastor mike may contact/i }).check();
  await page.getByRole("button", { name: /let pastor mike know/i }).click();

  await expect(page.getByRole("heading", { name: /you’re welcome here/i })).toBeVisible();
  expect(submitted).toMatchObject({ kind: "visitor", name: "Taylor", contactPermission: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("care: admin reviews private prayer and visitor records", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  await authenticate(page);
  let update: Record<string, unknown> | null = null;
  await page.route("**/api/care**", async (route) => {
    if (route.request().method() === "PATCH") {
      update = route.request().postDataJSON();
      await route.fulfill({ contentType: "application/json", json: careStore(5) });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: careStore() });
  });
  await page.goto("/admin/care");
  await expect(page.getByRole("heading", { name: "Pastoral Care" })).toBeVisible();
  await expect(page.getByText("Please pray for a private family need.")).toBeVisible();
  await expect(page.getByText("I joined for the first time.")).toBeVisible();
  const firstCard = page.locator("article").filter({ hasText: "Jordan" });
  await firstCard.getByLabel("Care status").selectOption("contacted");
  await firstCard.getByLabel("Assigned to").fill("Pastor Mike");
  await firstCard.getByLabel("Private notes").fill("Sent a private email.");
  await firstCard.getByRole("button", { name: /save care update/i }).click();
  await expect(firstCard.getByText("Saved")).toBeVisible();
  expect(update).toMatchObject({ id: "private-prayer", expectedRevision: 4, updates: { careStatus: "contacted", assignee: "Pastor Mike", privateNotes: "Sent a private email." } });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("care: obsolete legacy prayer tab redirects to a preserved tool", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/content", (route) => route.fulfill({ contentType: "application/json", json: {} }));
  await page.route("**/api/prayers", (route) => route.fulfill({ contentType: "application/json", json: { prayers: [] } }));
  await page.route("**/api/testimonies", (route) => route.fulfill({ contentType: "application/json", json: { testimonies: [] } }));
  await page.goto("/admin/legacy?tab=prayers");

  await expect(page.getByRole("heading", { name: "Flyer Generator" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prayer Requests" })).toHaveCount(0);
});
