# Phase 8A — Central Typed API Client

**Module:** `src/lib/booking-api/client.ts`  
**Entry:** `bookingApiRequest<T>(opts)`

All route modules (`branches`, `services`, `barbers`, `availability`, `booking`) must call this client. Do not add per-screen `fetch` wrappers.

---

## Function signature

```ts
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

export async function bookingApiRequest<T>(
  opts: BookingApiRequestOptions,
): Promise<BookingApiResponse<T>>;
```

`BookingApiResponse<T>` = `{ data: T; metadata: ResponseMetadata; httpStatus: number }`.

---

## URL building

1. Resolve base via `getBookingApiBaseUrl()` (trailing slash already stripped).
2. Normalize `path` to start with `/`.
3. Build with `new URL(base + path)`.
4. Serialize `query`: skip `undefined`; coerce values with `String(value)` into `URLSearchParams`.

---

## Headers

| Header | When |
|---|---|
| `Accept: application/json` | Always |
| `Content-Type: application/json` | When `body` is defined |
| `Idempotency-Key` | When `idempotencyKey` is provided |
| Caller `headers` | Merged last over defaults (except Content-Type / Idempotency set as above) |

---

## Request policy

| Policy | Value |
|---|---|
| `credentials` | `"omit"` — no browser cookies to Casher |
| `cache` | `"no-store"` |
| Cookies | Never sent automatically |
| Tokens / PII in logs | Never log `planToken`, `bookingAccessToken`, phone, or customer payload |

---

## Response parsing

1. Parse response metadata headers (`X-Booking-Contract-Version`, `X-Request-Id`, `Retry-After`, rate-limit headers, `Deprecation`, `Warning`).
2. **204 No Content** → `{ data: undefined, metadata, httpStatus: 204 }` (no JSON parse).
3. Otherwise read `text()`; empty → `undefined`; else `JSON.parse`.
4. Parse failure → `createMalformedResponseError`.
5. Non-OK HTTP → `parseBackendError` → throws `BookingApiError`.
6. OK → return `{ data, metadata, httpStatus }`.

---

## AbortSignal & timeout

- Optional caller `signal`.
- Optional `timeoutMs` wraps an internal `AbortController` that aborts on timeout and also aborts if the caller signal aborts.
- Network / abort failures become `createNetworkError` (Arabic user message; abort is non-retryable).

---

## Contract constant

`EXPECTED_CONTRACT_VERSION = "booking-public-v1"` (exported). Compat behavior documented in `booking-phase-8a-compatibility.md`.
