import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TikTokCarousel } from "./TikTokCarousel";

const video = { id: "configured-post", url: "https://www.tiktok.com/@actual.creator/video/7123456789012345678", title: "A word of hope" };
let observers: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; target?: Element }[];

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", class {
    entry: typeof observers[number];
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) { this.entry = { callback, options }; observers.push(this.entry); }
    observe(target: Element) { this.entry.target = target; }
    disconnect() {}
  });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

function intersect(isIntersecting: boolean, visibleOnly = false) {
  act(() => {
    observers.filter((observer) => !visibleOnly || !observer.options?.rootMargin).forEach((observer) => observer.callback([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0, target: observer.target! } as IntersectionObserverEntry], {} as IntersectionObserver));
  });
}

function message(iframe: HTMLIFrameElement, type: string, value?: unknown, origin = "https://www.tiktok.com") {
  act(() => { window.dispatchEvent(new MessageEvent("message", { origin, source: iframe.contentWindow, data: { "x-tiktok-player": true, type, value } })); });
}

describe("TikTok video rail", () => {
  it("shows an honest empty state with only a configured profile link", () => {
    render(<TikTokCarousel videos={[]} tiktokProfileUrl="https://www.tiktok.com/@actual.creator" />);
    expect(screen.getByText(/videos will appear here when/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /visit pastor mike on tiktok/i })).toHaveAttribute("href", "https://www.tiktok.com/@actual.creator");
    expect(screen.queryByText("@pastormike")).not.toBeInTheDocument();
  });

  it("lets the homepage supply its own heading without duplicating the section introduction", () => {
    render(<TikTokCarousel embedded videos={[]} tiktokProfileUrl="https://www.tiktok.com/@actual.creator" />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Messages from Pastor Mike" })).toBeVisible();
    expect(screen.getByRole("link", { name: /visit pastor mike on tiktok/i })).toBeVisible();
  });

  it("loads the official muted player only near the viewport and pauses it when out of view", () => {
    render(<TikTokCarousel videos={[video]} />);
    expect(screen.queryByTitle(video.title)).not.toBeInTheDocument();
    intersect(true);
    const iframe = screen.getByTitle(video.title) as HTMLIFrameElement;
    expect(iframe.src).toContain("https://www.tiktok.com/player/v1/7123456789012345678?");
    expect(iframe.src).toContain("muted=1");
    expect(iframe.src).toContain("loop=1");
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");
    message(iframe, "onPlayerReady");
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "play", "x-tiktok-player": true }), "https://www.tiktok.com");
    intersect(false, true);
    expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: "pause" }), "https://www.tiktok.com");
    expect(screen.getByRole("link", { name: /open this video on tiktok/i })).toHaveAttribute("href", video.url);
  });

  it("keeps reduced-motion playback manual", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    render(<TikTokCarousel videos={[video]} />);
    intersect(true);
    expect(screen.queryByTitle(video.title)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /play video/i }));
    expect((screen.getByTitle(video.title) as HTMLIFrameElement).src).toContain("autoplay=0");
  });

  it("reflects a pause inside the provider player and can resume it", () => {
    render(<TikTokCarousel videos={[video]} />);
    intersect(true);
    const iframe = screen.getByTitle(video.title) as HTMLIFrameElement;
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");
    message(iframe, "onPlayerReady");
    message(iframe, "onStateChange", 2);
    fireEvent.click(screen.getByRole("button", { name: /play video/i }));
    expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: "play" }), "https://www.tiktok.com");
    expect(screen.getByRole("button", { name: /pause video/i })).toBeVisible();
  });

  it("keeps data-saving playback manual", () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "connection");
    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    render(<TikTokCarousel videos={[video]} />);
    intersect(true);
    expect(screen.queryByTitle(video.title)).not.toBeInTheDocument();
    cleanup();
    if (descriptor) Object.defineProperty(navigator, "connection", descriptor);
    else Reflect.deleteProperty(navigator, "connection");
  });

  it("ignores messages from other origins and shows real provider errors", () => {
    render(<TikTokCarousel videos={[video]} />);
    intersect(true);
    const iframe = screen.getByTitle(video.title) as HTMLIFrameElement;
    message(iframe, "onPlayerError", { errorCode: 1001 }, "https://evil.example");
    expect(screen.queryByText(/can.t play this video here/i)).not.toBeInTheDocument();
    message(iframe, "onPlayerError", { errorCode: 1001 });
    expect(screen.getByText(/can.t play this video here/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /open this video on tiktok/i })).toHaveAttribute("href", video.url);
  });

  it("offers a real permalink when a blocked player never becomes ready", () => {
    vi.useFakeTimers();
    render(<TikTokCarousel videos={[video]} />);
    intersect(true);
    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.getByText(/can.t play this video here/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /try player again/i })).toBeVisible();
  });

  it("never embeds or links to a lookalike host", () => {
    render(<TikTokCarousel videos={[{ ...video, url: "https://www.tiktok.com.evil.example/@mike/video/123" }]} tiktokProfileUrl="javascript:alert(1)" />);
    intersect(true);
    expect(screen.queryByTitle(video.title)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/video link isn.t available/i)).toBeVisible();
  });
});
