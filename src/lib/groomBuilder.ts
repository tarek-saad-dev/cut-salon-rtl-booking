import type { LocalizedText } from "@/lib/i18n/types";

export type GroomService = {
  id: string;
  name: LocalizedText;
  match: string[];
  benefit: LocalizedText;
  result: LocalizedText;
  duration: number;
  category: "hair" | "beard" | "skincare" | "details";
};

export type GroomPackage = {
  id: "essential" | "signature" | "complete";
  name: LocalizedText;
  idealFor: LocalizedText;
  primaryResult: LocalizedText;
  price: number;
  duration: number;
  saving: number;
  recommended?: boolean;
  services: GroomService[];
};

export type GroomAddon = GroomService & {
  standalonePrice: number;
  packagePrice: number;
  recommendation: LocalizedText;
  recommendedFor: GroomPackage["id"][];
  tags: LocalizedText[];
};

export type LocationVisit = {
  id: "near" | "city" | "extended";
  name: LocalizedText;
  price: number;
  duration: number;
};

const service = (id: string, name: LocalizedText, match: string[], benefit: LocalizedText, result: LocalizedText, duration: number, category: GroomService["category"]): GroomService => ({ id, name, match, benefit, result, duration, category });

const haircut = service("haircut", { ar: "قص وتصفيف", en: "Cut + Style" }, ["hair cut", "basic cut", "detailed cut", "haircut"], { ar: "قصة دقيقة تناسب ملامحك", en: "A precise cut tailored to you" }, { ar: "أساس نظيف للوك", en: "A clean foundation" }, 45, "hair");
const beard = service("beard", { ar: "تحديد الذقن", en: "Beard Shape" }, ["beard", "beard styling", "beard fade"], { ar: "حواف مرتبة وتوازن للملامح", en: "Defined lines and balance" }, { ar: "فينيش مصقول", en: "A polished finish" }, 25, "beard");
const facial = service("facial", { ar: "فاشيال عميق", en: "Deep Facial" }, ["deep skincare", "deep facial", "skin care"], { ar: "تنقية وترطيب قبل التصوير", en: "Clarifying hydration before photos" }, { ar: "بشرة أكثر صفاءً", en: "Clearer-looking skin" }, 40, "skincare");
const hairCare = service("hair-care", { ar: "عناية للشعر", en: "Hair Care" }, ["hair mask", "hair oil", "cream", "treatment"], { ar: "تغذية ولمعة طبيعية", en: "Nourishment and natural shine" }, { ar: "شعر أسهل في التصفيف", en: "More manageable hair" }, 25, "hair");
const photoFinish = service("photo-finish", { ar: "فينيش للتصوير", en: "Photo-ready Finish" }, ["hair styling", "dry hair", "hot towel"], { ar: "تثبيت ولمسات نهائية هادئة", en: "Set styling and quiet final details" }, { ar: "جاهز للكاميرا", en: "Ready for camera" }, 20, "details");

export const groomPackages: GroomPackage[] = [
  { id: "essential", name: { ar: "Essential", en: "Essential" }, idealFor: { ar: "للعريس الذي يريد لوكًا مرتبًا وواثقًا بدون خطوات إضافية.", en: "For the groom wanting a confident, refined look without extra steps." }, primaryResult: { ar: "لوك نظيف ومتناسق", en: "A clean, balanced look" }, price: 1250, duration: 90, saving: 100, services: [haircut, beard, photoFinish] },
  { id: "signature", name: { ar: "Signature", en: "Signature" }, idealFor: { ar: "للعريس الذي يريد تجهيزًا متكاملًا في زيارة واحدة.", en: "For the groom who wants a complete preparation in one visit." }, primaryResult: { ar: "تجهيز كامل للتصوير", en: "A complete photo-ready preparation" }, price: 1650, duration: 150, saving: 250, recommended: true, services: [haircut, beard, facial, hairCare, photoFinish] },
  { id: "complete", name: { ar: "Complete", en: "Complete" }, idealFor: { ar: "لتجربة عناية أوسع قبل اليوم الكبير.", en: "For a broader care experience before the big day." }, primaryResult: { ar: "أقصى جاهزية وراحة", en: "Maximum readiness and ease" }, price: 2100, duration: 195, saving: 400, services: [haircut, beard, facial, hairCare, photoFinish, service("pedicure", { ar: "باديكير", en: "Pedicure" }, ["pedicure", "باديكير"], { ar: "لمسة عناية مكتملة", en: "A complete care detail" }, { ar: "مظهر مكتمل", en: "A complete look" }, 45, "details")] },
];

