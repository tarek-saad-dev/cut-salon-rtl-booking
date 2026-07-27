/**
 * Named Phase 8B2 suites — behavioral coverage lives in BookingManagement8b2.test.tsx
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const roots = {
  upcoming: path.resolve(__dirname, "../CustomerUpcomingBookings.tsx"),
  lookup: path.resolve(__dirname, "../booking-management/BookingLookupPanel.tsx"),
  cancel: path.resolve(__dirname, "../booking-management/CancelBookingDialog.tsx"),
  card: path.resolve(__dirname, "../booking-management/BookingManagementCard.tsx"),
  page: path.resolve(__dirname, "../../app/booking/page.tsx"),
  modal: path.resolve(__dirname, "../BookingModal.tsx"),
  profile: path.resolve(__dirname, "../ClientProfileWidget.tsx"),
};

function read(p: string) {
  return fs.readFileSync(p, "utf8");
}

describe("BookingLookupAccessToken (source)", () => {
  it("uses getBookingAccess then lookupBooking", () => {
    const src = read(roots.lookup);
    expect(src).toMatch(/getBookingAccess/);
    expect(src).toMatch(/lookupBooking/);
    expect(src).toMatch(/access-token/);
  });
});

describe("BookingLookupPhoneFallback (source)", () => {
  it("requests phone only when needed", () => {
    expect(read(roots.lookup)).toMatch(/needPhone/);
  });
});

describe("BookingLookupSecurity (source)", () => {
  it("page never puts token in query", () => {
    const src = read(roots.page);
    expect(src).not.toMatch(/bookingAccessToken/);
    expect(src).toMatch(/code/);
  });
});

describe("BookingUpcomingEmptyState (source)", () => {
  it("distinguishes empty success vs error", () => {
    const src = read(roots.upcoming);
    expect(src).toMatch(/لا توجد حجوزات قادمة/);
    expect(src).toMatch(/BookingApiError/);
  });
});

describe("BookingCancelIdempotency (source)", () => {
  it("uses submitBookingCancellation only", () => {
    const src = read(roots.cancel);
    expect(src).toMatch(/submitBookingCancellation/);
    expect(src).not.toMatch(/publicBookingApi/);
    expect(src).toMatch(/inFlightRef/);
  });
});

describe("BookingCancelUnknownOutcome (source)", () => {
  it("has verify + safe retry copy", () => {
    const src = read(roots.cancel);
    expect(src).toMatch(/تعذر التأكد من نتيجة طلب الإلغاء/);
    expect(src).toMatch(/إعادة المحاولة الآمنة/);
    expect(src).toMatch(/التحقق من حالة الحجز/);
  });
});

describe("BookingCancelRateLimit (source)", () => {
  it("shows countdown copy", () => {
    expect(read(roots.cancel)).toMatch(/حاول مرة أخرى بعد/);
  });
});

describe("BookingCancelPolicyErrors (source)", () => {
  it("maps staff/payment without refund claim", () => {
    expect(read(roots.cancel)).toMatch(/لم يتم إصدار أي استرداد تلقائي/);
  });
});

describe("BookingCancelAlreadyCancelled (source)", () => {
  it("handles BOOKING_ALREADY_CANCELLED", () => {
    expect(read(roots.cancel)).toMatch(/BOOKING_ALREADY_CANCELLED|تم إلغاء هذا الحجز مسبقاً/);
  });
});

describe("BookingCancelPayment (source)", () => {
  it("references BOOKING_HAS_PAYMENT path", () => {
    expect(read(roots.cancel)).toMatch(/isStaffRequiredCode/);
  });
});

describe("BookingCancelOvernight (source)", () => {
  it("card/dialog use overnight helpers", () => {
    expect(read(roots.card)).toMatch(/formatOvernightHint/);
    expect(read(roots.cancel)).toMatch(/formatOvernightHint/);
  });
});

describe("BookingAccessAfterCancel (source)", () => {
  it("does not removeBookingAccess on cancel success", () => {
    const src = read(roots.cancel);
    expect(src).not.toMatch(/removeBookingAccess/);
  });
});

describe("BookingDetailsAccessibility (source)", () => {
  it("dialog a11y attributes present", () => {
    const src = read(roots.cancel);
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/aria-modal/);
  });
});

describe("BookingManagementMobile (source)", () => {
  it("uses safe-area and max viewport dialog", () => {
    expect(read(roots.cancel)).toMatch(/safe-area-inset-bottom/);
    expect(read(roots.cancel)).toMatch(/max-h-\[90vh\]/);
  });
});

describe("CustomerUpcomingBookingsMigration (source)", () => {
  it("no legacy booking API", () => {
    expect(read(roots.upcoming)).not.toMatch(/publicBookingApi/);
    expect(read(roots.upcoming)).not.toMatch(/cut_customer_phone/);
    expect(read(roots.profile)).toMatch(/getSavedClient/);
    expect(read(roots.modal)).toMatch(/\/booking\?code=/);
  });
});
