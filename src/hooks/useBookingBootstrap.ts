"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBookingBootstrap,
  getCachedBootstrap,
} from "@/lib/bookingV2/api";
import { markJourney } from "@/lib/bookingV2/metrics";
import type { BookingV2Bootstrap, LoadState } from "@/lib/bookingV2/types";

export function useBookingBootstrap(enabled: boolean) {
  const cached = typeof window !== "undefined" ? getCachedBootstrap() : null;
  const [bootstrap, setBootstrap] = useState<BookingV2Bootstrap | null>(cached);
  const [status, setStatus] = useState<LoadState>(
    cached ? "ready" : enabled ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const load = useCallback(async (force = false) => {
    if (!enabledRef.current && !force) return;
    const hasData = getCachedBootstrap() != null || bootstrap != null;
    if (!hasData) setStatus("loading");
    setError(null);
    try {
      const data = await getBookingBootstrap({
        force,
        onUpdate: (next, meta) => {
          setBootstrap(next);
          setStale(meta.stale);
          setStatus(next.services.length === 0 ? "empty" : "ready");
          if (!meta.stale) markJourney("bootstrap_ready");
        },
      });
      setBootstrap(data);
      setStale(false);
      setStatus(data.services.length === 0 ? "empty" : "ready");
      markJourney("bootstrap_ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذر تحميل بيانات الحجز";
      setError(message);
      if (!getCachedBootstrap()) setStatus("error");
      else {
        setStatus("stale");
        setStale(true);
      }
    }
  }, [bootstrap]);

  useEffect(() => {
    if (!enabled) return;
    void load(false);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    bootstrap,
    status,
    error,
    stale,
    isLoading: status === "loading",
    reload: () => load(true),
  };
}
