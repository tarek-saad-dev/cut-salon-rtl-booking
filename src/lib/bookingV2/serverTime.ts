/**
 * Server-time anchor for local MinNotice UX.
 * generatedAtMs is authoritative; client Date.now() must not decide eligibility.
 */
import { addBusinessDays } from "./businessDate";

export const SALON_TIME_ZONE = "Africa/Cairo";

export interface MatrixServerClock {
  generatedAtMs: number;
  receivedAtMonoMs: number;
}

export interface EstimateServerNowInput extends MatrixServerClock {
  nowMonoMs?: number;
}

export function monotonicNowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export function stampMatrixReceiveClock(generatedAtMs: number, nowMonoMs: number = monotonicNowMs()): MatrixServerClock {
  return { generatedAtMs, receivedAtMonoMs: nowMonoMs };
}

export function estimateServerNowMs(clock: EstimateServerNowInput): number {
  const nowMono = clock.nowMonoMs ?? monotonicNowMs();
  const elapsed = Math.max(0, nowMono - clock.receivedAtMonoMs);
  return clock.generatedAtMs + elapsed;
}

export function minNoticeThresholdMs(estimatedServerNowMs: number, minNoticeMinutes: number): number {
  return estimatedServerNowMs + Math.max(0, minNoticeMinutes) * 60_000;
}

/**
 * UX-only MinNotice predicate. /plan remains strong_fresh authority.
 * slotStartMs > estimatedServerNowMs AND slotStartMs >= thresholdMs
 */
export function isSlotLocallyEligible(options: {
  slotStartMs: number;
  estimatedServerNowMs: number;
  minNoticeMinutes: number;
}): boolean {
  const { slotStartMs, estimatedServerNowMs, minNoticeMinutes } = options;
  if (!(slotStartMs > estimatedServerNowMs)) return false;
  return slotStartMs >= minNoticeThresholdMs(estimatedServerNowMs, minNoticeMinutes);
}

export function cairoWallToEpochMs(parts: {
  businessDate: string;
  hour: number;
  minute: number;
  second?: number;
  millisecond?: number;
  timeZone?: string;
}): number {
  const timeZone = parts.timeZone ?? SALON_TIME_ZONE;
  const [year, month, day] = parts.businessDate.split("-").map(Number);
  const second = parts.second ?? 0;
  const millisecond = parts.millisecond ?? 0;

  let utcMs = Date.UTC(year, month - 1, day, parts.hour, parts.minute, second, millisecond);

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    fractionalSecondDigits: 3,
  });

  for (let i = 0; i < 4; i++) {
    const mapped = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
    const shownHour = Number(mapped.hour === "24" ? "0" : mapped.hour);
    const shownMs = Date.UTC(
      Number(mapped.year),
      Number(mapped.month) - 1,
      Number(mapped.day),
      shownHour,
      Number(mapped.minute),
      Number(mapped.second),
      Number(mapped.fractionalSecond ?? "0"),
    );
    const wantedMs = Date.UTC(year, month - 1, day, parts.hour, parts.minute, second, millisecond);
    const diff = wantedMs - shownMs;
    if (diff === 0) break;
    utcMs += diff;
  }

  return utcMs;
}

/** FreeMask startMin is minutes from BusinessDate midnight (may be ≥ 1440 overnight). */
export function slotStartEpochMs(
  businessDate: string,
  startMin: number,
  timeZone: string = SALON_TIME_ZONE,
): number {
  const extraDays = Math.floor(startMin / 1440);
  const mins = startMin - extraDays * 1440;
  const date = extraDays === 0 ? businessDate : addBusinessDays(businessDate, extraDays);
  return cairoWallToEpochMs({
    businessDate: date,
    hour: Math.floor(mins / 60),
    minute: mins % 60,
    second: 0,
    millisecond: 0,
    timeZone,
  });
}

export function pickEpochMs(...values: unknown[]): number | null {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    if (typeof v === "string" && v.trim()) {
      const asNum = Number(v);
      if (Number.isFinite(asNum) && asNum > 0) return asNum;
      const parsed = Date.parse(v);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}
