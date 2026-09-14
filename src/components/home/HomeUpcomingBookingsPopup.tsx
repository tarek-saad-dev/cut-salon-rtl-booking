"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, Clock, User, X } from "lucide-react";
import {
  getUpcomingBookings,
  UPCOMING_BOOKINGS_DEFAULT_LIMIT,
  type PublicBooking,
} from "@/lib/booking-api";
import { getSavedClient } from "@/lib/clientStorage";
import {
  formatBookingTimeAr,
  formatWorkDateAr,
  mapBookingStatus,
} from "@/lib/booking-management/display";
import { useLanguage } from "@/context/LanguageContext";
import BookingManagementCard from "@/components/booking-management/BookingManagementCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VISIBLE_CAP = 3;
const DISMISS_STORAGE_KEY = "cut_home_upcoming_dismissed";

type Copy = {
  title: string;
  view: string;
  more: (n: number) => string;
  dismiss: string;
  modalTitle: string;
};

const COPY: Record<"ar" | "en", Copy> = {
  ar: {
    title: "حجزك القادم",
    view: "عرض الحجز",
    more: (n) => `+${n} حجوزات أخرى`,
    dismiss: "إخفاء",
    modalTitle: "تفاصيل الحجز",
  },
  en: {
    title: "Your upcoming booking",
    view: "View booking",
    more: (n) => `+${n} more`,
    dismiss: "Dismiss",
    modalTitle: "Booking details",
  },
};

function readDismissedCodes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((c): c is string => typeof c === "string"));
  } catch {
    return new Set();
  }
}

function writeDismissedCodes(codes: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify([...codes]));
  } catch {
    /* quota / private mode */
  }
}

function isActiveUpcoming(booking: PublicBooking): boolean {
  const badge = mapBookingStatus(booking.status);
  return !badge.cancelled && !badge.completed;
}

export default function HomeUpcomingBookingsPopup() {
  const { lang, isArabic } = useLanguage();
  const copy = COPY[lang] ?? COPY.ar;
  const reduced = useReducedMotion();

  const [phone, setPhone] = useState<string | null>(null);
  const [bookings, setBookings] = useState<PublicBooking[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDismissed(readDismissedCodes());
    const client = getSavedClient();
    const p = client?.phone?.trim() || null;
    setPhone(p);
    if (!p) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await getUpcomingBookings(p, {
          limit: UPCOMING_BOOKINGS_DEFAULT_LIMIT,
        });
        if (cancelled) return;
        setBookings((res.data ?? []).filter(isActiveUpcoming));
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleBookings = useMemo(
    () => bookings.filter((b) => !dismissed.has(b.bookingCode)),
    [bookings, dismissed],
  );

  const shown = visibleBookings.slice(0, VISIBLE_CAP);
  const overflow = Math.max(0, visibleBookings.length - VISIBLE_CAP);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.bookingCode === selectedCode) ?? null,
    [bookings, selectedCode],
  );

  const dismissCode = useCallback((code: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(code);
      writeDismissedCodes(next);
      return next;
    });
    setSelectedCode((cur) => (cur === code ? null : cur));
  }, []);

  const handleBookingUpdated = useCallback((updated: PublicBooking) => {
    const badge = mapBookingStatus(updated.status);
    setBookings((prev) => {
      if (badge.cancelled || badge.completed) {
        return prev.filter((b) => b.bookingCode !== updated.bookingCode);
      }
      return prev.map((b) =>
        b.bookingCode === updated.bookingCode ? updated : b,
      );
    });
    if (badge.cancelled || badge.completed) {
      setSelectedCode(null);
    }
  }, []);

  if (!ready || !phone || shown.length === 0) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[57] end-3 top-[calc(var(--cut-mobile-nav-total,0px)+0.75rem)] flex w-[min(100%-1.5rem,20rem)] flex-col gap-2 sm:end-4 lg:top-[calc(var(--cut-campaign-bar-height,0px)+76px+0.75rem)]"
        data-home-upcoming-popup
      >
        <AnimatePresence initial={!reduced}>
          {shown.map((booking, index) => (
            <motion.div
              key={booking.bookingCode}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, x: isArabic ? 24 : -24, scale: 0.96 }}
              transition={{ duration: 0.28, delay: reduced ? 0 : index * 0.05 }}
              className="pointer-events-auto"
            >
              <UpcomingReminderCard
                booking={booking}
                title={index === 0 ? copy.title : undefined}
                viewLabel={copy.view}
                dismissLabel={copy.dismiss}
                onView={() => setSelectedCode(booking.bookingCode)}
                onDismiss={() => dismissCode(booking.bookingCode)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {overflow > 0 ? (
          <Link
            href="/booking"
            className="pointer-events-auto rounded-xl border border-cut-bronze/25 bg-cut-black/80 px-3 py-2 text-center text-[11px] font-semibold text-cut-warm-beige backdrop-blur-md transition hover:border-cut-bronze/45 hover:text-cut-ivory"
          >
            {copy.more(overflow)}
          </Link>
        ) : null}
      </div>

      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) setSelectedCode(null);
        }}
      >
        <DialogContent
          className="max-h-[min(90vh,40rem)] max-w-md overflow-y-auto border-cut-bronze/25 bg-cut-soft-black p-4 text-cut-ivory sm:rounded-2xl"
          hideDefaultClose={false}
        >
          <DialogHeader className="pb-1 text-start">
            <DialogTitle className="text-base font-bold text-cut-ivory">
              {copy.modalTitle}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking ? (
            <BookingManagementCard
              booking={selectedBooking}
              phone={phone}
              allowCancel
              isPrimary
              surface="dark"
              onUpdated={handleBookingUpdated}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function UpcomingReminderCard({
  booking,
  title,
  viewLabel,
  dismissLabel,
  onView,
  onDismiss,
}: {
  booking: PublicBooking;
  title?: string;
  viewLabel: string;
  dismissLabel: string;
  onView: () => void;
  onDismiss: () => void;
}) {
  const summary = [booking.barberName, booking.branchName].filter(Boolean).join(" · ");

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-cut-bronze/30 bg-cut-espresso/95 text-cut-ivory shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
      aria-label={title ?? booking.bookingCode}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 80% 0%, rgba(164,136,121,0.18), transparent 55%)",
        }}
        aria-hidden
      />

      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="absolute top-2 end-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-cut-bronze/20 bg-cut-black/50 text-cut-ivory/70 transition hover:bg-cut-wine-black hover:text-cut-ivory"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative space-y-2.5 px-3.5 pb-3 pt-3 pe-11">
        {title ? (
          <p className="text-[10px] font-bold tracking-[0.14em] text-cut-bronze uppercase">
            {title}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cut-ivory/90">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-cut-bronze" />
            {formatWorkDateAr(booking.date)}
          </span>
          <span className="inline-flex items-center gap-1.5" dir="ltr">
            <Clock className="h-3.5 w-3.5 shrink-0 text-cut-bronze" />
            {formatBookingTimeAr(booking.time)}
          </span>
        </div>

        {summary ? (
          <p className="flex items-center gap-1.5 text-[11px] text-cut-ivory/70">
            <User className="h-3.5 w-3.5 shrink-0 text-cut-bronze/80" />
            <span className="truncate">{summary}</span>
          </p>
        ) : null}

        <button
          type="button"
          onClick={onView}
          className="w-full rounded-xl bg-cut-ivory px-3 py-2 text-xs font-bold text-cut-black transition hover:bg-cut-warm-beige"
        >
          {viewLabel}
        </button>
      </div>
    </article>
  );
}
