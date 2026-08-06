/**
 * Shared barber-profile query/cache for barber-first booking.
 * - Cache by empId (language-neutral)
 * - Request deduplication with ref-counted abort
 * - Stale-while-revalidate (freshness window)
 * - Session lifetime for successful profiles
 */

import { bookingApiRequest } from "./client";
import { BookingApiError } from "./errors";
import { normalizeBranchCode } from "./branch-code";
import { resolveBarberPhotoUrl } from "./barber-photo";
import { bookingPerfMark } from "./booking-perf";
import type { BookingApiResponse, PublicBarber, PublicBarberBranch } from "./types";

/** Freshness window before background revalidation (ms). */
export const BARBER_PROFILE_FRESH_MS = 3 * 60_000;

export type BarberProfileSeed = {
  empId: number;
  displayName?: string;
  image?: string | null;
  publicBranches?: PublicBarberBranch[];
  serviceIds?: number[];
  profileVersion?: string | number | null;
};

export type BarberProfileFetchMeta = {
  cacheHit: boolean;
  stale: boolean;
  globalListFallback: boolean;
  durationMs: number;
};

export type BarberProfileLoadResult = {
  profile: PublicBarber | null;
  meta: BarberProfileFetchMeta;
  response: BookingApiResponse<PublicBarber | null>;
};

type CacheEntry = {
  profile: PublicBarber | null;
  at: number;
  response: BookingApiResponse<PublicBarber | null>;
  globalListFallback: boolean;
};

type InFlight = {
  promise: Promise<BarberProfileLoadResult>;
  controller: AbortController;
  consumers: number;
};

const cache = new Map<number, CacheEntry>();
const inFlight = new Map<number, InFlight>();

function cachingEnabled(): boolean {
  // Always keep an in-memory session cache. Tests call __resetBarberProfileCacheForTests.
  return true;
}

function normalizeBranches(
  branches: PublicBarberBranch[] | undefined | null,
): PublicBarberBranch[] {
  const out: PublicBarberBranch[] = [];
  const seen = new Set<string>();
  for (const b of branches ?? []) {
    const code = normalizeBranchCode(b?.branchCode);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push({
      branchCode: code,
      branchName: (b.branchName || code).trim() || code,
    });
  }
  return out;
}

function normalizeProfile(raw: Partial<PublicBarber> & { empId?: number; id?: number }): PublicBarber {
  const id = Number(raw.id ?? raw.empId);
  const photo = resolveBarberPhotoUrl(raw);
  const nameAr = (raw.nameAr ?? raw.name ?? "").trim() || null;
  const nameEn = (raw.nameEn ?? "").trim() || null;
  return {
    id,
    name: nameAr || nameEn || "",
    nameAr,
    nameEn,
    job: raw.job ?? null,
    imageUrl: photo,
    photoUrl: photo,
    bio: raw.bio ?? null,
    isBookableOnline: raw.isBookableOnline !== false,
    serviceIds: Array.isArray(raw.serviceIds)
      ? raw.serviceIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : undefined,
    branches: normalizeBranches(raw.branches),
  };
}

/** Seed → PublicBarber when branches are present (enough for multi vs single). */
export function profileFromSeed(seed: BarberProfileSeed): PublicBarber | null {
  if (!Number.isFinite(seed.empId) || seed.empId <= 0) return null;
  const branches = normalizeBranches(seed.publicBranches);
  return {
    id: seed.empId,
    name: (seed.displayName || "").trim(),
    nameAr: null,
    nameEn: null,
    job: null,
    imageUrl: seed.image ?? null,
    photoUrl: seed.image ?? null,
    bio: null,
    isBookableOnline: true,
    serviceIds: Array.isArray(seed.serviceIds)
      ? seed.serviceIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : undefined,
    branches: branches.length ? branches : undefined,
  };
}

export function seedIsCompleteForBranchDecision(seed: BarberProfileSeed | null | undefined): boolean {
  if (!seed || !Number.isFinite(seed.empId) || seed.empId <= 0) return false;
  return Array.isArray(seed.publicBranches);
}

export function peekBarberProfileCache(empId: number): PublicBarber | null {
  const entry = cache.get(empId);
  return entry?.profile ?? null;
}

