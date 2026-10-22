import { describe, expect, it } from "vitest";
import { ADMIN_TOKEN_LIFETIME_MS, adminTokenExpiresAt } from "./admin-token-client";

describe("client admin token expiry", () => {
  it("derives the same 24-hour deadline as the server and rejects malformed tokens", () => {
    const issuedAt = 1_900_000_000_000;
    const token = window.btoa(`${issuedAt}:random:${"a".repeat(64)}`);
    expect(adminTokenExpiresAt(token)).toBe(issuedAt + ADMIN_TOKEN_LIFETIME_MS);
    expect(adminTokenExpiresAt("not-base64!")).toBeNull();
  });
});
