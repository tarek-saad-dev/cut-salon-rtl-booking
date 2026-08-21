export interface CampaignConfig {
  enabled: boolean;
  campaignId: string;
  branchCode: string;
  title: string;
  eyebrow: string;
  status: string;
  offer: string;
  offerDescription: string;
  locationUrl: string;
  /** Hours before the opening sheet may auto-show again after dismiss */
  showModalEveryHours: number;
  /** Delay before auto-showing opening sheet (ms) */
  openingDelayMs: [number, number];
  /** Optional branch image path under /public */
  branchImage?: string;
  /** Announcement bar copy (alternates) */
  announcementLines: [string, string];
  /** Subtitle shown in explore experience */
  brandLabel?: string;
}

export const CAMP_CAESAR_OPENING_2026: CampaignConfig = {
  enabled: true,
  campaignId: "camp-caesar-opening-2026",
  branchCode: "CAMP_CAESAR",
  title: "CAMP CAESAR",
  eyebrow: "NEW LOCATION",
  status: "NOW OPEN",
  offer: "50% OFF",
  offerDescription: "YOUR FIRST VISIT",
  locationUrl: "https://maps.app.goo.gl/217r3pLutcKFAW2x7",
  showModalEveryHours: 24,
  openingDelayMs: [500, 800],
  branchImage: undefined,
  brandLabel: "CUT SALON",
  announcementLines: [
    "✦ CUT HAS A NEW HOME — CAMP CAESAR",
    "GRAND OPENING · 50% OFF YOUR FIRST VISIT",
  ],
};

/** Active site-wide campaign — set `enabled: false` to turn off without removing components */
export function getActiveCampaign(): CampaignConfig | null {
  return CAMP_CAESAR_OPENING_2026.enabled ? CAMP_CAESAR_OPENING_2026 : null;
}
