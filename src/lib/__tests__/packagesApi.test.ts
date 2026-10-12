import { _resetBaseUrlCache } from "../booking-api/env";
import { afterEach, expect, it, vi } from "vitest";
import { getPackageById, getPackages, getGroomExperience } from "../packagesApi";
afterEach(() => { _resetBaseUrlCache(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("scopes detail and both package catalogs to the public branch", async () => {
  vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://ops.example.com");
  const pack = { packageId: 2, kind: "groom", price: 1500, includes: [] };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, package: pack, groom: [pack], regular: [] }) });
  vi.stubGlobal("fetch", fetchMock);
  await getPackageById(2, "PUBLIC A");
  await getPackages("regular", "PUBLIC A");
  await getGroomExperience("PUBLIC A");
  const urls = fetchMock.mock.calls.map(([url]) => new URL(url, "https://test.local"));
  expect(urls.map(url => url.searchParams.get("branchCode"))).toEqual(["PUBLIC A", "PUBLIC A", "PUBLIC A"]);
  expect(urls[0].pathname).toBe("/api/public/client/packages/2");
  expect(urls[1].searchParams.get("kind")).toBe("regular");
  expect(urls[2].searchParams.get("kind")).toBe("groom");
});
