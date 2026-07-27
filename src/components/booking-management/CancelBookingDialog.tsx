"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import {
  submitBookingCancellation,
  lookupBooking,
  getBookingAccess,
  BookingApiError,
  type PublicBooking,
} from "@/lib/booking-api";
import {
  cancelPolicyMessage,
  formatBookingTimeAr,
  formatOvernightHint,
  formatWorkDateAr,
  getServiceNames,
  isAlreadyCancelledCode,
  isStaffRequiredCode,
  MAX_CANCEL_REASON_LENGTH,
  normalizeEgyptianPhone,
} from "@/lib/booking-management/display";

export type CancelUiState =
  | { kind: "idle" }
  | { kind: "cancelling" }
  | { kind: "rate_limited"; message: string; until: number; remaining: number }
  | { kind: "unknown"; message: string; requestId?: string | null }
  | { kind: "error"; message: string; code?: string; requestId?: string | null }
  | { kind: "success"; message: string };

const REASON_OPTIONS = [
  { code: "changed_plans", label: "تغيّرت خططي" },
  { code: "wrong_time", label: "موعد غير مناسب" },
  { code: "other", label: "سبب آخر" },
] as const;

interface CancelBookingDialogProps {
  booking: PublicBooking;
  /** Phone ownership fallback when no access token */
  phone?: string | null;
  onClose: () => void;
  onCancelled: (updated: PublicBooking) => void;
}

