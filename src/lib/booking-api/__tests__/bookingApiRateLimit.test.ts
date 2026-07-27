import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Rate limit handling", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes 429 response into BookingApiError with retryAfterSeconds", async () => {
    const headers = new Headers({
      "retry-after": "60",
      "x-request-id": "rate-req",
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers,
      text: async () => JSON.stringify({
        ok: false,
        error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" },
      }),
    } as unknown as Response);

    const { bookingApiRequest } = await import("../client");
    const { BookingApiError } = await import("../errors");
    try {
      await bookingApiRequest({ path: "/test" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(BookingApiError);
      const apiErr = err as InstanceType<typeof BookingApiError>;
      expect(apiErr.isRateLimited).toBe(true);
      expect(apiErr.retryAfterSeconds).toBe(60);
      expect(apiErr.code).toBe("RATE_LIMIT_EXCEEDED");
    }
  });
});
