export const GATHERING_SCHEMA_VERSION = 1 as const;

export type GatheringKind = "sunday" | "wednesday" | "special";
export type GatheringTheme = "sunday" | "wednesday" | "special";
export type GatheringStatus =
  | "draft"
  | "published"
  | "live"
  | "completed"
  | "cancelled";

export interface GatheringSchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  localTime: string;
  timezone: string;
  durationMinutes: number;
}

export interface GatheringSeries {
  id: string;
  slug: string;
  kind: GatheringKind;
  name: string;
  enabled: boolean;
  themeKey: GatheringTheme;
  schedule: GatheringSchedule | null;
  defaultMeetUrl: string;
  joinWindowMinutes: number;
  updatedAt: string;
}

export interface GatheringOccurrence {
  id: string;
  seriesId: string;
  localDate: string;
  startsAt: string;
  endsAt: string;
  status: GatheringStatus;
  title: string;
  scripture: string;
  description: string;
  meetUrlOverride?: string;
  replayUrl?: string;
  bannerUrl?: string;
  publishedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface ReminderDelivery {
  occurrenceId: string;
  reminderType: string;
  status?: "sending" | "sent";
  leaseId?: string;
  sentAt: string;
}

export interface GatheringStoreV1 {
  schemaVersion: typeof GATHERING_SCHEMA_VERSION;
  revision: number;
  series: GatheringSeries[];
  occurrences: GatheringOccurrence[];
  reminderDeliveries: ReminderDelivery[];
  updatedAt: string;
}

export type GatheringPutCommand =
  | {
      operation: "upsert-series";
      expectedRevision: number;
      series: GatheringSeries;
    }
  | {
      operation: "upsert-occurrence";
      expectedRevision: number;
      occurrence: GatheringOccurrence;
    };

export interface PublicGatheringSeries {
  id: string;
  slug: string;
  kind: GatheringKind;
  name: string;
  themeKey: GatheringTheme;
  schedule: GatheringSchedule | null;
}

export interface PublicGatheringOccurrence {
  id: string;
  seriesId: string;
  localDate: string;
  startsAt: string;
  endsAt: string;
  status: Exclude<GatheringStatus, "draft" | "cancelled">;
  title: string;
  scripture: string;
  description: string;
  replayUrl?: string;
  bannerUrl?: string;
  joinUrl?: string;
}

export interface PublicGatheringsResponse {
  series: PublicGatheringSeries[];
  featured: PublicGatheringOccurrence | null;
  upcoming: PublicGatheringOccurrence[];
  recent: PublicGatheringOccurrence[];
  generatedAt: string;
}
