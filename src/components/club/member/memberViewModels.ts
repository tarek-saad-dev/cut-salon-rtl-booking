/**
 * CUT CLUB member presentation contract (#42).
 *
 * These data shapes are *NOT* authentication or API contracts.
 * Future callers MUST build them from a verified, server-authorized Casher
 * projection, not from localStorage, clientId query/body, profile-by-phone,
 * or a public customer endpoint.
 *
 * null means NOT AVAILABLE, not zero or no entitlements.
 */
export type MemberSummary = Readonly<{
  displayName: string;
  cutId: string;
  tierName: string | null;
  /** CUT Coins are distinct from EGP and may contain 2 decimal digits in Casher. */
  coins: number | null;
  /** Values supplied by Casher; never derive reward eligibility in the UI. */
  nextTierProgress: Readonly<{ completed: number; target: number; label: string }> | null;
}>;

export type VerifiedPromoCredit = Readonly<{
  /** Monetary balance in minor units (piasters), not coins. */
  amountMinor: number;
  currency: "EGP";
  /** Only display an expiry if upstream explicitly supplies one. */
  expiryLabel: string | null;
}>;

export type MemberVoucher = Readonly<{
  id: string;
  title: string;
  statusLabel: string;
  expiryLabel: string | null;
}>;

export type MemberWallet = Readonly<{
  coins: number | null;
  promoCredit: VerifiedPromoCredit | null;
  /**
   * null -> cannot load owned vouchers;
   * [] -> verified account has zero owned vouchers.
   */
  vouchers: readonly MemberVoucher[] | null;
}>;

export type UpcomingVisit =
  | Readonly<{ state: "unavailable" }>
  | Readonly<{ state: "empty" }>
  | Readonly<{
      state: "booked";
      branchName: string;
      serviceName: string;
      dateLabel: string;
      barberName: string | null;
    }>;

export type MemberOverviewView = Readonly<{
  member: MemberSummary;
  wallet: MemberWallet;
  upcomingVisit: UpcomingVisit;
}>;

/**
 * CUT Coins in legacy Casher may be DECIMAL(10,2), NOT necessarily integers.
 * Display exact up-to-two-decimal values; refuse larger precision instead of
 * silently rounding an actual customer balance. null stays unavailable.
 */
export function formatCoins(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
      value > Number.MAX_SAFE_INTEGER / 100 ||
      Number(value.toFixed(2)) !== value) return null;
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(value);
}

export function formatEGPCredit(input: VerifiedPromoCredit | null): string | null {
  if (input === null || input.currency !== "EGP" ||
      !Number.isSafeInteger(input.amountMinor) ||
      input.amountMinor < 0) return null;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(input.amountMinor / 100);
}

/** Never infer identity or eligibility from client data in these functions. */
export function validProgress(
  value: MemberSummary["nextTierProgress"],
): value is NonNullable<MemberSummary["nextTierProgress"]> {
  return value !== null &&
    Number.isSafeInteger(value.completed) &&
    Number.isSafeInteger(value.target) &&
    value.completed >= 0 && value.target > 0 &&
    value.completed <= value.target &&
    value.label.trim().length > 0;
}
