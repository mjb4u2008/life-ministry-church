// Simple password-based authentication for admin
// Uses environment variable ADMIN_PASSWORD, defaults to "LIFE2024" for local dev

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "LIFE2024";
}

export function verifyPassword(password: string): boolean {
  return password === getAdminPassword();
}

// Simple token generation (in production, use proper JWT)
export function generateToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${timestamp}:${random}:${getAdminPassword()}`).toString("base64");
}

export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [timestamp, , password] = parts;
    const tokenAge = Date.now() - parseInt(timestamp);

    // Token expires after 24 hours
    if (tokenAge > 24 * 60 * 60 * 1000) return false;

    return password === getAdminPassword();
  } catch {
    return false;
  }
}
