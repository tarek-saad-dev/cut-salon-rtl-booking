"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import Link from "next/link";
import {
  getUpcomingBookings,
  BookingApiError,
  UPCOMING_BOOKINGS_DEFAULT_LIMIT,
  type PublicBooking,
} from "@/lib/booking-api";
import { normalizeEgyptianPhone } from "@/lib/booking-management/display";
import {
  bookingMgmtSurface,
  type BookingMgmtSurface,
} from "@/lib/booking-management/surface";
import { BookDelayedWaitingOverlay } from "@/components/book/BookDelayedWaitingOverlay";
import BookingManagementCard from "@/components/booking-management/BookingManagementCard";

interface CustomerUpcomingBookingsProps {
  /** Explicit phone from a deliberate user action (e.g. logged-in client). Never auto-read storage. */
  phone?: string;
  onCancelled?: () => void;
  /** compact = hero/modal CTA strip; form = phone entry + list; embedded = list only when phone provided */
  variant?: "compact" | "form" | "embedded";
  surface?: BookingMgmtSurface;
}

function BookingSkeleton({ surface }: { surface: BookingMgmtSurface }) {
  const s = bookingMgmtSurface[surface];
  return (
    <div className={s.skeleton}>
      <div className={`h-8 border-b border-cut-burgundy/5 px-4 py-2 ${s.skeletonBar}`} />
      <div className="space-y-2 px-4 py-3">
        <div className={`h-4 w-3/4 rounded ${s.skeletonBar}`} />
        <div className={`h-3 w-1/2 rounded ${s.skeletonBar}`} />
      </div>
    </div>
  );
}

export default function CustomerUpcomingBookings({
  phone: phoneProp,
  onCancelled,
  variant = "compact",
  surface = "dark",
}: CustomerUpcomingBookingsProps) {
  const s = bookingMgmtSurface[surface];
  const [phoneInput, setPhoneInput] = useState("");
  const [activePhone, setActivePhone] = useState<string | null>(
    phoneProp?.trim() ? phoneProp.trim() : null,
  );
  const [bookings, setBookings] = useState<PublicBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateRemaining, setRateRemaining] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (phoneProp?.trim()) setActivePhone(phoneProp.trim());
  }, [phoneProp]);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setRateRemaining(rem);
      if (rem <= 0) setRateLimitUntil(null);
    }, 500);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  const fetchBookings = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    setRequestId(null);
    try {
      const res = await getUpcomingBookings(p, { limit: UPCOMING_BOOKINGS_DEFAULT_LIMIT });
      setBookings(res.data ?? []);
      setSearched(true);
    } catch (err) {
      setBookings([]);
      setSearched(true);
      if (err instanceof BookingApiError) {
        setRequestId(err.requestId);
        if (err.isRateLimited && err.retryAfterSeconds) {
          setRateLimitUntil(Date.now() + err.retryAfterSeconds * 1000);
          setRateRemaining(err.retryAfterSeconds);
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError("تعذر تحميل الحجوزات، حاول مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activePhone) return;
    if (rateLimitUntil && Date.now() < rateLimitUntil) return;
    void fetchBookings(activePhone);
  }, [activePhone, fetchBookings, rateLimitUntil]);

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitUntil && Date.now() < rateLimitUntil) return;
    const normalized = normalizeEgyptianPhone(phoneInput);
    if (!normalized) {
      setError("يرجى إدخال رقم هاتف صحيح");
      return;
    }
    setActivePhone(normalized);
  };

  const handleUpdated = (updated: PublicBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b.bookingCode === updated.bookingCode ? updated : b)),
    );
    onCancelled?.();
  };

  if (variant === "compact" && !phoneProp) {
    return (
      <div className="px-6 pb-2 pt-4" dir="rtl">
        <Link href="/booking" className={s.compactLink}>
          <span className="font-medium">إدارة حجوزاتك أو البحث بكود الحجز</span>
          <Search className={`h-4 w-4 shrink-0 ${s.compactIcon}`} />
        </Link>
      </div>
    );
  }

  const showForm = variant === "form" || (variant === "embedded" && !phoneProp);
  const pad = surface === "brand" && variant === "form" ? "px-0" : "px-6";

  return (
    <div className={`relative ${pad} pb-2 pt-4`} dir="rtl">
      <BookDelayedWaitingOverlay
        busy={loading}
        delayMs={700}
        lang="ar"
        label="جاري تحميل الحجوزات…"
      />
      {showForm ? (
        <form onSubmit={handleSubmitPhone} className="mb-4 space-y-2">
          <label htmlFor="upcoming-phone" className={`block text-xs ${s.label}`}>
            أدخل رقم هاتفك لعرض الحجوزات القادمة
          </label>
          <div className="flex gap-2">
            <input
              id="upcoming-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={Boolean(rateLimitUntil && rateRemaining > 0)}
              className={`min-w-0 flex-1 ${s.input}`}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading || Boolean(rateLimitUntil && rateRemaining > 0)}
              className={`shrink-0 ${s.primaryBtn} !py-2.5`}
            >
              عرض
            </button>
          </div>
          <p className={`text-[11px] ${s.hint}`}>لن يتم حفظ رقم الهاتف تلقائياً على هذا الجهاز.</p>
        </form>
      ) : null}

      {error ? (
        <div className={`mb-3 ${s.errorBox}`} aria-live="assertive" role="alert">
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

      {loading ? <BookingSkeleton surface={surface} /> : null}

      {!loading && searched && !error && bookings.length === 0 && activePhone ? (
        <p className={`py-4 text-center text-sm ${s.mutedText}`} aria-live="polite">
          لا توجد حجوزات قادمة لهذا الرقم
        </p>
      ) : null}

      {!loading && bookings.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="group mb-3 flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={s.listTitle}>
                {bookings.length === 1 ? "تذكير بحجزك القادم" : "حجوزاتك القادمة"}
              </span>
              <span className={s.listCount}>{bookings.length}</span>
            </div>
            {expanded ? (
              <ChevronUp className={`h-3.5 w-3.5 ${s.chevron}`} />
            ) : (
              <ChevronDown className={`h-3.5 w-3.5 ${s.chevron}`} />
            )}
          </button>

          {expanded ? (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <BookingManagementCard
                  key={b.bookingCode}
                  booking={b}
                  phone={activePhone}
                  onUpdated={handleUpdated}
                  isPrimary={i === 0}
                  surface={surface}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {loading ? (
        <span className="sr-only" aria-live="polite">
          جاري تحميل الحجوزات
          <Loader2 className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  );
}
