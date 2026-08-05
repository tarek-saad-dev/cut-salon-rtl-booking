"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import BookingModal, {
  type BarberBookingInfo,
  type BookingMode,
} from "@/components/BookingModal";
import type { BarberAvailabilityScope, BookingEntryMode } from "@/lib/booking-api";

export type OpenBookingIntent = {
  barber: BarberBookingInfo;
  entryMode?: BookingEntryMode;
  initialMode?: BookingMode;
  initialServiceMatches?: string[];
  initialServiceIds?: number[];
  bookingNote?: string;
  /** Explicit branch from a branch-specific CTA (not browsing persistence). */
  explicitEntryBranchCode?: string | null;
  /** Preselect scope when entry CTA is branch-specific. */
  initialAvailabilityScope?: BarberAvailabilityScope | null;
};

type BookingControllerValue = {
  open: boolean;
  openBooking: (intent: OpenBookingIntent) => void;
  closeBooking: () => void;
};

const BookingControllerContext = createContext<BookingControllerValue | null>(null);

const DEFAULT_BARBER: BarberBookingInfo = {
  name: "",
  image: null,
};

/**
 * Hosts a single BookingModal above language-specific homepage trees so
 * switching language does not unmount an in-progress booking.
 */
export function BookingControllerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  /** Bumped on each open so BookingModal remounts with a clean draft for the new intent. */
  const [sessionKey, setSessionKey] = useState(0);
  const [barber, setBarber] = useState<BarberBookingInfo>(DEFAULT_BARBER);
  const [entryMode, setEntryMode] = useState<BookingEntryMode>("branch_first");
  const [initialMode, setInitialMode] = useState<BookingMode | undefined>();
  const [initialServiceMatches, setInitialServiceMatches] = useState<string[] | undefined>();
  const [initialServiceIds, setInitialServiceIds] = useState<number[] | undefined>();
  const [bookingNote, setBookingNote] = useState<string | undefined>();
  const [explicitEntryBranchCode, setExplicitEntryBranchCode] = useState<string | null>(null);
  const [initialAvailabilityScope, setInitialAvailabilityScope] =
    useState<BarberAvailabilityScope | null>(null);

  const closeBooking = useCallback(() => {
    setOpen(false);
  }, []);

  const openBooking = useCallback((intent: OpenBookingIntent) => {
    const mode = intent.initialMode;
    const nextEntry =
      intent.entryMode ??
      (mode === "specific" && intent.barber.id != null ? "barber_first" : "branch_first");

    if (
      nextEntry === "barber_first" &&
      (intent.barber.id == null ||
        !Number.isFinite(intent.barber.id) ||
        intent.barber.id <= 0)
    ) {
      return;
    }

    setBarber(intent.barber);
    setEntryMode(nextEntry);
    setInitialMode(intent.initialMode);
    setInitialServiceMatches(intent.initialServiceMatches);
    setInitialServiceIds(intent.initialServiceIds);
    setBookingNote(intent.bookingNote);
    setExplicitEntryBranchCode(intent.explicitEntryBranchCode ?? null);
    setInitialAvailabilityScope(intent.initialAvailabilityScope ?? null);
    setSessionKey((k) => k + 1);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ open, openBooking, closeBooking }),
    [open, openBooking, closeBooking],
  );

  return (
    <BookingControllerContext.Provider value={value}>
      {children}
      <BookingModal
        key={sessionKey}
        open={open}
        onOpenChange={(next) => {
          if (!next) closeBooking();
        }}
        barber={barber}
        entryMode={entryMode}
        initialMode={initialMode}
        initialServiceMatches={initialServiceMatches}
        initialServiceIds={initialServiceIds}
        bookingNote={bookingNote}
        explicitEntryBranchCode={explicitEntryBranchCode}
        initialAvailabilityScope={initialAvailabilityScope}
      />
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
