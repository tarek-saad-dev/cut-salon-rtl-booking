import { describe, expect, it } from "vitest";
import {
  applyBookingPricePromo,
  resolveBookingPricePromo,
} from "@/lib/booking/bookingPricePromo";

describe("bookingPricePromo (Camp Caesar temporary display)", () => {
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
});
