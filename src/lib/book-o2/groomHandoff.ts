/**
 * Groom package handoff from /prices#groom → /book.
 * packageId is authoritative for package membership + price.
 */

import type { ApiPackage, GroomOptionalExtra } from "@/lib/packagesApi";
import {
  getPackageCoreIncludes,
  getSelectableOptionalExtras,
} from "@/lib/packagesApi";

const STORAGE_KEY = "cut-groom-book-handoff";

export type GroomBookHandoff = {
  packageId: number;
  addonProIds: number[];
  /** Core + addon ProIDs for plan/create (may include IDs absent from All Services). */
  serviceIds: number[];
  note?: string | null;
};

export type GroomCartAddon = {
  proId: number;
  nameAr: string | null;
  nameEn: string | null;
  price: number;
  durationMinutes: number | null;
  mutuallyExclusiveGroup: string | null;
};

export type GroomCartModel = {
  packageId: number;
  nameAr: string | null;
  nameEn: string | null;
  packagePrice: number;
  packageDurationMinutes: number | null;
  included: Array<{
    proId: number;
    nameAr: string | null;
    nameEn: string | null;
  }>;
  addons: GroomCartAddon[];
  /** packagePrice + addon prices (Cashier package contract — not ala-carte sum). */
  totalPrice: number;
  /**
   * Package duration + addon durations that Cashier actually provides.
   * Null addon durations contribute 0 — never invented.
   */
  totalDurationMinutes: number;
  serviceIds: number[];
  unresolvedAddonProIds: number[];
};

export function saveGroomBookHandoff(handoff: GroomBookHandoff): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
  } catch {
    /* ignore */
  }
}

export function readGroomBookHandoff(): GroomBookHandoff | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GroomBookHandoff;
    const packageId = Number(parsed?.packageId);
    if (!Number.isFinite(packageId) || packageId <= 0) return null;
    const addonProIds = Array.isArray(parsed.addonProIds)
      ? [...new Set(parsed.addonProIds.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
      : [];
    const serviceIds = Array.isArray(parsed.serviceIds)
      ? [...new Set(parsed.serviceIds.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
      : [];
    return {
      packageId,
      addonProIds,
      serviceIds,
      note: typeof parsed.note === "string" ? parsed.note : null,
    };
  } catch {
    return null;
  }
}

export function clearGroomBookHandoff(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function parseIdListParam(raw: string | null): number[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];
}

export function resolveGroomAddon(
  pack: ApiPackage,
  proId: number,
): GroomOptionalExtra | GroomCartAddon | null {
  const fromExtras = pack.groom?.optionalExtras?.find((item) => item.proId === proId);
  if (fromExtras) return fromExtras;

  const selectable = getSelectableOptionalExtras(pack).find((item) => item.proId === proId);
  if (selectable) return selectable;

  const include = pack.includes.find((item) => item.serviceId === proId);
  if (include && include.listPrice != null) {
    return {
      proId,
      nameAr: include.nameAr,
      nameEn: include.nameEn ?? include.name,
      price: include.listPrice,
      durationMinutes: include.durationMinutes,
      mutuallyExclusiveGroup: null,
    };
  }
  return null;
}

/** Build cart from Cashier package contract — package price is authoritative. */
export function buildGroomCartModel(
  pack: ApiPackage,
  addonProIds: number[],
): GroomCartModel {
  const core = getPackageCoreIncludes(pack);
  const included = core.map((item) => ({
    proId: item.serviceId,
    nameAr: item.nameAr,
    nameEn: item.nameEn ?? item.name,
  }));

  const addons: GroomCartAddon[] = [];
  const unresolvedAddonProIds: number[] = [];
  const seenExclusive = new Set<string>();

  for (const proId of addonProIds) {
    const resolved = resolveGroomAddon(pack, proId);
    if (!resolved) {
      unresolvedAddonProIds.push(proId);
      continue;
    }
    const exclusive =
      "mutuallyExclusiveGroup" in resolved ? resolved.mutuallyExclusiveGroup : null;
    if (exclusive) {
      if (seenExclusive.has(exclusive)) continue;
      seenExclusive.add(exclusive);
    }
    // Never treat already-included package lines as paid add-ons
    if ("alreadyIncluded" in resolved && resolved.alreadyIncluded) continue;
    if (core.some((item) => item.serviceId === proId)) continue;

    addons.push({
      proId: resolved.proId,
      nameAr: resolved.nameAr,
      nameEn: resolved.nameEn,
      price: resolved.price,
      durationMinutes: resolved.durationMinutes ?? null,
      mutuallyExclusiveGroup: exclusive,
    });
  }

  const addonSubtotal = addons.reduce((sum, item) => sum + item.price, 0);
  const addonDuration = addons.reduce(
    (sum, item) => sum + (item.durationMinutes ?? 0),
    0,
  );
  const packageDuration = pack.durationMinutes ?? 0;
  const serviceIds = [
    ...new Set([...core.map((item) => item.serviceId), ...addons.map((item) => item.proId)]),
  ];

  return {
    packageId: pack.packageId,
    nameAr: pack.nameAr,
    nameEn: pack.nameEn,
    packagePrice: pack.price,
    packageDurationMinutes: pack.durationMinutes,
    included,
    addons,
    totalPrice: pack.price + addonSubtotal,
    totalDurationMinutes: packageDuration + addonDuration,
    serviceIds,
    unresolvedAddonProIds,
  };
}

/** Overlay services for ID resolution — not for All Services browsing. */
export function groomCartToResolvableServices(
  cart: GroomCartModel,
): Array<{
  id: number;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  price: number;
  durationMinutes: number;
  categoryName: string | null;
  isBookableOnline: boolean;
  /** Hidden from generic All Services browser. */
  groomContextOnly: boolean;
}> {
  const rows: Array<{
    id: number;
    name: string;
    nameAr: string | null;
    nameEn: string | null;
    price: number;
    durationMinutes: number;
    categoryName: string | null;
    isBookableOnline: boolean;
    groomContextOnly: boolean;
  }> = [];

  for (const item of cart.included) {
    rows.push({
      id: item.proId,
      name: item.nameEn ?? item.nameAr ?? `Service ${item.proId}`,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      price: 0, // priced via package line — avoid double-counting in ala-carte sums
      durationMinutes: 0,
      categoryName: "Groom Package",
      isBookableOnline: true,
      groomContextOnly: true,
    });
  }

  for (const addon of cart.addons) {
    const home = addon.mutuallyExclusiveGroup === "home_visit";
    rows.push({
      id: addon.proId,
      name: addon.nameEn ?? addon.nameAr ?? `Service ${addon.proId}`,
      nameAr: addon.nameAr,
      nameEn: addon.nameEn,
      price: addon.price,
      durationMinutes: addon.durationMinutes ?? 0,
      categoryName: home ? "Home Visit" : "Groom Add-on",
      isBookableOnline: true,
      groomContextOnly: true,
    });
  }

  return rows;
}