export default function CancelBookingDialog({
  booking,
  phone,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const [reasonCode, setReasonCode] = useState<string>("");
  const [reasonText, setReasonText] = useState("");
  const [ui, setUi] = useState<CancelUiState>({ kind: "idle" });
  const [tick, setTick] = useState(0);
  const inFlightRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (ui.kind !== "rate_limited") return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      const remaining = Math.max(0, Math.ceil((ui.until - Date.now()) / 1000));
      if (remaining <= 0) setUi({ kind: "idle" });
      else setUi({ ...ui, remaining });
    }, 500);
    return () => clearInterval(id);
  }, [ui]);

  void tick;

  const rateLimited =
    ui.kind === "rate_limited" && ui.remaining > 0;
  const busy = ui.kind === "cancelling" || ui.kind === "unknown" || rateLimited;

  const runCancel = async () => {
    if (inFlightRef.current) return;
    if (rateLimited) return;
    inFlightRef.current = true;
    setUi({ kind: "cancelling" });

    const stored = getBookingAccess(booking.bookingCode);
    const phoneNorm = phone ? normalizeEgyptianPhone(phone) : null;

    try {
      const result = await submitBookingCancellation({
        code: booking.bookingCode,
        bookingAccessToken: stored?.bookingAccessToken,
        phone: stored ? undefined : phoneNorm ?? undefined,
        reasonCode: reasonCode || undefined,
        reasonText: reasonText.trim().slice(0, MAX_CANCEL_REASON_LENGTH) || undefined,
      });

      if (result.outcome === "success") {
        const updated: PublicBooking = {
          ...booking,
          status: "cancelled",
          canCancel: false,
        };
        setUi({
          kind: "success",
          message: result.response?.message ?? "تم إلغاء الحجز بنجاح",
        });
        onCancelled(updated);
        return;
      }

      if (result.outcome === "mutation_outcome_unknown") {
        setUi({
          kind: "unknown",
          message: "تعذر التأكد من نتيجة طلب الإلغاء. قد يكون الحجز قد تم إلغاؤه بالفعل.",
          requestId: result.error?.requestId,
        });
        return;
      }

      const err = result.error;
      if (err?.isRateLimited) {
        const sec = err.retryAfterSeconds ?? 30;
        setUi({
          kind: "rate_limited",
          message: err.message,
          until: Date.now() + sec * 1000,
          remaining: sec,
        });
        return;
      }

      if (isAlreadyCancelledCode(err?.code)) {
        const updated: PublicBooking = {
          ...booking,
          status: "cancelled",
          canCancel: false,
        };
        setUi({
          kind: "success",
          message: "تم إلغاء هذا الحجز مسبقاً",
        });
        onCancelled(updated);
        return;
      }

      setUi({
        kind: "error",
        message: cancelPolicyMessage(err?.code) || err?.message || "تعذر إلغاء الحجز",
        code: err?.code,
        requestId: err?.requestId,
      });
    } catch (e) {
      if (e instanceof BookingApiError && e.isRateLimited) {
        const sec = e.retryAfterSeconds ?? 30;
        setUi({
          kind: "rate_limited",
          message: e.message,
          until: Date.now() + sec * 1000,
          remaining: sec,
        });
      } else {
        setUi({
          kind: "error",
          message: "تعذر إلغاء الحجز، حاول مرة أخرى",
        });
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  const verifyThenRetry = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setUi({ kind: "cancelling" });
    try {
      const res = await lookupBooking(booking.bookingCode);
      const status = (res.data.status ?? "").toLowerCase();
      if (status === "cancelled" || status === "canceled") {
        const updated = { ...booking, ...res.data, status: "cancelled", canCancel: false };
        setUi({ kind: "success", message: "تم إلغاء هذا الحجز مسبقاً" });
        onCancelled(updated);
        return;
      }
    } catch {
      /* fall through to safe retry */
    } finally {
      inFlightRef.current = false;
    }
    await runCancel();
  };

  const handleEscapeClose = () => {
    if (ui.kind === "cancelling" || ui.kind === "unknown") {
      const ok = window.confirm(
        "نتيجة الإلغاء غير مؤكدة أو جاري التنفيذ. هل تريد الإغلاق؟",
      );
      if (!ok) return;
    }
    onClose();
  };

  const overnight = formatOvernightHint(booking);
  const services = getServiceNames(booking.services).join(" + ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-booking-title"
      aria-describedby="cancel-booking-desc"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleEscapeClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleEscapeClose}
          disabled={ui.kind === "cancelling"}
          className="absolute left-4 top-4 text-cut-ivory/30 hover:text-cut-ivory/60 transition-colors disabled:opacity-40"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3
              id="cancel-booking-title"
              ref={titleRef}
              tabIndex={-1}
              className="text-cut-ivory font-bold text-base outline-none"
            >
              تأكيد إلغاء الحجز
            </h3>
            <p className="text-gray-500 text-xs" dir="ltr">
              {booking.bookingCode}
            </p>
          </div>
        </div>

        <div id="cancel-booking-desc" className="text-gray-400 text-sm mb-4 space-y-1">
          {booking.branchName && <p>الفرع: {booking.branchName}</p>}
          {services && <p>الخدمات: {services}</p>}
          <p>
            {formatWorkDateAr(booking.date)} — {formatBookingTimeAr(booking.time)}
          </p>
          {overnight && <p className="text-cut-gold/80 text-xs">{overnight}</p>}
          <p className="pt-2">هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.</p>
        </div>

        {ui.kind !== "success" && (
          <div className="mb-4 space-y-2">
            <label className="block text-xs text-cut-ivory/50" htmlFor="cancel-reason">
              سبب الإلغاء (اختياري)
            </label>
            <select
              id="cancel-reason"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={busy}
              className="w-full rounded-xl bg-white/5 border border-white/10 text-cut-ivory text-sm px-3 py-2"
            >
              <option value="">بدون تحديد</option>
              {REASON_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            {reasonCode === "other" && (
              <textarea
                value={reasonText}
                onChange={(e) =>
                  setReasonText(e.target.value.slice(0, MAX_CANCEL_REASON_LENGTH))
                }
                disabled={busy}
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 text-cut-ivory text-sm px-3 py-2"
                placeholder="اكتب السبب"
                aria-label="نص سبب الإلغاء"
              />
            )}
          </div>
        )}

        <div aria-live="polite" className="mb-4">
          {ui.kind === "cancelling" && (
            <div className="px-3 py-2 rounded-xl bg-cut-gold/10 border border-cut-gold/20 text-cut-ivory text-xs text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري إلغاء الحجز...
            </div>
          )}
          {ui.kind === "rate_limited" && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs text-center">
              {ui.message}
              <p className="mt-1 font-bold tabular-nums">
                حاول مرة أخرى بعد {ui.remaining} ثانية
              </p>
            </div>
          )}
          {ui.kind === "unknown" && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100 text-xs text-center space-y-2">
              <p className="font-bold">تعذر التأكد من نتيجة طلب الإلغاء</p>
              <p>{ui.message}</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  type="button"
                  onClick={() => void verifyThenRetry()}
                  className="px-3 py-1.5 rounded-lg bg-cut-gold text-black text-xs font-bold"
                >
                  التحقق من حالة الحجز
                </button>
                <button
                  type="button"
                  onClick={() => void runCancel()}
                  className="px-3 py-1.5 rounded-lg border border-cut-gold/30 text-cut-gold text-xs font-bold"
                >
                  إعادة المحاولة الآمنة
                </button>
              </div>
              {ui.requestId && (
                <p className="text-[10px] text-cut-ivory/30">رقم مرجع الخطأ: {ui.requestId}</p>
              )}
            </div>
          )}
          {ui.kind === "error" && (
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center space-y-1">
              <p>{ui.message}</p>
              {isStaffRequiredCode(ui.code) && (
                <p>لم يتم إصدار أي استرداد تلقائي. يرجى التواصل مع الفرع عند الحاجة.</p>
              )}
              {ui.requestId && (
                <p className="text-[10px] text-cut-ivory/30">رقم مرجع الخطأ: {ui.requestId}</p>
              )}
            </div>
          )}
          {ui.kind === "success" && (
            <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs text-center">
              {ui.message}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEscapeClose}
            disabled={ui.kind === "cancelling"}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-cut-ivory/60 text-sm hover:border-white/20 disabled:opacity-40"
          >
            رجوع
          </button>
          {ui.kind !== "success" && (
            <button
              type="button"
              onClick={() => void runCancel()}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-cut-ivory text-sm font-bold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {ui.kind === "cancelling" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "تأكيد إلغاء الحجز"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
