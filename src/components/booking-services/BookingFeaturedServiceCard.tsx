"use client";

import { Check } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import type { ServicePresentation } from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingServiceImage from "./BookingServiceImage";

interface BookingFeaturedServiceCardProps {
  service: BookingService;
  presentation: ServicePresentation;
  selected: boolean;
  selectionType: "radio" | "checkbox";
  onSelect: () => void;
  priorityImage?: boolean;
  badgeLabel?: string | null;
}

export default function BookingFeaturedServiceCard({
  service,
  presentation,
  selected,
  selectionType,
  onSelect,
  priorityImage = false,
  badgeLabel,
}: BookingFeaturedServiceCardProps) {
  const { t, format, dir } = useBookingTranslations();
  const visual = getServiceVisual({ service });
  const imageAlt = presentation.displayName || "";

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
        group flex w-full min-h-[5.75rem] overflow-hidden rounded-2xl border bg-[var(--booking-bg)] text-start transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2
        ${
          selected
            ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-accent-soft)] shadow-sm ring-2 ring-[var(--booking-slot-selected-outline)]"
            : "border-[var(--booking-border)] hover:border-[var(--booking-text-muted)] hover:bg-[var(--booking-surface-hover)] hover:shadow-sm"
        }
      `}
      dir={dir}
      data-service-card="featured"
      data-selected={selected ? "true" : "false"}
    >
      <div className="relative w-[6.75rem] shrink-0 self-stretch sm:w-[7.75rem]">
        <BookingServiceImage
          visual={visual}
          alt={imageAlt}
          priority={priorityImage}
          fillContainer
          sizes="124px"
          className="rounded-none"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {badgeLabel ? (
              <span className="mb-1 inline-flex rounded-md border border-[var(--booking-border)] bg-[var(--booking-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--booking-text-secondary)]">
                {badgeLabel}
              </span>
            ) : null}
            <h4 className="font-heading text-[15px] font-bold leading-snug text-[var(--booking-text)] sm:text-base">
              {presentation.displayName}
            </h4>
          </div>
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected
                ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-bg)] text-[var(--booking-text)]"
                : "border-[var(--booking-border)] bg-[var(--booking-bg)]"
            }`}
            aria-hidden
          >
            {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
          </span>
        </div>

        <p className="line-clamp-1 text-[12px] leading-snug text-[var(--booking-text-secondary)] sm:text-[13px]">
          {presentation.description}
        </p>

        <div className="mt-0.5 flex items-center justify-between gap-2 text-[13px]">
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
