"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

export interface BookingSuccessStepProps {
  bookingCode?: string | null;
  dateLine: string;
  timeLabel: string;
  branchName: string;
  branchBadge?: React.ReactNode;
  barberName: string;
  message?: string | null;
  onCopyCode: (code: string) => Promise<void> | void;
  onDone: () => void;
  copied?: boolean;
}

export default function BookingSuccessStep({
  bookingCode,
  dateLine,
  timeLabel,
  branchName,
  branchBadge,
  barberName,
  message,
  onCopyCode,
  onDone,
  copied = false,
}: BookingSuccessStepProps) {
  const { t, dir } = useBookingTranslations();
  const [showCopiedLive, setShowCopiedLive] = useState(false);
  const liveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!copied) return;
    setShowCopiedLive(true);
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => setShowCopiedLive(false), 2500);
    return () => {
      if (liveTimer.current) window.clearTimeout(liveTimer.current);
    };
  }, [copied]);

  return (
    <div
      className="p-5 md:p-6 bg-[var(--booking-bg)] flex flex-col gap-4"
      dir={dir}
      data-booking-surface="success"
    >
      <div
        className="text-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="w-14 h-14 rounded-full bg-[var(--booking-success-soft)] border border-[var(--booking-success)]/25 flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-[var(--booking-success)]" strokeWidth={3} aria-hidden />
        </div>
        <h3 className="text-xl md:text-2xl font-heading font-bold text-[var(--booking-text)] mb-1">
          {t("success.title")}
        </h3>
        <p className="text-[var(--booking-text-secondary)] text-sm">{t("success.subtitle")}</p>
      </div>

      {bookingCode ? (
        <div className="rounded-xl border border-[var(--booking-border)] bg-[var(--booking-bg)] px-3 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="sr-only">{t("success.bookingCode")}</span>
          <code
            className="flex-1 font-mono font-bold text-[var(--booking-text)] tracking-wide text-sm text-center sm:text-start select-all px-2 py-1.5 rounded-lg bg-[var(--booking-surface)] border border-[var(--booking-border-subtle)]"
            tabIndex={0}
          >
            {bookingCode}
          </code>
          <button
            type="button"
            onClick={() => void onCopyCode(bookingCode)}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-lg border border-[var(--booking-border)] bg-[var(--booking-bg)] text-[var(--booking-text)] text-sm font-bold hover:bg-[var(--booking-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            aria-label={copied ? t("actions.copied") : t("actions.copy")}
          >
            <Copy className="w-3.5 h-3.5" aria-hidden />
            {copied ? t("actions.copied") : t("actions.copy")}
          </button>
        </div>
      ) : null}

      <div
        aria-live="polite"
        className="min-h-[1.25rem] text-center text-sm font-medium text-[var(--booking-success)]"
      >
        {showCopiedLive ? t("success.copiedToast") : "\u00a0"}
      </div>

      <div
        className="rounded-2xl border border-[var(--booking-border)] bg-[var(--booking-bg)] px-4 py-4 text-start"
        aria-label={t("success.confirmationDetailsAria")}
      >
        <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--booking-text-muted)] mb-3">
          {t("success.summary")}
        </p>
        <p className="font-heading font-bold text-lg text-[var(--booking-text)]">{dateLine}</p>
        <p className="text-[var(--booking-text)] text-base font-semibold tabular-nums mt-1">
          {timeLabel}
        </p>
        <div className="mt-3">
          {branchBadge ?? (
            <p className="text-sm font-medium text-[var(--booking-text)]">{branchName}</p>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--booking-text-secondary)]">
          {t("success.craftsman")}{" "}
          <span className="font-semibold text-[var(--booking-text)]">{barberName}</span>
        </p>
      </div>

      {message ? (
        <p className="text-[var(--booking-text-secondary)] text-xs text-center">{message}</p>
      ) : null}

      <div className="flex flex-col gap-2 mt-1">
        {bookingCode ? (
          <a
            href={`/booking?code=${encodeURIComponent(bookingCode)}`}
            className="w-full min-h-11 py-3 rounded-xl border border-[var(--booking-border)] text-[var(--booking-text)] font-bold text-center hover:bg-[var(--booking-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
          >
            {t("success.viewDetails")}
          </a>
        ) : null}
        <button
          type="button"
          onClick={onDone}
          className="w-full min-h-11 py-3.5 rounded-xl bg-[var(--booking-accent)] text-white font-bold text-base hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
        >
          {t("actions.doneThanks")}
        </button>
      </div>
    </div>
  );
}
