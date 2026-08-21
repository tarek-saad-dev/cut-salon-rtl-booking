import { describe, expect, it } from "vitest";
import { landingCopy } from "@/lib/i18n/landing";
import { tx } from "@/lib/i18n/tx";

function assertLocalized(value: unknown, path: string): void {
  if (value && typeof value === "object" && "ar" in value && "en" in value) {
    const entry = value as { ar: string; en: string };
    expect(entry.ar.trim().length, `${path}.ar`).toBeGreaterThan(0);
    expect(entry.en.trim().length, `${path}.en`).toBeGreaterThan(0);
    expect(tx(entry, "ar")).toBe(entry.ar);
    expect(tx(entry, "en")).toBe(entry.en);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertLocalized(item, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assertLocalized(child, `${path}.${key}`);
    }
  }
}

describe("landing i18n", () => {
  it("has non-empty Arabic and English for every landing string", () => {
    assertLocalized(landingCopy, "landingCopy");
  });
});
