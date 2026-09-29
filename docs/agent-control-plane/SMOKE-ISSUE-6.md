# CUT Client control-plane smoke marker

- Issue: #6 — CONTROL PLANE SMOKE — CUT Client runner
- Request: `cut-client-smoke-6-20260930`
- Action: `EXECUTE`

This docs-only marker is the implementation artifact for the CUT Client
Codex-on-VPS smoke run. It does not certify completion of the end-to-end flow.
Authorization, runner selection, verification, PR publication, and independent
review evidence belong in the control-plane workflow results and PR.

The GitHub-hosted finalizer publishes `codex/issue-6` and its PR against `main`.
Independent review must pass before `READY_FOR_TAREK`; merge and production
deployment require Tarek's explicit approval. This smoke change does not modify
application code or production booking, customer, loyalty, or business data.
