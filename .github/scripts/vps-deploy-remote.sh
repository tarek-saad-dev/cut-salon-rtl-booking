#!/usr/bin/env bash
set -euo pipefail

SCRIPT=/usr/local/sbin/deploy-cutclient
REPO="${VPS_CLIENT_REPO:-}"

if [ -z "$REPO" ] && [ -f "$SCRIPT" ]; then
  REPO="$(
    grep -E '^(REPO|REPO_DIR|APP_DIR|GIT_DIR)=' "$SCRIPT" 2>/dev/null \
      | head -1 \
      | cut -d= -f2- \
      | tr -d "'\" " \
      || true
  )"
fi

if [ -z "$REPO" ] && [ -f "$SCRIPT" ]; then
  REPO="$(
    grep -Eo 'cd [^ ;]+' "$SCRIPT" 2>/dev/null \
      | head -1 \
      | awk '{print $2}' \
      | tr -d "'\"" \
      || true
  )"
fi

if [ -n "$REPO" ] && [ -d "$REPO/.git" ]; then
  echo "Resetting repository at $REPO"
  git -C "$REPO" status --short || true
  git -C "$REPO" reset --hard HEAD
  git -C "$REPO" clean -fd
else
  echo "WARN: Could not resolve client repo path; deploy may fail if repo is dirty"
fi

exec "$SCRIPT"
