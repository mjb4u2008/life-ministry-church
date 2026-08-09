export interface GivingSettingsV1 {
  schemaVersion: 1;
  revision: number;
  zeffyCampaignUrl: string;
  updatedAt: string;
}

export interface PublicGivingSettings {
  configured: boolean;
  campaignUrl?: string;
  embedUrl?: string;
}
