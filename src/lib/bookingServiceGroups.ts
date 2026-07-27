import type { BookingService } from "@/lib/booking-api";

/** Normalize a service name for flexible comparison */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .replace(/[&+]/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if a service name flexibly matches any name in a list */
export function flexMatch(serviceName: string, targetNames: string[]): boolean {
  const norm = normalizeName(serviceName);
  return targetNames.some(t => {
    const nt = normalizeName(t);
    return norm === nt || norm.includes(nt) || nt.includes(norm);
  });
}

export function isServiceVisible(s: BookingService): boolean {
  const name = s.name?.trim();
  const price = s.price;
  return Boolean(name) && Number(price) > 0;
}

export const PRIMARY_SLOTS: { names: string[] }[] = [
  { names: ["Hair Cut", "Haircut", "Detailed Cut", "Detail Cut", "DetailedCut"] },
  { names: ["Beard Styling & Fade", "Beard Styling", "Beard"] },
  { names: ["Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair cut + Beard", "Hair and Beard"] },
];

export const SECONDARY_NAMES = ["Advanced Cut", "Fade Cut", "Basic Cut"];

export const ALL_CORE_NAME_VARIATIONS = PRIMARY_SLOTS.flatMap(s => s.names).concat(SECONDARY_NAMES);

export type OtherServiceCatKey = "skincare" | "masks" | "hair" | "beard_face" | "comfort" | "other";

export interface OtherServiceCategory {
  key: OtherServiceCatKey;
  label: string;
  serviceNames: string[];
}

export const OTHER_SERVICE_CATEGORIES: OtherServiceCategory[] = [
  {
    key: "skincare",
    label: "عناية البشرة",
    serviceNames: ["Basic Skin Care", "Deep SkinCare", "Medical Skin Care"],
  },
  {
    key: "masks",
    label: "ماسكات",
    serviceNames: ["Face Mask", "Gold Mask", "Coffee Mask", "peel-off Mask", "Hair Mask"],
  },
  {
    key: "hair",
    label: "شعر",
    serviceNames: [
      "Basic Hair Color", "Dry-Hair", "Hair & Beard Color", "Hair Botox", "Hair Design",
      "Hair Oil Treatment", "Hair Straightening", "Hair Styling", "Long Hair Protein",
      "Short Hair Protein", "Silver Highlights", "Smoothing Cream", "Toppik Hair Spray",
      "Wavy Styling", "بلوب كيرلي", "معالج الشعر", "بلسم", "ثيرم", "حمام كريم", "شامبو",
    ],
  },
  {
    key: "beard_face",
    label: "دقن ووجه",
    serviceNames: [
      "Zero Beard Shave", "Beard Bleaching", "Face Threading", "Threading",
      "Full Wax", "Partial Wax",
    ],
  },
  {
    key: "comfort",
    label: "راحة ولمسة نهائية",
    serviceNames: [
      "Hot / Cold Towel", "Hot Towel", "Cold Towel",
      "باديكير قدم", "باديكير يد", "برفيوم SF",
    ],
  },
];

const HAIRCUT_NAMES = ["Hair Cut", "Haircut", "Detailed Cut", "Detail Cut", "Advanced Cut", "Fade Cut", "Basic Cut"];
const BEARD_CORE_NAMES = ["Beard Styling & Fade", "Beard Styling", "Beard"];
const COMBO_NAMES = ["Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair and Beard"];
const SKINCARE_NAMES = ["Basic Skin Care", "Deep SkinCare", "Medical Skin Care"];
const MASK_NAMES = ["Face Mask", "Gold Mask", "Coffee Mask", "peel-off Mask", "Hair Mask"];
const HAIR_EXTRA_NAMES = [
  "Hair Styling", "Hair Oil Treatment", "Hair Design", "Toppik Hair Spray", "Hair Mask",
  "Hair Botox", "Dry-Hair", "Wavy Styling", "حمام كريم", "بلسم", "شامبو",
];
const POPULAR_ADDON_NAMES = [
  "Face Mask", "Hot / Cold Towel", "Hot Towel", "Hair Oil Treatment", "Deep SkinCare",
  "Beard Styling & Fade", "Hair Styling", "Gold Mask", "Coffee Mask",
];

export function isCoreService(service: BookingService): boolean {
  return flexMatch(service.name, ALL_CORE_NAME_VARIATIONS);
}

export function getCoreServiceIdSet(services: BookingService[]): Set<number> {
  const ids = new Set<number>();
  services.forEach(s => {
    if (isServiceVisible(s) && isCoreService(s)) ids.add(s.id);
  });
  return ids;
}

export function findServiceByNames(services: BookingService[], names: string[]): BookingService | null {
  for (const n of names) {
    const s = services.find(sv => sv.name.trim() === n && isServiceVisible(sv));
    if (s) return s;
  }
  for (const n of names) {
    const s = services.find(sv => flexMatch(sv.name, [n]) && isServiceVisible(sv));
    if (s) return s;
  }
  return null;
}

export function resolveCoreServices(services: BookingService[]): {
  primary: BookingService[];
  secondary: BookingService[];
} {
  const primary: BookingService[] = [];
  for (const slot of PRIMARY_SLOTS) {
    const s = findServiceByNames(services, slot.names);
    if (s) primary.push(s);
  }
  const secondary = SECONDARY_NAMES
    .map(n => findServiceByNames(services, [n]))
    .filter((s): s is BookingService => s != null);
  return { primary, secondary };
}

export function getOtherServices(services: BookingService[]): BookingService[] {
  const coreIds = getCoreServiceIdSet(services);
  return services.filter(s => isServiceVisible(s) && !coreIds.has(s.id));
}

function guessOtherCategoryKey(name: string): OtherServiceCatKey {
  const lower = name.toLowerCase();
  if (lower.includes("mask") || lower.includes("ماسك")) return "masks";
  if (lower.includes("skin") || lower.includes("بشرة") || lower.includes("skincare")) return "skincare";
  if (lower.includes("beard") || lower.includes("دقن") || lower.includes("wax") || lower.includes("thread") || lower.includes("فتلة")) {
    return "beard_face";
  }
  if (lower.includes("towel") || lower.includes("فوطة") || lower.includes("باديكير") || lower.includes("برفيوم")) {
    return "comfort";
  }
  if (
    lower.includes("hair") || lower.includes("شعر") || lower.includes("color") ||
    lower.includes("protein") || lower.includes("styling") || lower.includes("بلسم") ||
    lower.includes("شامبو") || lower.includes("كيرلي")
  ) {
    return "hair";
  }
  return "other";
}

export function groupOtherServices(services: BookingService[]): Record<OtherServiceCatKey, BookingService[]> {
  const other = getOtherServices(services);
  const map: Record<OtherServiceCatKey, BookingService[]> = {
    skincare: [], masks: [], hair: [], beard_face: [], comfort: [], other: [],
  };
  const placed = new Set<number>();

  for (const cat of OTHER_SERVICE_CATEGORIES) {
    for (const s of other) {
      if (placed.has(s.id)) continue;
      if (flexMatch(s.name, cat.serviceNames)) {
        map[cat.key].push(s);
        placed.add(s.id);
      }
    }
  }

  for (const s of other) {
    if (placed.has(s.id)) continue;
    map[guessOtherCategoryKey(s.name)].push(s);
  }

  return map;
}

function categoryKeyForService(name: string): OtherServiceCatKey {
  for (const cat of OTHER_SERVICE_CATEGORIES) {
    if (flexMatch(name, cat.serviceNames)) return cat.key;
  }
  return guessOtherCategoryKey(name);
}

function recommendationScore(service: BookingService, selected: BookingService[]): number {
  let score = 0;
  const hasHaircut = selected.some(s => flexMatch(s.name, HAIRCUT_NAMES));
  const hasBeard = selected.some(s => flexMatch(s.name, BEARD_CORE_NAMES));
  const hasCombo = selected.some(s => flexMatch(s.name, COMBO_NAMES));
  const hasSkincare = selected.some(s => flexMatch(s.name, SKINCARE_NAMES));
  const hasMask = selected.some(s => flexMatch(s.name, MASK_NAMES));
  const onlyNonCore = selected.length > 0 && selected.every(s => !isCoreService(s));

  if (hasHaircut || hasCombo) {
    if (flexMatch(service.name, BEARD_CORE_NAMES)) score += 12;
    if (flexMatch(service.name, HAIR_EXTRA_NAMES)) score += 10;
    if (flexMatch(service.name, SKINCARE_NAMES)) score += 8;
    if (flexMatch(service.name, MASK_NAMES)) score += 7;
    if (flexMatch(service.name, OTHER_SERVICE_CATEGORIES.find(c => c.key === "comfort")!.serviceNames)) score += 5;
  }

  if (hasBeard && !hasHaircut && !hasCombo) {
    if (flexMatch(service.name, SKINCARE_NAMES)) score += 12;
    if (flexMatch(service.name, MASK_NAMES)) score += 11;
    if (flexMatch(service.name, OTHER_SERVICE_CATEGORIES.find(c => c.key === "beard_face")!.serviceNames)) score += 6;
  }

  if (onlyNonCore) {
    const selectedCats = new Set(selected.map(s => categoryKeyForService(s.name)));
    const serviceCat = categoryKeyForService(service.name);
    if (selectedCats.has(serviceCat)) score += 8;
    if (hasSkincare && serviceCat === "masks") score += 10;
    if (hasMask && serviceCat === "skincare") score += 10;
    if (serviceCat === "comfort") score += 4;
  }

  if (flexMatch(service.name, POPULAR_ADDON_NAMES)) score += 3;

  return score;
}

/** Recommended add-ons: non-core services not already selected, ranked by relevance */
export function getRecommendedAddons(
  services: BookingService[],
  selectedIds: number[],
): BookingService[] {
  const selectedSet = new Set(selectedIds);
  const selected = services.filter(s => selectedSet.has(s.id));
  const pool = getOtherServices(services).filter(s => !selectedSet.has(s.id));

  if (pool.length === 0) return [];

  const scored = pool.map(s => ({ service: s, score: recommendationScore(s, selected) }));
  const maxScore = Math.max(...scored.map(x => x.score));

  const ranked = scored
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name))
    .map(x => x.service);

  if (maxScore === 0) {
    const popular = ranked.filter(s => flexMatch(s.name, POPULAR_ADDON_NAMES));
    return popular.length > 0 ? popular : ranked.slice(0, 8);
  }

  const recommended = scored.filter(x => x.score > 0).map(x => x.service);
  return recommended.length > 0 ? recommended : ranked.slice(0, 8);
}

export function groupRecommendedAddons(
  recommended: BookingService[],
): Record<OtherServiceCatKey, BookingService[]> {
  const map: Record<OtherServiceCatKey, BookingService[]> = {
    skincare: [], masks: [], hair: [], beard_face: [], comfort: [], other: [],
  };
  const recIds = new Set(recommended.map(s => s.id));

  for (const cat of OTHER_SERVICE_CATEGORIES) {
    for (const s of recommended) {
      if (flexMatch(s.name, cat.serviceNames)) map[cat.key].push(s);
    }
  }

  for (const s of recommended) {
    const alreadyPlaced = Object.values(map).some(list => list.some(x => x.id === s.id));
    if (!alreadyPlaced) map[guessOtherCategoryKey(s.name)].push(s);
  }

  // Preserve only services in recommended set (guard against double placement)
  for (const key of Object.keys(map) as OtherServiceCatKey[]) {
    map[key] = map[key].filter(s => recIds.has(s.id));
  }

  return map;
}
