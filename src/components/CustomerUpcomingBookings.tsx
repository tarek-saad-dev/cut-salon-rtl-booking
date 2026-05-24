"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, User, Scissors, AlertCircle, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { getUpcomingBookings, cancelBooking, type UpcomingBooking } from "@/lib/publicBookingApi";
import { getSavedClient } from "@/lib/clientStorage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPhoneFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const direct = localStorage.getItem("cut_customer_phone")?.trim();
  if (direct) return direct;
  return getSavedClient()?.phone?.trim() || null;
}

function getServiceNames(services: UpcomingBooking["services"]): string[] {
  if (!services || services.length === 0) return [];
  return services.map(s =>
    typeof s === "string" ? s : (s as { name: string }).name
  );
}

// ─── Date/Time helpers (Cairo local — no UTC conversion) ──────────────────────

function formatBookingDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${days[dateObj.getDay()]} ${d} ${months[m - 1]}`;
}

function formatBookingTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const min = mStr;
  const suffix = h >= 5 && h < 12 ? "صباحًا" : h >= 12 && h < 17 ? "مساءً" : h >= 17 && h < 21 ? "مساءً" : "ليلاً";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${min} ${suffix}`;
}

// ─── Cancel Confirmation Modal ─────────────────────────────────────────────────

function CancelConfirmModal({
  booking,
  phone,
  onConfirm,
  onClose,
}: {
  booking: UpcomingBooking;
  phone: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      await cancelBooking({ bookingId: booking.id, phone });
      onConfirm();
    } catch {
      setError("لم نتمكن من إلغاء الحجز، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0f0f0f] border border-white/10 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute left-4 top-4 text-white/30 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">إلغاء الحجز؟</h3>
            <p className="text-gray-500 text-xs">{formatBookingDate(booking.date)} — {formatBookingTime(booking.time)}</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-5">هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/20 hover:text-white/80 transition-colors disabled:opacity-40"
          >
            لا، احتفظ بالحجز
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، إلغاء الحجز"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  phone,
  onCancelled,
  isPrimary = false,
}: {
  booking: UpcomingBooking;
  phone: string;
  onCancelled: () => void;
  isPrimary?: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const statusKey = (booking.status ?? "").toLowerCase();
  const statusLabel: Record<string, { text: string; cls: string }> = {
    confirmed: { text: "مؤكد", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    pending: { text: "قيد الانتظار", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    cancelled: { text: "ملغي", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const badge = statusLabel[statusKey] ?? { text: booking.status ?? "غير معروف", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" };

  return (
    <>
      <div className={`rounded-xl overflow-hidden border ${isPrimary
        ? "bg-gradient-to-b from-[#D4AF37]/[0.07] to-[#0f0f0f] border-[#D4AF37]/30 shadow-[0_0_24px_rgba(212,175,55,0.08)]"
        : "bg-[#0f0f0f] border-[#D4AF37]/15"
        }`}>
        {/* Header stripe */}
        <div className="px-4 py-2 bg-[#D4AF37]/5 border-b border-[#D4AF37]/10 flex items-center justify-between">
          <span className="text-[#D4AF37] text-xs font-bold">{isPrimary ? "حجزك القادم" : "حجز قادم"}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.text}</span>
        </div>

        <div className="px-4 py-3 space-y-2">
          {/* Date + Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span>{formatBookingDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span>{formatBookingTime(booking.time)}</span>
            </div>
          </div>

          {/* Barber */}
          {booking.barberName && (
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>مع {booking.barberName}</span>
            </div>
          )}

          {/* Services */}
          {(() => {
            const names = getServiceNames(booking.services);
            return names.length > 0 ? (
              <div className="flex items-start gap-1.5 text-white/60 text-xs">
                <Scissors className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{names.join(" + ")}</span>
              </div>
            ) : null;
          })()}

          {/* Price + Duration */}
          <div className="flex items-center gap-3">
            {booking.totalPrice != null && booking.totalPrice > 0 && (
              <span className="text-[#D4AF37] text-xs font-bold">
                الإجمالي: {booking.totalPrice} جنيه
              </span>
            )}
            {booking.totalDuration != null && booking.totalDuration > 0 && (
              <span className="text-white/40 text-xs">
                {booking.totalDuration} دقيقة
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3">
          {booking.canCancel === true ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
            >
              إلغاء الحجز
            </button>
          ) : (
            <p className="text-center text-white/20 text-[11px]">لا يمكن إلغاء هذا الحجز الآن</p>
          )}
        </div>
      </div>

      {showConfirm && (
        <CancelConfirmModal
          booking={booking}
          phone={phone}
          onConfirm={() => { setShowConfirm(false); onCancelled(); }}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookingSkeleton() {
  return (
    <div className="rounded-xl bg-[#0f0f0f] border border-white/5 overflow-hidden animate-pulse">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 h-8" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
      <div className="px-4 pb-3">
        <div className="h-8 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CustomerUpcomingBookingsProps {
  phone?: string;
  onCancelled?: () => void;
}

export default function CustomerUpcomingBookings({ phone: phoneProp, onCancelled }: CustomerUpcomingBookingsProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Resolve phone from prop or localStorage
  useEffect(() => {
    const resolved = phoneProp?.trim() || getPhoneFromStorage() || null;
    if (process.env.NODE_ENV === "development") {
      console.log("[upcoming] resolved phone:", resolved);
    }
    setPhone(resolved || null);
    setInitialized(true);
  }, [phoneProp]);

  const fetchBookings = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res = await getUpcomingBookings(p);
      if (process.env.NODE_ENV === "development") {
        console.log("[upcoming] API response:", res);
      }
      if (res.ok) setBookings(res.bookings ?? []);
      else setBookings([]);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[upcoming] fetch error:", err);
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized || !phone) return;
    if (process.env.NODE_ENV === "development") {
      console.log("[upcoming] auto load start:", phone);
    }
    fetchBookings(phone);
  }, [initialized, phone, fetchBookings]);

  const handleCancelled = () => {
    if (phone) fetchBookings(phone);
    onCancelled?.();
  };

  // Don't render anything if no phone or still resolving
  if (!initialized || !phone) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="px-6 pt-4 pb-2" dir="rtl">
        <BookingSkeleton />
      </div>
    );
  }

  // No bookings — silent
  if (bookings.length === 0) return null;

  const title = bookings.length === 1 ? "تذكير بحجزك القادم" : "حجوزاتك القادمة";

  return (
    <div className="px-6 pt-4 pb-2" dir="rtl">
      {/* Section header with collapse toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-xs font-bold">{title}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20">
            {bookings.length}
          </span>
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
          : <ChevronDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
        }
      </button>

      {expanded && (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <BookingCard
              key={String(b.id)}
              booking={b}
              phone={phone}
              onCancelled={handleCancelled}
              isPrimary={i === 0}
            />
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mt-4 border-t border-white/5" />
    </div>
  );
}
