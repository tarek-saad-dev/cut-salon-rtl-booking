"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAvailabilityMatrix,
  getCachedAvailability,
} from "@/lib/bookingV2/api";
import { scopeCacheKey, toAvailabilityRequest } from "@/lib/bookingV2/scope";
import type {
  AvailabilityMatrix,
  AvailabilityScope,
  LoadState,
} from "@/lib/bookingV2/types";
import { todayBusinessDate } from "@/lib/bookingV2/businessDate";

/**
 * Loads a single 14-day matrix per scope.
 * SWR updates must NOT reset caller booking step state — we only replace matrix data.
 */
export function useBookingAvailabilityMatrix(options: {
  enabled: boolean;
  scope: AvailabilityScope | null;
  days?: number;
}) {
  const days = options.days ?? 14;
  const fromBusinessDate = useMemo(() => todayBusinessDate(), []);
  const scopeKey = options.scope
    ? scopeCacheKey(options.scope, fromBusinessDate, days)
    : null;

  const request = useMemo(() => {
    if (!options.scope) return null;
    return toAvailabilityRequest(options.scope, fromBusinessDate, days);
  }, [options.scope, fromBusinessDate, days]);

  const cached = request ? getCachedAvailability(request) : null;
  const [matrix, setMatrix] = useState<AvailabilityMatrix | null>(cached);
  const [status, setStatus] = useState<LoadState>(
    cached ? (cached.matrix.length ? "ready" : "empty") : options.enabled ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(Boolean(cached?.stale));
  const lastScopeKeyRef = useRef<string | null>(null);

  const applyMatrix = useCallback((next: AvailabilityMatrix, meta: { stale: boolean }) => {
    // Preserve flow: never clear selection here — only swap availability payload.
    setMatrix(next);
    setStale(meta.stale);
    if (!next.matrix.length) setStatus(meta.stale ? "stale" : "empty");
    else setStatus(meta.stale ? "stale" : "ready");
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!request || !options.enabled) return;
      const existing = getCachedAvailability(request);
      if (!existing) setStatus("loading");
      setError(null);
      try {
        const data = await getAvailabilityMatrix(request, {
          force,
          onUpdate: (next, meta) => applyMatrix(next, { stale: meta.stale }),
        });
        applyMatrix(data, { stale: Boolean(data.stale) });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "تعذر تحميل المواعيد";
        setError(message);
        if (!getCachedAvailability(request)) {
          setStatus("error");
          // Do not wipe matrix if we already showed one for a previous scope
          // and scope just changed — clear only when this scope has nothing.
          if (lastScopeKeyRef.current !== scopeKey) setMatrix(null);
        } else {
          setStatus("stale");
          setStale(true);
        }
      } finally {
        lastScopeKeyRef.current = scopeKey;
      }
    },
    [request, options.enabled, applyMatrix, scopeKey],
  );

  useEffect(() => {
    if (!options.enabled || !request) return;
    void load(false);
  }, [options.enabled, scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    matrix,
    status,
    error,
    stale,
    isLoading: status === "loading",
    fromBusinessDate,
    reload: () => load(true),
  };
}
