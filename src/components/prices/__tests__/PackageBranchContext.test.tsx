import { _resetBaseUrlCache } from "@/lib/booking-api/env";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import PricesClient from "../PricesClient";

const branch = vi.hoisted(() => ({ selectedBranch: { branchCode: "PUBLIC_A" } }));
vi.mock("@/context/BranchContext", () => ({ useBranch: () => branch }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ lang: "en" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/serviceCatalogApi", () => ({ getServiceCatalog: async () => [] }));
afterEach(() => { _resetBaseUrlCache(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("scopes regular and groom catalog requests and refetches both after branch selection changes", async () => {
  vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://ops.example.com");
  branch.selectedBranch = { branchCode: "PUBLIC_A" };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, regular: [], groom: [] }) });
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = () => <QueryClientProvider client={client}><PricesClient /></QueryClientProvider>;
  const { rerender } = render(page());
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  branch.selectedBranch = { branchCode: "PUBLIC_B" };
  rerender(page());
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  const urls = fetchMock.mock.calls.map(([url]) => new URL(url, "https://test.local"));
  for (const code of ["PUBLIC_A", "PUBLIC_B"]) {
    expect(urls.filter(url => url.searchParams.get("branchCode") === code)
      .map(url => url.searchParams.get("kind")).sort()).toEqual(["groom", "regular"]);
  }
});
