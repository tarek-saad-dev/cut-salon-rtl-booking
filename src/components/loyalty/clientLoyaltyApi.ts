// ─── CUT CLUB — Client Loyalty API Layer ─────────────────────────────────────
// TODO: Replace hardcoded clientId with authenticated client session / OTP token later.

import { buildCasherPublicApiUrl } from "@/lib/casherPublicApiUrl";

// ── Generic fetch helper ──────────────────────────────────────────────────────
async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data: unknown = await res.json().catch(() => null);
  if (
    !res.ok ||
    (data !== null &&
      typeof data === "object" &&
      (data as Record<string, unknown>).ok === false)
  ) {
    const msg =
      data !== null && typeof data === "object"
        ? (((data as Record<string, unknown>).error as string | undefined) ??
          "Failed to load data")
        : "Failed to load data";
    throw new Error(msg);
  }
  return data as T;
}

// ── Response Types ────────────────────────────────────────────────────────────

export type ApiRewardStatus =
  | "available"
  | "locked"
  | "tier_locked"
  | "redeemed";

export type PersonalOfferType =
  | "DOUBLE_POINTS"
  | "COMEBACK"
  | "SERVICE_UPSELL"
  | "BIRTHDAY"
  | "NONE";

export interface ApiClientInfo {
  id: number | string;
  name: string;
  phone?: string;
}

export interface ApiMembershipInfo {
  memberId: string;
  tierCode: string; // "Bronze" | "Silver" | "Gold" | "Black VIP"
  tierNameEn: string;
  tierNameAr: string;
  pointsBalance: number;
  lastVisitPoints?: number;
  memberSince?: string;
}

export interface ApiNextReward {
  id: string | number;
  name: string;
  requiredPoints: number;
  remainingPoints: number;
  progress: number;
}

export interface ApiLoyaltyReward {
  id: string | number;
  title: string;
  titleAr: string;
  requiredPoints: number;
  status: ApiRewardStatus;
  remainingPoints?: number;
  icon?: string;
}

export interface ApiLoyaltyStats {
  visits: number;
  rewardsUsed: number;
  favoriteBarber?: string | null;
}

export interface ApiLoyaltyLevel {
  tierCode: string;
  tierNameEn: string;
  tierNameAr: string;
  minPoints: number;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface ApiPersonalOffer {
  type: PersonalOfferType;
  /** Full title override — if omitted, built from serviceLabels / serviceNames */
  title?: string;
  description?: string;
  /** Display names for title building, e.g. ["Haircut & Beard", "Deep skincare"] */
  serviceLabels?: string[];
  /** Booking product names for future CTA pre-selection, e.g. ["Haircut & Beard", "Deep SkinCare"] */
  serviceNames?: string[];
  /** Static expiry copy when expiresAt is not provided */
  expiryText?: string;
  expiresAt?: string | null;
  eyebrow?: string;
  ctaLabel?: string;
}

export interface ApiReferralInfo {
  code: string;
  shareUrl?: string;
  rewardPoints?: number;
}

export interface ApiActivityItem {
  id: string | number;
  type: "earn" | "redeem" | "expire" | "bonus";
  label: string;
  points: number;
  date: string;
}

export interface ClientLoyaltyDashboardResponse {
  ok: true;
  client: ApiClientInfo;
  membership: ApiMembershipInfo;
  nextReward: ApiNextReward | null;
  stats: ApiLoyaltyStats;
  rewards: ApiLoyaltyReward[];
  levels: ApiLoyaltyLevel[];
  personalOffer: ApiPersonalOffer | null;
  referral: ApiReferralInfo | null;
  recentActivity: ApiActivityItem[];
}

export interface RedeemRewardResponse {
  ok: true;
  message?: string;
  redeemCode?: string;
  newBalance?: number;
}

export interface ActivityPageResponse {
  ok: true;
  activity: ApiActivityItem[];
  total: number;
  page: number;
}

export type MovementType = "EARN" | "REDEEM" | "ADJUST" | "EXPIRE";

export interface ActivityFilterOptions {
  page?: number;
  limit?: number;
  movementType?: MovementType;
  dateFrom?: string;
  dateTo?: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchClientLoyaltyDashboard(
  clientId: string | number,
): Promise<ClientLoyaltyDashboardResponse> {
  return apiGet<ClientLoyaltyDashboardResponse>(
    buildCasherPublicApiUrl(
      `/api/public/client/loyalty/me?clientId=${encodeURIComponent(clientId)}`,
    ),
  );
}

export async function fetchClientLoyaltyActivity(
  clientId: string | number,
  options: ActivityFilterOptions = {},
): Promise<ActivityPageResponse> {
  const { page = 1, limit = 10, movementType, dateFrom, dateTo } = options;

  const params = new URLSearchParams({
    clientId: String(clientId),
    page: String(page),
    limit: String(limit),
  });

  if (movementType) {
    params.append("movementType", movementType);
  }
  if (dateFrom) {
    params.append("dateFrom", dateFrom);
  }
  if (dateTo) {
    params.append("dateTo", dateTo);
  }

  return apiGet<ActivityPageResponse>(
    buildCasherPublicApiUrl(`/api/public/client/loyalty/activity?${params.toString()}`),
  );
}

export async function fetchClientLoyaltyRewards(
  clientId: string | number,
): Promise<{ ok: true; rewards: ApiLoyaltyReward[] }> {
  return apiGet<{ ok: true; rewards: ApiLoyaltyReward[] }>(
    buildCasherPublicApiUrl(
      `/api/public/client/loyalty/rewards?clientId=${encodeURIComponent(clientId)}`,
    ),
  );
}

export async function redeemClientReward(
  clientId: string | number,
  rewardId: string | number,
): Promise<RedeemRewardResponse> {
  const res = await fetch(
    buildCasherPublicApiUrl(
      `/api/public/client/loyalty/rewards/${encodeURIComponent(rewardId)}/redeem?clientId=${encodeURIComponent(clientId)}`,
    ),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    },
  );
  const data: unknown = await res.json().catch(() => null);
  if (
    !res.ok ||
    (data !== null &&
      typeof data === "object" &&
      (data as Record<string, unknown>).ok === false)
  ) {
    const msg =
      data !== null && typeof data === "object"
        ? (((data as Record<string, unknown>).error as string | undefined) ??
          ((data as Record<string, unknown>).message as string | undefined) ??
          "فشل استبدال المكافأة")
        : "فشل استبدال المكافأة";
    throw new Error(msg);
  }
  return data as RedeemRewardResponse;
}

export async function fetchClientReferral(
  clientId: string | number,
): Promise<{ ok: true; referral: ApiReferralInfo }> {
  return apiGet<{ ok: true; referral: ApiReferralInfo }>(
    buildCasherPublicApiUrl(
      `/api/public/client/referral?clientId=${encodeURIComponent(clientId)}`,
    ),
  );
}
