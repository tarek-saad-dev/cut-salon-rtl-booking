import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("lookupBooking live envelope normalize", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("unwraps booking.code envelope into PublicBooking", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "x-booking-contract-version": "booking-public-v1" }),
      text: async () =>
        JSON.stringify({
          ok: true,
          booking: {
            code: "BK-LOOKUP-1",
            status: "confirmed",
            calendarDate: "2026-07-28",
            time: "12:30",
            barber: { empId: 7, nameAr: "محمد" },
            branch: { branchCode: "GLEEM", branchName: "جليم" },
            servicesSummary: "حلاقة شعر",
            total: 200,
            totalDurationMinutes: 30,
            canCancel: true,
          },
          bookingAccessToken: "tok_lookup",
          meta: { ownership: "owner" },
        }),
    } as unknown as Response);

    const { lookupBooking } = await import("../booking");
    const res = await lookupBooking("BK-LOOKUP-1", { bookingAccessToken: "tok_lookup" });

    expect(res.data.bookingCode).toBe("BK-LOOKUP-1");
    expect(res.data.status).toBe("confirmed");
    expect(res.data.barberName).toBe("محمد");
    expect(res.data.branchCode).toBe("GLEEM");
    expect(res.data.ownershipLevel).toBe("full");
    expect(res.data.canCancel).toBe(true);
  });
});
