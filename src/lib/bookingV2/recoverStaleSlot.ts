/**
 * Recoverable stale-slot handling after /plan 409.
 * One 14-day matrix refresh, then existing nearest-selection. No polling.
 */
import {
  pickNearestEligibleSlot,
  toLegacyAvailableSlot,
} from "./localAvailability";
import type { AvailabilityMatrix, GeneratedSlot } from "./types";
import type { AvailableSlot } from "@/lib/booking-api/types";

export type RecoverablePlanCode = "MIN_NOTICE_NOT_MET" | "BOOKING_PLAN_UNAVAILABLE";

export function isRecoverablePlanAvailabilityError(code: string | null | undefined): code is RecoverablePlanCode {
  return code === "MIN_NOTICE_NOT_MET" || code === "BOOKING_PLAN_UNAVAILABLE";
}

export interface RecoverStaleSlotInput {
  /** Caller supplies the existing 14-day loader (force:true). Invoked exactly once. */
  loadMatrix: () => Promise<AvailabilityMatrix>;
  fromBusinessDate: string;
  durationMinutes: number;
  intervalMinutes: number;
  minNoticeMinutes: number;
  mode: "specific" | "nearest";
  empId?: number | null;
  branchCode?: string | null;
  nowMonoMs?: number;
}

export interface RecoverStaleSlotResult {
  matrix: AvailabilityMatrix;
  nextSlot: GeneratedSlot | null;
  nextLegacySlot: AvailableSlot | null;
}

export async function recoverStaleMinNoticeSlot(
  input: RecoverStaleSlotInput,
): Promise<RecoverStaleSlotResult> {
  const matrix = await input.loadMatrix();
  const nextSlot = pickNearestEligibleSlot({
    matrix,
    fromBusinessDate: input.fromBusinessDate,
    durationMinutes: input.durationMinutes,
    intervalMinutes: input.intervalMinutes,
    minNoticeMinutes: input.minNoticeMinutes,
    mode: input.mode,
    empId: input.empId,
    branchCode: input.branchCode,
    nowMonoMs: input.nowMonoMs,
  });

  return {
    matrix,
    nextSlot,
    nextLegacySlot: nextSlot
      ? {
          ...toLegacyAvailableSlot(nextSlot),
          date: nextSlot.businessDate,
          businessDate: nextSlot.businessDate,
          startMin: nextSlot.startMin,
        }
      : null,
  };
}

export type StaleSlotNoticeKind = "min_notice_expired" | "plan_unavailable";

export interface StaleSlotNotice {
  kind: StaleSlotNoticeKind;
  previousTime: string;
  nextTime: string | null;
}

export function formatStaleSlotNotice(lang: "ar" | "en", notice: StaleSlotNotice): string {
  if (notice.nextTime) {
    if (lang === "en") {
      return `${notice.previousTime} just became unavailable. We selected the next available time: ${notice.nextTime}.`;
    }
    return `الميعاد ${notice.previousTime} لسه ما عادش متاح. اخترنا أقرب ميعاد متاح: ${notice.nextTime}.`;
  }
  if (lang === "en") {
    return `${notice.previousTime} just became unavailable. Please pick another time.`;
  }
  return `الميعاد ${notice.previousTime} لسه ما عادش متاح. اختار ميعاد تاني.`;
}
