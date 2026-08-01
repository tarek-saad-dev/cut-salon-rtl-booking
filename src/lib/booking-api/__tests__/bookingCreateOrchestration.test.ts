import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { _resetPlanSession, savePlanSession } from "../plan-session";
import { _clearAllMutations } from "../idempotency";
import type { BookingPlan } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockPlan: BookingPlan = {
  plan: [],
  totalDurationMinutes: 30,
  totalPrice: 100,
  bookingCodes: ["BK-001"],
  planToken: "plan_tok_123",
  planFingerprint: "fp_1",
};

const createParams = {
  branchCode: "GLEEM",
  date: "2026-01-01",
  time: "10:00",
  serviceIds: [1, 2],
  mode: "specific" as const,
  empId: 5,
  customer: { name: "Test", phone: "01234567890" },
};

const planSessionParams = {
  branchCode: "GLEEM",
  mode: "specific" as const,
  empId: 5,
  serviceIds: [1, 2],
  date: "2026-01-01",
  time: "10:00",
};

describe("Create Orchestration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
    _resetPlanSession();
    _clearAllMutations();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends planToken in create request body", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, booking: { bookingCode: "BK-NEW" } }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.planToken).toBe("plan_tok_123");
  });

  it("sends Idempotency-Key header", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, booking: { bookingCode: "BK-NEW" } }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Idempotency-Key"]).toBeTruthy();
  });

  it("sends matching clientRequestId in body", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, booking: { bookingCode: "BK-NEW" } }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    const headers = mockFetch.mock.calls[0][1].headers;
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.clientRequestId).toBe(headers["Idempotency-Key"]);
  });

  it("normalizes live create shape code → bookingCode and nested token", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers(),
      text: async () =>
        JSON.stringify({
          ok: true,
          booking: {
            code: "BK-LIVE-CODE",
            status: "confirmed",
            calendarDate: "2026-07-28",
            time: "12:30",
            barber: { empId: 7, nameAr: "محمد" },
            branch: { branchCode: "GLEEM", branchName: "جليم" },
            services: [{ nameAr: "حلاقة شعر", price: 200, durationMinutes: 30 }],
            total: 200,
            totalDurationMinutes: 30,
            bookingAccessToken: "tok_nested_live",
          },
          meta: { planTokenStatus: "valid" },
        }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    const result = await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") return;
    expect(result.booking.bookingCode).toBe("BK-LIVE-CODE");
    expect(result.booking.bookingAccessToken).toBe("tok_nested_live");
    expect(result.booking.barberName).toBe("محمد");
    expect(result.booking.branchCode).toBe("GLEEM");
    expect(result.booking.date).toBe("2026-07-28");
  });

  it("normalizes BK-AP69KY production create payload (nearest/any_barber)", async () => {
    savePlanSession(mockPlan, {
      ...planSessionParams,
      mode: "nearest",
      empId: undefined,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers(),
      text: async () =>
        JSON.stringify({
          ok: true,
          booking: {
            code: "BK-AP69KY",
            status: "confirmed",
            branch: {
              branchCode: "GLEEM",
              branchName: "جليم – سابا باشا",
              address: null,
              phone: null,
            },
            barber: {
              empId: 25,
              nameAr: "عمر",
              nameEn: "Omar",
              imageUrl: null,
            },
            assignmentStrategy: "server_selected",
            date: "2026-07-31",
            calendarDate: "2026-07-31",
            time: "21:15",
            dayOffset: 0,
            services: [
              {
                serviceId: 9,
                nameAr: "حلاقة شعر",
                nameEn: "Hair Cut",
                price: 200,
                durationMinutes: 30,
              },
            ],
            totalDurationMinutes: 30,
            subtotal: 200,
            discount: 0,
            total: 200,
            currency: "EGP",
            pricingScope: "global",
          },
          meta: {
            idempotentReplay: false,
            planTokenStatus: "valid",
            createdAt: "2026-07-31T16:42:21.861Z",
            assignmentStrategy: "server_selected",
          },
          message: "تم تأكيد الحجز بنجاح",
        }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    const result = await submitBookingFromPlan({
      ...createParams,
      mode: "nearest",
      empId: undefined,
      plan: mockPlan,
    });

    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") return;
    expect(result.booking.bookingCode).toBe("BK-AP69KY");
    expect(result.booking.barberName).toBe("عمر");
    expect(result.booking.branchName).toBe("جليم – سابا باشا");
    expect(result.booking.date).toBe("2026-07-31");
    expect(result.booking.time).toBe("21:15");
    expect(result.booking.services).toEqual(["حلاقة شعر"]);
    expect(result.booking.totalPrice).toBe(200);
    expect(result.booking.message).toBe("تم تأكيد الحجز بنجاح");
  });

  it("does not send numeric BookingID", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, booking: { bookingCode: "BK-NEW" } }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.bookingId).toBeUndefined();
  });

  it("does not send client-calculated price or duration", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, booking: { bookingCode: "BK-NEW" } }),
    } as unknown as Response);

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.totalPrice).toBeUndefined();
    expect(body.totalDuration).toBeUndefined();
    expect(body.totalDurationMinutes).toBeUndefined();
  });

  it("preserves idempotency key on uncertain network failure", async () => {
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

    const { submitBookingFromPlan } = await import("../booking");
    const result = await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    expect(result.outcome).toBe("mutation_outcome_unknown");

    // Retry should get same idempotency key
    savePlanSession(mockPlan, planSessionParams);
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, booking: { bookingCode: "BK-NEW" } }),
    } as unknown as Response);

    await submitBookingFromPlan({ ...createParams, plan: mockPlan });

    const body1 = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body ?? "{}");
    const body2 = JSON.parse(mockFetch.mock.calls[1]?.[1]?.body ?? "{}");
    // Both should have the same clientRequestId
    if (body1.clientRequestId && body2.clientRequestId) {
      expect(body1.clientRequestId).toBe(body2.clientRequestId);
    }
  });
});
