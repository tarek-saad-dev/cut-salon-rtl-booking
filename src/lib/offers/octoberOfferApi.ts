export type Campaign = {
  status: "active" | "ended";
  remainingClaims: number;
  terms: string;
  claimDeadline: string;
  redeemUntil: string;
};
export type ClaimReceipt = { claimId: string; redeemUntil: string };
export const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
export function getAttribution(search: string) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(attributionKeys.flatMap(key => params.has(key) ? [[key, params.get(key)!]] : []));
}
export function normalizeEgyptianMobile(value: string): string | null {
  const digits = value.replace(/[٠-٩]/g, char => String("٠١٢٣٤٥٦٧٨٩".indexOf(char))).replace(/[\s()-]/g, "");
  const local = digits.replace(/^(?:\+20|0020|20)/, "0");
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}
export function isReceipt(value: unknown): value is ClaimReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as ClaimReceipt;
  return typeof receipt.claimId === "string" && !!receipt.claimId.trim() && typeof receipt.redeemUntil === "string" && Number.isFinite(Date.parse(receipt.redeemUntil));
}

// Explicit opt-in integration; never fall back to the production booking API.
// GET endpoint => Campaign; POST endpoint/claims => ClaimReceipt.
export function createOctoberOfferApi(endpoint: string | undefined, request: typeof fetch = fetch) {
  async function call(path: string, init?: RequestInit) {
    if (!endpoint) throw new Error("unavailable");
    const response = await request(`${endpoint.replace(/\/$/, "")}${path}`, {
      ...init, cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(response.status === 409 || response.status === 410 ? "ended" : "unavailable");
    return response.json();
  }
  return {
    async campaign(): Promise<Campaign> {
      const data = await call("");
      if (!["active", "ended"].includes(data?.status) || !Number.isInteger(data.remainingClaims) || data.remainingClaims < 0 || data.remainingClaims > 100 || typeof data.terms !== "string" || !data.terms.trim() || typeof data.claimDeadline !== "string" || !Number.isFinite(Date.parse(data.claimDeadline)) || typeof data.redeemUntil !== "string" || !Number.isFinite(Date.parse(data.redeemUntil))) throw new Error("unavailable");
      return data;
    },
    async claim(name: string, mobile: string, attribution: Record<string, string>, requestId: string): Promise<ClaimReceipt> {
      const phone = normalizeEgyptianMobile(mobile);
      if (!name.trim() || !phone) throw new Error("invalid");
      const data = await call("/claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestId }, body: JSON.stringify({ name: name.trim(), mobile: phone, attribution }) });
      if (!isReceipt(data)) throw new Error("unavailable");
      return data;
    },
  };
}
export const octoberOfferApi = createOctoberOfferApi(process.env.NEXT_PUBLIC_OCTOBER_OFFER_API_URL);
