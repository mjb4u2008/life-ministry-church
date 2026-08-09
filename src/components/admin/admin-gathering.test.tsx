import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  GatheringOccurrence,
  GatheringSeries,
  GatheringStoreV1,
} from "@/lib/gatherings";
import { AdminDashboard } from "./AdminDashboard";
import { GatheringEditor } from "./GatheringEditor";

const UPDATED_AT = "2030-08-01T12:00:00.000Z";
const MEET_URL = "https://meet.google.com/abc-defg-hij";

const sunday: GatheringSeries = {
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
  defaultMeetUrl: MEET_URL,
  joinWindowMinutes: 30,
  updatedAt: UPDATED_AT,
};

const wednesday: GatheringSeries = {
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
};

const preparedWednesday: GatheringOccurrence = {
  id: "wednesday-word:2030-08-14",
  seriesId: "wednesday-word",
  localDate: "2030-08-14",
  startsAt: "2030-08-14T23:00:00.000Z",
  endsAt: "2030-08-15T00:30:00.000Z",
  status: "published",
  title: "Midweek Wisdom",
  scripture: "James 1:5",
  description: "Ask God for wisdom.",
  updatedAt: UPDATED_AT,
};

function store(
  revision = 0,
  occurrences: GatheringOccurrence[] = [],
): GatheringStoreV1 {
  return {
    schemaVersion: 1,
    revision,
    series: [sunday, wednesday],
    occurrences,
    reminderDeliveries: [],
    updatedAt: UPDATED_AT,
  };
}

