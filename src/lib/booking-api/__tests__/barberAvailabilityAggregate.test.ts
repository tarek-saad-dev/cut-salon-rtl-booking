import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getBarberAvailableDays,
  getBarberAvailableSlots,
} from "@/lib/booking-api/barber-availability";
import {
  __resetAggregateCapabilityForTests,
  markAggregateDaysUnsupported,
  markAggregateSlotsUnsupported,
  getAggregateDaysCapability,
} from "@/lib/booking-api/aggregate-capability";
import { BookingApiError } from "@/lib/booking-api/errors";

vi.mock("@/lib/booking-api/client", () => ({
  bookingApiRequest: vi.fn(),
}));

vi.mock("@/lib/booking-api/availability", () => ({
  getAvailableDays: vi.fn(),
  getAvailableSlots: vi.fn(),
}));

import { bookingApiRequest } from "@/lib/booking-api/client";
import { getAvailableDays, getAvailableSlots } from "@/lib/booking-api/availability";

const mockedRequest = vi.mocked(bookingApiRequest);
const mockedBranchDays = vi.mocked(getAvailableDays);
const mockedBranchSlots = vi.mocked(getAvailableSlots);

const meta = {
  contractVersion: null,
  contractUnverified: false,
  requestId: null,
  rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
  deprecated: false,
  warning: null,
};

describe("barber availability aggregate vs compat", () => {
  beforeEach(() => {
    __resetAggregateCapabilityForTests();
    mockedRequest.mockReset();
    mockedBranchDays.mockReset();
    mockedBranchSlots.mockReset();
  });

  it("uses dedicated days API with all_public wire scope when supported", async () => {
    mockedRequest.mockResolvedValue({
      data: {
        ok: true,
        days: [{ date: "2026-08-10", available: true, branches: [{ branchCode: "GLEEM", slotsCount: 2 }] }],
      },
      metadata: meta,
      httpStatus: 200,
    });

    const res = await getBarberAvailableDays({
      empId: 5,
      serviceIds: [9],
      scope: "all_branches",
      allowedBranches: [
        { branchCode: "GLEEM", branchName: "Gleem" },
        { branchCode: "CAMP_CAESAR", branchName: "Camp" },
      ],
    });

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(mockedRequest.mock.calls[0][0]).toMatchObject({
      path: "/api/public/booking/barbers/5/availability/days",
      method: "POST",
      body: expect.objectContaining({ scope: "all_public", serviceIds: [9] }),
    });
    expect(mockedBranchDays).not.toHaveBeenCalled();
    expect(res.data.meta?.compatFallback).toBe(false);
    expect(getAggregateDaysCapability()).toBe("supported");
  });

  it("does not probe aggregate again after unsupported; compat only", async () => {
    markAggregateDaysUnsupported();
    mockedBranchDays.mockResolvedValue({
      data: [{ date: "2026-08-10", available: true }],
      metadata: meta,
      httpStatus: 200,
    });

    const res = await getBarberAvailableDays({
      empId: 5,
      serviceIds: [9],
      scope: "all_branches",
      allowedBranches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
    });

    expect(mockedRequest).not.toHaveBeenCalled();
    expect(mockedBranchDays).toHaveBeenCalled();
    expect(res.data.meta?.compatFallback).toBe(true);
  });

  it("falls back to compat only after primary miss — not in parallel", async () => {
    const order: string[] = [];
    mockedRequest.mockImplementation(async () => {
      order.push("primary");
      throw new BookingApiError({
        message: "missing",
        code: "NOT_FOUND",
        httpStatus: 404,
      });
    });
    mockedBranchDays.mockImplementation(async () => {
      order.push("compat");
      return {
        data: [{ date: "2026-08-11", available: true }],
        metadata: meta,
        httpStatus: 200,
      };
    });

    await getBarberAvailableDays({
      empId: 5,
      serviceIds: [9],
      scope: "all_branches",
      allowedBranches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
    });

    expect(order).toEqual(["primary", "compat"]);
  });

  it("uses dedicated slots API when live", async () => {
    mockedRequest.mockResolvedValue({
      data: {
        ok: true,
        slots: [
          {
            time: "10:00",
            available: true,
            branchCode: "GLEEM",
            date: "2026-08-10",
          },
        ],
      },
      metadata: meta,
      httpStatus: 200,
    });

    const res = await getBarberAvailableSlots({
      empId: 5,
      serviceIds: [9],
      scope: "all_branches",
      date: "2026-08-10",
      allowedBranches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
    });

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(mockedRequest.mock.calls[0][0]).toMatchObject({
      path: "/api/public/booking/barbers/5/availability/slots",
      body: expect.objectContaining({ scope: "all_public" }),
    });
    expect(mockedBranchSlots).not.toHaveBeenCalled();
    expect(res.data.meta?.compatFallback).toBe(false);
  });

  it("skips aggregate slots probe when capability is unsupported", async () => {
    markAggregateSlotsUnsupported();
    mockedBranchSlots.mockResolvedValue({
      data: [{ time: "11:00", available: true, empId: 5 }],
      metadata: meta,
      httpStatus: 200,
    });

    await getBarberAvailableSlots({
      empId: 5,
      serviceIds: [9],
      scope: "specific_branch",
      branchCode: "GLEEM",
      date: "2026-08-10",
      allowedBranches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
    });

    expect(mockedRequest).not.toHaveBeenCalled();
    expect(mockedBranchSlots).toHaveBeenCalled();
  });
});