export function getBarberProfileCacheAgeMs(empId: number): number | null {
  const entry = cache.get(empId);
  if (!entry) return null;
  return Date.now() - entry.at;
}

export function isBarberProfileFresh(empId: number): boolean {
  const age = getBarberProfileCacheAgeMs(empId);
  return age != null && age < BARBER_PROFILE_FRESH_MS;
}

/**
 * Seed the session cache from discovery roster without a network round-trip.
 * Seeds are provisional (stale) by default so SWR revalidates in the background
 * and plan/create never relies on roster-only metadata alone.
 */
export function seedBarberProfileCache(
  seed: BarberProfileSeed,
  options?: { provisional?: boolean },
): PublicBarber | null {
  const profile = profileFromSeed(seed);
  if (!profile) return null;
  if (!cachingEnabled()) return profile;
  const provisional = options?.provisional !== false;
  const existing = cache.get(seed.empId);
  // Do not overwrite a fresher confirmed network profile with a thinner seed.
  if (
    existing?.profile &&
    isBarberProfileFresh(seed.empId) &&
    !existing.globalListFallback
  ) {
    const existingBranches = existing.profile.branches?.length ?? 0;
    const seedBranches = profile.branches?.length ?? 0;
    if (existingBranches >= seedBranches && existing.profile.serviceIds != null) {
      return existing.profile;
    }
  }
  const response: BookingApiResponse<PublicBarber | null> = {
    data: profile,
    metadata: {
      contractVersion: null,
      contractUnverified: true,
      requestId: null,
      rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
      deprecated: false,
      warning: null,
    },
    httpStatus: 200,
  };
  cache.set(seed.empId, {
    profile,
    // Provisional seeds are intentionally stale so loadBarberProfile SWR revalidates.
    at: provisional ? Date.now() - BARBER_PROFILE_FRESH_MS - 1 : Date.now(),
    response,
    globalListFallback: false,
  });
  return profile;
}

async function fetchProfileNetwork(
  empId: number,
  signal: AbortSignal,
): Promise<{ profile: PublicBarber | null; response: BookingApiResponse<PublicBarber | null>; globalListFallback: boolean }> {
  bookingPerfMark("barber_profile_request_start", { empId, cacheMiss: true });
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  let globalListFallback = false;

  try {
    const res = await bookingApiRequest<{
      ok: boolean;
      barber?: Parameters<typeof normalizeProfile>[0];
    }>({
      path: `/api/public/booking/barbers/${empId}`,
      signal,
      timeoutMs: 12_000,
    });
    if (res.data?.barber) {
      const profile = normalizeProfile(res.data.barber);
      const durationMs = Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - started,
      );
      bookingPerfMark("barber_profile_response", {
        empId,
        durationMs,
        cold: !cache.has(empId),
        warm: cache.has(empId),
        globalListFallback: false,
      });
      return {
        profile,
        response: { ...res, data: profile },
        globalListFallback: false,
      };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (err instanceof BookingApiError && err.httpStatus === 404) {
      /* fall through */
    } else if (!(err instanceof BookingApiError) || err.httpStatus >= 500 || err.code === "INTERNAL_ERROR") {
      /* fall through to roster */
    } else {
      throw err;
    }
  }

  globalListFallback = true;
  // Dynamic import avoids circular dependency with barbers.ts session cache.
  const { listGlobalBarbers } = await import("./barbers");
  const roster = await listGlobalBarbers(signal);
  const found = (roster.data ?? []).find((b) => b.id === empId) ?? null;
  const durationMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - started,
  );
  bookingPerfMark("barber_profile_response", {
    empId,
    durationMs,
    globalListFallback: true,
  });
  return {
    profile: found,
    response: { ...roster, data: found },
    globalListFallback,
  };
}

/**
 * Load barber profile with shared in-flight dedupe.
 * Aborting a consumer does not cancel the shared request while other consumers remain.
 */
