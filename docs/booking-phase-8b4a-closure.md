# Booking Phase 8B4A — Confirm Hotfix Live

**Date:** 2026-07-28  
**Frontend:** cutsaloon.com  
**Backend:** casher-five.vercel.app (compat — enforce **not** activated)

## Deployed commit

| Evidence | Result |
|---|---|
| Hotfix commit | `85af015` (`85af015047e8182402c9172d404384a9e6fa7728`) |
| Prod JS `available-days` timeout | **PASS** — `timeoutMs:35e3` in live chunk |
| Prod JS create normalize | **PASS** — `bookingCode:String(a.bookingCode??a.code??…)` |
| Prod JS nested token save | **PASS** — `bookingAccessToken` + `cut_bk_access:` store live |
| Docs tip commit | `30b0ff7` (closure only; not required for runtime) |

## UI smoke (one approved fake booking)

Customer: `Smoke 8B4A Hotfix` / `01099887766`

| Step | Result |
|---|---|
| Barber-first create (محمد / حلاقة شعر / 12:30) | **PASS** |
| Success screen booking code | **`BK-2U29QJ`** |
| Nested access token stored in localStorage | **PASS** (`cut_bk_access:BK-2U29QJ`) |
| Success link | `/booking?code=BK-2U29QJ` — **no token in URL** |
| Lookup via stored access token | **PASS** — status `مؤكد` |
| Cancel via UI | **PASS** — status `ملغي` / “تم إلغاء هذا الحجز” |
| Camp Caesar shown | **PASS** (not shown) |

## Verdict

**GO for enforce** (frontend cutover smoke complete).

Do **not** flip enforce in this task — activate separately when ops is ready. Backend remains compat until then.
