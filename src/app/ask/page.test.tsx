import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AskPage from "./page";

const answer = {
  scripture: { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  story: "You can bring your uncertainty to God, one day at a time.",
  exploreMore: [{ reference: "Matthew 6:34", description: "Take today as it comes." }],
};

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Ask the Word", () => {
  it("preserves the question after a failed request and retries the same text", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce({ ok: true, json: async () => answer });
    vi.stubGlobal("fetch", fetchMock);
    render(<AskPage />);
    const input = screen.getByRole("textbox", { name: /what.s on your heart/i });
    fireEvent.change(input, { target: { value: "I am worried about tomorrow." } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(input).toHaveValue("I am worried about tomorrow.");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Psalm 46:10")).toBeVisible();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/ask", expect.objectContaining({ body: JSON.stringify({ message: "I am worried about tomorrow." }) }));
  });

  it("rejects malformed successful responses without losing the question", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...answer, exploreMore: [{ reference: 42 }] }) }));
    render(<AskPage />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Where can I find hope?" } });
    fireEvent.click(screen.getByRole("button", { name: /seek scripture/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(screen.getByRole("textbox")).toHaveValue("Where can I find hope?");
    expect(screen.queryByText("Psalm 46:10")).not.toBeInTheDocument();
  });

  it("allows ordinary multiline input and announces loading", async () => {
    let resolveRequest!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => { resolveRequest = resolve; })));
    render(<AskPage />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Help me find peace" } });
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(true);
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByRole("status")).toHaveTextContent(/seeking scripture/i);
    expect(screen.getByRole("button", { name: /seeking scripture/i })).toBeDisabled();
    await act(async () => { resolveRequest({ ok: true, json: async () => answer }); });
    expect(await screen.findByRole("heading", { name: /scripture for you/i })).toHaveFocus();
  });

  it("recovers from a stalled request while retaining the question", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    render(<AskPage />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Help me find hope." } });
    fireEvent.click(screen.getByRole("button", { name: /seek scripture/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(screen.getByRole("alert")).toHaveTextContent(/try again/i);
    expect(screen.getByRole("textbox")).toHaveValue("Help me find hope.");
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  it("reports a failed share honestly and allows retry", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => answer }).mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<AskPage />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I need peace." } });
    fireEvent.click(screen.getByRole("button", { name: /seek scripture/i }));
    await screen.findByText("Psalm 46:10");
    fireEvent.click(screen.getByRole("button", { name: /share this topic/i }));
    fireEvent.click(screen.getByRole("button", { name: /share anonymously/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/wasn.t shared/i);
    expect(screen.queryByText(/thank you for sharing/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /share anonymously/i }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/thank you for sharing/i));
  });
});
