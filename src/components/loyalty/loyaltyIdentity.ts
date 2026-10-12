/** Casher ClientID is a positive SQL INT, never a phone or browser identity proof. */
export function validateLoyaltyClientId(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !/^[1-9]\d*$/.test(value))
  ) {
    throw new Error("Invalid loyalty client ID");
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new Error("Invalid loyalty client ID");
  }
  return id;
}

export const LOYALTY_IDENTITY_UNAVAILABLE =
  "خدمة CUT CLUB غير متاحة مؤقتاً لحين تفعيل التحقق الآمن من الحساب. يرجى المحاولة لاحقاً";

/**
 * A valid integer alone does not authenticate a customer or identify a tenant.
 * Fail closed for every read and mutation until backend issue casher#92 supplies
 * a verified session/lookup contract and explicit branch-to-tenant resolution.
 * Do not bypass this guard using cut_client, query parameters, or default tenant.
 */
export function requireVerifiedLoyaltyIdentity(clientId: unknown): never {
  validateLoyaltyClientId(clientId);
  throw new Error(LOYALTY_IDENTITY_UNAVAILABLE);
}
