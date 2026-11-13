# Issue 33 implementation and release notes

Use a server-rendered, branch-labelled public Casher catalog alongside the existing interactive pricing tools. Read only public branches and public service catalog endpoints, with a five-second timeout and five-minute revalidation. Never infer missing prices or use static demo prices. Strip the upstream response to public names and validated prices before passing it to components.

Add a services hub and two distinct guides (haircuts and beard care), supported by the existing public site's haircut/beard positioning. Guide copy explains selection and booking without claiming specific inclusions, techniques or results. Display matching current catalog entries with their branches; explicitly report missing availability. Keep the shared AR/EN context. Use Service schema without invented offers, ratings, addresses or hours.

Implementation sequence: test server catalog failure/branch isolation and server HTML; implement loader and bilingual presentation; add guides/metadata/schema and crawlable internal links; update sitemap assertions; run full tests/build.

PR #32 is absent from this checkout. Link to the existing /#branches section until its verified branch routes are merged. Before final merge, coordinate with #32 and replace these links with its actual canonical branch routes. Do not publish Gleem or Camp street-address claims here. No conflicting branch routes are created.

The GitHub-hosted finalizer must publish the patch on codex/issue-33 and open a draft PR against main. Independent exact-head review is required before READY_FOR_TAREK. This runner must not push, merge or deploy.

## Workspace verification

- `npm test`: 82 files / 492 tests passed, including SSR service/pricing facts, branch isolation, safe API failures, canonicals/sitemap, private noindex and booking cache policy.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- Independent workspace review: no material findings after pricing layout and cache updates. Finalizer still needs independent review of the published exact PR head.
- Installation required `npm ci --ignore-scripts` after esbuild's install-time child process returned EPERM in this runner.
- Default `npm run build` stalled at Turbopack compilation and was interrupted. The webpack build also failed with the generic “Build failed because of webpack errors” message, without diagnostics. Build/release readiness remains unverified; the control workflow must run its clean verification gate before readiness is claimed.
- No production mutation requests or production secrets were used. No browser mutation smoke was performed.
