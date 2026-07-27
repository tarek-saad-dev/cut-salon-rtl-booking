import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { _resetPlanSession, getPlanSession } from "../plan-session";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({
      "x-booking-contract-version": "booking-public-v1",
      "x-request-id": "req-plan",
    }),
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

describe("createBookingPlan nested plan-v1 shape", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
    _resetPlanSession();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("extracts planToken from nested booking-plan-v1 object", async () => {
    mockFetch.mockResolvedValueOnce(
      okResponse({
        ok: true,
        plan: {
          contractVersion: "booking-plan-v1",
          branch: { branchCode: "GLEEM", branchName: "جليم" },
          barber: { empId: 12, nameAr: "زياد" },
          date: "2026-07-28",
          time: "13:00",
          dayOffset: 0,
          services: [
            {
              serviceId: 9,
              nameAr: "حلاقة شعر",
              price: 200,
              durationMinutes: 30,
            },
          ],
          totalDurationMinutes: 30,
          total: 200,
          planToken: "nested_plan_tok_abc",
          planFingerprint: "fp_nested",
        },
      }),
    );

    const { createBookingPlan } = await import("../booking");
    const res = await createBookingPlan({
      branchCode: "GLEEM",
      customer: { name: "Test", phone: "01000000000" },
      serviceIds: [9],
      date: "2026-07-28",
      time: "13:00",
      dayOffset: 0,
      mode: "specific",
      empId: 12,
    });

    expect(res.data.planToken).toBe("nested_plan_tok_abc");
    expect(res.data.planFingerprint).toBe("fp_nested");
    expect(res.data.totalPrice).toBe(200);
    expect(res.data.branchCode).toBe("GLEEM");
    expect(res.data.plan[0]?.serviceId).toBe(9);
    expect(getPlanSession()?.planToken).toBe("nested_plan_tok_abc");
  });
});
