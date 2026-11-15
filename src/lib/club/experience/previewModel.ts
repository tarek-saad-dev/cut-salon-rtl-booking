/**
 * CUT CLUB 2.0 — preview-only contract and synthetic fixtures (#56).
 *
 * ZERO live customers or balances. This source never connects to Casher,
 * never acts as an identity authority, and cannot change financial state.
 * Preview states are intentionally obvious demo values (not approved offers).
 */
export type ClubArea =
  | "home"
  | "wallet"
  | "rewards"
  | "memberships"
  | "challenges"
  | "referrals"
  | "profile";

export type PreviewPersona = "new" | "regular" | "vip";

export type ClubNavigationItem = Readonly<{
  id: ClubArea;
  label: string;
  caption: string;
}>;

export const CLUB_NAVIGATION: readonly ClubNavigationItem[] = [
  { id: "home", label: "الرئيسية", caption: "Home" },
  { id: "wallet", label: "المحفظة", caption: "Wallet" },
  { id: "rewards", label: "المكافآت", caption: "Rewards" },
  { id: "memberships", label: "العضويات", caption: "Memberships" },
  { id: "challenges", label: "التحديات", caption: "Challenges" },
  { id: "referrals", label: "الإحالات", caption: "Referrals" },
  { id: "profile", label: "حسابي", caption: "Me" },
] as const;

export type DemoMovement = Readonly<{
  id: string;
  label: string;
  detail: string;
  amount: number;
}>;

export type DemoVoucher = Readonly<{
  id: string;
  label: string;
  status: "active" | "used";
}>;

export type DemoMember = Readonly<{
  persona: PreviewPersona;
  name: string;
  tier: "Guest" | "Silver" | "Gold";
  cutId: string;
  coins: number;
  promoCreditEGP: number;
  visits: number;
  milestone: number;
  nextBooking: string | null;
  vouchers: readonly DemoVoucher[];
  movements: readonly DemoMovement[];
}>;

export const DEMO_MEMBERS: Readonly<Record<PreviewPersona, DemoMember>> = {
  new: {
    persona: "new", name: "عميل جديد · تجربة", tier: "Guest",
    cutId: "DEMO-NEW", coins: 0, promoCreditEGP: 0,
    visits: 0, milestone: 0, nextBooking: null,
    vouchers: [], movements: [],
  },
  regular: {
    persona: "regular", name: "عضو تجريبي", tier: "Silver",
    cutId: "DEMO-REGULAR", coins: 1250, promoCreditEGP: 0,
    visits: 4, milestone: 4, nextBooking: "موعد توضيحي · جليم",
    vouchers: [
      { id: "voucher-demo-1", label: "قسيمة تجريبية غير صالحة", status: "active" },
    ],
    movements: [
      { id: "m1", label: "زيارة تجريبية", detail: "مثال احتساب، ليس حركة حقيقية", amount: 150 },
      { id: "m2", label: "مكافأة تجريبية", detail: "مثال خصم نقاط، ليس حركة حقيقية", amount: -80 },
      { id: "m3", label: "زيارة تجريبية", detail: "مثال احتساب، ليس حركة حقيقية", amount: 110 },
    ],
  },
  vip: {
    persona: "vip", name: "عضو مميز · تجربة", tier: "Gold",
    cutId: "DEMO-VIP", coins: 4800, promoCreditEGP: 100,
    visits: 18, milestone: 18, nextBooking: "موعد توضيحي · كامب شيزار",
    vouchers: [
      { id: "voucher-demo-2", label: "هدية تجريبية غير قابلة للاستخدام", status: "active" },
      { id: "voucher-demo-3", label: "قسيمة تجربة مستخدمة", status: "used" },
    ],
    movements: [
      { id: "m4", label: "زيارة تجريبية", detail: "أرقام واجهة عرض فقط", amount: 240 },
      { id: "m5", label: "استبدال توضيحي", detail: "لم يحدث أي خصم", amount: -200 },
      { id: "m6", label: "تحدي توضيحي", detail: "لا توجد مكافأة فعلية", amount: 120 },
    ],
  },
} as const;

export type DemoReward = Readonly<{
  id: string;
  name: string;
  nameEn: string;
  description: string;
  coins: number;
  tag: string;
  icon: "gift" | "scissors" | "sparkles" | "box";
}>;

