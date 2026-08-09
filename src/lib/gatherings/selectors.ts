import type {
  GatheringOccurrence,
  GatheringSeries,
  GatheringStoreV1,
  PublicGatheringOccurrence,
  PublicGatheringsResponse,
} from "./types";

const PUBLIC_STATUSES = new Set(["published", "live", "completed"]);

function byStartAscending(a: GatheringOccurrence, b: GatheringOccurrence): number {
  return Date.parse(a.startsAt) - Date.parse(b.startsAt);
}

export function selectFeaturedOccurrence(
  store: GatheringStoreV1,
  now = new Date(),
): GatheringOccurrence | null {
  const nowMs = now.getTime();
  const visible = store.occurrences.filter((occurrence) =>
    PUBLIC_STATUSES.has(occurrence.status),
  );
  const active = visible
    .filter(
      (occurrence) =>
        occurrence.status !== "completed" &&
        Date.parse(occurrence.startsAt) <= nowMs &&
        Date.parse(occurrence.endsAt) > nowMs,
    )
    .sort(byStartAscending)[0];
  if (active) return active;

  const upcoming = visible
    .filter(
      (occurrence) =>
        occurrence.status !== "completed" && Date.parse(occurrence.startsAt) > nowMs,
    )
    .sort(byStartAscending)[0];
  if (upcoming) return upcoming;

  return (
    visible
      .filter(
        (occurrence) =>
          occurrence.status === "completed" && Boolean(occurrence.replayUrl),
      )
      .sort((a, b) => byStartAscending(b, a))[0] ?? null
  );
}

function publicOccurrence(
  occurrence: GatheringOccurrence,
  series: GatheringSeries,
  now: Date,
): PublicGatheringOccurrence {
  const joinOpensAt =
    Date.parse(occurrence.startsAt) - series.joinWindowMinutes * 60_000;
  const joinClosesAt = Date.parse(occurrence.endsAt);
  const mayJoin =
    occurrence.status !== "completed" &&
    now.getTime() >= joinOpensAt &&
    now.getTime() < joinClosesAt;
  const storedJoinUrl = occurrence.meetUrlOverride || series.defaultMeetUrl;

  return {
    id: occurrence.id,
    seriesId: occurrence.seriesId,
    localDate: occurrence.localDate,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    status: occurrence.status as PublicGatheringOccurrence["status"],
    title: occurrence.title,
    scripture: occurrence.scripture,
    description: occurrence.description,
    ...(occurrence.replayUrl ? { replayUrl: occurrence.replayUrl } : {}),
    ...(occurrence.bannerUrl ? { bannerUrl: occurrence.bannerUrl } : {}),
    ...(mayJoin && storedJoinUrl ? { joinUrl: storedJoinUrl } : {}),
  };
}

export function serializePublicGatherings(
  store: GatheringStoreV1,
  now = new Date(),
): PublicGatheringsResponse {
  const enabledSeries = store.series.filter((series) => series.enabled);
  const enabledIds = new Set(enabledSeries.map((series) => series.id));
  const seriesById = new Map(store.series.map((series) => [series.id, series]));
  const publicOccurrences = store.occurrences.filter(
    (occurrence) =>
      enabledIds.has(occurrence.seriesId) && PUBLIC_STATUSES.has(occurrence.status),
  );
  const publicStore = { ...store, occurrences: publicOccurrences };
  const featured = selectFeaturedOccurrence(publicStore, now);
  const serialize = (occurrence: GatheringOccurrence) =>
    publicOccurrence(occurrence, seriesById.get(occurrence.seriesId)!, now);
  const nowMs = now.getTime();

  return {
    series: enabledSeries.map((series) => ({
      id: series.id,
      slug: series.slug,
      kind: series.kind,
      name: series.name,
      themeKey: series.themeKey,
      schedule: series.schedule,
    })),
    featured: featured ? serialize(featured) : null,
    upcoming: publicOccurrences
      .filter(
        (occurrence) =>
          occurrence.status !== "completed" && Date.parse(occurrence.startsAt) > nowMs,
      )
      .sort(byStartAscending)
      .map(serialize),
    recent: publicOccurrences
      .filter(
        (occurrence) =>
          occurrence.status === "completed" && Boolean(occurrence.replayUrl),
      )
      .sort((a, b) => byStartAscending(b, a))
      .map(serialize),
    generatedAt: now.toISOString(),
  };
}
