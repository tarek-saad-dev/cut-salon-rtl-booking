# CUT Salon Client — Codex-first Control Plane

## Operator model

Tarek talks to ChatGPT in normal language. ChatGPT is the human-facing control console.

GitHub is the durable source of truth. The self-hosted Codex runner performs implementation, review, and finding fixes. Codex never merges and never deploys production.

## Flow

1. ChatGPT creates a scoped GitHub issue.
2. ChatGPT writes an `EXECUTE` command envelope to `codex-control`.
3. GitHub-hosted authorization validates the owner, live issue state, and exact target SHA.
4. The self-hosted CUT Client runner executes Codex without a repository write token.
5. A GitHub-hosted finalizer applies the generated patch, pushes `codex/issue-<number>`, and opens/updates a draft PR.
6. ChatGPT requests `REVIEW` when useful.
7. Codex reviews the exact current PR head independently.
8. If material findings exist, ChatGPT requests `FIX_FINDINGS`.
9. Codex fixes only the latest unresolved findings on the same branch.
10. Review repeats until `READY_FOR_TAREK`.
11. Tarek explicitly says `اعتمد`, `ادمج`, or `نزّل production`.
12. ChatGPT revalidates the exact head/review and merges.
13. Existing `deploy-vps.yml` deploys `main` to cutsaloon.com.
14. ChatGPT reports the deployment result.

## Command transport

Primary machine transport is the dedicated `codex-control` branch.

ChatGPT writes:

```json
{
  "action": "EXECUTE",
  "number": 12,
  "requested_by": "tarek-saad-dev",
  "request_id": "issue-12-execute-1"
}
```

Allowed actions:

- `EXECUTE`
- `REVIEW`
- `FIX_FINDINGS`

The workflow checks out its executable control script from trusted `main`, not from the command branch.

Exact owner comments using `DEV_ACTION: EXECUTE|REVIEW|FIX_FINDINGS` remain a fallback.

## Public repository security

The self-hosted runner must never execute arbitrary fork PR code.

The workflow enforces:

- command actor must be `tarek-saad-dev`
- EXECUTE only on issues authored by `tarek-saad-dev`
- REVIEW/FIX only on same-repository `codex/issue-*` PR branches
- PR base must be `main`
- self-hosted checkout uses `persist-credentials: false`
- Codex child process has GitHub/ACTIONS write-capable tokens removed from its environment
- GitHub mutation occurs only from a GitHub-hosted finalizer
- no automatic merge
- no production dispatch

## Verification gate

The control script uses:

- `npm ci`
- `npm test` when defined
- `npm run typecheck` when defined
- `npm run build` when defined

CUT Client currently has tests/build but no dedicated `typecheck` script, so the generic runner records `TYPECHECK=SKIP` rather than inventing a new project command.

Mutation flows must use tests/mocks/fixtures. Never prove a frontend change by creating/cancelling/rescheduling a real production booking.

## Review output

```text
CODEX_REVIEW

REVIEW_STATUS: PASS | CHANGES_REQUIRED

MATERIAL_FINDINGS:
- ...

NON_BLOCKING_NOTES:
- ...

TEST_EVIDENCE:
...

STATE: REVIEW | READY_FOR_TAREK
NEXT_ACTION: ...
```

`READY_FOR_TAREK` is valid only for the exact reviewed head and only when that head is safe to merge/deploy immediately.

## Fail-closed behavior

The control plane stops without code publication when it detects:

- `USAGE_LIMIT`
- `AUTH`
- `SANDBOX`
- forbidden environment/secrets-file changes
- other Codex execution errors

For builder/fix failures, partial workspace edits are discarded before publication.

## Production approval

```text
Tarek: "اعتمد"
→ ChatGPT re-checks exact PR head + latest review
→ ChatGPT merges
→ push to main
→ deploy-vps.yml
→ production deployment
→ health check
→ ChatGPT reports result
```

A control-plane run can never authorize production deployment by itself.
