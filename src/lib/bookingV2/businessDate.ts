import type { BusinessDate, LocalTime } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function isBusinessDate(value: string): value is BusinessDate {
  return DATE_RE.test(value);
}

export function isLocalTime(value: string): value is LocalTime {
  return TIME_RE.test(value);
}

export function assertBusinessDate(value: string, ctx: string): BusinessDate {
  if (!isBusinessDate(value)) {
    throw new Error(`[${ctx}] BusinessDate must be YYYY-MM-DD, got: "${value}"`);
  }
  return value;
}

export function assertLocalTime(value: string, ctx: string): LocalTime {
  if (!isLocalTime(value)) {
    throw new Error(`[${ctx}] LocalTime must be HH:mm, got: "${value}"`);
  }
  return value;
}

/** Cairo wall-clock "today" as BusinessDate (no UTC date shifting). */
export function todayBusinessDate(now: Date = new Date()): BusinessDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addBusinessDays(date: BusinessDate, days: number): BusinessDate {
  assertBusinessDate(date, "addBusinessDays");
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Parse BusinessDate into a local Date at noon (avoids DST edge cases for calendar UI). */
export function businessDateToLocalDate(date: BusinessDate): Date {
  assertBusinessDate(date, "businessDateToLocalDate");
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function localDateToBusinessDate(date: Date): BusinessDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function timeToMinutes(time: LocalTime): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): LocalTime {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Legacy write compatibility: derive dayOffset only.
 * Never mutate BusinessDate here — callers must send `date: businessDate`.
 */
export function deriveDayOffsetForLegacyWrite(dayOffset: 0 | 1 | null | undefined): 0 | 1 {
  return dayOffset === 1 ? 1 : 0;
}
