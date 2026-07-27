import { describe, it, expect } from "vitest";
import { parseBackendError, createNetworkError, createMalformedResponseError, BookingApiError } from "../errors";
import type { ResponseMetadata } from "../types";

const emptyMetadata: ResponseMetadata = {
  contractVersion: null,
  contractUnverified: true,
  requestId: "req-123",
  rateLimit: { limit: null, remaining: null, resetAt: null, retryAfterSeconds: null },
  deprecated: false,
  warning: null,
};

describe("parseBackendError", () => {
  it("parses nested backend error shape", () => {
    const body = {
      ok: false,
      error: {
        code: "SLOT_NOT_AVAILABLE",
        message: "Slot taken",
        technicalMessage: "Row locked by txn 42",
        metadata: { slotTime: "14:00" },
      },
    };
    const err = parseBackendError(body, 409, emptyMetadata);
    expect(err).toBeInstanceOf(BookingApiError);
    expect(err.code).toBe("SLOT_NOT_AVAILABLE");
    expect(err.httpStatus).toBe(409);
    expect(err.isBusinessConflict).toBe(true);
    expect(err.requestId).toBe("req-123");
    expect(err.technicalMessage).toBe("Row locked by txn 42");
  });

  it("handles missing error object in body", () => {
    const err = parseBackendError({ ok: false }, 500, emptyMetadata);
    expect(err.code).toBe("UNKNOWN_ERROR");
    expect(err.isRetryable).toBe(true);
  });

  it("handles completely malformed body", () => {
    const err = parseBackendError(null, 500, emptyMetadata);
    expect(err).toBeInstanceOf(BookingApiError);
  });
});

describe("createNetworkError", () => {
  it("creates error for network failure", () => {
    const err = createNetworkError(new TypeError("Failed to fetch"));
    expect(err.httpStatus).toBe(0);
    expect(err.isRetryable).toBe(true);
  });

  it("creates non-retryable error for abort", () => {
    const err = createNetworkError(new DOMException("Aborted", "AbortError"));
    expect(err.isRetryable).toBe(false);
  });
});

describe("createMalformedResponseError", () => {
  it("creates error for malformed JSON", () => {
    const err = createMalformedResponseError(200, "req-1", new SyntaxError());
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.isRetryable).toBe(true);
  });
});