export const DEMO_REWARDS: readonly DemoReward[] = [
  {
    id: "reward-demo-01", name: "تجربة Grooming", nameEn: "THE RITUAL",
    description: "خدمة توضيحية لعرض شكل المكافآت. ليست عرضًا حقيقيًا أو وعدًا بتوفير الخدمة.",
    coins: 600, tag: "مثال تصميم", icon: "scissors",
  },
  {
    id: "reward-demo-02", name: "جلسة عناية", nameEn: "CARE MOMENT",
    description: "تصور لمكافأة مستقبلية. التفاصيل والتكلفة والأهلية تتحدد من إدارة CUT.",
    coins: 1200, tag: "مثال تصميم", icon: "sparkles",
  },
  {
    id: "reward-demo-03", name: "هدية CUT", nameEn: "SPECIAL EDITION",
    description: "تصور للهدية القابلة للاستبدال بعد التأكد من المخزون والشروط.",
    coins: 1800, tag: "مثال تصميم", icon: "gift",
  },
  {
    id: "reward-demo-04", name: "Mystery Box", nameEn: "THE UNKNOWN",
    description: "تجربة الصندوق الجديدة قيد التطوير. لا يوجد سحب أو جائزة أو خصم نقاط في هذه المعاينة.",
    coins: 2200, tag: "غير متاح", icon: "box",
  },
] as const;

export type MembershipProgram = Readonly<{
  id: "education" | "medical" | "corporate" | "standard";
  eyebrow: string;
  title: string;
  summary: string;
  note: string;
}>;

export const MEMBERSHIP_PROGRAMS: readonly MembershipProgram[] = [
  {
    id: "standard", eyebrow: "EVERYDAY CUT", title: "CUT CLUB الأساسية",
    summary: "تجربة ولاء تُبنى على زياراتك ونوع العضوية وشروط البرنامج.",
    note: "تحديد المزايا النهائية مرتبط بالسياسات المعتمدة.",
  },
  {
    id: "education", eyebrow: "CAMPUS", title: "طلاب المدارس والجامعات",
    summary: "مسار اتفاقيات لطلاب الجامعات والمدارس، مع توثيق الانتماء التعليمي في الحساب بعد التحقق.",
    note: "لا توجد خصومات أو اتفاقيات مفعلة في المعاينة.",
  },
  {
    id: "medical", eyebrow: "HEALTHCARE", title: "الأطباء والعاملون بالصحة",
    summary: "مسار عضوية مهني قابل للتوسع، خصوصًا حول فرع كامب شيزار.",
    note: "التحقق من المهنة والجهة يتم وفق قواعد معتمدة.",
  },
  {
    id: "corporate", eyebrow: "PARTNERS", title: "عضويات الشركات والشركاء",
    summary: "اتفاقيات يمكن ربطها بالجهة، الفرع، الأهلية، ومدة الاتفاق.",
    note: "لا يمكن تفعيل أي ميزة قبل اعتماد اتفاق فعلي.",
  },
] as const;

export type DemoChallenge = Readonly<{
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  status: "planned" | "example";
}>;

export const DEMO_CHALLENGES: readonly DemoChallenge[] = [
  {
    id: "visits", title: "رحلة الزيارات", description: "تصوّر لتحدٍّ يعتمد على زيارات مكتملة ومؤهّلة.",
    progress: 2, target: 5, status: "example",
  },
  {
    id: "routine", title: "روتين العناية", description: "تصور لتحدٍ يربط تجربة العناية وتكرار الزيارة.",
    progress: 1, target: 3, status: "example",
  },
  {
    id: "sharing", title: "شارك تجربتك", description: "تفاعل اختياري دون شراء تقييمات أو اشتراط تقييم إيجابي.",
    progress: 0, target: 1, status: "planned",
  },
] as const;

export const CLUB_GROWTH_MODULES = [
  { id: "loyalty-core", title: "عضوية ومستويات", dataOwner: "Casher", releasePhase: "secure-core" },
  { id: "wallet", title: "Coins والرصيد الترويجي والقسائم", dataOwner: "Casher", releasePhase: "secure-core" },
  { id: "rewards", title: "المكافآت والصندوق", dataOwner: "Casher", releasePhase: "financial-gated" },
  { id: "memberships", title: "الطلاب والأطباء والشركات", dataOwner: "Casher", releasePhase: "growth" },
  { id: "challenges", title: "تحديات الزيارات والعناية", dataOwner: "Casher", releasePhase: "growth" },
  { id: "referrals", title: "الإحالات", dataOwner: "Casher", releasePhase: "growth" },
  { id: "experiences", title: "الهدايا داخل الفرع", dataOwner: "Casher", releasePhase: "experiential" },
] as const;
