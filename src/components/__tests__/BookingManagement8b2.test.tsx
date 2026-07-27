import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import {
  normalizeBookingCode,
  formatOvernightHint,
  shouldDisableCancelCta,
  isStaffRequiredCode,
  neutralOwnershipMessage,
} from "@/lib/booking-management/display";
import type { PublicBooking } from "@/lib/booking-api";

const mocks = vi.hoisted(() => ({
  getUpcomingBookings: vi.fn(),
  lookupBooking: vi.fn(),
  submitBookingCancellation: vi.fn(),
  getBookingAccess: vi.fn(),
  BookingApiError: class BookingApiError extends Error {
    code: string;
    httpStatus: number;
    requestId: string | null;
    retryAfterSeconds: number | null;
    isRateLimited: boolean;
    constructor(opts: {
      code: string;
      message: string;
      httpStatus?: number;
      requestId?: string | null;
      retryAfterSeconds?: number | null;
    }) {
      super(opts.message);
      this.code = opts.code;
      this.httpStatus = opts.httpStatus ?? 400;
      this.requestId = opts.requestId ?? null;
      this.retryAfterSeconds = opts.retryAfterSeconds ?? null;
      this.isRateLimited = opts.code === "RATE_LIMIT_EXCEEDED" || opts.httpStatus === 429;
    }
  },
}));

vi.mock("@/lib/booking-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/booking-api")>("@/lib/booking-api");
  return {
    ...actual,
    getUpcomingBookings: (...a: unknown[]) => mocks.getUpcomingBookings(...a),
    lookupBooking: (...a: unknown[]) => mocks.lookupBooking(...a),
    submitBookingCancellation: (...a: unknown[]) => mocks.submitBookingCancellation(...a),
    getBookingAccess: (...a: unknown[]) => mocks.getBookingAccess(...a),
  };
});

import CustomerUpcomingBookings from "@/components/CustomerUpcomingBookings";
import BookingLookupPanel from "@/components/booking-management/BookingLookupPanel";
import CancelBookingDialog from "@/components/booking-management/CancelBookingDialog";
import fs from "node:fs";
import path from "node:path";

const sampleBooking: PublicBooking = {
  bookingCode: "BK-TEST-001",
  date: "2026-07-28",
  time: "00:30",
  dayOffset: 1,
  barberName: "أحمد",
  services: ["حلاقة"],
  status: "confirmed",
  canCancel: true,
  branchName: "جليم",
  totalPrice: 100,
};

