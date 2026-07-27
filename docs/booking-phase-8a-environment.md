# Phase 8A — Environment Configuration

## Variable

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_CASHER_API_BASE_URL` | Absolute base URL of the Casher public booking API. Single source of truth for all Phase 8A booking client requests. |

**Example:** `https://casher-five.vercel.app`

Renamed from legacy `NEXT_PUBLIC_BOOKING_API_BASE_URL`. New code in `src/lib/booking-api/env.ts` reads **only** `NEXT_PUBLIC_CASHER_API_BASE_URL`.

The API base URL is **public configuration**, not a secret.

---

## `.env.example`

Documented in project root `.env.example`:

```env
# ─── Booking API (Casher backend) ──────────────────────────────────────────
# Public API base URL — REQUIRED. Must be absolute HTTPS in production.
# Example: https://casher-five.vercel.app
NEXT_PUBLIC_CASHER_API_BASE_URL=https://casher-five.vercel.app
```

Local overrides belong in `.env.local` (gitignored). Do not commit real deployment secrets (DB passwords, etc.).

---

## Validation rules (`src/lib/booking-api/env.ts`)

| Rule | Behavior |
|---|---|
| Required | Missing / empty → throw clear error (no silent empty-string fallback) |
| Trailing slash | Stripped centrally before use |
| Absolute URL | Parsed with `URL`; invalid → throw |
| Production | Protocol **must** be `https:` |
| Local / non-prod | `http:` and `https:` allowed (e.g. localhost) |
| Cache | Validated value cached in-module; `_resetBaseUrlCache()` for tests only |

Do **not** duplicate env parsing across components. Call `getBookingApiBaseUrl()`.

Do **not** allow query-string or runtime overrides of the base URL.

---

## Local vs production

| Environment | Typical value | Notes |
|---|---|---|
| Local dev | `https://casher-five.vercel.app` or `http://localhost:<port>` | HTTP allowed only outside production |
| Production (cutsaloon.com) | `https://casher-five.vercel.app` | HTTPS required; set in hosting env |

---

## Policy

- No production secrets in git.
- Public base URL may appear in `.env.example`.
- Fail loudly when misconfigured — never fall back to an outdated hardcoded domain.
