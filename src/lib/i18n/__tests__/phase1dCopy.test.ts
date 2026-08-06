import { describe, it, expect } from "vitest";
import { bookingCatalog } from "@/lib/i18n/booking";

describe("Phase 1D review/success copy", () => {
  it("Arabic and English review/success strings are present", () => {
    expect(bookingCatalog.review.title.ar).toBeTruthy();
    expect(bookingCatalog.review.title.en).toBe("Review your booking");
    expect(bookingCatalog.review.appointment.en).toBe("Appointment");
    expect(bookingCatalog.success.title.en).toBe("Booking confirmed successfully");
    expect(bookingCatalog.success.subtitle.ar).toContain("احتفظ");
    expect(bookingCatalog.actions.doneThanks.en).toBe("Done");
  });
});
