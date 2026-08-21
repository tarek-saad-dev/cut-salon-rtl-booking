import { describe, expect, it } from "vitest";
import { generateStartsFromFree } from "@/lib/bookingV2/generateStartsFromFree";
import {
  addBusinessDays,
  deriveDayOffsetForLegacyWrite,
  localDateToBusinessDate,
  todayBusinessDate,
} from "@/lib/bookingV2/businessDate";
import { isZeyadBarber, resolveAvailabilityScope, toAvailabilityRequest } from "@/lib/bookingV2/scope";
import {
  generateSlotsForBusinessDate,
  matrixToAvailableDays,
} from "@/lib/bookingV2/localAvailability";
import type { AvailabilityMatrix } from "@/lib/bookingV2/types";

describe("generateStartsFromFree (Hawai FreeRanges)", () => {
  it("generates interval starts that fit in free ranges", () => {
    const slots = generateStartsFromFree({
      businessDate: "2026-08-18",
      freeRanges: [{ startMin: 11 * 60, endMin: 12 * 60 }],
      durationMinutes: 30,
      intervalMinutes: 15,
      empId: 12,
      empName: "زياد",
      branchCode: "GLEEM",
      minNoticeMinutes: 0,
    });
    expect(slots.map((s) => s.time)).toEqual(["11:00", "11:15", "11:30"]);
    expect(slots.every((s) => s.businessDate === "2026-08-18")).toBe(true);
    expect(slots.every((s) => s.dayOffset === 0)).toBe(true);
  });

  it("keeps overnight starts on the same BusinessDate with dayOffset=1", () => {
    const slots = generateStartsFromFree({
      businessDate: "2026-08-20",
      freeRanges: [{ startMin: 23 * 60 + 45, endMin: 25 * 60 + 15 }], // 23:45 → 01:15 exclusive
      durationMinutes: 15,
      intervalMinutes: 15,
      empId: 12,
      branchCode: "GLEEM",
    });
    const times = slots.map((s) => `${s.dayOffset}:${s.time}`);
    expect(times).toContain("0:23:45");
    expect(times).toContain("1:00:00");
    expect(times).toContain("1:00:15");
    expect(times).toContain("1:01:00");
    expect(slots.every((s) => s.businessDate === "2026-08-20")).toBe(true);
    expect(deriveDayOffsetForLegacyWrite(1)).toBe(1);
    expect(localDateToBusinessDate(new Date(2026, 7, 20))).toBe("2026-08-20");
    expect(addBusinessDays("2026-08-20", 1)).toBe("2026-08-21");
  });
});

describe("Zeyad multi-branch scope", () => {
  it("requests GLEEM + CAMP_CAESAR in one scope with from/to", () => {
    const scope = resolveAvailabilityScope({
      mode: "specific",
      empId: 12,
      barber: {
        empId: 12,
        name: "زياد",
        nameEn: "Ziad",
        isBookableOnline: true,
        branches: [
          { branchCode: "GLEEM", branchName: "جليم" },
          { branchCode: "CAMP_CAESAR", branchName: "كامب شيزار" },
        ],
      },
    });
    expect(isZeyadBarber({ empId: 12, name: "زياد" })).toBe(true);
    expect(scope.branchCodes).toEqual(["GLEEM", "CAMP_CAESAR"]);
    const req = toAvailabilityRequest(scope, "2026-08-17", 14);
    expect(req.fromBusinessDate).toBe("2026-08-17");
    expect(req.toBusinessDate).toBe("2026-08-30");
    expect(req.empId).toBe(12);
  });
});

describe("local matrix regeneration (zero network)", () => {
  const matrix: AvailabilityMatrix = {
    ok: true,
    fromBusinessDate: todayBusinessDate(),
    toBusinessDate: addBusinessDays(todayBusinessDate(), 13),
    days: 14,
    scope: { mode: "specific", empId: 12, branchCodes: ["GLEEM", "CAMP_CAESAR"] },
    slotIntervalMinutes: 15,
    matrix: [
      {
        businessDate: "2026-08-18",
        branches: [
          {
            branchCode: "GLEEM",
            employees: [
              {
                empId: 12,
                empName: "زياد",
                status: "available",
                free: [],
                freeRanges: [{ startMin: 13 * 60, endMin: 15 * 60 }],
              },
            ],
          },
          {
            branchCode: "CAMP_CAESAR",
            employees: [
              {
                empId: 12,
                empName: "زياد",
                status: "available",
                free: [],
                freeRanges: [{ startMin: 16 * 60, endMin: 17 * 60 }],
              },
            ],
          },
        ],
      },
    ],
    fetchedAt: Date.now(),
  };

  it("service duration change regenerates slots without new matrix", () => {
    const short = generateSlotsForBusinessDate({
      matrix,
      businessDate: "2026-08-18",
      durationMinutes: 30,
      intervalMinutes: 15,
      branchCode: "GLEEM",
      empId: 12,
      mode: "specific",
    });
    const long = generateSlotsForBusinessDate({
      matrix,
      businessDate: "2026-08-18",
      durationMinutes: 90,
      intervalMinutes: 15,
      branchCode: "GLEEM",
      empId: 12,
      mode: "specific",
    });
    expect(short.length).toBeGreaterThan(long.length);
  });

  it("loaded branch change filters locally", () => {
    const gleem = generateSlotsForBusinessDate({
      matrix,
      businessDate: "2026-08-18",
      durationMinutes: 30,
      intervalMinutes: 15,
      branchCode: "GLEEM",
      empId: 12,
      mode: "specific",
    });
    const camp = generateSlotsForBusinessDate({
      matrix,
      businessDate: "2026-08-18",
      durationMinutes: 30,
      intervalMinutes: 15,
      branchCode: "CAMP_CAESAR",
      empId: 12,
      mode: "specific",
    });
    expect(gleem.every((s) => s.branchCode === "GLEEM")).toBe(true);
    expect(camp.every((s) => s.branchCode === "CAMP_CAESAR")).toBe(true);
    expect(gleem[0]?.time).toBe("13:00");
    expect(camp[0]?.time).toBe("16:00");
  });

  it("maps available days from matrix", () => {
    const days = matrixToAvailableDays(matrix, { branchCode: "GLEEM", empId: 12 });
    expect(days).toEqual([{ date: "2026-08-18", available: true, reason: null }]);
  });
});
