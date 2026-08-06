"use client";

import { Check, X } from "lucide-react";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

interface Step {
  id: string;
  label: string;
  number: number;
}

interface BookingStepHeaderProps {
  steps: Step[];
  currentStep: string;
  barberName: string;
  onClose: () => void;
  /** When nearest mode, header uses nearest title. */
  nearest?: boolean;
  /** Success: mark every step completed (do not leave Review active). */
  allCompleted?: boolean;
}

const BookingStepHeader = ({
  steps,
  currentStep,
  barberName,
  onClose,
  nearest = false,
  allCompleted = false,
}: BookingStepHeaderProps) => {
  const { t, dir } = useBookingTranslations();
  const ordered = steps.map((step, index) => ({
    ...step,
    displayNumber: index + 1,
  }));
  const currentIndex = Math.max(
    0,
    ordered.findIndex((s) => s.id === currentStep),
  );
  const currentStepNumber = ordered[currentIndex]?.displayNumber || 1;
  const currentLabel = ordered[currentIndex]?.label;
  const title = nearest
    ? t("header.bookNearest")
    : t("header.bookWith", { name: barberName });

  return (
    <div
      className="bg-[var(--booking-bg)] border-b border-[var(--booking-border-subtle)] flex-shrink-0"
      dir={dir}
      data-booking-surface="header"
    >
      <div className="flex items-center justify-between px-5 md:px-6 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[var(--booking-text)] font-heading font-bold text-lg truncate">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ms-3 min-h-11 min-w-11 rounded-full bg-[var(--booking-surface)] hover:bg-[var(--booking-surface-hover)] border border-[var(--booking-border-subtle)] flex items-center justify-center transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--booking-bg)]"
          aria-label={t("header.closeAria")}
        >
          <X className="w-4 h-4 text-[var(--booking-text-secondary)] group-hover:text-[var(--booking-text)] transition-colors" />
        </button>
      </div>

      <div
        className="hidden md:flex items-center gap-1 px-5 md:px-6 pb-3.5 overflow-x-auto"
        data-booking-surface="stepper"
      >
        {ordered.map((step, index) => {
          const isActive = !allCompleted && step.id === currentStep;
          const isCompleted =
            allCompleted || step.displayNumber < currentStepNumber;
          const isLast = index === ordered.length - 1;
          const stateLabel = isCompleted
            ? t("a11y.stepCompleted")
            : isActive
              ? t("a11y.stepCurrent")
              : undefined;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className="flex items-center gap-2"
                aria-current={isActive ? "step" : undefined}
                aria-label={stateLabel ? `${step.label}, ${stateLabel}` : step.label}
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2
                    ${isActive ? "border-[var(--booking-accent)] bg-[var(--booking-accent-soft)] text-[var(--booking-text)]" : ""}
                    ${isCompleted && !isActive ? "border-[var(--booking-accent)] bg-[var(--booking-accent)] text-white" : ""}
                    ${!isActive && !isCompleted ? "border-[var(--booking-border)] bg-[var(--booking-bg)] text-[var(--booking-text-secondary)]" : ""}
                  `}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                  ) : (
                    step.displayNumber
                  )}
                </div>
                <span
                  className={`
                    text-[13px] font-medium whitespace-nowrap transition-colors
                    ${isActive ? "text-[var(--booking-text)]" : ""}
                    ${isCompleted && !isActive ? "text-[var(--booking-text-secondary)]" : ""}
                    ${!isActive && !isCompleted ? "text-[var(--booking-text-muted)]" : ""}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className="mx-3 h-px w-8 bg-[var(--booking-border)]"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden px-5 pb-3.5">
        {allCompleted ? (
          <p className="text-[var(--booking-success)] text-sm font-bold" role="status">
            {t("success.title")}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--booking-text-muted)] text-[13px]">
                {t("a11y.stepProgress", {
                  current: currentStepNumber,
                  total: ordered.length,
                })}
              </span>
              <span className="text-[var(--booking-text)] font-medium text-sm">
                {currentLabel}
              </span>
            </div>
            <div className="h-0.5 bg-[var(--booking-border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--booking-accent)] transition-all duration-500 ease-out"
                style={{
                  width: `${(currentStepNumber / ordered.length) * 100}%`,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingStepHeader;
