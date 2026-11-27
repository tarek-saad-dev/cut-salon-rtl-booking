# CUT CLUB local manual UX review

This is the actual consolidated website UI and its BFF routes, connected to a **local synthetic fixture** rather than Casher. It does not change any application auth code or deployment configuration. No WhatsApp, real client, SQL or financial data is involved; requests are in memory and reset when the process stops. Use a fresh clone of the release branch, no .env files, Node 22 and npm.

```sh
git clone -b release/cut-club-test-20261127 https://github.com/tarek-saad-dev/cut-salon-rtl-booking.git cut-club-review
cd cut-club-review
npm ci
node scripts/cut-club-local-preview.mjs
```

Open http://127.0.0.1:3100/club after Next starts. Fake phone 01000000000, local fixture code 123456. Review Home, Wallet, Rewards, Memberships, submit a test request, Profile, Challenges and Referrals. Log out and test fake numbers 01000000001 (under review), 01000000002 (suspended), 01000000003 (unlinked), same local code. The fake numbers never receive real messages.

Not a shared staging or production deployment. This does not test real OTP delivery, the real database, staff admin UI, purchase or invoice settlement. Membership discounts and purchases remain disabled. Stop with Ctrl+C. Do not expose this local runner to other machines.
