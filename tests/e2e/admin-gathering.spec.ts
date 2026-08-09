import { expect, type Page, test } from "@playwright/test";
import { futureAdminToken } from "./helpers";

const TOKEN = futureAdminToken("admin-gathering");
const UPDATED_AT = "2030-08-01T12:00:00.000Z";

function gatheringStore(revision = 0) {
  return {
    schemaVersion: 1,
    revision,
    series: [
      {
        id: "sunday-worship",
        slug: "sunday-worship",
        kind: "sunday",
        name: "Sunday Worship",
        enabled: true,
        themeKey: "sunday",
        schedule: {
          dayOfWeek: 0,
          localTime: "11:30",
          timezone: "America/New_York",
          durationMinutes: 90,
        },
        defaultMeetUrl: "https://meet.google.com/sun-dayy-link",
        joinWindowMinutes: 30,
        updatedAt: UPDATED_AT,
      },
      {
        id: "wednesday-word",
        slug: "wednesday-word",
        kind: "wednesday",
        name: "Wednesday Word",
        enabled: false,
        themeKey: "wednesday",
        schedule: null,
        defaultMeetUrl: "",
        joinWindowMinutes: 30,
        updatedAt: UPDATED_AT,
      },
    ],
    occurrences: [],
    reminderDeliveries: [],
    updatedAt: UPDATED_AT,
  };
}

async function authenticate(page: Page) {
  await page.addInitScript(
    ({ token }) => localStorage.setItem("admin_token", token),
    { token: TOKEN },
  );
  await page.route("**/api/auth", (route) =>
    route.fulfill({ contentType: "application/json", json: { authenticated: true } }),
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
}

test("admin-gathering: dashboard shows both weekly lanes and preserved tools", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") {
    await page.setViewportSize({ width: 320, height: 700 });
  }
  await authenticate(page);
  await page.route("**/api/gatherings**", (route) =>
    route.fulfill({ contentType: "application/json", json: gatheringStore() }),
  );
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "This Week" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wednesday Word" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sunday Worship" })).toBeVisible();
  await expect(page.getByRole("link", { name: /flyer generator/i })).toHaveAttribute(
    "href",
    "/admin/legacy?tab=flyer",
  );
  await expect(page.getByText("Pastoral care inbox")).toBeVisible();
  await expect(page.getByText("Events center")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("admin-gathering: Wednesday is one simple Eastern Time publish form", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") {
    await page.setViewportSize({ width: 320, height: 700 });
  }
  await authenticate(page);
  let revision = 0;
  const writes: Array<Record<string, unknown>> = [];
  let sermonBannerCalls = 0;
  await page.route("**/api/sermon-banner", (route) => {
    sermonBannerCalls += 1;
    return route.fulfill({
      contentType: "application/json",
      json: { image: "must-not-run", mimeType: "image/png" },
    });
  });
  await page.route("**/api/gatherings**", async (route) => {
    if (route.request().method() === "PUT") {
      writes.push(route.request().postDataJSON());
      revision += 1;
    }
    await route.fulfill({ contentType: "application/json", json: gatheringStore(revision) });
  });
  await page.goto("/admin/gatherings/wednesday-word");

  await expect(page.getByRole("heading", { name: /prepare wednesday word/i })).toBeVisible();
  for (const label of [
    "Date",
    "Start time",
    "End time",
    "Message title",
    "Scripture",
    "Description",
  ]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByLabel(/^Google Meet link/i)).toBeVisible();
  await expect(page.getByLabel(/Replay URL/i)).toBeVisible();
  await expect(page.getByText(/Eastern Time/i).first()).toBeVisible();
  await expect(page.getByText(/30 minutes before/i)).toBeVisible();
  await expect(page.getByLabel(/enabled/i)).toHaveCount(0);
  await expect(page.getByLabel(/^day$/i)).toHaveCount(0);
  await expect(page.getByLabel(/timezone/i)).toHaveCount(0);
  await expect(page.getByLabel(/duration/i)).toHaveCount(0);
  await expect(page.getByLabel(/join window|open join link/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Generate header" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Put on website" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete this gathering" })).toBeVisible();
  for (const oldAction of ["Save draft", "Publish", "Go live", "Complete", "Cancel gathering"]) {
    await expect(page.getByRole("button", { name: oldAction })).toHaveCount(0);
  }

  await page.getByLabel(/^Google Meet link/i).fill("https://meet.google.com/abc-defg-hij");
  await page.getByLabel("Date").fill("2030-08-14");
  await page.getByLabel("Start time").fill("19:00");
  await page.getByLabel("End time").fill("20:30");
  await page.getByLabel("Message title").fill("Midweek Wisdom");
  await page.getByLabel("Scripture").fill("James 1:5");
  await page.getByLabel("Description").fill("Ask God for wisdom in every season.");
  await page.getByRole("button", { name: "Put on website" }).click();

  await expect.poll(() => writes.length).toBe(2);
  expect(writes[0]).toMatchObject({
    operation: "upsert-series",
    expectedRevision: 0,
    series: {
      id: "wednesday-word",
      enabled: true,
      defaultMeetUrl: "https://meet.google.com/abc-defg-hij",
      joinWindowMinutes: 30,
      schedule: {
        dayOfWeek: 3,
        localTime: "19:00",
        timezone: "America/New_York",
        durationMinutes: 90,
      },
    },
  });
  expect(writes[1]).toMatchObject({
    operation: "upsert-occurrence",
    expectedRevision: 1,
    occurrence: {
      id: "wednesday-word:2030-08-14",
      startsAt: "2030-08-14T23:00:00.000Z",
      endsAt: "2030-08-15T00:30:00.000Z",
      status: "published",
      title: "Midweek Wisdom",
    },
  });
  expect(sermonBannerCalls).toBe(0);
  await expectNoHorizontalOverflow(page);
});

test("admin-gathering: Sunday header is explicit and delete is confirmed", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") {
    await page.setViewportSize({ width: 320, height: 700 });
  }
  await authenticate(page);
  let revision = 0;
  const writes: Array<Record<string, unknown>> = [];
  const bannerRequests: Array<Record<string, unknown>> = [];
  await page.route("**/api/sermon-banner", async (route) => {
    bannerRequests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/json",
      json: { image: "c2VybW9u", mimeType: "image/png" },
    });
  });
  await page.route("**/api/gatherings**", async (route) => {
    if (route.request().method() === "PUT") {
      writes.push(route.request().postDataJSON());
      revision += 1;
    }
    await route.fulfill({ contentType: "application/json", json: gatheringStore(revision) });
  });
  await page.goto("/admin/gatherings/sunday-worship");

  await expect(page.getByRole("button", { name: "Generate header" })).toBeVisible();
  await page.getByLabel("Date").fill("2030-08-18");
  await page.getByLabel("Message title").fill("Grace for Today");
  await page.getByLabel("Scripture").fill("2 Corinthians 12:9");
  expect(bannerRequests).toHaveLength(0);

  await page.getByRole("button", { name: "Put on website" }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(bannerRequests).toHaveLength(0);

  await page.getByRole("button", { name: "Generate header" }).click();
  await expect.poll(() => bannerRequests.length).toBe(1);
  expect(bannerRequests[0]).toEqual({
    title: "Grace for Today",
    scripture: "2 Corinthians 12:9",
  });
  await expect(page.getByRole("button", { name: /download (?:header|banner)/i })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete this gathering" }).click();
  await expect.poll(() => writes.length).toBe(3);
  expect(writes[2]).toEqual({
    operation: "delete-occurrence",
    expectedRevision: 2,
    occurrenceId: "sunday-worship:2030-08-18",
  });
  await expectNoHorizontalOverflow(page);
});

