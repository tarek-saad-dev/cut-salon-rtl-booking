import type { ApiPersonalOffer, PersonalOfferType } from "./clientLoyaltyApi";

// ─── CUT CLUB — Personal Offer (static fallback → API-driven later) ─────────

/** Display labels shown in the offer title */
export const STATIC_PERSONAL_OFFER_SERVICES = [
  "Haircut & Beard",
  "Deep skincare",
] as const;

/** Booking service names — used later to pre-select services when user taps CTA */
export const STATIC_PERSONAL_OFFER_SERVICE_NAMES = [
  "Haircut & Beard",
  "Deep SkinCare",
] as const;

export const STATIC_PERSONAL_OFFER = {
  type: "DOUBLE_POINTS" as PersonalOfferType,
  eyebrow: "عرض مخصوص ليك",
  benefitText: "وخد Double Points 🔥",
  expiryText: "العرض سارى حتى نهاية الأسبوع. لا تفوّت الفرصة.",
  ctaLabel: "احجز العرض",
  serviceLabels: [...STATIC_PERSONAL_OFFER_SERVICES],
  serviceNames: [...STATIC_PERSONAL_OFFER_SERVICE_NAMES],
} as const;

export interface ResolvedPersonalOffer {
  type: PersonalOfferType;
  eyebrow: string;
  title: string;
  description: string;
  expiryText: string | null;
  expiresAt: string | null;
  ctaLabel: string;
  /** For future booking pre-selection from API-driven offers */
  serviceNames: string[];
}

/** Build title from service labels — e.g. "احجز Haircut & Beard و Deep skincare الأسبوع ده" */
export function buildPersonalOfferTitle(serviceLabels: string[]): string {
  if (serviceLabels.length === 0) return "احجز الأسبوع ده";
  if (serviceLabels.length === 1) {
    return `احجز ${serviceLabels[0]} الأسبوع ده`;
  }
  const last = serviceLabels[serviceLabels.length - 1];
  const rest = serviceLabels.slice(0, -1).join(" و ");
  return `احجز ${rest} و ${last} الأسبوع ده`;
}

function formatExpiryDate(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
  });
}

/**
 * Merge API offer with static fallback.
 * - `undefined` → show static offer (API not loaded yet / no endpoint)
 * - `null` or type NONE → hide component
 * - API fields override static; missing title is built from serviceNames/serviceLabels
 */
export function resolvePersonalOffer(
  offer?: ApiPersonalOffer | null,
): ResolvedPersonalOffer | null {
  if (offer !== undefined && (offer === null || offer.type === "NONE")) {
    return null;
  }

  const staticOffer = STATIC_PERSONAL_OFFER;
  const type = offer?.type ?? staticOffer.type;

  const serviceLabels =
    offer?.serviceLabels ??
    offer?.serviceNames ??
    staticOffer.serviceLabels;

  const serviceNames =
    offer?.serviceNames ??
    staticOffer.serviceNames;

  const title =
    offer?.title?.trim() || buildPersonalOfferTitle(serviceLabels);

  const description =
    offer?.description?.trim() || staticOffer.benefitText;

  const expiresAt = offer?.expiresAt ?? null;

  const expiryText = expiresAt
    ? `العرض سارى حتى ${formatExpiryDate(expiresAt)}.`
    : offer?.expiryText?.trim() || staticOffer.expiryText;

  return {
    type,
    eyebrow: offer?.eyebrow?.trim() || staticOffer.eyebrow,
    title,
    description,
    expiryText,
    expiresAt,
    ctaLabel: offer?.ctaLabel?.trim() || staticOffer.ctaLabel,
    serviceNames,
  };
}
