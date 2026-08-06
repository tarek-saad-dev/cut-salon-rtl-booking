/**
 * Bounded, idle-friendly prefetch for barber profiles from discovery cards.
 */

import { prefetchBarberProfile, seedBarberProfileCache, type BarberProfileSeed } from "./barber-profile-cache";

const MAX_CONCURRENT = 2;
const MAX_QUEUE = 8;

let active = 0;
const queue: number[] = [];
const queued = new Set<number>();
const prefetched = new Set<number>();

function pump(): void {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const empId = queue.shift()!;
    queued.delete(empId);
    active += 1;
    prefetchBarberProfile(empId)
      .catch(() => undefined)
      .finally(() => {
        active -= 1;
        prefetched.add(empId);
        pump();
      });
  }
}

function scheduleIdle(fn: () => void): void {
  if (typeof window === "undefined") {
    fn();
    return;
  }
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") {
    ric(() => fn(), { timeout: 1200 });
    return;
  }
  window.setTimeout(fn, 0);
}

export function enqueueBarberProfilePrefetch(
  empId: number,
  seed?: BarberProfileSeed,
): void {
  if (!Number.isFinite(empId) || empId <= 0) return;
  if (seed) seedBarberProfileCache(seed);
  if (prefetched.has(empId) || queued.has(empId)) return;
  if (queue.length >= MAX_QUEUE) {
    const dropped = queue.shift();
    if (dropped != null) queued.delete(dropped);
  }
  queue.push(empId);
  queued.add(empId);
  scheduleIdle(pump);
}

export function prioritizeBarberProfilePrefetch(
  empId: number,
  seed?: BarberProfileSeed,
): void {
  if (!Number.isFinite(empId) || empId <= 0) return;
  if (seed) seedBarberProfileCache(seed);
  if (prefetched.has(empId)) {
    // Still warm via SWR
    scheduleIdle(() => {
      void prefetchBarberProfile(empId).catch(() => undefined);
    });
    return;
  }
  if (queued.has(empId)) {
    const idx = queue.indexOf(empId);
    if (idx > 0) {
      queue.splice(idx, 1);
      queue.unshift(empId);
    }
  } else {
    queue.unshift(empId);
    queued.add(empId);
    if (queue.length > MAX_QUEUE) {
      const dropped = queue.pop();
      if (dropped != null) queued.delete(dropped);
    }
  }
  scheduleIdle(pump);
}

export function __resetBarberPrefetchForTests(): void {
  active = 0;
  queue.length = 0;
  queued.clear();
  prefetched.clear();
}
