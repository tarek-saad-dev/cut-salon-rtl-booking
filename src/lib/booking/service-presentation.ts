/**
 * Localized presentation copy for booking services (Phase 1E).
 * Does not mutate API payloads — presentation overlay only.
 */

import type { BookingService } from "@/lib/booking-api";
import { serviceNameAr, serviceNameEn } from "@/lib/booking-api";
import { flexMatch, normalizeName, isCoreService } from "@/lib/bookingServiceGroups";

export type BookingLang = "ar" | "en";

export type ServiceBadgeKey =
  | "mostRequested"
  | "featuredPackage"
  | "bestValue"
  | "quickService"
  | "recommended"
  | "commonlyAdded";

export interface ServicePresentation {
  displayName: string;
  description: string;
  badgeKey: ServiceBadgeKey | null;
  isPackage: boolean;
  isFeaturedCandidate: boolean;
}

type CopyPair = { ar: string; en: string };

const BENEFIT_COPY: Array<{ names: string[]; copy: CopyPair; badge?: ServiceBadgeKey; featured?: boolean; isPackage?: boolean }> = [
  {
    names: ["Hair Cut", "Haircut", "Detailed Cut", "Detail Cut"],
    copy: {
      ar: "قص وتدريج نظيف يناسب شكل وجهك وستايلك.",
      en: "A clean cut and fade tailored to your face and style.",
    },
    badge: "mostRequested",
    featured: true,
  },
  {
    names: ["Beard Styling & Fade", "Beard Styling", "Beard"],
    copy: {
      ar: "تهذيب وتحديد احترافي للدقن.",
      en: "Professional beard shaping and definition.",
    },
    featured: true,
  },
  {
    names: ["Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair and Beard"],
    copy: {
      ar: "إطلالة متكاملة في زيارة واحدة.",
      en: "A complete polished look in one visit.",
    },
    badge: "featuredPackage",
    featured: true,
    isPackage: true,
  },
  {
    names: ["Advanced Cut"],
    copy: {
      ar: "قصة مفصّلة للشعر الذي يحتاج وقتًا ودقة أكثر.",
      en: "A detailed cut when your style needs more time and precision.",
    },
  },
  {
    names: ["Fade Cut"],
    copy: {
      ar: "تدريج نظيف للجوانب بلمسة حديثة.",
      en: "A clean side fade with a modern finish.",
    },
  },
  {
    names: ["Basic Cut"],
    copy: {
      ar: "قصة سريعة وبسيطة بمظهر مرتب.",
      en: "A quick, simple cut with a tidy finish.",
    },
    badge: "quickService",
  },
  {
    names: ["Basic Skin Care"],
    copy: {
      ar: "تنظيف خفيف ينعش بشرتك بسرعة.",
      en: "A light cleanse that freshens your skin quickly.",
    },
  },
  {
    names: ["Deep SkinCare"],
    copy: {
      ar: "عناية أعمق لنتيجة أوضح وأنظف.",
      en: "Deeper care for a clearer, cleaner finish.",
    },
    badge: "recommended",
  },
  {
    names: ["Face Mask"],
    copy: {
      ar: "ماسك سريع يمنح البشرة انتعاشًا.",
      en: "A quick mask that refreshes your skin.",
    },
    badge: "commonlyAdded",
  },
  {
    names: ["Hot / Cold Towel", "Hot Towel", "Cold Towel"],
    copy: {
      ar: "لمسة راحة تكمل تجربتك.",
      en: "A comfort finish that completes your visit.",
    },
    badge: "commonlyAdded",
  },
  {
    names: ["Hair Oil Treatment"],
    copy: {
      ar: "تغذية ولمعة للشعر بعد الحلاقة.",
      en: "Nourish and add shine after your cut.",
    },
    badge: "recommended",
  },
];

function matchCopy(service: BookingService) {
  const candidates = [service.nameEn, service.name, service.nameAr].filter(Boolean) as string[];
  for (const entry of BENEFIT_COPY) {
    for (const c of candidates) {
      if (flexMatch(c, entry.names)) return entry;
    }
  }
  return null;
}

function truncateOneTwoLines(text: string, max = 110): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function fallbackDescription(service: BookingService, lang: BookingLang): string {
  const duration = service.durationMinutes;
  const name = lang === "en" ? serviceNameEn(service) || service.name : serviceNameAr(service) || service.name;
  if (lang === "en") {
    if (duration > 0 && duration <= 20) {
      return `A quick ${name.toLowerCase()} in about ${duration} minutes.`;
    }
    return `Professional ${name.toLowerCase()} with a clean finish.`;
  }
  if (duration > 0 && duration <= 20) {
    return `${name} سريعة خلال حوالي ${duration} دقيقة.`;
  }
  return `${name} باحترافية ولمسة نهائية مرتبة.`;
}

