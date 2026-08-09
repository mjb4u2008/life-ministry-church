import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET, PUT } from "./route";

describe("giving API authorization boundary", () => {
  it("requires authentication for full giving settings", async () => {
    const response = await GET(new NextRequest("http://localhost/api/giving?admin=1"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("authenticates updates before parsing a body", async () => {
    const response = await PUT(new NextRequest("http://localhost/api/giving", { method: "PUT" }));
    expect(response.status).toBe(401);
  });

  it("does not downgrade an invalid bearer token to public settings", async () => {
    const response = await GET(new NextRequest("http://localhost/api/giving", { headers: { Authorization: "Bearer invalid" } }));
    expect(response.status).toBe(401);
  });
});
