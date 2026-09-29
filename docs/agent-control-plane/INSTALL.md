# Install the Codex Control Plane on Another Repository

This is the reusable onboarding sequence proven first on Zalina and then adapted for CUT Client.

## Shared VPS prerequisites

One VPS may host multiple repository-level GitHub runner instances under the same Linux user, for example `codex-agent`.

Shared once per VPS:

- Codex CLI installed
- `codex login` completed under `codex-agent`
- bubblewrap/AppArmor working for Codex sandboxing
- Node/runtime tooling required by the projects

Do not share one repository-level runner registration across repositories. Create a separate runner instance/working directory per repository.

Example layout:

```text
/home/codex-agent/runners/
  zalina/
  cut-client/
  drvowa/
  whatsapp-bot/
  casher/
```

## Repository files

Every project gets:

```text
AGENTS.md
docs/agent-control-plane/CONTROL-PLANE.md
docs/agent-control-plane/GOLDEN-TEMPLATE.md
.github/scripts/codex-control.sh
.github/workflows/codex-control.yml
```

Keep the production deployment workflow separate when possible.

## Repository-specific configuration

Adapt only:

- repository name
- package manager/install command
- test/typecheck/build commands
- runner label
- production-data guardrails
- merge/deploy semantics
- optional migration control plane for projects with databases

## Runner labels

Use:

```text
self-hosted
codex
<repo-label>
```

Examples:

- `zalina`
- `cut-client`
- `drvowa`
- `whatsapp-bot`
- `casher`

## Command branch

After the control-plane PR is merged, create `codex-control` from the trusted current `main`.

ChatGPT writes `.github/codex-command.json` on that branch. A push to this branch must never deploy production.

## Smoke test

First task on every newly onboarded repo should be a docs-only issue.

Acceptance:

- ChatGPT command reaches GitHub Actions
- authorization passes
- correct self-hosted runner picks up the job
- Codex edits only the requested smoke file
- repository verification runs
- GitHub-hosted finalizer publishes branch/PR
- independent Codex review reaches PASS
- no production deployment occurs before explicit approval

## Database projects

If the project owns a production database, add a separate migration control plane rather than giving Codex production DB credentials.

Pattern:

```text
migration code
→ read-only production PLAN
→ exact SHA + manifest/checksum + pending set
→ explicit Tarek migration approval
→ trusted non-AI APPLY executor
→ post-verify
→ separate application merge approval
```

Migration approval and application merge approval must remain separate.
