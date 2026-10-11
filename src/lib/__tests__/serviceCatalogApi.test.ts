import { afterEach, expect, it, vi } from "vitest";
import { _resetBaseUrlCache } from "../booking-api/env";
import { getServiceCatalog } from "../serviceCatalogApi";

afterEach(() => {
  _resetBaseUrlCache();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("scopes the public service catalog to the resolved branch tenant", async () => {
  vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://ops.example.com");

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, categories: [] }),
  });
  vi.stubGlobal("fetch", fetchMock);

  await getServiceCatalog(" PUBLIC A ");

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [rawUrl, init] = fetchMock.mock.calls[0];
  const url = new URL(String(rawUrl));

  expect(url.pathname).toBe("/api/services/catalog");
  expect(url.searchParams.get("type")).toBe("serv");
  expect(url.searchParams.get("branchCode")).toBe("PUBLIC A");
  expect(init).toEqual({ cache: "no-store" });
});
