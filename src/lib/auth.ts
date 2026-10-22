import crypto from "crypto";

const DEVELOPMENT_SECRET = "LIFE2024";

function configuredSecret(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : DEVELOPMENT_SECRET;
}

export function getAdminPassword(): string {
  const secret = configuredSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD is required in production");
  return secret;
}

export function verifyPassword(password: string): boolean {
  const secretValue = configuredSecret();
  if (!secretValue) return false;
  // Constant-time comparison to prevent timing attacks
  const pwd = Buffer.from(password);
  const secret = Buffer.from(secretValue);
  if (pwd.length !== secret.length) return false;
  return crypto.timingSafeEqual(pwd, secret);
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
    const secret = configuredSecret();
    if (!secret) return false;
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [timestamp, random, providedHmac] = parts;
    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp)) return false;
    const tokenAge = Date.now() - parsedTimestamp;

    // Token expires after 24 hours
    if (tokenAge < 0 || tokenAge > 24 * 60 * 60 * 1000) return false;

    // Recompute HMAC and compare
    const expectedHmac = crypto.createHmac("sha256", secret)
      .update(`${timestamp}:${random}`)
      .digest("hex");

    if (!/^[a-f\d]{64}$/i.test(providedHmac)) return false;

    return crypto.timingSafeEqual(
      Buffer.from(providedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}
