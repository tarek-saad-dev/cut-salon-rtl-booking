import { getBookingApiBaseUrl } from "./env";
import type { ResponseMetadata, BookingApiResponse } from "./types";
import {
  BookingApiError,
  parseBackendError,
  createNetworkError,
  createMalformedResponseError,
} from "./errors";

const EXPECTED_CONTRACT_VERSION = "booking-public-v1";

// ─── Header Parsing ──────────────────────────────────────────────────────────

function parseResponseMetadata(headers: Headers): ResponseMetadata {
  const contractVersion = headers.get("x-booking-contract-version");
  const requestId = headers.get("x-request-id");

  const retryAfterRaw = headers.get("retry-after");
  let retryAfterSeconds: number | null = null;
  if (retryAfterRaw) {
    const parsed = parseInt(retryAfterRaw, 10);
    if (!isNaN(parsed) && parsed > 0) retryAfterSeconds = parsed;
  }

  const limitRaw = headers.get("x-ratelimit-limit");
  const remainingRaw = headers.get("x-ratelimit-remaining");
  const resetRaw = headers.get("x-ratelimit-reset");

  let contractUnverified = false;
  if (contractVersion == null) {
    contractUnverified = true;
    if (process.env.NODE_ENV === "development") {
      console.warn("[booking-api] X-Booking-Contract-Version header missing — contractUnverified");
    }
  } else if (contractVersion !== EXPECTED_CONTRACT_VERSION) {
    contractUnverified = true;
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[booking-api] Contract version mismatch: expected "${EXPECTED_CONTRACT_VERSION}", got "${contractVersion}"`
      );
    }
  }

  return {
    contractVersion,
    contractUnverified,
    requestId,
    rateLimit: {
      limit: limitRaw ? parseInt(limitRaw, 10) : null,
      remaining: remainingRaw ? parseInt(remainingRaw, 10) : null,
      resetAt: resetRaw ?? null,
      retryAfterSeconds,
    },
    deprecated: headers.has("deprecation"),
    warning: headers.get("warning"),
  };
}

// ─── Request Options ─────────────────────────────────────────────────────────

export interface BookingApiRequestOptions {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  idempotencyKey?: string;
  timeoutMs?: number;
}

// ─── Central Request Function ────────────────────────────────────────────────

export async function bookingApiRequest<T>(
  opts: BookingApiRequestOptions,
): Promise<BookingApiResponse<T>> {
  const baseUrl = getBookingApiBaseUrl();
  const method = opts.method ?? "GET";

  // Build URL
  const cleanPath = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const url = new URL(`${baseUrl}${cleanPath}`);

  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // Build headers
  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...opts.headers,
  };

  if (opts.body !== undefined) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (opts.idempotencyKey) {
    reqHeaders["Idempotency-Key"] = opts.idempotencyKey;
  }

  // Timeout via AbortSignal
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let signal = opts.signal;
  let abortedByTimeout = false;
  if (opts.timeoutMs && opts.timeoutMs > 0) {
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, opts.timeoutMs);
    if (opts.signal) {
      opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    signal = controller.signal;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers: reqHeaders,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal,
      credentials: "omit",
      cache: "no-store",
    });
  } catch (err) {
    throw createNetworkError(err, { abortedByTimeout });
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }

  const metadata = parseResponseMetadata(response.headers);

  // 204 No Content
  if (response.status === 204) {
    return {
      data: undefined as T,
      metadata,
      httpStatus: 204,
    };
  }

  // Parse body
  let body: unknown;
  try {
    const text = await response.text();
    if (text.length === 0) {
      body = undefined;
    } else {
      body = JSON.parse(text);
    }
  } catch (parseErr) {
    if (!response.ok) {
      throw createMalformedResponseError(response.status, metadata.requestId, parseErr);
    }
    throw createMalformedResponseError(response.status, metadata.requestId, parseErr);
  }

  // Error responses
  if (!response.ok) {
    throw parseBackendError(body, response.status, metadata);
  }

  if (body && typeof body === "object" && "compatibility" in body) {
    metadata.contractUnverified = true;
    if (process.env.NODE_ENV === "development") {
      const compatValue = (body as { compatibility?: unknown }).compatibility;
      console.warn("[booking-api] Backend signaled compatibility mode:", compatValue);
    }
  }

  // Successful response — extract data
  const responseObj = body as Record<string, unknown> | undefined;
  // Backend wraps in { ok: true, ...data }
  // We strip `ok` and return the rest, or return as-is
  return {
    data: body as T,
    metadata,
    httpStatus: response.status,
  };
}

export { EXPECTED_CONTRACT_VERSION };
