import { generateStartsFromFree } from "./generateStartsFromFree";
import { monotonicNowMs, type EstimateServerNowInput } from "./serverTime";
import type {
  AvailabilityMatrix,
  BranchCode,
  BusinessDate,
  GeneratedSlot,
  MatrixDay,
} from "./types";

export interface LocalDayAvailability {
  date: BusinessDate;
  available: boolean;
  reason?: string | null;
}

export function matrixToAvailableDays(
  matrix: AvailabilityMatrix | null | undefined,
  options?: {
    branchCode?: BranchCode | null;
    empId?: number | null;
  },
): LocalDayAvailability[] {
  if (!matrix) return [];
  const branchFilter = options?.branchCode
    ? String(options.branchCode).toUpperCase()
    : null;
  const empFilter = options?.empId ?? null;

  return matrix.matrix.map((day) => {
    const hasFree = dayHasBookableFree(day, branchFilter, empFilter);
    return {
      date: day.businessDate,
      available: hasFree,
      reason: hasFree ? null : "no_free_windows",
    };
  });
}

function dayHasBookableFree(
  day: MatrixDay,
  branchFilter: string | null,
  empFilter: number | null,
): boolean {
  for (const branch of day.branches) {
    if (branchFilter && String(branch.branchCode).toUpperCase() !== branchFilter) continue;
    for (const emp of branch.employees) {
      if (empFilter != null && emp.empId !== empFilter) continue;
      if (emp.status === "day_off" || emp.status === "closed") continue;
      if (emp.freeRanges?.some((w) => w.endMin > w.startMin)) return true;
      if (emp.free.some((w) => w.start && w.end)) return true;
    }
  }
  return false;
}

export function matrixServerClock(
  matrix: AvailabilityMatrix | null | undefined,
  nowMonoMs?: number,
): EstimateServerNowInput | null {
  if (matrix == null || matrix.generatedAtMs == null) return null;
  const nowMono = nowMonoMs ?? monotonicNowMs();
  return {
    generatedAtMs: matrix.generatedAtMs,
    receivedAtMonoMs: matrix.receivedAtMonoMs ?? nowMono,
    nowMonoMs: nowMono,
  };
}

export function generateSlotsForBusinessDate(options: {
  matrix: AvailabilityMatrix;
  businessDate: BusinessDate;
  durationMinutes: number;
  intervalMinutes: number;
  minNoticeMinutes?: number;
  branchCode?: BranchCode | null;
  empId?: number | null;
  /** nearest: keep all employees; specific: filter empId when provided */
  mode: "specific" | "nearest";
  /** Override monotonic now for tests; defaults to performance.now(). */
  nowMonoMs?: number;
}): GeneratedSlot[] {
  const {
    matrix,
    businessDate,
    durationMinutes,
    intervalMinutes,
    minNoticeMinutes = 0,
    branchCode,
    empId,
    mode,
    nowMonoMs,
  } = options;

  const day = matrix.matrix.find((d) => d.businessDate === businessDate);
  if (!day) return [];

  const branchFilter = branchCode ? String(branchCode).toUpperCase() : null;
  const slots: GeneratedSlot[] = [];
  const clock = matrixServerClock(matrix, nowMonoMs);

  for (const branch of day.branches) {
    if (branchFilter && String(branch.branchCode).toUpperCase() !== branchFilter) continue;

    for (const emp of branch.employees) {
      if (mode === "specific" && empId != null && emp.empId !== empId) continue;
      if (emp.status === "day_off" || emp.status === "closed") continue;
      const hasRanges = (emp.freeRanges?.length ?? 0) > 0 || emp.free.length > 0;
      if (!hasRanges) continue;

      const generated = generateStartsFromFree({
        businessDate,
        freeRanges: emp.freeRanges?.length ? emp.freeRanges : undefined,
        free: emp.free,
        durationMinutes,
        intervalMinutes,
        empId: emp.empId,
        empName: emp.empName,
        branchCode: branch.branchCode,
        minNoticeMinutes,
        clock,
      });
      slots.push(...generated);
    }
  }

  // Nearest: for each start time keep earliest emp (stable by time then empId)
  if (mode === "nearest") {
    const best = new Map<string, GeneratedSlot>();
    for (const slot of slots) {
      const key = `${slot.dayOffset}-${slot.time}`;
      const prev = best.get(key);
      if (!prev || slot.empId < prev.empId) best.set(key, slot);
    }
    return [...best.values()].sort((a, b) => {
      const am = a.dayOffset * 1440 + (Number(a.time.slice(0, 2)) * 60 + Number(a.time.slice(3)));
      const bm = b.dayOffset * 1440 + (Number(b.time.slice(0, 2)) * 60 + Number(b.time.slice(3)));
      return am - bm;
    });
  }

  return slots;
}

/**
 * Existing nearest-selection: first remaining locally eligible start
 * on/after the selected business date (already MinNotice-filtered).
 */
export function pickNearestEligibleSlot(options: {
  matrix: AvailabilityMatrix;
  fromBusinessDate: BusinessDate;
  durationMinutes: number;
  intervalMinutes: number;
  minNoticeMinutes?: number;
  branchCode?: BranchCode | null;
  empId?: number | null;
  mode: "specific" | "nearest";
  nowMonoMs?: number;
}): GeneratedSlot | null {
  const dates = options.matrix.matrix
    .map((d) => d.businessDate)
    .filter((d) => d >= options.fromBusinessDate)
    .sort((a, b) => a.localeCompare(b));

  for (const businessDate of dates) {
    const slots = generateSlotsForBusinessDate({
      ...options,
      businessDate,
    });
    if (slots[0]) return slots[0];
  }
  return null;
}

/** Map GeneratedSlot → legacy AvailableSlot shape used by BookingTimeSlots / plan write. */
export function toLegacyAvailableSlot(slot: GeneratedSlot) {
  return {
    time: slot.time,
    label: slot.label,
    available: slot.available,
    dayOffset: slot.dayOffset,
    empId: slot.empId,
    barberName: slot.barberName,
    durationMinutes: slot.durationMinutes,
    // Carry branch for UI/debug; ignored by legacy write.
    branchCode: slot.branchCode,
    businessDate: slot.businessDate,
  };
}
