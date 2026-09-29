#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

usage_pattern='usage limit|rate limit|limit reached|quota|weekly limit|5[- ]hour|credits?.*(remaining|exhausted|limit)|insufficient.*credits|too many requests'
sandbox_pattern='bwrap:|Failed RTM_NEWADDR|runner sandbox|sandbox.*Operation not permitted|Operation not permitted.*sandbox'

write_output() {
  local key="$1"
  local value="$2"
  printf '%s=%s\n' "$key" "$value" >> "$GITHUB_OUTPUT"
}

script_exists() {
  local name="$1"
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts[process.argv[1]] ? 0 : 1)" "$name"
}

authorize() {
  : "${GH_TOKEN:?}"
  : "${REPO:?}"
  : "${ACTOR:?}"
  : "${BODY:?}"
  : "${NUMBER:?}"
  PR_URL="${PR_URL:-}"

  local action=""
  local allowed="false"
  local target_sha=""
  local target_ref=""
  local issue_title=""

  case "$BODY" in
    "DEV_ACTION: EXECUTE") action="EXECUTE" ;;
    "DEV_ACTION: REVIEW") action="REVIEW" ;;
    "DEV_ACTION: FIX_FINDINGS") action="FIX_FINDINGS" ;;
    *) action="" ;;
  esac

  rm -rf control-context
  mkdir -p control-context

  if [[ "$ACTOR" == "tarek-saad-dev" && -n "$action" ]]; then
    if [[ "$action" == "EXECUTE" && -z "$PR_URL" ]]; then
      gh api "repos/$REPO/issues/$NUMBER" > control-context/issue.json

      local issue_author
      issue_author="$(jq -r '.user.login' control-context/issue.json)"
      issue_title="$(jq -r '.title' control-context/issue.json)"

      if [[ "$issue_author" == "tarek-saad-dev" ]]; then
        allowed="true"
        target_ref="codex/issue-$NUMBER"

        if gh api "repos/$REPO/git/ref/heads/$target_ref" > control-context/ref.json 2>/dev/null; then
          target_sha="$(jq -r '.object.sha' control-context/ref.json)"
        else
          target_sha="$(gh api "repos/$REPO/commits/main" --jq '.sha')"
        fi

        {
          printf 'ACTION: EXECUTE\n'
          printf 'ISSUE: #%s\n' "$NUMBER"
          printf 'TITLE: %s\n\n' "$issue_title"
          jq -r '.body // ""' control-context/issue.json
        } > control-context/context.txt
      fi
    elif [[ ( "$action" == "REVIEW" || "$action" == "FIX_FINDINGS" ) && -n "$PR_URL" ]]; then
      gh api "repos/$REPO/pulls/$NUMBER" > control-context/pr.json

      local head_repo head_ref head_sha base_ref
      head_repo="$(jq -r '.head.repo.full_name' control-context/pr.json)"
      head_ref="$(jq -r '.head.ref' control-context/pr.json)"
      head_sha="$(jq -r '.head.sha' control-context/pr.json)"
      base_ref="$(jq -r '.base.ref' control-context/pr.json)"
      issue_title="$(jq -r '.title' control-context/pr.json)"

      if [[ "$head_repo" == "$REPO" && "$head_ref" == codex/issue-* && "$base_ref" == "main" ]]; then
        allowed="true"
        target_ref="$head_ref"
        target_sha="$head_sha"

        gh api "repos/$REPO/issues/$NUMBER/comments?per_page=100" > control-context/comments.json

        {
          printf 'ACTION: %s\n' "$action"
          printf 'PR: #%s\n' "$NUMBER"
          printf 'TITLE: %s\n' "$issue_title"
          printf 'HEAD: %s\n' "$head_sha"
          printf 'BRANCH: %s\n\n' "$head_ref"
          printf 'PR BODY:\n'
          jq -r '.body // ""' control-context/pr.json

          if [[ "$action" == "FIX_FINDINGS" ]]; then
            printf '\n\nLATEST CODEX REVIEW:\n'
            jq -r '[.[] | select((.body // "") | contains("CODEX_REVIEW"))] | last | .body // "No prior CODEX_REVIEW comment was found."' control-context/comments.json
          fi
        } > control-context/context.txt
      fi
    fi
  fi

  write_output allowed "$allowed"
  write_output action "$action"
  write_output target_sha "$target_sha"
  write_output target_ref "$target_ref"
  write_output issue_title "$issue_title"
  write_output target_number "$NUMBER"
}

