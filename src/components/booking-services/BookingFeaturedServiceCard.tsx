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
  const imageAlt = presentation.displayName
    ? presentation.displayName
    : "";

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
        group w-full text-start rounded-2xl border bg-[var(--booking-bg)] overflow-hidden transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2
        min-h-[44px]
        ${
          selected
            ? "border-[var(--booking-slot-selected-outline)] ring-2 ring-[var(--booking-slot-selected-outline)] bg-[var(--booking-accent-soft)] shadow-sm"
            : "border-[var(--booking-border)] hover:border-[var(--booking-text-muted)] hover:shadow-sm hover:bg-[var(--booking-surface-hover)]"
        }
      `}
      dir={dir}
      data-service-card="featured"
      data-selected={selected ? "true" : "false"}
    >
      <BookingServiceImage
        visual={visual}
        alt={imageAlt}
        priority={priorityImage}
        aspectClassName="aspect-[16/10] md:aspect-[5/3]"
        className="rounded-none rounded-t-2xl"
      />
      <div className="p-3.5 md:p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            {badgeLabel ? (
              <span className="inline-flex mb-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border border-[var(--booking-border)] bg-[var(--booking-bg)] text-[var(--booking-text)]">
                {badgeLabel}
              </span>
            ) : null}
            <h4 className="font-heading font-bold text-base md:text-[17px] text-[var(--booking-text)] leading-snug">
              {presentation.displayName}
            </h4>
          </div>
          <span
            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
              selected
                ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-bg)] text-[var(--booking-text)]"
                : "border-[var(--booking-border)] bg-[var(--booking-bg)]"
            }`}
            aria-hidden
          >
            {selected ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : null}
          </span>
        </div>
        <p className="text-[13px] md:text-sm text-[var(--booking-text-secondary)] leading-snug line-clamp-2 md:line-clamp-1">
          {presentation.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="text-[var(--booking-text-secondary)]">
            {format.duration(service.durationMinutes)}
          </span>
          <span className="font-bold text-[var(--booking-text)] tabular-nums">
            {format.price(service.price)}
          </span>
        </div>
        {selected ? (
          <p className="mt-2 text-[12px] font-bold text-[var(--booking-text)]">
            {t("service.selectedLabel")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
