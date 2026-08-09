import { expect, type Page, test } from "@playwright/test";
import { futureAdminToken } from "./helpers";

const TOKEN = futureAdminToken("events");
const UPDATED_AT = "2030-08-09T12:00:00.000Z";

async function authenticate(page: Page) {
  await page.addInitScript(({ token }) => localStorage.setItem("admin_token", token), { token: TOKEN });
  await page.route("**/api/auth", (route) => route.fulfill({ contentType: "application/json", json: { authenticated: true } }));
}

function eventStore(revision = 0, events: unknown[] = []) {
  return { schemaVersion: 1, revision, events, updatedAt: UPDATED_AT };
}

const publishedEvent = {
  id: "event-1",
  title: "Community Bible Workshop",
  description: "Bring your Bible and your questions.",
  startsAt: "2030-08-14T23:00:00.000Z",
  endsAt: "2030-08-15T00:30:00.000Z",
  timezone: "America/New_York",
  locationType: "online",
  locationLabel: "Online",
  registrationUrl: "https://example.org/register",
};

test("events: public page shows only real events and canonical gatherings", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  await page.route("**/api/events", (route) => route.fulfill({ contentType: "application/json", json: { events: [publishedEvent] } }));
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: {
    series: [{ id: "wednesday-word", schedule: { timezone: "America/New_York" } }],
    featured: null,
    upcoming: [{ id: "wed-1", seriesId: "wednesday-word", localDate: "2030-08-21", startsAt: "2030-08-21T23:00:00.000Z", endsAt: "2030-08-22T00:30:00.000Z", status: "published", title: "Wednesday Word", scripture: "James 1:5", description: "Midweek encouragement." }],
    recent: [],
  } }));
  await page.goto("/events");

  await expect(page.getByRole("heading", { name: "Community Bible Workshop" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wednesday Word" })).toBeVisible();
  await expect(page.getByText("Event Photos Coming Soon")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /add to calendar/i })).toHaveAttribute("href", "/api/events/event-1/calendar");
  await expect(page.getByRole("link", { name: /register/i })).toHaveAttribute("rel", "noopener noreferrer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("events: honest empty and error states contain no fabricated Sunday", async ({ page }) => {
  await page.route("**/api/events", (route) => route.fulfill({ contentType: "application/json", json: { events: [] } }));
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: { series: [], featured: null, upcoming: [], recent: [] } }));
  await page.goto("/events");
  await expect(page.getByText(/no special events are scheduled/i)).toBeVisible();
  await expect(page.getByText("L.I.F.E. Sunday Worship")).toHaveCount(0);
});

test("events: load failure is not presented as an empty calendar", async ({ page }) => {
  await page.route("**/api/events", (route) => route.fulfill({ contentType: "application/json", status: 500, json: { error: "unavailable" } }));
  await page.route("**/api/gatherings", (route) => route.fulfill({ contentType: "application/json", json: { series: [], featured: null, upcoming: [], recent: [] } }));
  await page.goto("/events");
  await expect(page.getByText(/events couldn’t load/i)).toBeVisible();
  await expect(page.getByText(/no special events are scheduled/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("events: admin publishes a timezone-correct event", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") await page.setViewportSize({ width: 320, height: 700 });
  await authenticate(page);
  let write: Record<string, unknown> | null = null;
  await page.route("**/api/events**", async (route) => {
    if (route.request().method() === "POST") {
      write = route.request().postDataJSON();
      const event = { ...(write as { event: Record<string, unknown> }).event, id: "server-event", createdAt: UPDATED_AT, updatedAt: UPDATED_AT };
      await route.fulfill({ contentType: "application/json", status: 201, json: { event, store: eventStore(1, [event]) } });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: eventStore() });
  });
  await page.goto("/admin/events");
  await page.getByLabel("Title").fill("Community Bible Workshop");
  await page.getByLabel("Description").fill("Bring your Bible and your questions.");
  await page.getByLabel("Start date").fill("2030-08-14");
  await page.getByLabel("Start time").fill("19:00");
  await page.getByLabel("End date").fill("2030-08-14");
  await page.getByLabel("End time").fill("20:30");
  await page.getByLabel("Google Meet link").fill("https://meet.google.com/abc-defg-hij");
  await expect(page.getByText(/all event times use eastern time/i)).toBeVisible();
  await expect(page.getByLabel("Timezone")).toHaveCount(0);
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page.getByText("Community Bible Workshop saved as published.")).toBeVisible();
  expect(write).toMatchObject({ expectedRevision: 0, event: { startsAt: "2030-08-14T23:00:00.000Z", endsAt: "2030-08-15T00:30:00.000Z", timezone: "America/New_York", status: "published" } });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("events: admin converts a legacy event to Eastern when editing and re-saving", async ({ page }) => {
  await authenticate(page);
  const legacyEvent = {
    id: "legacy-pacific-event",
    title: "Legacy Pacific Event",
    description: "Created before ministry scheduling was standardized.",
    startsAt: "2030-08-15T02:00:00.000Z",
    endsAt: "2030-08-15T03:30:00.000Z",
    timezone: "America/Los_Angeles",
    status: "draft",
    locationType: "online",
    locationLabel: "Online",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    registrationUrl: "",
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  };
  let write: Record<string, unknown> | null = null;
  await page.route("**/api/events**", async (route) => {
    if (route.request().method() === "PATCH") {
      write = route.request().postDataJSON();
      const event = {
        ...(write as { event: Record<string, unknown> }).event,
        id: legacyEvent.id,
        createdAt: legacyEvent.createdAt,
        updatedAt: UPDATED_AT,
      };
      await route.fulfill({
        contentType: "application/json",
        json: { event, store: eventStore(5, [event]) },
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      json: eventStore(4, [legacyEvent]),
    });
  });

  await page.goto("/admin/events");
  await page.getByRole("button", { name: /legacy pacific event/i }).click();

  await expect(page.getByLabel("Start date")).toHaveValue("2030-08-14");
  await expect(page.getByLabel("Start time")).toHaveValue("22:00");
  await expect(page.getByLabel("End date")).toHaveValue("2030-08-14");
  await expect(page.getByLabel("End time")).toHaveValue("23:30");
  await expect(page.getByLabel("Timezone")).toHaveCount(0);
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page.getByText("Legacy Pacific Event saved as draft.")).toBeVisible();
  expect(write).toMatchObject({
    id: legacyEvent.id,
    expectedRevision: 4,
    event: {
      startsAt: legacyEvent.startsAt,
      endsAt: legacyEvent.endsAt,
      timezone: "America/New_York",
      status: "draft",
    },
  });
});

test("events: admin sees revision conflicts and can reload", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/events**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ contentType: "application/json", status: 409, json: { error: "Events changed" } });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: eventStore() });
  });
  await page.goto("/admin/events");
  await page.getByLabel("Title").fill("Conflicted event");
  await page.getByLabel("Description").fill("This edit is stale.");
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page.getByText(/events changed. reload the latest/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload latest" })).toBeVisible();
});

test("events: admin load failure blocks edits and offers retry", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/events**", (route) => route.fulfill({ contentType: "application/json", status: 500, json: { error: "unavailable" } }));
  await page.goto("/admin/events");

  await expect(page.getByText(/events could not be loaded/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveCount(0);
});
