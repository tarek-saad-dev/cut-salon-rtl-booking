/**
 * TEMPORARY — Camp Caesar opening display pricing.
 * Pure sync helpers; zero network. Safe to delete with config/bookingPricePromos.ts.
 */
import {
  BOOKING_PRICE_PROMOS,
  type BookingPricePromoConfig,
} from "@/config/bookingPricePromos";

export type ActiveBookingPricePromo = {
  id: string;
  percentOff: number;
  /** Multiplier applied to list price (e.g. 0.5 for 50% off). */
  payFactor: number;
};

function isStillRunning(promo: BookingPricePromoConfig, now = Date.now()): boolean {
  if (!promo.enabled) return false;
  if (!promo.endsAt) return true;
  const end = Date.parse(promo.endsAt);
  return Number.isFinite(end) ? now <= end : true;
}

/** Resolve active display promo for a booking branch. O(n) tiny list. */
export function resolveBookingPricePromo(
  branchCode: string | null | undefined,
  now = Date.now(),
): ActiveBookingPricePromo | null {
  if (!branchCode) return null;
  const code = String(branchCode).toUpperCase();
  for (const promo of BOOKING_PRICE_PROMOS) {
    if (!isStillRunning(promo, now)) continue;
    if (!promo.branchCodes.some((b) => String(b).toUpperCase() === code)) continue;
    const percent = Math.min(100, Math.max(0, promo.percentOff));
    return {
      id: promo.id,
      percentOff: percent,
      payFactor: (100 - percent) / 100,
    };
  }
  return null;
}

export function applyBookingPricePromo(
  listPrice: number,
  promo: ActiveBookingPricePromo | null,
): { list: number; pay: number; showStrike: boolean } {
  const list = Number.isFinite(listPrice) ? Math.max(0, listPrice) : 0;
  if (!promo || promo.payFactor >= 1 || list <= 0) {
    return { list, pay: list, showStrike: false };
  }
  // Round to whole pounds for clean UI (matches typical salon display).
  const pay = Math.round(list * promo.payFactor);
  return { list, pay, showStrike: pay < list };
}
