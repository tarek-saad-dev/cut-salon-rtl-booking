import { CAMP_CAESAR_OPENING_2026 } from "@/config/campaigns";
import { buildBookHref } from "@/lib/book-o2/buildBookHref";
import { landingCopy } from "@/lib/i18n/landing";

/** POS / Casher package code. Numeric packageId is resolved at runtime — never invent one. */
export const NOVEMBER_PACKAGE_CODE = "NOV-PRO600";

export const NOVEMBER_MEDIA_ROOT = "/media/november-protein";

/**
 * Optional numeric Casher package id from env once POS confirms it.
 * Empty / invalid → resolve via package list code/name match instead.
 */
export function readNovemberPackageIdFromEnv(
  raw: string | undefined = process.env.NEXT_PUBLIC_NOVEMBER_PACKAGE_ID,
): number | null {
  if (!raw?.trim()) return null;
  const id = Number(raw.trim());
  return Number.isFinite(id) && id > 0 ? id : null;
}

export const NOVEMBER_WHATSAPP_MESSAGE =
  "أهلاً، عايز أحجز عرض بروتين نوفمبر بـ600 جنيه في CUT Salon. ممكن أعرف المواعيد المتاحة؟";

export const NOVEMBER_WHATSAPP_NUMBER = "201012126899";

export const novemberProteinOffer = {
  id: "november-protein-2026",
  packageCode: NOVEMBER_PACKAGE_CODE,
  campaignName: "CUT PROTEIN RESET",
  campaignLabel: "NOVEMBER SPECIAL",
  headlineEn: "YOUR HAIR. RESET.",
  messageAr: "غيّر شكل شعرك، مش بس قصة شعرك.",
  servicesLineEn: "Haircut. Protein Treatment. Hot & Cold Towels. Care Mask.",
  price: 600,
  currency: "EGP",
  currencyAr: "جنيه",
  startsOn: "2026-11-01",
  endsOn: "2026-11-30",
  startsLabel: "1 نوفمبر",
  endsLabel: "30 نوفمبر",
  href: "/offers/november-protein",
  whatsappHref: `https://wa.me/${NOVEMBER_WHATSAPP_NUMBER}?text=${encodeURIComponent(NOVEMBER_WHATSAPP_MESSAGE)}`,
} as const;

/** End of the final campaign day in Africa/Cairo (UTC+3). */
export function novemberCampaignEndsAtMs(): number {
  return new Date(`${novemberProteinOffer.endsOn}T23:59:59+03:00`).getTime();
}

/** Start of the first campaign day in Africa/Cairo. */
export function novemberCampaignStartsAtMs(): number {
  return new Date(`${novemberProteinOffer.startsOn}T00:00:00+03:00`).getTime();
}

export function isNovemberCampaignActive(now = Date.now()): boolean {
  return now >= novemberCampaignStartsAtMs() && now <= novemberCampaignEndsAtMs();
}

export function buildNovemberBookHref(packageId: number, branch?: "GLEEM" | "CAMP_CAESAR"): string {
  return buildBookHref({
    mode: "barber",
    packageId,
    branch: branch ?? null,
  });
}

export interface NovemberExperienceStep {
  id: "haircut" | "protein" | "towels" | "care-mask";
  number: string;
  nameEn: string;
  descriptionAr: string;
}

export const NOVEMBER_EXPERIENCE_STEPS: readonly NovemberExperienceStep[] = [
  {
    id: "haircut",
    number: "01",
    nameEn: "HAIRCUT",
    descriptionAr: "قصة احترافية على حسب شكل وشك وطبيعة شعرك.",
  },
  {
    id: "protein",
    number: "02",
    nameEn: "PROTEIN TREATMENT",
    descriptionAr: "جلسة بروتين بعد تقييم احترافي لشعرك.",
  },
  {
    id: "towels",
    number: "03",
    nameEn: "HOT & COLD TOWELS",
    descriptionAr: "طقوس فوط ساخنة وباردة لراحة وتنشيط.",
  },
  {
    id: "care-mask",
    number: "04",
    nameEn: "CARE MASK",
    descriptionAr: "ماسك عناية ضمن التجربة — يحدده الفريق حسب التقييم.",
  },
] as const;

export const NOVEMBER_OFFER_TERMS: readonly string[] = [
  "السعر المعلن ينطبق على الشعر القصير المؤهل بعد التقييم.",
  "التقييم الاحترافي مطلوب قبل بدء العلاج.",
  "للشعر الأطول أو الأكثف يتم تقديم عرض سعر منفصل معتمد قبل الخدمة.",
  "العرض باكدج ثابت السعر ولا يُجمَع مع خصومات الزيارة الأولى.",
] as const;

/**
 * Explainer / transform media. Flip `available` after uploading approved assets
 * under public/media/november-protein — never invent client results.
 */
export const NOVEMBER_TRANSFORM_MEDIA = {
  video: {
    src: `${NOVEMBER_MEDIA_ROOT}/transform.mp4`,
    poster: `${NOVEMBER_MEDIA_ROOT}/transform-poster.webp`,
    available: false,
  },
  gallery: {
    available: false,
    items: [] as readonly { src: string; alt: string }[],
  },
} as const;

const footer = landingCopy.footer;

export interface NovemberBranch {
  code: "GLEEM" | "CAMP_CAESAR";
  name: string;
  tag: string;
  address: string;
  mapUrl: string;
}

export const NOVEMBER_BRANCHES: readonly NovemberBranch[] = [
  {
    code: "GLEEM",
    name: footer.branchName.ar,
    tag: "الفرع الرئيسي",
    address: footer.branchAddress.ar,
    mapUrl: "https://share.google/F4o7oOQVs3EJSgxaw",
  },
  {
    code: "CAMP_CAESAR",
    name: footer.campBranchName.ar,
    tag: "الفرع الجديد",
    address: footer.campBranchAddress.ar,
    mapUrl: CAMP_CAESAR_OPENING_2026.locationUrl,
  },
];

/** Runtime cache when the package is resolved by code/name (not only env). */
let rememberedNovemberPackageId: number | null = null;

export function rememberNovemberPackageId(packageId: number | null | undefined): void {
  if (packageId != null && Number.isFinite(packageId) && packageId > 0) {
    rememberedNovemberPackageId = packageId;
  }
}

/** True when this packageId is the November promo (env id and/or remembered resolver id). */
export function isNovemberPromoPackageId(packageId: number | null | undefined): boolean {
  if (packageId == null || !Number.isFinite(packageId) || packageId <= 0) return false;
  const envId = readNovemberPackageIdFromEnv();
  if (envId != null && packageId === envId) return true;
  return rememberedNovemberPackageId != null && packageId === rememberedNovemberPackageId;
}

/** Test helper — clears the remembered id between cases. */
export function clearRememberedNovemberPackageId(): void {
  rememberedNovemberPackageId = null;
}
