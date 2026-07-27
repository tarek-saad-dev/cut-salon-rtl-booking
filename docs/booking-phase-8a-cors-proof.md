# Phase 8A — CORS Connectivity Proof

Backend allowlist includes **https://cutsaloon.com** and **https://www.cutsaloon.com**.

Client uses `credentials: "omit"` — no cookies; ACAO must be the **exact** browser Origin (no wildcard).

---

## Origins verified

| Origin | Context | Status |
|---|---|---|
| `http://localhost:3000` | Local Next.js | PASS (dev probe) |
| `https://cutsaloon.com` | Production website | PASS |
| `https://www.cutsaloon.com` | Production www | PASS |

---

## Required exposed headers

Browser JS can read (production Expose-Headers live):

| Header | Status |
|---|---|
| `X-Booking-Contract-Version` | PASS |
| `X-Request-Id` | PASS |
| `Retry-After` | PASS |
| `X-RateLimit-Limit` | PASS |
| `X-RateLimit-Remaining` | PASS |
| `X-RateLimit-Reset` | PASS |
| `Deprecation` | PASS |
| `Warning` | PASS |

---

## Proof status

| Probe | Status |
|---|---|
| Local CORS / API probe | PASS via `/dev/booking-api-proof` |
| Deployed cutsaloon.com CORS probe | **PASS** |
| Browser-readable metadata | **PASS** (`contractUnverified=false` when headers exposed) |

CORS Origin is **not** authorization.

Production backend mode remains: `PUBLIC_BOOKING_CONTRACT_MODE=compat` (enforce not activated).
