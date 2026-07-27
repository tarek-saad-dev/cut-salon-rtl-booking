import { describe, it, expect } from "vitest";
import { BookingApiError } from "../errors";

describe("Security", () => {
  it("BookingApiError does not include sensitive data in message", () => {
    const err = new BookingApiError({
      code: "PLAN_TOKEN_EXPIRED",
      message: "Plan expired",
      technicalMessage: "Token tok_secret_abc expired at 2026-01-01",
      httpStatus: 400,
    });
    expect(err.message).not.toContain("tok_secret");
    expect(err.toString()).not.toContain("tok_secret");
  });

  it("idempotency keys contain no customer information", async () => {
    const { createClientRequestId } = await import("../idempotency");
    const id = createClientRequestId();
    expect(id).toMatch(/^[0-9a-f-]+$/i);
    expect(id.length).toBeLessThanOrEqual(128);
  });
});
