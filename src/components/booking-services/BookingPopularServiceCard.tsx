"use client";

import { Check } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import type { ServicePresentation } from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingServiceImage from "./BookingServiceImage";
import BookingPromoPrice from "@/components/booking/BookingPromoPrice";

interface BookingPopularServiceCardProps {
  service: BookingService;
  presentation: ServicePresentation;
  selected: boolean;
  selectionType: "radio" | "checkbox";
  onSelect: () => void;
  priorityImage?: boolean;
}

export default function BookingPopularServiceCard({
  service,
  presentation,
  selected,
  selectionType,
  onSelect,
  priorityImage = false,
}: BookingPopularServiceCardProps) {
  const { format, dir } = useBookingTranslations();
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
        group flex h-full w-full flex-col rounded-2xl border p-3 text-start
        backdrop-blur-xl transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2
        ${
          selected
            ? "border-[var(--booking-slot-selected-outline)]/55 bg-white/78 shadow-[0_6px_22px_rgba(74,0,15,0.1)] ring-2 ring-[var(--booking-slot-selected-outline)]/40"
            : "border-white/55 bg-white/42 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:border-white/75 hover:bg-white/58 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.985]"
        }
      `}
      dir={dir}
      data-service-card="popular"
      data-selected={selected ? "true" : "false"}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/50 shadow-sm">
          <BookingServiceImage
            visual={visual}
            alt={presentation.displayName || ""}
            priority={priorityImage}
            fillContainer
            sizes="40px"
            className="rounded-xl"
          />
        </div>
        <span
          className={`flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected
              ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-slot-selected-outline)] text-white"
              : "border-[var(--booking-border)] bg-white/60 group-hover:border-[var(--booking-text-muted)]/40"
          }`}
          aria-hidden
        >
          {selected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
        </span>
      </div>

      <h4 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug text-[var(--booking-text)]">
        {presentation.displayName}
      </h4>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-none">
        <span className="text-[var(--booking-text-muted)]">
          {format.duration(service.durationMinutes)}
        </span>
        <span aria-hidden className="text-[var(--booking-text-muted)]/45">
          ·
        </span>
        <span className="font-semibold tabular-nums text-[var(--booking-text)]">
          <BookingPromoPrice amount={service.price} formatPrice={format.price} />
        </span>
      </div>
    </button>
  );
}
