import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/app/client/page.tsx"), "utf8");
const executable = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("CUT CLUB 2.0 legacy /client phone login retirement (#52)", () => {
  it("replaces phone-only login with truthful public noindex maintenance", () => {
    expect(executable).not.toMatch(/^\s*["']use client["'];/m);
    expect(executable).toContain("LegacyClientLoginRetirementPage");
    expect(executable).toContain("robots: { index: false, follow: false }");
    expect(executable).toContain("متوقفين مؤقتًا");
  });

  it("does not perform phone lookup, profile update, redirects or store client identity", () => {
    for (const forbidden of [
      "lookupClientByMobile", "updateClientProfile", "getSavedClient",
      "saveClient", "clearClient", "clientId", "useSearchParams",
      "redirectUrl", "router.push", "localStorage", "sessionStorage",
      "fetch(", "XMLHttpRequest", "api/public/client", "onSubmit", "onClick",
    ]) {
      expect(executable, `Prohibited unverified client operation: ${forbidden}`).not.toContain(forbidden);
    }
    expect(executable).not.toMatch(/<form\b|<input\b|<button\b/);
  });

  it("keeps guest booking and the homepage reachable without fake /club login", () => {
    expect(executable).toContain('href="/book"');
    expect(executable).toContain('href="/"');
    expect(executable).not.toContain('href="/club"');
  });
});
