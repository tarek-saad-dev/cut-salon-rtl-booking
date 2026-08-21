"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BarberBookingInfo, BookingMode } from "@/components/BookingModal";
import type { BarberAvailabilityScope, BookingEntryMode } from "@/lib/booking-api";
import type { BarberProfileSeed } from "@/lib/booking-api/barber-profile-cache";

export type OpenBookingIntent = {
  barber: BarberBookingInfo;
  entryMode?: BookingEntryMode;
  initialMode?: BookingMode;
  initialServiceMatches?: string[];
  initialServiceIds?: number[];
  bookingNote?: string;
  explicitEntryBranchCode?: string | null;
  initialAvailabilityScope?: BarberAvailabilityScope | null;
  profileSeed?: BarberProfileSeed | null;
  initialCustomerPhone?: string;
  initialCustomerName?: string;
  initialAppointment?: {
    date: string;
    time: string;
    empId?: number | null;
    dayOffset?: number | null;
    branchCode?: string | null;
    branchName?: string | null;
    barberName?: string | null;
  };
  fromBookFlow?: boolean;
};

type BookingControllerValue = {
  open: boolean;
  openBooking: (intent: OpenBookingIntent) => void;
  closeBooking: () => void;
};

const BookingControllerContext = createContext<BookingControllerValue | null>(null);

/**
 * Live CTAs must use /book (O2). openBooking redirects to /book for accidental callers.
 * BookingModal is not mounted.
 */
export function BookingControllerProvider({ children }: { children: ReactNode }) {
  const [open] = useState(false);

  const closeBooking = useCallback(() => {}, []);

  const openBooking = useCallback((intent: OpenBookingIntent) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (intent.entryMode === "barber_first" && intent.barber.id) {
      params.set("mode", "barber");
      params.set("empId", String(intent.barber.id));
    } else if (intent.initialMode === "nearest") {
      params.set("mode", "nearest");
    }
    if (intent.explicitEntryBranchCode) {
      params.set("branch", intent.explicitEntryBranchCode);
    }
    const q = params.toString();
    window.location.assign(q ? `/book?${q}` : "/book");
  }, []);

  const value = useMemo(
    () => ({ open, openBooking, closeBooking }),
    [open, openBooking, closeBooking],
  );

  return (
    <BookingControllerContext.Provider value={value}>
      {children}
    </BookingControllerContext.Provider>
  );
}

export function useBookingController(): BookingControllerValue {
  const ctx = useContext(BookingControllerContext);
  if (!ctx) {
    throw new Error("useBookingController must be used within BookingControllerProvider");
  }
  return ctx;
}
