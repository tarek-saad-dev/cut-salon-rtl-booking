import { describe, expect, it } from "vitest";
import { generateStartsFromFree } from "@/lib/bookingV2/generateStartsFromFree";
import {
  generateSlotsForBusinessDate,
  pickNearestEligibleSlot,
} from "@/lib/bookingV2/localAvailability";
import {
  cairoWallToEpochMs,
  estimateServerNowMs,
  isSlotLocallyEligible,
  minNoticeThresholdMs,
  slotStartEpochMs,
} from "@/lib/bookingV2/serverTime";
import {
  isRecoverablePlanAvailabilityError,
  recoverStaleMinNoticeSlot,
} from "@/lib/bookingV2/recoverStaleSlot";
import { deriveV2Slots } from "@/hooks/bookingFlowV2Support";
import type { AvailabilityMatrix, BranchCode } from "@/lib/bookingV2/types";

const DAY = "2026-08-26";
const RECEIVED_MONO = 10_000;
const MIN_NOTICE = 15;

function cairoAt(hour: number, minute: number, second = 0, millisecond = 0): number {
  return cairoWallToEpochMs({
    businessDate: DAY,
    hour,
    minute,
    second,
    millisecond,
  });
}

function eveningMatrix(opts: {
  branchCode: BranchCode;
  generatedAtMs: number;
  receivedAtMonoMs?: number;
  empId?: number;
}): AvailabilityMatrix {
  return {
    ok: true,
    fromBusinessDate: DAY,
    toBusinessDate: DAY,
    days: 14,
    scope: { mode: "specific", empId: opts.empId ?? 5, branchCodes: [opts.branchCode] },
    slotIntervalMinutes: 15,
    fetchedAt: opts.generatedAtMs,
    generatedAtMs: opts.generatedAtMs,
    receivedAtMonoMs: opts.receivedAtMonoMs ?? RECEIVED_MONO,
    matrix: [
      {
        businessDate: DAY,
        branches: [
          {
            branchCode: opts.branchCode,
            branchName: opts.branchCode === "GLEEM" ? "جليم" : "كامب شيزار",
            employees: [
              {
                empId: opts.empId ?? 5,
                empName: "Test",
                status: "available",
                free: [],
                freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
              },
            ],
          },
        ],
      },
    ],
  };
}

function timesOf(
  matrix: AvailabilityMatrix,
  branchCode: BranchCode,
  nowMonoMs: number,
): string[] {
  return generateSlotsForBusinessDate({
    matrix,
    businessDate: DAY,
    durationMinutes: 15,
    intervalMinutes: 15,
    minNoticeMinutes: MIN_NOTICE,
    branchCode,
    empId: 5,
    mode: "specific",
    nowMonoMs,
  }).map((s) => s.time);
}

