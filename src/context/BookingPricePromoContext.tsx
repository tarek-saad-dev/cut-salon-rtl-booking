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
  packageId,
  children,
}: {
  branchCode: string | null | undefined;
  /** When set to the November promo package, Camp Caesar % display is suppressed. */
  packageId?: number | null;
  children: ReactNode;
}) {
  const promo = useMemo(
    () => resolveBookingPricePromo(branchCode, Date.now(), packageId),
    [branchCode, packageId],
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
