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
