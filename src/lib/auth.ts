import crypto from "crypto";

const SECRET = process.env.ADMIN_PASSWORD;

export function getAdminPassword(): string {
  if (!SECRET) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  return SECRET;
}

export function verifyPassword(password: string): boolean {
  if (!SECRET) return false;
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(SECRET)
  );
}

export function generateToken(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(32).toString("hex");
  const payload = `${timestamp}:${random}`;
  const hmac = crypto.createHmac("sha256", getAdminPassword())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64");
}

export function verifyToken(token: string): boolean {
  try {
    if (!SECRET) return false;
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [timestamp, random, providedHmac] = parts;
    const tokenAge = Date.now() - parseInt(timestamp);

    // Token expires after 24 hours
    if (tokenAge > 24 * 60 * 60 * 1000) return false;
    if (isNaN(parseInt(timestamp))) return false;

    // Recompute HMAC and compare
    const expectedHmac = crypto.createHmac("sha256", getAdminPassword())
      .update(`${timestamp}:${random}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(providedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}