export function loadBarberProfile(
  empId: number,
  options?: {
    signal?: AbortSignal;
    /** Force network even when fresh cache exists. */
    force?: boolean;
    /** Return stale cache immediately and revalidate in background. */
    staleWhileRevalidate?: boolean;
  },
): {
  promise: Promise<BarberProfileLoadResult>;
  /** Detach this consumer; shared request continues if others remain. */
  release: () => void;
  /** Immediate cache peek (may be stale). */
  cached: PublicBarber | null;
} {
  const force = options?.force === true;
  const swr = options?.staleWhileRevalidate !== false;
  const cachedEntry = cache.get(empId);
  const cached = cachedEntry?.profile ?? null;
  const fresh = cachedEntry != null && Date.now() - cachedEntry.at < BARBER_PROFILE_FRESH_MS;

  if (!force && fresh && cachedEntry) {
    bookingPerfMark("barber_profile_response", {
      empId,
      cacheHit: true,
      durationMs: 0,
      warm: true,
    });
    return {
      promise: Promise.resolve({
        profile: cachedEntry.profile,
        meta: {
          cacheHit: true,
          stale: false,
          globalListFallback: cachedEntry.globalListFallback,
          durationMs: 0,
        },
        response: cachedEntry.response,
      }),
      release: () => undefined,
      cached,
    };
  }

  // Stale-while-revalidate: expose cache immediately via `cached`, but the
  // returned promise settles when revalidation finishes (or fails).
  if (!force && swr && cachedEntry && !fresh) {
    const flight = ensureInFlight(empId);
    flight.consumers += 1;

    const onAbort = () => {
      flight.consumers = Math.max(0, flight.consumers - 1);
      if (flight.consumers === 0) {
        flight.controller.abort();
        inFlight.delete(empId);
      }
    };
    options?.signal?.addEventListener("abort", onAbort, { once: true });

    bookingPerfMark("barber_profile_response", {
      empId,
      cacheHit: true,
      durationMs: 0,
      warm: true,
      source: "stale",
    });

    return {
      promise: flight.promise.finally(() => {
        options?.signal?.removeEventListener("abort", onAbort);
      }),
      release: onAbort,
      cached,
    };
  }

  const flight = ensureInFlight(empId);
  flight.consumers += 1;

  const onAbort = () => {
    flight.consumers = Math.max(0, flight.consumers - 1);
    if (flight.consumers === 0) {
      flight.controller.abort();
      inFlight.delete(empId);
    }
  };
  options?.signal?.addEventListener("abort", onAbort, { once: true });

  return {
    promise: flight.promise.finally(() => {
      options?.signal?.removeEventListener("abort", onAbort);
    }),
    release: onAbort,
    cached,
  };
}

function ensureInFlight(empId: number): InFlight {
  const existing = inFlight.get(empId);
  if (existing) return existing;

  const controller = new AbortController();
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const promise = fetchProfileNetwork(empId, controller.signal)
    .then((result) => {
      const durationMs = Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - started,
      );
      if (cachingEnabled() || process.env.VITEST === "true") {
        cache.set(empId, {
          profile: result.profile,
          at: Date.now(),
          response: result.response,
          globalListFallback: result.globalListFallback,
        });
      }
      return {
        profile: result.profile,
        meta: {
          cacheHit: false,
          stale: false,
          globalListFallback: result.globalListFallback,
          durationMs,
        },
        response: result.response,
      } satisfies BarberProfileLoadResult;
    })
    .finally(() => {
      inFlight.delete(empId);
    });

  const entry: InFlight = { promise, controller, consumers: 0 };
  inFlight.set(empId, entry);
  return entry;
}

/** Prefetch without attaching a consumer AbortSignal (idle / hover). */
export function prefetchBarberProfile(empId: number): Promise<BarberProfileLoadResult> {
  if (!Number.isFinite(empId) || empId <= 0) {
    return Promise.reject(new Error("invalid empId"));
  }
  const { promise, release } = loadBarberProfile(empId, { staleWhileRevalidate: true });
  return promise.finally(release);
}

export function clearBarberProfileCache(empId?: number): void {
  if (empId == null) {
    cache.clear();
    return;
  }
  cache.delete(empId);
}

/** Test helper */
export function __resetBarberProfileCacheForTests(): void {
  cache.clear();
  for (const flight of inFlight.values()) {
    flight.controller.abort();
  }
  inFlight.clear();
}
