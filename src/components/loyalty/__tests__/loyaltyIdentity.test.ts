import { afterEach, describe, expect, it, vi } from "vitest";
import { validateLoyaltyClientId, LOYALTY_IDENTITY_UNAVAILABLE } from "../loyaltyIdentity";
import { fetchClientLoyaltyDashboard, fetchClientLoyaltyActivity, fetchClientLoyaltyRewards, redeemClientReward, fetchClientReferral } from "../clientLoyaltyApi";
import { fetchStore, purchaseStoreItem, fetchClientInventory } from "../storeApi";

afterEach(() => vi.unstubAllGlobals());

describe("loyalty identity boundary", () => {
  it.each([1, "42", 2147483647])("accepts SQL INT IDs: %s", (id) => {
    expect(validateLoyaltyClientId(id)).toBe(Number(id));
  });
  it.each(["01012345678", 10123456789, 2147483648, 0, -1, 1.5, NaN, Infinity, "1e2", " 42", "42x", "", null, undefined, true])("rejects invalid IDs: %s", (id) => {
    expect(() => validateLoyaltyClientId(id)).toThrow("Invalid loyalty client ID");
  });

  const actions = [
    ["dashboard", (id: string | number) => fetchClientLoyaltyDashboard(id)],
    ["activity", (id: string | number) => fetchClientLoyaltyActivity(id)],
    ["rewards", (id: string | number) => fetchClientLoyaltyRewards(id)],
    ["redemption", (id: string | number) => redeemClientReward(id, 5)],
    ["referral", (id: string | number) => fetchClientReferral(id)],
    ["store", (id: string | number) => fetchStore(id)],
    ["purchase", (id: string | number) => purchaseStoreItem(id, 5)],
    ["inventory", (id: string | number) => fetchClientInventory(id)],
  ] as const;
  it.each(actions)("blocks %s before any request without verified identity/tenant", async (_, action) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(action(42)).rejects.toThrow(LOYALTY_IDENTITY_UNAVAILABLE);
    await expect(action("01012345678")).rejects.toThrow("Invalid loyalty client ID");
    expect(fetch).not.toHaveBeenCalled();
  });
});
