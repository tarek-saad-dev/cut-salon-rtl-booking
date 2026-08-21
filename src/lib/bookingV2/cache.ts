type CacheEntry<T> = {
  data: T;
  etag: string | null;
  updatedAt: number;
  /** In-flight revalidate promise (SWR). */
  revalidate?: Promise<T> | null;
};

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): CacheEntry<T> | null {
  const entry = store.get(key);
  return (entry as CacheEntry<T> | undefined) ?? null;
}

export function cacheSet<T>(key: string, data: T, etag: string | null): CacheEntry<T> {
  const entry: CacheEntry<T> = {
    data,
    etag,
    updatedAt: Date.now(),
    revalidate: null,
  };
  store.set(key, entry as CacheEntry<unknown>);
  return entry;
}

export function cachePeekEtag(key: string): string | null {
  return store.get(key)?.etag ?? null;
}

export function cacheClear(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheKeys(prefix?: string): string[] {
  const keys = [...store.keys()];
  if (!prefix) return keys;
  return keys.filter((k) => k.startsWith(prefix));
}

/**
 * Stale-while-revalidate helper.
 * Returns cached data immediately (if any), then refreshes in background.
 */
export async function swrFetch<T>(options: {
  key: string;
  fetcher: (etag: string | null) => Promise<{ data: T; etag: string | null; notModified: boolean }>;
  onUpdate?: (data: T, meta: { fromCache: boolean; stale: boolean }) => void;
  force?: boolean;
}): Promise<{ data: T; fromCache: boolean; stale: boolean }> {
  const existing = cacheGet<T>(options.key);

  if (existing && !options.force) {
    options.onUpdate?.(existing.data, { fromCache: true, stale: true });

    if (!existing.revalidate) {
      const revalidate = options
        .fetcher(existing.etag)
        .then((res) => {
          const next = res.notModified ? existing.data : res.data;
          const etag = res.etag ?? existing.etag;
          cacheSet(options.key, next, etag);
          options.onUpdate?.(next, { fromCache: false, stale: false });
          return next;
        })
        .catch(() => {
          // Keep stale cache; background refresh failures must not become unhandled rejections.
        })
        .finally(() => {
          const cur = cacheGet<T>(options.key);
          if (cur) cur.revalidate = null;
        });
      existing.revalidate = revalidate;
    }

    return { data: existing.data, fromCache: true, stale: true };
  }

  const res = await options.fetcher(existing?.etag ?? null);
  const data = res.notModified && existing ? existing.data : res.data;
  cacheSet(options.key, data, res.etag ?? existing?.etag ?? null);
  options.onUpdate?.(data, { fromCache: false, stale: false });
  return { data, fromCache: false, stale: false };
}
