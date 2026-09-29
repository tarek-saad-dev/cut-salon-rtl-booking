# Golden Template — ChatGPT + GitHub + Codex VPS

## Architecture

```text
Tarek
  ↓
ChatGPT — operator / planning / final approval
  ↓
GitHub — issues, PRs, audit, command transport
  ↓
GitHub-hosted authorize
  ↓
Self-hosted repo runner on VPS
  ↓
Codex CLI — implementation / fix / independent review
  ↓
artifact/patch only
  ↓
GitHub-hosted finalizer
  ↓
PR
  ↓
Tarek approval
  ↓
ChatGPT merge
  ↓
existing production deployment
```

## Non-negotiable invariants

1. Codex never merges.
2. Codex never deploys.
3. Codex gets no repository write token.
4. Production secrets do not live on the Codex runner.
5. Public repositories never run arbitrary fork PR code on self-hosted runners.
6. Status inspection should not consume a Codex run.
7. A `codex-control` push never deploys production.
8. Final merge requires explicit Tarek approval in ChatGPT.
9. Project-specific real-world mutation rules belong in `AGENTS.md`.
10. Database migrations use a separate trusted migration executor.

## Lifecycle

```text
PLANNED
→ BUILDING
→ REVIEW
→ FIXING
→ REVIEW
→ READY_FOR_TAREK
→ MERGED
→ PRODUCTION_VERIFIED
```

For DB-owning projects:

```text
... REVIEW
→ MIGRATION_PLAN
→ READY_FOR_MIGRATION_APPROVAL
→ MIGRATION_APPLIED
→ READY_FOR_TAREK
→ MERGED
```

## Per-repo runner model

Prefer one VPS + one Codex login + multiple repository runner instances.

This provides isolation while avoiding duplicate VPS cost.

## Verification policy

The reusable script should discover project scripts instead of assuming every repository has the same commands.

Typical Node project:

- deterministic install from lockfile
- test if defined
- typecheck if defined
- build if defined

Repository-specific runtime/browser smoke belongs in the task evidence when relevant.

## Failure policy

Fail closed on:

- exhausted Codex usage
- missing Codex auth
- unavailable Linux sandbox
- unauthorized command actor
- changed/invalid target branch or SHA
- forbidden secret/environment edits
- unsafe production mutation evidence

No failure path may silently publish partial work.

## Cursor role

Cursor remains useful as an editor, autocomplete surface, and manual debugger. Routine long-running builder/reviewer/fix work belongs to Codex VPS so Cursor Cloud Agent credits are not the primary execution budget.
