# CUT Salon Client Control Plane

## Purpose

This repository uses a small control plane so Tarek can operate development from ChatGPT while Cursor Cloud Agents perform implementation, independent review, and review fixes.

GitHub remains the durable source of truth.

## Roles

### ChatGPT — operator console

ChatGPT may:
- create GitHub issues from Tarek's natural-language requests
- trigger Cursor automations by posting exact control comments
- inspect issues, PRs, review comments, commits, and GitHub Actions
- request fixes when review finds material issues
- report status back to Tarek
- merge a PR only after Tarek explicitly approves production in chat
- inspect the resulting production deployment and report the outcome

ChatGPT must not merge merely because a reviewer reports PASS.

### Command Router — builder

Triggered by issue comments.

`DEV_ACTION: EXECUTE`
- read the issue and repository rules
- create one task branch from current `main`
- implement only the issue scope
- run targeted tests and required verification
- open/update one PR against `main`
- report evidence
- never merge
- never deploy production

`DEV_ACTION: STATUS`
- inspect the issue and linked PR
- report status only
- do not change code

### PR Review Gate — independent reviewer

Triggered when a PR is opened and when new commits are pushed.

It:
- reviews the actual diff and issue scope
- checks tests/evidence and production-data safety
- reports `PASS` or `CHANGES_REQUIRED`
- never edits code
- never pushes
- never merges
- never deploys

### Fix Agent

Triggered by a top-level PR comment:

`DEV_ACTION: FIX_FINDINGS`

It:
- fixes only the latest material review findings
- works on the same task branch
- reruns targeted verification
- pushes the fix
- lets the Review Gate review the new commit
- never merges or deploys

## Lifecycle

`PLANNED -> BUILDING -> REVIEW -> FIXING -> REVIEW -> READY_FOR_TAREK -> MERGED`

### READY_FOR_TAREK

Use this state only when all are true:

- requested scope is complete
- targeted tests pass, or pre-existing failures are clearly identified
- `npm run build` passes when relevant
- runtime/browser smoke passes when relevant
- no production business-data mutation was used as a test shortcut
- latest independent review has no material findings
- PR is open against `main`
- the current PR head is safe to deploy immediately

## Production approval

Current deployment semantics:

```
Tarek says "اعتمد" in ChatGPT
        ↓
ChatGPT re-checks current PR head + latest review
        ↓
ChatGPT merges the PR
        ↓
push to main
        ↓
.github/workflows/deploy-vps.yml
        ↓
production deploy to cutsaloon.com
        ↓
ChatGPT reads GitHub Actions result
```

Cursor agents must never perform the merge.

## Status format

Before merge:

```
STATE: PLANNED / BUILDING / REVIEW / FIXING / READY_FOR_TAREK
CURRENT_PR:
HEAD_SHA:
TESTS:
BUILD:
SMOKE:
REVIEW_STATUS:
BLOCKERS:
NEXT_ACTION:
```

After merge:

```
STATE: MERGED
MERGE_SHA:
PRODUCTION_DEPLOY: SUCCESS / FAILURE / IN_PROGRESS / UNKNOWN
PRODUCTION_RUN:
```

## Testing policy

Normal default:

1. targeted Vitest tests around changed behavior
2. `npm run build` for production-impacting changes
3. local browser/runtime smoke for changed UI flows

Because the app points at Casher APIs, mutation flows must use mocks or non-production-safe fixtures. Never create/cancel/reschedule a real customer booking simply to prove a frontend change.

## Future preview phase

A later task may introduce a dev/preview deployment before production approval. Until then, human approval in ChatGPT authorizes merge directly to production.
