export interface CampaignConfig {
  enabled: boolean;
  campaignId: string;
  branchCode: string;
  title: string;
  eyebrow: string;
  status: string;
  offer: string;
  offerDescription: string;
  /** Short joyful invite under the offer (EN / AR) */
  inviteLine: { en: string; ar: string };
  /** Primary CTA label (EN / AR) */
  bookCta: { en: string; ar: string };
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
  offerDescription: "ALL SERVICES",
  inviteLine: {
    en: "Book now at Camp Caesar and enjoy 50% off every service on your first visit.",
    ar: "احجز الآن في كامب شيزار واحصل على خصم 50% على كل الخدمات في زيارتك الأولى.",
  },
  bookCta: {
    en: "Book now · Get 50% off",
    ar: "احجز الآن · خصم 50%",
  },
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

/** Announcement bar height while Camp Caesar promo is live — keep in sync with CampaignAnnouncement. */
export const CAMPAIGN_ANNOUNCEMENT_BAR_HEIGHT_PX = 28;

/** Active site-wide campaign — set `enabled: false` to turn off without removing components */
export function getActiveCampaign(): CampaignConfig | null {
  return CAMP_CAESAR_OPENING_2026.enabled ? CAMP_CAESAR_OPENING_2026 : null;
}
