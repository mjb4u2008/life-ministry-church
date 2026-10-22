import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoEditor } from "./VideoEditor";

const video = { id: "7683384185838374174", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7683384185838374174", title: "Jesus, the head of our life" };
const added = { id: "7636588562930044190", url: "https://www.tiktok.com/@l.i.f.e.ministry/video/7636588562930044190", title: "" };
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("homepage video editor", () => {
  it("loads authenticated effective videos and saves only the edited video list", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ revision: 0, tiktokVideos: [video], contactEmail: "preserve@example.com" })).mockResolvedValueOnce(response({ revision: 1, tiktokVideos: [video, added] }));
    vi.stubGlobal("fetch", fetch);
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    expect(await screen.findByDisplayValue(video.title)).toBeVisible();
    expect(fetch).toHaveBeenCalledWith("/api/content?admin=1", expect.objectContaining({ headers: { Authorization: "Bearer admin-token" }, cache: "no-store" }));
    expect(screen.getByRole("button", { name: "Save videos" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("TikTok video link"), { target: { value: `${added.url}?is_from_webapp=1` } });
    fireEvent.click(screen.getByRole("button", { name: "Add to list" }));
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Videos saved");
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer admin-token", "If-Match": "0" }, body: JSON.stringify({ tiktokVideos: [video, added] }) });
  });

  it("blocks edits when saved content cannot be loaded and supports retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({ error: "unavailable" }, 503)).mockResolvedValueOnce(response({ revision: 0, tiktokVideos: [video] })));
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/saved videos couldn.t be loaded/i);
    expect(screen.queryByRole("button", { name: "Save videos" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("TikTok video link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try loading videos again" }));
    expect(await screen.findByDisplayValue(video.title)).toBeVisible();
  });

  it("rejects lookalike hosts and duplicate TikTok posts", async () => {
    const fetch = vi.fn().mockResolvedValue(response({ revision: 0, tiktokVideos: [video] }));
    vi.stubGlobal("fetch", fetch);
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    await screen.findByDisplayValue(video.title);
    const input = screen.getByLabelText("TikTok video link");
    fireEvent.change(input, { target: { value: "https://www.tiktok.com.evil.example/@name/video/123" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to list" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/full TikTok video link/);
    fireEvent.change(input, { target: { value: `${video.url}?lang=en` } });
    fireEvent.click(screen.getByRole("button", { name: "Add to list" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/already in the list/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("confirms removal and preserves an intentionally empty saved list", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const fetch = vi.fn().mockResolvedValueOnce(response({ revision: 0, tiktokVideos: [video] })).mockResolvedValueOnce(response({ revision: 1, tiktokVideos: [] }));
    vi.stubGlobal("fetch", fetch);
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    await screen.findByDisplayValue(video.title);
    fireEvent.click(screen.getByRole("button", { name: "Remove video 1" }));
    expect(screen.getByDisplayValue(video.title)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove video 1" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(screen.queryByDisplayValue(video.title)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(await screen.findByRole("status")).toHaveTextContent("homepage video list is now empty");
    expect(fetch.mock.calls[1][1].body).toBe(JSON.stringify({ tiktokVideos: [] }));
  });

  it("keeps changes after a failed save and does not claim success", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ revision: 0, tiktokVideos: [video] })).mockResolvedValueOnce(response({ error: "unavailable" }, 500)).mockResolvedValueOnce(response({ revision: 1, tiktokVideos: [{ ...video, title: "New title" }] }));
    vi.stubGlobal("fetch", fetch);
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    fireEvent.change(await screen.findByDisplayValue(video.title), { target: { value: "New title" } });
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/changes weren.t confirmed/);
    expect(screen.getByDisplayValue("New title")).toBeVisible();
    expect(screen.queryByText(/homepage now uses this list/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Videos saved/);
  });

  it("logs out when the authenticated load is rejected", async () => {
    const logout = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ error: "Unauthorized" }, 401)));
    render(<VideoEditor token="expired-token" logout={logout} />);
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(screen.queryByLabelText("TikTok video link")).not.toBeInTheDocument();
  });

  it("preserves stale drafts on conflict and requires confirmed reload before saving the latest revision", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({ revision: 0, tiktokVideos: [video] }))
      .mockResolvedValueOnce(response({ error: "Content changed" }, 409))
      .mockResolvedValueOnce(response({ revision: 1, tiktokVideos: [video, added] }))
      .mockResolvedValueOnce(response({ revision: 2, tiktokVideos: [{ ...video, title: "Reviewed latest edit" }, added] }));
    vi.stubGlobal("fetch", fetch);
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    fireEvent.change(await screen.findByDisplayValue(video.title), { target: { value: "My stale draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/saved in another tab/);
    expect(screen.getByDisplayValue("My stale draft")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save videos" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(fetch).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Reload saved videos" }));
    expect(screen.getByDisplayValue("My stale draft")).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Reload saved videos" }));
    const latest = await screen.findByDisplayValue(video.title);
    expect(screen.getByRole("button", { name: "Remove video 2" })).toBeVisible();
    fireEvent.change(latest, { target: { value: "Reviewed latest edit" } });
    fireEvent.click(screen.getByRole("button", { name: "Save videos" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Videos saved/);
    expect(fetch.mock.calls[1][1].headers["If-Match"]).toBe("0");
    expect(fetch.mock.calls[3][1].headers["If-Match"]).toBe("1");
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual({ tiktokVideos: [{ ...video, title: "Reviewed latest edit" }, added] });
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("blocks an unversioned load instead of allowing an unguarded save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ tiktokVideos: [video] })));
    render(<VideoEditor token="admin-token" logout={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/saved videos couldn.t be loaded/);
    expect(screen.queryByRole("button", { name: "Save videos" })).not.toBeInTheDocument();
  });
});
