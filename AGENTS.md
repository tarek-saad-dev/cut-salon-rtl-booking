# CUT Salon Client — Agent Rules

GitHub issues are the source of truth for task scope. Pull requests are the source of truth for implementation, test evidence, review findings, and release readiness.

Read `docs/agent-control-plane/CONTROL-PLANE.md` before changing code.

## Project

- Repository: `tarek-saad-dev/cut-salon-rtl-booking`
- Base branch: `main`
- Stack: Next.js 16, React, TypeScript, Tailwind CSS
- Package manager: npm
- Install: `npm ci`
- Tests: `npm test`
- Build: `npm run build`
- Local runtime: `npm run dev`
- Production: `https://cutsaloon.com`

## Execution guardrails

- One builder branch per issue.
- Implement only the originating issue scope.
- Never commit secrets or credentials.
- Never merge automatically.
- Never dispatch production deployment.
- A human approval is required before merge.
- In this repository, a merge/push to `main` automatically runs `.github/workflows/deploy-vps.yml` and deploys production.
- Therefore `READY_FOR_TAREK` means the change is safe to merge and safe to deploy to production immediately.
- Prefer targeted tests for changed behavior plus `npm run build` when the change can affect production bundling.
- Use local browser/runtime smoke for UI behavior when relevant.
- Separate pre-existing failures from regressions.

## Production data safety

This frontend talks to Casher public APIs.

Cloud Agents must NOT create, cancel, reschedule, or otherwise mutate real production bookings, customer profiles, loyalty state, or other business data while testing.

- Prefer unit/component tests and mocks for mutation flows.
- Local browser smoke must avoid submitting real production mutations.
- Read-only production API requests may be used only when needed and safe.
- Do not treat a successful page load as proof that mutation flows are safe.

## Task lifecycle

`PLANNED -> BUILDING -> REVIEW -> FIXING -> REVIEW -> READY_FOR_TAREK -> MERGED`

`READY_FOR_TAREK` requires:
- issue scope complete
- targeted tests green, or named pre-existing failures
- build/runtime/browser smoke as applicable
- independent review with no unresolved material findings
- no unsafe production-data mutation during verification
- PR open against `main`
- safe to deploy immediately when Tarek approves merge

## Control commands

Cursor automations use:

- `DEV_ACTION: EXECUTE`
- `DEV_ACTION: STATUS`
- `DEV_ACTION: FIX_FINDINGS`

Tarek does not need to type these commands in normal use. ChatGPT is the operator console and may translate natural-language requests such as “ابدأ”, “شوف”, “صلح المشاكل”, and “اعتمد” into the appropriate GitHub actions.

Cursor agents never merge. ChatGPT may merge only after explicit approval from Tarek in chat.

## Cursor Cloud specific instructions

- Install: `npm ci` using `package-lock.json`. `bun.lock` and `bun.lockb` are not the install path.
- If `.env` is missing, copy `.env.example`. It only contains public API base URLs, not secrets.
- Start: `npm run dev -- --hostname 0.0.0.0 --port 3000`.
- `npm test` is Vitest. `src/components/__tests__/BookingModalI18n.test.tsx` currently has two pre-existing failures (`invariant expected app router to be mounted`). Separate those from new regressions.
- `npm run lint` (`next lint`) fails on Next.js 16 because that subcommand was removed. Treat that as a pre-existing script issue. `npm run build` typechecks.
- Browser smoke may open `/` and `/book`. Do not submit, confirm, cancel, or reschedule a booking.