authorize_control() {
  : "${GH_TOKEN:?}"
  : "${REPO:?}"
  : "${ACTOR:?}"
  : "${COMMAND_FILE:?}"

  local action=""
  local number=""
  local requested_by=""
  local request_id=""
  local allowed="false"
  local target_sha=""
  local target_ref=""
  local issue_title=""

  rm -rf control-context
  mkdir -p control-context

  if [[ "$ACTOR" == "tarek-saad-dev" && -s "$COMMAND_FILE" ]]; then
    action="$(jq -r '.action // ""' "$COMMAND_FILE")"
    number="$(jq -r '.number // ""' "$COMMAND_FILE")"
    requested_by="$(jq -r '.requested_by // ""' "$COMMAND_FILE")"
    request_id="$(jq -r '.request_id // ""' "$COMMAND_FILE")"

    if [[ "$requested_by" == "tarek-saad-dev"       && "$request_id" =~ ^[A-Za-z0-9._:-]{1,128}$       && "$number" =~ ^[1-9][0-9]*$       && ( "$action" == "EXECUTE" || "$action" == "REVIEW" || "$action" == "FIX_FINDINGS" ) ]]; then

      if [[ "$action" == "EXECUTE" ]]; then
        gh api "repos/$REPO/issues/$number" > control-context/issue.json

        local issue_author is_pr
        issue_author="$(jq -r '.user.login' control-context/issue.json)"
        is_pr="$(jq -r 'has("pull_request")' control-context/issue.json)"
        issue_title="$(jq -r '.title' control-context/issue.json)"

        if [[ "$issue_author" == "tarek-saad-dev" && "$is_pr" == "false" ]]; then
          allowed="true"
          target_ref="codex/issue-$number"

          if gh api "repos/$REPO/git/ref/heads/$target_ref" > control-context/ref.json 2>/dev/null; then
            target_sha="$(jq -r '.object.sha' control-context/ref.json)"
          else
            target_sha="$(gh api "repos/$REPO/commits/main" --jq '.sha')"
          fi

          {
            printf 'ACTION: EXECUTE\n'
            printf 'REQUEST_ID: %s\n' "$request_id"
            printf 'ISSUE: #%s\n' "$number"
            printf 'TITLE: %s\n\n' "$issue_title"
            jq -r '.body // ""' control-context/issue.json
          } > control-context/context.txt
        fi
      else
        gh api "repos/$REPO/pulls/$number" > control-context/pr.json

        local head_repo head_ref head_sha base_ref
        head_repo="$(jq -r '.head.repo.full_name' control-context/pr.json)"
        head_ref="$(jq -r '.head.ref' control-context/pr.json)"
        head_sha="$(jq -r '.head.sha' control-context/pr.json)"
        base_ref="$(jq -r '.base.ref' control-context/pr.json)"
        issue_title="$(jq -r '.title' control-context/pr.json)"

        if [[ "$head_repo" == "$REPO" && "$head_ref" == codex/issue-* && "$base_ref" == "main" ]]; then
          allowed="true"
          target_ref="$head_ref"
          target_sha="$head_sha"

          gh api "repos/$REPO/issues/$number/comments?per_page=100" > control-context/comments.json

          {
            printf 'ACTION: %s\n' "$action"
            printf 'REQUEST_ID: %s\n' "$request_id"
            printf 'PR: #%s\n' "$number"
            printf 'TITLE: %s\n' "$issue_title"
            printf 'HEAD: %s\n' "$head_sha"
            printf 'BRANCH: %s\n\n' "$head_ref"
            printf 'PR BODY:\n'
            jq -r '.body // ""' control-context/pr.json

            if [[ "$action" == "FIX_FINDINGS" ]]; then
              printf '\n\nLATEST CODEX REVIEW:\n'
              jq -r '[.[] | select((.body // "") | contains("CODEX_REVIEW"))] | last | .body // "No prior CODEX_REVIEW comment was found."' control-context/comments.json
            fi
          } > control-context/context.txt
        fi
      fi
    fi
  fi

  write_output allowed "$allowed"
  write_output action "$action"
  write_output target_sha "$target_sha"
  write_output target_ref "$target_ref"
  write_output issue_title "$issue_title"
  write_output target_number "$number"
}

