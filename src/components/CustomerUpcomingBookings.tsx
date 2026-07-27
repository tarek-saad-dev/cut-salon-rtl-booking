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
import BookingManagementCard from "@/components/booking-management/BookingManagementCard";

interface CustomerUpcomingBookingsProps {
  /** Explicit phone from a deliberate user action (e.g. logged-in client). Never auto-read storage. */
  phone?: string;
  onCancelled?: () => void;
  /** compact = hero/modal CTA strip; form = phone entry + list; embedded = list only when phone provided */
  variant?: "compact" | "form" | "embedded";
}

function BookingSkeleton() {
  return (
    <div className="rounded-xl bg-[#0f0f0f] border border-white/5 overflow-hidden animate-pulse">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 h-8" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function CustomerUpcomingBookings({
  phone: phoneProp,
  onCancelled,
  variant = "compact",
}: CustomerUpcomingBookingsProps) {
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
      prev.map((b) =>
        b.bookingCode === updated.bookingCode ? updated : b,
      ),
    );
    onCancelled?.();
  };

  if (variant === "compact" && !phoneProp) {
    return (
      <div className="px-6 pt-4 pb-2" dir="rtl">
        <Link
          href="/booking"
          className="flex items-center justify-between gap-3 rounded-xl border border-cut-gold/20 bg-cut-gold/[0.06] px-4 py-3 text-sm text-cut-ivory/80 hover:border-cut-gold/40 transition-colors"
        >
          <span className="font-medium">إدارة حجوزاتك أو البحث بكود الحجز</span>
          <Search className="w-4 h-4 text-cut-gold flex-shrink-0" />
        </Link>
      </div>
    );
  }

  const showForm = variant === "form" || (variant === "embedded" && !phoneProp);

  return (
    <div className="px-6 pt-4 pb-2" dir="rtl">
      {showForm && (
        <form onSubmit={handleSubmitPhone} className="mb-4 space-y-2">
          <label htmlFor="upcoming-phone" className="block text-xs text-cut-ivory/50">
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
              className="flex-1 rounded-xl bg-white/5 border border-white/10 text-cut-ivory text-sm px-3 py-2.5"
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading || Boolean(rateLimitUntil && rateRemaining > 0)}
              className="px-4 rounded-xl bg-cut-gold text-black text-sm font-bold disabled:opacity-50"
            >
              عرض
            </button>
          </div>
          <p className="text-[11px] text-cut-ivory/30">
            لن يتم حفظ رقم الهاتف تلقائياً على هذا الجهاز.
          </p>
        </form>
      )}

      {error && (
        <div
          className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center"
          aria-live="assertive"
          role="alert"
        >
          {error}
          {rateRemaining > 0 && (
            <p className="mt-1 font-bold tabular-nums">
              حاول مرة أخرى بعد {rateRemaining} ثانية
            </p>
          )}
          {requestId && (
            <p className="mt-1 text-[10px] text-cut-ivory/30">رقم مرجع الخطأ: {requestId}</p>
          )}
        </div>
      )}

      {loading && <BookingSkeleton />}

      {!loading && searched && !error && bookings.length === 0 && activePhone && (
        <p className="text-center text-cut-ivory/40 text-sm py-4" aria-live="polite">
          لا توجد حجوزات قادمة لهذا الرقم
        </p>
      )}

      {!loading && bookings.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center justify-between w-full mb-3 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-cut-ivory/70 text-xs font-bold">
                {bookings.length === 1 ? "تذكير بحجزك القادم" : "حجوزاتك القادمة"}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cut-gold/15 text-cut-gold border border-cut-gold/20">
                {bookings.length}
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-cut-ivory/30" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-cut-ivory/30" />
            )}
          </button>

          {expanded && (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <BookingManagementCard
                  key={b.bookingCode}
                  booking={b}
                  phone={activePhone}
                  onUpdated={handleUpdated}
                  isPrimary={i === 0}
                />
              ))}
            </div>
          )}
        </>
      )}

      {loading && (
        <span className="sr-only" aria-live="polite">
          جاري تحميل الحجوزات
          <Loader2 className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
