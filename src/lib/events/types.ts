export type MinistryEventStatus = "draft" | "published" | "cancelled";
export type EventLocationType = "online" | "in-person" | "hybrid";

export interface MinistryEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  status: MinistryEventStatus;
  locationType: EventLocationType;
  locationLabel?: string;
  meetUrl?: string;
  registrationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventStoreV1 {
  schemaVersion: 1;
  revision: number;
  events: MinistryEvent[];
  updatedAt: string;
}

export interface PublicMinistryEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  locationType: EventLocationType;
  locationLabel?: string;
  registrationUrl?: string;
  joinUrl?: string;
}

export type MinistryEventInput = Pick<
  MinistryEvent,
  | "title"
  | "description"
  | "startsAt"
  | "endsAt"
  | "timezone"
  | "status"
  | "locationType"
  | "locationLabel"
  | "meetUrl"
  | "registrationUrl"
>;
