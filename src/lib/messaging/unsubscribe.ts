import crypto from "crypto";
import { getAdminPassword } from "@/lib/auth";

const context = "life-ministry-unsubscribe:v1:";

function signature(encodedId: string) {
  return crypto.createHmac("sha256", getAdminPassword()).update(`${context}${encodedId}`).digest("base64url");
}

export function createUnsubscribeToken(subscriberId: string) {
  const encodedId = Buffer.from(subscriberId, "utf8").toString("base64url");
  return `${encodedId}.${signature(encodedId)}`;
}

export function verifyUnsubscribeToken(token: unknown) {
  if (typeof token !== "string" || token.length > 300) return null;
  const [encodedId, provided, extra] = token.split(".");
  if (!encodedId || !provided || extra) return null;
  const expected = signature(encodedId);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return null;
  try {
    const id = Buffer.from(encodedId, "base64url").toString("utf8");
    return id && id.length <= 100 ? id : null;
  } catch { return null; }
}

export function unsubscribeUrl(origin: string, subscriberId: string) {
  const url = new URL("/unsubscribe", origin);
  url.searchParams.set("token", createUnsubscribeToken(subscriberId));
  return url.toString();
}
