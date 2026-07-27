import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("available-days isAvailable compat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes isAvailable into available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "x-booking-contract-version": "booking-public-v1",
        "x-request-id": "req-days",
      }),
      text: async () =>
        JSON.stringify({
          ok: true,
          days: [
            { date: "2026-07-28", isAvailable: true, status: "open" },
            { date: "2026-07-29", isAvailable: false, status: "global_leave" },
          ],
        }),
    } as unknown as Response);

    const { getAvailableDays } = await import("../availability");
    const { _resetDedup } = await import("../request-dedup");
    _resetDedup();
    const res = await getAvailableDays({
      branchCode: "GLEEM",
      serviceIds: [1],
      mode: "nearest",
    });
    expect(res.data[0].available).toBe(true);
    expect(res.data[1].available).toBe(false);
    expect(res.data[1].reason).toBe("global_leave");
  });
});
