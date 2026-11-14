# CUT CLUB 2.0 — legacy /client phone-only account route retirement (#52)

## Source finding
Legacy `src/app/client/page.tsx` looked up a customer profile by an unverified phone, persisted client ID/profile in browser storage, accepted `redirect` and offered profile edits using the resulting ID. No OTP/session was established in this page. This is **source-level** evidence only; production reachability and actual customer usage were not tested.

## Draft replacement
- Server-rendered, noindex public maintenance page with **no lookup, personal data, form, clientId or redirect**.
- Existing customer database, points, voucher records, POS and /book remain unchanged by this PR.
- Related Website Draft #51 retires `/client/loyalty`; coordinate both rather than redirecting a phone-only identity into /club.
- Casher backend phone-only and private GET routes are separate risks under #269, and verified customer sessions are under #243.

## Release blockers
- [ ] Verify by source whether booking /book or other public pages rely on current /client profile or saved-client identity; plan guest booking compatibility
- [ ] Test deep links `/client?redirect=/client/loyalty` using synthetic query only; no redirect should happen
- [ ] CI and isolated responsive browser run at 360/768/1440, with network assertions: no private GET/POST, no phone lookup, no profile edit
- [ ] Independent security and accessibility review
- [ ] Staff guidance for customers needing profile updates or voucher checks
- [ ] Website VPS #26 safe build/rollback and coordinated Casher privacy release
- [ ] Explicit owner merge/deploy approval for this exact PR after evidence

No production access, live customer lookups or mutations. Draft only.
