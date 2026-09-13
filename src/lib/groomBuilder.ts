import type { Language } from "@/lib/i18n/types";
import {
  getPackageCoreIncludes,
  getSelectableOptionalExtras,
  type ApiPackage,
  type GroomOptionalExtra,
} from "@/lib/packagesApi";

export type GroomSelection = {
  selectedPackageId: number | null;
  /** All selected optional ProIDs (addons + at most one per mutuallyExclusiveGroup). */
  selectedOptionalProIds: number[];
};

export type GroomTotals = {
  packageSubtotal: number;
  optionalSubtotal: number;
  totalPrice: number;
  totalDuration: number;
};

export function optionalItemName(item: GroomOptionalExtra, language: Language): string {
  if (language === "ar") return item.nameAr ?? item.nameEn ?? "";
  return item.nameEn ?? item.nameAr ?? "";
}

export function optionalItemDescription(
  item: GroomOptionalExtra,
  language: Language,
): string | null {
  if (language === "ar") return item.descriptionAr ?? item.descriptionEn;
  return item.descriptionEn ?? item.descriptionAr;
}

export function resolveSelectedOptionals(
  pack: ApiPackage | null | undefined,
  selectedOptionalProIds: number[],
): GroomOptionalExtra[] {
  if (!pack) return [];
  const selectable = getSelectableOptionalExtras(pack);
  const byId = new Map(selectable.map((item) => [item.proId, item]));
  const resolved: GroomOptionalExtra[] = [];
  const seen = new Set<number>();
  for (const id of selectedOptionalProIds) {
    if (seen.has(id)) continue;
    const item = byId.get(id);
    if (!item) continue;
    seen.add(id);
    resolved.push(item);
  }
  return resolved;
}

/**
 * Enforce Cashier mutuallyExclusiveGroup: selecting an item replaces any other
 * selection in the same exclusive group. Multi-select remains for ungrouped add-ons.
 */
export function toggleOptionalSelection(
  selectedOptionalProIds: number[],
  item: GroomOptionalExtra,
  pack: ApiPackage,
): number[] {
  if (selectedOptionalProIds.includes(item.proId)) {
    return selectedOptionalProIds.filter((id) => id !== item.proId);
  }

  const selectable = getSelectableOptionalExtras(pack);
  let next = [...selectedOptionalProIds, item.proId];

  if (item.mutuallyExclusiveGroup) {
    const rivals = new Set(
      selectable
        .filter(
          (extra) =>
            extra.mutuallyExclusiveGroup === item.mutuallyExclusiveGroup &&
            extra.proId !== item.proId,
        )
        .map((extra) => extra.proId),
    );
    next = next.filter((id) => !rivals.has(id));
  }

  // Deduplicate
  return [...new Set(next)];
}

/** After package switch: drop already-included / unavailable; keep ≤1 per exclusive group. */
export function reconcileOptionalSelection(
  selectedOptionalProIds: number[],
  pack: ApiPackage | null | undefined,
): number[] {
  if (!pack) return [];
  const selectable = getSelectableOptionalExtras(pack);
  const byId = new Map(selectable.map((item) => [item.proId, item]));
  const kept: number[] = [];
  const usedExclusiveGroups = new Set<string>();

  for (const id of selectedOptionalProIds) {
    const item = byId.get(id);
    if (!item) continue;
    if (item.alreadyIncluded || !item.availableAsOptional) continue;
    if (item.mutuallyExclusiveGroup) {
      if (usedExclusiveGroups.has(item.mutuallyExclusiveGroup)) continue;
      usedExclusiveGroups.add(item.mutuallyExclusiveGroup);
    }
    kept.push(id);
  }

  return kept;
}

export function getGroomTotals(input: {
  pack: ApiPackage | null | undefined;
  selectedOptionals: GroomOptionalExtra[];
}): GroomTotals {
  const packageSubtotal = input.pack?.price ?? 0;
  const optionalSubtotal = input.selectedOptionals.reduce((sum, item) => sum + item.price, 0);
  const totalDuration =
    (input.pack?.durationMinutes ?? 0) +
    input.selectedOptionals.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0);

  return {
    packageSubtotal,
    optionalSubtotal,
    totalPrice: packageSubtotal + optionalSubtotal,
    totalDuration,
  };
}

export type GroomBookingPayload = {
  packageId: number;
  addonProIds: number[];
  serviceIds: number[];
  note: string;
};

export function buildGroomBookingPayload(input: {
  pack: ApiPackage;
  selectedOptionals: GroomOptionalExtra[];
  totals: GroomTotals;
}): GroomBookingPayload {
  const addonProIds = [...new Set(input.selectedOptionals.map((item) => item.proId))];
  const coreIds = getPackageCoreIncludes(input.pack).map((item) => item.serviceId);
  const serviceIds = [...new Set([...coreIds, ...addonProIds])];

  return {
    packageId: input.pack.packageId,
    addonProIds,
    serviceIds,
    note: JSON.stringify({
      source: "groom-experience",
      packageId: input.pack.packageId,
      package: {
        id: input.pack.packageId,
        label: { ar: input.pack.nameAr, en: input.pack.nameEn },
      },
      addonProIds,
      addons: input.selectedOptionals.map((item) => ({
        proId: item.proId,
        label: { ar: item.nameAr, en: item.nameEn },
        mutuallyExclusiveGroup: item.mutuallyExclusiveGroup,
      })),
      totals: {
        totalPrice: input.totals.totalPrice,
        totalDuration: input.totals.totalDuration,
      },
    }),
  };
}
