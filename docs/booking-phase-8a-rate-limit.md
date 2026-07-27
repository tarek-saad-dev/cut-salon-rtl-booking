# Phase 8A — Rate Limit Handling

---

## Sources of `retryAfterSeconds`

| Source | Priority |
|---|---|
| Response header `Retry-After` (integer seconds) | Parsed into `metadata.rateLimit.retryAfterSeconds` |
| `error.metadata.retryAfterSeconds` | Merged in `parseBackendError` when present |

Also captured (informational): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Error shape for UI

On `RATE_LIMIT_EXCEEDED` / HTTP 429, `BookingApiError` exposes:

- `isRateLimited: true`
- `isRetryable: true`
- `retryAfterSeconds: number | null`
- Arabic message: عدد الطلبات كثير جداً، يرجى الانتظار قليلاً

UI should treat this as **countdown-ready**: disable submit until `retryAfterSeconds` elapses (or user waits).

---

## Mutation policy (create / cancel)

| Rule | Detail |
|---|---|
| Auto-retry | **None** — do not retry mutations behind the user’s back |
| Idempotency | Preserve the same `Idempotency-Key` / `clientRequestId` on manual or network retry |
| Uncertain timeout | Preserve mutation ID; do not claim “الحجز فشل” |
| Submit UX | Disable repeated submission until safe |

---

## Read policy

- No aggressive retry loops.
- At most one controlled retry only if project conventions justify it (Phase 8A client itself does not auto-retry reads).

---

## Related headers for CORS

`Retry-After` and rate-limit headers should be listed in `Access-Control-Expose-Headers` so the browser can read them cross-origin (see CORS proof doc).
