import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(status: number, body: unknown, headers: Record<string, string>) {
  const h = new Headers(headers);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: h,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("Response metadata parsing", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("captures contract version header", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }, {
      "x-booking-contract-version": "booking-public-v1",
      "x-request-id": "req-abc",
    }));
    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.metadata.contractVersion).toBe("booking-public-v1");
    expect(res.metadata.contractUnverified).toBe(false);
  });

  it("captures request ID", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }, {
      "x-request-id": "req-xyz",
    }));
    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.metadata.requestId).toBe("req-xyz");
  });

  it("parses Retry-After header", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }, {
      "retry-after": "30",
    }));
    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.metadata.rateLimit.retryAfterSeconds).toBe(30);
  });

  it("marks contractUnverified when header missing", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }, {}));
    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.metadata.contractUnverified).toBe(true);
  });
});
