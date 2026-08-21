"use client";

import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingPromoPrice from "@/components/booking/BookingPromoPrice";

interface BookingSelectedServicesSummaryProps {
  selectedCount: number;
  totalDuration: number;
  totalPrice: number;
}

export default function BookingSelectedServicesSummary({
  selectedCount,
  totalDuration,
  totalPrice,
}: BookingSelectedServicesSummaryProps) {
  const { t, format, dir } = useBookingTranslations();
  if (selectedCount <= 0) return null;

  const countLabel =
    selectedCount === 1
      ? `1 ${t("service.countOne")}`
      : selectedCount === 2 && dir === "rtl"
        ? t("service.countTwo")
        : `${format.number(selectedCount)} ${t("service.countMany")}`;

  return (
    <div
      className="flex-shrink-0 border-t border-[var(--booking-border-subtle)] bg-[var(--booking-surface)] px-5 md:px-6 py-3"
      data-service-summary
      dir={dir}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-[var(--booking-text)] font-medium">
          {countLabel}
          <span className="text-[var(--booking-text-muted)]"> · </span>
          <span className="text-[var(--booking-text-secondary)]">
            {format.duration(totalDuration)}
          </span>
        </p>
        <p className="font-bold text-[var(--booking-text)] tabular-nums">
          <BookingPromoPrice amount={totalPrice} formatPrice={format.price} />
        </p>
      </div>
    </div>
  );
}
