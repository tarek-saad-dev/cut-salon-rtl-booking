import { afterEach, describe, expect, it } from "vitest";
import {
  applyBookingPricePromo,
  resolveBookingPricePromo,
} from "@/lib/booking/bookingPricePromo";
import {
  clearRememberedNovemberPackageId,
  rememberNovemberPackageId,
} from "@/config/novemberProteinOffer";

describe("bookingPricePromo (Camp Caesar temporary display)", () => {
  afterEach(() => {
    clearRememberedNovemberPackageId();
  });

  it("activates for CAMP_CAESAR only", () => {
    expect(resolveBookingPricePromo("CAMP_CAESAR")?.percentOff).toBe(50);
    expect(resolveBookingPricePromo("camp_caesar")?.payFactor).toBe(0.5);
    expect(resolveBookingPricePromo("GLEEM")).toBeNull();
    expect(resolveBookingPricePromo(null)).toBeNull();
  });

  it("halves list price with strike for UI", () => {
    const promo = resolveBookingPricePromo("CAMP_CAESAR");
    expect(applyBookingPricePromo(200, promo)).toEqual({
      list: 200,
      pay: 100,
      showStrike: true,
    });
    expect(applyBookingPricePromo(200, null)).toEqual({
      list: 200,
      pay: 200,
      showStrike: false,
    });
  });

  it("does not stack Camp Caesar % with the November Protein package", () => {
    rememberNovemberPackageId(21);
    expect(resolveBookingPricePromo("CAMP_CAESAR", Date.now(), 21)).toBeNull();
    expect(resolveBookingPricePromo("CAMP_CAESAR", Date.now(), 7)?.percentOff).toBe(50);
  });
});
