"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  lookupBooking,
  getBookingAccess,
  BookingApiError,
  BOOKING_CODE_MAX_LENGTH,
  type PublicBooking,
} from "@/lib/booking-api";
import {
  isMinimalOwnership,
  isValidBookingCodeShape,
  neutralOwnershipMessage,
  normalizeBookingCode,
  normalizeEgyptianPhone,
} from "@/lib/booking-management/display";
import BookingManagementCard from "@/components/booking-management/BookingManagementCard";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import {
  bookingMgmtSurface,
  type BookingMgmtSurface,
} from "@/lib/booking-management/surface";

interface BookingLookupPanelProps {
  initialCode?: string;
  surface?: BookingMgmtSurface;
}

export default function BookingLookupPanel({
  initialCode,
  surface = "dark",
}: BookingLookupPanelProps) {
  const s = bookingMgmtSurface[surface];
  const [codeInput, setCodeInput] = useState(initialCode ?? "");
  const [phoneInput, setPhoneInput] = useState("");
  const [needPhone, setNeedPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateRemaining, setRateRemaining] = useState(0);
  const [ownershipMode, setOwnershipMode] = useState<"access-token" | "phone" | null>(null);

  useEffect(() => {
    if (initialCode) setCodeInput(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setRateRemaining(rem);
      if (rem <= 0) setRateLimitUntil(null);
    }, 500);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  const rateBlocked = Boolean(rateLimitUntil && rateRemaining > 0);

  const runLookup = useCallback(
    async (opts?: { forcePhone?: boolean }) => {
      if (rateBlocked) return;
      const code = normalizeBookingCode(codeInput);
      if (!isValidBookingCodeShape(code)) {
        setError("يرجى إدخال كود حجز صالح");
        return;
      }

      setLoading(true);
      setError(null);
      setRequestId(null);
      setBooking(null);

      const stored = getBookingAccess(code);
      const useToken = Boolean(stored?.bookingAccessToken) && !opts?.forcePhone;
      const phone = normalizeEgyptianPhone(phoneInput);

      if (!useToken && needPhone && !phone) {
        setLoading(false);
        setError("يرجى إدخال رقم الهاتف للتحقق من الحجز");
        setNeedPhone(true);
        return;
      }

      try {
        if (useToken) {
          setOwnershipMode("access-token");
          const res = await lookupBooking(code);
          if (isMinimalOwnership(res.data)) {
            setNeedPhone(true);
            setOwnershipMode(null);
            setError("يلزم إدخال رقم الهاتف لعرض تفاصيل الحجز الكاملة");
            return;
          }
          setBooking(res.data);
          setNeedPhone(false);
          return;
        }

        if (!phone) {
          setNeedPhone(true);
          setError(null);
          return;
        }

        setOwnershipMode("phone");
        const res = await lookupBooking(code, { phone });
        if (isMinimalOwnership(res.data)) {
          setError(neutralOwnershipMessage());
          setBooking(null);
          return;
        }
        setBooking(res.data);
        setNeedPhone(false);
      } catch (err) {
        setBooking(null);
        if (err instanceof BookingApiError) {
          setRequestId(err.requestId);
          if (err.isRateLimited && err.retryAfterSeconds) {
            setRateLimitUntil(Date.now() + err.retryAfterSeconds * 1000);
            setRateRemaining(err.retryAfterSeconds);
            setError(err.message);
            return;
          }
          if (
            useToken &&
            (err.code === "BOOKING_NOT_FOUND" ||
              err.code === "BOOKING_NOT_FOUND_OR_UNAUTHORIZED" ||
              err.httpStatus === 401 ||
              err.httpStatus === 403)
          ) {
            setNeedPhone(true);
            setOwnershipMode(null);
            setError("يلزم إدخال رقم الهاتف للتحقق من الحجز");
            return;
          }
          setError(neutralOwnershipMessage());
        } else {
          setError("تعذر البحث عن الحجز، حاول مرة أخرى");
        }
      } finally {
        setLoading(false);
      }
    },
    [codeInput, phoneInput, needPhone, rateBlocked],
  );

  // Auto-lookup when arriving with code + stored token (e.g. after create)
  useEffect(() => {
    if (!initialCode) return;
    const code = normalizeBookingCode(initialCode);
    if (!isValidBookingCodeShape(code)) return;
    if (getBookingAccess(code)) {
      void runLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const queryKeyLabel = useMemo(
    () =>
      ownershipMode
        ? `["public-booking","lookup",${JSON.stringify(normalizeBookingCode(codeInput))},${JSON.stringify(ownershipMode)}]`
        : null,
    [codeInput, ownershipMode],
  );
  void queryKeyLabel; // documentation marker for safe keys (no raw token)

  return (
    <div className="relative space-y-4" dir="rtl">
      <BookDelayedWaitingOverlay
        busy={loading}
        delayMs={700}
        lang="ar"
        tone="slots"
        label="جاري البحث عن الحجز…"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runLookup();
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="lookup-code" className={`mb-1.5 block text-xs ${s.label}`}>
            كود الحجز
          </label>
          <input
            id="lookup-code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            disabled={loading || rateBlocked}
            className={`w-full font-mono tracking-wide ${s.input}`}
            placeholder="BK-XXXXXXXX"
            dir="ltr"
            autoComplete="off"
            maxLength={BOOKING_CODE_MAX_LENGTH}
          />
        </div>

        {needPhone ? (
          <div>
            <label htmlFor="lookup-phone" className={`mb-1.5 block text-xs ${s.label}`}>
              رقم الهاتف المستخدم في الحجز
            </label>
            <input
              id="lookup-phone"
              type="tel"
              inputMode="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={loading || rateBlocked}
              className={`w-full ${s.input}`}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              autoComplete="tel"
            />
            <p className={`mt-1 text-[11px] ${s.hint}`}>لن يتم حفظ رقم الهاتف تلقائياً.</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || rateBlocked}
          className={`inline-flex w-full items-center justify-center gap-2 ${s.primaryBtn}`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري البحث...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              عرض الحجز
            </>
          )}
        </button>
      </form>

      <div aria-live="polite">
        {error ? (
          <div className={s.errorBox} role="alert">
            {error}
            {rateRemaining > 0 ? (
              <p className="mt-1 font-bold tabular-nums">
                حاول مرة أخرى بعد {rateRemaining} ثانية
              </p>
            ) : null}
            {requestId ? (
              <p className={`mt-1 text-[10px] ${s.errorMeta}`}>رقم مرجع الخطأ: {requestId}</p>
            ) : null}
          </div>
        ) : null}

        {booking ? (
          <BookingManagementCard
            booking={booking}
            phone={ownershipMode === "phone" ? normalizeEgyptianPhone(phoneInput) : null}
            onUpdated={setBooking}
            isPrimary
            allowCancel={!isMinimalOwnership(booking)}
            surface={surface}
          />
        ) : null}
      </div>
    </div>
  );
}
