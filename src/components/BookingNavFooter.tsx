"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

export function BookingNavFooter({
  onBack,
  onContinue,
  continueLabel,
  backLabel,
  continueDisabled,
  continueLoading,
  hideBack,
  continueType = "button",
}: {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  backLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  hideBack?: boolean;
  continueType?: "button" | "submit";
}) {
  const { t, dir } = useBookingTranslations();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  return (
    <div className="flex flex-col gap-2 px-5 md:px-6 pb-5 pt-2 flex-shrink-0 border-t border-[var(--booking-border)] bg-[var(--booking-bg)] sticky bottom-0">
      {onContinue ? (
        <button
          type={continueType}
          onClick={onContinue}
          disabled={continueDisabled || continueLoading}
          className="w-full min-h-11 py-3 rounded-xl bg-[var(--booking-accent)] text-white font-bold text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
        >
          {continueLoading ? t("loading.creating") : (continueLabel ?? t("actions.continue"))}
        </button>
      ) : null}
      {!hideBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="w-full min-h-11 py-2.5 rounded-xl border border-[var(--booking-border)] text-[var(--booking-text-secondary)] font-medium text-sm flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
        >
          <BackIcon className="w-4 h-4" />
          {backLabel ?? t("actions.back")}
        </button>
      ) : null}
    </div>
  );
}
