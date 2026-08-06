"use client";

import { Check, Scissors, Droplets, Sparkles, Paintbrush, HandHelping } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import type { ServicePresentation } from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";

interface BookingCompactServiceCardProps {
  service: BookingService;
  presentation: ServicePresentation;
  selected: boolean;
  selectionType: "radio" | "checkbox";
  onSelect: () => void;
  badgeLabel?: string | null;
}

export default function BookingCompactServiceCard({
  service,
  presentation,
  selected,
  selectionType,
  onSelect,
  badgeLabel,
}: BookingCompactServiceCardProps) {
  const { t, format, dir } = useBookingTranslations();
  const visual = getServiceVisual({ service });
  const Icon =
    visual.iconHint === "skincare" || visual.iconHint === "masks"
      ? Droplets
      : visual.iconHint === "hairCare"
        ? Paintbrush
        : visual.iconHint === "comfort"
          ? HandHelping
          : visual.iconHint === "groom"
            ? Sparkles
            : Scissors;

  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      aria-checked={selected}
      role={selectionType === "radio" ? "radio" : "checkbox"}
      className={`
        w-full min-h-[44px] rounded-2xl border bg-[var(--booking-bg)] p-3.5 text-start transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2
        ${
          selected
            ? "border-[var(--booking-slot-selected-outline)] ring-2 ring-[var(--booking-slot-selected-outline)] bg-[var(--booking-accent-soft)]"
            : "border-[var(--booking-border)] hover:bg-[var(--booking-surface-hover)]"
        }
      `}
      dir={dir}
      data-service-card="compact"
      data-selected={selected ? "true" : "false"}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl border border-[var(--booking-border-subtle)] bg-[var(--booking-surface)] flex items-center justify-center flex-shrink-0"
          aria-hidden
        >
          <Icon className="w-4.5 h-4.5 text-[var(--booking-accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {badgeLabel ? (
                <span className="inline-flex mb-1 text-[11px] font-bold text-[var(--booking-text-secondary)]">
                  {badgeLabel}
                </span>
              ) : null}
              <h4 className="font-heading font-bold text-base text-[var(--booking-text)] leading-snug">
                {presentation.displayName}
              </h4>
            </div>
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                selected
                  ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-bg)]"
                  : "border-[var(--booking-border)]"
              }`}
              aria-hidden
            >
              {selected ? (
                <Check className="w-3 h-3 text-[var(--booking-text)]" strokeWidth={3} />
              ) : null}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[var(--booking-text-secondary)] leading-snug line-clamp-2">
            {presentation.description}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 text-[13px]">
            <span className="text-[var(--booking-text-muted)]">
              {format.duration(service.durationMinutes)}
            </span>
            <span className="font-bold text-[var(--booking-text)] tabular-nums">
              {format.price(service.price)}
            </span>
          </div>
          {selected ? (
            <p className="mt-1.5 text-[12px] font-bold text-[var(--booking-text)]">
              {t("service.selectedLabel")}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
