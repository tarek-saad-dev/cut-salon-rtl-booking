import { describe, it, expect, vi, beforeEach } from "vitest";

const { bookingApiRequest } = vi.hoisted(() => ({
  bookingApiRequest: vi.fn(),
}));

vi.mock("../client", () => ({
  bookingApiRequest: (...a: unknown[]) => bookingApiRequest(...a),
}));

import {
  getCrossBranchAvailability,
  crossBranchSlotKey,
  cairoTodayYmd,
} from "../barbers";

describe("getCrossBranchAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs serviceIds + dateFrom + days and normalizes slots", async () => {
    bookingApiRequest.mockResolvedValue({
      data: {
        ok: true,
        barber: { empId: 12, nameAr: "زياد" },
        branches: [
          { branchCode: "GLEEM", branchName: "جليم" },
          { branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" },
        ],
        days: ["2026-07-28"],
        slots: [
          {
            branchCode: "GLEEM",
            branchName: "جليم",
            date: "2026-07-28",
            time: "13:00",
            dayOffset: 0,
          },
          {
            branchCode: "CAMP_CAESAR",
            branchName: "كامب شيزار",
            date: "2026-07-28",
            time: "13:00",
            dayOffset: 0,
          },
          {
            branchCode: "GLEEM",
            branchName: "جليم",
            date: "2026-07-28",
            time: "01:00",
            dayOffset: 1,
          },
        ],
        meta: { slotCount: 3, branchCount: 2, dayCount: 1 },
      },
      metadata: {
        contractVersion: "booking-public-v1",
        contractUnverified: false,
        requestId: "req-x",
        rateLimit: {
          limit: 30,
          remaining: 29,
          resetAt: null,
          retryAfterSeconds: null,
        },
      },
      httpStatus: 200,
    });

    const res = await getCrossBranchAvailability(12, {
      serviceIds: [9, 9],
      dateFrom: "2026-07-28",
      days: 7,
    });

    expect(bookingApiRequest).toHaveBeenCalledTimes(1);
    const opts = bookingApiRequest.mock.calls[0][0];
    expect(opts.method).toBe("POST");
    expect(opts.path).toBe(
      "/api/public/booking/barbers/12/cross-branch-availability",
    );
    expect(opts.body).toEqual({
      serviceIds: [9],
      dateFrom: "2026-07-28",
      days: 7,
    });
    expect(res.data.branches).toHaveLength(2);
    expect(res.data.slots).toHaveLength(3);
    expect(res.data.slots[2].dayOffset).toBe(1);

    const k1 = crossBranchSlotKey(res.data.slots[0]);
    const k2 = crossBranchSlotKey(res.data.slots[1]);
    expect(k1).not.toBe(k2);
    expect(k1).toContain("GLEEM");
    expect(k2).toContain("CAMP_CAESAR");
  });

  it("defaults dateFrom to Cairo today when omitted", async () => {
    bookingApiRequest.mockResolvedValue({
      data: {
        ok: true,
        barber: { empId: 18, nameAr: "احمد" },
        branches: [{ branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" }],
        days: [],
        slots: [],
      },
      metadata: {
        contractVersion: "booking-public-v1",
        contractUnverified: false,
        requestId: "req-y",
        rateLimit: {
          limit: 30,
          remaining: 29,
          resetAt: null,
          retryAfterSeconds: null,
        },
      },
      httpStatus: 200,
    });

    await getCrossBranchAvailability(18, { serviceIds: [9] });
    const body = bookingApiRequest.mock.calls[0][0].body;
    expect(body.dateFrom).toBe(cairoTodayYmd());
    expect(body.days).toBe(7);
  });
});
