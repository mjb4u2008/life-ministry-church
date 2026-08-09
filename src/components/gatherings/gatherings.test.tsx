import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PublicGatheringOccurrence,
  PublicGatheringsResponse,
} from "@/lib/gatherings";
import { GatheringExperience } from "./GatheringExperience";
import { formatGatheringDate } from "./GatheringCard";
import { GatheringHero, getGatheringPhase } from "./GatheringHero";
import { GATHERINGS_REQUEST_TIMEOUT_MS } from "./useGatherings";

const upcoming: PublicGatheringOccurrence = {
  id: "wednesday-word:2030-08-14",
  seriesId: "wednesday-word",
  localDate: "2030-08-14",
  startsAt: "2030-08-14T23:00:00.000Z",
  endsAt: "2030-08-15T00:30:00.000Z",
  status: "published",
  title: "Wisdom for the Week",
  scripture: "James 1:5",
  description: "A midweek message for everyday faith.",
};

const payload: PublicGatheringsResponse = {
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
  featured: upcoming,
  upcoming: [upcoming],
  recent: [],
  generatedAt: "2030-08-10T12:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("gathering public components", () => {
  it("always formats gathering times in the ministry's Eastern timezone", () => {
    expect(formatGatheringDate("2030-08-14T23:00:00.000Z")).toContain(
      "7:00 PM EDT",
    );
  });

  it("derives upcoming, live, and replay phases deterministically", () => {
    expect(getGatheringPhase(upcoming, new Date("2030-08-10T12:00:00.000Z"))).toBe(
      "upcoming",
    );
    expect(
      getGatheringPhase(
        { ...upcoming, joinUrl: "https://meet.google.com/abc-defg-hij" },
        new Date("2030-08-14T22:45:00.000Z"),
      ),
    ).toBe("joining");
    expect(
      getGatheringPhase(upcoming, new Date("2030-08-14T23:15:00.000Z")),
    ).toBe("live");
    expect(
      getGatheringPhase(
        { ...upcoming, status: "completed", replayUrl: "https://youtube.com/watch?v=abc" },
        new Date("2030-08-15T02:00:00.000Z"),
      ),
    ).toBe("replay");
  });

  it("renders the canonical title and reminder action for an upcoming gathering", () => {
    render(
      <GatheringHero
        now={new Date("2030-08-10T12:00:00.000Z")}
        occurrence={upcoming}
        series={payload.series[0]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Wisdom for the Week" })).toBeVisible();
    expect(screen.getByText("Wednesday Word")).toBeVisible();
    expect(screen.getByRole("link", { name: /remind me about wednesday/i })).toHaveAttribute(
      "href",
      "/watch#reminded",
    );
    expect(screen.getByLabelText("Time until gathering")).toBeVisible();
  });

  it("renders join and replay actions only when supplied by the public API", () => {
    const { rerender } = render(
      <GatheringHero
        now={new Date("2030-08-14T22:45:00.000Z")}
        occurrence={{ ...upcoming, joinUrl: "https://meet.google.com/abc-defg-hij" }}
        series={payload.series[0]}
      />,
    );
    expect(screen.getByRole("link", { name: /join wednesday now/i })).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );

    rerender(
      <GatheringHero
        now={new Date("2030-08-15T02:00:00.000Z")}
        occurrence={{
          ...upcoming,
          status: "completed",
          replayUrl: "https://youtube.com/watch?v=abc",
        }}
        series={payload.series[0]}
      />,
    );
    expect(screen.getByRole("link", { name: /watch wednesday’s message/i })).toHaveAttribute(
      "href",
      "https://youtube.com/watch?v=abc",
    );
  });

  it("loads the canonical GET response and shows a truthful empty recording state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => payload }),
    );
    render(<GatheringExperience mode="watch" />);

    expect(await screen.findByText("Wisdom for the Week")).toBeVisible();
    expect(screen.getByText("No message recordings have been published yet.")).toBeVisible();
    expect(fetch).toHaveBeenCalledWith(
      "/api/gatherings",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("does not call a featured replay an empty archive", async () => {
    const featuredReplay = {
      ...upcoming,
      status: "completed" as const,
      replayUrl: "https://youtube.com/watch?v=abc",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...payload,
          featured: featuredReplay,
          upcoming: [],
          recent: [featuredReplay],
        }),
      }),
    );
    render(<GatheringExperience mode="watch" />);

    expect(
      await screen.findByText("No additional message recordings have been published yet."),
    ).toBeVisible();
    expect(screen.queryByText("No message recordings have been published yet.")).not.toBeInTheDocument();
  });

  it("shows honest empty and error states", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...payload, featured: null, upcoming: [] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<GatheringExperience mode="home" />);
    expect(await screen.findByText("The next gathering is being prepared")).toBeVisible();

    cleanup();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    render(<GatheringExperience mode="home" />);
    expect(await screen.findByText("Schedule temporarily unavailable")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("recovers from a gathering request that never responds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, options?: RequestInit) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      ),
    );

    render(<GatheringExperience mode="home" />);
    expect(screen.getByText("Loading the next gathering…")).toBeVisible();
    expect(screen.getByRole("link", { name: "Get help joining" })).toHaveAttribute(
      "href",
      "/welcome",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GATHERINGS_REQUEST_TIMEOUT_MS);
    });

    expect(screen.getByText("Schedule temporarily unavailable")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn’t load the gathering schedule right now.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Get help joining" })).toHaveAttribute(
      "href",
      "/welcome",
    );
  });
});
