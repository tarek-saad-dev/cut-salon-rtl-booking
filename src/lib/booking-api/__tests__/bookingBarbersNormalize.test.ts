import { describe, it, expect, vi, beforeEach } from "vitest";

const { bookingApiRequest } = vi.hoisted(() => ({
  bookingApiRequest: vi.fn(),
}));

vi.mock("../client", () => ({
  bookingApiRequest: (...a: unknown[]) => bookingApiRequest(...a),
}));

import {
  listGlobalBarbers,
  getPublicBarberProfile,
  getBarberLocation,
} from "../barbers";

function wireOk(barbers: unknown[]) {
  bookingApiRequest.mockResolvedValue({
    data: { ok: true, barbers },
    metadata: {
      contractVersion: "booking-public-v1",
      contractUnverified: false,
      requestId: "req-barber",
      rateLimit: {
        limit: 100,
        remaining: 99,
        resetAt: null,
        retryAfterSeconds: null,
      },
      deprecated: false,
      warning: null,
    },
  });
}

describe("booking barbers normalize (8B3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps CAMP_CAESAR in barber branches for cross-branch booking", async () => {
    wireOk([
      {
        id: 5,
        name: "أحمد",
        isBookableOnline: true,
        serviceIds: [10, 11],
        branches: [
          { branchCode: "GLEEM", branchName: "جليم" },
          { branchCode: "CAMP_CAESAR", branchName: "Camp Caesar" },
          { branchCode: "SMOUHA", branchName: "سموحة" },
        ],
      },
    ]);

    const res = await listGlobalBarbers();
    expect(res.data[0].branches?.map((b) => b.branchCode)).toEqual([
      "GLEEM",
      "CAMP_CAESAR",
      "SMOUHA",
    ]);
  });

  it("getPublicBarberProfile resolves by empId with serviceIds", async () => {
    wireOk([
      {
        empId: 9,
        nameAr: "زياد",
        isBookableOnline: true,
        serviceIds: [10],
        branches: [{ branchCode: "GLEEM", branchName: "جليم" }],
      },
      {
        id: 5,
        name: "أحمد",
        isBookableOnline: true,
        serviceIds: [11],
        branches: [{ branchCode: "SMOUHA", branchName: "سموحة" }],
      },
    ]);

    const res = await getPublicBarberProfile(9);
    expect(res.data?.id).toBe(9);
    expect(res.data?.name).toBe("زياد");
    expect(res.data?.serviceIds).toEqual([10]);
    expect(res.data?.branches?.[0].branchCode).toBe("GLEEM");
  });

  it("getBarberLocation nulls CAMP_CAESAR branch", async () => {
    bookingApiRequest.mockResolvedValue({
      data: {
        ok: true,
        date: "2026-07-27",
        isWorking: true,
        status: "working",
        branch: { branchCode: "CAMP_CAESAR", branchName: "Camp Caesar" },
      },
      metadata: {
        contractVersion: "booking-public-v1",
        contractUnverified: false,
        requestId: "req-loc",
        rateLimit: {
          limit: 100,
          remaining: 99,
          resetAt: null,
          retryAfterSeconds: null,
        },
        deprecated: false,
        warning: null,
      },
    });

    const res = await getBarberLocation(5, { date: "2026-07-27" });
    expect(res.data.branch).toBeNull();
    expect(res.data.isWorking).toBe(true);
  });
});
