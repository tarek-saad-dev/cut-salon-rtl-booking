# Issue 37 — public CUT CLUB Sprint 01

Request: `issue-37-execute-1`. Baseline: `b9f6874` (detached control-plane
workspace). The GitHub-hosted finalizer owns `codex/issue-37` and draft PR
publication against `main`; this runner does not push, merge or deploy.

## Implementation and boundaries

`/cut-club` is a server component with Arabic-first initial HTML, one H1,
labelled sections, existing CUT tokens/fonts and brand media (`public/hero.png`).
It explains identity, points, tiers, eligible visits, reward discovery and FAQs.
Native details/summary controls work without page JavaScript. Booking and price
links use `/book` and `/prices`; no membership is required by this page.
Desktop and mobile menus add localized “عن CUT CLUB” / “About CUT CLUB” entries.
Existing `/client/loyalty` links and behavior are preserved.

Claims are limited to concepts represented in `clientLoyaltyApi.ts` membership,
levels, visits and reward types. Those types are not evidence of live benefits.
There are no rates, threshold promises, sample balances, testimonials, new paid
programs or guaranteed rewards. Unverified future programs are omitted.
The public page makes no customer API calls, collects no information and adds
no form, wallet, redemption or authentication behavior. Existing private pages
remain noindex; noindex does not establish authorization.

Sprint 02 remains separate: prove verified customer login/session and BFF/server
account authorization with negative cross-account tests before a private `/club`
wallet or personalized UI. Phone lookup, localStorage and clientId are not proof
of authorization. No legacy migration is attempted here.

SEO uses `publicPageMetadata('/cut-club', ...)` with unique canonical/social copy.
The sitemap adds only `/cut-club` to the four baseline URLs. Existing private
and booking-inner-step noindex tests continue to run.

## Local evidence

- Dependency setup: offline install using `/tmp/cut-npm-cache` failed ENOTCACHED;
  `npm ci --ignore-scripts --offline` succeeded (555 packages). This recovery
  skips lifecycle scripts and is not a successful standard `npm ci` gate.
- `npm test`: **82 files / 493 tests passed**, exit 0. Existing React act and
  Browserslist warnings were emitted.
- Focused route/navigation/SEO run: **3 files / 11 tests passed**, exit 0,
  including native FAQ opening, server markup, actual page metadata, preserved
  legacy links, AR/EN navigation and exact sitemap.
- Feature-removal check: temporarily restored baseline nav/sitemap and stubbed
  the new page; focused tests failed as expected. Restored implementation and
  reran focused tests: 11 passed. No temporary preview test remains in source.
- `npx --no-install tsc --noEmit --incremental false`: passed, exit 0.
- `npm run build`: stalled at Turbopack optimized compilation and was
  interrupted (exit 130). A subsequent Webpack diagnostic refused the residual
  build lock. The interrupted generated `.next` was preserved under
  `/tmp/issue37/interrupted-next` before a fresh bounded diagnostic attempt.
  Fresh `npm run build -- --webpack` failed (exit 1) with the generic message
  “Build failed because of webpack errors” and no actionable compiler details.
  Root cause/regression attribution is unproven; no build success is claimed.
- Browser smoke: **not completed**. Local HTTP binding failed with EPERM;
  Chrome launch failed in the sandbox. Isolated rendered HTML/CSS fixtures
  were generated under `/tmp/issue37`, but do not establish visual correctness.
- Independent Codex workspace review: PASS, no material findings; flagged
  1024px English desktop navigation and short-screen mobile menu for visual
  confirmation. This does not replace exact published-head REVIEW.
- No production APIs, customer records, bookings or loyalty records were
  accessed or changed. No secrets were read. No merge/deploy occurred.

Build gate and exact-head hosted verification remain required; not READY_FOR_TAREK.

## Read-only smoke plan (pending in a capable local/staging environment)

1. Build/start the candidate with safe non-production configuration. Request
   `/cut-club` with JavaScript disabled: verify useful Arabic body content,
   one H1, FAQs and links in initial HTML; canonical and OG URL must resolve
   to `https://cutsaloon.com/cut-club`, with no noindex.
2. At 360×640, 390×844, 768×1024, 1024×768 and 1440×900 inspect heading wrapping,
   image crop, spacing, focus rings, minimum control sizes and horizontal
   overflow. Check Arabic and English site-navigation modes. The public page
   stays explicitly Arabic/RTL even when the site navigation is English.
3. Open the mobile menu, scroll to its final account/legacy entries on a short
   screen, follow “عن CUT CLUB”, and verify the sheet closes. At 1024px verify
   desktop items and booking/account controls do not overlap in either language.
4. Tab through links and FAQ summaries; use Enter/Space to expand FAQs. Verify
   the rewards anchor lands below sticky chrome and page content is not hidden
   by the mobile bottom navigation.
5. Follow the new public `/book` and `/prices` links only to their entry pages.
   Do not submit a booking, account lookup, profile update or loyalty action.
   Inspect legacy hrefs without submitting phone numbers or opening a wallet.
6. Check `/sitemap.xml` preserves all current main URLs plus `/cut-club` exactly
   once; inspect server noindex for `/client`, `/client/loyalty` and booking
   inner steps with safe fixtures/configuration. Do not fetch private real data.

## Merge-time reconciliation checklist for finalizer / operator

PR #36 was read directly and is **open, draft, unmerged** at the time of this
work. Its PROJECT_CONTRACT, MASTER_ROADMAP, TASK_TRACKER and WORK_LOG govern
intent, but no draft website-program documents are copied into this branch.
Include these notes in the feature PR and reconcile at merge time:

- [ ] Open/update a draft PR against main on `codex/issue-37`, linked to #37.
- [ ] If #36 merges first, update TASK_TRACKER + WORK_LOG with this PR, exact
      head and actual test/review status. Otherwise link this handoff from #36
      and reconcile after its merge; never describe this work as live.
- [ ] Rebase against any approved #32 integration without importing its font
      or branch work here. Preserve its branch sitemap entries and reconcile
      exact-route SEO and release-health allowlist/fixture expectations with
      `/cut-club` (seven routes if #32's six-route sitemap lands first).
- [ ] Coordinate #33 prices work: retain `/prices` destination and preserve its
      own catalog/SSR tests. No price/catalog code is changed by this issue.
- [ ] Run standard install/tests/build gate on the exact published head and
      complete the viewport smoke above; record remaining environmental failures.
- [ ] Request independent control-plane REVIEW of that exact head. Keep Draft
      until findings and release blockers are resolved; owner approval required.

Rollback is a reviewed revert of this scoped page/navigation/sitemap change;
there are no database migrations or new customer data to reverse. Reconcile
allowlists against the actual merge base before any approved release.
