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

describe("regular package (October, packageId 7) booking requests", () => {
  const OCTOBER_SERVICE_IDS = [9, 10, 22, 29];
  const priceKeys = ["price", "totalPrice", "total", "packagePrice"];

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
    _resetPlanSession();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function lastBody() {
    const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  }

  it("sends packageId 7 on check-slot without any client price", async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true, available: true }));
    const { checkSlot } = await import("../availability");
    await checkSlot({
      branchCode: "CAMP_CAESAR",
      date: "2026-10-10",
      time: "12:00",
      mode: "nearest",
      serviceIds: OCTOBER_SERVICE_IDS,
      packageId: 7,
    });
    const body = lastBody();
    expect(String(mockFetch.mock.calls.at(-1)?.[0])).toContain("/api/public/booking/check-slot");
    expect(body.packageId).toBe(7);
    expect(body.serviceIds).toEqual(OCTOBER_SERVICE_IDS);
    for (const key of priceKeys) expect(body).not.toHaveProperty(key);
  });

  it("sends packageId 7 on plan and keeps the backend-calculated total", async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse({
        ok: true,
        plan: {
          contractVersion: "booking-plan-v1",
          branch: { branchCode: "GLEEM", branchName: "Gleem" },
          mode: "any_barber",
          date: "2026-10-10",
          time: "12:00",
          dayOffset: 0,
          services: [
            { serviceId: 9, nameEn: "Hair Cut", price: 333, durationMinutes: 30 },
            { serviceId: 10, nameEn: "Beard Styling & Fade", price: 0, durationMinutes: 20 },
            { serviceId: 22, nameEn: "Hair Oil Treatment", price: 0, durationMinutes: 5 },
            { serviceId: 29, nameEn: "Classic Skin Care", price: 0, durationMinutes: 30 },
          ],
          totalDurationMinutes: 85,
          total: 333,
          planToken: "tok_pkg_7",
          planFingerprint: "fp_pkg_7",
        },
      }),
    );

    const { createBookingPlan } = await import("../booking");
    const res = await createBookingPlan({
      branchCode: "GLEEM",
      customer: { name: "Test", phone: "01012126899" },
      mode: "nearest",
      serviceIds: OCTOBER_SERVICE_IDS,
      packageId: 7,
      date: "2026-10-10",
      time: "12:00",
      dayOffset: 0,
    });

    const body = lastBody();
    expect(body.packageId).toBe(7);
    expect(body.serviceIds).toEqual(OCTOBER_SERVICE_IDS);
    for (const key of priceKeys) expect(body).not.toHaveProperty(key);
    expect(res.data.totalPrice).toBe(333);
    expect(res.data.totalDurationMinutes).toBe(85);
    expect(getPlanSession()?.packageId).toBe(7);
  });

  it("keeps packageId 7 on the final create request", async () => {
    const { savePlanSession } = await import("../plan-session");
    const { _clearAllMutations } = await import("../idempotency");
    _clearAllMutations();
    const plan = {
      plan: [],
      totalDurationMinutes: 85,
      totalPrice: 333,
      bookingCodes: [],
      planToken: "tok_pkg_7",
      planFingerprint: "fp_pkg_7",
    };
    savePlanSession(plan, {
      branchCode: "GLEEM",
      mode: "nearest",
      serviceIds: OCTOBER_SERVICE_IDS,
      packageId: 7,
      date: "2026-10-10",
      time: "12:00",
    });
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true, booking: { bookingCode: "BK-OCT" } }));

    const { submitBookingFromPlan } = await import("../booking");
    await submitBookingFromPlan({
      plan,
      branchCode: "GLEEM",
      customer: { name: "Test", phone: "01012126899" },
      serviceIds: OCTOBER_SERVICE_IDS,
      packageId: 7,
      date: "2026-10-10",
      time: "12:00",
      mode: "nearest",
    });

    const body = lastBody();
    expect(String(mockFetch.mock.calls.at(-1)?.[0])).toContain("/api/public/booking/create");
    expect(body.packageId).toBe(7);
    expect(body.planToken).toBe("tok_pkg_7");
    for (const key of priceKeys) expect(body).not.toHaveProperty(key);
  });
});