export function getServiceDisplayName(service: BookingService, lang: BookingLang): string {
  if (lang === "en") {
    return (serviceNameEn(service) || service.name || serviceNameAr(service) || "").trim();
  }
  return (serviceNameAr(service) || service.name || serviceNameEn(service) || "").trim();
}

export function getServicePresentation(
  service: BookingService,
  lang: BookingLang,
): ServicePresentation {
  const matched = matchCopy(service);
  const apiShort =
    lang === "en"
      ? service.shortDescriptionEn || service.descriptionEn
      : service.shortDescriptionAr || service.descriptionAr;
  const verboseApi =
    lang === "en" ? service.descriptionEn : service.descriptionAr;
  // Prefer curated benefit copy; allow short API text; avoid dumping long catalog blurbs.
  let description = "";
  if (matched) {
    description = matched.copy[lang];
  } else if (apiShort && apiShort.trim().length > 0 && apiShort.trim().length <= 140) {
    description = truncateOneTwoLines(apiShort.trim());
  } else if (verboseApi && verboseApi.trim().length > 0 && verboseApi.trim().length <= 90) {
    description = truncateOneTwoLines(verboseApi.trim());
  } else {
    description = fallbackDescription(service, lang);
  }

  let badgeKey: ServiceBadgeKey | null = null;
  if (service.badgeKey === "mostRequested" || service.isMostRequested) badgeKey = "mostRequested";
  else if (service.badgeKey === "featuredPackage" || service.isPackage) badgeKey = "featuredPackage";
  else if (service.badgeKey === "bestValue") badgeKey = "bestValue";
  else if (service.badgeKey === "quickService") badgeKey = "quickService";
  else if (matched?.badge) badgeKey = matched.badge;

  const isPackage =
    service.isPackage === true ||
    matched?.isPackage === true ||
    flexMatch(service.name, ["Haircut & Beard", "Hair & Beard"]);

  const isFeaturedCandidate =
    service.isFeatured === true ||
    matched?.featured === true ||
    isCoreService(service);

  return {
    displayName: getServiceDisplayName(service, lang),
    description,
    badgeKey,
    isPackage,
    isFeaturedCandidate,
  };
}

/** Hair Cut + Hair & Beard slots for the top "Most Popular" row (real catalog entities only). */
const MOST_POPULAR_SLOT_NAMES: string[][] = [
  ["Hair Cut", "Haircut", "Detailed Cut", "Detail Cut", "DetailedCut"],
  [
    "Haircut & Beard",
    "Hair & Beard",
    "Hair cut & Beard",
    "Hair cut + Beard",
    "Hair and Beard",
    "شعر ودقن",
  ],
];

function findServiceByNames(
  services: BookingService[],
  names: string[],
  used: Set<number>,
): BookingService | null {
  for (const s of services) {
    if (used.has(s.id)) continue;
    const labels = [s.name, s.nameEn, s.nameAr].filter(Boolean) as string[];
    if (labels.some((label) => flexMatch(label, names))) return s;
  }
  return null;
}

/**
 * Resolves the two top "Most Popular" services from the live catalog.
 * Prefers backend `mostPopular` ordering when provided; otherwise matches by known core names.
 */
export function resolveMostPopularServices(
  services: BookingService[],
  backendMostPopular?: { services: BookingService[] } | null,
): BookingService[] {
  const byId = new Map(services.map((s) => [s.id, s]));

  if (backendMostPopular?.services?.length) {
    const fromApi = backendMostPopular.services
      .map((s) => byId.get(s.id))
      .filter((s): s is BookingService => s != null)
      .sort(
        (a, b) =>
          (a.popularityRank ?? 999) - (b.popularityRank ?? 999) || a.id - b.id,
      );
    if (fromApi.length > 0) return fromApi.slice(0, 2);
  }

  const used = new Set<number>();
  const out: BookingService[] = [];
  for (const names of MOST_POPULAR_SLOT_NAMES) {
    const match = findServiceByNames(services, names, used);
    if (match) {
      out.push(match);
      used.add(match.id);
    }
  }
  return out;
}

