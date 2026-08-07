"use client";

import { Check } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import type { ServicePresentation } from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingServiceImage from "./BookingServiceImage";

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
        flex w-full min-h-[5.25rem] overflow-hidden rounded-2xl border bg-[var(--booking-bg)] text-start transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2
        ${
          selected
            ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-accent-soft)] ring-2 ring-[var(--booking-slot-selected-outline)]"
            : "border-[var(--booking-border)] hover:bg-[var(--booking-surface-hover)]"
        }
      `}
      dir={dir}
      data-service-card="compact"
      data-selected={selected ? "true" : "false"}
    >
      <div className="relative w-[5.75rem] shrink-0 self-stretch sm:w-[6.5rem]">
        <BookingServiceImage
          visual={visual}
          alt={presentation.displayName || ""}
          fillContainer
          sizes="104px"
          className="rounded-none"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5 sm:px-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {badgeLabel ? (
              <span className="mb-0.5 inline-flex text-[10px] font-bold text-[var(--booking-text-secondary)]">
                {badgeLabel}
              </span>
            ) : null}
            <h4 className="font-heading text-[14px] font-bold leading-snug text-[var(--booking-text)] sm:text-[15px]">
              {presentation.displayName}
            </h4>
          </div>
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected
                ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-bg)]"
                : "border-[var(--booking-border)]"
            }`}
            aria-hidden
          >
            {selected ? (
              <Check className="h-3 w-3 text-[var(--booking-text)]" strokeWidth={3} />
            ) : null}
          </span>
        </div>

        <p className="line-clamp-1 text-[12px] leading-snug text-[var(--booking-text-secondary)]">
          {presentation.description}
        </p>

        <div className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px]">
          <span className="text-[var(--booking-text-muted)]">
            {format.duration(service.durationMinutes)}
          </span>
          <span className="font-bold tabular-nums text-[var(--booking-text)]">
            {format.price(service.price)}
          </span>
        </div>

        {selected ? (
          <p className="text-[11px] font-bold text-[var(--booking-text)]">
            {t("service.selectedLabel")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
