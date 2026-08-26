import {
  minutesToTime,
  timeToMinutes,
  assertBusinessDate,
} from "./businessDate";
import {
  estimateServerNowMs,
  isSlotLocallyEligible,
  slotStartEpochMs,
  SALON_TIME_ZONE,
  type EstimateServerNowInput,
} from "./serverTime";
import type {
  BusinessDate,
  FreeRange,
  FreeWindow,
  GeneratedSlot,
  LocalTime,
  BranchCode,
} from "./types";

export interface GenerateStartsOptions {
  businessDate: BusinessDate;
  freeRanges?: FreeRange[];
  /** Legacy HH:mm windows — converted to FreeRange when freeRanges absent. */
  free?: FreeWindow[];
  durationMinutes: number;
  intervalMinutes: number;
  empId: number;
  empName?: string | null;
  branchCode: BranchCode;
  minNoticeMinutes?: number;
  /**
   * Authoritative server-time clock from the 14-day matrix.
   * When present, MinNotice uses exact ms (not minute-truncated wall time).
   */
  clock?: EstimateServerNowInput | null;
  estimatedServerNowMs?: number;
  timeZone?: string;
}

function windowsToRanges(free: FreeWindow[]): FreeRange[] {
  return free
    .map((w) => {
      if (typeof w.startMin === "number" && typeof w.endMin === "number") {
        return { startMin: w.startMin, endMin: w.endMin };
      }
      if (!w.start || !w.end) return null;
      const startMin = timeToMinutes(w.start);
      let endMin = timeToMinutes(w.end);
      if (w.endDayOffset === 1 || endMin <= startMin) endMin += 24 * 60;
      return { startMin, endMin };
    })
    .filter(Boolean) as FreeRange[];
}

function resolveEstimatedServerNowMs(options: GenerateStartsOptions): number | null {
  if (typeof options.estimatedServerNowMs === "number" && Number.isFinite(options.estimatedServerNowMs)) {
    return options.estimatedServerNowMs;
  }
  if (options.clock && Number.isFinite(options.clock.generatedAtMs)) {
    return estimateServerNowMs(options.clock);
  }
  return null;
}

/**
 * Hawai shared contract: FreeRanges + duration + slotInterval → start times.
 * Half-open ranges [startMin, endMin). Overnight uses minutes ≥ 1440.
 * BusinessDate stays fixed; dayOffset derived from startMin only.
 *
 * MinNotice is exact-ms vs the matrix server-time anchor. This is UX protection
 * only — POST /plan remains the strong_fresh authority.
 */
export function generateStartsFromFree(options: GenerateStartsOptions): GeneratedSlot[] {
  const {
    businessDate,
    durationMinutes,
    intervalMinutes,
    empId,
    empName,
    branchCode,
    minNoticeMinutes = 0,
    timeZone = SALON_TIME_ZONE,
  } = options;

  assertBusinessDate(businessDate, "generateStartsFromFree");
  if (durationMinutes <= 0 || intervalMinutes <= 0) return [];

  const ranges =
    options.freeRanges?.length
      ? options.freeRanges
      : windowsToRanges(options.free ?? []);

  const estimatedServerNow = resolveEstimatedServerNowMs(options);
  const applyNotice = estimatedServerNow != null;

  const out: GeneratedSlot[] = [];
  const seen = new Set<string>();

  for (const range of ranges) {
    const winStart = range.startMin;
    const winEnd = range.endMin;
    if (!(winEnd > winStart)) continue;

    for (let start = winStart; start + durationMinutes <= winEnd; start += intervalMinutes) {
      if (applyNotice) {
        const slotStartMs = slotStartEpochMs(businessDate, start, timeZone);
        if (
          !isSlotLocallyEligible({
            slotStartMs,
            estimatedServerNowMs: estimatedServerNow,
            minNoticeMinutes,
          })
        ) {
          continue;
        }
      }

      const dayOffset: 0 | 1 = start >= 24 * 60 ? 1 : 0;
      const time = minutesToTime(start) as LocalTime;
      const key = `${dayOffset}-${time}-${empId}-${branchCode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        businessDate,
        time,
        dayOffset,
        available: true,
        empId,
        barberName: empName ?? null,
        branchCode,
        durationMinutes,
        label: null,
        startMin: start,
      });
    }
  }

  return out.sort((a, b) => {
    const am = (a.startMin ?? a.dayOffset * 1440 + timeToMinutes(a.time));
    const bm = (b.startMin ?? b.dayOffset * 1440 + timeToMinutes(b.time));
    if (am !== bm) return am - bm;
    return a.empId - b.empId;
  });
}
