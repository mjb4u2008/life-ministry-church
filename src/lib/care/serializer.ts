import type { CareRecord, CareStoreV1, PublicPrayer } from "./types";

export function serializePublicPrayer(record: CareRecord): PublicPrayer {
  return {
    id: record.id,
    name: record.isAnonymous ? "Anonymous" : record.name,
    request: record.message,
    prayerCount: record.prayerCount,
    createdAt: record.createdAt,
    isAnonymous: record.isAnonymous,
  };
}

export function serializePublicPrayers(store: CareStoreV1): PublicPrayer[] {
  return store.records
    .filter((record) =>
      record.kind === "prayer" &&
      record.visibility === "public" &&
      record.moderationStatus === "approved" &&
      record.careStatus !== "closed",
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(serializePublicPrayer);
}