is_usage_blocked() {
  local out="$1"
  grep -Eiq "$usage_pattern" "$out/codex-stdout.log" "$out/codex-stderr.log" "$out/codex-result.txt" 2>/dev/null
}

is_sandbox_blocked() {
  local out="$1"
  grep -Eiq "$sandbox_pattern" "$out/codex-stdout.log" "$out/codex-stderr.log" "$out/codex-result.txt" 2>/dev/null
}

mark_blocked() {
  local out="$1"
  local reason="$2"
  printf '%s\n' "$reason" > "$out/blocked-reason.txt"
  printf 'CODEX_BLOCKED=%s\n' "$reason" > "$out/verification.txt"

  if [[ "$reason" == "USAGE_LIMIT" ]]; then
    cat > "$out/codex-result.txt" <<'EOF'
CODEX_BLOCKED: USAGE_LIMIT

No code was published. Retry the same control action after the Codex usage window resets or credits become available.
EOF
  fi
}

run_verification() {
  local out="$1"
  local login_status="$2"

  set +e
  local install_status=99
  npm ci > "$out/npm-install.log" 2>&1
  install_status=$?

  local test_status="SKIP"
  local typecheck_status="SKIP"
  local build_status="SKIP"

  if [[ $install_status -eq 0 ]]; then
    if script_exists test; then
      npm test > "$out/npm-test.log" 2>&1
      test_status=$?
    fi

    if script_exists typecheck; then
      npm run typecheck > "$out/typecheck.log" 2>&1
      typecheck_status=$?
    fi

    if script_exists build; then
      npm run build > "$out/build.log" 2>&1
      build_status=$?
    fi
  fi
  set -e

  {
    printf 'CODEX_LOGIN=%s\n' "$login_status"
    printf 'NPM_INSTALL_MODE=npm ci\n'
    printf 'NPM_INSTALL=%s\n' "$install_status"
    printf 'NPM_TEST=%s\n' "$test_status"
    printf 'TYPECHECK=%s\n' "$typecheck_status"
    printf 'BUILD=%s\n' "$build_status"
  } > "$out/verification.txt"
}

