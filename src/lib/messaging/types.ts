export type ContactType = "email" | "phone";
export type ConsentSource = "homepage" | "reminder-form" | "admin-manual" | "admin-import" | "legacy";
export type SuppressionReason = "unsubscribe" | "admin" | "provider";

export interface SubscriberConsent {
  recordedAt: string;
  source: ConsentSource;
  version: string;
}

export interface Subscriber {
  id: string;
  name: string;
  contactType: ContactType;
  contact: string;
  createdAt: string;
  consent: SubscriberConsent;
  suppressedAt: string | null;
  suppressionReason: SuppressionReason | null;
}

export interface SubscriberInput {
  name: string;
  contactType: ContactType;
  contact: string;
  consentSource: Exclude<ConsentSource, "legacy">;
  consentVersion: string;
}

export interface SubscriberStoreV1 {
  schemaVersion: 1;
  revision: number;
  subscribers: Subscriber[];
  updatedAt: string;
}
