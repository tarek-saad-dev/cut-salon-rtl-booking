"use client";

import { useState } from "react";
import { Calendar, Clock, User, Scissors, Copy, Check } from "lucide-react";
import type { PublicBooking } from "@/lib/booking-api";
import {
  formatBookingTimeAr,
  formatOvernightHint,
  formatWorkDateAr,
  getServiceNames,
  mapBookingStatus,
  shouldDisableCancelCta,
} from "@/lib/booking-management/display";
import CancelBookingDialog from "./CancelBookingDialog";

interface BookingManagementCardProps {
  booking: PublicBooking;
  phone?: string | null;
  onUpdated: (booking: PublicBooking) => void;
  isPrimary?: boolean;
  /** When true, cancel is allowed if backend says canCancel (full ownership) */
  allowCancel?: boolean;
}

export default function BookingManagementCard({
  booking,
  phone,
  onUpdated,
  isPrimary = false,
  allowCancel = true,
}: BookingManagementCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const badge = mapBookingStatus(booking.status);
  const overnight = formatOvernightHint(booking);
  const services = getServiceNames(booking.services);
  const cancelDisabled = !allowCancel || shouldDisableCancelCta(booking);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <article
        className={`rounded-xl overflow-hidden border ${
          isPrimary
            ? "bg-gradient-to-b from-cut-gold/[0.07] to-[#0f0f0f] border-cut-gold/30 shadow-[0_0_24px_rgba(164,136,121,0.08)]"
            : "bg-[#0f0f0f] border-cut-gold/15"
        }`}
      >
        <div className="px-4 py-2 bg-cut-gold/5 border-b border-cut-gold/10 flex items-center justify-between gap-2">
          <span className="text-cut-gold text-xs font-bold">
            {badge.cancelled ? "حجز ملغي" : isPrimary ? "حجزك القادم" : "حجز"}
          </span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}
            aria-label={`الحالة: ${badge.text}`}
          >
            {badge.text}
          </span>
        </div>

        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-cut-ivory/90 text-sm font-mono tracking-wide" dir="ltr">
              {booking.bookingCode}
            </p>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="inline-flex items-center gap-1 text-[11px] text-cut-ivory/50 hover:text-cut-gold"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "تم النسخ" : "نسخ الكود"}
            </button>
          </div>

          {booking.branchName && (
            <p className="text-cut-ivory/50 text-xs">{booking.branchName}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-cut-ivory/80 text-sm">
              <Calendar className="w-3.5 h-3.5 text-cut-gold flex-shrink-0" />
              <span>{formatWorkDateAr(booking.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cut-ivory/80 text-sm">
              <Clock className="w-3.5 h-3.5 text-cut-gold flex-shrink-0" />
              <span>{formatBookingTimeAr(booking.time)}</span>
            </div>
          </div>
          {overnight && (
            <p className="text-cut-gold/80 text-[11px]">
              موعدك: {formatBookingTimeAr(booking.time)} — {overnight}
            </p>
          )}

          {booking.barberName && (
            <div className="flex items-center gap-1.5 text-cut-ivory/60 text-xs">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>مع {booking.barberName}</span>
            </div>
          )}

          {services.length > 0 && (
            <div className="flex items-start gap-1.5 text-cut-ivory/60 text-xs">
              <Scissors className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="break-words">{services.join(" + ")}</span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {booking.totalPrice != null && booking.totalPrice > 0 && (
              <span className="text-cut-gold text-xs font-bold">
                الإجمالي: {booking.totalPrice} جنيه
              </span>
            )}
            {booking.totalDuration != null && booking.totalDuration > 0 && (
              <span className="text-cut-ivory/40 text-xs">{booking.totalDuration} دقيقة</span>
            )}
          </div>
        </div>

        <div className="px-4 pb-3">
          {!cancelDisabled ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="w-full py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
            >
              إلغاء الحجز
            </button>
          ) : badge.cancelled ? (
            <p className="text-center text-cut-ivory/30 text-[11px]">تم إلغاء هذا الحجز</p>
          ) : (
            <p className="text-center text-cut-ivory/20 text-[11px]">
              لا يمكن إلغاء هذا الحجز إلكترونياً حالياً
            </p>
          )}
        </div>
      </article>

      {showConfirm && (
        <CancelBookingDialog
          booking={booking}
          phone={phone}
          onClose={() => setShowConfirm(false)}
          onCancelled={(updated) => {
            setShowConfirm(false);
            onUpdated(updated);
          }}
        />
      )}
    </>
  );
}
