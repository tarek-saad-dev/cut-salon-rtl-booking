# Install This Control Plane on Another Project

The minimal model is intentionally small.

## One-time setup

1. Add an `AGENTS.md` describing:
   - project commands
   - test/build/runtime rules
   - production/staging safety
   - what merge means for deployment

2. Add a short control-plane document defining:
   - lifecycle
   - READY_FOR_TAREK gate
   - human production approval
   - status format

3. Create one Cursor Cloud Environment for the repository.
   - Install dependencies with the project's normal package-manager command.
   - Add only the runtime secrets required for safe development/testing.
   - Do not add production mutation credentials unless the workflow explicitly needs them and has a safe gate.

4. Create three Cursor automations:
   - Command Router
   - PR Review Gate
   - Fix Agent

5. Use GitHub issue = task scope and PR = implementation/review evidence.

## Generic commands

For repositories other than legacy DRVO/Casher control planes:

- `DEV_ACTION: EXECUTE`
- `DEV_ACTION: STATUS`
- `DEV_ACTION: FIX_FINDINGS`

These commands are primarily machine-to-machine controls. Tarek can normally speak to ChatGPT in natural language.

## Daily operation

Example:

Tarek:
`ظبط عرض الخدمات في الموبايل وخلي الأكثر طلبًا أوضح`

ChatGPT:
- creates a scoped issue
- posts `DEV_ACTION: EXECUTE`
- watches the PR/review loop

Tarek:
`شوف`

ChatGPT:
- inspects current issue/PR/review state
- triggers a safe non-production next action when already authorized, such as `FIX_FINDINGS`

When ready, ChatGPT says the release is ready and asks for approval.

Tarek:
`اعتمد`

ChatGPT:
- rechecks the current PR head and latest review
- merges through GitHub
- monitors the deployment triggered by the repository's configured production workflow
- reports success/failure

## Deployment models

A project can use either:

### Merge -> Production

Human approval in ChatGPT authorizes merge, and main deploys production automatically.

### Preview -> Production

A future/advanced setup may deploy the PR to preview first. Human approval then promotes/merges to production.

The operator flow in ChatGPT stays the same either way.
