# Cursor Automations — Legacy / Optional

The primary CUT Client automation path is now the Codex-on-VPS control plane documented in:

- `docs/agent-control-plane/CONTROL-PLANE.md`
- `docs/agent-control-plane/INSTALL.md`
- `docs/agent-control-plane/GOLDEN-TEMPLATE.md`

Cursor Cloud Agents are **not required** for routine EXECUTE / REVIEW / FIX_FINDINGS work.

Cursor remains useful for:

- interactive editing
- autocomplete
- manual debugging
- ad-hoc local investigation

Do not run duplicate Cursor automations in parallel with the Codex control plane for the same GitHub issue/PR, because that can create competing branches, duplicate reviews, and wasted credits.

The old three-automation design is retained only as historical context in Git history.
