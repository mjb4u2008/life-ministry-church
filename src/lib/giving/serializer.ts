import { zeffyEmbedUrl } from "./schema";
import type { GivingSettingsV1, PublicGivingSettings } from "./types";

export function serializePublicGiving(settings: GivingSettingsV1): PublicGivingSettings {
  if (!settings.zeffyCampaignUrl) return { configured: false };
  return {
    configured: true,
    campaignUrl: settings.zeffyCampaignUrl,
    embedUrl: zeffyEmbedUrl(settings.zeffyCampaignUrl),
  };
}
