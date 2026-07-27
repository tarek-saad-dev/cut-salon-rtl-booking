import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Contract Version", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    vi.stubEnv("NODE_ENV", "development");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects missing contract version", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true }),
    } as unknown as Response);

    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.metadata.contractUnverified).toBe(true);
    warnSpy.mockRestore();
  });

  it("detects mismatched contract version", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers({ "x-booking-contract-version": "booking-v0-OLD" }),
      text: async () => JSON.stringify({ ok: true }),
    } as unknown as Response);

    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.metadata.contractUnverified).toBe(true);
    expect(res.metadata.contractVersion).toBe("booking-v0-OLD");
    warnSpy.mockRestore();
  });
});
