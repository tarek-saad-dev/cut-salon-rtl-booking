# CUT Salon Client — Agent Rules

GitHub issues are the source of truth for task scope. Pull requests are the source of truth for implementation, verification, review findings, and release readiness.

Read `docs/agent-control-plane/CONTROL-PLANE.md` before changing code.

## Project

- Repository: `tarek-saad-dev/cut-salon-rtl-booking`
- Base branch: `main`
- Stack: Next.js 16, React 18, TypeScript, Tailwind CSS
- Package manager: npm
- Install: `npm ci`
- Tests: `npm test`
- Build: `npm run build`
- Local runtime: `npm run dev`
- Production: `https://cutsaloon.com`

## Execution guardrails

- One builder branch per issue: `codex/issue-<number>`.
- Implement only the originating issue scope.
- Never commit secrets or credentials.
- Never merge automatically.
- Never dispatch production deployment.
- A human approval from Tarek is required before merge.
- Push/merge to `main` triggers `.github/workflows/deploy-vps.yml` and production deployment.
- Therefore `READY_FOR_TAREK` means safe to merge and safe to deploy immediately.
- Prefer targeted tests while developing. The control workflow also runs the repository verification gate.
- Separate pre-existing failures from regressions.

## Production data safety

This frontend talks to Casher public APIs. Agent verification must not create, cancel, reschedule, or otherwise mutate real production bookings, customer profiles, loyalty state, or other business data.

- Prefer unit/component tests and mocks for mutation flows.
- Local browser smoke must avoid submitting real production mutations.
- Read-only production API requests may be used only when needed and safe.
- Do not treat a successful page load as proof that mutation flows are safe.
- Do not use production secrets on the Codex runner.

## Lifecycle

`PLANNED -> BUILDING -> REVIEW -> FIXING -> REVIEW -> READY_FOR_TAREK -> MERGED`

`READY_FOR_TAREK` requires:
- issue scope complete
- current PR head verified
- tests/build green, or clearly named pre-existing failures
- independent Codex review with no unresolved material findings
- no unsafe production-data mutation during verification
- PR open against `main`
- safe to deploy immediately after explicit approval

## Control model

ChatGPT is the normal operator console. It translates Tarek's natural-language requests into validated command envelopes on the dedicated `codex-control` branch.

Supported actions:

- `EXECUTE`
- `REVIEW`
- `FIX_FINDINGS`

Exact owner comments remain a manual fallback:

- `DEV_ACTION: EXECUTE`
- `DEV_ACTION: REVIEW`
- `DEV_ACTION: FIX_FINDINGS`

A push to `codex-control` must never deploy production. Routine status checks are handled by ChatGPT from GitHub without spending a Codex run.

## Trust boundary

The self-hosted Codex job must not receive repository write credentials.

Codex may:
- read the authorized issue/PR context
- edit the isolated workspace for EXECUTE/FIX
- inspect the exact PR head for REVIEW
- run safe local verification
- emit a patch/result artifact

Codex must not:
- push directly
- merge
- deploy
- access production secrets
- mutate real production business data

GitHub writes happen only in the GitHub-hosted finalizer job.

Cursor Cloud Agents are not required for routine execution, review, or fixes in this control plane.