function apiOk<T>(data: T) {
  return {
    data,
    metadata: {
      contractVersion: "booking-public-v1",
      contractUnverified: false,
      requestId: "req-1",
      rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
      deprecated: false,
      warning: null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getBookingAccess.mockReturnValue(null);
});

describe("BookingLookupAccessToken", () => {
  it("prefers stored access token without requiring phone", async () => {
    mocks.getBookingAccess.mockReturnValue({
      bookingCode: "BK-TEST-001",
      bookingAccessToken: "tok_secret",
      savedAt: Date.now(),
      expiresAt: null,
    });
    mocks.lookupBooking.mockResolvedValue(apiOk(sampleBooking));

    render(<BookingLookupPanel initialCode="bk-test-001" />);

    await waitFor(() => expect(mocks.lookupBooking).toHaveBeenCalled());
    expect(mocks.lookupBooking.mock.calls[0][0]).toBe("BK-TEST-001");
    expect(mocks.lookupBooking.mock.calls[0][1]?.phone).toBeUndefined();
    expect(screen.queryByLabelText(/رقم الهاتف/)).not.toBeInTheDocument();
    expect(await screen.findByText("BK-TEST-001")).toBeInTheDocument();
  });
});

describe("BookingLookupPhoneFallback", () => {
  it("shows phone fallback when token absent", async () => {
    mocks.getBookingAccess.mockReturnValue(null);
    render(<BookingLookupPanel />);
    fireEvent.change(screen.getByLabelText(/كود الحجز/), {
      target: { value: "BK-FALLBACK-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /عرض الحجز/ }));
    await waitFor(() => {
      expect(screen.getByLabelText(/رقم الهاتف/)).toBeInTheDocument();
    });
  });
});

describe("BookingLookupSecurity", () => {
  it("token never enters URL helpers; code is normalized", () => {
    expect(normalizeBookingCode(" bk-abc ")).toBe("BK-ABC");
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/booking/page.tsx"),
      "utf8",
    );
    expect(src).toMatch(/searchParams\.get\("code"\)/);
    expect(src).not.toMatch(/bookingAccessToken|access_token|accessToken=/);
  });
});

describe("BookingUpcomingEmptyState", () => {
  it("empty bookings array is success", async () => {
    mocks.getUpcomingBookings.mockResolvedValue(apiOk([]));
    render(<CustomerUpcomingBookings phone="01012345678" variant="embedded" />);
    await waitFor(() => expect(mocks.getUpcomingBookings).toHaveBeenCalled());
    expect(await screen.findByText(/لا توجد حجوزات قادمة/)).toBeInTheDocument();
  });

  it("upcoming API error is not converted to empty success", async () => {
    const { BookingApiError } = await import("@/lib/booking-api");
    mocks.getUpcomingBookings.mockRejectedValue(
      new BookingApiError({
        code: "INTERNAL_ERROR",
        message: "خطأ في التحميل",
        httpStatus: 500,
        requestId: "req-err",
      }),
    );
    render(<CustomerUpcomingBookings phone="01012345678" variant="embedded" />);
    expect(await screen.findByText(/خطأ في التحميل/)).toBeInTheDocument();
    expect(screen.getByText(/رقم مرجع الخطأ/)).toBeInTheDocument();
  });
});

describe("CustomerUpcomingBookingsMigration", () => {
  it("does not import publicBookingApi", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../CustomerUpcomingBookings.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/publicBookingApi/);
    expect(src).not.toMatch(/cut_customer_phone/);
    expect(src).not.toMatch(/bookingId|BookingID/);
  });

  it("does not auto-load cut_customer_phone", () => {
    localStorage.setItem("cut_customer_phone", "01099999999");
    render(<CustomerUpcomingBookings variant="compact" />);
    expect(mocks.getUpcomingBookings).not.toHaveBeenCalled();
    expect(screen.getByText(/إدارة حجوزاتك/)).toBeInTheDocument();
  });
});

describe("BookingCancelIdempotency / Unknown / Policy", () => {
  it("cancellation sends bookingCode via orchestration and guards double-click", async () => {
    let resolveCancel!: (v: unknown) => void;
    mocks.submitBookingCancellation.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCancel = resolve;
        }),
    );
    render(
      <CancelBookingDialog
        booking={sampleBooking}
        phone="01012345678"
        onClose={() => {}}
        onCancelled={() => {}}
      />,
    );
    const btn = screen.getByRole("button", { name: /تأكيد إلغاء الحجز/ });
    fireEvent.click(btn);
    fireEvent.click(btn);
    await waitFor(() => expect(mocks.submitBookingCancellation).toHaveBeenCalledTimes(1));
    expect(mocks.submitBookingCancellation.mock.calls[0][0].code).toBe("BK-TEST-001");
    await waitFor(() => {
      resolveCancel({ outcome: "success", response: { cancelled: true } });
    });
  });

  it("unknown outcome shows safe Arabic and does not say فشل الإلغاء", async () => {
    mocks.submitBookingCancellation.mockResolvedValue({
      outcome: "mutation_outcome_unknown",
      error: new mocks.BookingApiError({
        code: "UNKNOWN_ERROR",
        message: "net",
        httpStatus: 0,
      }),
    });
    render(
      <CancelBookingDialog
        booking={sampleBooking}
        phone="01012345678"
        onClose={() => {}}
        onCancelled={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /تأكيد إلغاء الحجز/ }));
    expect(await screen.findAllByText(/تعذر التأكد من نتيجة طلب الإلغاء/)).not.toHaveLength(0);
    expect(screen.queryByText(/فشل الإلغاء/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إعادة المحاولة الآمنة/ })).toBeInTheDocument();
  });

  it("already-cancelled becomes completed UI state", async () => {
    const onCancelled = vi.fn();
    mocks.submitBookingCancellation.mockResolvedValue({
      outcome: "known_failure",
      error: new mocks.BookingApiError({
        code: "BOOKING_ALREADY_CANCELLED",
        message: "already",
        httpStatus: 409,
      }),
    });
    render(
      <CancelBookingDialog
        booking={sampleBooking}
        phone="01012345678"
        onClose={() => {}}
        onCancelled={onCancelled}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /تأكيد إلغاء الحجز/ }));
    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
    expect(onCancelled.mock.calls[0][0].status).toBe("cancelled");
    expect(await screen.findByText(/تم إلغاء هذا الحجز مسبقاً/)).toBeInTheDocument();
  });

  it("payment/staff required does not claim refund", async () => {
    mocks.submitBookingCancellation.mockResolvedValue({
      outcome: "known_failure",
      error: new mocks.BookingApiError({
        code: "BOOKING_HAS_PAYMENT",
        message: "payment",
        httpStatus: 409,
      }),
    });
    render(
      <CancelBookingDialog
        booking={sampleBooking}
        phone="01012345678"
        onClose={() => {}}
        onCancelled={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /تأكيد إلغاء الحجز/ }));
    expect(await screen.findByText(/لم يتم إصدار أي استرداد تلقائي/)).toBeInTheDocument();
    expect(isStaffRequiredCode("BOOKING_HAS_PAYMENT")).toBe(true);
  });

  it("rate-limit countdown message appears", async () => {
    mocks.submitBookingCancellation.mockResolvedValue({
      outcome: "known_failure",
      error: new mocks.BookingApiError({
        code: "RATE_LIMIT_EXCEEDED",
        message: "انتظر",
        httpStatus: 429,
        retryAfterSeconds: 24,
      }),
    });
    render(
      <CancelBookingDialog
        booking={sampleBooking}
        phone="01012345678"
        onClose={() => {}}
        onCancelled={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /تأكيد إلغاء الحجز/ }));
    expect(await screen.findByText(/حاول مرة أخرى بعد/)).toBeInTheDocument();
  });
});