run_codex() {
  : "${CONTROL_ACTION:?}"
  : "${CONTROL_CONTEXT_DIR:?}"
  : "${CODEX_OUTPUT_DIR:?}"

  local out="$CODEX_OUTPUT_DIR"
  local ctx="$CONTROL_CONTEXT_DIR"

  rm -rf "$out"
  mkdir -p "$out"
  : > "$out/codex-stdout.log"
  : > "$out/codex-stderr.log"
  : > "$out/codex-result.txt"

  cp -n .env.example .env.local 2>/dev/null || true

  set +e
  codex login status > "$out/login-status.txt" 2>&1
  local login_status=$?
  set -e

  if [[ $login_status -ne 0 ]]; then
    mark_blocked "$out" "AUTH"
    rm -f .env.local
    return 0
  fi

  local context
  context="$(cat "$ctx/context.txt")"

  if [[ "$CONTROL_ACTION" == "REVIEW" ]]; then
    run_verification "$out" "$login_status"
    local verification
    verification="$(cat "$out/verification.txt")"

    cat > "$out/prompt.txt" <<EOF
Read AGENTS.md and docs/agent-control-plane/CONTROL-PLANE.md first.

Act as the independent reviewer for the exact checked-out PR head.

$context

WORKFLOW VERIFICATION:
$verification

Inspect the actual code and diff against main. Do not edit files. Do not push, merge, deploy, or access production secrets/data.

For CUT Client specifically, verify that no test shortcut created/cancelled/rescheduled a real booking or mutated real customer, loyalty, or business data.

If a verification command failed, do not report READY_FOR_TAREK unless the failure is clearly proven pre-existing and unrelated.

Return exactly this structure:

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
EOF

    set +e
    env -u GITHUB_TOKEN -u GH_TOKEN -u ACTIONS_RUNTIME_TOKEN -u ACTIONS_ID_TOKEN_REQUEST_TOKEN -u ACTIONS_ID_TOKEN_REQUEST_URL       codex exec -s read-only -c 'approval_policy="never"'       -o "$out/codex-result.txt"       "$(cat "$out/prompt.txt")"       > "$out/codex-stdout.log" 2> "$out/codex-stderr.log"
    local codex_status=$?
    set -e

    printf 'CODEX_EXEC=%s\n' "$codex_status" >> "$out/verification.txt"

    if [[ $codex_status -ne 0 ]]; then
      if is_usage_blocked "$out"; then
        mark_blocked "$out" "USAGE_LIMIT"
      elif is_sandbox_blocked "$out"; then
        mark_blocked "$out" "SANDBOX"
      else
        printf 'CODEX_BLOCKED=EXEC_ERROR\n' >> "$out/verification.txt"
        printf 'EXEC_ERROR\n' > "$out/blocked-reason.txt"
      fi
    elif is_sandbox_blocked "$out"; then
      mark_blocked "$out" "SANDBOX"
    fi
  else
    local mode_text="Implement only the originating issue scope."
    if [[ "$CONTROL_ACTION" == "FIX_FINDINGS" ]]; then
      mode_text="Fix only the unresolved MATERIAL_FINDINGS from the latest Codex review. Do not broaden scope."
    fi

    cat > "$out/prompt.txt" <<EOF
Read AGENTS.md and docs/agent-control-plane/CONTROL-PLANE.md first.

$mode_text

$context

Work only in this repository workspace. Do not merge or deploy. Do not use production secrets.

CUT Client production-data rule:
- Never create, cancel, reschedule, or mutate real production bookings.
- Never mutate real customer profiles, loyalty state, or business data.
- Use tests, mocks, fixtures, and non-production-safe local flows for mutation behavior.
- Read-only public API checks are allowed only when safe and necessary.

Make the required code changes. Run targeted checks when useful. The workflow will run the repository verification gate after you finish.

Finish with a concise implementation summary and important verification notes.
EOF

    set +e
    env -u GITHUB_TOKEN -u GH_TOKEN -u ACTIONS_RUNTIME_TOKEN -u ACTIONS_ID_TOKEN_REQUEST_TOKEN -u ACTIONS_ID_TOKEN_REQUEST_URL       codex exec -s workspace-write -c 'approval_policy="never"'       -o "$out/codex-result.txt"       "$(cat "$out/prompt.txt")"       > "$out/codex-stdout.log" 2> "$out/codex-stderr.log"
    local codex_status=$?
    set -e

    if [[ $codex_status -ne 0 ]]; then
      git reset --hard HEAD >/dev/null 2>&1 || true
      git clean -fd >/dev/null 2>&1 || true

      if is_usage_blocked "$out"; then
        mark_blocked "$out" "USAGE_LIMIT"
      elif is_sandbox_blocked "$out"; then
        mark_blocked "$out" "SANDBOX"
      else
        mark_blocked "$out" "EXEC_ERROR"
      fi

      rm -f .env.local
      return 0
    fi

    if is_sandbox_blocked "$out"; then
      git reset --hard HEAD >/dev/null 2>&1 || true
      git clean -fd >/dev/null 2>&1 || true
      mark_blocked "$out" "SANDBOX"
      rm -f .env.local
      return 0
    fi

    run_verification "$out" "$login_status"
    printf 'CODEX_EXEC=%s\n' "$codex_status" >> "$out/verification.txt"

    rm -f .env.local
    git add -N . >/dev/null 2>&1 || true
    git diff --binary HEAD > "$out/agent.patch"

    if git diff --name-only HEAD | grep -E '(^|/)\.env($|\.)' | grep -v -E '(^|/)\.env\.example$' >/dev/null 2>&1; then
      printf 'SECURITY_BLOCKED=1\n' >> "$out/verification.txt"
      : > "$out/agent.patch"
      printf 'SECURITY\n' > "$out/blocked-reason.txt"
    fi
  fi

  rm -f .env.local
}

