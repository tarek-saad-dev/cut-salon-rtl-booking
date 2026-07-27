import { describe, it, expect, beforeEach } from "vitest";
import {
  incrementSelectionVersion,
  isStaleResponse,
  _resetDedup,
} from "../request-dedup";

describe("Request Deduplication", () => {
  beforeEach(() => {
    _resetDedup();
  });

  it("detects stale response after selection version increment", () => {
    const v1 = incrementSelectionVersion();
    incrementSelectionVersion();
    expect(isStaleResponse(v1)).toBe(true);
  });

  it("does not flag current version as stale", () => {
    const v = incrementSelectionVersion();
    expect(isStaleResponse(v)).toBe(false);
  });
});
