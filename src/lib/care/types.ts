export type CareKind = "prayer" | "visitor";
export type CareVisibility = "private" | "public";
export type CareModerationStatus = "pending" | "approved" | "rejected";
export type CareStatus = "new" | "contacted" | "ongoing" | "answered" | "closed";
export type CareUrgency = "normal" | "urgent";

export interface CareRecord {
  id: string;
  kind: CareKind;
  name: string;
  isAnonymous: boolean;
  message: string;
  visibility: CareVisibility;
  moderationStatus: CareModerationStatus;
  careStatus: CareStatus;
  urgency: CareUrgency;
  contactPermission: boolean;
  email?: string;
  phone?: string;
  preferredContact?: "email" | "phone";
  assignee?: string;
  followUpAt?: string;
  privateNotes?: string;
  source: "prayer-form" | "welcome-form" | "admin" | "legacy-prayer";
  prayerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CareStoreV1 {
  schemaVersion: 1;
  revision: number;
  records: CareRecord[];
  updatedAt: string;
}

export interface PublicPrayer {
  id: string;
  name: string;
  request: string;
  prayerCount: number;
  createdAt: string;
  isAnonymous: boolean;
}

export interface PublicCareSubmission {
  kind: CareKind;
  name: string;
  isAnonymous: boolean;
  message: string;
  visibility: CareVisibility;
  urgency: CareUrgency;
  contactPermission: boolean;
  email?: string;
  phone?: string;
  preferredContact?: "email" | "phone";
  source: "prayer-form" | "welcome-form";
}

export type CareAdminUpdates = Partial<
  Pick<
    CareRecord,
    | "careStatus"
    | "moderationStatus"
    | "urgency"
    | "visibility"
    | "assignee"
    | "followUpAt"
    | "privateNotes"
  >
>;