comment_blocked() {
  local out="$1"
  local reason
  reason="$(cat "$out/blocked-reason.txt")"

  {
    printf 'CODEX_BLOCKED: %s\n\n' "$reason"
    printf 'ACTION: %s\n' "$CONTROL_ACTION"
    printf 'NO_CODE_PUSH: true\n'
    printf 'NO_MERGE: true\n'
    printf 'NO_DEPLOY: true\n\n'

    case "$reason" in
      USAGE_LIMIT) printf 'Codex usage is exhausted or temporarily rate-limited. Retry the same action later.\n\n' ;;
      AUTH) printf 'Codex authentication is unavailable on the self-hosted runner. Re-authenticate codex-agent and retry.\n\n' ;;
      SANDBOX) printf 'The Codex Linux sandbox is unavailable on the self-hosted runner. Repair bubblewrap/AppArmor and retry.\n\n' ;;
      SECURITY) printf 'A forbidden environment/secrets file change was detected. No patch was published.\n\n' ;;
      *) printf 'Codex could not complete this action. Inspect the workflow artifact/logs before retrying.\n\n' ;;
    esac

    printf 'WORKFLOW_VERIFICATION:\n'
    cat "$out/verification.txt" 2>/dev/null || true
  } > "$out/comment.md"

  gh issue comment "$NUMBER" --repo "$REPO" --body-file "$out/comment.md"
}

