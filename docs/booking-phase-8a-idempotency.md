# Phase 8A — Idempotency

**Module:** `src/lib/booking-api/idempotency.ts`

Stable mutation IDs prevent double-booking / double-cancel from retries, re-renders, and double-clicks.

---

## API

| Function | Role |
|---|---|
| `createClientRequestId()` | Fresh UUID (`crypto.randomUUID` + fallback) |
| `getOrCreateMutationId(operationKey)` | Return existing in-flight ID or create one |
| `completeMutationId(operationKey)` | Clear after confirmed success |
| `abandonMutationId(operationKey)` | Clear when selection changed / non-retryable failure |
| `hasPendingMutation` / `getPendingMutationId` | Inspect in-flight map |
| `buildCreateOperationKey(...)` | Stable create key from selection |
| `buildCancelOperationKey(bookingCode)` | Stable cancel key |

IDs must be ≤ 128 characters (UUID satisfies this).

---

## Stability rules

| Scenario | Behavior |
|---|---|
| Same create attempt (retry / re-render / double-click) | **Same** ID |
| Network retry after uncertain failure | **Reuse** same ID |
| Materially different selection | **New** create operation key → new ID |
| Cancel for one booking code | One stable ID scoped to that code |
| Confirmed success | `completeMutationId` |
| Selection abandoned | `abandonMutationId` |

Do **not** generate a new mutation ID after an uncertain network/timeout result.

---

## Dual transmission (create & cancel)

Send the **same** UUID in both places:

| Channel | Field |
|---|---|
| Header | `Idempotency-Key: <uuid>` |
| Body | `clientRequestId: <uuid>` |

---

## Operation key formats

### Create

```text
create:{branchCode}:{date}:{time}:{sortedServiceIds}:{mode}:{empId|any}
```

Example: `create:GLEEM:2026-07-27:10:00:12,34:specific:7`

### Cancel

```text
cancel:{bookingCode}
```

Example: `cancel:BK-ABC123`

Keys contain **no** customer phone/name and **no** tokens.
