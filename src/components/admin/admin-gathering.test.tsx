import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  GatheringSeries,
  GatheringStoreV1,
} from "@/lib/gatherings";
import { AdminDashboard } from "./AdminDashboard";
import {
  GatheringEditor,
  formatPreviewTime,
  nextScheduledLocalDate,
} from "./GatheringEditor";

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

function store(revision = 0): GatheringStoreV1 {
  return {
    schemaVersion: 1,
    revision,
    series: [sunday, wednesday],
    occurrences: [],
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lean gathering admin", () => {
  it("computes the next local schedule date without using the browser timezone", () => {
    expect(
      nextScheduledLocalDate(
        3,
        "19:00",
        "America/New_York",
        new Date("2030-08-12T12:00:00.000Z"),
      ),
    ).toBe("2030-08-14");
    expect(
      nextScheduledLocalDate(
        3,
        "19:00",
        "America/New_York",
        new Date("2030-08-14T23:30:00.000Z"),
      ),
    ).toBe("2030-08-21");
  });

  it("formats preview timestamps in the configured ministry timezone", () => {
    expect(
      formatPreviewTime("2030-08-14T23:00:00.000Z", "America/New_York"),
    ).toContain("7:00 PM EDT");
    expect(
      formatPreviewTime("2030-08-14T23:00:00.000Z", "America/Los_Angeles"),
    ).toContain("4:00 PM PDT");
  });

  it("shows Sunday and Wednesday readiness with pinned legacy tools", async () => {
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
  });

  it("does not count a cancelled occurrence as ready", async () => {
    const cancelledStore = store();
    cancelledStore.occurrences.push({
      id: "sunday-worship:2099-08-17",
      seriesId: "sunday-worship",
      localDate: "2099-08-17",
      startsAt: "2099-08-17T15:30:00.000Z",
      endsAt: "2099-08-17T17:00:00.000Z",
      status: "cancelled",
      title: "Cancelled message",
      scripture: "Psalm 46:10",
      description: "",
      updatedAt: UPDATED_AT,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(cancelledStore)));
    render(<AdminDashboard logout={vi.fn()} token="token" />);

    expect(await screen.findAllByText("No gathering occurrence prepared yet.")).toHaveLength(2);
    expect(screen.queryByText("Cancelled message")).not.toBeInTheDocument();
  });

  it("returns to sign in when the dashboard session expires", async () => {
    const logout = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 401)));
    render(<AdminDashboard logout={logout} token="expired" />);

    await vi.waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
  });

  it("configures and publishes Wednesday with exact UTC timestamps and no banner call", async () => {
    const writes: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method) return response(store());
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      writes.push(body);
      return response(store(writes.length));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <GatheringEditor
        onUnauthorized={vi.fn()}
        seriesId="wednesday-word"
        token="token"
      />,
    );

    expect(await screen.findByRole("heading", { name: /prepare wednesday word/i })).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: /enabled/i }));
    await user.clear(screen.getByLabelText("Default Google Meet link"));
    await user.type(screen.getByLabelText("Default Google Meet link"), MEET_URL);
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2030-08-14");
    await user.type(screen.getByLabelText("Message title"), "Midweek Wisdom");
    await user.type(screen.getByLabelText("Scripture"), "James 1:5");
    await user.type(screen.getByLabelText("Description"), "Ask God for wisdom.");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Wednesday Word saved as published.")).toBeVisible();
    expect(writes).toHaveLength(2);
    expect(writes[0]).toMatchObject({ operation: "upsert-series", expectedRevision: 0 });
    expect(writes[1]).toMatchObject({
      operation: "upsert-occurrence",
      expectedRevision: 1,
      occurrence: {
        startsAt: "2030-08-14T23:00:00.000Z",
        endsAt: "2030-08-15T00:30:00.000Z",
        status: "published",
        title: "Midweek Wisdom",
      },
    });
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/sermon-banner")).toBe(false);
  });

  it("runs the protected sermon banner contract after a Sunday save", async () => {
    let revision = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/sermon-banner") {
        return response({ image: "c2VybW9u", mimeType: "image/png" });
      }
      if (!init?.method) return response(store());
      revision += 1;
      return response(store(revision));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <GatheringEditor
        onUnauthorized={vi.fn()}
        seriesId="sunday-worship"
        token="token"
      />,
    );

    await screen.findByRole("heading", { name: /prepare sunday worship/i });
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2030-08-18");
    await user.type(screen.getByLabelText("Message title"), "Grace for Today");
    await user.type(screen.getByLabelText("Scripture"), "2 Corinthians 12:9");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("button", { name: /download banner/i })).toBeVisible();
    const bannerCall = fetchMock.mock.calls.find(([url]) => url === "/api/sermon-banner");
    expect(bannerCall?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ title: "Grace for Today", scripture: "2 Corinthians 12:9" }),
    });
  });

  it("returns to sign in if the session expires during Sunday banner generation", async () => {
    let revision = 0;
    const onUnauthorized = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/sermon-banner") return response({}, 401);
      if (!init?.method) return response(store());
      revision += 1;
      return response(store(revision));
    }));
    const user = userEvent.setup();
    render(
      <GatheringEditor
        onUnauthorized={onUnauthorized}
        seriesId="sunday-worship"
        token="token"
      />,
    );

    await screen.findByRole("heading", { name: /prepare sunday worship/i });
    await user.type(screen.getByLabelText("Message title"), "Grace for Today");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledOnce());
    expect(screen.queryByText(/banner generation failed/i)).not.toBeInTheDocument();
  });

  it("surfaces revision conflicts and offers a reload", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method
        ? response({ error: "Gatherings changed since they were loaded" }, 409)
        : response(store()),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <GatheringEditor
        onUnauthorized={vi.fn()}
        seriesId="wednesday-word"
        token="token"
      />,
    );

    await screen.findByRole("heading", { name: /prepare wednesday word/i });
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(
      await screen.findByText(/someone else changed this gathering/i),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /reload latest/i })).toBeVisible();
  });

  it("saves an explicit cancelled status", async () => {
    const writes: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return response(store());
      writes.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return response(store(writes.length));
    }));
    const user = userEvent.setup();
    render(
      <GatheringEditor
        onUnauthorized={vi.fn()}
        seriesId="wednesday-word"
        token="token"
      />,
    );

    await screen.findByRole("heading", { name: /prepare wednesday word/i });
    await user.click(screen.getByRole("button", { name: /cancel gathering/i }));

    expect(await screen.findByText("Wednesday Word saved as cancelled.")).toBeVisible();
    expect(writes[1]).toMatchObject({
      operation: "upsert-occurrence",
      occurrence: { status: "cancelled" },
    });
  });

  it("returns to sign in when the editor session expires", async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 403)));
    render(
      <GatheringEditor
        onUnauthorized={onUnauthorized}
        seriesId="wednesday-word"
        token="expired"
      />,
    );

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledOnce());
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
  });
});
