import { _resetBaseUrlCache } from "@/lib/booking-api/env";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useBookO2Session } from "../useBookO2Session";

const route = vi.hoisted(() => ({ params: new URLSearchParams(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => route, useSearchParams: () => route.params }));
vi.mock("@/hooks/bookingFlowV2Support", async (importOriginal) => ({
  ...await importOriginal<object>(),
  ensureBookingV2Bootstrap: () => new Promise(() => {}),
}));
afterEach(() => { _resetBaseUrlCache(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const pack = { packageId: 2, kind: "groom", price: 1500, durationMinutes: 110,
  includes: [{ serviceId: 10, optional: false }, { serviceId: 1086, optional: true, listPrice: 500 }], groom: {} };
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_BOOKING_API_BASE_URL", "https://ops.example.com");
  sessionStorage.clear();
  route.params = new URLSearchParams("mode=nearest&packageId=2&addons=1086");
  fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, package: pack }) });
  vi.stubGlobal("fetch", fetchMock);
});
it("defers ambiguous hydration and resumes with the selected branch, preserving groom pricing and handoff", async () => {
  const { result } = renderHook(() => useBookO2Session());
  expect(result.current.step).toBe("branch");
  expect(fetchMock).not.toHaveBeenCalled();
  act(() => result.current.selectBranch("PUBLIC_A"));
  await waitFor(() => expect(result.current.groomHydrationStatus).toBe("ready"));
  expect(new URL(fetchMock.mock.calls[0][0], "https://test.local").searchParams.get("branchCode")).toBe("PUBLIC_A");
  expect(result.current.step).toBe("services");
  expect(result.current.groomCart?.totalPrice).toBe(2000);
  expect(result.current.groomCart?.serviceIds).toEqual([10, 1086]);
  expect(result.current.packageId).toBe(2);
  expect(result.current.addonProIds).toEqual([1086]);
  act(() => result.current.selectBranch("PUBLIC_B"));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(new URL(fetchMock.mock.calls[1][0], "https://test.local").searchParams.get("branchCode")).toBe("PUBLIC_B");
});
it("keeps a bare package deep-link in branch selection without losing its package", () => {
  route.params = new URLSearchParams("packageId=2&addons=1086");
  const { result } = renderHook(() => useBookO2Session());
  expect(result.current.step).toBe("branch");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result.current.packageId).toBe(2);
});

it("hydrates an existing branch deep-link immediately", async () => {
  route.params.set("branch", "PUBLIC_A");
  const { result } = renderHook(() => useBookO2Session());
  await waitFor(() => expect(result.current.groomHydrationStatus).toBe("ready"));
  expect(new URL(fetchMock.mock.calls[0][0], "https://test.local").searchParams.get("branchCode")).toBe("PUBLIC_A");
});
it("ignores an old branch response after a new branch is selected", async () => {
  let resolveOld!: (response: unknown) => void;
  fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  route.params.set("branch", "PUBLIC_A");
  const { result } = renderHook(() => useBookO2Session());
  act(() => result.current.selectBranch("PUBLIC_B"));
  await waitFor(() => expect(result.current.groomHydrationStatus).toBe("ready"));
  await act(async () => resolveOld({ ok: true, json: async () => ({ ok: true, package: { ...pack, price: 9999 } }) }));
  expect(result.current.groomCart?.totalPrice).toBe(2000);
});
