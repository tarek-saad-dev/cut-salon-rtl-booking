"use client";

import { useBookingTranslations } from "@/hooks/useBookingTranslations";

export type ServiceCategoryFilterId = "all" | (string & {});

export interface ServiceCategoryFilterOption {
  id: ServiceCategoryFilterId;
  label: string;
}

interface BookingServiceFiltersProps {
  filters: ServiceCategoryFilterOption[];
  active: ServiceCategoryFilterId;
  onChange: (id: ServiceCategoryFilterId) => void;
}

export default function BookingServiceFilters({
  filters,
  active,
  onChange,
}: BookingServiceFiltersProps) {
  const { t, dir } = useBookingTranslations();
  if (filters.length <= 1) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
      role="toolbar"
      aria-label={t("service.filtersAria")}
      dir={dir}
      data-service-filters
    >
      {filters.map((filter) => {
        const selected = filter.id === active;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(filter.id)}
            className={`
              flex-shrink-0 min-h-11 px-3.5 py-2 rounded-full text-[13px] font-bold border transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
              ${
                selected
                  ? "border-[var(--booking-slot-selected-outline)] bg-[var(--booking-accent-soft)] text-[var(--booking-text)] ring-1 ring-[var(--booking-slot-selected-outline)]"
                  : "border-[var(--booking-border)] bg-[var(--booking-bg)] text-[var(--booking-text-secondary)] hover:bg-[var(--booking-surface-hover)]"
              }
            `}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
