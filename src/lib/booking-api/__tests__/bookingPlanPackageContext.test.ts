import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetPlanSession, getPlanSession } from "../plan-session";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({
      "x-booking-contract-version": "booking-public-v1",
      "x-request-id": "req-pkg",
    }),
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

describe("createBookingPlan package context", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
    _resetPlanSession();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("serializes packageId and addonProIds on POST /plan body", async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse({
        ok: true,
        plan: {
          contractVersion: "booking-plan-v1",
          branch: { branchCode: "GLEEM", branchName: "Gleem" },
          mode: "any_barber",
          date: "2026-09-16",
          time: "11:00",
          dayOffset: 0,
          services: [
            { serviceId: 1049, nameEn: "Advanced Cut", price: 1500, durationMinutes: 40 },
            { serviceId: 1086, nameEn: "City Visit", price: 500, durationMinutes: 90 },
          ],
          totalDurationMinutes: 200,
          total: 2000,
          planToken: "tok_pkg_2",
          planFingerprint: "fp_pkg",
        },
      }),
    );

    const { createBookingPlan } = await import("../booking");
    const res = await createBookingPlan({
      branchCode: "GLEEM",
      customer: { name: "Test", phone: "01012126899" },
      mode: "nearest",
      serviceIds: [1049, 10, 22, 32, 1080, 1081, 1082, 12, 1086],
      packageId: 2,
      addonProIds: [1086],
      date: "2026-09-16",
      time: "11:00",
      dayOffset: 0,
    });

    expect(mockFetch).toHaveBeenCalled();
    const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      packageId?: number;
      addonProIds?: number[];
      serviceIds: number[];
    };
    expect(body.packageId).toBe(2);
    expect(body.addonProIds).toEqual([1086]);
    expect(body.serviceIds).toContain(1086);
    expect(res.data.totalPrice).toBe(2000);
    expect(res.data.totalDurationMinutes).toBe(200);
    expect(getPlanSession()?.packageId).toBe(2);
    expect(getPlanSession()?.addonProIds).toEqual([1086]);
  });

  it("serializes packageId and addonProIds on POST /create body", async () => {
    const { savePlanSession } = await import("../plan-session");
    const { _clearAllMutations } = await import("../idempotency");
    _clearAllMutations();
    savePlanSession(
      {
        plan: [],
        totalDurationMinutes: 200,
        totalPrice: 2000,
        bookingCodes: [],
        planToken: "tok_pkg_2",
        planFingerprint: "fp_pkg",
      },
      {
        branchCode: "GLEEM",
        mode: "nearest",
        serviceIds: [1049, 1086],
        packageId: 2,
        addonProIds: [1086],
        date: "2026-09-16",
        time: "11:00",
      },
    );

    mockFetch.mockResolvedValueOnce(
      okResponse({ ok: true, booking: { bookingCode: "BK-PKG" } }),
    );

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({
      plan: {
        plan: [],
        totalDurationMinutes: 200,
        totalPrice: 2000,
        bookingCodes: [],
        planToken: "tok_pkg_2",
        planFingerprint: "fp_pkg",
      },
      branchCode: "GLEEM",
      customer: { name: "Test", phone: "01012126899" },
      serviceIds: [1049, 1086],
      packageId: 2,
      addonProIds: [1086],
      date: "2026-09-16",
      time: "11:00",
      mode: "nearest",
    });

    const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      packageId?: number;
      addonProIds?: number[];
      planToken?: string;
    };
    expect(body.packageId).toBe(2);
    expect(body.addonProIds).toEqual([1086]);
    expect(body.planToken).toBe("tok_pkg_2");
  });
});
