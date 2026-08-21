import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  loadBarberProfile,
  seedBarberProfileCache,
  peekBarberProfileCache,
  prefetchBarberProfile,
  __resetBarberProfileCacheForTests,
  seedIsCompleteForBranchDecision,
} from "@/lib/booking-api/barber-profile-cache";
import { prioritizeBarberProfilePrefetch, __resetBarberPrefetchForTests } from "@/lib/booking-api/barber-profile-prefetch";
import {
  toWireAvailabilityScope,
  __resetAggregateCapabilityForTests,
  markAggregateDaysSupported,
  getAggregateDaysCapability,
} from "@/lib/booking-api/aggregate-capability";
import { getBookingSteps } from "@/lib/booking-api/booking-steps";

vi.mock("@/lib/booking-api/client", () => ({
  bookingApiRequest: vi.fn(),
}));

import { bookingApiRequest } from "@/lib/booking-api/client";

const mockedRequest = vi.mocked(bookingApiRequest);

describe("barber profile cache + prefetch", () => {
  beforeEach(() => {
    __resetBarberProfileCacheForTests();
    __resetBarberPrefetchForTests();
    __resetAggregateCapabilityForTests();
    mockedRequest.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("seed is complete when publicBranches array is present", () => {
    expect(
      seedIsCompleteForBranchDecision({
        empId: 5,
        publicBranches: [
          { branchCode: "GLEEM", branchName: "Gleem" },
          { branchCode: "CAMP_CAESAR", branchName: "Camp" },
        ],
      }),
    ).toBe(true);
    expect(seedIsCompleteForBranchDecision({ empId: 5 })).toBe(false);
  });

  it("cached Kareem profile renders without network", async () => {
    seedBarberProfileCache(
      {
        empId: 5,
        displayName: "Kareem",
        publicBranches: [
          { branchCode: "GLEEM", branchName: "Gleem" },
          { branchCode: "CAMP_CAESAR", branchName: "Camp" },
        ],
        serviceIds: [9],
      },
      { provisional: false },
    );
    expect(peekBarberProfileCache(5)?.branches).toHaveLength(2);

    const { promise } = loadBarberProfile(5);
    const result = await promise;
    expect(result.meta.cacheHit).toBe(true);
    expect(result.profile?.id).toBe(5);
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("provisional seed returns immediately and revalidates in background", async () => {
    let resolveRequest!: (v: unknown) => void;
    mockedRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }) as never,
    );

    seedBarberProfileCache({
      empId: 5,
      displayName: "Kareem",
      publicBranches: [
        { branchCode: "GLEEM", branchName: "Gleem" },
        { branchCode: "CAMP_CAESAR", branchName: "Camp" },
      ],
    });

    const { promise, cached } = loadBarberProfile(5);
    expect(cached?.branches).toHaveLength(2);
    expect(mockedRequest).toHaveBeenCalledTimes(1);

    resolveRequest({
      data: {
        barber: {
          id: 5,
          name: "Kareem",
          branches: [
            { branchCode: "GLEEM", branchName: "Gleem" },
            { branchCode: "CAMP_CAESAR", branchName: "Camp" },
          ],
          serviceIds: [9, 10],
        },
      },
      metadata: {
        contractVersion: null,
        contractUnverified: false,
        requestId: null,
        rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
        deprecated: false,
        warning: null,
      },
      httpStatus: 200,
    });

    const result = await promise;
    expect(result.profile?.serviceIds).toEqual([9, 10]);
    expect(peekBarberProfileCache(5)?.serviceIds).toEqual([9, 10]);
  });

  it("prefetch and click share one in-flight request", async () => {
    let resolveRequest!: (v: unknown) => void;
    mockedRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }) as never,
    );

    const p1 = prefetchBarberProfile(5);
    const { promise: p2 } = loadBarberProfile(5);
    expect(mockedRequest).toHaveBeenCalledTimes(1);

    resolveRequest({
      data: {
        barber: {
          id: 5,
          name: "كريم",
          nameEn: "Kareem",
          branches: [
            { branchCode: "GLEEM", branchName: "Gleem" },
            { branchCode: "CAMP_CAESAR", branchName: "Camp" },
          ],
          serviceIds: [9],
        },
      },
      metadata: {
        contractVersion: null,
        contractUnverified: false,
        requestId: null,
        rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
        deprecated: false,
        warning: null,
      },
      httpStatus: 200,
    });

    const [a, b] = await Promise.all([p1, p2]);
    expect(a.profile?.id).toBe(5);
    expect(b.profile?.id).toBe(5);
    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it("reopening uses session cache", async () => {
    seedBarberProfileCache(
      {
        empId: 5,
        displayName: "Kareem",
        publicBranches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
      },
      { provisional: false },
    );
    await loadBarberProfile(5).promise;
    mockedRequest.mockClear();
    const second = await loadBarberProfile(5).promise;
    expect(second.meta.cacheHit).toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("aborting one consumer does not cancel shared request for others", async () => {
    let resolveRequest!: (v: unknown) => void;
    mockedRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }) as never,
    );

    const c1 = new AbortController();
    const { promise: p1, release: r1 } = loadBarberProfile(5, { signal: c1.signal });
    const { promise: p2 } = loadBarberProfile(5);
    c1.abort();
    r1();

    resolveRequest({
      data: {
        barber: {
          id: 5,
          name: "Kareem",
          branches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
        },
      },
      metadata: {
        contractVersion: null,
        contractUnverified: false,
        requestId: null,
        rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
        deprecated: false,
        warning: null,
      },
      httpStatus: 200,
    });

    const result = await p2;
    expect(result.profile?.id).toBe(5);
    await expect(p1).resolves.toBeTruthy();
  });

  it("prioritize enqueue does not throw", () => {
    prioritizeBarberProfilePrefetch(5, {
      empId: 5,
      publicBranches: [{ branchCode: "GLEEM", branchName: "Gleem" }],
    });
    expect(peekBarberProfileCache(5)?.id).toBe(5);
  });

  it("keeps cached profile visible when forced refresh fails", async () => {
    seedBarberProfileCache(
      {
        empId: 5,
        displayName: "Kareem",
        publicBranches: [
          { branchCode: "GLEEM", branchName: "Gleem" },
          { branchCode: "CAMP_CAESAR", branchName: "Camp" },
        ],
      },
      { provisional: false },
    );
    expect(peekBarberProfileCache(5)?.branches).toHaveLength(2);
    mockedRequest.mockRejectedValue(new Error("network down"));
    await expect(loadBarberProfile(5, { force: true }).promise).rejects.toThrow();
    expect(peekBarberProfileCache(5)?.branches).toHaveLength(2);
  });
});

describe("aggregate capability + wire scope", () => {
  beforeEach(() => {
    __resetAggregateCapabilityForTests();
  });

  it("maps all_branches to all_public for the wire", () => {
    expect(toWireAvailabilityScope("all_branches")).toBe("all_public");
    expect(toWireAvailabilityScope("specific_branch")).toBe("specific_branch");
  });

  it("records supported capability", () => {
    markAggregateDaysSupported();
    expect(getAggregateDaysCapability()).toBe("supported");
  });
});

describe("optimistic multi-branch steps with seed", () => {
  it("multi-branch starts at date without appointment_scope", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: false,
        barberResolved: true,
        multiBranchBarber: true,
        availabilityScope: null,
      }),
    ).toEqual(["date", "service", "time", "details", "review"]);
  });

  it("specific_branch no longer includes branch picker", () => {
    expect(
      getBookingSteps({
        entryMode: "barber_first",
        initialMode: "specific",
        branchResolved: false,
        barberResolved: true,
        multiBranchBarber: true,
        availabilityScope: "specific_branch",
      }),
    ).not.toContain("branch");
  });
});
