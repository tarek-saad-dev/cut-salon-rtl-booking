"use client";

import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import { BookingNavFooter } from "./BookingNavFooter";

interface BookingAvailabilityScopeLoadingProps {
  barberName: string;
  slow?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  onBack?: () => void;
  onChooseAnotherBarber?: () => void;
  error?: boolean;
}

function ScopeSkeletonCard() {
  return (
    <div
      className="w-full rounded-2xl border border-[var(--booking-border)] bg-white p-5 animate-pulse"
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-cut-black/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-4/5 rounded bg-cut-black/10" />
          <div className="h-3 w-full rounded bg-cut-black/5" />
          <div className="h-3 w-3/4 rounded bg-cut-black/5" />
        </div>
      </div>
    </div>
  );
}

export default function BookingAvailabilityScopeLoading({
  barberName,
  slow = false,
  showRetry = false,
  onRetry,
  onBack,
  onChooseAnotherBarber,
  error = false,
}: BookingAvailabilityScopeLoadingProps) {
  const { t, dir } = useBookingTranslations();

  if (error) {
    return (
      <div className="flex flex-col min-h-0 flex-1" dir={dir}>
        <div className="p-5 md:p-6 flex-1 space-y-4">
          <h3 className="text-lg font-heading font-bold text-cut-black">
            {t("branch.loadFailedTitle", { name: barberName })}
          </h3>
          <p className="text-sm text-cut-black/60">{t("branch.loadFailedBody")}</p>
          <div className="flex flex-col gap-2">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 rounded-xl bg-[var(--booking-accent)] text-cut-black font-bold text-sm"
              >
                {t("actions.retry")}
              </button>
            ) : null}
            {onChooseAnotherBarber ? (
              <button
                type="button"
                onClick={onChooseAnotherBarber}
                className="w-full py-3 rounded-xl border border-[var(--booking-border)] text-sm font-bold"
              >
                {t("branch.chooseAnotherBarber")}
              </button>
            ) : null}
          </div>
        </div>
        <BookingNavFooter onBack={onBack} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-0 flex-1"
      dir={dir}
      aria-busy="true"
    >
      <div className="p-5 md:p-6 flex-1 overflow-y-auto">
        <div className="mb-5">
          <h3 className="text-lg font-heading font-bold text-cut-black mb-1">
            {t("scope.title")}
          </h3>
          <p className="text-cut-black/50 text-xs" aria-live="polite">
            {slow
              ? t("branch.loadingSlow", { name: barberName })
              : t("branch.loadingShort")}
          </p>
          <span className="sr-only" role="status" aria-live="polite">
            {t("branch.scopeLoadingAria")}
          </span>
        </div>
        <div className="space-y-3">
          <ScopeSkeletonCard />
          <ScopeSkeletonCard />
        </div>
        {showRetry && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 w-full py-3 rounded-xl border border-[var(--booking-border)] text-sm font-bold text-cut-black hover:bg-cut-black/[0.03]"
          >
            {t("actions.retry")}
          </button>
        ) : null}
      </div>
      <BookingNavFooter onBack={onBack} continueDisabled />
    </div>
  );
}
