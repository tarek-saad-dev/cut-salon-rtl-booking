/**
 * Short-lived in-memory caches for booking catalog / barber list.
 * Speeds up reopen and avoids refetching identical public GET payloads.
 */

const DEFAULT_TTL_MS = 5 * 60_000;

function cachingEnabled(): boolean {
  // Vitest shares module state across cases — keep caches off in tests.
  return process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function readCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  if (!cachingEnabled()) return null;
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache<T>(
  map: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs = DEFAULT_TTL_MS,
): void {
  if (!cachingEnabled()) return;
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const catalogCache = new Map<
  string,
  CacheEntry<{
    config: unknown;
    services: unknown;
    barbers: unknown;
  }>
>();

const globalBarbersCache = new Map<string, CacheEntry<unknown>>();

const crossBranchCache = new Map<string, CacheEntry<unknown>>();

export function getCachedCatalog<T>(branchCode: string): T | null {
  return readCache(catalogCache, branchCode.toUpperCase()) as T | null;
}

export function setCachedCatalog(
  branchCode: string,
  value: { config: unknown; services: unknown; barbers: unknown },
): void {
  writeCache(catalogCache, branchCode.toUpperCase(), value);
}

export function getCachedGlobalBarbers<T>(): T | null {
  return readCache(globalBarbersCache, "global") as T | null;
}

export function setCachedGlobalBarbers(value: unknown): void {
  writeCache(globalBarbersCache, "global", value);
}

export function getCachedCrossBranch<T>(key: string): T | null {
  return readCache(crossBranchCache, key) as T | null;
}

export function setCachedCrossBranch(key: string, value: unknown): void {
  // Cross-branch availability changes often — shorter TTL.
  writeCache(crossBranchCache, key, value, 90_000);
}

export function buildCrossBranchCacheKey(
  empId: number,
  serviceIds: number[],
  dateFrom: string,
  days: number,
): string {
  const ids = [...new Set(serviceIds)].map(Number).sort((a, b) => a - b).join(",");
  return `${empId}|${ids}|${dateFrom}|${days}`;
}

/** Test helper */
export function _clearBookingCaches(): void {
  catalogCache.clear();
  globalBarbersCache.clear();
  crossBranchCache.clear();
}
