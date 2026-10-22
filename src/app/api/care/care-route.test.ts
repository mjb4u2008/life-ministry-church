import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET, PATCH } from "./route";

describe("care API authorization boundary", () => {
  it("never downgrades an unauthenticated admin read to public data", async () => {
    const response = await GET(new NextRequest("http://localhost/api/care?admin=1"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects unauthenticated care updates before reading their body", async () => {
    const response = await PATCH(new NextRequest("http://localhost/api/care", { method: "PATCH" }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects an invalid bearer token instead of returning a public response", async () => {
    const response = await GET(new NextRequest("http://localhost/api/care", {
      headers: { Authorization: "Bearer invalid-token" },
    }));
    expect(response.status).toBe(401);
  });
});
