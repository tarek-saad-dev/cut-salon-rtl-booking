import type { CampaignConfig } from "@/config/campaigns";

const STORAGE_PREFIX = "cut_campaign_";

interface CampaignDismissRecord {
  campaignId: string;
  dismissedAt: number;
}

function storageKey(campaignId: string): string {
  return `${STORAGE_PREFIX}${campaignId}`;
}

export function getCampaignDismissRecord(campaignId: string): CampaignDismissRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(campaignId));
    if (!raw) return null;
    return JSON.parse(raw) as CampaignDismissRecord;
  } catch {
    return null;
  }
}

export function markCampaignDismissed(campaignId: string): void {
  if (typeof window === "undefined") return;
  const record: CampaignDismissRecord = { campaignId, dismissedAt: Date.now() };
  try {
    localStorage.setItem(storageKey(campaignId), JSON.stringify(record));
  } catch {
    /* quota / private mode */
  }
}

export function shouldAutoShowOpeningSheet(config: CampaignConfig): boolean {
  const record = getCampaignDismissRecord(config.campaignId);
  if (!record || record.campaignId !== config.campaignId) return true;
  const elapsedHours = (Date.now() - record.dismissedAt) / (1000 * 60 * 60);
  return elapsedHours >= config.showModalEveryHours;
}

export function isFirstSiteVisit(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "cut_site_visited";
    const visited = localStorage.getItem(key);
    if (!visited) {
      localStorage.setItem(key, String(Date.now()));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
