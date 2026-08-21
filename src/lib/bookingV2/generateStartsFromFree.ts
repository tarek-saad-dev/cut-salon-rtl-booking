import {
  minutesToTime,
  timeToMinutes,
  assertBusinessDate,
} from "./businessDate";
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
  now?: Date;
  nowMinutesFromMidnight?: number;
  todayBusinessDate?: BusinessDate;
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

/**
 * Hawai shared contract: FreeRanges + duration + slotInterval → start times.
 * Half-open ranges [startMin, endMin). Overnight uses minutes ≥ 1440.
 * BusinessDate stays fixed; dayOffset derived from startMin only.
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
    now = new Date(),
    todayBusinessDate,
  } = options;

  assertBusinessDate(businessDate, "generateStartsFromFree");
  if (durationMinutes <= 0 || intervalMinutes <= 0) return [];

  const ranges =
    options.freeRanges?.length
      ? options.freeRanges
      : windowsToRanges(options.free ?? []);

  const today = todayBusinessDate;
  const applyNotice = today != null && businessDate === today && minNoticeMinutes > 0;

  let nowMinutes = options.nowMinutesFromMidnight;
  if (applyNotice && nowMinutes == null) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    nowMinutes = hour * 60 + minute;
  }

  const earliestStart = applyNotice ? (nowMinutes ?? 0) + minNoticeMinutes : 0;
  const out: GeneratedSlot[] = [];
  const seen = new Set<string>();

  for (const range of ranges) {
    const winStart = range.startMin;
    const winEnd = range.endMin;
    if (!(winEnd > winStart)) continue;

    for (let start = winStart; start + durationMinutes <= winEnd; start += intervalMinutes) {
      if (start < earliestStart) continue;

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
