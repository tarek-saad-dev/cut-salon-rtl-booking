import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression gate for the November VPS failure. This checks source shape,
 * not VPS runtime build/rollback safety.
 */
describe("VPS Alexandria build-time font regression (#26)", () => {
  const layout = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

  it("does not import or invoke the Google Alexandria Next font compiler", () => {
    expect(layout).not.toMatch(/from\s+["']next\/font\/google["']/);
    expect(layout).not.toMatch(/\bAlexandria\s*\(/);
    expect(layout).not.toContain("alexandria.variable");
  });

  it("keeps the local display font with a safe UI fallback", () => {
    expect(layout).toContain('from "next/font/local"');
    expect(layout).toContain("laxr.variable");
    expect(css).toContain('--font-alexandria: "Alexandria", sans-serif');
    expect(css).toMatch(/--font-ui:\s*var\(--font-alexandria\)/);
    expect(css).toContain("font-display: swap");
  });

  it("does not change release semantics: source checks never imply deployed VPS safety", () => {
    const deploy = readFileSync(resolve(process.cwd(), ".github/workflows/deploy-vps.yml"), "utf8");
    expect(deploy).toContain("deploy-cutclient");
    expect(deploy).toContain("main");
  });
});