export const groomAddons: GroomAddon[] = [
  { ...service("color-detail", { ar: "تفاصيل لون", en: "Hair Detail Color" }, ["basic hair color", "color", "highlights"], { ar: "بعد ولون هادئ للوك", en: "Subtle depth and dimension" }, { ar: "تفاصيل أجمل في الصور", en: "More dimension in photos" }, 25, "hair"), standalonePrice: 200, packagePrice: 150, recommendation: { ar: "اختيار جيد لو عندك تصوير قريب", en: "A considered choice for close-up photography" }, recommendedFor: ["signature", "complete"], tags: [{ ar: "Best for Photos", en: "Best for Photos" }] },
  { ...service("relax", { ar: "جلسة استرخاء", en: "Relax Session" }, ["hot towel", "cold towel"], { ar: "هدوء بسيط قبل اليوم", en: "A quiet reset before the day" }, { ar: "إحساس أكثر راحة", en: "A more relaxed finish" }, 20, "details"), standalonePrice: 250, packagePrice: 200, recommendation: { ar: "لوقت هادئ قبل التجهيز", en: "For a quiet moment before preparation" }, recommendedFor: ["essential", "signature"], tags: [{ ar: "Cut Team Pick", en: "Cut Team Pick" }] },
  { ...service("extra-facial", { ar: "ماسك بشرة للتصوير", en: "Photo Skin Mask" }, ["face mask", "gold mask", "coffee mask"], { ar: "إنعاش سريع للبشرة", en: "A quick skin refresh" }, { ar: "مظهر أكثر حيوية", en: "More energized-looking skin" }, 20, "skincare"), standalonePrice: 300, packagePrice: 220, recommendation: { ar: "موصى به مع Signature", en: "Recommended with Signature" }, recommendedFor: ["signature"], tags: [{ ar: "موصى به مع Signature", en: "Recommended with Signature" }] },
];

export const locationVisits: LocationVisit[] = [
  { id: "near", name: { ar: "قريب من الصالون", en: "Near the salon" }, price: 1500, duration: 45 },
  { id: "city", name: { ar: "داخل المدينة", en: "Within the city" }, price: 1750, duration: 60 },
  { id: "extended", name: { ar: "منطقة ممتدة", en: "Extended zone" }, price: 2000, duration: 75 },
];

export type GroomSelection = { selectedPackageId: GroomPackage["id"] | null; selectedAddonIds: string[]; selectedLocationVisit: LocationVisit["id"] | null };
export type GroomTotals = { packageSubtotal: number; addonSubtotal: number; saving: number; totalPrice: number; totalDuration: number };

export function getGroomTotals(selection: GroomSelection): GroomTotals {
  const selectedPackage = groomPackages.find((item) => item.id === selection.selectedPackageId);
  const addons = groomAddons.filter((item) => selection.selectedAddonIds.includes(item.id));
  const visit = locationVisits.find((item) => item.id === selection.selectedLocationVisit);
  const addonSubtotal = addons.reduce((total, item) => total + item.packagePrice, 0);
  const saving = (selectedPackage?.saving ?? 0) + addons.reduce((total, item) => total + item.standalonePrice - item.packagePrice, 0);
  return { packageSubtotal: selectedPackage?.price ?? 0, addonSubtotal, saving, totalPrice: (selectedPackage?.price ?? 0) + addonSubtotal + (visit?.price ?? 0), totalDuration: (selectedPackage?.duration ?? 0) + addons.reduce((total, item) => total + item.duration, 0) + (visit?.duration ?? 0) };
}
