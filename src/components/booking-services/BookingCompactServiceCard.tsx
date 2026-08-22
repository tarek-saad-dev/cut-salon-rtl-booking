"use client";

import { Check } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import type { ServicePresentation } from "@/lib/booking/service-presentation";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingServiceImage from "./BookingServiceImage";
import BookingPromoPrice from "@/components/booking/BookingPromoPrice";

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
}: BookingCompactServiceCardProps) {
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
        group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-start
        backdrop-blur-xl transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2
        ${
          selected
            ? "border-[var(--booking-slot-selected-outline)]/50 bg-white/75 shadow-[0_4px_20px_rgba(74,0,15,0.07)] ring-1 ring-[var(--booking-slot-selected-outline)]/35"
            : "border-white/55 bg-white/42 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:border-white/75 hover:bg-white/58 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.985]"
        }
      `}
      dir={dir}
      data-service-card="compact"
      data-selected={selected ? "true" : "false"}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/50 shadow-sm">
        <BookingServiceImage
          visual={visual}
          alt={presentation.displayName || ""}
          fillContainer
          sizes="44px"
          className="rounded-xl"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-[14px] font-semibold leading-tight text-[var(--booking-text)]">
          {presentation.displayName}
        </h4>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-none">
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
    </button>
  );
}
