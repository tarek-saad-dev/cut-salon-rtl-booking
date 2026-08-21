"use client";

import { useEffect } from "react";
import { installGlobalBookingPrefetch } from "@/lib/bookingV2/prefetch";

/** Installs idle / viewport / hover bootstrap prefetch for Book Now controls. */
export default function BookingPrefetchBoot() {
  useEffect(() => installGlobalBookingPrefetch(), []);
  return null;
}
