# Customer Lookup Audit

## UI: details step

Owned by `BookingModal` + `useBookingFlow` customer fields.

- Phone, name, and notes fields are part of the details step UI (Arabic labels).
- Lookup is **automatic** on phone input (not a separate button).

## Endpoint

| Item | Value |
|------|-------|
| Route | `GET /api/client/lookup?mobile=` |
| Implementation | `src/app/api/client/lookup/route.ts` |
| Backend | MSSQL `TblClient` |
| Match | Last 10 digits after stripping spaces/`-`/`+2`/`+` from stored Mobile vs `@Mobile` |

**Not** the public booking-api client.

## Trigger & loading

| Rule | Behavior |
|------|----------|
| Digits length < 8 | status `idle`, clear lookedUpName |
| Digits ≥ 8 | debounce **450ms**, status `loading`, AbortController, hard kill **2500ms** |
| found + name | setCustomerName, status `found`, `saveClient` |
| not found / abort / error | status `new`, clear lookedUpName |

## Phone normalization / validation

Two layers:

1. **Lookup:** strips non-digits only for request length gate (`replace(/\D/g,'')`).
2. **Plan gate:** `normalizeEgyptianPhone` in `useBookingFlow` (~82–90):
   - Rejects letters
   - Rejects `+` not at start
   - Digits length 10–15
   - Preserves leading `+` if present
   - Does **not** specially document `0020` — digits-only path may accept `0020…` if length OK

Name required for plan: `customerName.trim().length >= 2` even when lookup found (prefilled).

## Behaviors by scenario (code-traced)

| Scenario | Expected from code |
|----------|--------------------|
| Valid registered | found → name filled read-only style messaging `مرحباً، {name}` |
| Valid new | status new → prompt to type name |
| Invalid / short | idle until ≥8 digits; plan disabled until normalize passes |
| Spaces | stripped for lookup digits |
| `+20…` | normalize may keep `+` + digits; SQL compares last 10 |
| `0020…` | Needs runtime verification |
| API failure / abort | treated as **new** (not hard error) |
| Slow >2.5s | abort → new |
| Change number after found | re-debounce; <8 clears; new number may overwrite name |

## Risks

| Risk | Notes |
|------|-------|
| Race | `cancelled` flag on cleanup; newest effect wins |
| Duplicate requests | New effect clears timer; in-flight may abort via unmount cancel (not always aborting fetch on phone change mid-flight — timer cleared but previous async may still complete unless cancelled) |
| PII exposure | Lookup returns name (and stores id/phone) after phone digits only — no OTP |
| Error as new | Failed DB lookup looks like new customer |
| Locale | All details copy Arabic even on EN site |

## Live runtime matrix

Full interactive matrix (registered/new/invalid/+20/0020/API fail) was **partially** covered via code + prior screenshots (`ar-booking-step-details*.png`). Re-run under EN locale after i18n wiring in Phase 1.
