import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventCenter } from "./EventCenter";

const event = { id: "event", title: "Original title", description: "Original description", startsAt: "2030-08-14T23:00:00.000Z", endsAt: "2030-08-15T00:00:00.000Z", timezone: "America/New_York", status: "draft", locationType: "online", locationLabel: "Online", meetUrl: "https://meet.google.com/abc-defg-hij", registrationUrl: "", createdAt: "2030-08-01T12:00:00.000Z", updatedAt: "2030-08-01T12:00:00.000Z" };
const store = (revision: number, events = [event]) => ({ schemaVersion: 1, revision, events, updatedAt: event.updatedAt });
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("event conflict recovery", () => {
  it("replaces stale selected fields with the latest event before resaving", async () => {
    const newer = { ...event, title: "Other administrator title", description: "Newer description", startsAt: "2030-08-15T22:00:00.000Z", endsAt: "2030-08-15T23:00:00.000Z" };
    const fetch = vi.fn().mockResolvedValueOnce(response(store(1))).mockResolvedValueOnce(response({ error: "Events changed" }, 409)).mockResolvedValueOnce(response(store(2, [newer]))).mockResolvedValueOnce(response({ store: store(3, [newer]), event: newer }));
    vi.stubGlobal("fetch", fetch);
    render(<EventCenter logout={vi.fn()} token="test" />);
    fireEvent.click(await screen.findByRole("button", { name: /original title/i }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Stale local edit" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reload latest" }));
    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue(newer.title));
    expect(screen.getByLabelText("Description")).toHaveValue(newer.description);
    expect(screen.getByLabelText("Start date")).toHaveValue("2030-08-15");
    expect(screen.getByLabelText("Start time")).toHaveValue("18:00");
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toMatchObject({ expectedRevision: 2, event: { title: newer.title, description: newer.description, startsAt: newer.startsAt } });
  });

  it("clears a selected event removed by another administrator", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response(store(1))).mockResolvedValueOnce(response({ error: "conflict" }, 409)).mockResolvedValueOnce(response(store(2, []))));
    render(<EventCenter logout={vi.fn()} token="test" />);
    fireEvent.click(await screen.findByRole("button", { name: /original title/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reload latest" }));
    expect(await screen.findByText(/was deleted by another administrator/i)).toBeVisible();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Create event" })).toBeVisible();
  });
});