describe("BookingCancelOvernight / AccessAfterCancel / Display", () => {
  it("dayOffset-aware display hint", () => {
    const hint = formatOvernightHint(sampleBooking);
    expect(hint).toMatch(/تابع ليوم التشغيل/);
  });

  it("disables cancel for completed/in-service", () => {
    expect(
      shouldDisableCancelCta({ ...sampleBooking, status: "completed", canCancel: true }),
    ).toBe(true);
    expect(
      shouldDisableCancelCta({ ...sampleBooking, status: "in_service", canCancel: true }),
    ).toBe(true);
  });

  it("neutral unauthorized message", () => {
    expect(neutralOwnershipMessage()).toMatch(/تعذر العثور على الحجز أو التحقق/);
  });
});

describe("BookingDetailsAccessibility / ManagementMobile contracts", () => {
  it("cancel dialog has title and description ids", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../booking-management/CancelBookingDialog.tsx"),
      "utf8",
    );
    expect(src).toMatch(/aria-labelledby="cancel-booking-title"/);
    expect(src).toMatch(/aria-describedby="cancel-booking-desc"/);
    expect(src).toMatch(/aria-live/);
    expect(src).toMatch(/safe-area-inset-bottom/);
  });

  it("success link uses bookingCode only", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../BookingModal.tsx"),
      "utf8",
    );
    expect(src).toMatch(/\/booking\?code=/);
    expect(src).not.toMatch(/bookingAccessToken=/);
  });
});