export function resolveFeaturedServices(services: BookingService[]): BookingService[] {
  const scored = services
    .map((s, index) => {
      const pres = getServicePresentation(s, "en");
      let score = 0;
      if (s.isFeatured) score += 100;
      if (s.isMostRequested) score += 40;
      if (pres.isFeaturedCandidate) score += 30;
      if (pres.isPackage) score += 20;
      if (s.displayPriority != null) score += Math.max(0, 50 - Number(s.displayPriority));
      // Prefer primary slot order via name match.
      if (flexMatch(s.name, ["Hair Cut", "Haircut"])) score += 15;
      if (flexMatch(s.name, ["Beard Styling & Fade", "Beard"])) score += 12;
      if (flexMatch(s.name, ["Haircut & Beard", "Hair & Beard"])) score += 14;
      return { s, score, index };
    })
    .filter((x) => x.score >= 30)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.s);

  // Deduplicate, max 6 featured
  const seen = new Set<number>();
  const out: BookingService[] = [];
  for (const s of scored) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
    if (out.length >= 6) break;
  }
  return out;
}

export type ServiceFilterId =
  | "popular"
  | "all"
  | "hair"
  | "beard"
  | "care"
  | "packages";

export function serviceMatchesFilter(
  service: BookingService,
  filter: ServiceFilterId,
  featuredIds: Set<number>,
): boolean {
  if (filter === "all") return true;
  if (filter === "popular") return featuredIds.has(service.id) || service.isMostRequested === true;
  if (filter === "packages") {
    return getServicePresentation(service, "en").isPackage;
  }
  const names = [service.nameEn, service.name, service.nameAr, service.categoryName, service.categoryNameEn, service.categoryNameAr]
    .filter(Boolean)
    .join(" ");
  const n = normalizeName(names);
  if (filter === "hair") {
    return (
      flexMatch(service.name, [
        "Hair Cut",
        "Haircut",
        "Advanced Cut",
        "Fade Cut",
        "Basic Cut",
        "Hair Styling",
        "Hair Mask",
        "Hair Oil Treatment",
        "Hair Design",
        "Hair Botox",
      ]) ||
      (n.includes("hair") && !n.includes("beard")) ||
      n.includes("شعر")
    );
  }
  if (filter === "beard") {
    return (
      flexMatch(service.name, ["Beard Styling & Fade", "Beard", "Zero Beard Shave", "Beard Bleaching"]) ||
      n.includes("beard") ||
      n.includes("دقن")
    );
  }
  if (filter === "care") {
    return (
      flexMatch(service.name, [
        "Basic Skin Care",
        "Deep SkinCare",
        "Medical Skin Care",
        "Face Mask",
        "Gold Mask",
        "Coffee Mask",
        "Hot / Cold Towel",
      ]) ||
      n.includes("skin") ||
      n.includes("mask") ||
      n.includes("عناية") ||
      n.includes("ماسك") ||
      n.includes("towel")
    );
  }
  return true;
}

export function availableServiceFilters(
  services: BookingService[],
  featured: BookingService[],
): ServiceFilterId[] {
  const featuredIds = new Set(featured.map((s) => s.id));
  const order: ServiceFilterId[] = ["popular", "all", "hair", "beard", "care", "packages"];
  return order.filter((id) => {
    if (id === "all") return services.length > 0;
    if (id === "popular") return featured.length >= 1;
    return services.some((s) => serviceMatchesFilter(s, id, featuredIds));
  });
}

export function defaultServiceFilter(
  featured: BookingService[],
  filters: ServiceFilterId[],
): ServiceFilterId {
  if (featured.length >= 3 && filters.includes("popular")) return "popular";
  if (filters.includes("all")) return "all";
  return filters[0] ?? "all";
}

/** Deterministic quick badges — never invent “most requested” without config/match. */
export function getQuickPickBadge(
  service: BookingService,
  catalog: BookingService[],
): ServiceBadgeKey | null {
  const pres = getServicePresentation(service, "en");
  if (service.isMostRequested || pres.badgeKey === "mostRequested") return "mostRequested";
  if (pres.badgeKey === "featuredPackage" || pres.isPackage) return "bestValue";
  const visible = catalog.filter((s) => s.durationMinutes > 0);
  if (visible.length === 0) return null;
  const shortest = Math.min(...visible.map((s) => s.durationMinutes));
  if (service.durationMinutes === shortest && service.durationMinutes <= 20) {
    return "quickService";
  }
  return pres.badgeKey;
}