finalize() {
  : "${GH_TOKEN:?}"
  : "${REPO:?}"
  : "${NUMBER:?}"
  : "${CONTROL_ACTION:?}"
  : "${TARGET_SHA:?}"
  : "${TARGET_REF:?}"
  : "${CODEX_OUTPUT_DIR:?}"

  local out="$CODEX_OUTPUT_DIR"

  if [[ -f "$out/blocked-reason.txt" ]]; then
    comment_blocked "$out"
    return 0
  fi

  if [[ "$CONTROL_ACTION" == "REVIEW" ]]; then
    {
      cat "$out/codex-result.txt"
      printf '\n---\nWORKFLOW_VERIFICATION:\n'
      cat "$out/verification.txt"
      printf '\nReviewed head: `%s`\n' "$TARGET_SHA"
    } > "$out/comment.md"

    gh issue comment "$NUMBER" --repo "$REPO" --body-file "$out/comment.md"
    return 0
  fi

  if [[ ! -s "$out/agent.patch" ]]; then
    {
      printf 'CODEX_RESULT: NO_CHANGES\n\n'
      cat "$out/codex-result.txt"
      printf '\n---\nWORKFLOW_VERIFICATION:\n'
      cat "$out/verification.txt"
    } > "$out/comment.md"

    gh issue comment "$NUMBER" --repo "$REPO" --body-file "$out/comment.md"
    return 0
  fi

  git apply --index --binary "$out/agent.patch"
  git config user.name "codex-agent"
  git config user.email "codex-agent@users.noreply.github.com"

  local commit_message
  if [[ "$CONTROL_ACTION" == "EXECUTE" ]]; then
    commit_message="feat: implement issue #$NUMBER"
  else
    commit_message="fix: address review findings for PR #$NUMBER"
  fi

  git commit -m "$commit_message"
  git push origin "HEAD:refs/heads/$TARGET_REF"

  if [[ "$CONTROL_ACTION" == "EXECUTE" ]]; then
    local pr_url
    local pr_create_status=0
    pr_url="$(gh pr list --repo "$REPO" --state open --head "$TARGET_REF" --json url --jq '.[0].url // empty')"

    if [[ -z "$pr_url" ]]; then
      {
        printf 'Closes #%s\n\n' "$NUMBER"
        printf 'Implemented by the Codex control plane.\n\n'
        printf 'Verification from execution:\n\n~~~text\n'
        cat "$out/verification.txt"
        printf '~~~\n\nCodex summary:\n\n'
        cat "$out/codex-result.txt"
        printf '\n\nDo not merge until independent review reaches READY_FOR_TAREK and Tarek explicitly approves.\n'
      } > "$out/pr-body.md"

      set +e
      pr_url="$(gh pr create         --repo "$REPO"         --draft         --base main         --head "$TARGET_REF"         --title "$ISSUE_TITLE"         --body-file "$out/pr-body.md" 2>"$out/pr-create-error.log")"
      pr_create_status=$?
      set -e
    fi

    if [[ $pr_create_status -eq 0 && -n "$pr_url" ]]; then
      {
        printf 'CODEX_EXECUTION: COMPLETE\n\n'
        printf 'PR: %s\n' "$pr_url"
        printf 'HEAD_BRANCH: `%s`\n' "$TARGET_REF"
        printf 'WORKFLOW_VERIFICATION:\n'
        cat "$out/verification.txt"
        printf '\nCODEX_SUMMARY:\n'
        cat "$out/codex-result.txt"
        printf '\nNEXT_ACTION: DEV_ACTION: REVIEW\n'
      } > "$out/comment.md"
    else
      {
        printf 'CODEX_EXECUTION: BRANCH_READY\n\n'
        printf 'HEAD_BRANCH: `%s`\n' "$TARGET_REF"
        printf 'GitHub Actions could not create the draft PR. ChatGPT should create it through the connected GitHub app.\n'
        printf 'WORKFLOW_VERIFICATION:\n'
        cat "$out/verification.txt"
        printf '\nCODEX_SUMMARY:\n'
        cat "$out/codex-result.txt"
        printf '\nNEXT_ACTION: CHATGPT_CREATE_DRAFT_PR\n'
      } > "$out/comment.md"
    fi

    gh issue comment "$NUMBER" --repo "$REPO" --body-file "$out/comment.md"
  else
    {
      printf 'CODEX_FIX: COMPLETE\n\n'
      printf 'UPDATED_BRANCH: `%s`\n' "$TARGET_REF"
      printf 'WORKFLOW_VERIFICATION:\n'
      cat "$out/verification.txt"
      printf '\nCODEX_SUMMARY:\n'
      cat "$out/codex-result.txt"
      printf '\nNEXT_ACTION: DEV_ACTION: REVIEW\n'
    } > "$out/comment.md"

    gh issue comment "$NUMBER" --repo "$REPO" --body-file "$out/comment.md"
  fi
}

case "$MODE" in
  authorize) authorize ;;
  authorize-control) authorize_control ;;
  run) run_codex ;;
  finalize) finalize ;;
  *)
    echo "Usage: $0 {authorize|authorize-control|run|finalize}" >&2
    exit 2
    ;;
esac
