# Booking Phase 8B2 — Phone Storage Migration

## Removed from booking-management

| Key | Change |
|---|---|
| `cut_customer_phone` | No reads in upcoming/lookup. Clear-on-logout still removes orphaned key. |
| Auto phone from storage | Hero/Modal show CTA to `/booking` instead |

## Retained (non-booking CRM)

| Key | Use |
|---|---|
| `cut_client` | Deliberate `/client` login profile; profile widget may pass phone to upcoming only after login |

## Opt-in remember

Not reintroduced for booking lookup/upcoming. Explicit copy: لن يتم حفظ رقم الهاتف تلقائياً.

## Access tokens

`cut_bk_access:{CODE}` remains the preferred ownership proof after create; unaffected by phone migration.
