# CUT CLUB 2.0 — guest booking compatibility for phone-profile retirement (#62)

## Source finding
On website main, `src/components/BookingModal.tsx` called `lookupClientByMobile(digits)` after entering eight digits. It received personally identifying customer name and `clientId`, prefilled an unverified person's name, wrote client details into browser storage using `saveClient`, and displayed returning/new-customer indicators solely from phone lookup. Backend [Casher Draft #279](https://github.com/tarek-saad-dev/casher/pull/279) prepares to quarantine that endpoint for privacy.

**Business risk:** If backend quarantines its phone-only lookup first, returning customer auto-fill would fail and be presented as "new customer" even though a booking could still proceed. Source analysis does not prove runtime traffic or other client compatibility.

## Safe interim frontend behavior
- Phone and **manual editable name** remain in the public booking form. The customer can still choose branch, services, barber, date/time, review and create a booking as a guest.
- No anonymous lookup of stored profile or writing an unverified client ID from the phone to localStorage.
- No "welcome back" or "new customer" inference from entering a phone number.
- Short localized privacy note explains why the name is manual.
- Returning clients can still book but must enter their name until a verified CUT CLUB member BFF is safely available.
- No changes to booking API data payload, staff POS, legacy customer records, Coins, vouchers, checkout or printer.

## Required release proof (NOT performed by source test)
- [ ] Synthetic guest booking creates successfully for previously unseen and existing phone numbers
- [ ] The UI never calls `GET /api/client/lookup` on typed phone; the legacy API may be 403
- [ ] All branches and modes, slot planning, review, create, success/confirmation, reschedule and booking deep links still work
- [ ] Check any other website/mobile/external client calling the old endpoint
- [ ] Casher privacy Draft #279/#294/#296 and website legacy account retirement staged together with customer-facing help
- [ ] Independent privacy/security review; real customer data remains unmodified
- [ ] VPS #26 atomic build/rollback + explicit owner exact-head merge/deploy approval

Do NOT merge/release this change uncoordinated; despite preserving public input, it intentionally removes convenience auto-fill. Safer verified prefill may return only after OTP ownership proof and approved session-backed private API.