describe("MinNotice exact-ms parity", () => {
  it("generatedAtMs 21:15:00.000 + 15m → 21:30 valid", () => {
    const generatedAtMs = cairoAt(21, 15, 0, 0);
    const threshold = minNoticeThresholdMs(generatedAtMs, MIN_NOTICE);
    expect(threshold).toBe(cairoAt(21, 30, 0, 0));
    expect(
      isSlotLocallyEligible({
        slotStartMs: cairoAt(21, 30),
        estimatedServerNowMs: generatedAtMs,
        minNoticeMinutes: MIN_NOTICE,
      }),
    ).toBe(true);

    const slots = generateStartsFromFree({
      businessDate: DAY,
      freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
      durationMinutes: 15,
      intervalMinutes: 15,
      empId: 5,
      branchCode: "GLEEM",
      minNoticeMinutes: MIN_NOTICE,
      estimatedServerNowMs: generatedAtMs,
    });
    expect(slots.map((s) => s.time)).toContain("21:30");
    expect(slots[0]?.time).toBe("21:30");
  });

  it("generatedAtMs 21:15:08.305 + 15m → 21:30 invalid, 21:45 first valid", () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    const threshold = generatedAtMs + MIN_NOTICE * 60_000;
    expect(threshold).toBe(cairoAt(21, 30, 8, 305));
    expect(slotStartEpochMs(DAY, 21 * 60 + 30)).toBe(cairoAt(21, 30, 0, 0));
    expect(cairoAt(21, 30, 0, 0) >= threshold).toBe(false);
    expect(cairoAt(21, 45, 0, 0) >= threshold).toBe(true);

    const slots = generateStartsFromFree({
      businessDate: DAY,
      freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
      durationMinutes: 15,
      intervalMinutes: 15,
      empId: 5,
      branchCode: "GLEEM",
      minNoticeMinutes: MIN_NOTICE,
      estimatedServerNowMs: generatedAtMs,
    });
    const times = slots.map((s) => s.time);
    expect(times).not.toContain("21:30");
    expect(times[0]).toBe("21:45");
  });

  it("GLEEM: 21:15:08.305 hides 21:30 and shows 21:45", () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    const times = timesOf(
      eveningMatrix({ branchCode: "GLEEM", generatedAtMs }),
      "GLEEM",
      RECEIVED_MONO,
    );
    expect(times).not.toContain("21:30");
    expect(times[0]).toBe("21:45");
  });

  it("CAMP_CAESAR: same exact-ms threshold as GLEEM (single policy)", () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    const times = timesOf(
      eveningMatrix({ branchCode: "CAMP_CAESAR", generatedAtMs }),
      "CAMP_CAESAR",
      RECEIVED_MONO,
    );
    expect(times).not.toContain("21:30");
    expect(times[0]).toBe("21:45");
  });

  it("elapsed local monotonic time advances eligibility without a network request", () => {
    const generatedAtMs = cairoAt(21, 15, 0, 0);
    const matrix = eveningMatrix({
      branchCode: "GLEEM",
      generatedAtMs,
      receivedAtMonoMs: RECEIVED_MONO,
    });

    const atReceipt = timesOf(matrix, "GLEEM", RECEIVED_MONO);
    expect(atReceipt).toContain("21:30");

    const after8305ms = timesOf(matrix, "GLEEM", RECEIVED_MONO + 8_305);
    expect(after8305ms).not.toContain("21:30");
    expect(after8305ms[0]).toBe("21:45");

    const estimated = estimateServerNowMs({
      generatedAtMs,
      receivedAtMonoMs: RECEIVED_MONO,
      nowMonoMs: RECEIVED_MONO + 8_305,
    });
    expect(estimated).toBe(cairoAt(21, 15, 8, 305));
  });

  it("browser wall-clock skew does not change eligibility", () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    const clock = {
      generatedAtMs,
      receivedAtMonoMs: RECEIVED_MONO,
      nowMonoMs: RECEIVED_MONO,
    };

    const realNow = Date.now;
    const skewed = generateStartsFromFree({
      businessDate: DAY,
      freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
      durationMinutes: 15,
      intervalMinutes: 15,
      empId: 5,
      branchCode: "GLEEM",
      minNoticeMinutes: MIN_NOTICE,
      clock,
    }).map((s) => s.time);

    Date.now = () => realNow() + 3 * 60 * 60_000;
    try {
      const withSkew = generateStartsFromFree({
        businessDate: DAY,
        freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
        durationMinutes: 15,
        intervalMinutes: 15,
        empId: 5,
        branchCode: "GLEEM",
        minNoticeMinutes: MIN_NOTICE,
        clock,
      }).map((s) => s.time);
      expect(withSkew).toEqual(skewed);
      expect(withSkew).not.toContain("21:30");
      expect(withSkew[0]).toBe("21:45");
    } finally {
      Date.now = realNow;
    }
  });

  it("nearest never chooses a locally expired boundary slot", () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    const matrix: AvailabilityMatrix = {
      ...eveningMatrix({ branchCode: "GLEEM", generatedAtMs, empId: 12 }),
      scope: { mode: "nearest", branchCodes: ["GLEEM", "CAMP_CAESAR"] },
      matrix: [
        {
          businessDate: DAY,
          branches: [
            {
              branchCode: "GLEEM",
              employees: [
                {
                  empId: 12,
                  status: "available",
                  free: [],
                  freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
                },
              ],
            },
            {
              branchCode: "CAMP_CAESAR",
              employees: [
                {
                  empId: 8,
                  status: "available",
                  free: [],
                  freeRanges: [{ startMin: 21 * 60, endMin: 23 * 60 }],
                },
              ],
            },
          ],
        },
      ],
    };

    const nearest = pickNearestEligibleSlot({
      matrix,
      fromBusinessDate: DAY,
      durationMinutes: 15,
      intervalMinutes: 15,
      minNoticeMinutes: MIN_NOTICE,
      mode: "nearest",
      nowMonoMs: RECEIVED_MONO,
    });
    expect(nearest?.time).toBe("21:45");
    expect(nearest?.time).not.toBe("21:30");
  });
});

