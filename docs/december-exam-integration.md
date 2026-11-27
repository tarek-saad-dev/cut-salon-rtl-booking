# December Exam — website integration (draft)
Status: preview route only; no production registration enabled.
- /offers/december is 404 unless DECEMBER_EXAM_PREVIEW=true; preview is not a public launch switch.
- Existing Camp Caesar site-wide campaign remains untouched. Review overlap before activation.
- Public registration collects name, normalized Egyptian phone, student status, conditional university+faculty OR school OR institute+specialization, optional referral code. No OTP for campaign registration only.
- Anonymous phone input must never provide access to existing client data, club membership or wallet. Use an opaque campaign-only session, secure HttpOnly SameSite cookie, rate limits and staff identity confirmation. Existing authenticated Club OTP stays intact.
- Server-side website BFF must forward to tenant-scoped Casher endpoints; do not expose service credentials or let the browser supply verified eligibility.
- Casher owns rules, eligibility, referral state, campaign dates and redemption; no independently hardcoded public rates. Never expose other participants' names or visit history.
- Public UI shows preliminary vs confirmed discounts, invite/share, terms, booking, and already-used state after verified identity. On failure, no fabricated success or referral code.
- Student data is saved on the canonical profile after staff confirmation; marketing consent separate; no student card photo required.
- Block publishing until contract, rates, services, group checkout, abuse prevention, and end-to-end tests are approved.
