"use client";

import { useEffect, useRef } from "react";
import {
  enqueueBarberProfilePrefetch,
  prioritizeBarberProfilePrefetch,
} from "@/lib/booking-api/barber-profile-prefetch";
import type { BarberProfileSeed } from "@/lib/booking-api/barber-profile-cache";
import {
  ensureBookingV2Bootstrap,
  loadV2Matrix,
  resolveV2Scope,
} from "@/hooks/bookingFlowV2Support";
import { findBootstrapBarber } from "@/lib/bookingV2/catalogMap";
import { isBookingV2ClientEnabled } from "@/lib/bookingV2/feature";

type UseBarberProfilePrefetchOptions = {
  empId?: number | null;
  seed?: BarberProfileSeed | null;
  /** When true, observe element for viewport approach. */
  observeViewport?: boolean;
};

function warmMatrixForEmp(empId: number) {
  if (!isBookingV2ClientEnabled()) return;
  void (async () => {
    try {
      const boot = await ensureBookingV2Bootstrap();
      const barber = findBootstrapBarber(boot, empId);
      const scope = resolveV2Scope({
        mode: "specific",
        empId,
        barber,
        selectedBranchCode: null,
        allBranchCodes: boot.branches.map((b) => b.branchCode),
        availabilityScope: "all_branches",
        specificBranchCode: null,
      });
      await loadV2Matrix(scope, 14);
    } catch {
      /* best-effort */
    }
  })();
}

/**
 * Prefetch hooks for discovery cards: pointer enter, focus, touch, viewport.
 * Also warms V2 availability matrix for that employee (intent only — not every card on load).
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
    warmMatrixForEmp(empId);
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
