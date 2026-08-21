/**
 * TEMPORARY booking price promos (display-only).
 *
 * To turn OFF Camp Caesar 50% display: set `enabled: false` below.
 * To remove entirely after the campaign:
 *   1. Delete this file
 *   2. Delete `src/lib/booking/bookingPricePromo.ts`
 *   3. Delete `src/context/BookingPricePromoContext.tsx`
 *   4. Delete `src/components/booking/BookingPromoPrice.tsx`
 *   5. Remove `BookingPricePromoProvider` wrap in BookingModal
 *   6. Revert `BookingPromoPrice` usages back to `format.price(...)`
 *
 * Does NOT change plan/create payloads — server remains source of truth for charges.
 */
export type BookingPricePromoConfig = {
  id: string;
  enabled: boolean;
  /** Branch codes that activate the display promo (uppercase). */
  branchCodes: string[];
  /** 50 = half price. */
  percentOff: number;
  /** Optional ISO date — auto-off after this instant (client clock). */
  endsAt?: string;
};

export const BOOKING_PRICE_PROMOS: BookingPricePromoConfig[] = [
  {
    id: "camp-caesar-opening-2026-half-price",
    enabled: true,
    branchCodes: ["CAMP_CAESAR"],
    percentOff: 50,
    // endsAt: "2026-09-30T21:59:59+03:00",
  },
];
