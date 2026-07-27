import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrCreateMutationId,
  completeMutationId,
  abandonMutationId,
  buildCreateOperationKey,
  buildCancelOperationKey,
  _clearAllMutations,
} from "../idempotency";

describe("Idempotency", () => {
  beforeEach(() => {
    _clearAllMutations();
  });

  it("returns stable ID for same create operation key", () => {
    const key = buildCreateOperationKey({
      branchCode: "GLEEM", date: "2026-01-01", time: "10:00",
      serviceIds: [1, 2], mode: "specific", empId: 5,
    });
    const id1 = getOrCreateMutationId(key);
    const id2 = getOrCreateMutationId(key);
    expect(id1).toBe(id2);
    expect(id1.length).toBeLessThanOrEqual(128);
  });

  it("returns stable ID for same cancel operation key", () => {
    const key = buildCancelOperationKey("BK-ABC123");
    const id1 = getOrCreateMutationId(key);
    const id2 = getOrCreateMutationId(key);
    expect(id1).toBe(id2);
  });

  it("reuses ID on double-click (same key)", () => {
    const key = "create:test";
    const first = getOrCreateMutationId(key);
    const second = getOrCreateMutationId(key);
    expect(first).toBe(second);
  });

  it("reuses ID for network retry (same key)", () => {
    const key = "create:retry-test";
    const id = getOrCreateMutationId(key);
    // Simulate failed attempt — key still active
    const retryId = getOrCreateMutationId(key);
    expect(id).toBe(retryId);
  });

  it("generates new ID after selection change (abandon + new key)", () => {
    const key1 = buildCreateOperationKey({
      branchCode: "GLEEM", date: "2026-01-01", time: "10:00",
      serviceIds: [1], mode: "specific", empId: 5,
    });
    const id1 = getOrCreateMutationId(key1);
    abandonMutationId(key1);

    const key2 = buildCreateOperationKey({
      branchCode: "GLEEM", date: "2026-01-01", time: "11:00",
      serviceIds: [1], mode: "specific", empId: 5,
    });
    const id2 = getOrCreateMutationId(key2);
    expect(id1).not.toBe(id2);
  });

  it("generates new ID after completion", () => {
    const key = "create:complete-test";
    const id1 = getOrCreateMutationId(key);
    completeMutationId(key);
    const id2 = getOrCreateMutationId(key);
    expect(id1).not.toBe(id2);
  });
});
