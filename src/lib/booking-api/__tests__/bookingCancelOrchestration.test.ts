import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { _clearAllMutations } from "../idempotency";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Cancel Orchestration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CASHER_API_BASE_URL", "https://casher-five.vercel.app");
    mockFetch.mockReset();
    _clearAllMutations();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends Idempotency-Key on cancel", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200, headers: new Headers(),
      text: async () => JSON.stringify({ ok: true, cancelled: true }),
    } as unknown as Response);

    const { submitBookingCancellation } = await import("../booking");
    await submitBookingCancellation({ code: "BK-001", phone: "01234567890" });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Idempotency-Key"]).toBeTruthy();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.clientRequestId).toBe(headers["Idempotency-Key"]);
  });
});
