import { describe, expect, it, vi } from "vitest";
import { createOctoberOfferApi, getAttribution, normalizeEgyptianMobile } from "./octoberOfferApi";
const campaign = { status: "active", remainingClaims: 12, terms: "Campaign terms", claimDeadline: "2026-10-31T23:59:59Z", redeemUntil: "2026-11-30T23:59:59Z" };
describe("October offer API", () => {
  it("fails closed without an endpoint and never sends a request", async () => {
    const fetcher = vi.fn();
    const api = createOctoberOfferApi(undefined, fetcher);
    await expect(api.campaign()).rejects.toThrow("unavailable");
    await expect(api.claim("Test", "01012345678", {}, "test-key")).rejects.toThrow("unavailable");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("validates availability without inventing stock", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => campaign });
    const api = createOctoberOfferApi("https://example.test/campaign", fetcher);
    expect(await api.campaign()).toEqual(campaign);
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ ...campaign, remainingClaims: 101 }) });
    await expect(api.campaign()).rejects.toThrow("unavailable");
  });
  it.each(["claimDeadline", "redeemUntil"])("rejects a missing or invalid campaign %s", async field => {
    for (const value of [undefined, "invalid-date"]) {
      const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...campaign, [field]: value }) });
      await expect(createOctoberOfferApi("https://example.test/campaign", fetcher).campaign()).rejects.toThrow("unavailable");
    }
  });
  it("rejects legacy receipts without an explicit redemption expiry", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ claimId: "mock-123", validUntil: campaign.claimDeadline }) });
    await expect(createOctoberOfferApi("https://example.test/campaign", fetcher).claim("Test", "01012345678", {}, "key")).rejects.toThrow("unavailable");
  });
  it("sends normalized claims, attribution, and a stable retry key only to the configured endpoint", async () => {
    const receipt = { claimId: "mock-123", redeemUntil: campaign.redeemUntil };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => receipt });
    const api = createOctoberOfferApi("https://example.test/campaign/", fetcher);
    const attribution = getAttribution("?utm_source=meta&utm_medium=paid&utm_campaign=october&utm_content=video&utm_term=cut&fbclid=abc&secret=ignored");
    expect(Object.keys(attribution)).toHaveLength(6);
    expect(await api.claim(" Test ", "+201012345678", attribution, "retry-key")).toEqual(receipt);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://example.test/campaign/claims");
    expect(JSON.parse(init.body)).toEqual({ name: "Test", mobile: "01012345678", attribution });
    expect(init.headers["Idempotency-Key"]).toBe("retry-key");
    expect(init.credentials).toBe("omit");
  });
  it("handles closed campaigns and rejects unconfirmed receipts", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 410 });
    const api = createOctoberOfferApi("https://example.test/campaign", fetcher);
    await expect(api.claim("Test", "01012345678", {}, "key")).rejects.toThrow("ended");
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await expect(api.claim("Test", "01012345678", {}, "key")).rejects.toThrow("unavailable");
  });
  it("validates Egyptian mobile formats", () => {
    expect(normalizeEgyptianMobile("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
    expect(normalizeEgyptianMobile("0020 115 123 4567")).toBe("01151234567");
    expect(normalizeEgyptianMobile("01312345678")).toBeNull();
  });
});
