import { afterEach, expect, it, vi } from "vitest";
import { loadPublicServiceCatalog } from "@/lib/publicServiceCatalog";
vi.mock("@/lib/casherPublicApiUrl", () => ({ buildCasherPublicApiUrl: (path: string) => `https://public.example${path}` }));
afterEach(() => vi.unstubAllGlobals());
it("keeps branch-specific prices and strips unrelated fields", async () => {
  const fetcher = vi.fn(async (url: string) => new Response(JSON.stringify(url.includes("/branches")
    ? { ok: true, branches: [{ branchCode: "A", branchName: "First" }, { branchCode: "B", branchName: "Second" }] }
    : { ok: true, categories: [{ services: [{ id: 1, nameAr: "قص شعر", nameEn: "Haircut", price: url.includes("branchCode=A") ? 123 : 456, isActive: true, privateField: "secret" }, { id: 2, nameEn: "Missing price", isActive: true }] }] })));
  vi.stubGlobal("fetch", fetcher);
  const result = await loadPublicServiceCatalog();
  expect(result.map(b => b.services[0].price)).toEqual([123, 456]);
  expect(result[0].services).toHaveLength(1);
  expect(JSON.stringify(result)).not.toContain("secret");
  expect(fetcher.mock.calls[1][0]).toContain("type=serv&branchCode=A");
});
it("returns a safe unavailable state on branch discovery failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sensitive upstream details")));
  expect(await loadPublicServiceCatalog()).toEqual([]);
});
it("isolates a failed branch without fabricated prices", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("/branches")) return new Response(JSON.stringify({ ok: true, branches: [{ branchCode: "A", branchName: "First" }] }));
    return new Response("private diagnostic", { status: 500 });
  }));
  expect(await loadPublicServiceCatalog()).toEqual([{ code: "A", name: "First", services: [], available: false }]);
});
