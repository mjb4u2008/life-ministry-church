import type { CareRecord, CareStoreV1 } from "./types";

interface LegacyPrayer {
  id?: unknown;
  name?: unknown;
  request?: unknown;
  prayerCount?: unknown;
  createdAt?: unknown;
  isAnonymous?: unknown;
}

export function normalizeLegacyCare(value: unknown, now = new Date()): CareStoreV1 {
  const legacy = Array.isArray(value) ? value as LegacyPrayer[] : [];
  const records: CareRecord[] = legacy.flatMap((prayer, index) => {
    if (typeof prayer.request !== "string" || !prayer.request.trim()) return [];
    const createdAt = typeof prayer.createdAt === "string" && !Number.isNaN(Date.parse(prayer.createdAt))
      ? prayer.createdAt
      : now.toISOString();
    const isAnonymous = prayer.isAnonymous === true;
    return [{
      id: typeof prayer.id === "string" ? prayer.id : `legacy-prayer-${index}`,
      kind: "prayer" as const,
      name: isAnonymous ? "Anonymous" : typeof prayer.name === "string" ? prayer.name.slice(0, 120) : "Anonymous",
      isAnonymous,
      message: prayer.request.trim().slice(0, 4000),
      visibility: "private" as const,
      moderationStatus: "pending" as const,
      careStatus: "new" as const,
      urgency: "normal" as const,
      contactPermission: false,
      source: "legacy-prayer" as const,
      prayerCount: Number.isInteger(prayer.prayerCount) && Number(prayer.prayerCount) >= 0 ? Number(prayer.prayerCount) : 0,
      createdAt,
      updatedAt: createdAt,
    }];
  });
  return { schemaVersion: 1, revision: 0, records, updatedAt: now.toISOString() };
}
