import type { GivingSettingsV1 } from "./types";

export class GivingValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(". "));
    this.name = "GivingValidationError";
  }
}

export function parseZeffyCampaignUrl(value: unknown) {
  if (typeof value !== "string") throw new GivingValidationError(["Zeffy campaign URL must be text"]);
  const cleaned = value.trim();
  if (!cleaned) return "";
  if (cleaned.length > 1000 || /[\u0000-\u001f\u007f]/.test(cleaned)) throw new GivingValidationError(["Zeffy campaign URL is invalid"]);
  try {
    const url = new URL(cleaned);
    if (
      url.protocol !== "https:" || !["zeffy.com", "www.zeffy.com"].includes(url.hostname) ||
      url.username || url.password || url.port || url.hash
    ) throw new Error("invalid");
    const segments = url.pathname.split("/").filter(Boolean);
    const hasLocale = /^[a-z]{2}-[a-z]{2}$/i.test(segments[0] ?? "");
    const formIndex = hasLocale ? 1 : 0;
    if (
      segments.length !== formIndex + 2 ||
      segments[formIndex]?.toLowerCase() !== "donation-form" ||
      !segments[formIndex + 1]?.trim()
    ) throw new Error("not donation form");
    url.hostname = "www.zeffy.com";
    return url.toString();
  } catch {
    throw new GivingValidationError(["Paste a valid HTTPS Zeffy donation-form link"]);
  }
}

export function zeffyEmbedUrl(campaignUrl: string) {
  const url = new URL(parseZeffyCampaignUrl(campaignUrl));
  const segments = url.pathname.split("/").filter(Boolean);
  const locale = /^[a-z]{2}-[a-z]{2}$/i.test(segments[0] ?? "") ? segments.shift() : null;
  url.pathname = `/${locale ? `${locale}/` : ""}embed/${segments.join("/")}`;
  return url.toString();
}

export function parseGivingSettings(value: unknown): GivingSettingsV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new GivingValidationError(["Giving settings are invalid"]);
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== 1 || !Number.isInteger(input.revision) || Number(input.revision) < 0) throw new GivingValidationError(["Giving settings are invalid"]);
  if (typeof input.updatedAt !== "string" || Number.isNaN(Date.parse(input.updatedAt)) || new Date(input.updatedAt).toISOString() !== input.updatedAt) throw new GivingValidationError(["Giving settings timestamp is invalid"]);
  return {
    schemaVersion: 1,
    revision: Number(input.revision),
    zeffyCampaignUrl: parseZeffyCampaignUrl(input.zeffyCampaignUrl),
    updatedAt: input.updatedAt,
  };
}

export function parseGivingUpdate(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new GivingValidationError(["Giving update must be an object"]);
  const input = value as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !["expectedRevision", "zeffyCampaignUrl"].includes(key));
  if (unknown.length) throw new GivingValidationError([`Unsupported giving fields: ${unknown.join(", ")}`]);
  if (!Number.isInteger(input.expectedRevision) || Number(input.expectedRevision) < 0) throw new GivingValidationError(["Expected revision must be a non-negative integer"]);
  return { expectedRevision: Number(input.expectedRevision), zeffyCampaignUrl: parseZeffyCampaignUrl(input.zeffyCampaignUrl) };
}