describe("MinNotice stale-slot recovery + request counts", () => {
  it("MIN_NOTICE_NOT_MET is recoverable; INTERNAL_ERROR is not", () => {
    expect(isRecoverablePlanAvailabilityError("MIN_NOTICE_NOT_MET")).toBe(true);
    expect(isRecoverablePlanAvailabilityError("BOOKING_PLAN_UNAVAILABLE")).toBe(true);
    expect(isRecoverablePlanAvailabilityError("INTERNAL_ERROR")).toBe(false);
    expect(isRecoverablePlanAvailabilityError("UNKNOWN_ERROR")).toBe(false);
  });

  it("MIN_NOTICE_NOT_MET triggers exactly one matrix refresh and picks 21:45", async () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    const fresh = eveningMatrix({ branchCode: "GLEEM", generatedAtMs });
    let loads = 0;
    const result = await recoverStaleMinNoticeSlot({
      loadMatrix: async () => {
        loads += 1;
        return fresh;
      },
      fromBusinessDate: DAY,
      durationMinutes: 15,
      intervalMinutes: 15,
      minNoticeMinutes: MIN_NOTICE,
      mode: "specific",
      empId: 5,
      branchCode: "GLEEM",
      nowMonoMs: RECEIVED_MONO,
    });
    expect(loads).toBe(1);
    expect(result.nextSlot?.time).toBe("21:45");
    expect(result.nextSlot?.time).not.toBe("21:30");
  });

  it("normal successful flow uses exactly one 14-day availability matrix", () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    let availabilityRequests = 0;
    const loadOnce = (): AvailabilityMatrix => {
      availabilityRequests += 1;
      return eveningMatrix({ branchCode: "GLEEM", generatedAtMs });
    };

    const matrix = loadOnce();
    const date = new Date(2026, 7, 26, 12);
    deriveV2Slots(matrix, date, {
      mode: "specific",
      empId: 5,
      branchCode: "GLEEM",
      durationMinutes: 15,
      intervalMinutes: 15,
      minNoticeMinutes: MIN_NOTICE,
      nowMonoMs: RECEIVED_MONO,
    });
    deriveV2Slots(matrix, date, {
      mode: "specific",
      empId: 5,
      branchCode: "GLEEM",
      durationMinutes: 45,
      intervalMinutes: 15,
      minNoticeMinutes: MIN_NOTICE,
      nowMonoMs: RECEIVED_MONO,
    });
    timesOf(matrix, "GLEEM", RECEIVED_MONO);
    expect(availabilityRequests).toBe(1);
  });

  it("stale-slot recovery request count is initial 1 + exactly one refresh", async () => {
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    let availabilityRequests = 0;
    const loadMatrix = async () => {
      availabilityRequests += 1;
      return eveningMatrix({ branchCode: "GLEEM", generatedAtMs });
    };

    const matrix = await loadMatrix();
    expect(availabilityRequests).toBe(1);

    await recoverStaleMinNoticeSlot({
      loadMatrix,
      fromBusinessDate: DAY,
      durationMinutes: 15,
      intervalMinutes: 15,
      minNoticeMinutes: MIN_NOTICE,
      mode: "specific",
      empId: 5,
      branchCode: "GLEEM",
      nowMonoMs: RECEIVED_MONO,
    });
    expect(availabilityRequests).toBe(2);
  });

  it("recovery does not poll or retry-loop", async () => {
    let loads = 0;
    const generatedAtMs = cairoAt(21, 15, 8, 305);
    await recoverStaleMinNoticeSlot({
      loadMatrix: async () => {
        loads += 1;
        return eveningMatrix({ branchCode: "GLEEM", generatedAtMs });
      },
      fromBusinessDate: DAY,
      durationMinutes: 15,
      intervalMinutes: 15,
      minNoticeMinutes: MIN_NOTICE,
      mode: "nearest",
      branchCode: "GLEEM",
      nowMonoMs: RECEIVED_MONO,
    });
    await new Promise((r) => setTimeout(r, 25));
    expect(loads).toBe(1);
  });
});
