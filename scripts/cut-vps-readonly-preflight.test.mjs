import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { evaluateReadiness } from "./cut-vps-readonly-preflight.mjs";

const inputs = () => ({
  layoutSource: "import { Alexandria } from 'next/font/google'; const alexandria = Alexandria({ subsets: ['arabic'] });",
  packageManifest: { dependencies: { next: "^16.2.4" } },
  packageLock: { lockfileVersion: 3, packages: { "node_modules/next": { version: "16.2.4" } } },
  deployWorkflow: "on:\n  push:\n    branches:\n      - main\n",
  runtimeVersion: "v22.17.0",
});

test("flags known baseline font loader and forbids release authorization", () => {
  const r = evaluateReadiness(inputs());
  assert.equal(r.sourceChecks.buildTimeAlexandriaGoogleLoader, true);
  assert.equal(r.sourceChecks.lockedNextVersion, "16.2.4");
  assert.equal(r.sourceChecks.mainPushTriggersDeploy, true);
  assert.equal(r.prodDeploySafe, false);
  assert.ok(r.blockers.some(x => x.includes("Alexandria")));
});

test("removing build-time font loader does NOT prove VPS release ready", () => {
  const r = evaluateReadiness({ ...inputs(), layoutSource: "import localFont from 'next/font/local';" });
  assert.equal(r.sourceChecks.buildTimeAlexandriaGoogleLoader, false);
  assert.equal(r.prodDeploySafe, false);
  assert.ok(r.unknowns.some(x => x.includes("rollback")));
});

test("missing data fails closed; never fabricates a deployed revision", () => {
  const r = evaluateReadiness({
    layoutSource: null, packageManifest: null, packageLock: null,
    deployWorkflow: null, runtimeVersion: undefined,
  });
  assert.equal(r.prodDeploySafe, false);
  assert.equal(r.sourceChecks.buildTimeAlexandriaGoogleLoader, "unknown");
  assert.equal(r.sourceChecks.mainPushTriggersDeploy, "unknown");
  assert.ok(r.blockers[0].includes("Missing"));
});

test("untrusted input snippets never leak into JSON output", () => {
  const secret = "DO_NOT_EXPOSE_THIS_IN_A_REPORT_2026";
  const inp = inputs();
  const r = evaluateReadiness({
    ...inp,
    layoutSource: inp.layoutSource + "\n// " + secret,
    packageManifest: { ...inp.packageManifest, randomSecret: secret },
    deployWorkflow: inp.deployWorkflow + "\n# " + secret,
  });
  const json = JSON.stringify(r);
  assert.ok(!json.includes(secret));
  assert.ok(!json.includes("VPS_HOST="));
  assert.ok(!json.includes("DRVO_STAGING_DB_PASSWORD="));
});

test("read-only CLI returns sanitized report without environment values", () => {
  const output = execFileSync(process.execPath, [
    new URL("./cut-vps-readonly-preflight.mjs", import.meta.url).pathname, "--json",
  ], {
    encoding: "utf8",
    env: { ...process.env, VPS_SSH_KEY: "NEVER_LOG_THIS_PRODUCTION_KEY" },
  });
  const r = JSON.parse(output);
  assert.equal(r.prodDeploySafe, false);
  assert.equal(r.scope, "SOURCE_ONLY_NON_PRODUCTION");
  assert.equal(typeof r.checksums.packageLockSha256, "string");
  assert.equal(r.checksums.packageLockSha256.length, 64);
  assert.ok(!output.includes("NEVER_LOG_THIS_PRODUCTION_KEY"));
});
