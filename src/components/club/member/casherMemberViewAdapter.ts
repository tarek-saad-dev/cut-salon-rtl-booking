/**
 * CUT CLUB 2.0 — strict presentation adapter from the new Casher
 * VERIFIED private member snapshot (#298) to Website member widgets.
 *
 * Inert pure function: no fetch, session, cookies, phone lookup or routing.
 * A future trusted BFF caller MUST cryptographically verify the revocable
 * session, tenant/customer ownership and scoped API before using this.
 * The value `mode:"verified"` alone is NOT proof of identity.
 */
import type { MemberOverviewView, MemberVoucher } from "./memberViewModels";
import { formatCoins } from "./memberViewModels";

type JsonRecord = Record<string, unknown>;
const obj = (x: unknown): x is JsonRecord => x !== null && typeof x === "object" && !Array.isArray(x);
const validText = (x: unknown, limit = 160): x is string => typeof x === "string" &&
  x.trim().length > 0 && x.length <= limit;
const coin = (x: unknown): x is number => typeof x === "number" && formatCoins(x) !== null;
const statusLabel: Record<string, string> = {
  ACTIVE: "متاحة", USED: "مستخدمة",
  EXPIRED: "منتهية", CANCELLED: "ملغاة",
};

function isoDate(x: unknown): string | null | undefined {
  if (x === null) return null;
  if (typeof x !== "string") return undefined;
  const d = new Date(x);
  return !Number.isFinite(d.getTime()) || d.toISOString() !== x ? undefined :
    d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * In an authorized caller context ONLY. Invalid or missing data is unavailable,
 * not zero, not fake rewards and not a legacy clientId-driven customer profile.
 */
export function adaptAuthorizedCasherMemberSnapshot(raw: unknown): MemberOverviewView | null {
  if (!obj(raw) || raw.mode !== "verified" || !obj(raw.member) ||
      !obj(raw.wallet) || !obj(raw.enabledActions)) return null;
  const m = raw.member, w = raw.wallet, actions = raw.enabledActions;
  if (actions.buy !== false || actions.redeem !== false || actions.mysteryBox !== false ||
      !validText(m.displayName) ||
      (m.memberId !== null && (typeof m.memberId !== "string" || !/^CC-[0-9]{6,15}$/.test(m.memberId))) ||
      !validText(m.tierCode, 30) || !validText(m.tierNameAr, 100) ||
      !Number.isSafeInteger(m.visits) || (m.visits as number) < 0 ||
      !coin(w.availableCoins) || !coin(w.lifetimeEarnedCoins) ||
      w.promotionalCreditAvailable !== false || !Array.isArray(w.vouchers) ||
      w.vouchers.length > 25 || !Array.isArray(w.activity) || w.activity.length > 20) return null;

  const seenVouchers = new Set<number>();
  const vouchers: MemberVoucher[] = [];
  for (const item of w.vouchers) {
    if (!obj(item) || !Number.isSafeInteger(item.id) || (item.id as number) <= 0 ||
        seenVouchers.has(item.id as number) || !validText(item.label, 150) ||
        typeof item.status !== "string" || !(item.status in statusLabel)) return null;
    const expiry = isoDate(item.expiresAt);
    if (expiry === undefined) return null;
    seenVouchers.add(item.id as number);
    vouchers.push(Object.freeze({
      id: String(item.id),
      title: item.label as string,
      statusLabel: statusLabel[item.status],
      expiryLabel: expiry,
    }));
  }
  return Object.freeze({
    member: Object.freeze({
      displayName: (m.displayName as string).trim(),
      // A pending first-time member has NO real membership ID to display.
      cutId: (m.memberId as string | null) ?? "",
      tierName: m.tierNameAr as string,
      coins: w.availableCoins as number,
      nextTierProgress: null,
    }),
    wallet: Object.freeze({
      coins: w.availableCoins as number,
      // This DTO never invents or merges an EGP promotional credit ledger.
      promoCredit: null,
      vouchers: Object.freeze(vouchers),
    }),
    // Backend did not load authorized upcoming bookings; do not invent empty.
    upcomingVisit: Object.freeze({ state: "unavailable" as const }),
  });
}
