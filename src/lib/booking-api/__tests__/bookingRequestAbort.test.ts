import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Request Abort", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("handles aborted request as non-retryable BookingApiError", async () => {
    mockFetch.mockRejectedValueOnce(new DOMException("The operation was aborted.", "AbortError"));
    const { bookingApiRequest } = await import("../client");
    const { BookingApiError } = await import("../errors");

    try {
      await bookingApiRequest({ path: "/test" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(BookingApiError);
      expect((err as InstanceType<typeof BookingApiError>).isRetryable).toBe(false);
    }
  });
});
