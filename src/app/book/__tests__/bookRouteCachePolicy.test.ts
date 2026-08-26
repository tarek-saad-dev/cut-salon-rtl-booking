import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("book route cache policy", () => {
  it("forces dynamic book entry so branch enable/disable is not frozen for a year", () => {
    const page = readFileSync(join(process.cwd(), "src/app/book/page.tsx"), "utf8");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).toContain("export const revalidate = 0");

    const cfg = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(cfg).toContain('source: "/book"');
    expect(cfg).toContain("private, no-store, max-age=0, must-revalidate");
  });
});
