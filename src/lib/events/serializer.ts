import type { EventStoreV1, MinistryEvent, PublicMinistryEvent } from "./types";

export function serializePublicEvent(event: MinistryEvent, now = new Date()): PublicMinistryEvent {
  const joinOpens = Date.parse(event.startsAt) - 30 * 60_000;
  const joinCloses = event.endsAt ? Date.parse(event.endsAt) : Date.parse(event.startsAt) + 4 * 60 * 60_000;
  const mayJoin = now.getTime() >= joinOpens && now.getTime() < joinCloses;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    ...(event.endsAt ? { endsAt: event.endsAt } : {}),
    timezone: event.timezone,
    locationType: event.locationType,
    ...(event.locationLabel ? { locationLabel: event.locationLabel } : {}),
    ...(event.registrationUrl ? { registrationUrl: event.registrationUrl } : {}),
    ...(mayJoin && event.meetUrl ? { joinUrl: event.meetUrl } : {}),
  };
}

export function serializePublicEvents(store: EventStoreV1, now = new Date()) {
  return store.events
    .filter((event) => {
      const visibleUntil = event.endsAt
        ? Date.parse(event.endsAt)
        : Date.parse(event.startsAt) + 4 * 60 * 60_000;
      return event.status === "published" && visibleUntil > now.getTime();
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((event) => serializePublicEvent(event, now));
}

export function selectPublicEvent(store: EventStoreV1, id: string, now = new Date()) {
  return store.events.find((event) => {
    const visibleUntil = event.endsAt
      ? Date.parse(event.endsAt)
      : Date.parse(event.startsAt) + 4 * 60 * 60_000;
    return event.id === id && event.status === "published" && visibleUntil > now.getTime();
  }) ?? null;
}
