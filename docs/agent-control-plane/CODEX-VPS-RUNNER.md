# CUT Client — VPS Runner Setup

The repository control plane expects a repository-level self-hosted runner with these labels:

```text
self-hosted
codex
cut-client
```

The runner service should execute as Linux user `codex-agent` so it reuses the already-authenticated Codex CLI state in `/home/codex-agent/.codex`.

## One-time registration

In GitHub:

`Repository → Settings → Actions → Runners → New self-hosted runner`

Choose Linux x64 and copy the current registration command/token shown by GitHub.

On the VPS:

```bash
sudo -u codex-agent -H bash
mkdir -p /home/codex-agent/runners/cut-client
cd /home/codex-agent/runners/cut-client
```

Download/extract the runner version GitHub currently provides, then configure it with the repository URL and the one-time token:

```bash
./config.sh \
  --url https://github.com/tarek-saad-dev/cut-salon-rtl-booking \
  --token <ONE_TIME_GITHUB_RUNNER_TOKEN> \
  --name codex-cut-client \
  --labels codex,cut-client \
  --work _work \
  --unattended
```

Install/start the service using the generated service helper as root, while keeping the runner process user as `codex-agent`.

After registration, GitHub should show:

```text
codex-cut-client
Status: Idle
Labels: self-hosted, Linux, X64, codex, cut-client
```

## Runtime checks

Under `codex-agent`:

```bash
codex login status
command -v bwrap
bwrap --version
node --version
npm --version
```

Expected Codex status:

```text
Logged in using ChatGPT
```

## Secrets

Do not add production booking/customer secrets to this runner.

The control plane uses `.env.example` only for local build/test context and explicitly forbids real production mutations.

## Smoke

After the control-plane PR is merged and the runner is Idle:

1. create `codex-control` from current `main`;
2. create a docs-only smoke issue;
3. send `EXECUTE`;
4. verify the `codex-cut-client` runner receives it;
5. verify no production deployment occurs;
6. review the generated PR through Codex;
7. close/merge only with explicit Tarek approval.
