# December Exam — website integration (draft)
Status: guarded preview and registration form/BFF implemented; no production registration enabled.
- /offers/december is 404 unless DECEMBER_EXAM_PREVIEW=true; preview is not a public launch switch.
- Existing Camp Caesar site-wide campaign remains untouched. Review overlap before activation.
- Public registration collects name, normalized Egyptian phone, student status, conditional university+faculty OR school OR institute+specialization, optional referral code. No OTP for campaign registration only.
- Anonymous phone input must never provide access to existing client data, club membership or wallet. Use an opaque campaign-only session, secure HttpOnly SameSite cookie, rate limits and staff identity confirmation. Existing authenticated Club OTP stays intact.
- Server-side website BFF must forward to tenant-scoped Casher endpoints; do not expose service credentials or let the browser supply verified eligibility.
- Casher owns rules, eligibility, referral state, campaign dates and redemption; no independently hardcoded public rates. Never expose other participants' names or visit history.
- Public UI shows preliminary vs confirmed discounts, invite/share, terms, booking, and already-used state after verified identity. On failure, no fabricated success or referral code.
- Student data is saved on the canonical profile after staff confirmation; marketing consent separate; no student card photo required.
- Block publishing until contract, rates, services, group checkout, abuse prevention, and end-to-end tests are approved.

## Controlled integration only
- Casher: DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED, DECEMBER_EXAM_TENANT_ID, DECEMBER_EXAM_BFF_SHARED_KEY (separate secret >=32 bytes).
- Website: DECEMBER_EXAM_PREVIEW, DECEMBER_EXAM_INTERNAL_REGISTRATION_ENABLED, DECEMBER_EXAM_PUBLIC_ORIGIN, DECEMBER_EXAM_CASHER_ORIGIN, DECEMBER_EXAM_BFF_SHARED_KEY.
- Migration 027 and an ACTIVE campaign within its configured UTC interval are required; no campaign row or rate seed has been applied.
- Do not enable publicly yet: cross-instance rate limiting, staff recovery/relink for duplicate phone claims, session status read and invitation links are missing. Origin/shared-key checks alone are not anti-bot protection. Use restricted staging ingress only.
- Anonymous registration writes only campaign participant and pending referral; never updates existing customer records or discloses prior registration data. Staff must confirm identity and transfer approved education data.
- MarketingConsentRequested is an unverified request, not a permission to send messages. Integrate with existing consent evidence workflow before outreach; protect school-age users.
