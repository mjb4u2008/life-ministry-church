import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { DELETE, GET, PATCH, POST } from "./route";

describe("events API authorization boundary", () => {
  it("requires authentication for the full event store", async () => {
    const response = await GET(new NextRequest("http://localhost/api/events?admin=1"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("authenticates every mutation before parsing data", async () => {
    const requests = [
      POST(new NextRequest("http://localhost/api/events", { method: "POST" })),
      PATCH(new NextRequest("http://localhost/api/events", { method: "PATCH" })),
      DELETE(new NextRequest("http://localhost/api/events?id=event-1&expectedRevision=0", { method: "DELETE" })),
    ];
    for (const pending of requests) expect((await pending).status).toBe(401);
  });

  it("does not downgrade an invalid bearer token to public events", async () => {
    const response = await GET(new NextRequest("http://localhost/api/events", { headers: { Authorization: "Bearer invalid" } }));
    expect(response.status).toBe(401);
  });
});
