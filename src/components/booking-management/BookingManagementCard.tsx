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
import {
  bookingMgmtSurface,
  type BookingMgmtSurface,
} from "@/lib/booking-management/surface";
import CancelBookingDialog from "./CancelBookingDialog";

interface BookingManagementCardProps {
  booking: PublicBooking;
  phone?: string | null;
  onUpdated: (booking: PublicBooking) => void;
  isPrimary?: boolean;
  /** When true, cancel is allowed if backend says canCancel (full ownership) */
  allowCancel?: boolean;
  surface?: BookingMgmtSurface;
}

export default function BookingManagementCard({
  booking,
  phone,
  onUpdated,
  isPrimary = false,
  allowCancel = true,
  surface = "dark",
}: BookingManagementCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const badge = mapBookingStatus(booking.status);
  const overnight = formatOvernightHint(booking);
  const services = getServiceNames(booking.services);
  const cancelDisabled = !allowCancel || shouldDisableCancelCta(booking);
  const s = bookingMgmtSurface[surface].card;

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
      <article className={isPrimary ? s.primary : s.secondary}>
        <div className={s.head}>
          <span className={s.headTitle}>
            {badge.cancelled ? "حجز ملغي" : isPrimary ? "حجزك القادم" : "حجز"}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}
            aria-label={`الحالة: ${badge.text}`}
          >
            {badge.text}
          </span>
        </div>

        <div className="space-y-2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className={s.code} dir="ltr">
              {booking.bookingCode}
            </p>
            <button type="button" onClick={() => void copyCode()} className={s.copy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "تم النسخ" : "نسخ الكود"}
            </button>
          </div>

          {booking.branchName ? <p className={s.branch}>{booking.branchName}</p> : null}

          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center gap-1.5 ${s.meta}`}>
              <Calendar className={`h-3.5 w-3.5 shrink-0 ${s.icon}`} />
              <span>{formatWorkDateAr(booking.date)}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${s.meta}`}>
              <Clock className={`h-3.5 w-3.5 shrink-0 ${s.icon}`} />
              <span>{formatBookingTimeAr(booking.time)}</span>
            </div>
          </div>
          {overnight ? (
            <p className={s.overnight}>
              موعدك: {formatBookingTimeAr(booking.time)} — {overnight}
            </p>
          ) : null}

          {booking.barberName ? (
            <div className={`flex items-center gap-1.5 ${s.detail}`}>
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>مع {booking.barberName}</span>
            </div>
          ) : null}

          {services.length > 0 ? (
            <div className={`flex items-start gap-1.5 ${s.detail}`}>
              <Scissors className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-words">{services.join(" + ")}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {booking.totalPrice != null && booking.totalPrice > 0 ? (
              <span className={s.price}>الإجمالي: {booking.totalPrice} جنيه</span>
            ) : null}
            {booking.totalDuration != null && booking.totalDuration > 0 ? (
              <span className={s.duration}>{booking.totalDuration} دقيقة</span>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-3">
          {!cancelDisabled ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="w-full rounded-xl border border-red-500/25 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10"
            >
              إلغاء الحجز
            </button>
          ) : badge.cancelled ? (
            <p className={s.cancelOff}>تم إلغاء هذا الحجز</p>
          ) : (
            <p className={s.cancelBlocked}>لا يمكن إلغاء هذا الحجز إلكترونياً حالياً</p>
          )}
        </div>
      </article>

      {showConfirm ? (
        <CancelBookingDialog
          booking={booking}
          phone={phone}
          surface={surface}
          onClose={() => setShowConfirm(false)}
          onCancelled={(updated) => {
            setShowConfirm(false);
            onUpdated(updated);
          }}
        />
      ) : null}
    </>
  );
}
