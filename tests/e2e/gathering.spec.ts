import { expect, type Page, test } from "@playwright/test";

const MEET_URL = "https://meet.google.com/abc-defg-hij";
const REPLAY_URL = "https://www.youtube.com/watch?v=life-message";

function gatheringPayload(
  state: "upcoming" | "live" | "replay",
) {
  const now = Date.now();
  const startsAt = new Date(
    state === "upcoming" ? now + 3 * 86_400_000 : now - 15 * 60_000,
  );
  const endsAt = new Date(state === "replay" ? now - 5 * 60_000 : now + 75 * 60_000);
  const occurrence = {
    id: `wednesday-word:${startsAt.toISOString().slice(0, 10)}`,
    seriesId: "wednesday-word",
    localDate: startsAt.toISOString().slice(0, 10),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: state === "replay" ? "completed" : state === "live" ? "live" : "published",
    title:
      state === "live"
        ? "Live Midweek Hope"
        : state === "replay"
          ? "A Message to Remember"
          : "Wisdom for Wednesday",
    scripture: "James 1:5",
    description: "A practical word for everyday faith.",
    ...(state === "live" ? { joinUrl: MEET_URL } : {}),
    ...(state === "replay" ? { replayUrl: REPLAY_URL } : {}),
  };

  return {
    series: [
      {
        id: "wednesday-word",
        slug: "wednesday-word",
        kind: "wednesday",
        name: "Wednesday Word",
        themeKey: "wednesday",
        schedule: {
          dayOfWeek: 3,
          localTime: "19:00",
          timezone: "America/New_York",
          durationMinutes: 90,
        },
      },
    ],
    featured: occurrence,
    upcoming: state === "upcoming" ? [occurrence] : [],
    recent: state === "replay" ? [occurrence] : [],
    generatedAt: new Date(now).toISOString(),
  };
}

async function mockGatherings(page: Page, state: "upcoming" | "live" | "replay") {
  await page.route("**/api/gatherings", (route) =>
    route.fulfill({ contentType: "application/json", json: gatheringPayload(state) }),
  );
  await page.route("**/api/prayers", (route) =>
    route.fulfill({ contentType: "application/json", json: { prayers: [] } }),
  );
  await page.route("**/api/testimonies", (route) =>
    route.fulfill({ contentType: "application/json", json: { testimonies: [] } }),
  );
  await page.route("**/api/daily-scripture", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: {
        verse: "Be strong and courageous.",
        reference: "Joshua 1:9",
        reflection: "God is with you today.",
        date: "2030-08-14",
        generatedAt: "2030-08-14T12:00:00.000Z",
        isManualOverride: false,
      },
    }),
  );
}

test("gathering: homepage uses the canonical upcoming Wednesday", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") {
    await page.setViewportSize({ width: 320, height: 700 });
  }
  await mockGatherings(page, "upcoming");
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Wisdom for Wednesday" })).toBeVisible();
  await expect(page.getByText("Wednesday Word")).toBeVisible();
  await expect(page.getByLabel("Time until gathering")).toBeVisible();
  await expect(page.getByRole("link", { name: /get a reminder/i })).toBeVisible();
  await expect(page.getByText("No public prayer requests have been shared yet.")).toBeVisible();
  await expect(page.getByText("Sarah M.")).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("gathering: Watch shows a live Meet action from the canonical payload", async ({ page }) => {
  await mockGatherings(page, "live");
  await page.goto("/watch");

  await expect(page.getByRole("heading", { name: "Live Midweek Hope" })).toBeVisible();
  await expect(page.getByText("Live now")).toBeVisible();
  await expect(page.getByRole("link", { name: /join on google meet/i })).toHaveAttribute(
    "href",
    MEET_URL,
  );
  await expect(page.getByText("Finding Rest in Restless Times")).toHaveCount(0);
});

test("gathering: Watch shows a real replay and no fabricated archive", async ({ page }) => {
  await mockGatherings(page, "replay");
  await page.goto("/watch");

  await expect(page.getByRole("heading", { name: "A Message to Remember" })).toBeVisible();
  await expect(page.getByText("Latest message")).toBeVisible();
  await expect(page.getByRole("link", { name: /watch replay/i })).toHaveAttribute(
    "href",
    REPLAY_URL,
  );
  await expect(
    page.getByText("No additional message recordings have been published yet."),
  ).toBeVisible();
});
