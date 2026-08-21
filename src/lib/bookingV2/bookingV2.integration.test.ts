import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cacheClear, cacheSet, cacheGet } from "@/lib/bookingV2/cache";
import { applyLocalOccupancyToMatrix, applyLocalOccupancyToAllCachedMatrices, slotStartMin } from "@/lib/bookingV2/occupyLocal";
import { availabilityCacheKey } from "@/lib/bookingV2/api";
import { generateSlotsForBusinessDate } from "@/lib/bookingV2/localAvailability";
import { resolveAvailabilityScope, toAvailabilityRequest } from "@/lib/bookingV2/scope";
import { deriveDayOffsetForLegacyWrite } from "@/lib/bookingV2/businessDate";
import { isBookingV2ClientEnabled } from "@/lib/bookingV2/feature";
import type { AvailabilityMatrix } from "@/lib/bookingV2/types";
import { deriveV2Slots } from "@/hooks/bookingFlowV2Support";

function sampleMatrix(): AvailabilityMatrix {
  return {
    ok: true,
    fromBusinessDate: "2026-08-21",
    toBusinessDate: "2026-09-03",
    days: 14,
    scope: { mode: "specific", empId: 5, branchCodes: ["GLEEM"] },
    slotIntervalMinutes: 15,
    matrix: [
      {
        businessDate: "2026-08-21",
        branches: [
          {
            branchCode: "GLEEM",
            branchName: "جليم",
            employees: [
              {
                empId: 5,
                empName: "Kareem",
                status: "available",
                free: [],
                freeRanges: [{ startMin: 16 * 60, endMin: 18 * 60 }],
              },
            ],
          },
        ],
      },
    ],
    fetchedAt: Date.now(),
  };
}

describe("Booking V2 client integration helpers", () => {
  beforeEach(() => {
    cacheClear();
    vi.stubEnv("NEXT_PUBLIC_BOOKING_V2_CLIENT", "true");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "http://localhost:5500");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cacheClear();
  });

  it("enables V2 client for localhost booking base", () => {
    expect(isBookingV2ClientEnabled()).toBe(true);
  });

  it("allows production HTTPS booking base when V2 enabled", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_V2_CLIENT", "true");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://casher-five.vercel.app");
    const { _resetBaseUrlCache, getBookingApiBaseUrl } = await import("@/lib/booking-api/env");
    _resetBaseUrlCache();
    expect(getBookingApiBaseUrl()).toBe("https://casher-five.vercel.app");
  });

  it("rejects localhost booking base in production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_V2_CLIENT", "true");
    vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "http://localhost:5500");
    const { _resetBaseUrlCache, getBookingApiBaseUrl } = await import("@/lib/booking-api/env");
    _resetBaseUrlCache();
    expect(() => getBookingApiBaseUrl()).toThrow(/must not use localhost|requires HTTPS/i);
  });

  it("specific employee scope → one matrix request shape", () => {
    const scope = resolveAvailabilityScope({
      mode: "specific",
      empId: 5,
      barber: {
        empId: 5,
        name: "Kareem",
        isBookableOnline: true,
        branches: [{ branchCode: "GLEEM", branchName: "جليم" }],
      },
    });
    const req = toAvailabilityRequest(scope, "2026-08-21", 14);
    expect(req.empId).toBe(5);
    expect(req.branchCodes).toEqual(["GLEEM"]);
    expect(req.fromBusinessDate).toBe("2026-08-21");
    expect(req.toBusinessDate).toBe("2026-09-03");
  });

  it("multi-branch Zeyad → GLEEM + CAMP_CAESAR one scope", () => {
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
          { branchCode: "CAMP_CAESAR", branchName: "كامب" },
        ],
      },
    });
    expect(scope.branchCodes).toEqual(["GLEEM", "CAMP_CAESAR"]);
  });

  it("service/date change regenerates locally from same matrix", () => {
    const matrix = sampleMatrix();
    const date = new Date(2026, 7, 21, 12);
    const a = deriveV2Slots(matrix, date, {
      mode: "specific",
      empId: 5,
      branchCode: "GLEEM",
      durationMinutes: 30,
      intervalMinutes: 15,
    });
    const b = deriveV2Slots(matrix, date, {
      mode: "specific",
      empId: 5,
      branchCode: "GLEEM",
      durationMinutes: 60,
      intervalMinutes: 15,
    });
    expect(a.slots.some((s) => s.time === "16:00")).toBe(true);
    expect(a.slots.length).toBeGreaterThan(b.slots.length);
  });

  it("overnight keeps BusinessDate and dayOffset=1 for write compat", () => {
    const matrix: AvailabilityMatrix = {
      ...sampleMatrix(),
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
                  free: [],
                  freeRanges: [{ startMin: 1470, endMin: 1500 }],
                },
              ],
            },
          ],
        },
      ],
    };
    const slots = generateSlotsForBusinessDate({
      matrix,
      businessDate: "2026-08-21",
      durationMinutes: 15,
      intervalMinutes: 15,
      empId: 5,
      mode: "specific",
    });
    expect(slots[0]?.businessDate).toBe("2026-08-21");
    expect(slots[0]?.dayOffset).toBe(1);
    expect(slots[0]?.time).toBe("00:30");
    expect(deriveDayOffsetForLegacyWrite(slots[0]?.dayOffset)).toBe(1);
    expect(slotStartMin(slots[0]!)).toBe(1470);
  });

  it("create success removes slot locally from cached matrices", () => {
    const matrix = sampleMatrix();
    const key = availabilityCacheKey({
      mode: "specific",
      empId: 5,
      branchCodes: ["GLEEM"],
      fromBusinessDate: "2026-08-21",
      toBusinessDate: "2026-09-03",
      days: 14,
    });
    cacheSet(key, matrix, null);

    const before = generateSlotsForBusinessDate({
      matrix,
      businessDate: "2026-08-21",
      durationMinutes: 30,
      intervalMinutes: 15,
      empId: 5,
      mode: "specific",
    });
    expect(before.some((s) => s.time === "16:00")).toBe(true);

    applyLocalOccupancyToAllCachedMatrices({
      empId: 5,
      businessDate: "2026-08-21",
      startMin: 16 * 60,
      durationMinutes: 30,
      branchCode: "GLEEM",
    });

    const updated = cacheGet<AvailabilityMatrix>(key)?.data;
    expect(updated).toBeTruthy();
    const after = generateSlotsForBusinessDate({
      matrix: updated!,
      businessDate: "2026-08-21",
      durationMinutes: 30,
      intervalMinutes: 15,
      empId: 5,
      mode: "specific",
    });
    expect(after.some((s) => s.time === "16:00")).toBe(false);
  });

  it("applyLocalOccupancyToMatrix is pure and idempotent for same interval", () => {
    const matrix = sampleMatrix();
    const once = applyLocalOccupancyToMatrix(matrix, {
      empId: 5,
      businessDate: "2026-08-21",
      startMin: 16 * 60,
      durationMinutes: 30,
    });
    const twice = applyLocalOccupancyToMatrix(once, {
      empId: 5,
      businessDate: "2026-08-21",
      startMin: 16 * 60,
      durationMinutes: 30,
    });
    expect(once.matrix[0]?.branches[0]?.employees[0]?.freeRanges).toEqual(
      twice.matrix[0]?.branches[0]?.employees[0]?.freeRanges,
    );
  });
});
