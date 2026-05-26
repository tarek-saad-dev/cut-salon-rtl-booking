// ─── CUT CLUB — Loyalty Types, Mock Data & Helpers ───────────────────────────

export type MemberLevel = "Bronze" | "Silver" | "Gold" | "Black VIP";

export interface LoyaltyReward {
  id: string;
  title: string;
  titleAr: string;
  points: number;
  status: "available" | "locked" | "tier_locked" | "redeemed";
  remainingPoints?: number;
  icon: "scissors" | "sparkles" | "gift" | "star" | "crown";
}

export interface LoyaltyActivity {
  id: string;
  type: "earn" | "redeem";
  label: string;
  points: number;
  date: string;
}

export interface NextReward {
  name: string;
  requiredPoints: number;
  remainingPoints: number;
  progress: number;
}

export interface LoyaltyStats {
  visits: number;
  rewardsUsed: number;
  favoriteBarber: string;
}

export interface ClientLoyalty {
  clientName: string;
  memberId: string;
  level: MemberLevel;
  points: number;
  lastVisitPoints: number;
  memberSince: string;
  nextReward: NextReward;
  stats: LoyaltyStats;
  referralCode: string;
  rewards: LoyaltyReward[];
  activity: LoyaltyActivity[];
}

export const LEVEL_CONFIG: Record<
  MemberLevel,
  {
    color: string;
    border: string;
    bg: string;
    minPoints: number;
    maxPoints: number;
  }
> = {
  Bronze: {
    color: "#cd7f32",
    border: "rgba(205,127,50,0.35)",
    bg: "rgba(205,127,50,0.08)",
    minPoints: 0,
    maxPoints: 500,
  },
  Silver: {
    color: "#a8a8a8",
    border: "rgba(168,168,168,0.35)",
    bg: "rgba(168,168,168,0.08)",
    minPoints: 500,
    maxPoints: 1000,
  },
  Gold: {
    color: "#d4af37",
    border: "rgba(212,175,55,0.4)",
    bg: "rgba(212,175,55,0.08)",
    minPoints: 1000,
    maxPoints: 1500,
  },
  "Black VIP": {
    color: "#f7f7f2",
    border: "rgba(247,247,242,0.25)",
    bg: "rgba(247,247,242,0.05)",
    minPoints: 1500,
    maxPoints: 9999,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function tierCodeToMemberLevel(tierCode: string): MemberLevel {
  const map: Record<string, MemberLevel> = {
    Bronze: "Bronze",
    BRONZE: "Bronze",
    Silver: "Silver",
    SILVER: "Silver",
    Gold: "Gold",
    GOLD: "Gold",
    "Black VIP": "Black VIP",
    BLACK_VIP: "Black VIP",
    BLACKVIP: "Black VIP",
    VIP: "Black VIP",
  };
  return map[tierCode] ?? "Bronze";
}

export function formatPoints(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Number.isInteger(value)
    ? value
    : Math.round(value * 100) / 100;
  return rounded.toLocaleString("en-US");
}

export function formatActivityDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

// ─── Mock Data (dev only) ─────────────────────────────────────────────────────

export const mockLoyalty: ClientLoyalty = {
  clientName: "أحمد محمد",
  memberId: "CUT-20491",
  level: "Gold",
  points: 1240,
  lastVisitPoints: 35,
  memberSince: "2026",
  nextReward: {
    name: "Free Skin Cleaning",
    requiredPoints: 1400,
    remainingPoints: 160,
    progress: 78,
  },
  stats: {
    visits: 7,
    rewardsUsed: 2,
    favoriteBarber: "زياد",
  },
  referralCode: "CUT-AHMED-4821",
  rewards: [
    {
      id: "r1",
      title: "50 EGP Discount",
      titleAr: "خصم 50 جنيه",
      points: 220,
      status: "available",
      icon: "gift",
    },
    {
      id: "r2",
      title: "Free Styling",
      titleAr: "تسريحة مجانية",
      points: 400,
      status: "available",
      icon: "scissors",
    },
    {
      id: "r3",
      title: "Free Skin Cleaning",
      titleAr: "تنظيف بشرة مجاني",
      points: 600,
      status: "locked",
      remainingPoints: 160,
      icon: "sparkles",
    },
    {
      id: "r4",
      title: "VIP Package Upgrade",
      titleAr: "ترقية باقة VIP",
      points: 1200,
      status: "available",
      icon: "crown",
    },
  ],
  activity: [
    { id: "a1", type: "earn", label: "Hair Cut", points: 25, date: "20 May" },
    {
      id: "a2",
      type: "earn",
      label: "Haircut & Beard",
      points: 40,
      date: "12 May",
    },
    {
      id: "a3",
      type: "redeem",
      label: "50 EGP Discount",
      points: -220,
      date: "3 May",
    },
  ],
};
