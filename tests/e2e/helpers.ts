export function futureAdminToken(label: string) {
  return Buffer.from(`${Date.now()}:${label}:${"a".repeat(64)}`).toString("base64");
}