test("admin-gathering: a stale publish is recoverable", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/gatherings**", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        json: { error: "Gatherings changed since they were loaded" },
      });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: gatheringStore() });
  });
  await page.goto("/admin/gatherings/wednesday-word");

  await page.getByLabel("Message title").fill("Midweek Wisdom");
  await page.getByLabel(/^Google Meet link/i).fill("https://meet.google.com/abc-defg-hij");
  await page.getByRole("button", { name: "Put on website" }).click();

  await expect(page.getByText(/someone else changed this gathering/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /reload latest/i })).toBeVisible();
});

test("admin-gathering: pinned legacy tab opens the preserved flyer generator", async ({
  page,
}) => {
  await authenticate(page);
  await page.route("**/api/gatherings**", (route) =>
    route.fulfill({ contentType: "application/json", json: gatheringStore() }),
  );
  await page.route("**/api/content", (route) =>
    route.fulfill({ contentType: "application/json", json: {} }),
  );
  await page.route("**/api/prayers", (route) =>
    route.fulfill({ contentType: "application/json", json: { prayers: [] } }),
  );
  await page.route("**/api/testimonies", (route) =>
    route.fulfill({ contentType: "application/json", json: { testimonies: [] } }),
  );
  await page.goto("/admin/legacy?tab=flyer");

  await expect(page.getByRole("heading", { name: "Flyer Generator" })).toBeVisible();
  await expect(page.getByText(/describe the flyer you want/i)).toBeVisible();
});
