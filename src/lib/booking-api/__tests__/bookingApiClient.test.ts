import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(status: number, body?: unknown, headers?: Record<string, string>) {
  const h = new Headers(headers);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: h,
    text: async () => body !== undefined ? JSON.stringify(body) : "",
    json: async () => body,
  } as unknown as Response;
}

describe("bookingApiRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app/");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes base URL by stripping trailing slash", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    const { bookingApiRequest } = await import("../client");
    await bookingApiRequest({ path: "/api/public/branches" });
    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0];
    expect(url).toBe("https://casher-five.vercel.app/api/public/branches");
  });

  it("throws when NEXT_PUBLIC_CASHER_API_BASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "");
    const { bookingApiRequest } = await import("../client");
    await expect(bookingApiRequest({ path: "/test" })).rejects.toThrow("not configured");
  });

  it("sends query parameters correctly", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    const { bookingApiRequest } = await import("../client");
    await bookingApiRequest({ path: "/test", query: { branchCode: "GLEEM", mode: "specific" } });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("branchCode=GLEEM");
    expect(url).toContain("mode=specific");
  });

  it("sends Content-Type for POST with body", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    const { bookingApiRequest } = await import("../client");
    await bookingApiRequest({ path: "/test", method: "POST", body: { foo: 1 } });
    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("sends Idempotency-Key header", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    const { bookingApiRequest } = await import("../client");
    await bookingApiRequest({ path: "/test", method: "POST", body: {}, idempotencyKey: "test-key-123" });
    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers["Idempotency-Key"]).toBe("test-key-123");
  });

  it("handles 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204, undefined));
    const { bookingApiRequest } = await import("../client");
    const res = await bookingApiRequest({ path: "/test" });
    expect(res.httpStatus).toBe(204);
    expect(res.data).toBeUndefined();
  });

  it("uses credentials: omit", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    const { bookingApiRequest } = await import("../client");
    await bookingApiRequest({ path: "/test" });
    const opts = mockFetch.mock.calls[0][1];
    expect(opts.credentials).toBe("omit");
  });

  it("handles aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    const { bookingApiRequest } = await import("../client");
    const { BookingApiError } = await import("../errors");
    await expect(bookingApiRequest({ path: "/test", signal: controller.signal })).rejects.toBeInstanceOf(BookingApiError);
  });
});
