import { expect, type Page, test } from "@playwright/test";

const MEET_URL = "https://meet.google.com/abc-defg-hij";
const REPLAY_URL = "https://www.youtube.com/watch?v=life-message";

function gatheringPayload(
  state: "upcoming" | "joining" | "live" | "replay",
  service: "wednesday" | "sunday" = "wednesday",
) {
  const now = Date.now();
  const isWednesday = service === "wednesday";
  const seriesId = isWednesday ? "wednesday-word" : "sunday-worship";
  const seriesName = isWednesday ? "Wednesday Word" : "Sunday Worship";
  const startsAt = new Date(
    state === "upcoming"
      ? now + 3 * 86_400_000
      : state === "joining"
        ? now + 20 * 60_000
        : now - 15 * 60_000,
  );
  const endsAt = new Date(state === "replay" ? now - 5 * 60_000 : now + 75 * 60_000);
  const occurrence = {
    id: `${seriesId}:${startsAt.toISOString().slice(0, 10)}`,
    seriesId,
    localDate: startsAt.toISOString().slice(0, 10),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: state === "replay" ? "completed" : state === "live" ? "live" : "published",
    title:
      state === "live"
        ? isWednesday ? "Live Midweek Hope" : "Live Sunday Hope"
        : state === "replay"
          ? isWednesday ? "A Message to Remember" : "Sunday Grace"
          : isWednesday ? "Wisdom for Wednesday" : "Hope for Sunday",
    scripture: "James 1:5",
    description: "A practical word for everyday faith.",
    ...(state === "joining" || state === "live" ? { joinUrl: MEET_URL } : {}),
    ...(state === "replay" ? { replayUrl: REPLAY_URL } : {}),
  };

  return {
    series: [
      {
        id: seriesId,
        slug: seriesId,
        kind: service,
        name: seriesName,
        themeKey: service,
        schedule: {
          dayOfWeek: isWednesday ? 3 : 0,
          localTime: "19:00",
          timezone: "America/New_York",
          durationMinutes: 90,
        },
      },
    ],
    featured: occurrence,
    upcoming: state === "upcoming" || state === "joining" ? [occurrence] : [],
    recent: state === "replay" ? [occurrence] : [],
    generatedAt: new Date(now).toISOString(),
  };
}

async function mockGatherings(
  page: Page,
  state: "upcoming" | "joining" | "live" | "replay",
  service: "wednesday" | "sunday" = "wednesday",
) {
  await page.route("**/api/gatherings", (route) =>
    route.fulfill({ contentType: "application/json", json: gatheringPayload(state, service) }),
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
  await expect(page.getByText("Wednesday Word", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Time until gathering")).toBeVisible();
  const reminder = page.getByRole("link", { name: /remind me about wednesday/i });
  await expect(reminder).toBeVisible();
  const reminderBox = await reminder.boundingBox();
  const viewport = page.viewportSize();
  expect(reminderBox?.y).toBeGreaterThanOrEqual(0);
  expect((reminderBox?.y ?? 0) + (reminderBox?.height ?? 0)).toBeLessThanOrEqual(
    (viewport?.height ?? 0) - 16,
  );
  await expect(page.getByText("No public prayer requests have been shared yet.")).toBeVisible();
  await expect(page.getByText("Sarah M.")).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("gathering: Watch shows a live Meet action from the canonical payload", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-chrome") {
    await page.setViewportSize({ width: 320, height: 700 });
  }
  await mockGatherings(page, "live");
  await page.goto("/watch");

  await expect(page.getByRole("heading", { name: "Live Midweek Hope" })).toBeVisible();
  await expect(page.getByText("Live now", { exact: true })).toBeVisible();
  const join = page.getByRole("link", { name: /join wednesday now/i });
  await expect(join).toHaveAttribute(
    "href",
    MEET_URL,
  );
  const joinBox = await join.boundingBox();
  expect((joinBox?.y ?? 0) + (joinBox?.height ?? 0)).toBeLessThanOrEqual(
    page.viewportSize()?.height ?? 0,
  );
  await expect(page.getByText("Finding Rest in Restless Times")).toHaveCount(0);
});

test("gathering: Watch shows a real replay and no fabricated archive", async ({ page }) => {
  await mockGatherings(page, "replay");
  await page.goto("/watch");

  await expect(page.getByRole("heading", { name: "A Message to Remember" })).toBeVisible();
  await expect(page.getByText("Latest message", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /watch wednesday’s message/i })).toHaveAttribute(
    "href",
    REPLAY_URL,
  );
  await expect(
    page.getByText("No additional message recordings have been published yet."),
  ).toBeVisible();
});

test("gathering: every homepage phase stays explicit and reachable on narrow screens", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Narrow viewport matrix runs once");

  let state: "upcoming" | "joining" | "live" | "replay" = "live";
  let service: "wednesday" | "sunday" = "wednesday";
  await page.route("**/api/gatherings", (route) =>
    route.fulfill({ contentType: "application/json", json: gatheringPayload(state, service) }),
  );
  await page.route("**/api/prayers", (route) =>
    route.fulfill({ contentType: "application/json", json: { prayers: [] } }),
  );
  await page.route("**/api/testimonies", (route) =>
    route.fulfill({ contentType: "application/json", json: { testimonies: [] } }),
  );
  await page.route("**/api/daily-scripture", (route) =>
    route.fulfill({ contentType: "application/json", json: {} }),
  );

  const assertPrimaryAction = async (name: RegExp) => {
    const action = page.getByRole("link", { name });
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(52);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      (page.viewportSize()?.height ?? 0) - 16,
    );
    const fontSize = await action.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(16);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ).toBe(false);
  };

  const assertVisibleStatus = async (text: string) => {
    const status = page.getByTestId("gathering-visible-status");
    await expect(status).toHaveText(text);
    const box = await status.boundingBox();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      page.viewportSize()?.height ?? 0,
    );
  };

  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 844 });

    state = "live";
    service = "wednesday";
    await page.goto("/");
    await expect(page.getByText("Live now", { exact: true })).toBeVisible();
    await assertVisibleStatus("Live now: Wednesday Word");
    await assertPrimaryAction(/join wednesday now/i);

    state = "joining";
    await page.reload();
    await expect(page.getByText("The room is open", { exact: true })).toBeVisible();
    await assertVisibleStatus("Room open: Wednesday Word");
    await assertPrimaryAction(/join wednesday now/i);

    state = "replay";
    await page.reload();
    await expect(page.getByText("Latest message", { exact: true })).toBeVisible();
    await assertVisibleStatus("Latest: Wednesday Word");
    await assertPrimaryAction(/watch wednesday’s message/i);

    state = "upcoming";
    service = "sunday";
    await page.reload();
    await expect(page.getByText("Next: Sunday Worship")).toBeVisible();
    await assertVisibleStatus("Next: Sunday Worship");
    await assertPrimaryAction(/remind me about sunday/i);
  }
});
