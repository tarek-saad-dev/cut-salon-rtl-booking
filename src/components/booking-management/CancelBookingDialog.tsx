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
import type { BookingMgmtSurface } from "@/lib/booking-management/surface";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";

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
  surface?: BookingMgmtSurface;
  onClose: () => void;
  onCancelled: (updated: PublicBooking) => void;
}

export default function CancelBookingDialog({
  booking,
  phone,
  surface = "dark",
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
  const brand = surface === "brand";

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
        className={`absolute inset-0 backdrop-blur-sm ${
          brand ? "bg-cut-burgundy/25" : "bg-black/70"
        }`}
        onClick={handleEscapeClose}
      />
      <div
        className={`relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl ${
          brand
            ? "border border-cut-burgundy/15 bg-cut-soft-ivory text-cut-black"
            : "border border-white/10 bg-[#0f0f0f]"
        }`}
      >
        <BookDelayedWaitingOverlay
          busy={ui.kind === "cancelling" || ui.kind === "unknown"}
          delayMs={500}
          lang="ar"
          tone="confirm"
          label="جاري إلغاء الحجز…"
        />
        <button
          type="button"
          onClick={handleEscapeClose}
          disabled={ui.kind === "cancelling"}
          className={`absolute left-4 top-4 transition-colors disabled:opacity-40 ${
            brand
              ? "text-cut-black/35 hover:text-cut-burgundy"
              : "text-cut-ivory/30 hover:text-cut-ivory/60"
          }`}
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3
              id="cancel-booking-title"
              ref={titleRef}
              tabIndex={-1}
              className={`text-base font-bold outline-none ${
                brand ? "text-cut-black" : "text-cut-ivory"
              }`}
            >
              تأكيد إلغاء الحجز
            </h3>
            <p className={`text-xs ${brand ? "text-cut-black/45" : "text-gray-500"}`} dir="ltr">
              {booking.bookingCode}
            </p>
          </div>
        </div>

        <div
          id="cancel-booking-desc"
          className={`mb-4 space-y-1 text-sm ${brand ? "text-cut-black/65" : "text-gray-400"}`}
        >
          {booking.branchName ? <p>الفرع: {booking.branchName}</p> : null}
          {services ? <p>الخدمات: {services}</p> : null}
          <p>
            {formatWorkDateAr(booking.date)} — {formatBookingTimeAr(booking.time)}
          </p>
          {overnight ? (
            <p className={`text-xs ${brand ? "text-cut-burgundy/80" : "text-cut-gold/80"}`}>
              {overnight}
            </p>
          ) : null}
          <p className="pt-2">هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.</p>
        </div>

        {ui.kind !== "success" ? (
          <div className="mb-4 space-y-2">
            <label
              className={`block text-xs ${brand ? "text-cut-black/55" : "text-cut-ivory/50"}`}
              htmlFor="cancel-reason"
            >
              سبب الإلغاء (اختياري)
            </label>
            <select
              id="cancel-reason"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={busy}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                brand
                  ? "border-cut-black/15 bg-cut-ivory text-cut-black"
                  : "border-white/10 bg-white/5 text-cut-ivory"
              }`}
            >
              <option value="">بدون تحديد</option>
              {REASON_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            {reasonCode === "other" ? (
              <textarea
                value={reasonText}
                onChange={(e) =>
                  setReasonText(e.target.value.slice(0, MAX_CANCEL_REASON_LENGTH))
                }
                disabled={busy}
                rows={2}
                className={`w-full rounded-xl border px-3 py-2 text-sm ${
                  brand
                    ? "border-cut-black/15 bg-cut-ivory text-cut-black"
                    : "border-white/10 bg-white/5 text-cut-ivory"
                }`}
                placeholder="اكتب السبب"
                aria-label="نص سبب الإلغاء"
              />
            ) : null}
          </div>
        ) : null}

        <div aria-live="polite" className="mb-4">
          {ui.kind === "cancelling" ? (
            <div
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-xs ${
                brand
                  ? "border-cut-burgundy/20 bg-cut-burgundy/10 text-cut-burgundy"
                  : "border-cut-gold/20 bg-cut-gold/10 text-cut-ivory"
              }`}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري إلغاء الحجز...
            </div>
          ) : null}
          {ui.kind === "rate_limited" ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-800">
              {ui.message}
              <p className="mt-1 font-bold tabular-nums">
                حاول مرة أخرى بعد {ui.remaining} ثانية
              </p>
            </div>
          ) : null}
          {ui.kind === "unknown" ? (
            <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-900">
              <p className="font-bold">تعذر التأكد من نتيجة طلب الإلغاء</p>
              <p>{ui.message}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void verifyThenRetry()}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    brand
                      ? "bg-cut-burgundy text-cut-ivory"
                      : "bg-cut-gold text-black"
                  }`}
                >
                  التحقق من حالة الحجز
                </button>
                <button
                  type="button"
                  onClick={() => void runCancel()}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    brand
                      ? "border-cut-burgundy/30 text-cut-burgundy"
                      : "border-cut-gold/30 text-cut-gold"
                  }`}
                >
                  إعادة المحاولة الآمنة
                </button>
              </div>
              {ui.requestId ? (
                <p className={`text-[10px] ${brand ? "text-cut-black/40" : "text-cut-ivory/30"}`}>
                  رقم مرجع الخطأ: {ui.requestId}
                </p>
              ) : null}
            </div>
          ) : null}
          {ui.kind === "error" ? (
            <div className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-800">
              <p>{ui.message}</p>
              {isStaffRequiredCode(ui.code) ? (
                <p>لم يتم إصدار أي استرداد تلقائي. يرجى التواصل مع الفرع عند الحاجة.</p>
              ) : null}
              {ui.requestId ? (
                <p className={`text-[10px] ${brand ? "text-cut-black/40" : "text-cut-ivory/30"}`}>
                  رقم مرجع الخطأ: {ui.requestId}
                </p>
              ) : null}
            </div>
          ) : null}
          {ui.kind === "success" ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-center text-xs text-green-800">
              {ui.message}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEscapeClose}
            disabled={ui.kind === "cancelling"}
            className={`flex-1 rounded-xl border py-2.5 text-sm disabled:opacity-40 ${
              brand
                ? "border-cut-black/15 text-cut-black/65 hover:border-cut-burgundy/30"
                : "border-white/10 text-cut-ivory/60 hover:border-white/20"
            }`}
          >
            رجوع
          </button>
          {ui.kind !== "success" ? (
            <button
              type="button"
              onClick={() => void runCancel()}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-cut-ivory hover:bg-red-600 disabled:opacity-60"
            >
              {ui.kind === "cancelling" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "تأكيد إلغاء الحجز"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