function response(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function renderEditor(seriesId: "sunday-worship" | "wednesday-word", onUnauthorized = vi.fn()) {
  render(
    <GatheringEditor
      onUnauthorized={onUnauthorized}
      seriesId={seriesId}
      token="token"
    />,
  );
  return onUnauthorized;
}

async function fillWednesday(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText(/^Google Meet link/i));
  await user.type(screen.getByLabelText(/^Google Meet link/i), MEET_URL);
  await user.clear(screen.getByLabelText("Date"));
  await user.type(screen.getByLabelText("Date"), "2030-08-14");
  await user.clear(screen.getByLabelText("Start time"));
  await user.type(screen.getByLabelText("Start time"), "19:00");
  await user.clear(screen.getByLabelText("End time"));
  await user.type(screen.getByLabelText("End time"), "20:30");
  await user.type(screen.getByLabelText("Message title"), "Midweek Wisdom");
  await user.type(screen.getByLabelText("Scripture"), "James 1:5");
  await user.type(screen.getByLabelText("Description"), "Ask God for wisdom.");
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("pastor-simple gathering admin", () => {
  it("shows both weekly lanes and keeps the existing ministry tools pinned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(store())));
    render(<AdminDashboard logout={vi.fn()} token="token" />);

    expect(await screen.findByText("Wednesday Word")).toBeVisible();
    expect(screen.getByText("Sunday Worship")).toBeVisible();
    expect(screen.getByRole("link", { name: /flyer generator/i })).toHaveAttribute(
      "href",
      "/admin/legacy?tab=flyer",
    );
    expect(screen.getByRole("link", { name: /daily scripture/i })).toHaveAttribute(
      "href",
      "/admin/legacy?tab=daily-scripture",
    );
    expect(screen.getByText("Pastoral care inbox")).toBeVisible();
    expect(screen.getByText("Events center")).toBeVisible();
    expect(screen.getAllByText("Needs details")).toHaveLength(2);
    expect(screen.queryByText(/of 6 ready/i)).not.toBeInTheDocument();
  });

  it("does not count a cancelled occurrence as ready", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          store(0, [
            {
              ...preparedWednesday,
              status: "cancelled",
              title: "Cancelled message",
            },
          ]),
        ),
      ),
    );
    render(<AdminDashboard logout={vi.fn()} token="token" />);

    expect(await screen.findAllByText("Nothing scheduled yet.")).toHaveLength(2);
    expect(screen.queryByText("Cancelled message")).not.toBeInTheDocument();
  });

  it("shows one low-tech form in fixed Eastern Time without technical schedule controls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(store())));
    renderEditor("sunday-worship");

    expect(await screen.findByRole("heading", { name: /prepare sunday worship/i })).toBeVisible();
    for (const label of [
      "Date",
      "Start time",
      "End time",
      "Message title",
      "Scripture",
      "Description",
    ]) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
    expect(screen.getByLabelText(/^Google Meet link/i)).toBeVisible();
    expect(screen.getByLabelText(/Replay URL/i)).toBeVisible();
    expect(screen.getAllByText(/Eastern Time/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/30 minutes before/i)).toBeVisible();

    expect(screen.queryByLabelText(/enabled/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^day$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/duration/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/join window|open join link/i)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Generate header" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Put on website" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete this gathering" })).toBeVisible();
    for (const oldAction of ["Save draft", "Publish", "Go live", "Complete", "Cancel gathering"]) {
      expect(screen.queryByRole("button", { name: oldAction })).not.toBeInTheDocument();
    }
  });

  it("does not call a disabled legacy gathering on the website", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response(store(0, [preparedWednesday]))),
    );
    renderEditor("wednesday-word");

    expect(await screen.findByText("Not on website yet")).toBeVisible();
    expect(screen.queryByText("On website")).not.toBeInTheDocument();
  });

  it("publishes Wednesday, auto-enables it, and writes fixed Eastern/30-minute settings", async () => {
    const writes: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/sermon-banner") {
        return response({ image: "must-not-run", mimeType: "image/png" });
      }
      if (!init?.method) return response(store());
      writes.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return response(store(writes.length));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEditor("wednesday-word");

    expect(await screen.findByRole("heading", { name: /prepare wednesday word/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Generate header" })).not.toBeInTheDocument();
    await fillWednesday(user);
    await user.click(screen.getByRole("button", { name: "Put on website" }));

    await vi.waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({
      operation: "publish-occurrence",
      expectedRevision: 0,
      series: {
        id: "wednesday-word",
        enabled: true,
        defaultMeetUrl: MEET_URL,
        joinWindowMinutes: 30,
        schedule: {
          dayOfWeek: 3,
          localTime: "19:00",
          timezone: "America/New_York",
          durationMinutes: 90,
        },
      },
      occurrence: {
        id: "wednesday-word:2030-08-14",
        seriesId: "wednesday-word",
        localDate: "2030-08-14",
        startsAt: "2030-08-14T23:00:00.000Z",
        endsAt: "2030-08-15T00:30:00.000Z",
        status: "published",
        title: "Midweek Wisdom",
        scripture: "James 1:5",
        description: "Ask God for wisdom.",
      },
    });
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/sermon-banner")).toBe(false);
  });

  it("generates the protected Sunday header only after an explicit click", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      void init;
      if (url === "/api/sermon-banner") {
        return response({ image: "c2VybW9u", mimeType: "image/png" });
      }
      return response(store());
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEditor("sunday-worship");

    await screen.findByRole("heading", { name: /prepare sunday worship/i });
    expect(screen.getByRole("button", { name: "Generate header" })).toBeDisabled();
    await user.type(screen.getByLabelText("Message title"), "Grace for Today");
    await user.type(screen.getByLabelText("Scripture"), "2 Corinthians 12:9");
    expect(screen.getByRole("button", { name: "Generate header" })).toBeEnabled();
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/sermon-banner")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Generate header" }));

    expect(await screen.findByRole("button", { name: /download (?:header|banner)/i })).toBeVisible();
    const bannerCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/sermon-banner");
    expect(bannerCalls).toHaveLength(1);
    expect(bannerCalls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        title: "Grace for Today",
        scripture: "2 Corinthians 12:9",
      }),
    });
  });

  it("does not generate a Sunday header as a side effect of publishing", async () => {
    const writes: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/sermon-banner") {
        return response({ image: "must-not-run", mimeType: "image/png" });
      }
      if (!init?.method) return response(store());
      writes.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return response(store(writes.length));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEditor("sunday-worship");

    await screen.findByRole("heading", { name: /prepare sunday worship/i });
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2030-08-18");
    await user.type(screen.getByLabelText("Message title"), "Grace for Today");
    await user.click(screen.getByRole("button", { name: "Put on website" }));

    await vi.waitFor(() => expect(writes).toHaveLength(1));
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/sermon-banner")).toBe(false);
  });

  it("requires a valid local time range before it writes anything", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method ? response(store(1)) : response(store()),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEditor("wednesday-word");

    await screen.findByRole("heading", { name: /prepare wednesday word/i });
    await user.type(screen.getByLabelText("Message title"), "Midweek Wisdom");
    await user.type(screen.getByLabelText(/^Google Meet link/i), MEET_URL);
    await user.clear(screen.getByLabelText("End time"));
    await user.type(screen.getByLabelText("End time"), "18:00");
    await user.click(screen.getByRole("button", { name: "Put on website" }));

    expect(await screen.findByText(/valid date, start time, and end time/i)).toBeVisible();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(0);
  });

  it("does not publish a gathering whose end time is already past", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method ? response(store(1)) : response(store()),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderEditor("wednesday-word");

    await screen.findByRole("heading", { name: /prepare wednesday word/i });
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2020-08-12");
    await user.type(screen.getByLabelText("Message title"), "Past message");
    await user.type(screen.getByLabelText(/^Google Meet link/i), MEET_URL);
    await user.click(screen.getByRole("button", { name: "Put on website" }));

    expect(await screen.findByText(/has not already ended/i)).toBeVisible();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(0);
  });

  it("deletes only the selected dated occurrence after confirmation", async () => {
    const writes: Array<Record<string, unknown>> = [];
    vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return response(store(4, [preparedWednesday]));
      writes.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return response(store(5));
    }));
    const user = userEvent.setup();
    renderEditor("wednesday-word");

    await screen.findByDisplayValue("Midweek Wisdom");
    await user.click(screen.getByRole("button", { name: "Delete this gathering" }));
    expect(writes).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Delete this gathering" }));

    await vi.waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toEqual({
      operation: "delete-occurrence",
      expectedRevision: 4,
      occurrenceId: "wednesday-word:2030-08-14",
    });
  });

  it("surfaces revision conflicts with a recoverable reload action", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method
        ? response({ error: "Gatherings changed since they were loaded" }, 409)
        : response(store()),
    ));
    const user = userEvent.setup();
    renderEditor("wednesday-word");

    await screen.findByRole("heading", { name: /prepare wednesday word/i });
    await user.type(screen.getByLabelText("Message title"), "Midweek Wisdom");
    await user.type(screen.getByLabelText(/^Google Meet link/i), MEET_URL);
    await user.click(screen.getByRole("button", { name: "Put on website" }));

    expect(await screen.findByText(/someone else changed this gathering/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /reload latest/i })).toBeVisible();
  });

  it("shows generator failures and lets the pastor try again", async () => {
    let generationAttempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/api/sermon-banner") {
        generationAttempts += 1;
        return generationAttempts === 1
          ? response({ error: "Image service unavailable" }, 503)
          : response({ image: "c2VybW9u", mimeType: "image/png" });
      }
      return response(store());
    }));
    const user = userEvent.setup();
    renderEditor("sunday-worship");

    await screen.findByRole("heading", { name: /prepare sunday worship/i });
    await user.type(screen.getByLabelText("Message title"), "Grace for Today");
    await user.click(screen.getByRole("button", { name: "Generate header" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Image service unavailable",
    );

    await user.click(screen.getByRole("button", { name: "Generate header" }));
    expect(await screen.findByRole("button", { name: /download (?:header|banner)/i })).toBeVisible();
  });

  it("returns to sign in if the session expires during header generation", async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url === "/api/sermon-banner" ? response({}, 401) : response(store()),
    ));
    const user = userEvent.setup();
    renderEditor("sunday-worship", onUnauthorized);

    await screen.findByRole("heading", { name: /prepare sunday worship/i });
    await user.type(screen.getByLabelText("Message title"), "Grace for Today");
    await user.click(screen.getByRole("button", { name: "Generate header" }));

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledOnce());
    expect(screen.queryByText(/header generation failed/i)).not.toBeInTheDocument();
  });

  it("returns to sign in when the dashboard or editor session expires", async () => {
    const dashboardLogout = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 401)));
    render(<AdminDashboard logout={dashboardLogout} token="expired" />);
    await vi.waitFor(() => expect(dashboardLogout).toHaveBeenCalledOnce());
    cleanup();

    const editorLogout = vi.fn();
    renderEditor("wednesday-word", editorLogout);
    await vi.waitFor(() => expect(editorLogout).toHaveBeenCalledOnce());
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
  });
});
