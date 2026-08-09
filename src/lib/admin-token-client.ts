export const ADMIN_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function adminTokenExpiresAt(token: string) {
  try {
    const decoded = window.atob(token);
    const [timestamp] = decoded.split(":");
    const issuedAt = Number(timestamp);
    if (!Number.isFinite(issuedAt) || issuedAt < 0) return null;
    return issuedAt + ADMIN_TOKEN_LIFETIME_MS;
  } catch { return null; }
}
