"use client";

import { useEffect, useRef } from "react";
import {
  enqueueBarberProfilePrefetch,
  prioritizeBarberProfilePrefetch,
} from "@/lib/booking-api/barber-profile-prefetch";
import type { BarberProfileSeed } from "@/lib/booking-api/barber-profile-cache";

type UseBarberProfilePrefetchOptions = {
  empId?: number | null;
  seed?: BarberProfileSeed | null;
  /** When true, observe element for viewport approach. */
  observeViewport?: boolean;
};

/**
 * Prefetch hooks for discovery cards: pointer enter, focus, touch, viewport.
 */
export function useBarberCardPrefetch({
  empId,
  seed,
  observeViewport = true,
}: UseBarberProfilePrefetchOptions) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!observeViewport || empId == null || empId <= 0) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          enqueueBarberProfilePrefetch(empId, seed ?? undefined);
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [empId, seed, observeViewport]);

  const prefetchNow = () => {
    if (empId == null || empId <= 0) return;
    prioritizeBarberProfilePrefetch(empId, seed ?? undefined);
  };

  return {
    rootRef,
    prefetchHandlers: {
      onPointerEnter: prefetchNow,
      onFocus: prefetchNow,
      onTouchStart: prefetchNow,
    },
    prefetchNow,
  };
}
