import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CUT Salon VPS preflight safe offline contract", () => {
  it("passes read-only source/secret-redaction Node fixtures", () => {
    const r = spawnSync(process.execPath, [
      "--test", path.resolve(process.cwd(), "scripts/cut-vps-readonly-preflight.test.mjs")
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 20_000,
      env: { ...process.env, VPS_SSH_KEY: "NEVER_LOG_THIS_PRODUCTION_KEY" },
    });
    expect(r.status, r.stdout + "\n" + r.stderr).toBe(0);
    expect(r.stdout).not.toContain("NEVER_LOG_THIS_PRODUCTION_KEY");
    expect(r.stderr).not.toContain("NEVER_LOG_THIS_PRODUCTION_KEY");
  });
});
