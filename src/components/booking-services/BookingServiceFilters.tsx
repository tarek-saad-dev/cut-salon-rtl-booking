"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const { t, dir, lang } = useBookingTranslations();
  const ar = lang === "ar";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nudgedRef = useRef(false);
  const [canScroll, setCanScroll] = useState(false);
  const [showMoreFade, setShowMoreFade] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScroll(max > 4);

    if (max <= 4) {
      setShowMoreFade(false);
      return;
    }

    // Fade on the "more content" edge (end of list)
    if (dir === "rtl") {
      setShowMoreFade(el.scrollLeft > -max + 8);
    } else {
      setShowMoreFade(el.scrollLeft < max - 8);
    }
  }, [dir]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      ro?.disconnect();
    };
  }, [updateScrollState, filters.length]);

  // Soft one-time nudge so the row feels scrollable
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || nudgedRef.current || filters.length <= 1) return;

    const timer = window.setTimeout(() => {
      if (el.scrollWidth - el.clientWidth <= 4) return;
      nudgedRef.current = true;
      const nudge = dir === "rtl" ? -36 : 36;
      el.scrollBy({ left: nudge, behavior: "smooth" });
      window.setTimeout(() => {
        el.scrollBy({ left: -nudge, behavior: "smooth" });
      }, 420);
    }, 480);

    return () => window.clearTimeout(timer);
  }, [dir, filters.length]);

  if (filters.length <= 1) return null;

  return (
    <div className="space-y-2" data-service-filters>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--booking-text-muted)]">
          {ar ? "التصنيفات" : "Categories"}
        </p>
        {canScroll ? (
          <p className="animate-pulse text-[11px] text-[var(--booking-text-secondary)]">
            {ar ? "مرّر للجنب ←" : "Swipe sideways →"}
          </p>
        ) : null}
      </div>

      <div className="relative">
        {showMoreFade ? (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 z-[1] w-12 ${
              dir === "rtl" ? "left-0" : "right-0"
            }`}
            style={{
              backgroundImage:
                dir === "rtl"
                  ? "linear-gradient(to right, var(--booking-bg), transparent)"
                  : "linear-gradient(to left, var(--booking-bg), transparent)",
            }}
          />
        ) : null}

        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="toolbar"
          aria-label={t("service.filtersAria")}
          dir={dir}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {filters.map((filter, index) => {
            const selected = filter.id === active;
            const isLast = index === filters.length - 1;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(filter.id)}
                className={`
                  flex-shrink-0 min-h-10 snap-start rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
                  ${isLast ? "me-1" : ""}
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
      </div>
    </div>
  );
}
