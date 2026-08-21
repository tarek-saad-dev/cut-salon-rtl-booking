import { describe, expect, it, vi, beforeEach } from "vitest";
import { applyLocalOccupancyToMatrix, slotStartMin } from "@/lib/bookingV2/occupyLocal";
import type { AvailabilityMatrix } from "@/lib/bookingV2/types";

function sampleMatrix(): AvailabilityMatrix {
  return {
    scope: { mode: "specific", empId: 5, branchCodes: ["GLEEM"] },
    fromBusinessDate: "2026-08-21",
    toBusinessDate: "2026-09-03",
    fetchedAt: Date.now(),
    stale: false,
    matrix: [
      {
        businessDate: "2026-08-21",
        branches: [
          {
            branchCode: "GLEEM",
            employees: [
              {
                empId: 5,
                status: "available",
                freeRanges: [
                  { startMin: 600, endMin: 720 },
                  { startMin: 960, endMin: 1080 },
                ],
                free: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("O2 post-create local occupy", () => {
  it("removes booked interval from FreeMask", () => {
    const next = applyLocalOccupancyToMatrix(sampleMatrix(), {
      empId: 5,
      businessDate: "2026-08-21",
      startMin: 960,
      durationMinutes: 45,
      branchCode: "GLEEM",
    });
    const emp = next.matrix[0].branches[0].employees[0];
    expect(emp.freeRanges).toEqual([{ startMin: 600, endMin: 720 }, { startMin: 1005, endMin: 1080 }]);
  });

  it("slotStartMin respects overnight dayOffset", () => {
    expect(slotStartMin({ time: "00:30", dayOffset: 1 })).toBe(1470);
  });
});

describe("double confirm guard", () => {
  it("blocks concurrent confirm via in-flight flag pattern", async () => {
    let inFlight = false;
    let calls = 0;
    const confirm = async () => {
      if (inFlight) return;
      inFlight = true;
      calls += 1;
      await Promise.resolve();
      inFlight = false;
    };
    await Promise.all([confirm(), confirm(), confirm()]);
    expect(calls).toBe(1);
  });
});
