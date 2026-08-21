import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Reject Framer Motion SVG `d` morphing that floods the console with invalid paths. */
const FORBIDDEN_D_MORPH = /animate=\{\{\s*d\s*:/;

const STICKY_PATHS = [
  "M24 17v20",
  "M24 26c-7-2-11 2-14 8",
  "M24 26c7-2 11 2 14 8",
  "M24 37c-5 6-7 14-6 20",
  "M24 37c5 6 7 14 6 20",
] as const;

function assertValidPathD(d: string): void {
  expect(d.trim().length).toBeGreaterThan(0);
  expect(d).not.toMatch(/NaN|undefined|null|Infinity/i);
  // Must start with a move command
  expect(d.trim()[0]?.toUpperCase()).toBe("M");
  // All numeric tokens must be finite
  for (const token of d.match(/-?\d*\.?\d+/g) ?? []) {
    expect(Number.isFinite(Number(token))).toBe(true);
  }
}

describe("BookTimeWaiting StickyMan SVG paths", () => {
  it("does not morph path `d` via motion animate (root cause of console spam)", () => {
    const file = path.resolve(__dirname, "../BookTimeWaiting.tsx");
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(FORBIDDEN_D_MORPH);
    expect(src).not.toMatch(/<motion\.path[\s\S]*?animate=\{\{[^}]*\bd\s*:/);
  });

  it("keeps sticky limb path strings valid and finite", () => {
    for (const d of STICKY_PATHS) {
      assertValidPathD(d);
    }
  });
});
