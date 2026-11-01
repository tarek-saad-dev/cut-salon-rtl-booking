export type CampaignEvent =
  | "camp_caesar_campaign_view"
  | "camp_caesar_campaign_dismiss"
  | "camp_caesar_explore_click"
  | "camp_caesar_location_click"
  | "camp_caesar_booking_click"
  | "november_protein_view"
  | "november_protein_book_start"
  | "november_protein_whatsapp";

export function trackCampaignEvent(
  event: CampaignEvent,
  payload?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  console.info(`[cut-campaign] ${event}`, {
    ts: Date.now(),
    ...payload,
  });
}
