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

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test("admin-gathering: disabled Wednesday can be configured and published", async ({
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
    return route.fulfill({ contentType: "application/json", json: { image: "unused" } });
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
  await page.getByRole("checkbox", { name: /enabled/i }).check();
  await page.getByLabel("Default Google Meet link").fill("https://meet.google.com/abc-defg-hij");
  await page.getByLabel("Date").fill("2030-08-14");
  await page.getByLabel("Message title").fill("Midweek Wisdom");
  await page.getByLabel("Scripture").fill("James 1:5");
  await page.getByLabel("Description").fill("Ask God for wisdom in every season.");
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page.getByText("Wednesday Word saved as published.")).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[0]).toMatchObject({ operation: "upsert-series", expectedRevision: 0 });
  expect(writes[1]).toMatchObject({
    operation: "upsert-occurrence",
    expectedRevision: 1,
    occurrence: {
      startsAt: "2030-08-14T23:00:00.000Z",
      status: "published",
      title: "Midweek Wisdom",
    },
  });
  expect(sermonBannerCalls).toBe(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
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
