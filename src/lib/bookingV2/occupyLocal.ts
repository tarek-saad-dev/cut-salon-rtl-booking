import { cacheGet, cacheKeys, cacheSet } from "./cache";
import {
  availabilityCacheKey,
  getAvailabilityMatrix,
} from "./api";
import { timeToMinutes } from "./businessDate";
import type {
  AvailabilityMatrix,
  AvailabilityRequest,
  FreeRange,
  GeneratedSlot,
  MatrixDay,
  MatrixEmployeeDay,
} from "./types";

function subtractRange(ranges: FreeRange[], occStart: number, occEnd: number): FreeRange[] {
  if (!(occEnd > occStart)) return ranges;
  const out: FreeRange[] = [];
  for (const r of ranges) {
    if (r.endMin <= occStart || r.startMin >= occEnd) {
      out.push(r);
      continue;
    }
    if (r.startMin < occStart) {
      out.push({ startMin: r.startMin, endMin: occStart });
    }
    if (r.endMin > occEnd) {
      out.push({ startMin: occEnd, endMin: r.endMin });
    }
  }
  return out.filter((r) => r.endMin > r.startMin);
}

function occupyEmployeeDay(
  emp: MatrixEmployeeDay,
  startMin: number,
  durationMinutes: number,
): MatrixEmployeeDay {
  const endMin = startMin + durationMinutes;
  const freeRanges = subtractRange(emp.freeRanges ?? [], startMin, endMin);
  const free = (emp.free ?? []).filter((w) => {
    const s = typeof w.startMin === "number" ? w.startMin : timeToMinutes(w.start as never);
    let e = typeof w.endMin === "number" ? w.endMin : timeToMinutes(w.end as never);
    if (w.endDayOffset === 1 || e <= s) e += 24 * 60;
    return e <= startMin || s >= endMin;
  });
  const hasFree = freeRanges.some((r) => r.endMin > r.startMin);
  return {
    ...emp,
    freeRanges,
    free,
    status: hasFree ? emp.status === "day_off" || emp.status === "closed" ? emp.status : "available" : "fully_booked",
  };
}

/**
 * Remove an occupied interval from a matrix for the global employee.
 * Branch filter optional — when omitted, occupy across all branches for that empId.
 */
export function applyLocalOccupancyToMatrix(
  matrix: AvailabilityMatrix,
  opts: {
    empId: number;
    businessDate: string;
    startMin: number;
    durationMinutes: number;
    branchCode?: string | null;
  },
): AvailabilityMatrix {
  const branchFilter = opts.branchCode ? String(opts.branchCode).toUpperCase() : null;
  const nextDays: MatrixDay[] = matrix.matrix.map((day) => {
    if (day.businessDate !== opts.businessDate) return day;
    return {
      ...day,
      branches: day.branches.map((br) => {
        if (branchFilter && String(br.branchCode).toUpperCase() !== branchFilter) return br;
        return {
          ...br,
          employees: br.employees.map((emp) =>
            emp.empId === opts.empId
              ? occupyEmployeeDay(emp, opts.startMin, opts.durationMinutes)
              : emp,
          ),
        };
      }),
    };
  });
  return { ...matrix, matrix: nextDays, fetchedAt: Date.now(), stale: false };
}

export function slotStartMin(slot: {
  startMin?: number | null;
  time: string;
  dayOffset?: number | null;
}): number {
  if (typeof slot.startMin === "number" && Number.isFinite(slot.startMin)) return slot.startMin;
  const base = timeToMinutes(slot.time as `${number}:${number}`);
  return (slot.dayOffset === 1 ? 1440 : 0) + base;
}

/** Apply occupancy to every cached V2 availability matrix that includes this empId. */
export function applyLocalOccupancyToAllCachedMatrices(opts: {
  empId: number;
  businessDate: string;
  startMin: number;
  durationMinutes: number;
  branchCode?: string | null;
}): void {
  const keys = cacheKeys("booking-v2:availability:");
  for (const key of keys) {
    const entry = cacheGet<AvailabilityMatrix>(key);
    if (!entry) continue;
    const hasEmp = entry.data.matrix.some((d) =>
      d.branches.some((b) => b.employees.some((e) => e.empId === opts.empId)),
    );
    if (!hasEmp && entry.data.scope.empId !== opts.empId) continue;
    const next = applyLocalOccupancyToMatrix(entry.data, opts);
    cacheSet(key, next, entry.etag);
  }
}

/**
 * Targeted 1-day authoritative revalidate, then merge into any matching 14-day caches.
 */
export async function revalidateAvailabilityBusinessDate(opts: {
  mode: "specific" | "nearest";
  empId?: number;
  branchCodes: string[];
  businessDate: string;
}): Promise<AvailabilityMatrix> {
  const request: AvailabilityRequest = {
    mode: opts.mode,
    empId: opts.empId,
    branchCodes: opts.branchCodes,
    fromBusinessDate: opts.businessDate,
    toBusinessDate: opts.businessDate,
    days: 1,
  };
  const dayMatrix = await getAvailabilityMatrix(request, { force: true });
  const day = dayMatrix.matrix.find((d) => d.businessDate === opts.businessDate);
  if (day) mergeDayIntoMatchingCaches(day, opts);
  return dayMatrix;
}

function scopeMatches(
  cached: AvailabilityMatrix,
  opts: { mode: "specific" | "nearest"; empId?: number; branchCodes: string[] },
): boolean {
  if (cached.scope.mode !== opts.mode) return false;
  if (opts.mode === "specific" && opts.empId != null && cached.scope.empId !== opts.empId) {
    return false;
  }
  const want = new Set(opts.branchCodes.map((c) => c.toUpperCase()));
  const have = new Set(cached.scope.branchCodes.map((c) => String(c).toUpperCase()));
  for (const c of want) {
    if (!have.has(c)) return false;
  }
  return true;
}

export function mergeDayIntoMatchingCaches(
  day: MatrixDay,
  opts: { mode: "specific" | "nearest"; empId?: number; branchCodes: string[] },
): void {
  const keys = cacheKeys("booking-v2:availability:");
  for (const key of keys) {
    const entry = cacheGet<AvailabilityMatrix>(key);
    if (!entry) continue;
    if (!scopeMatches(entry.data, opts)) continue;
    // Skip pure 1-day entries that are exactly this day — already fresh from fetch
    const nextMatrix = entry.data.matrix.map((d) =>
      d.businessDate === day.businessDate ? day : d,
    );
    const hasDay = entry.data.matrix.some((d) => d.businessDate === day.businessDate);
    const matrix = hasDay ? nextMatrix : [...entry.data.matrix, day].sort((a, b) =>
      a.businessDate.localeCompare(b.businessDate),
    );
    cacheSet(
      key,
      { ...entry.data, matrix, fetchedAt: Date.now(), stale: false },
      entry.etag,
    );
  }
}

export function occupancyFromGeneratedSlot(
  slot: Pick<GeneratedSlot, "empId" | "businessDate" | "branchCode" | "durationMinutes" | "startMin" | "time" | "dayOffset">,
): {
  empId: number;
  businessDate: string;
  startMin: number;
  durationMinutes: number;
  branchCode: string;
} {
  return {
    empId: slot.empId,
    businessDate: slot.businessDate,
    startMin: slotStartMin(slot),
    durationMinutes: slot.durationMinutes,
    branchCode: slot.branchCode,
  };
}

export { availabilityCacheKey };
