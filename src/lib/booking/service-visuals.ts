/**
 * Centralized service visual resolver for Phase 1E.
 * Priority: API image → visualKey mapping → category fallback → icon.
 */

import type { BookingService } from "@/lib/booking-api";
import { flexMatch, normalizeName } from "@/lib/bookingServiceGroups";

export type ServiceVisualKey =
  | "haircut"
  | "beard"
  | "haircutBeard"
  | "skincare"
  | "masks"
  | "groom"
  | "hairCare"
  | "comfort"
  | "neutral";

export interface ServiceVisual {
  key: ServiceVisualKey;
  /** Remote or local image URL when available. */
  image: string | null;
  focalPosition: string;
  /** Lucide-friendly icon hint for fallback UI. */
  iconHint: ServiceVisualKey;
  /** True when image came from API. */
  fromApi: boolean;
}

/** Optional local assets when API image is missing (may not exist on disk). */
export const serviceVisualConfig: Record<
  Exclude<ServiceVisualKey, "neutral">,
  { image: string | null; focalPosition: string }
> = {
  haircut: { image: "/images/services/haircut.webp", focalPosition: "center" },
  beard: { image: "/images/services/beard.webp", focalPosition: "center" },
  haircutBeard: { image: "/images/services/haircut-beard.webp", focalPosition: "center" },
  skincare: { image: "/images/services/skincare.webp", focalPosition: "center" },
  masks: { image: "/images/services/skincare.webp", focalPosition: "center" },
  groom: { image: "/images/services/groom.webp", focalPosition: "center" },
  hairCare: { image: "/images/services/haircut.webp", focalPosition: "center" },
  comfort: { image: null, focalPosition: "center" },
};

const HAIRCUT_NAMES = [
  "Hair Cut",
  "Haircut",
  "Detailed Cut",
  "Detail Cut",
  "Advanced Cut",
  "Fade Cut",
  "Basic Cut",
];
const BEARD_NAMES = ["Beard Styling & Fade", "Beard Styling", "Beard", "Zero Beard Shave"];
const COMBO_NAMES = ["Haircut & Beard", "Hair & Beard", "Hair cut & Beard", "Hair and Beard"];
const SKIN_NAMES = ["Basic Skin Care", "Deep SkinCare", "Medical Skin Care"];
const MASK_NAMES = ["Face Mask", "Gold Mask", "Coffee Mask", "peel-off Mask", "Hair Mask"];

function resolveVisualKey(service: BookingService): ServiceVisualKey {
  if (service.visualKey) {
    const k = service.visualKey as ServiceVisualKey;
    if (k in serviceVisualConfig || k === "neutral") return k;
  }
  const names = [service.nameEn, service.name, service.nameAr].filter(Boolean) as string[];
  for (const n of names) {
    if (flexMatch(n, COMBO_NAMES)) return "haircutBeard";
    if (flexMatch(n, HAIRCUT_NAMES)) return "haircut";
    if (flexMatch(n, BEARD_NAMES)) return "beard";
    if (flexMatch(n, SKIN_NAMES)) return "skincare";
    if (flexMatch(n, MASK_NAMES)) return "masks";
  }
  const cat = normalizeName(
    `${service.categoryNameEn ?? ""} ${service.categoryName ?? ""} ${service.categoryNameAr ?? ""}`,
  );
  if (cat.includes("beard") || cat.includes("دقن")) return "beard";
  if (cat.includes("skin") || cat.includes("بشرة") || cat.includes("care") || cat.includes("عناية")) {
    return "skincare";
  }
  if (cat.includes("mask") || cat.includes("ماسك")) return "masks";
  if (cat.includes("hair") || cat.includes("شعر") || cat.includes("حلاق")) return "hairCare";
  if (cat.includes("package") || cat.includes("باكدج") || cat.includes("groom")) return "groom";
  return "neutral";
}

function isValidHttpUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  return t.startsWith("https://") || t.startsWith("http://") || t.startsWith("/");
}

export function getServiceVisual(input: {
  serviceId?: number;
  name?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  service?: BookingService;
}): ServiceVisual {
  const service =
    input.service ??
    ({
      id: input.serviceId ?? 0,
      name: input.name ?? "",
      nameAr: null,
      nameEn: input.name ?? null,
      price: 0,
      durationMinutes: 0,
      categoryName: input.category ?? null,
      isBookableOnline: true,
      imageUrl: input.imageUrl,
    } satisfies BookingService);

  const apiImage =
    (isValidHttpUrl(service.imageUrl) && service.imageUrl) ||
    (isValidHttpUrl(service.photoUrl) && service.photoUrl) ||
    (isValidHttpUrl(input.imageUrl) && input.imageUrl) ||
    null;

  const key = resolveVisualKey(service);
  if (apiImage) {
    return {
      key,
      image: apiImage,
      focalPosition: "center",
      iconHint: key,
      fromApi: true,
    };
  }

  if (key !== "neutral") {
    const cfg = serviceVisualConfig[key];
    return {
      key,
      image: cfg.image,
      focalPosition: cfg.focalPosition,
      iconHint: key,
      fromApi: false,
    };
  }

  return {
    key: "neutral",
    image: null,
    focalPosition: "center",
    iconHint: "neutral",
    fromApi: false,
  };
}
