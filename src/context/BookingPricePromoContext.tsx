"use client";

/**
 * TEMPORARY — delete with booking price promo config when campaign ends.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  resolveBookingPricePromo,
  type ActiveBookingPricePromo,
} from "@/lib/booking/bookingPricePromo";

const BookingPricePromoContext = createContext<ActiveBookingPricePromo | null>(null);

export function BookingPricePromoProvider({
  branchCode,
  children,
}: {
  branchCode: string | null | undefined;
  children: ReactNode;
}) {
  const promo = useMemo(
    () => resolveBookingPricePromo(branchCode),
    [branchCode],
  );
  return (
    <BookingPricePromoContext.Provider value={promo}>
      {children}
    </BookingPricePromoContext.Provider>
  );
}

export function useBookingPricePromo(): ActiveBookingPricePromo | null {
  return useContext(BookingPricePromoContext);
}
