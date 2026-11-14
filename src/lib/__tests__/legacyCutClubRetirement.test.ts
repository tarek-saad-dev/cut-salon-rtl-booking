import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routeSource = readFileSync(
  resolve(process.cwd(), "src/app/client/loyalty/page.tsx"),
  "utf8",
);

describe("CUT CLUB 2.0: legacy /client/loyalty retirement (#50)", () => {
  it("is a server page with public maintenance copy instead of legacy member data", () => {
    expect(routeSource).not.toMatch(/^\s*["']use client["'];/m);
    expect(routeSource).toContain("export default function LegacyCutClubMaintenancePage");
    expect(routeSource).toContain('robots: { index: false, follow: false }');
    expect(routeSource).toContain("CUT CLUB 2.0");
    expect(routeSource).toContain("متوقفين مؤقتًا");
  });

  it("cannot identify customers from query strings, local storage, or personal APIs", () => {
    const prohibited = [
      "useSearchParams", "searchParams", "clientId",
      "getSavedClient", "localStorage", "sessionStorage",
      "fetch(", "XMLHttpRequest", "buildCasherPublicApiUrl",
      "fetchStore", "fetchClientInventory", "loyalty/me",
      "client/profile", "client/inventory",
      "WalletCard", "CompactMembershipCard", "MyInventory",
    ];
    // A comment documents why clientId is forbidden; test executable source
    // by removing comments before checking the forbidden identifiers.
    const executable = routeSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const token of prohibited) {
      expect(executable, `Legacy page must not contain ${token}`).not.toContain(token);
    }
  });

  it("renders no legacy financial controls and preserves public booking", () => {
    expect(routeSource).toContain('href="/book"');
    expect(routeSource).toContain('href="/"');
    expect(routeSource).not.toContain('href="/club"');
    const executable = routeSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(executable).not.toMatch(/<button\b/);
    expect(executable).not.toMatch(/onClick\s*=/);
    expect(executable).not.toMatch(/<form\b/);
    expect(executable).not.toContain("redeemClientReward");
    expect(executable).not.toContain("purchaseStoreItem");
    expect(executable).not.toContain("openMysteryBox");
  });
});
