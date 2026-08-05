"use client";

import { X } from "lucide-react";
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
}

const BookingStepHeader = ({
  steps,
  currentStep,
  barberName,
  onClose,
  nearest = false,
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
      className="bg-[#0a0a0a] border-b border-[var(--booking-border)] flex-shrink-0"
      dir={dir}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--booking-accent)]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[var(--booking-accent)] font-bold text-sm" aria-hidden>
              ✂
            </span>
          </div>
          <span className="text-[var(--booking-accent)] font-heading font-bold text-lg truncate">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ms-3 min-h-11 min-w-11 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          aria-label={t("header.closeAria")}
        >
          <X className="w-4 h-4 text-[var(--booking-sidebar-muted)] group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="hidden md:flex items-center gap-1 px-6 pb-4 overflow-x-auto">
        {ordered.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.displayNumber < currentStepNumber;
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
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isActive ? "bg-[var(--booking-accent)] text-white" : ""}
                    ${isCompleted ? "bg-[var(--booking-accent)] text-white" : ""}
                    ${!isActive && !isCompleted ? "bg-white/15 text-[var(--booking-sidebar-muted)]" : ""}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.displayNumber
                  )}
                </div>
                <span
                  className={`
                    text-[13px] font-medium whitespace-nowrap transition-colors
                    ${isActive ? "text-[var(--booking-accent)]" : ""}
                    ${isCompleted ? "text-[var(--booking-sidebar-muted)]" : ""}
                    ${!isActive && !isCompleted ? "text-[var(--booking-sidebar-muted)]" : ""}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && <div className="mx-3 h-px w-8 bg-white/20" aria-hidden />}
            </div>
          );
        })}
      </div>

      <div className="md:hidden px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--booking-sidebar-muted)] text-[13px]">
            {t("a11y.stepProgress", { current: currentStepNumber, total: ordered.length })}
          </span>
          <span className="text-[var(--booking-accent)] font-medium text-sm">{currentLabel}</span>
        </div>
        <div className="h-0.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--booking-accent)] transition-all duration-500 ease-out"
            style={{ width: `${(currentStepNumber / ordered.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingStepHeader;
