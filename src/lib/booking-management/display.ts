/**
 * Shared helpers for booking lookup / upcoming / cancel UI (Phase 8B2).
 */
import type { PublicBooking, PublicBookingErrorCode } from "@/lib/booking-api/types";
import { getArabicErrorMessage } from "@/lib/booking-api/errors";
import {
  BOOKING_CODE_MAX_LENGTH,
  normalizeBookingCode as normalizeBookingCodeCanonical,
  isValidBookingCodeShape as isValidBookingCodeShapeCanonical,
} from "@/lib/booking-api/limits";

/** Re-export canonical limits — do not redefine numbers here. */
export const MAX_BOOKING_CODE_LENGTH = BOOKING_CODE_MAX_LENGTH;
export const MAX_CANCEL_REASON_LENGTH = 200;

export const normalizeBookingCode = normalizeBookingCodeCanonical;
export const isValidBookingCodeShape = isValidBookingCodeShapeCanonical;

export function normalizeEgyptianPhone(input: string): string | null {
  const trimmed = input.trim();
  if (/[a-zA-Z]/.test(trimmed)) return null;
  if (trimmed.indexOf("+") > 0) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : digits;
}

export function getServiceNames(
  services: PublicBooking["services"],
): string[] {
  if (!services || services.length === 0) return [];
  return services.map((s) => (typeof s === "string" ? s : s.name));
}

/** Cairo calendar date label from YYYY-MM-DD (no browser TZ rewrite). */
export function formatWorkDateAr(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const dateObj = new Date(y, m - 1, d);
  const days = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  return `${days[dateObj.getDay()]} ${d} ${months[m - 1]}`;
}

export function formatBookingTimeAr(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time;
  const min = mStr ?? "00";
  const suffix =
    h >= 5 && h < 12
      ? "صباحًا"
      : h >= 12 && h < 17
        ? "مساءً"
        : h >= 17 && h < 21
          ? "مساءً"
          : "ليلاً";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${min} ${suffix}`;
}

export function formatOvernightHint(booking: Pick<PublicBooking, "time" | "dayOffset" | "date">): string | null {
  if ((booking.dayOffset ?? 0) !== 1) return null;
  return `تابع ليوم التشغيل: ${formatWorkDateAr(booking.date)}`;
}

export type StatusBadge = { text: string; cls: string; cancelled: boolean; completed: boolean };

export function mapBookingStatus(status: string | null | undefined): StatusBadge {
  const key = (status ?? "").toLowerCase();
  if (key === "cancelled" || key === "canceled") {
    return {
      text: "ملغي",
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
      cancelled: true,
      completed: false,
    };
  }
  if (key === "completed" || key === "done") {
    return {
      text: "مكتمل",
      cls: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      cancelled: false,
      completed: true,
    };
  }
  if (key === "in_service" || key === "in-service" || key === "started") {
    return {
      text: "قيد الخدمة",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      cancelled: false,
      completed: false,
    };
  }
  if (key === "confirmed") {
    return {
      text: "مؤكد",
      cls: "bg-cut-bronze/10 text-cut-bronze border-cut-bronze/25",
      cancelled: false,
      completed: false,
    };
  }
  if (key === "pending") {
    return {
      text: "قيد الانتظار",
      cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      cancelled: false,
      completed: false,
    };
  }
  return {
    text: status?.trim() || "غير معروف",
    cls: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    cancelled: false,
    completed: false,
  };
}

/** Neutral ownership failure — never distinguish code vs phone vs token. */
export function neutralOwnershipMessage(): string {
  return getArabicErrorMessage("BOOKING_NOT_FOUND_OR_UNAUTHORIZED");
}

export function cancelPolicyMessage(code: string | undefined): string {
  if (!code) return getArabicErrorMessage("UNKNOWN_ERROR");
  const mapped = code as PublicBookingErrorCode;
  if (
    code === "BOOKING_NOT_FOUND" ||
    code === "BOOKING_NOT_FOUND_OR_UNAUTHORIZED" ||
    code === "VALIDATION_ERROR"
  ) {
    return neutralOwnershipMessage();
  }
  return getArabicErrorMessage(mapped);
}

export function isAlreadyCancelledCode(code: string | undefined): boolean {
  return code === "BOOKING_ALREADY_CANCELLED";
}

export function isStaffRequiredCode(code: string | undefined): boolean {
  return (
    code === "BOOKING_HAS_PAYMENT" ||
    code === "BOOKING_CANCELLATION_REQUIRES_STAFF"
  );
}

export function shouldDisableCancelCta(
  booking: PublicBooking,
): boolean {
  const badge = mapBookingStatus(booking.status);
  if (badge.cancelled || badge.completed) return true;
  if (booking.canCancel === false) return true;
  const key = (booking.status ?? "").toLowerCase();
  if (key === "in_service" || key === "in-service" || key === "started") return true;
  return false;
}

export function isMinimalOwnership(booking: PublicBooking): boolean {
  return booking.ownershipLevel === "minimal";
}
