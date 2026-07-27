/**
 * Request deduplication and abort management.
 * Prevents duplicate in-flight GET requests and handles stale responses.
 */

interface InFlightEntry {
  promise: Promise<unknown>;
  abortController: AbortController;
  requestKey: string;
  startedAt: number;
}

const inFlightRequests = new Map<string, InFlightEntry>();

export function buildRequestKey(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const params = new URLSearchParams();
  if (query) {
    const sorted = Object.entries(query)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [k, v] of sorted) {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Execute a request with deduplication. If an identical GET request
 * is already in-flight, return the existing promise.
 */
export function deduplicatedRequest<T>(
  requestKey: string,
  executor: (signal: AbortSignal) => Promise<T>,
): { promise: Promise<T>; abort: () => void } {
  const existing = inFlightRequests.get(requestKey);
  if (existing) {
    return {
      promise: existing.promise as Promise<T>,
      abort: () => existing.abortController.abort(),
    };
  }

  const controller = new AbortController();
  const promise = executor(controller.signal).finally(() => {
    inFlightRequests.delete(requestKey);
  });

  inFlightRequests.set(requestKey, {
    promise,
    abortController: controller,
    requestKey,
    startedAt: Date.now(),
  });

  return { promise, abort: () => controller.abort() };
}

/**
 * Abort all in-flight requests matching a prefix.
 */
export function abortRequestsMatching(prefix: string): void {
  for (const [key, entry] of inFlightRequests) {
    if (key.startsWith(prefix)) {
      entry.abortController.abort();
      inFlightRequests.delete(key);
    }
  }
}

/**
 * Abort all in-flight requests.
 */
export function abortAllRequests(): void {
  for (const entry of inFlightRequests.values()) {
    entry.abortController.abort();
  }
  inFlightRequests.clear();
}

/**
 * Selection version tracker — prevents stale responses from
 * overwriting newer state.
 */
let _selectionVersion = 0;

export function incrementSelectionVersion(): number {
  return ++_selectionVersion;
}

export function getSelectionVersion(): number {
  return _selectionVersion;
}

export function isStaleResponse(requestVersion: number): boolean {
  return requestVersion < _selectionVersion;
}

/** Only for testing */
export function _resetDedup(): void {
  abortAllRequests();
  _selectionVersion = 0;
}
