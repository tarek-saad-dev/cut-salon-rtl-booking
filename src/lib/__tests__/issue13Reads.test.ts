import { afterEach, expect, it, vi } from "vitest";
import { _resetBaseUrlCache } from "../booking-api/env";
import { buildCasherPublicApiUrl } from "../casherPublicApiUrl";
import { getUpcomingBookings } from "../booking-api/booking";
import { getServiceCatalog } from "../serviceCatalogApi";
import { getClientProfile } from "../publicBookingApi";
afterEach(() => { _resetBaseUrlCache(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function setup(body: unknown) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://ops.example.com");
  const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
it("uses the configured public origin in production", () => {
  setup({});
  expect(buildCasherPublicApiUrl("/api/services/catalog")).toBe("https://ops.example.com/api/services/catalog");
});
it("sends branch as tenant identity for cross-branch upcoming reads", async () => {
  const fetcher = setup({ ok: true, bookings: [] });
  await getUpcomingBookings("01012345678", { branchCode: " PUBLIC A " });
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ phone: "01012345678", branchCode: "PUBLIC A" });
});
it("rejects malformed upcoming success instead of inventing an empty list", async () => {
  setup({ ok: true });
  await expect(getUpcomingBookings("01012345678")).rejects.toThrow();
});
it("rejects missing catalog tenant before sending a request", async () => {
  const fetcher = setup({ ok: true, categories: [] });
  await expect(getServiceCatalog()).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("rejects malformed catalog success", async () => {
  setup({ ok: true });
  await expect(getServiceCatalog("PUBLIC A")).rejects.toThrow();
});
it("does not turn a missing profile into successful empty data", async () => {
  setup({ ok: true });
  expect((await getClientProfile("01012345678")).ok).toBe(false);
});
it("preserves bookings from every returned branch within the resolved tenant", async () => {
  setup({ ok: true, bookings: [
    { code: "BK-A", branch: { branchCode: "PUBLIC A" }, calendarDate: "2026-10-13", time: "12:00" },
    { code: "BK-B", branch: { branchCode: "PUBLIC B" }, calendarDate: "2026-10-13", time: "13:00" },
  ] });
  const result = await getUpcomingBookings("01012345678", { branchCode: "PUBLIC A" });
  expect(result.data.map(booking => booking.branchCode)).toEqual(["PUBLIC A", "PUBLIC B"]);
});
it("retains server-controlled CUT compatibility without inventing a tenant", async () => {
  const fetcher = setup({ ok: true, bookings: [] });
  await getUpcomingBookings("01012345678");
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).not.toHaveProperty("branchCode");
});
it("does not retry tenant failures against a fallback branch", async () => {
  const fetcher = setup({});
  fetcher.mockImplementation(async () => new Response(JSON.stringify({ ok: false, error: { code: "BRANCH_REQUIRED" } }), { status: 400 }));
  await expect(getUpcomingBookings("01012345678", { branchCode: "PUBLIC A" })).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("handles missing profile origin as a failed read", async () => {
  vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "");
  expect((await getClientProfile("01012345678")).ok).toBe(false);
});
