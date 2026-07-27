/**
 * Named suite files required by Phase 8B1 — implementations live in BookingModalFlow.test.tsx
 * so mocks stay consistent. These files document coverage mapping and assert source contracts.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const modalSrc = fs.readFileSync(
  path.resolve(__dirname, "../BookingModal.tsx"),
  "utf8",
);
const hookSrc = fs.readFileSync(
  path.resolve(__dirname, "../../hooks/useBookingFlow.ts"),
  "utf8",
);

describe("BookingModalBranchSelection (source contract)", () => {
  it("uses BranchContext + booking-api PublicBranch, not hardcoded GLEEM authority", () => {
    expect(modalSrc).toMatch(/useBranch/);
    expect(modalSrc).toMatch(/@\/lib\/booking-api/);
    expect(modalSrc).not.toMatch(/publicBookingApi/);
  });
});

describe("BookingModalServices (source contract)", () => {
  it("loads services via useBookingFlow / getServices path", () => {
    expect(hookSrc).toMatch(/getServices/);
    expect(hookSrc).toMatch(/MAX_SERVICES = 12/);
    expect(hookSrc).toMatch(/isBookableOnline/);
  });
});

describe("BookingModalAvailability (source contract)", () => {
  it("uses abort + stale guards for days/slots", () => {
    expect(hookSrc).toMatch(/getAvailableDays/);
    expect(hookSrc).toMatch(/getAvailableSlots/);
    expect(hookSrc).toMatch(/isStaleResponse/);
    expect(hookSrc).toMatch(/AbortController/);
  });
});

describe("BookingModalPlan (source contract)", () => {
  it("creates plan then moves to review step", () => {
    expect(hookSrc).toMatch(/createBookingPlan/);
    expect(hookSrc).toMatch(/setStep\("review"\)/);
    expect(modalSrc).toMatch(/راجع حجزك/);
  });
});

describe("BookingModalCreate (source contract)", () => {
  it("confirms via submitBookingFromPlan", () => {
    expect(hookSrc).toMatch(/submitBookingFromPlan/);
    expect(modalSrc).toMatch(/تأكيد الحجز/);
    expect(modalSrc).toMatch(/جاري تأكيد حجزك/);
  });
});

describe("BookingModalIdempotency (source contract)", () => {
  it("delegates idempotency to Phase 8A orchestration", () => {
    expect(hookSrc).toMatch(/submitBookingFromPlan/);
    expect(hookSrc).toMatch(/buildCreateOperationKey/);
  });
});

describe("BookingModalUnknownOutcome (source contract)", () => {
  it("surfaces mutation_outcome_unknown UX", () => {
    expect(hookSrc).toMatch(/mutation_outcome_unknown/);
    expect(hookSrc).toMatch(/safeRetryCreate/);
    expect(modalSrc).toMatch(/إعادة التحقق|إعادة المحاولة|تعذر التأكد/);
  });
});

describe("BookingModalRateLimit (source contract)", () => {
  it("tracks rate_limited countdown", () => {
    expect(hookSrc).toMatch(/rate_limited/);
    expect(hookSrc).toMatch(/rateLimitRemainingSeconds/);
  });
});

describe("BookingModalOvernight (source contract)", () => {
  it("preserves dayOffset on plan/create", () => {
    expect(hookSrc).toMatch(/dayOffset/);
    expect(modalSrc).toMatch(/تابع لليوم التشغيلي المختار/);
  });
});

describe("BookingModalStateReset (source contract)", () => {
  it("clears downstream on branch/service/mode changes", () => {
    expect(hookSrc).toMatch(/clearDownstreamFromBranch/);
    expect(hookSrc).toMatch(/resetAll/);
    expect(hookSrc).toMatch(/clearPlanSession/);
  });
});

describe("BookingModalAccessibility (source contract)", () => {
  it("keeps dialog title/description", () => {
    expect(modalSrc).toMatch(/DialogTitle/);
    expect(modalSrc).toMatch(/DialogDescription/);
    expect(modalSrc).toMatch(/sr-only|VisuallyHidden/);
  });
});

describe("BookingModalSecurity (source contract)", () => {
  it("has no legacy booking API or phone persistence writes", () => {
    expect(modalSrc).not.toMatch(/publicBookingApi/);
    expect(modalSrc).not.toMatch(/cut_customer_phone/);
    expect(hookSrc).not.toMatch(/cut_customer_phone/);
    expect(modalSrc).not.toMatch(/BookingID|BranchID/);
    expect(hookSrc).not.toMatch(/BookingID|BranchID/);
  });
});
