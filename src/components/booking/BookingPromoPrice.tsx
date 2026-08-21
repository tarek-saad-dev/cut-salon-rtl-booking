"use client";

/**
 * TEMPORARY display helper for Camp Caesar (and future) booking price promos.
 * Usage: <BookingPromoPrice amount={service.price} formatPrice={format.price} />
 * Delete with bookingPricePromos config when the offer ends.
 */
import { applyBookingPricePromo } from "@/lib/booking/bookingPricePromo";
import { useBookingPricePromo } from "@/context/BookingPricePromoContext";

type BookingPromoPriceProps = {
  amount: number;
  formatPrice: (n: number) => string;
  className?: string;
  strikeClassName?: string;
  payClassName?: string;
};

export default function BookingPromoPrice({
  amount,
  formatPrice,
  className = "inline-flex items-baseline gap-1.5 tabular-nums",
  strikeClassName = "text-[var(--booking-text-muted)] line-through font-medium",
  payClassName = "font-bold text-[var(--booking-text)]",
}: BookingPromoPriceProps) {
  const promo = useBookingPricePromo();
  const { list, pay, showStrike } = applyBookingPricePromo(amount, promo);

  if (!showStrike) {
    return <span className={payClassName}>{formatPrice(list)}</span>;
  }

  return (
    <span className={className} data-booking-price-promo={promo?.id ?? "active"}>
      <span className={strikeClassName}>{formatPrice(list)}</span>
      <span className={payClassName}>{formatPrice(pay)}</span>
    </span>
  );
}
