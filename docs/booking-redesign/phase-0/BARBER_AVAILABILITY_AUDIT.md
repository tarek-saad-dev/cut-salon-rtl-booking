# Barber Availability Audit

## Confirmed inconsistency

| Barber | Barber-first result | Sidebar |
|--------|---------------------|---------|
| **Mahmoud** | Auto-resolves to GLEEM / جليم – سابا باشا → service step | Matches GLEEM |
| **Ahmed** | Main: `لا توجد فروع عامة متاحة لهذا الحلاق` | Still shows جليم – سابا باشا |

Screenshots:
- `screenshots/ar-booking-ahmed-no-public-branches.png`
- `screenshots/ar-booking-mahmoud-service-auto-gleem.png`

## Live API evidence (2026-08-05, casher-five)

| Barber | ID | Active bookable | Assigned branches (profile) | Public picker branches after Camp filter | Services count | Barber-first result | Confirmed issue |
|--------|----|-----------------|-----------------------------|------------------------------------------|----------------|---------------------|-----------------|
| Ahmed | 18 | true | **CAMP_CAESAR only** | ∅ | 31 | Empty public branches | **Yes — blocked** |
| Mahmoud | 1188 | true | **GLEEM only** | GLEEM | 31 | Auto GLEEM → service | Works |
| Omar | 25 | true | GLEEM | GLEEM | 31 | Expected work | No issue observed |
| Mohamed | 7 | true | GLEEM | GLEEM | 31 | Expected work | No issue observed |
| Ziad | 12 | true | CAMP_CAESAR, GLEEM | GLEEM | 31 | Can pick GLEEM | Camp hidden from picker |
| Kareem | 5 | true | CAMP_CAESAR, GLEEM | GLEEM | 31 | Can pick GLEEM | Camp hidden from picker |

Branch roster checks:
- GLEEM barbers: Ziad, Omar, Kareem, Mohamed, Mahmoud (**no Ahmed**)
- CAMP_CAESAR barbers: Ahmed, Ziad, Kareem

Raw public branches API returns **both** CAMP_CAESAR and GLEEM (`evidence/api-branches.json`).

## Request success/fail

| Request | Mahmoud | Ahmed |
|---------|---------|-------|
| `GET /api/public/booking/barbers/{id}` | **Succeeds** — branches `[GLEEM]` | **Succeeds** — branches `[CAMP_CAESAR]` |
| Frontend intersection with BranchContext list | GLEEM ∩ [GLEEM] = [GLEEM] | CAMP ∩ [GLEEM] = **[]** |
| User-visible failure | none | Empty branches error string |

**Backend does return different branch assignments.** Frontend then filters valid Camp assignment out of the public picker.

## Root cause (confirmed)

1. Profile keep Camp: `barbers.ts` `normalizeBarber` intentionally keeps `CAMP_CAESAR` (comment ~60–61).
2. Public picker excludes Camp: `BranchContext.tsx` ~47–50 and `selectBranch` refuses Camp ~90.
3. Modal filter: `BookingModal.tsx` ~235–241  
   `allowedBranches = branches.filter(b => barberBranches.some(...))`
4. Empty → error copy ~552–553.
5. Sidebar uses `displayBranchName = bookingBranchName ?? selectedBranch?.branchName` (~365–366), so a previously confirmed GLEEM remains visible while picker is empty.

## Why AR shows Ahmed but EN may not

- AR `BarbersSection` uses **global** `listGlobalBarbers` → Ahmed appears.
- EN `EnglishHome` uses **branch** `getBookingBarbers(selectedBranch)` → with GLEEM selected, Ahmed is absent from the rail (observed 2026-08-05).

## Frontend vs backend vs data

| Layer | Verdict |
|-------|---------|
| Backend profile | Correctly reports Ahmed@Camp, Mahmoud@Gleem |
| Frontend filter | Incorrect for Camp-only public barbers relative to product expectation |
| Data/config | Ahmed has no GLEEM assignment — also a configuration reality |
| Sidebar/main SoT | Different sources → disagreement |

## Needs product decision (not fixed in Phase 0)

- Treat Camp as public bookable, **or**
- Hide Camp-only barbers from public global list, **or**
- Map Camp barbers to an alternate public branch policy.

Do not modify employee/branch data during audit — done.
