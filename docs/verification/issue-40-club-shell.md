# Issue #40 — CUT CLUB restricted shell

Request: `issue-40-execute-1`. Scope: isolated `/club` foundation only.

## Design and implementation plan

Use a server-rendered restricted entry inside a reusable responsive shell. Keep the
existing public layouts and sitemap allowlist. Exclude `/club` and descendants
from public SiteChrome and public providers (which otherwise fetch branches and
install booking prefetch). Test that boundary, metadata, navigation and safe module
states. Add route headers, then run targeted tests and build.

The server-only deployment setting `CUT_CLUB_SHELL_ENABLED` defaults OFF (only
literal `true` selects the other state). Both states remain unavailable. Setting
the flag never enables authentication, data access, a dashboard or redemption.
No environment file changes are needed. No client identity, token, phone storage,
query identity or customer API is used. Five reusable typed module definitions
and a presentational card support loading/empty/unavailable only. They are not
rendered as a pretend customer dashboard. Book explicitly opens public `/book`;
Explore, Wallet and Me are disabled native buttons without sensitive hrefs.

Server layout metadata sets noindex/nofollow, including Googlebot. Route headers
cover `/club/:path*` with X-Robots-Tag and private/no-store. The layout forces
dynamic rendering, zero revalidation and no-store fetch caching. Sitemap remains
an explicit public-only allowlist. These controls ARE NOT authentication. This
route is a publicly reachable restricted notice, not an authenticated member area.

## Backend and release dependencies

Casher parent #243, Sprint A #249 and security draft #251 must provide verified
customer sessions and scoped secure member contracts. The verifier is not completed
customer authentication. A later task MUST authorize the session for every data
action/BFF, prevent cross-account access, and define secure cache behavior before
any personal data, wallet/rewards values or mutations can be enabled.

Related drafts: public introduction #38, architecture #39 (issue #34), operating
contract #36. This branch does not modify the operating-contract docs. The finalizer
PR body should link this tracker for reconciliation with #36:
`docs/verification/issue-40-club-shell.md`.

**NO DEPLOY / NO MERGE:** owner and security review, approved safe environment,
feature flag policy and backend plan are required. Independent exact-head review
and finalizer verification remain required. This execution is not READY_FOR_TAREK.
GitHub-hosted finalizer owns branch `codex/issue-40` and draft PR against `main`;
the runner does not push, merge or deploy.

## 2026-11-14 GitHub-hosted production and browser validation

The earlier EPERM / missing-dependencies report below describes the initial
sandboxed agent attempt. Subsequent **GitHub Actions** verified the committed
implementation (through head `d9123d4da4aa1a39eb33e23eb8928e0619bebe4d`):

- [Standard site CI 43535826965](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43535826965):
  **SUCCESS** (install, site tests and build).
- [Private shell Playwright 43535827101](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43535827101):
  **SUCCESS** (Google Chrome, production build and real browser assertions).
- Browser checks ran at 375×812, 768×1024 and 1440×900, validating the
  restricted notice and disabled sensitive navigation. They verified private
  `Cache-Control: ...no-store`, `X-Robots-Tag: noindex`, robots metadata,
  absence from sitemap, no client/member API requests, no localStorage/query
  bypass, and responsive horizontal fit.
- Workflow uploads screenshots/traces via a CI artifact to enable further human
  review. Browser pass is not proof that a login or customer API is secure.
- Also separated the pure client-safe `isClubPath` helper into
  `src/lib/club/path.ts`, distinct from the server-side shell feature gate.
- The [exact-head independent review](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/41)
  and explicit owner approval still govern release readiness. **No merge or
  production deployment performed.**

## Verification evidence

- `git diff --check`: passed.
- Initial `npm ci`: blocked by esbuild install subprocess `spawnSync ... EPERM`.
- Targeted `npm test -- src/components/club/club.test.tsx src/components/SiteChrome.test.tsx`:
  blocked, `vitest: not found` following failed install.
- Retry `npm ci --ignore-scripts --cache /tmp/cut-npm-cache`: failed with npm
  `Exit handler never called!`; no successful dependency install.
- Full `npm test`: blocked, `vitest: not found`.
- `npm run build`: blocked, `next: not found` following failed install.
- Tests added for default/true flag fail-closed HTML, no fetch, responsive navigation
  semantics, safe module states, metadata, sitemap and private response headers.
  Provider boundary test also makes storage access fail and rejects public provider
  or booking-prefetch mounting. Existing SEO tests retain public metadata checks.
- No production requests or business mutations performed.
- Browser smoke not executed; no responsive visual pass or exact-head independent
  review is claimed. Workflow must run the repository verification gate.

## Read-only responsive smoke plan (pending)

1. Run locally with a safe environment, flag absent; intercept and reject external
   network requests. Open `/club` at 375×812, 768×1024 and 1440×900.
2. Verify restricted Arabic copy, CUT branding, no campaign/public navbar, no
   horizontal overflow, readable contrast and no content hidden by the bottom nav
   or safe-area inset. Desktop nav sits below header; mobile nav stays at bottom.
3. Use keyboard/skip link: Home is current, public Book works, Explore/Wallet/Me
   cannot activate. No login claim, personal details, wallet amounts or fake bookings.
4. Reload with denied browser storage and identity-looking query parameters; verify
   unchanged restricted UI and no customer/booking bootstrap requests. Inspect
   initial HTML/RSC payload for absence of member data.
5. Repeat with flag `true`; authentication-unavailable notice must still block all
   member access. Check response headers, robots metadata and `/sitemap.xml`.
6. Compare `/`, `/book`, existing offers and `/client/loyalty` chrome to baseline
   using mocks/network interception. Do not submit any forms or booking mutations.
