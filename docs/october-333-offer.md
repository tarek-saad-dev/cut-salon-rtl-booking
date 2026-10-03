# October 333 offer integration

Issue #7 adds `/offers/october-333` and `/offers/october-333/success`. Existing booking remains at `/book`; a claim does not create a booking, and no payment integration is used.

The funnel is deliberately unavailable until a campaign backend is configured. Set `NEXT_PUBLIC_OCTOBER_OFFER_API_URL` at build time to the full campaign resource URL. This is public configuration, never a secret. No default production API endpoint is assumed.

Proposed adapter contract (requires backend agreement before enabling):

- `GET <resource>` returns `{ status: "active" | "ended", remainingClaims: number, terms: string, claimDeadline: ISO date string, redeemUntil: ISO date string }`. Remaining claims must be an integer from 0 to 100. Both dates are required and validated separately. The backend supplies the actual claim deadline, redemption expiry, and terms. Claims close at `claimDeadline` (including when it passes while the form is open); `redeemUntil` describes when a confirmed offer can be used. Both dates are displayed separately. Ended, zero stock, or a reached claim deadline renders the ended state at the same URL. HTTP 410 also ends the campaign.
- `POST <resource>/claims` accepts `{ name, mobile, attribution }`. Mobile is normalized to an Egyptian local number. Attribution allowlist: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`.
- Successful claims return `{ claimId: nonempty string, redeemUntil: ISO date string }`. The receipt expiry controls redemption validity on the success page independently of the closed claim period. Legacy `validUntil`-only payloads are rejected rather than guessing either deadline. HTTP 409/410 indicates exhausted/ended campaign. Other failures keep the customer on the form with a clear warning that confirmation was not received.
- Backend must atomically enforce the first 100 valid claims, enforce `claimDeadline`, validate customer input and eligibility, and honor the `Idempotency-Key` header on retries (including after ambiguous network failures). The client retains the key for retries within the mounted form. Cross-origin endpoints must allow the site origin, GET/POST, Content-Type and Idempotency-Key. Requests omit cookies and time out after 10 seconds.

Only the confirmed receipt is stored in session storage, without the customer's name or phone. Direct visits to success without a receipt do not show confirmation. When storage is blocked, confirmation is shown inline. Customers are asked to save their confirmation number for later booking; the receipt is not a server-side authorization token.

Verification must use mocks; never submit claims or bookings against production. The included API, funnel, and site chrome tests make no external requests. There is no invented deadline, countdown, video, or remaining-stock number. The explainer video is a labeled placeholder.
